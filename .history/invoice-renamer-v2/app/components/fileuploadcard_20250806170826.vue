<template>
  <div class="file-upload-card">
    <el-card class="upload-card" shadow="hover">
      <div class="upload-content">
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          :file-list="fileList"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :before-upload="beforeUpload"
          :auto-upload="false"
          multiple
          accept=".pdf"
          :show-file-list="false"
        >
          <div class="upload-area">
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">
              <p class="upload-title">文件上传</p>
              <p class="upload-subtitle">支持批量上传PDF发票文件</p>
              <p class="upload-hint">点击或拖拽文件到此区域上传</p>
            </div>
          </div>
        </el-upload>

        <!-- 文件列表 -->
        <!-- <div v-if="fileList.length > 0" class="file-list">
          <div class="file-list-header">
            <span class="file-count">已选择 {{ fileList.length }} 个文件</span>
            <el-button type="danger" size="small" text @click="clearAllFiles">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>

          <div class="file-items">
            <div
              v-for="(file, index) in fileList"
              :key="file.uid"
              class="file-item"
            >
              <div class="file-info">
                <el-icon class="file-icon"><Document /></el-icon>
                <div class="file-details">
                  <div class="file-name" :title="file.name">
                    {{ file.name }}
                  </div>
                  <div class="file-size">{{ formatFileSize(file.size) }}</div>
                </div>
              </div>

              <div class="file-actions">
                <el-button
                  type="danger"
                  size="small"
                  text
                  @click="removeFile(index)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div> -->

        <!-- 上传提示 -->
        <div v-if="fileList.length === 0" class="upload-tips">
          <div class="tip-item">
            <el-icon><InfoFilled /></el-icon>
            <span>支持同时选择多个PDF文件进行批量上传</span>
          </div>
          <div class="tip-item">
            <el-icon><InfoFilled /></el-icon>
            <span>文件大小建议不超过 10MB，确保解析效果</span>
          </div>
          <div class="tip-item">
            <el-icon><InfoFilled /></el-icon>
            <span>支持标准增值税发票、普通发票等格式</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { ElMessage } from "element-plus"
import {
  UploadFilled,
  Document,
  Delete,
  Close,
  InfoFilled,
} from "@element-plus/icons-vue"

// Props
interface Props {
  fileList: any[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  "file-change": [file: any, fileList: any[]]
}>()

// Refs
const uploadRef = ref()

// 内部文件列表
const internalFileList = ref<any[]>([])

// 计算属性
const fileList = computed(() => props.fileList)

// 文件变化处理
const handleFileChange = (file: any, fileList: any[]) => {
  console.log("文件变化:", file.name, fileList.length)

  // 验证文件类型
  if (file.raw && file.raw.type !== "application/pdf") {
    ElMessage.error(`文件 ${file.name} 不是PDF格式`)
    return false
  }

  // 验证文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.raw && file.raw.size > maxSize) {
    ElMessage.error(`文件 ${file.name} 大小超过 10MB`)
    return false
  }

  // 更新内部文件列表
  internalFileList.value = fileList

  // 发出事件
  emit("file-change", file, fileList)
}

// 文件移除处理
const handleFileRemove = (file: any, fileList: any[]) => {
  console.log("移除文件:", file.name)
  internalFileList.value = fileList
}

// 上传前验证
const beforeUpload = (file: File) => {
  // 验证文件类型
  if (file.type !== "application/pdf") {
    ElMessage.error(`文件 ${file.name} 不是PDF格式`)
    return false
  }

  // 验证文件大小
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    ElMessage.error(`文件 ${file.name} 大小超过 10MB`)
    return false
  }

  return true
}

// 移除单个文件
const removeFile = (index: number) => {
  const newFileList = [...internalFileList.value]
  newFileList.splice(index, 1)
  internalFileList.value = newFileList

  // 更新上传组件的文件列表
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
    newFileList.forEach((file) => {
      uploadRef.value.handleStart(file.raw)
    })
  }
}

// 清空所有文件
const clearAllFiles = () => {
  internalFileList.value = []
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return size + " B"
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + " KB"
  } else {
    return (size / (1024 * 1024)).toFixed(1) + " MB"
  }
}
</script>

<style lang="scss" scoped>
.file-upload-card {
  margin-bottom: 24px;

  .upload-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 4px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    :deep(.el-card__body) {
      padding: 24px;
    }
  }

  .upload-content {
    .upload-dragger {
      :deep(.el-upload-dragger) {
        width: 100%;
        height: 180px;
        border: 2px dashed #d9d9d9;
        border-radius: 12px;
        background: #fafafa;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          border-color: #667eea;
          background: #f0f2ff;
        }
      }

      :deep(.el-upload-dragger.is-dragover) {
        border-color: #667eea;
        background: #f0f2ff;
      }
    }

    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;

      .upload-icon {
        font-size: 48px;
        color: #8c8c8c;
        margin-bottom: 16px;
      }

      .upload-text {
        .upload-title {
          font-size: 18px;
          color: #333;
          margin: 0 0 4px 0;
          font-weight: 600;
        }

        .upload-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0 0 8px 0;
        }

        .upload-hint {
          font-size: 13px;
          color: #999;
          margin: 0;
        }
      }
    }

    .file-list {
      margin-top: 24px;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      overflow: hidden;

      .file-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #e8e8e8;

        .file-count {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
      }

      .file-items {
        max-height: 200px;
        overflow-y: auto;

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: #f8f9fa;
          }

          .file-info {
            display: flex;
            align-items: center;
            flex: 1;
            min-width: 0;

            .file-icon {
              font-size: 20px;
              color: #ff4757;
              margin-right: 12px;
              flex-shrink: 0;
            }

            .file-details {
              flex: 1;
              min-width: 0;

              .file-name {
                font-size: 14px;
                color: #333;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 2px;
              }

              .file-size {
                font-size: 12px;
                color: #999;
              }
            }
          }

          .file-actions {
            flex-shrink: 0;
          }
        }
      }
    }

    .upload-tips {
      margin-top: 16px;
      padding: 12px 14px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid #667eea;

      .tip-item {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
        font-size: 12px;
        color: #666;
        line-height: 1.4;

        &:last-child {
          margin-bottom: 0;
        }

        .el-icon {
          margin-right: 6px;
          color: #667eea;
          font-size: 14px;
          flex-shrink: 0;
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-upload-card {
    .upload-content {
      .upload-dragger {
        :deep(.el-upload-dragger) {
          height: 140px;
        }
      }

      .upload-area {
        .upload-icon {
          font-size: 36px;
          margin-bottom: 12px;
        }

        .upload-text {
          .upload-title {
            font-size: 14px;
          }

          .upload-hint {
            font-size: 12px;
          }
        }
      }

      .file-list {
        .file-items {
          .file-item {
            padding: 10px 12px;

            .file-info {
              .file-icon {
                font-size: 18px;
                margin-right: 10px;
              }

              .file-details {
                .file-name {
                  font-size: 13px;
                }

                .file-size {
                  font-size: 11px;
                }
              }
            }
          }
        }
      }

      .upload-tips {
        margin-top: 12px;
        padding: 10px 12px;

        .tip-item {
          font-size: 11px;
          margin-bottom: 3px;

          .el-icon {
            font-size: 12px;
            margin-right: 5px;
          }
        }
      }
    }
  }
}
</style>
