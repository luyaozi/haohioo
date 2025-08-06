<template>
  <div class="invoice-renamer animate__animated animate__fadeIn">
    <!-- 文件上传区域 -->
    <FileUploadCard :file-list="fileList" @file-change="handleFileChange" />

    <!-- 发票信息表格 -->
    <InvoiceInfoTable
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

<script>
import { ref, reactive, computed, onMounted, nextTick } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  UploadFilled,
  Refresh,
  Plus,
  Delete,
  Download,
  Right,
  MagicStick,
  Loading,
  Rank,
  Close,
} from "@element-plus/icons-vue"
import PDFToWordParser from "../utils/pdfToWordParser.js"
import Sortable from "sortablejs"

// 导入子组件
import FileUploadCard from "./FileUploadCard.vue"
import InvoiceInfoTable from "./InvoiceInfoTable.vue"
import NamingRulesCard from "./NamingRulesCard.vue"
import RenameResultsCard from "./RenameResultsCard.vue"
import PDFPreviewDialog from "./PDFPreviewDialog.vue"

export default {
  name: "InvoiceRenamer",
  components: {
    UploadFilled,
    Refresh,
    Plus,
    Delete,
    Download,
    Right,
    MagicStick,
    Loading,
    Rank,
    Close,
    // 子组件
    FileUploadCard,
    InvoiceInfoTable,
    NamingRulesCard,
    RenameResultsCard,
    PDFPreviewDialog,
  },
  setup() {
    const uploadRef = ref()
    const fileList = ref([])
    const invoiceData = ref([])
    const namingRules = ref([])
    const renameResults = ref([])
    const parsing = ref(false)
    const renaming = ref(false)
    const expandedRows = ref([])

    // 预览相关状态
    const previewDialogVisible = ref(false)
    const currentPreviewFile = ref(null)
    const previewUrl = ref("")

    // 命名规则相关状态
    const editingRuleIndex = ref(-1)
    const rulesListRef = ref(null)
    let sortableInstance = null

    // 发票字段选项 - 扩展更多字段
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
      firstError: null,
    })
    const processingFiles = ref(new Map()) // 存储正在处理的文件状态
    const totalFilesToProcess = ref(0)
    let batchTimer = null

    // 处理文件变化
    // 全局变量，用于跟踪实际的文件总数
    let actualTotalFiles = 0
    let batchDetectionComplete = false
    let batchDetectionTimer = null

    const handleFileChange = async (file, fileList) => {
      console.log(
        `🔍 文件上传检测: ${file.name}, fileList长度: ${fileList.length}, 当前批量状态: ${batchProcessing.value}`
      )

      // 清除之前的检测定时器
      if (batchDetectionTimer) {
        clearTimeout(batchDetectionTimer)
      }

      // 使用延迟检测来确保准确判断批量上传
      if (!batchDetectionComplete) {
        // 延迟500ms检测，确保所有文件都已添加到fileList
        batchDetectionTimer = setTimeout(() => {
          const currentFileList = fileList
          const isBatchUpload = currentFileList.length > 1

          console.log(
            `⏰ 最终批量检测结果: fileList长度: ${currentFileList.length}, 是否批量: ${isBatchUpload}`
          )

          if (isBatchUpload) {
            // 启动批量处理模式
            console.log(
              `🚀 启动批量处理模式，总文件数: ${currentFileList.length}`
            )
            batchProcessing.value = true
            batchResults.value = {
              success: 0,
              error: 0,
              duplicate: 0,
              firstError: null,
            }
            actualTotalFiles = currentFileList.length
            totalFilesToProcess.value = actualTotalFiles
            parsing.value = true
            processingFiles.value.clear()

            // 初始化所有文件的处理状态
            currentFileList.forEach((f) => {
              processingFiles.value.set(f.uid, { processed: false, file: f })
            })
          }

          batchDetectionComplete = true
        }, 500)
      }

      // 延迟处理文件，确保批量模式已正确设置
      setTimeout(async () => {
        // 标记当前文件开始处理
        if (batchProcessing.value) {
          processingFiles.value.set(file.uid, { processed: false, file })

          // 确保总文件数是最新的
          if (fileList.length > totalFilesToProcess.value) {
            console.log(`📊 更新总文件数: ${fileList.length}`)
            totalFilesToProcess.value = fileList.length
            actualTotalFiles = fileList.length
          }
        }

        // 处理单个文件 - 始终使用 batchProcessing.value 来判断
        console.log(
          `📝 处理文件: ${file.name}, 批量模式: ${batchProcessing.value}`
        )
        await processSingleFile(file, batchProcessing.value)

        // 标记当前文件处理完成
        if (batchProcessing.value) {
          processingFiles.value.set(file.uid, { processed: true, file })
          checkBatchComplete()
        }
      }, 600)
    }

    // 处理单个文件
    const processSingleFile = async (file, isBatch) => {
      if (file.raw && file.raw.type === "application/pdf") {
        try {
          if (!isBatch) {
            parsing.value = true
          }

          const parser = new PDFToWordParser()
          const invoiceInfo = await parser.parseFile(file.raw)

          // 检查是否已存在同名文件
          const exists = invoiceData.value.some(
            (item) => item.fileName === invoiceInfo.fileName
          )

          if (!exists) {
            invoiceData.value.push({
              ...invoiceInfo,
              file: file.raw,
              parseMethod: "PDFToWordParser",
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
        } catch (error) {
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
        if (isBatch) {
          batchResults.value.error++
          if (!batchResults.value.firstError) {
            batchResults.value.firstError = `${file.name}: 请上传PDF格式的文件`
          }
        } else {
          ElMessage.error("请上传PDF格式的文件")
        }
      }
    }

    // 检查批量处理是否完成
    const checkBatchComplete = () => {
      if (!batchProcessing.value) return

      // 检查所有文件是否都已处理完成
      const allProcessed = Array.from(processingFiles.value.values()).every(
        (fileInfo) => fileInfo.processed
      )
      const totalProcessed =
        batchResults.value.success +
        batchResults.value.error +
        batchResults.value.duplicate

      if (allProcessed && totalProcessed >= totalFilesToProcess.value) {
        // 所有文件都处理完成，显示结果
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

      // 重置全局变量
      actualTotalFiles = 0
      batchDetectionComplete = false

      // 清理定时器
      if (batchTimer) {
        clearTimeout(batchTimer)
        batchTimer = null
      }
      if (batchDetectionTimer) {
        clearTimeout(batchDetectionTimer)
        batchDetectionTimer = null
      }
    }

    // 显示批量处理结果
    const showBatchResults = () => {
      const { success, error, duplicate } = batchResults.value
      const total = totalFilesToProcess.value

      // 构建汇总消息
      let message = `共 ${total} 个文件，成功解析 ${success} 个`

      if (error > 0) {
        message += `，失败 ${error} 个`
      }

      if (duplicate > 0) {
        message += `，重复 ${duplicate} 个`
      }

      // 根据结果类型选择消息类型
      if (error > 0) {
        ElMessage.warning(message)
      } else if (success > 0) {
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
        const newInvoiceData = []

        for (const item of invoiceData.value) {
          try {
            console.log(`🔄 重新解析 ${item.fileName}...`)
            const parser = new PDFToWordParser()
            const invoiceInfo = await parser.parseFile(item.file)

            newInvoiceData.push({
              ...invoiceInfo,
              file: item.file,
              parseMethod: "PDFToWordParser",
            })
          } catch (error) {
            ElMessage.error(
              `重新解析文件 ${item.fileName} 失败: ${error.message}`
            )
            newInvoiceData.push(item) // 保留原数据
          }
        }

        invoiceData.value = newInvoiceData
        ElMessage.success("重新解析完成")
      } catch (error) {
        ElMessage.error("重新解析失败")
      } finally {
        parsing.value = false
      }
    }

    // 删除文件
    const removeFile = (index) => {
      invoiceData.value.splice(index, 1)
      ElMessage.success("文件已删除")
    }

    // 添加命名规则
    const addNamingRule = () => {
      namingRules.value.push({
        type: "input",
        value: "",
        id: Date.now(), // 添加唯一ID
      })

      // 初始化拖拽排序
      nextTick(() => {
        initSortable()
      })
    }

    // 在指定位置后添加命名规则
    const addNamingRuleAfter = (index) => {
      const newRule = {
        type: "input",
        value: "",
        id: Date.now(),
      }
      namingRules.value.splice(index + 1, 0, newRule)

      // 重新初始化拖拽排序
      nextTick(() => {
        initSortable()
      })

      ElMessage.success("已添加新规则")
    }

    // 删除命名规则
    const removeNamingRule = (index) => {
      namingRules.value.splice(index, 1)
      // 重新初始化拖拽排序
      nextTick(() => {
        initSortable()
      })
    }

    // 获取规则显示文本
    const getRuleDisplayText = (rule) => {
      if (rule.type === "input") {
        return rule.value || "文本"
      } else if (rule.type === "select") {
        const field = invoiceFields.find((f) => f.key === rule.value)
        return field ? field.label : "字段"
      }
      return "规则"
    }

    // 规则类型变化处理
    const onRuleTypeChange = (index) => {
      const rule = namingRules.value[index]
      rule.value = "" // 清空值
    }

    // 初始化拖拽排序
    const initSortable = () => {
      if (sortableInstance) {
        sortableInstance.destroy()
      }

      if (rulesListRef.value && namingRules.value.length > 0) {
        sortableInstance = new Sortable(rulesListRef.value, {
          animation: 150,
          handle: ".drag-handle",
          ghostClass: "sortable-ghost",
          chosenClass: "sortable-chosen",
          dragClass: "sortable-drag",
          onEnd: (evt) => {
            const { oldIndex, newIndex } = evt
            if (oldIndex !== newIndex) {
              // 更新数组顺序
              const movedItem = namingRules.value.splice(oldIndex, 1)[0]
              namingRules.value.splice(newIndex, 0, movedItem)

              ElMessage.success("规则顺序已调整")
            }
          },
        })
      }
    }

    // 生成新文件名
    const generateNewFileName = (invoice) => {
      if (namingRules.value.length === 0) return invoice.fileName

      let newName = ""

      namingRules.value.forEach((rule, index) => {
        if (rule.type === "input") {
          newName += rule.value || ""
        } else if (rule.type === "select" && rule.value) {
          const fieldValue = invoice[rule.value] || ""
          newName += fieldValue
        }

        // 添加分隔符（除了最后一个规则）
        if (index < namingRules.value.length - 1) {
          newName += " "
        }
      })

      // 确保有扩展名
      if (newName && !newName.endsWith(".pdf")) {
        newName += ".pdf"
      }

      return newName || invoice.fileName
    }

    // 执行重命名
    const performRename = async () => {
      if (namingRules.value.length === 0) {
        ElMessage.warning("请先设置命名规则")
        return
      }

      try {
        renaming.value = true
        const results = []

        invoiceData.value.forEach((invoice) => {
          const newName = generateNewFileName(invoice)
          results.push({
            originalName: invoice.fileName,
            newName: newName,
            success: newName !== invoice.fileName && newName.trim() !== "",
            file: invoice.file,
            renamedFile: new File([invoice.file], newName, {
              type: invoice.file.type,
            }),
          })
        })

        renameResults.value = results
        ElMessage.success("重命名完成")
      } catch (error) {
        ElMessage.error("重命名失败")
      } finally {
        renaming.value = false
      }
    }

    // 下载单个文件
    const downloadSingleFile = (result) => {
      if (!result.success) {
        ElMessage.warning("该文件重命名失败，无法下载")
        return
      }

      const url = URL.createObjectURL(result.renamedFile)
      const a = document.createElement("a")
      a.href = url
      a.download = result.newName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      ElMessage.success(`已下载: ${result.newName}`)
    }

    // 创建ZIP文件并下载
    const createZipAndDownload = async (files, zipName = "重命名文件.zip") => {
      try {
        // 动态导入JSZip
        const JSZip = (await import("jszip")).default
        const zip = new JSZip()

        // 添加文件到ZIP
        files.forEach((result) => {
          if (result.success && result.renamedFile) {
            zip.file(result.newName, result.renamedFile)
          }
        })

        // 生成ZIP文件
        const zipBlob = await zip.generateAsync({ type: "blob" })

        // 下载ZIP文件
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = zipName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        return true
      } catch (error) {
        console.error("创建ZIP文件失败:", error)
        return false
      }
    }

    // 下载所有文件（ZIP格式）
    const downloadAllFiles = async () => {
      const successResults = renameResults.value.filter(
        (result) => result.success
      )

      if (successResults.length === 0) {
        ElMessage.warning("没有可下载的文件")
        return
      }

      ElMessage.info("正在打包文件，请稍候...")

      try {
        const success = await createZipAndDownload(
          successResults,
          "重命名发票文件.zip"
        )
        if (success) {
          ElMessage.success(`已打包下载 ${successResults.length} 个文件`)
        } else {
          // 如果ZIP下载失败，回退到逐个下载
          ElMessage.warning("ZIP打包失败，将逐个下载文件")
          successResults.forEach((result, index) => {
            setTimeout(() => {
              downloadSingleFile(result)
            }, index * 200)
          })
        }
      } catch (error) {
        ElMessage.error("下载失败，请重试")
        console.error("下载错误:", error)
      }
    }

    // 处理展开行变化
    const handleExpandChange = (row, expandedRows) => {
      // 可以在这里添加展开行的处理逻辑
      console.log("展开行变化:", row.fileName, expandedRows)
    }

    // 格式化备注信息，将换行符转换为HTML的<br>标签
    const formatRemark = (remark) => {
      if (!remark) return ""
      return remark.replace(/\n/g, "<br>")
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

        // 清空上传组件
        if (uploadRef.value) {
          uploadRef.value.clearFiles()
        }

        ElMessage.success("已清空所有数据")
      } catch {
        // 用户取消
      }
    }

    // 预览文件
    const previewFile = (invoice) => {
      currentPreviewFile.value = invoice
      previewDialogVisible.value = true

      // 创建PDF预览URL
      if (invoice.file) {
        // 清除之前的URL
        if (previewUrl.value) {
          URL.revokeObjectURL(previewUrl.value)
        }

        // 创建新的URL
        previewUrl.value = URL.createObjectURL(invoice.file)
      }
    }

    // 关闭预览时清理URL
    const closePreview = () => {
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = ""
      }
      currentPreviewFile.value = null
      previewDialogVisible.value = false
    }

    // 在新窗口中打开PDF
    const openPdfInNewWindow = () => {
      if (previewUrl.value) {
        window.open(previewUrl.value, "_blank")
      }
    }

    // 下载当前预览的文件
    const downloadCurrentFile = () => {
      if (currentPreviewFile.value) {
        downloadSingleFile(currentPreviewFile.value)
      }
    }

    // 更新命名规则（用于子组件）
    const updateNamingRules = (newRules) => {
      namingRules.value = newRules
      // 重新初始化拖拽排序
      nextTick(() => {
        initSortable()
      })
    }

    // 组件挂载时初始化拖拽排序
    onMounted(() => {
      nextTick(() => {
        initSortable()
      })
    })

    return {
      uploadRef,
      fileList,
      invoiceData,
      namingRules,
      renameResults,
      parsing,
      renaming,
      expandedRows,
      invoiceFields,
      batchProcessing,
      batchResults,
      processingFiles,
      totalFilesToProcess,
      // 命名规则相关
      editingRuleIndex,
      rulesListRef,
      handleFileChange,
      parseAllFiles,
      removeFile,
      addNamingRule,
      addNamingRuleAfter,
      removeNamingRule,
      getRuleDisplayText,
      onRuleTypeChange,
      updateNamingRules,
      initSortable,
      generateNewFileName,
      performRename,
      downloadSingleFile,
      downloadAllFiles,
      clearAll,
      handleExpandChange,
      formatRemark,
      processSingleFile,
      checkBatchComplete,
      resetBatchState,
      showBatchResults,
      // 预览相关
      previewDialogVisible,
      currentPreviewFile,
      previewUrl,
      previewFile,
      closePreview,
      openPdfInNewWindow,
      downloadCurrentFile,
    }
  },
}
</script>

<style scoped>
/* 全局容器 - 清爽C端布局 */
.invoice-renamer {
  padding: 0;
  background: transparent;
  min-height: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
}

/* 操作按钮样式 */
.action-buttons {
  text-align: center;
  margin-top: 40px;
  padding: 32px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
}

.action-buttons .el-button {
  margin: 0 12px;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.action-buttons .el-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.6s ease;
}

.action-buttons .el-button:hover::before {
  left: 100%;
}

.action-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.rule-actions .el-button::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.rule-actions .el-button:hover::before {
  width: 60px;
  height: 60px;
}

.rule-actions .el-button:hover {
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.rule-actions .el-button:active {
  transform: translateY(-1px) scale(1.05);
}

/* 拖拽状态样式 */
.sortable-ghost {
  opacity: 0.5;
  background: #f56c6c !important;
  color: white !important;
}

.sortable-chosen {
  transform: rotate(5deg);
}

.sortable-drag {
  transform: rotate(10deg);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* 空状态样式 */
.no-rules {
  text-align: center;
  padding: 60px 40px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(248, 250, 252, 0.6) 100%
  );
  border-radius: 20px;
  border: 2px dashed rgba(99, 102, 241, 0.3);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.no-rules::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at center,
    rgba(99, 102, 241, 0.05) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.no-rules .el-empty {
  position: relative;
  z-index: 1;
}

.no-rules .el-button {
  margin-top: 20px;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  color: white;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.no-rules .el-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.6s ease;
}

.no-rules .el-button:hover::before {
  left: 100%;
}

.no-rules .el-button:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
}

/* 头部操作区域 */
.header-actions {
  display: flex;
  align-items: center;
}

.action-buttons {
  text-align: center;
  margin-top: 40px;
  padding: 32px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
}

.action-buttons .el-button {
  margin: 0 12px;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.action-buttons .el-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.6s ease;
}

.action-buttons .el-button:hover::before {
  left: 100%;
}

.action-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 展开内容样式 - 现代化C端设计 */
.expand-content {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 16px;
  border: 1px solid #f0f0f0;
}

.basic-info-section {
  margin-bottom: 20px;
}

.expand-content h4 {
  margin: 0 0 16px 0;
  color: #262626;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #1677ff;
  position: relative;
}

.expand-content h4::before {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 20px;
  height: 2px;
  background: #1677ff;
  border-radius: 1px;
}

.remark-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.remark-section h4 {
  margin: 0 0 16px 0;
  color: #262626;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #52c41a;
  position: relative;
}

.remark-section h4::before {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 20px;
  height: 2px;
  background: #52c41a;
  border-radius: 1px;
}

.remark-content {
  color: #595959;
  line-height: 1.6;
  font-size: 14px;
  background: #ffffff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.text-muted {
  color: #8c8c8c;
  font-style: italic;
  font-size: 13px;
}

/* 描述列表样式优化 */
.expand-content .el-descriptions {
  background: #ffffff;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.expand-content .el-descriptions__header {
  background: #fafafa;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.expand-content .el-descriptions__body {
  background: #ffffff;
}

.expand-content .el-descriptions-item__label {
  background: #fafafa !important;
  color: #262626 !important;
  font-weight: 500 !important;
  font-size: 13px !important;
  border-color: #f0f0f0 !important;
}

.expand-content .el-descriptions-item__content {
  background: #ffffff !important;
  color: #595959 !important;
  font-size: 13px !important;
  border-color: #f0f0f0 !important;
}

/* 文件名链接样式 */
.file-name-link {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s;
}

.file-name-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* PDF预览对话框样式 */
.pdf-preview-container {
  position: relative;
  min-height: 600px;
}

.pdf-viewer {
  position: relative;
}

.pdf-embed {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pdf-fallback {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: center;
  color: #606266;
}

.pdf-fallback p {
  margin-bottom: 15px;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 600px;
  color: #909399;
}

.preview-loading .el-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

/* 页面加载动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate__animated {
  animation-duration: 0.8s;
  animation-fill-mode: both;
}

.animate__fadeIn {
  animation-name: fadeIn;
}

/* 卡片进入动画 */
.upload-card {
  animation: slideInUp 0.6s ease-out;
}

.info-card {
  animation: slideInLeft 0.8s ease-out 0.2s both;
}

.naming-card {
  animation: slideInRight 0.8s ease-out 0.4s both;
}

.result-card {
  animation: slideInUp 0.8s ease-out 0.6s both;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 微交互动画 */
.el-tag {
  transition: all 0.3s ease;
}

.el-tag:hover {
  transform: scale(1.05);
}

.el-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-button:active {
  transform: scale(0.95);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .invoice-renamer {
    padding: 0 10px;
  }

  .card-header {
    padding: 20px 16px;
    font-size: 18px;
  }

  .action-buttons {
    padding: 20px 16px;
  }

  .action-buttons .el-button {
    margin: 8px 6px;
    padding: 10px 20px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .action-buttons .el-button {
    display: block;
    width: 100%;
    margin: 8px 0;
  }
}

/* 下载提示区域样式 - 现代化设计 */
.download-tips {
  margin-bottom: 20px;
  position: relative;
}

.download-tips .el-alert {
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.1);
  position: relative;
  overflow: hidden;
}

.download-tips .el-alert::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
}

.download-tips .el-alert__content {
  position: relative;
  z-index: 1;
}

.download-tips .el-alert__content p {
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
  color: #0f172a;
  font-weight: 500;
}

.download-tips .el-alert__content strong {
  color: #0284c7;
  font-weight: 700;
}

/* 表格样式优化 */
.el-table {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  width: 100% !important;
}

.el-table .el-table__header-wrapper {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.el-table .el-table__header th {
  background: transparent;
  border-bottom: 2px solid #e5e7eb;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
  padding: 16px 12px;
}

.el-table .el-table__body tr {
  transition: all 0.3s ease;
}

.el-table .el-table__body tr:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: scale(1.001);
}

.el-table .el-table__body td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #4b5563;
  font-size: 13px;
}

.el-table .el-table__body tr:last-child td {
  border-bottom: none;
}

/* 重命名结果表格样式 - 现代化C端卡片风格 */
.result-card :deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: #ffffff;
  border: 1px solid #f0f0f0;
}

/* 表格头部 - 简洁现代 */
.result-card :deep(.el-table th.el-table__cell) {
  background: #fafafa;
  color: #262626;
  font-weight: 600;
  font-size: 14px;
  border: none;
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.result-card :deep(.el-table th.el-table__cell:first-child) {
  border-radius: 12px 0 0 0;
}

.result-card :deep(.el-table th.el-table__cell:last-child) {
  border-radius: 0 12px 0 0;
}

/* 表格行 - 卡片化设计 */
.result-card :deep(.el-table td.el-table__cell) {
  border: none;
  background: #ffffff;
  padding: 16px 12px;
  font-size: 14px;
  color: #595959;
  border-bottom: 1px solid #f5f5f5;
}

.result-card :deep(.el-table tbody tr) {
  transition: all 0.2s ease;
}

.result-card :deep(.el-table tbody tr:hover td.el-table__cell) {
  background: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.result-card :deep(.el-table tbody tr:last-child td.el-table__cell) {
  border-bottom: none;
}

.result-card
  :deep(.el-table tbody tr:last-child td.el-table__cell:first-child) {
  border-radius: 0 0 0 12px;
}

.result-card :deep(.el-table tbody tr:last-child td.el-table__cell:last-child) {
  border-radius: 0 0 12px 0;
}

/* 下载按钮样式 */
.result-card :deep(.el-button--primary) {
  background: #1677ff;
  color: #ffffff;
  border-color: #1677ff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(22, 119, 255, 0.2);
}

.result-card :deep(.el-button--primary:hover) {
  background: #4096ff;
  border-color: #4096ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(22, 119, 255, 0.3);
}

.result-card :deep(.el-button--primary:active) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(22, 119, 255, 0.2);
}

.rename-results-table {
  width: 100% !important;
  table-layout: fixed;
}

.rename-results-table .el-table__body-wrapper {
  width: 100% !important;
}

/* 状态标签样式 */
.el-tag {
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  padding: 4px 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.el-tag.el-tag--success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
}

.el-tag.el-tag--danger {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  color: #dc2626;
}

.download-tips .el-alert__content p {
  margin: 4px 0;
  font-size: 14px;
  line-height: 1.5;
}

.download-tips .el-alert__content p:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rule-item {
    flex-direction: column;
    align-items: stretch;
  }

  .rule-item > * {
    margin: 5px 0;
  }

  .preview-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .original-name,
  .new-name {
    width: 100%;
    margin: 2px 0;
  }

  .expand-content {
    padding: 15px;
    margin: 5px;
  }

  .download-tips .el-alert__content p {
    font-size: 13px;
    line-height: 1.6;
  }

  .el-table .el-table__header th,
  .el-table .el-table__body td {
    padding: 12px 8px;
    font-size: 12px;
  }

  .invoice-renamer {
    padding: 16px;
  }

  .card-container {
    margin-bottom: 16px;
  }

  .card-header {
    padding: 16px 20px;
  }

  .card-title {
    font-size: 16px;
  }
}

/* 页面加载动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 应用动画到各个组件 */
.card-container:nth-child(1) {
  animation: fadeInUp 0.6s ease-out;
}

.card-container:nth-child(2) {
  animation: slideInLeft 0.6s ease-out 0.2s both;
}

.card-container:nth-child(3) {
  animation: slideInRight 0.6s ease-out 0.4s both;
}

.card-container:nth-child(4) {
  animation: fadeInUp 0.6s ease-out 0.6s both;
}

/* 微交互动画 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translateY(0);
  }
  40%,
  43% {
    transform: translateY(-8px);
  }
  70% {
    transform: translateY(-4px);
  }
  90% {
    transform: translateY(-2px);
  }
}

/* 成功状态动画 */
.el-tag.el-tag--success {
  animation: pulse 2s infinite;
}

/* 按钮点击反馈 */
.el-button:active {
  transform: scale(0.98);
}

/* 文件上传区域动画 */
.upload-area:hover {
  animation: bounce 1s ease-in-out;
}

/* 表格中的删除按钮样式 - 现代化C端设计 */
.info-card :deep(.el-button--danger) {
  background: #ff4d4f;
  color: #ffffff;
  border-color: #ff4d4f;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 60px;
  height: 32px;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.2);
}

.info-card :deep(.el-button--danger:hover) {
  background: #ff7875;
  border-color: #ff7875;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.info-card :deep(.el-button--danger:active) {
  background: #d9363e;
  border-color: #d9363e;
  transform: translateY(0);
}

/* 表格操作列样式优化 */
.info-card :deep(.el-table__fixed-right) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.04);
}

.info-card :deep(.el-table__fixed-right-patch) {
  background: #fafafa;
}
</style>
