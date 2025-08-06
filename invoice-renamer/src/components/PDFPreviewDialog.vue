<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="`预览: ${currentPreviewFile?.fileName || ''}`"
    width="85%"
    top="3vh"
    :close-on-click-modal="false"
    @close="closePreview"
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
      <div v-else class="preview-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>正在加载预览...</p>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closePreview">关闭</el-button>
        <el-button type="primary" @click="downloadCurrentFile">
          下载文件
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'PDFPreviewDialog',
  components: {
    Loading
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentPreviewFile: {
      type: Object,
      default: null
    },
    previewUrl: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible', 'close-preview', 'open-pdf-in-new-window', 'download-current-file'],
  setup(props, { emit }) {
    const closePreview = () => {
      emit('close-preview')
      emit('update:visible', false)
    }

    const openPdfInNewWindow = () => {
      emit('open-pdf-in-new-window')
    }

    const downloadCurrentFile = () => {
      emit('download-current-file')
    }

    return {
      closePreview,
      openPdfInNewWindow,
      downloadCurrentFile
    }
  }
}
</script>

<style scoped>
/* PDF预览对话框样式 */
.pdf-preview-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pdf-preview-dialog :deep(.el-dialog__header) {
  background: linear-gradient(
    135deg,
    rgba(103, 126, 234, 0.9) 0%,
    rgba(118, 75, 162, 0.9) 100%
  );
  padding: 24px 32px;
  margin: 0;
  border-radius: 20px 20px 0 0;
}

.pdf-preview-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.pdf-preview-dialog :deep(.el-dialog__headerbtn) {
  top: 24px;
  right: 32px;
}

.pdf-preview-dialog :deep(.el-dialog__close) {
  color: white;
  font-size: 20px;
  transition: all 0.3s ease;
}

.pdf-preview-dialog :deep(.el-dialog__close:hover) {
  color: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
}

.pdf-preview-dialog :deep(.el-dialog__body) {
  padding: 24px 32px;
  background: transparent;
}

.pdf-preview-dialog :deep(.el-dialog__footer) {
  background: rgba(248, 250, 252, 0.8);
  padding: 20px 32px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
}

/* PDF预览容器 */
.pdf-preview-container {
  width: 100%;
  height: 600px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.8);
  position: relative;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  position: relative;
}

.pdf-embed {
  border: none;
  border-radius: 12px;
  background: white;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* PDF备用方案 */
.pdf-fallback {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
}

.pdf-fallback p {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
}

.pdf-fallback .el-button {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.pdf-fallback .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

/* 加载状态 */
.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.preview-loading .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #6366f1;
}

.preview-loading p {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

/* 对话框底部按钮 */
.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-footer .el-button {
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.dialog-footer .el-button:not(.el-button--primary) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.8);
  color: #374151;
  backdrop-filter: blur(10px);
}

.dialog-footer .el-button:not(.el-button--primary):hover {
  background: rgba(248, 250, 252, 0.9);
  border-color: rgba(156, 163, 175, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dialog-footer .el-button--primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
}

.dialog-footer .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-preview-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }

  .pdf-preview-dialog :deep(.el-dialog__header),
  .pdf-preview-dialog :deep(.el-dialog__body),
  .pdf-preview-dialog :deep(.el-dialog__footer) {
    padding-left: 20px;
    padding-right: 20px;
  }

  .pdf-preview-container {
    height: 500px;
  }

  .pdf-fallback {
    bottom: 10px;
    left: 10px;
    right: 10px;
    transform: none;
    padding: 12px 16px;
  }

  .pdf-fallback p {
    font-size: 13px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-footer .el-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .pdf-preview-dialog :deep(.el-dialog) {
    width: 98% !important;
    top: 2vh !important;
  }

  .pdf-preview-container {
    height: 400px;
  }

  .preview-loading .el-icon {
    font-size: 36px;
  }

  .preview-loading p {
    font-size: 14px;
  }
}

/* 动画效果 */
.pdf-preview-dialog :deep(.el-dialog) {
  animation: dialogFadeIn 0.3s ease-out;
}

@keyframes dialogFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 加载动画 */
.preview-loading .is-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>