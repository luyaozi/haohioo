<template>
  <el-dialog
    :model-value="props.visible"
    @update:model-value="handleClose"
    :title="dialogTitle"
    width="85%"
    top="3vh"
    :close-on-click-modal="false"
    @close="handleClose"
    class="pdf-preview-dialog"
  >
    <div class="pdf-preview-container">
      <div v-if="previewUrl" class="pdf-viewer">
        <!-- 使用embed标签，更好的PDF支持 -->
        <embed
          :src="`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`"
          type="application/pdf"
          width="100%"
          height="600px"
          class="pdf-embed"
        />
        <!-- 备用方案：如果embed不工作，提供下载链接 -->
        <div class="pdf-fallback">
          <p>如果PDF无法显示，请点击下面的链接在新窗口中打开：</p>
          <el-button type="primary" @click="openPdfInNewWindow">
            在新窗口中打开PDF
          </el-button>
        </div>
      </div>
      <div v-else-if="isLoading" class="preview-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>正在加载预览...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <el-icon class="error-icon"><WarningFilled /></el-icon>
        <p class="error-message">{{ error }}</p>
        <el-button type="primary" @click="retryLoad">重新加载</el-button>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <span v-if="currentFile">
            {{ fileInfo.formattedSize }} | {{ fileInfo.formattedDate }}
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="primary" @click="downloadCurrentFile">
            <el-icon><Download /></el-icon>
            下载文件
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { 
  Download, 
  WarningFilled,
  Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { 
  createPdfPreviewUrl, 
  cleanupPdfPreviewUrl, 
  openPdfInNewWindow as openPdfInNewTab,
  downloadPdfFile,
  getPdfFileInfo
} from '~/utils/pdfPreviewHelper'

// Props
interface Props {
  visible: boolean
  file: File | null
  fileName?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'download': [file: File]
}>()

// State
const isLoading = ref(false)
const error = ref('')
const previewUrl = ref('')

// Computed
const currentFile = computed(() => props.file)
const dialogTitle = computed(() => {
  if (currentFile.value) {
    return currentFile.value.name
  }
  return 'PDF 预览'
})

const fileInfo = computed(() => {
  if (currentFile.value) {
    return getPdfFileInfo(currentFile.value)
  }
  return { formattedSize: '', formattedDate: '' }
})

// Watchers
watch(() => props.visible, (newVal) => {
  if (newVal && currentFile.value) {
    nextTick(() => {
      loadPdfPreview()
    })
  } else if (!newVal) {
    cleanup()
  }
})

watch(() => props.file, (newFile) => {
  if (newFile && props.visible) {
    nextTick(() => {
      loadPdfPreview()
    })
  }
})

// Methods
const handleClose = () => {
  cleanup()
  emit('update:visible', false)
}

const cleanup = () => {
  if (previewUrl.value) {
    cleanupPdfPreviewUrl(previewUrl.value)
    previewUrl.value = ''
  }
  error.value = ''
  isLoading.value = false
}

const loadPdfPreview = async () => {
  if (!currentFile.value) return

  isLoading.value = true
  error.value = ''
  
  try {
    // 清理之前的预览URL
    cleanup()
    
    // 创建新的预览URL
    previewUrl.value = await createPdfPreviewUrl(currentFile.value)
    
  } catch (err: any) {
    console.error('PDF preview error:', err)
    error.value = `预览失败: ${err.message || '未知错误'}`
  } finally {
    isLoading.value = false
  }
}

const openPdfInNewWindow = () => {
  if (currentFile.value) {
    openPdfInNewTab(currentFile.value)
  }
}

const downloadCurrentFile = () => {
  if (currentFile.value) {
    try {
      downloadPdfFile(currentFile.value)
      emit('download', currentFile.value)
    } catch (err: any) {
      ElMessage.error(`下载失败: ${err.message}`)
    }
  }
}

const retryLoad = () => {
  if (currentFile.value) {
    loadPdfPreview()
  }
}
</script>

<style lang="scss" scoped>
.pdf-preview-dialog {
  :deep(.el-dialog) {
    margin: 0;
    height: 95vh;
    max-height: 95vh;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__header) {
    padding: 16px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    margin: 0;

    .el-dialog__title {
      color: white;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      .el-dialog__close {
        color: white;
        font-size: 18px;

        &:hover {
          color: #f0f0f0;
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    background: #f8f9fa;
    border-top: 1px solid #e8e8e8;
    margin: 0;
  }

  .pdf-preview-container {
    height: 70vh;
    min-height: 500px;
  }

  .pdf-viewer {
    width: 100%;
    height: 100%;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
    background: #fff;
  }

  .pdf-embed {
    border: none;
    display: block;
  }

  .pdf-fallback {
    display: none;
    text-align: center;
    padding: 40px 20px;
    color: #606266;

    p {
      margin-bottom: 20px;
      font-size: 14px;
    }
  }

  .preview-loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #909399;

    p {
      margin-top: 16px;
      font-size: 14px;
    }
  }

  .error-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #f56c6c;
    text-align: center;
    padding: 20px;

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .error-message {
      font-size: 16px;
      margin-bottom: 20px;
      line-height: 1.5;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-info {
      font-size: 14px;
      color: #666;
    }

    .footer-actions {
      display: flex;
      gap: 12px;
    }
  }
}

/* 当embed不支持时显示备用方案 */
.pdf-embed:not([src]) + .pdf-fallback,
.pdf-embed[src=""] + .pdf-fallback {
  display: block;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-preview-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      height: 90vh;
    }

    .pdf-preview-container {
      height: 60vh;
      min-height: 400px;
    }

    .dialog-footer {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .footer-info {
        text-align: center;
      }

      .footer-actions {
        justify-content: center;
        width: 100%;
      }
    }
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .pdf-preview-dialog {
    .pdf-viewer {
      background: #2d2d2d;
      border-color: #404040;
    }

    .footer-info {
      color: #909399;
    }

    .dialog-footer {
      border-top-color: #404040;
    }
  }
}
</style>