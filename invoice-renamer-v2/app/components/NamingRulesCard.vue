<template>
  <div class="naming-rules-card">
    <el-card class="rules-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><Setting /></el-icon>
            <span class="header-title">命名规则</span>
            <el-tag v-if="namingRules.length > 0" type="success" size="small">
              {{ namingRules.length }} 条规则
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="addRule">
              <el-icon><Plus /></el-icon>
              添加规则
            </el-button>
          </div>
        </div>
      </template>

      <div class="rules-content">
        <!-- 规则列表 -->
        <div
          v-if="namingRules.length > 0"
          class="rules-list"
          ref="rulesListRef"
        >
          <div
            v-for="(rule, index) in namingRules"
            :key="rule.id"
            class="rule-item"
            :class="{ 'is-dragging': isDragging }"
          >
            <div class="rule-drag-handle">
              <el-icon><Rank /></el-icon>
            </div>

            <div class="rule-content">
              <!-- 规则类型选择 -->
              <div class="rule-field">
                <label>类型:</label>
                <el-select
                  v-model="rule.type"
                  @change="onRuleTypeChange(index, $event)"
                  size="small"
                  style="width: 120px"
                >
                  <el-option label="字段" value="field" />
                  <el-option label="文本" value="text" />
                </el-select>
              </div>

              <!-- 字段选择 -->
              <div v-if="rule.type === 'field'" class="rule-field">
                <label>字段:</label>
                <el-select
                  v-model="rule.value"
                  size="small"
                  style="width: 150px"
                >
                  <el-option
                    v-for="field in invoiceFields"
                    :key="field.key"
                    :label="field.label"
                    :value="field.key"
                  />
                </el-select>
              </div>

              <!-- 文本输入 -->
              <div v-else-if="rule.type === 'text'" class="rule-field">
                <label>文本:</label>
                <el-input
                  v-model="rule.value"
                  size="small"
                  style="width: 150px"
                  placeholder="输入文本"
                />
              </div>

              <!-- 日期格式 -->
              <div v-else-if="rule.type === 'date'" class="rule-field">
                <label>格式:</label>
                <el-select
                  v-model="rule.value"
                  size="small"
                  style="width: 150px"
                >
                  <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                  <el-option label="YYYY年MM月DD日" value="YYYY年MM月DD日" />
                  <el-option label="YYYYMMDD" value="YYYYMMDD" />
                  <el-option label="MM-DD" value="MM-DD" />
                </el-select>
              </div>

              <!-- 预览 -->
              <div class="rule-preview">
                <span class="preview-label">预览:</span>
                <span class="preview-value">{{ getRulePreview(rule) }}</span>
              </div>
            </div>

            <div class="rule-actions">
              <el-button
                type="primary"
                size="small"
                text
                @click="addRuleAfter(index)"
              >
                <el-icon><Plus /></el-icon>
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="removeRule(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-rules">
          <el-empty description="暂无命名规则">
            <template #image>
              <el-icon class="empty-icon"><DocumentAdd /></el-icon>
            </template>
            <template #description>
              <p>点击"添加规则"开始设置文件命名规则</p>
            </template>
            <el-button type="primary" @click="addRule">
              <el-icon><Plus /></el-icon>
              添加第一条规则
            </el-button>
          </el-empty>
        </div>

        <!-- 完整预览 -->
        <div v-if="namingRules.length > 0" class="full-preview">
          <div class="preview-header">
            <el-icon><View /></el-icon>
            <span>完整预览</span>
          </div>
          <div class="preview-content">
            <div class="preview-item">
              <span class="preview-label">文件名格式:</span>
              <span class="preview-filename">{{ getFullPreview() }}</span>
            </div>
            <div v-if="invoiceData.length > 0" class="preview-examples">
              <span class="preview-label">示例:</span>
              <div class="example-list">
                <div
                  v-for="(example, index) in getExamples()"
                  :key="index"
                  class="example-item"
                >
                  <span class="original-name">{{ example.original }}</span>
                  <el-icon class="arrow-icon"><Right /></el-icon>
                  <span class="new-name">{{ example.new }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 规则提示 -->
        <div class="rules-tips">
          <div class="tip-item">
            <el-icon><InfoFilled /></el-icon>
            <span>拖拽左侧图标可以调整规则顺序</span>
          </div>
          <div class="tip-item">
            <el-icon><InfoFilled /></el-icon>
            <span>字段类型会从发票中提取对应信息</span>
          </div>
          <div class="tip-item">
            <el-icon><InfoFilled /></el-icon>
            <span>文本类型可以添加固定的分隔符或标识</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue"
import {
  Setting,
  Plus,
  Delete,
  Rank,
  View,
  Right,
  InfoFilled,
  DocumentAdd,
} from "@element-plus/icons-vue"

// 定义接口
interface NamingRule {
  id: string
  type: "field" | "text" | "date"
  value: string
  format?: string
}

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

interface InvoiceField {
  key: string
  label: string
}

// Props
interface Props {
  invoiceData: InvoiceData[]
  namingRules: NamingRule[]
  invoiceFields: InvoiceField[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  "add-naming-rule": []
  "add-naming-rule-after": [index: number]
  "remove-naming-rule": [index: number]
  "rule-type-change": [index: number, type: string]
  "update-naming-rules": [rules: NamingRule[]]
}>()

// Refs
const rulesListRef = ref()
const isDragging = ref(false)
let sortableInstance: any = null

// 添加规则
const addRule = () => {
  emit("add-naming-rule")
}

// 在指定位置后添加规则
const addRuleAfter = (index: number) => {
  emit("add-naming-rule-after", index)
}

// 移除规则
const removeRule = (index: number) => {
  emit("remove-naming-rule", index)
}

// 规则类型变化
const onRuleTypeChange = (index: number, type: string) => {
  emit("rule-type-change", index, type)
}

// 获取规则预览
const getRulePreview = (rule: NamingRule): string => {
  if (rule.type === "field") {
    const field = props.invoiceFields.find((f) => f.key === rule.value)
    return field ? `{${field.label}}` : "{字段}"
  } else if (rule.type === "text") {
    return rule.value || "{文本}"
  } else if (rule.type === "date") {
    const now = new Date()
    return formatDate(now, rule.value)
  }
  return ""
}

// 获取完整预览
const getFullPreview = (): string => {
  if (props.namingRules.length === 0) return ""

  let preview = ""
  for (const rule of props.namingRules) {
    preview += getRulePreview(rule)
  }
  return preview + ".pdf"
}

// 获取示例
const getExamples = () => {
  if (props.invoiceData.length === 0 || props.namingRules.length === 0)
    return []

  const examples = []
  const maxExamples = Math.min(3, props.invoiceData.length)

  for (let i = 0; i < maxExamples; i++) {
    const invoice = props.invoiceData[i]
    if (invoice) {
      const newName = generateFileName(invoice, props.namingRules)
      examples.push({
        original: invoice.fileName,
        new: newName,
      })
    }
  }

  return examples
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

// 初始化拖拽排序
onMounted(async () => {
  await nextTick()
  initSortable()
})

// 监听规则变化，重新初始化拖拽
watch(
  () => props.namingRules.length,
  async () => {
    await nextTick()
    initSortable()
  }
)

// 初始化拖拽排序
const initSortable = async () => {
  if (!rulesListRef.value) return

  // 销毁之前的实例
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }

  try {
    const Sortable = (await import("sortablejs")).default

    sortableInstance = Sortable.create(rulesListRef.value, {
      handle: ".rule-drag-handle",
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      onStart: () => {
        isDragging.value = true
      },
      onEnd: (evt: any) => {
        isDragging.value = false
        if (
          evt.oldIndex !== evt.newIndex &&
          evt.oldIndex !== undefined &&
          evt.newIndex !== undefined
        ) {
          const newRules = [...props.namingRules]
          const movedRule = newRules.splice(evt.oldIndex, 1)[0]
          if (movedRule) {
            newRules.splice(evt.newIndex, 0, movedRule)
            emit("update-naming-rules", newRules)
          }
        }
      },
    })
  } catch (error) {
    console.warn("Failed to initialize sortable:", error)
  }
}
</script>

<style lang="scss" scoped>
.naming-rules-card {
  margin-bottom: 24px;

  .rules-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 4px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    :deep(.el-card__header) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-bottom: none;
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
    color: white;

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

  .rules-content {
    .rules-list {
      .rule-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        margin-bottom: 12px;
        background: #f8f9fa;
        border: 1px solid #e8e8e8;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:last-child {
          margin-bottom: 0;
        }

        &:hover {
          background: #f0f2ff;
          border-color: #667eea;
        }

        &.is-dragging {
          opacity: 0.8;
        }

        .rule-drag-handle {
          cursor: move;
          color: #999;
          font-size: 16px;
          padding: 4px;

          &:hover {
            color: #667eea;
          }
        }

        .rule-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;

          .rule-field {
            display: flex;
            align-items: center;
            gap: 8px;

            label {
              font-size: 14px;
              color: #666;
              font-weight: 500;
              min-width: 40px;
            }
          }

          .rule-preview {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: auto;

            .preview-label {
              font-size: 13px;
              color: #999;
            }

            .preview-value {
              font-size: 13px;
              color: #333;
              background: white;
              padding: 4px 8px;
              border-radius: 4px;
              border: 1px solid #e8e8e8;
              font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
            }
          }
        }

        .rule-actions {
          display: flex;
          gap: 4px;
        }
      }
    }

    .empty-rules {
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

    .full-preview {
      margin-top: 24px;
      padding: 20px;
      background: linear-gradient(135deg, #f0f2ff 0%, #e8f4fd 100%);
      border-radius: 8px;
      border: 1px solid #d9e3ff;

      .preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
        color: #333;

        .el-icon {
          color: #667eea;
        }
      }

      .preview-content {
        .preview-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;

          .preview-label {
            font-size: 14px;
            color: #666;
            font-weight: 500;
            min-width: 80px;
          }

          .preview-filename {
            font-size: 14px;
            color: #333;
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e8e8e8;
            font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
            flex: 1;
          }
        }

        .preview-examples {
          .preview-label {
            font-size: 14px;
            color: #666;
            font-weight: 500;
            margin-bottom: 8px;
            display: block;
          }

          .example-list {
            .example-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 8px 12px;
              background: white;
              border-radius: 6px;
              border: 1px solid #e8e8e8;
              margin-bottom: 8px;

              &:last-child {
                margin-bottom: 0;
              }

              .original-name {
                font-size: 13px;
                color: #666;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .arrow-icon {
                color: #999;
                font-size: 14px;
                flex-shrink: 0;
              }

              .new-name {
                font-size: 13px;
                color: #333;
                font-weight: 500;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
              }

              /* 当容器宽度不足时，自动切换为垂直布局 */
              @media (max-width: 600px) {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;

                .original-name,
                .new-name {
                  white-space: normal;
                  word-break: break-all;
                  overflow: visible;
                  text-overflow: unset;
                  width: 100%;
                  flex: none;
                }

                .arrow-icon {
                  align-self: center;
                  transform: rotate(90deg);
                }
              }
            }
          }
        }
      }
    }

    .rules-tips {
      margin-top: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;

      .tip-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;
        color: #666;

        &:last-child {
          margin-bottom: 0;
        }

        .el-icon {
          margin-right: 8px;
          color: #667eea;
          font-size: 16px;
        }
      }
    }
  }
}

/* 拖拽样式 */
:deep(.sortable-ghost) {
  opacity: 0.5;
  background: #e8f4fd;
}

:deep(.sortable-chosen) {
  background: #f0f2ff;
}

:deep(.sortable-drag) {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .naming-rules-card {
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

    .rules-content {
      .rules-list {
        .rule-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;

          .rule-content {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;

            .rule-field {
              width: 100%;
              justify-content: space-between;

              :deep(.el-select),
              :deep(.el-input) {
                width: 200px !important;
              }
            }

            .rule-preview {
              width: 100%;
              margin-left: 0;
              justify-content: space-between;
            }
          }

          .rule-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      }

      .full-preview {
        .preview-content {
          .preview-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;

            .preview-filename {
              width: 100%;
            }
          }

          .preview-examples {
            .example-list {
              .example-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;

                .original-name,
                .new-name {
                  white-space: normal;
                  word-break: break-all;
                  overflow: visible;
                  text-overflow: unset;
                  width: 100%;
                }

                .arrow-icon {
                  align-self: center;
                  transform: rotate(90deg);
                }
              }
            }
          }
        }
      }

      .rules-tips {
        .tip-item {
          font-size: 11px;
        }
      }
    }
  }
}
</style>
