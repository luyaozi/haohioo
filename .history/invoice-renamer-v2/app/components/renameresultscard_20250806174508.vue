<template>
  <div class="rename-results-card">
    <el-card class="results-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><DocumentCopy /></el-icon>
            <span class="header-title">重命名结果</span>
            <el-tag v-if="renameResults.length > 0" type="success" size="small">
              {{ renameResults.length }} 个文件
            </el-tag>
          </div>
          <div>
            <el-button
              v-if="renameResults.length > 0"
              type="primary"
              size="small"
              @click="downloadAll"
              :loading="isDownloading"
            >
              <el-icon><Download /></el-icon>
              打包下载ZIP
            </el-button>
          </div>
        </div>
      </template>

      <div class="results-content">
        <!-- 结果列表 -->
        <div v-if="renameResults.length > 0" class="results-list">
          <div
            v-for="(result, index) in renameResults"
            :key="index"
            class="result-item"
            :class="{ 'has-error': result.error }"
          >
            <div class="result-icon">
              <el-icon v-if="result.error" class="error-icon"
                ><WarningFilled
              /></el-icon>
              <el-icon v-else class="success-icon"
                ><CircleCheckFilled
              /></el-icon>
            </div>

            <div class="result-content">
              <div class="file-names">
                <div class="original-name">
                  <span class="label">原文件名:</span>
                  <span class="name">{{ result.originalName }}</span>
                </div>
                <div class="arrow">
                  <el-icon><Right /></el-icon>
                </div>
                <div class="new-name">
                  <span class="label">新文件名:</span>
                  <span class="name" :class="{ 'error-name': result.error }">
                    {{ result.newName }}
                  </span>
                </div>
              </div>

              <!-- 错误信息 -->
              <div v-if="result.error" class="error-message">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ result.error }}</span>
              </div>

              <!-- 文件信息 -->
              <div class="file-info">
                <div class="info-item">
                  <span class="info-label">文件大小:</span>
                  <span class="info-value">{{
                    formatFileSize(result.size)
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">处理时间:</span>
                  <span class="info-value">{{
                    formatDate(result.processTime)
                  }}</span>
                </div>
                <div v-if="result.invoiceNumber" class="info-item">
                  <span class="info-label">发票号码:</span>
                  <span class="info-value">{{ result.invoiceNumber }}</span>
                </div>
              </div>
            </div>

            <div class="result-actions">
              <el-button
                v-if="!result.error"
                type="primary"
                size="small"
                text
                @click="downloadSingle(result)"
                :loading="result.downloading"
              >
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button
                type="info"
                size="small"
                text
                @click="previewFile(result)"
              >
                <el-icon><View /></el-icon>
                预览
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="removeResult(index)"
              >
                <el-icon><Delete /></el-icon>
                移除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-results">
          <el-empty description="暂无重命名结果">
            <template #image>
              <el-icon class="empty-icon"><DocumentCopy /></el-icon>
            </template>
            <template #description>
              <p>完成文件重命名后，结果将在这里显示</p>
            </template>
          </el-empty>
        </div>

        <!-- 统计信息 -->
        <div v-if="renameResults.length > 0" class="results-summary">
          <div class="summary-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>处理统计</span>
          </div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-icon total">
                <el-icon><DocumentCopy /></el-icon>
              </div>
              <div class="summary-info">
                <div class="summary-value">{{ renameResults.length }}</div>
                <div class="summary-label">总文件数</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon success">
                <el-icon><CircleCheckFilled /></el-icon>
              </div>
              <div class="summary-info">
                <div class="summary-value">{{ successCount }}</div>
                <div class="summary-label">成功</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon error">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div class="summary-info">
                <div class="summary-value">{{ errorCount }}</div>
                <div class="summary-label">失败</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon size">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="summary-info">
                <div class="summary-value">{{ formatFileSize(totalSize) }}</div>
                <div class="summary-label">总大小</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import {
  DocumentCopy,
  Download,
  WarningFilled,
  CircleCheckFilled,
  Right,
  View,
  Delete,
  DataAnalysis,
  Operation,
  RefreshRight,
} from "@element-plus/icons-vue"

// 定义接口
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

// Props
interface Props {
  renameResults: RenameResult[]
  isDownloading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  "download-single": [result: RenameResult]
  "download-all-files": []
  "preview-file": [result: RenameResult]
  "remove-result": [index: number]
  "retry-errors": []
  "clear-all": []
}>()

// 计算属性
const successCount = computed(() => {
  return props.renameResults.filter((result) => !result.error).length
})

const errorCount = computed(() => {
  return props.renameResults.filter((result) => result.error).length
})

const totalSize = computed(() => {
  return props.renameResults.reduce((total, result) => total + result.size, 0)
})

// 方法
const downloadSingle = (result: RenameResult) => {
  emit("download-single", result)
}

const downloadAll = () => {
  emit("download-all-files")
}

const previewFile = (result: RenameResult) => {
  emit("preview-file", result)
}

const removeResult = (index: number) => {
  emit("remove-result", index)
}

const retryErrors = () => {
  emit("retry-errors")
}

const clearAll = () => {
  emit("clear-all")
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// 格式化日期
const formatDate = (date: Date | undefined): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "未知时间"
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
</script>

<style lang="scss" scoped>
.rename-results-card {
  margin-bottom: 24px;

  .results-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 4px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    :deep(.el-card__header) {
      // background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
      border-bottom: 1px solid #e8e8e8;
      padding: 20px 24px;
    }

    :deep(.el-card__body) {
      padding: 24px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    // color: white;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        font-size: 20px;
      }

      .header-title {
        font-size: 18px;
        font-weight: 600;
      }
    }

    .header-actions {
      .el-button {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }
      }
    }
  }

  .results-content {
    .results-list {
      .result-item {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
        margin-bottom: 16px;
        background: #f8f9fa;
        border: 1px solid #e8e8e8;
        border-radius: 12px;
        transition: all 0.3s ease;

        &:last-child {
          margin-bottom: 0;
        }

        &:hover {
          background: #f0f9ff;
          border-color: #52c41a;
        }

        &.has-error {
          background: #fff2f0;
          border-color: #ffccc7;

          &:hover {
            background: #fff1f0;
            border-color: #ff7875;
          }
        }

        .result-icon {
          margin-top: 4px;

          .success-icon {
            color: #52c41a;
            font-size: 20px;
          }

          .error-icon {
            color: #ff4d4f;
            font-size: 20px;
          }
        }

        .result-content {
          flex: 1;
          min-width: 0;

          .file-names {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 12px;
            flex-wrap: wrap;

            .original-name,
            .new-name {
              display: flex;
              flex-direction: column;
              gap: 4px;
              flex: 1;
              min-width: 200px;

              .label {
                font-size: 12px;
                color: #999;
                font-weight: 500;
              }

              .name {
                font-size: 14px;
                color: #333;
                font-weight: 500;
                word-break: break-all;
                font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;

                &.error-name {
                  color: #ff4d4f;
                }
              }
            }

            .arrow {
              color: #999;
              font-size: 16px;
              margin-top: 16px;
            }
          }

          .error-message {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #fff2f0;
            border: 1px solid #ffccc7;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 13px;
            color: #ff4d4f;

            .el-icon {
              font-size: 16px;
            }
          }

          .file-info {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;

            .info-item {
              display: flex;
              gap: 8px;
              font-size: 13px;

              .info-label {
                color: #999;
                font-weight: 500;
              }

              .info-value {
                color: #333;
                font-weight: 500;
              }
            }
          }
        }

        .result-actions {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 4px;
          align-items: baseline;
        }
      }
    }

    .empty-results {
      text-align: center;
      padding: 40px 20px;

      .empty-icon {
        font-size: 64px;
        color: #d9d9d9;
      }

      :deep(.el-empty__description) {
        color: #999;
        margin-bottom: 16px;
      }
    }

    .results-summary {
      margin-top: 24px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);

      .summary-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        font-size: 16px;
        font-weight: 600;
        color: #333;

        .el-icon {
          color: #6366f1;
          font-size: 18px;
        }
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;

        .summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .summary-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;

            &.total {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }

            &.success {
              background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
              color: white;
            }

            &.error {
              background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
              color: white;
            }

            &.size {
              background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
              color: white;
            }
          }

          .summary-info {
            flex: 1;

            .summary-value {
              font-size: 20px;
              font-weight: 700;
              color: #333;
              line-height: 1.2;
              margin-bottom: 4px;
            }

            .summary-label {
              font-size: 12px;
              color: #666;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          }
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rename-results-card {
    .card-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .header-left {
        width: 100%;
      }

      .header-actions {
        width: 100%;
        display: flex;
        justify-content: flex-end;
      }
    }

    .results-content {
      .results-list {
        .result-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;

          .result-content {
            width: 100%;

            .file-names {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;

              .original-name,
              .new-name {
                width: 100%;
                min-width: auto;
              }

              .arrow {
                align-self: center;
                margin-top: 0;
                transform: rotate(90deg);
              }
            }

            .file-info {
              flex-direction: column;
              gap: 8px;
            }
          }

          .result-actions {
            width: 100%;
            flex-direction: row;
            justify-content: flex-end;
          }
        }
      }

      .results-summary {
        .summary-content {
          flex-direction: column;
          gap: 12px;
        }
      }

      .batch-actions {
        .actions-content {
          flex-direction: column;
          gap: 8px;

          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
