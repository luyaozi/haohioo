<template>
  <div class="invoice-renamer">
    <!-- 文件上传区域 -->
    <FileUploadCard 
      :file-list="fileList" 
      :existing-files="existingFileNames"
      @file-change="handleFileChange" 
      @duplicate-filtered="handleDuplicateFiltered"
    />

    <!-- 解析状态显示 -->
    <el-card v-if="parsing && invoiceData.length === 0" shadow="never" class="parsing-status-card">
      <div class="parsing-status">
        <el-icon class="is-loading parsing-icon"><Loading /></el-icon>
        <div class="parsing-text">
          <h3>正在解析发票文件...</h3>
          <p v-if="batchProcessing">
            已处理 {{ batchResults.success + batchResults.error + batchResults.duplicate }} / {{ totalFilesToProcess }} 个文件
          </p>
          <p class="parsing-hint">请稍候，正在提取发票信息</p>
        </div>
      </div>
    </el-card>

    <!-- 发票信息展示 -->
    <InvoiceInfoDisplay
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
      :is-downloading="false"
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
      :file="currentPreviewFile"
      @download="downloadCurrentFile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick,
  Delete,
  Loading,
} from '@element-plus/icons-vue'
import { PDFToWordParser } from '~/utils/pdfToWordParser'

// Emits
const emit = defineEmits<{
  'update-file-list': [fileList: any[]]
}>()

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
  type: 'field' | 'text' | 'date'
  value: string
  format?: string
}

interface RenameResult {
  originalName: string
  newName: string
  size: number
  processTime?: Date
  invoiceNumber?: string
  error?: string
  file: File
  downloading?: boolean
}

// 响应式数据
const fileList = ref<any[]>([])
const invoiceData = ref<InvoiceData[]>([])
const namingRules = ref<NamingRule[]>([])
const renameResults = shallowRef<RenameResult[]>([])
const parsing = ref(false)
const renaming = ref(false)
const expandedRows = ref<string[]>([])

// 预览相关状态
const previewDialogVisible = ref(false)
const currentPreviewFile = shallowRef<File | null>(null)

// 发票字段选项
const invoiceFields = [
  { key: 'invoiceNumber', label: '发票号码' },
  { key: 'invoiceDate', label: '开票日期' },
  { key: 'buyerName', label: '购买方名称' },
  { key: 'buyerTaxId', label: '购买方税号' },
  { key: 'sellerName', label: '销售方名称' },
  { key: 'sellerTaxId', label: '销售方税号' },
  { key: 'totalAmount', label: '价税合计' },
  { key: 'totalAmountChinese', label: '价税合计(大写)' },
  { key: 'taxAmount', label: '税额' },
  { key: 'amountWithoutTax', label: '不含税金额' },
  { key: 'drawer', label: '开票人' },
  { key: 'payee', label: '收款人' },
  { key: 'reviewer', label: '复核人' },
  { key: 'itemName', label: '项目名称' },
]

// 批量处理状态
const batchProcessing = ref(false)
const batchResults = ref({
  success: 0,
  error: 0,
  duplicate: 0,
  filtered: 0, // 新增：被过滤的重复文件数量
  firstError: null as string | null,
})
const processingFiles = shallowRef(new Map())
const totalFilesToProcess = ref(0)
const totalFilesSelected = ref(0) // 新增：用户选择的总文件数

// 计算已存在的文件名列表
const existingFileNames = computed(() => {
  return invoiceData.value.map(item => item.fileName)
})

// 检查文件是否已存在
const checkFileExists = (fileName: string): boolean => {
  return invoiceData.value.some(item => item.fileName === fileName)
}

// 处理重复文件过滤
const handleDuplicateFiltered = (fileName: string) => {
  batchResults.value.filtered++
  console.log(`📋 重复文件被过滤: ${fileName}, 当前过滤数量: ${batchResults.value.filtered}`)
}

// 处理文件变化
const handleFileChange = async (file: any, uploadFileList: any[]) => {
  console.log(`🔍 文件上传检测: ${file.name}, uploadFileList长度: ${uploadFileList.length}`)
  
  // 同步内部fileList
  fileList.value = uploadFileList
  console.log(`📋 同步fileList，当前长度: ${fileList.value.length}`)

  // 延迟处理以确保批量检测
  setTimeout(async () => {
    // 始终使用批量处理模式，确保统一的汇总提示
    if (!batchProcessing.value) {
      // 计算实际需要处理的新文件数量（排除已存在的文件）
      const newFiles = uploadFileList.filter(f => !processingFiles.value.has(f.uid))
      const actualNewFileCount = newFiles.length
      
      console.log(`🚀 启动处理模式，新文件数: ${actualNewFileCount}, 总文件数: ${uploadFileList.length}`)
      batchProcessing.value = true
      batchResults.value = {
        success: 0,
        error: 0,
        duplicate: 0,
        filtered: 0,
        firstError: null,
      }
      totalFilesToProcess.value = actualNewFileCount
      totalFilesSelected.value = uploadFileList.length + batchResults.value.filtered // 包含被过滤的文件
      parsing.value = actualNewFileCount > 0 // 只有在有新文件时才显示解析状态

      // 初始化新文件的处理状态
      newFiles.forEach((f) => {
        processingFiles.value.set(f.uid, { processed: false, file: f })
      })
      
      // 如果没有新文件需要处理，直接显示结果
      if (actualNewFileCount === 0) {
        setTimeout(() => {
          showBatchResults()
          resetBatchState()
        }, 100)
        return
      }
    } else {
      // 如果已经在批量处理中，只添加新文件
      if (!processingFiles.value.has(file.uid)) {
        processingFiles.value.set(file.uid, { processed: false, file })
        totalFilesToProcess.value++
        totalFilesSelected.value++
      }
    }

    // 处理单个文件（始终使用批量模式）
    await processSingleFile(file, true)

    // 标记当前文件处理完成
    processingFiles.value.set(file.uid, { processed: true, file })
    checkBatchComplete()
  }, 600)
}

// 处理单个文件
const processSingleFile = async (file: any, isBatch: boolean) => {
  if (file.raw && file.raw.type === 'application/pdf') {
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
    const errorMsg = '请上传PDF格式的文件'
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
  const { success, error, duplicate, filtered } = batchResults.value
  const totalSelected = totalFilesSelected.value || totalFilesToProcess.value
  const totalProcessed = totalFilesToProcess.value

  // 计算实际失败数量
  const actualError = error
  const actualSuccess = success

  let message = ''
  
  // 如果有被过滤的重复文件，优先提示
  if (filtered > 0) {
    if (totalProcessed > 0) {
      message = `共选择 ${totalSelected} 个文件，已帮您过滤掉 ${filtered} 个重复文件，成功解析 ${actualSuccess} 个新文件`
    } else {
      message = `共选择 ${totalSelected} 个文件，已帮您过滤掉 ${filtered} 个重复文件，无新文件需要解析`
    }
  } else {
    message = `共上传 ${totalProcessed} 个文件，成功解析 ${actualSuccess} 个`
  }

  if (actualError > 0) {
    message += `，失败解析 ${actualError} 个`
  }

  // 如果有重复文件（在解析过程中发现的），单独提示
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
  } else if (filtered > 0) {
    ElMessage.info(message)
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
    ElMessage.success('重新解析完成')
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
  previewDialogVisible.value = true
}

// 下载当前文件
const downloadCurrentFile = (file: File) => {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
}

// 移除文件 - 使用文件名而不是索引
const removeFile = (identifier: number | string) => {
  console.log('🗑️ InvoiceRenamer: removeFile 被调用')
  console.log('   - 接收到的标识符:', identifier)
  console.log('   - 标识符类型:', typeof identifier)
  console.log('   - 当前数据长度:', invoiceData.value.length)
  console.log('   - 当前所有文件名:', invoiceData.value.map((item, index) => `${index}: ${item.fileName}`))
  
  let removedFile: InvoiceData | null = null
  let removeIndex = -1
  
  // 如果传入的是数字，当作索引处理，但要获取对应的文件名
  if (typeof identifier === 'number') {
    console.log('   - 处理数字索引:', identifier)
    if (identifier >= 0 && identifier < invoiceData.value.length) {
      removedFile = invoiceData.value[identifier]
      removeIndex = identifier
      console.log('   - 找到文件 (按索引):', removedFile.fileName, '索引:', removeIndex)
    } else {
      console.log('   - 索引超出范围:', identifier, '数组长度:', invoiceData.value.length)
    }
  } else {
    // 如果传入的是字符串，当作文件名处理
    console.log('   - 处理文件名:', identifier)
    removeIndex = invoiceData.value.findIndex(item => item.fileName === identifier)
    if (removeIndex !== -1) {
      removedFile = invoiceData.value[removeIndex]
      console.log('   - 找到文件 (按文件名):', removedFile.fileName, '索引:', removeIndex)
    } else {
      console.log('   - 未找到匹配的文件名:', identifier)
    }
  }
  
  if (removedFile && removeIndex !== -1) {
    console.log('🗑️ 准备删除文件:', removedFile.fileName, '实际索引:', removeIndex)
    console.log('   - 删除前的数组:', invoiceData.value.map(item => item.fileName))
    
    // 从invoiceData中移除
    invoiceData.value.splice(removeIndex, 1)
    
    console.log('   - 删除后的数组:', invoiceData.value.map(item => item.fileName))
    
    // 同时从fileList中移除对应的文件
    console.log('   - fileList中的所有文件名:', fileList.value.map(f => f.name || f.raw?.name || '未知'))
    console.log('   - 要查找的文件名:', removedFile.fileName)
    
    const fileIndex = fileList.value.findIndex(f => f.name === removedFile.fileName)
    if (fileIndex !== -1) {
      fileList.value.splice(fileIndex, 1)
      console.log('   - 也从fileList中删除了，索引:', fileIndex)
    } else {
      // 尝试使用raw.name匹配
      const fileIndexByRaw = fileList.value.findIndex(f => f.raw?.name === removedFile.fileName)
      if (fileIndexByRaw !== -1) {
        fileList.value.splice(fileIndexByRaw, 1)
        console.log('   - 通过raw.name从fileList中删除了，索引:', fileIndexByRaw)
      } else {
        console.log('   - 在fileList中未找到对应文件（尝试了name和raw.name）')
      }
    }
    
    console.log('✅ 删除成功，剩余文件数:', invoiceData.value.length)
    ElMessage.success(`已删除文件: ${removedFile.fileName}`)
    
    if (invoiceData.value.length === 0) {
      fileList.value = []
      renameResults.value = []
      namingRules.value = []
      console.log('🧹 已清空所有相关数据')
    }
  } else {
    console.error('❌ 删除失败，无效的标识符:', identifier)
    console.log('   - removedFile:', removedFile)
    console.log('   - removeIndex:', removeIndex)
    ElMessage.error('删除失败，找不到对应的文件')
  }
}

// 命名规则相关方法
const addNamingRule = () => {
  const newRule: NamingRule = {
    id: Date.now().toString(),
    type: 'field',
    value: 'invoiceNumber',
  }
  namingRules.value.push(newRule)
}

const addNamingRuleAfter = (index: number) => {
  const newRule: NamingRule = {
    id: Date.now().toString(),
    type: 'field',
    value: 'invoiceNumber',
  }
  namingRules.value.splice(index + 1, 0, newRule)
}

const removeNamingRule = (index: number) => {
  namingRules.value.splice(index, 1)
}

const onRuleTypeChange = (index: number, type: string) => {
  const rule = namingRules.value[index]
  if (rule) {
    rule.type = type as 'field' | 'text' | 'date'
    if (type === 'field') {
      rule.value = 'invoiceNumber'
    } else if (type === 'text') {
      rule.value = ''
    } else if (type === 'date') {
      rule.value = 'YYYY-MM-DD'
    }
  }
}

const updateNamingRules = (rules: NamingRule[]) => {
  namingRules.value = rules
}

// 执行重命名
const performRename = () => {
  if (namingRules.value.length === 0) {
    ElMessage.warning('请先设置命名规则')
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
          size: invoice.file.size,
          processTime: new Date(),
          invoiceNumber: invoice.invoiceNumber,
          file: invoice.file,
        })
      } catch (error: any) {
        results.push({
          originalName: invoice.fileName,
          newName: invoice.fileName,
          size: invoice.file.size,
          processTime: new Date(),
          invoiceNumber: invoice.invoiceNumber,
          error: error.message,
          file: invoice.file,
        })
      }
    }

    renameResults.value = results
    ElMessage.success(`重命名完成，成功 ${results.filter(r => !r.error).length} 个`)
  } catch (error: any) {
    ElMessage.error(`重命名失败: ${error.message}`)
  } finally {
    renaming.value = false
  }
}

// 生成文件名
const generateFileName = (invoice: InvoiceData, rules: NamingRule[]): string => {
  let fileName = ''

  for (const rule of rules) {
    if (rule.type === 'field') {
      const fieldValue = (invoice as any)[rule.value] || ''
      fileName += fieldValue
    } else if (rule.type === 'text') {
      fileName += rule.value
    } else if (rule.type === 'date') {
      const date = new Date()
      fileName += formatDate(date, rule.value)
    }
  }

  return fileName + '.pdf'
}

// 格式化日期
const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
}

// 下载所有文件
const downloadAllFiles = async () => {
  if (renameResults.value.length === 0) return

  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (const result of renameResults.value) {
      if (!result.error) {
        zip.file(result.newName, result.file)
      }
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = '重命名后的发票文件.zip'
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('文件下载完成')
  } catch (error: any) {
    ElMessage.error(`下载失败: ${error.message}`)
  }
}

// 下载单个文件
const downloadSingleFile = (result: RenameResult) => {
  const url = URL.createObjectURL(result.file)
  const a = document.createElement('a')
  a.href = url
  a.download = result.newName
  a.click()
  URL.revokeObjectURL(url)
}

// 清空所有
const clearAll = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有数据吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    fileList.value = []
    invoiceData.value = []
    namingRules.value = []
    renameResults.value = []
    expandedRows.value = []

    ElMessage.success('已清空所有数据')
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.invoice-renamer {
  .parsing-status-card {
    margin: 20px 0;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    
    .parsing-status {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      
      .parsing-icon {
        font-size: 32px;
        color: #409eff;
        margin-right: 16px;
      }
      
      .parsing-text {
        h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #303133;
          font-weight: 600;
        }
        
        p {
          margin: 4px 0;
          color: #606266;
          font-size: 14px;
        }
        
        .parsing-hint {
          color: #909399;
          font-size: 13px;
        }
      }
    }
  }

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
    
    .parsing-status {
      flex-direction: column;
      
      .parsing-icon {
        margin-right: 0;
        margin-bottom: 12px;
      }
    }
  }
}
</style>