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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  Document,
  ArrowLeft,
  ArrowRight,
  ZoomOut,
  ZoomIn,
  Download,
  WarningFilled,
} from '@element-plus/icons-vue'
import { getPdfjs } from '~/utils/pdfWorkerManager'

// 定义接口
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

// Refs
const previewContainer = ref<HTMLElement>()
const pdfCanvas = ref<HTMLCanvasElement>()

// 响应式数据
const isLoading = ref(false)
const error = ref('')
const pdfDocument = ref<any>(null)
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref<number | string>(1.0)
const actualScale = ref(1.0)
const containerWidth = ref(800)
const containerHeight = ref(600)

// 计算属性
const currentFile = computed(() => props.file)

const dialogTitle = computed(() => {
  return props.fileName || currentFile.value?.name || 'PDF 预览'
})

const viewerStyle = computed(() => ({
  width: '100%',
  height: `${containerHeight.value}px`,
  overflow: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: '20px',
  background: '#f5f5f5'
}))

const canvasStyle = computed(() => ({
  maxWidth: '100%',
  height: 'auto',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  background: 'white'
}))

// 监听器
watch(() => props.visible, (newVal) => {
  if (newVal && currentFile.value) {
    loadPDF()
  }
})

watch(() => props.file, (newFile) => {
  if (newFile && props.visible) {
    loadPDF()
  }
})

watch(currentPage, () => {
  if (pdfDocument.value) {
    renderPage()
  }
})

watch(scale, () => {
  updateScale()
})

// 方法
const updateVisible = (value: boolean) => {
  emit('update:visible', value)
  if (!value) {
    cleanup()
  }
}

const handleClose = () => {
  updateVisible(false)
}

const cleanup = () => {
  if (pdfDocument.value) {
    try {
      pdfDocument.value.destroy()
    } catch (err) {
      console.warn('Error destroying PDF document:', err)
    }
    pdfDocument.value = null
  }
  currentPage.value = 1
  totalPages.value = 0
  error.value = ''
  isLoading.value = false
  
  // 清理canvas
  if (pdfCanvas.value) {
    const context = pdfCanvas.value.getContext('2d')
    if (context) {
      context.clearRect(0, 0, pdfCanvas.value.width, pdfCanvas.value.height)
    }
  }
}

const loadPDF = async () => {
  if (!currentFile.value) return

  // 清理之前的文档
  cleanup()
  
  isLoading.value = true
  error.value = ''

  try {
    // 获取初始化的 PDF.js 实例
    const pdfjsLib = await getPdfjs()

    const arrayBuffer = await currentFile.value.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: '/cmaps/',
      cMapPacked: true
    })
    
    pdfDocument.value = await loadingTask.promise
    totalPages.value = pdfDocument.value.numPages || 0
    currentPage.value = totalPages.value > 0 ? 1 : 0

    if (totalPages.value > 0) {
      await nextTick()
      updateContainerSize()
      await renderPage()
    } else {
      error.value = 'PDF 文件没有页面内容'
    }
  } catch (err) {
    console.error('PDF loading error:', err)
    
    // 根据错误类型提供更具体的错误信息
    if (err instanceof Error) {
      if (err.message.includes('Invalid PDF')) {
        error.value = 'PDF 文件格式无效或已损坏'
      } else if (err.message.includes('password')) {
        error.value = 'PDF 文件受密码保护，暂不支持'
      } else if (err.message.includes('network')) {
        error.value = '网络连接错误，请检查网络后重试'
      } else {
        error.value = `加载失败: ${err.message}`
      }
    } else {
      error.value = '遇到处理错误，请重试'
    }
    
    totalPages.value = 0
    currentPage.value = 0
  } finally {
    isLoading.value = false
  }
}

const renderPage = async () => {
  if (!pdfDocument.value || !pdfCanvas.value) return

  try {
    const page = await pdfDocument.value.getPage(currentPage.value)
    const viewport = page.getViewport({ scale: actualScale.value })

    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')
    
    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }

    // 确保之前的渲染任务已完成
    if (page._renderTasks && page._renderTasks.length > 0) {
      await Promise.all(page._renderTasks.map((task: any) => task.promise.catch(() => {})))
    }

    const renderTask = page.render(renderContext)
    await renderTask.promise
  } catch (err) {
    console.error('Page rendering error:', err)
    error.value = '渲染页面时出错'
  }
}

const updateContainerSize = () => {
  if (previewContainer.value) {
    const rect = previewContainer.value.getBoundingClientRect()
    containerWidth.value = rect.width
    containerHeight.value = Math.max(600, window.innerHeight - 300)
  }
}

const updateScale = async () => {
  if (!pdfDocument.value) return

  if (scale.value === 'fit-width') {
    await calculateFitWidthScale()
  } else if (scale.value === 'fit-page') {
    await calculateFitPageScale()
  } else {
    actualScale.value = Number(scale.value)
  }

  await renderPage()
}

const calculateFitWidthScale = async () => {
  if (!pdfDocument.value) return

  try {
    const page = await pdfDocument.value.getPage(currentPage.value)
    const viewport = page.getViewport({ scale: 1.0 })
    const availableWidth = containerWidth.value - 40 // 减去 padding
    actualScale.value = availableWidth / viewport.width
  } catch (err) {
    console.error('Calculate fit width scale error:', err)
    actualScale.value = 1.0
  }
}

const calculateFitPageScale = async () => {
  if (!pdfDocument.value) return

  try {
    const page = await pdfDocument.value.getPage(currentPage.value)
    const viewport = page.getViewport({ scale: 1.0 })
    const availableWidth = containerWidth.value - 40
    const availableHeight = containerHeight.value - 40
    
    const scaleX = availableWidth / viewport.width
    const scaleY = availableHeight / viewport.height
    actualScale.value = Math.min(scaleX, scaleY)
  } catch (err) {
    console.error('Calculate fit page scale error:', err)
    actualScale.value = 1.0
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const zoomIn = () => {
  if (actualScale.value < 3.0) {
    const newScale = Math.min(3.0, actualScale.value * 1.25)
    scale.value = newScale
    actualScale.value = newScale
    renderPage()
  }
}

const zoomOut = () => {
  if (actualScale.value > 0.5) {
    const newScale = Math.max(0.5, actualScale.value * 0.8)
    scale.value = newScale
    actualScale.value = newScale
    renderPage()
  }
}

const downloadFile = () => {
  if (currentFile.value) {
    emit('download', currentFile.value)
  }
}

const retryLoad = () => {
  loadPDF()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      prevPage()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextPage()
      break
    case 'Escape':
      event.preventDefault()
      handleClose()
      break
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
  }
}

// 窗口大小变化处理
const handleResize = () => {
  updateContainerSize()
  if (scale.value === 'fit-width' || scale.value === 'fit-page') {
    updateScale()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
  cleanup()
})
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