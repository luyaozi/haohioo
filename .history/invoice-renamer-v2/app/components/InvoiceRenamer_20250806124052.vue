<template>
  <div class="invoice-renamer">
    <!-- 文件上传区域 -->
    <FileUploadCard :file-list="fileList" @file-change="handleFileChange" />

    <!-- 发票信息表格 -->
    <InvoiceInfoTable
      v-if="invoiceData.length > 0"
      :invoice-data="invoiceData"
      :parsing="parsing"
      :expanded-rows="expandedRows"
      @parse-all-files="parseAllFiles"
      @expand-change="handleExpandChange"
      @preview-file="previewFile"
      @remove-file="removeFile"
    />

    <!-- 命名规则设置 -->
    <NamingRulesCard
      v-if="invoiceData.length > 0"
      :invoice-data="invoiceData"
      :naming-rules="namingRules"
      :invoice-fields="invoiceFields"
      @add-naming-rule="addNamingRule"
      @add-naming-rule-after="addNamingRuleAfter"
      @remove-naming-rule="removeNamingRule"
      @rule-type-change="onRuleTypeChange"
      @update-naming-rules="updateNamingRules"
    />

    <!-- 重命名结果 -->
    <RenameResultsCard
      v-if="renameResults.length > 0"
      :rename-results="renameResults"
      @download-all-files="downloadAllFiles"
      @download-single-file="downloadSingleFile"
    />

    <!-- 操作按钮 -->
    <div v-if="invoiceData.length > 0" class="action-buttons">
      <el-button
        type="primary"
        size="large"
        @click="performRename"
        :disabled="namingRules.length === 0"
        :loading="renaming"
      >
        <el-icon><MagicStick /></el-icon>
        一键重命名
      </el-button>

      <el-button size="large" @click="clearAll">
        <el-icon><Delete /></el-icon>
        清空所有
      </el-button>
    </div>

    <!-- PDF预览对话框 -->
    <PDFPreviewDialog
      v-model:visible="previewDialogVisible"
      :current-preview-file="currentPreviewFile"
      :preview-url="previewUrl"
      @close-preview="closePreview"
      @open-pdf-in-new-window="openPdfInNewWindow"
      @download-current-file="downloadCurrentFile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { MagicStick, Delete } from "@element-plus/icons-vue"
import { PDFToWordParser } from "~/utils/pdfToWordParser"

// 创建单例PDF解析器实例，避免重复初始化worker
let pdfParserInstance: PDFToWordParser | null = null
const getPdfParser = () => {
  if (!pdfParserInstance) {
    pdfParserInstance = new PDFToWordParser()
  }
  return pdfParserInstance
}

// 定义接口
interface InvoiceData {
  fileName: string
  invoiceNumber: string
  invoiceDate: string
  buyerName: string
  buyerTaxId: string
  sellerName: string
  sellerTaxId: string
  totalAmount: string
  totalAmountChinese: string
  taxAmount: string
  amountWithoutTax: string
  drawer: string
  payee: string
  reviewer: string
  itemName: string
  file: File
  parseMethod: string
  fullText: string
}

interface NamingRule {
  id: string
  type: "field" | "text" | "date"
  value: string
  format?: string
}

interface RenameResult {
  originalName: string
  newName: string
  file: File
  success: boolean
  error?: string
}

// 响应式数据
const fileList = ref<any[]>([])
const invoiceData = ref<InvoiceData[]>([])
const namingRules = ref<NamingRule[]>([])
const renameResults = ref<RenameResult[]>([])
const parsing = ref(false)
const renaming = ref(false)
const expandedRows = ref<string[]>([])

// 预览相关状态
const previewDialogVisible = ref(false)
const currentPreviewFile = ref<File | null>(null)
const previewUrl = ref("")

// 发票字段选项
const invoiceFields = [
  { key: "invoiceNumber", label: "发票号码" },
  { key: "invoiceDate", label: "开票日期" },
  { key: "buyerName", label: "购买方名称" },
  { key: "buyerTaxId", label: "购买方税号" },
  { key: "sellerName", label: "销售方名称" },
  { key: "sellerTaxId", label: "销售方税号" },
  { key: "totalAmount", label: "价税合计" },
  { key: "totalAmountChinese", label: "价税合计(大写)" },
  { key: "taxAmount", label: "税额" },
  { key: "amountWithoutTax", label: "不含税金额" },
  { key: "drawer", label: "开票人" },
  { key: "payee", label: "收款人" },
  { key: "reviewer", label: "复核人" },
  { key: "itemName", label: "项目名称" },
]

// 批量处理状态
const batchProcessing = ref(false)
const batchResults = ref({
  success: 0,
  error: 0,
  duplicate: 0,
  firstError: null as string | null,
})
const processingFiles = ref(new Map())
const totalFilesToProcess = ref(0)

// 处理文件变化
const handleFileChange = async (file: any, fileList: any[]) => {
  console.log(`🔍 文件上传检测: ${file.name}, fileList长度: ${fileList.length}`)

  // 延迟处理以确保批量检测
  setTimeout(async () => {
    const isBatchUpload = fileList.length > 1

    if (isBatchUpload && !batchProcessing.value) {
      console.log(`🚀 启动批量处理模式，总文件数: ${fileList.length}`)
      batchProcessing.value = true
      batchResults.value = {
        success: 0,
        error: 0,
        duplicate: 0,
        firstError: null,
      }
      totalFilesToProcess.value = fileList.length
      parsing.value = true
      processingFiles.value.clear()

      // 初始化所有文件的处理状态
      fileList.forEach((f) => {
        processingFiles.value.set(f.uid, { processed: false, file: f })
      })
    }

    // 处理单个文件
    await processSingleFile(file, batchProcessing.value)

    // 标记当前文件处理完成
    if (batchProcessing.value) {
      processingFiles.value.set(file.uid, { processed: true, file })
      checkBatchComplete()
    }
  }, 600)
}

// 处理单个文件
const processSingleFile = async (file: any, isBatch: boolean) => {
  if (file.raw && file.raw.type === "application/pdf") {
    try {
      if (!isBatch) {
        parsing.value = true
      }

      const parser = getPdfParser()
      const invoiceInfo = await parser.parseFile(file.raw)

      // 检查是否已存在同名文件
      const exists = invoiceData.value.some(
        (item) => item.fileName === invoiceInfo.fileName
      )

      if (!exists) {
        invoiceData.value.push({
          ...invoiceInfo,
          file: file.raw,
        })

        if (isBatch) {
          batchResults.value.success++
        } else {
          ElMessage.success(`成功解析文件: ${file.name}`)
        }
      } else {
        if (isBatch) {
          batchResults.value.duplicate++
        } else {
          ElMessage.warning(`文件 ${file.name} 已存在`)
        }
      }
    } catch (error: any) {
      if (isBatch) {
        batchResults.value.error++
        if (!batchResults.value.firstError) {
          batchResults.value.firstError = `${file.name}: ${error.message}`
        }
      } else {
        ElMessage.error(`解析文件失败: ${error.message}`)
      }
    } finally {
      if (!isBatch) {
        parsing.value = false
      }
    }
  } else {
    const errorMsg = "请上传PDF格式的文件"
    if (isBatch) {
      batchResults.value.error++
      if (!batchResults.value.firstError) {
        batchResults.value.firstError = `${file.name}: ${errorMsg}`
      }
    } else {
      ElMessage.error(errorMsg)
    }
  }
}

// 检查批量处理是否完成
const checkBatchComplete = () => {
  if (!batchProcessing.value) return

  const allProcessed = Array.from(processingFiles.value.values()).every(
    (fileInfo: any) => fileInfo.processed
  )
  const totalProcessed =
    batchResults.value.success +
    batchResults.value.error +
    batchResults.value.duplicate

  if (allProcessed && totalProcessed >= totalFilesToProcess.value) {
    showBatchResults()
    resetBatchState()
  }
}

// 重置批量处理状态
const resetBatchState = () => {
  batchProcessing.value = false
  parsing.value = false
  processingFiles.value.clear()
  totalFilesToProcess.value = 0
  batchResults.value = {
    success: 0,
    error: 0,
    duplicate: 0,
    firstError: null,
  }
}

// 显示批量处理结果
const showBatchResults = () => {
  const { success, error, duplicate } = batchResults.value
  const total = totalFilesToProcess.value

  // 计算实际失败数量（包括重复文件）
  const actualError = error
  const actualSuccess = success

  let message = `共上传 ${total} 个文件，成功解析 ${actualSuccess} 个`

  if (actualError > 0) {
    message += `，失败解析 ${actualError} 个`
  }

  // 如果有重复文件，单独提示
  if (duplicate > 0) {
    message += `，${duplicate} 个文件已存在`
  }

  // 根据结果选择合适的提示类型
  if (actualError > 0) {
    ElMessage.warning(message)
    // 如果有具体错误信息，额外显示
    if (batchResults.value.firstError) {
      setTimeout(() => {
        ElMessage.error(`首个错误详情：${batchResults.value.firstError}`)
      }, 1000)
    }
  } else if (actualSuccess > 0) {
    ElMessage.success(message)
  } else {
    ElMessage.info(message)
  }
}

// 重新解析所有文件
const parseAllFiles = async () => {
  if (invoiceData.value.length === 0) return

  try {
    parsing.value = true
    const newInvoiceData: InvoiceData[] = []

    for (const item of invoiceData.value) {
      try {
        console.log(`🔄 重新解析 ${item.fileName}...`)
        const parser = getPdfParser()
        const invoiceInfo = await parser.parseFile(item.file)

        newInvoiceData.push({
          ...invoiceInfo,
          file: item.file,
        })
      } catch (error: any) {
        ElMessage.error(`重新解析文件 ${item.fileName} 失败: ${error.message}`)
        newInvoiceData.push(item) // 保留原数据
      }
    }

    invoiceData.value = newInvoiceData
    ElMessage.success("重新解析完成")
  } catch (error: any) {
    ElMessage.error(`重新解析失败: ${error.message}`)
  } finally {
    parsing.value = false
  }
}

// 展开行变化处理
const handleExpandChange = (row: InvoiceData, expandedRows: string[]) => {
  // 处理展开行变化
}

// 预览文件
const previewFile = (file: File) => {
  currentPreviewFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  previewDialogVisible.value = true
}

// 关闭预览
const closePreview = () => {
  previewDialogVisible.value = false
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ""
  }
  currentPreviewFile.value = null
}

// 在新窗口打开PDF
const openPdfInNewWindow = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, "_blank")
  }
}

// 下载当前文件
const downloadCurrentFile = () => {
  if (currentPreviewFile.value) {
    const url = URL.createObjectURL(currentPreviewFile.value)
    const a = document.createElement("a")
    a.href = url
    a.download = currentPreviewFile.value.name
    a.click()
    URL.revokeObjectURL(url)
  }
}

// 移除文件
const removeFile = (index: number) => {
  invoiceData.value.splice(index, 1)
  if (invoiceData.value.length === 0) {
    fileList.value = []
    renameResults.value = []
    namingRules.value = []
  }
}

// 命名规则相关方法
const addNamingRule = () => {
  const newRule: NamingRule = {
    id: Date.now().toString(),
    type: "field",
    value: "invoiceNumber",
  }
  namingRules.value.push(newRule)
}

const addNamingRuleAfter = (index: number) => {
  const newRule: NamingRule = {
    id: Date.now().toString(),
    type: "field",
    value: "invoiceNumber",
  }
  namingRules.value.splice(index + 1, 0, newRule)
}

const removeNamingRule = (index: number) => {
  namingRules.value.splice(index, 1)
}

const onRuleTypeChange = (index: number, type: string) => {
  const rule = namingRules.value[index]
  if (rule) {
    rule.type = type as "field" | "text" | "date"
    if (type === "field") {
      rule.value = "invoiceNumber"
    } else if (type === "text") {
      rule.value = ""
    } else if (type === "date") {
      rule.value = "YYYY-MM-DD"
    }
  }
}

const updateNamingRules = (rules: NamingRule[]) => {
  namingRules.value = rules
}

// 执行重命名
const performRename = () => {
  if (namingRules.value.length === 0) {
    ElMessage.warning("请先设置命名规则")
    return
  }

  renaming.value = true
  const results: RenameResult[] = []

  try {
    for (const invoice of invoiceData.value) {
      try {
        const newName = generateFileName(invoice, namingRules.value)
        results.push({
          originalName: invoice.fileName,
          newName: newName,
          file: invoice.file,
          success: true,
        })
      } catch (error: any) {
        results.push({
          originalName: invoice.fileName,
          newName: invoice.fileName,
          file: invoice.file,
          success: false,
          error: error.message,
        })
      }
    }

    renameResults.value = results
    ElMessage.success(
      `重命名完成，成功 ${results.filter((r) => r.success).length} 个`
    )
  } catch (error: any) {
    ElMessage.error(`重命名失败: ${error.message}`)
  } finally {
    renaming.value = false
  }
}

// 生成文件名
const generateFileName = (
  invoice: InvoiceData,
  rules: NamingRule[]
): string => {
  let fileName = ""

  for (const rule of rules) {
    if (rule.type === "field") {
      const fieldValue = (invoice as any)[rule.value] || ""
      fileName += fieldValue
    } else if (rule.type === "text") {
      fileName += rule.value
    } else if (rule.type === "date") {
      const date = new Date()
      fileName += formatDate(date, rule.value)
    }
  }

  return fileName + ".pdf"
}

// 格式化日期
const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return format
    .replace("YYYY", year.toString())
    .replace("MM", month)
    .replace("DD", day)
}

// 下载所有文件
const downloadAllFiles = async () => {
  if (renameResults.value.length === 0) return

  try {
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    for (const result of renameResults.value) {
      if (result.success) {
        zip.file(result.newName, result.file)
      }
    }

    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url
    a.download = "重命名后的发票文件.zip"
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success("文件下载完成")
  } catch (error: any) {
    ElMessage.error(`下载失败: ${error.message}`)
  }
}

// 下载单个文件
const downloadSingleFile = (result: RenameResult) => {
  const url = URL.createObjectURL(result.file)
  const a = document.createElement("a")
  a.href = url
  a.download = result.newName
  a.click()
  URL.revokeObjectURL(url)
}

// 清空所有
const clearAll = async () => {
  try {
    await ElMessageBox.confirm("确定要清空所有数据吗？", "确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })

    fileList.value = []
    invoiceData.value = []
    namingRules.value = []
    renameResults.value = []
    expandedRows.value = []

    ElMessage.success("已清空所有数据")
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.invoice-renamer {
  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    .action-buttons {
      flex-direction: column;
      align-items: center;
    }
  }
}
</style>
