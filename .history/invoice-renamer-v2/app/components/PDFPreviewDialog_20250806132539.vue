<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="updateVisible"
    :title="dialogTitle"
    width="90%"
    top="5vh"
    class="pdf-preview-dialog"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="dialog-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="file-info">
            <el-icon class="file-icon"><Document /></el-icon>
            <span class="file-name">{{ currentFile?.name || '未知文件' }}</span>
            <el-tag v-if="currentFile" size="small" type="info">
              {{ formatFileSize(currentFile.size) }}
            </el-tag>
          </div>
        </div>

        <div class="toolbar-center">
          <div class="page-controls">
            <el-button 
              size="small" 
              :disabled="currentPage <= 1"
              @click="prevPage"
            >
              <el-icon><ArrowLeft /></el-icon>
              上一页
            </el-button>
            
            <div class="page-info">
              <el-input-number
                v-model="currentPage"
                :min="1"
                :max="Math.max(1, totalPages)"
                size="small"
                controls-position="right"
                @change="goToPage"
                style="width: 80px"
                :disabled="totalPages === 0"
              />
              <span class="page-separator">/</span>
              <span class="total-pages">{{ totalPages }}</span>
            </div>

            <el-button 
              size="small" 
              :disabled="currentPage >= totalPages"
              @click="nextPage"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="toolbar-right">
          <div class="zoom-controls">
            <el-button 
              size="small" 
              @click="zoomOut"
              :disabled="typeof scale === 'number' && scale <= 0.5"
            >
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            
            <el-select 
              v-model="scale" 
              size="small" 
              style="width: 100px"
              @change="updateScale"
            >
              <el-option label="50%" :value="0.5" />
              <el-option label="75%" :value="0.75" />
              <el-option label="100%" :value="1.0" />
              <el-option label="125%" :value="1.25" />
              <el-option label="150%" :value="1.5" />
              <el-option label="200%" :value="2.0" />
              <el-option label="适合宽度" value="fit-width" />
              <el-option label="适合页面" value="fit-page" />
            </el-select>

            <el-button 
              size="small" 
              @click="zoomIn"
              :disabled="typeof scale === 'number' && scale >= 3.0"
            >
              <el-icon><ZoomIn /></el-icon>
            </el-button>
          </div>

          <el-button 
            size="small" 
            type="primary"
            @click="downloadFile"
          >
            <el-icon><Download /></el-icon>
            下载
          </el-button>
        </div>
      </div>

      <!-- PDF 预览区域 -->
      <div class="preview-container" ref="previewContainer">
        <div v-if="isLoading" class="loading-container">
          <el-loading-spinner />
          <p>正在加载 PDF...</p>
        </div>

        <div v-else-if="error" class="error-container">
          <el-icon class="error-icon"><WarningFilled /></el-icon>
          <p class="error-message">{{ error }}</p>
          <el-button type="primary" @click="retryLoad">重新加载</el-button>
        </div>

        <div v-else class="pdf-viewer" :style="viewerStyle">
          <canvas 
            ref="pdfCanvas"
            class="pdf-canvas"
            :style="canvasStyle"
          ></canvas>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <span v-if="currentFile">
            文件大小: {{ formatFileSize(currentFile.size) }} | 
            页数: {{ totalPages }} | 
            缩放: {{ Math.round(actualScale * 100) }}%
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="primary" @click="downloadFile">
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
import * as pdfjsLib from 'pdfjs-dist'

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
    pdfDocument.value.destroy()
    pdfDocument.value = null
  }
  currentPage.value = 1
  totalPages.value = 0
  error.value = ''
}

const loadPDF = async () => {
  if (!currentFile.value) return

  isLoading.value = true
  error.value = ''

  try {
    // 设置 PDF.js worker
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    }

    const arrayBuffer = await currentFile.value.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    
    pdfDocument.value = await loadingTask.promise
    totalPages.value = pdfDocument.value.numPages
    currentPage.value = 1

    await nextTick()
    updateContainerSize()
    await renderPage()
  } catch (err) {
    console.error('PDF loading error:', err)
    error.value = '无法加载 PDF 文件，请检查文件是否损坏'
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