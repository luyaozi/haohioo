<template>
  <el-card v-if="invoiceData.length > 0" class="naming-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>⚙️ 设置命名规则</span>
        <el-text class="header-tip" size="small">
          💡 拖拽图标调整顺序，点击按钮添加/删除规则
        </el-text>
      </div>
    </template>

    <div class="naming-rules-container">
      <!-- 规则列表 -->
      <div v-if="namingRules.length > 0" class="rules-list" ref="rulesListRef">
        <div
          v-for="(rule, index) in namingRules"
          :key="`rule-${index}-${rule.id || index}`"
          class="rule-item-enhanced"
          :data-index="index"
        >
          <!-- 拖拽手柄 -->
          <div class="drag-handle-area">
            <el-icon class="drag-handle"><Rank /></el-icon>
          </div>

          <!-- 规则内容 -->
          <div class="rule-content-area">
            <el-select
              v-model="rule.type"
              placeholder="类型"
              style="width: 80px"
              @change="onRuleTypeChange(index)"
            >
              <el-option label="文本" value="input" />
              <el-option label="字段" value="select" />
            </el-select>

            <el-input
              v-if="rule.type === 'input'"
              v-model="rule.value"
              placeholder="输入文本内容"
              style="width: 200px; margin-left: 8px"
            />

            <el-select
              v-if="rule.type === 'select'"
              v-model="rule.value"
              placeholder="选择发票字段"
              style="width: 200px; margin-left: 8px"
            >
              <el-option
                v-for="field in invoiceFields"
                :key="field.key"
                :label="field.label"
                :value="field.key"
              />
            </el-select>
          </div>

          <!-- 操作按钮 -->
          <div class="rule-actions">
            <el-button
              type="success"
              size="small"
              circle
              @click="addNamingRuleAfter(index)"
              title="在此规则后添加新规则"
            >
              <el-icon><Plus /></el-icon>
            </el-button>

            <el-button
              type="danger"
              size="small"
              circle
              @click="removeNamingRule(index)"
              title="删除此规则"
              :disabled="namingRules.length === 1"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="no-rules">
        <el-empty description="暂无命名规则" :image-size="60">
          <el-button type="success" @click="addNamingRule">
            <el-icon><Plus /></el-icon>
            添加第一个规则
          </el-button>
        </el-empty>
      </div>

      <!-- 预览区域 -->
      <div v-if="namingRules.length > 0" class="rules-preview-section">
        <!-- 效果预览 - 只显示第一条数据 -->
        <div v-if="invoiceData.length > 0" class="effect-preview-card">
          <div class="effect-header">
            <div class="effect-icon">🎯</div>
            <span class="effect-title">重命名效果预览</span>
          </div>

          <div class="preview-format">
            <!-- 命名规则： -->
            <template
              v-for="(rule, index) in namingRules"
              :key="`rule-preview-${index}-${rule.id || index}`"
            >
              <span
                class="preview-segment"
                :class="{
                  'text-segment': rule.type === 'input',
                  'field-segment': rule.type === 'select',
                }"
              >
                {{ getRuleDisplayText(rule) }}
              </span>
              <span v-show="index < namingRules.length - 1"> + </span>
            </template>
          </div>
          <div class="effect-content">
            <div class="file-transformation">
              <div class="file-before">
                <div class="file-label">原文件名</div>
                <div class="file-name original">
                  {{ invoiceData[0].fileName }}
                </div>
              </div>
              <div class="transform-arrow">
                <el-icon><Right /></el-icon>
              </div>
              <div class="file-after">
                <div class="file-label">新文件名</div>
                <div class="file-name renamed">
                  {{ generateNewFileName(invoiceData[0]) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue"
import { Plus, Delete, Rank, Right } from "@element-plus/icons-vue"
import Sortable from "sortablejs"

export default {
  name: "NamingRulesCard",
  components: {
    Plus,
    Delete,
    Rank,
    Right,
  },
  props: {
    invoiceData: {
      type: Array,
      default: () => [],
    },
    namingRules: {
      type: Array,
      default: () => [],
    },
    invoiceFields: {
      type: Array,
      default: () => [],
    },
  },
  emits: [
    "add-naming-rule",
    "add-naming-rule-after",
    "remove-naming-rule",
    "rule-type-change",
    "update-naming-rules",
  ],
  setup(props, { emit }) {
    const rulesListRef = ref(null)
    let sortableInstance = null

    const addNamingRule = () => {
      emit("add-naming-rule")
      // 在添加规则后重新初始化拖动
      nextTick(() => {
        reinitSortable()
      })
    }

    const addNamingRuleAfter = (index) => {
      emit("add-naming-rule-after", index)
      // 在添加规则后重新初始化拖动
      nextTick(() => {
        reinitSortable()
      })
    }

    const removeNamingRule = (index) => {
      emit("remove-naming-rule", index)
      // 在删除规则后重新初始化拖动
      nextTick(() => {
        reinitSortable()
      })
    }

    const onRuleTypeChange = (index) => {
      emit("rule-type-change", index)
    }

    const getRuleDisplayText = (rule) => {
      if (rule.type === "input") {
        return rule.value || "[文本]"
      } else if (rule.type === "select") {
        const field = props.invoiceFields.find((f) => f.key === rule.value)
        return field ? field.label : "[字段]"
      }
      return "[未设置]"
    }

    const generateNewFileName = (invoiceInfo) => {
      if (!props.namingRules.length) return invoiceInfo.fileName

      let newName = ""
      props.namingRules.forEach((rule) => {
        if (rule.type === "input" && rule.value) {
          newName += rule.value
        } else if (
          rule.type === "select" &&
          rule.value &&
          invoiceInfo[rule.value]
        ) {
          newName += invoiceInfo[rule.value]
        }
      })

      return newName ? `${newName}.pdf` : invoiceInfo.fileName
    }

    const destroySortable = () => {
      if (sortableInstance) {
        sortableInstance.destroy()
        sortableInstance = null
      }
    }

    const initSortable = () => {
      if (rulesListRef.value && !sortableInstance) {
        sortableInstance = Sortable.create(rulesListRef.value, {
          handle: ".drag-handle",
          animation: 200,
          ghostClass: "sortable-ghost",
          chosenClass: "sortable-chosen",
          dragClass: "sortable-drag",
          onEnd: (evt) => {
            const { oldIndex, newIndex } = evt
            if (oldIndex !== newIndex) {
              const newRules = [...props.namingRules]
              const movedItem = newRules.splice(oldIndex, 1)[0]
              newRules.splice(newIndex, 0, movedItem)
              emit("update-naming-rules", newRules)
            }
          },
        })
      }
    }

    const reinitSortable = () => {
      destroySortable()
      nextTick(() => {
        initSortable()
      })
    }

    // 监听命名规则变化，重新初始化拖动
    watch(
      () => props.namingRules.length,
      () => {
        nextTick(() => {
          reinitSortable()
        })
      }
    )

    onMounted(() => {
      nextTick(() => {
        initSortable()
      })
    })

    onUnmounted(() => {
      destroySortable()
    })

    return {
      rulesListRef,
      addNamingRule,
      addNamingRuleAfter,
      removeNamingRule,
      onRuleTypeChange,
      getRuleDisplayText,
      generateNewFileName,
      initSortable,
    }
  },
}
</script>

<style scoped>
/* 卡片容器 - 现代化C端设计 */
.naming-card {
  margin-bottom: 24px;
  border-radius: 20px;
  border: none;
  box-shadow: 0 8px 40px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.naming-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.naming-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(255, 255, 255, 0.15);
}

.naming-card :deep(.el-card__header) {
  padding: calc(var(--el-card-padding) - 2px) var(--el-card-padding) 0;
}

/* 卡片头部 - 简约现代设计 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 20px;
  color: white;
  padding: 28px 32px;
  background: linear-gradient(
    135deg,
    rgba(103, 126, 234, 0.9) 0%,
    rgba(118, 75, 162, 0.9) 100%
  );
  margin: -20px -20px 0 -20px;
  position: relative;
  backdrop-filter: blur(10px);
}

.card-header::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
}

/* 头部提示文字样式 */
.header-tip {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 400;
  font-size: 14px;
  text-shadow: none;
}

/* 命名规则容器 */
.naming-rules-container {
  padding: 24px;
}

/* 规则列表样式 */
.rules-list {
  margin-bottom: 24px;
}

.rule-item-enhanced {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  margin-bottom: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(248, 250, 252, 0.8) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.rule-item-enhanced:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: rgba(99, 102, 241, 0.3);
}

/* 拖拽手柄 */
.drag-handle-area {
  cursor: grab;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.drag-handle-area:hover {
  background: rgba(99, 102, 241, 0.1);
}

.drag-handle-area:active {
  cursor: grabbing;
}

.drag-handle {
  font-size: 18px;
  color: #6b7280;
  transition: color 0.3s ease;
}

.drag-handle-area:hover .drag-handle {
  color: #6366f1;
}

/* 规则内容区域 */
.rule-content-area {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 规则操作按钮 */
.rule-actions {
  display: flex;
  gap: 8px;
}

.rule-actions .el-button {
  transition: all 0.3s ease;
}

.rule-actions .el-button:hover {
  transform: scale(1.1);
}

/* 空状态样式 */
.no-rules {
  text-align: center;
  padding: 40px 20px;
}

.no-rules .el-empty {
  padding: 0;
}

/* 预览区域样式 */
.rules-preview-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid rgba(226, 232, 240, 0.8);
}

.effect-preview-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
}

.effect-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(226, 232, 240, 0.8);
}

.effect-icon {
  font-size: 24px;
}

.effect-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.preview-format {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.preview-segment {
  display: inline-block;
  padding: 6px 12px;
  margin: 2px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.preview-segment.text-segment {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.preview-segment.field-segment {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
  border: 1px solid #86efac;
}

.effect-content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.file-transformation {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.file-before,
.file-after {
  flex: 1;
  min-width: 200px;
}

.file-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.file-name {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  word-break: break-all;
  transition: all 0.3s ease;
}

.file-name.original {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #f59e0b;
}

.file-name.renamed {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
  border: 1px solid #22c55e;
}

.transform-arrow {
  color: #6366f1;
  font-size: 24px;
  font-weight: bold;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateX(0px);
  }
  50% {
    transform: translateX(8px);
  }
}

/* 拖拽状态样式 */
.sortable-ghost {
  opacity: 0.5;
  background: rgba(99, 102, 241, 0.1);
}

.sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2);
}

.sortable-drag {
  transform: rotate(5deg);
  box-shadow: 0 16px 48px rgba(99, 102, 241, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rule-item-enhanced {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .rule-content-area {
    flex-direction: column;
    gap: 12px;
  }

  .rule-content-area .el-select,
  .rule-content-area .el-input {
    width: 100% !important;
    margin-left: 0 !important;
  }

  .file-transformation {
    flex-direction: column;
    gap: 16px;
  }

  .transform-arrow {
    transform: rotate(90deg);
    align-self: center;
  }
}
</style>
