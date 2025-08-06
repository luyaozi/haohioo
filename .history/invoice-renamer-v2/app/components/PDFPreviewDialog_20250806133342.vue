<template>
  <el-dialog
    v-model="visible"
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
  return props.fileName || currentFile.value?.name || 'PDF 预览'
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
    previewUrl.value = createPdfPreviewUrl(currentFile.value)
    
  } catch (err: any) {
    console.error('PDF preview error:', err)
    error.value = `预览失败: ${err.message || '未知错误'}`
  } finally {
    isLoading.value = false
  }
}

const openPdfInNewWindow = () => {
  if (currentFile.value) {
    openPdfInNewWindow(currentFile.value)
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

  .dialog-content {
    height: 100%;
    display: flex;
    flex-direction: column;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: white;
      border-bottom: 1px solid #e8e8e8;
      gap: 16px;

      .toolbar-left {
        flex: 1;
        min-width: 0;

        .file-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .file-icon {
            color: #667eea;
            font-size: 18px;
          }

          .file-name {
            font-weight: 500;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      .toolbar-center {
        .page-controls {
          display: flex;
          align-items: center;
          gap: 8px;

          .page-info {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;

            .page-separator {
              color: #999;
              margin: 0 4px;
            }

            .total-pages {
              color: #666;
              font-weight: 500;
            }
          }
        }
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }

    .preview-container {
      flex: 1;
      overflow: hidden;
      position: relative;

      .loading-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: #666;

        p {
          margin-top: 16px;
          font-size: 16px;
        }
      }

      .error-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: #ff4d4f;

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .error-message {
          font-size: 16px;
          margin-bottom: 24px;
          text-align: center;
        }
      }

      .pdf-viewer {
        .pdf-canvas {
          border-radius: 8px;
        }
      }
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

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-preview-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      height: 90vh;
    }

    .dialog-content {
      .toolbar {
        flex-direction: column;
        gap: 12px;
        padding: 12px 16px;

        .toolbar-left,
        .toolbar-center,
        .toolbar-right {
          width: 100%;
          justify-content: center;
        }

        .toolbar-left {
          .file-info {
            justify-content: flex-start;
          }
        }

        .toolbar-right {
          .zoom-controls {
            justify-content: center;
          }
        }
      }
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
      }
    }
  }
}
</style>