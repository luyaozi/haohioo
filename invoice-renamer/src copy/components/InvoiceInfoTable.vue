<template>
  <el-card v-if="invoiceData.length > 0" class="info-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>📊 发票信息</span>
        <el-button
          type="success"
          @click="parseAllFiles"
          :loading="parsing"
          :icon="Refresh"
          size="default"
        >
          <el-icon><Refresh /></el-icon>
          重新解析
        </el-button>
      </div>
    </template>

    <el-table
      :data="invoiceData"
      stripe
      style="width: 100%"
      max-height="600"
      :expand-row-keys="expandedRows"
      row-key="fileName"
      @expand-change="handleExpandChange"
    >
      <!-- 展开行 - 显示详细信息 -->
      <el-table-column type="expand">
        <template #default="props">
          <div class="expand-content">
            <!-- 其他信息 -->
            <div class="basic-info-section">
              <h4>其他信息</h4>
              <el-descriptions
                :column="3"
                border
                size="small"
                style="margin-bottom: 15px"
              >
                <el-descriptions-item label="购买方名称">
                  {{ props.row.buyerName || "未识别" }}
                </el-descriptions-item>
                <el-descriptions-item label="购买方税号">
                  {{ props.row.buyerTaxId || "未识别" }}
                </el-descriptions-item>
                <el-descriptions-item label="销售方名称">
                  {{ props.row.sellerName || "未识别" }}
                </el-descriptions-item>
                <el-descriptions-item label="销售方税号">
                  {{ props.row.sellerTaxId || "未识别" }}
                </el-descriptions-item>
                <el-descriptions-item label="合计大写">
                  {{ props.row.totalAmountChinese || "未识别" }}
                </el-descriptions-item>
                <el-descriptions-item label="开票人">
                  {{ props.row.drawer || "未识别" }}
                </el-descriptions-item>
                <el-descriptions-item label="项目名称">
                  {{ props.row.itemName || "未识别" }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 备注信息 -->
            <div v-if="props.row.remark" class="remark-section">
              <h4>备注信息</h4>
              <div
                class="remark-content"
                v-html="formatRemark(props.row.remark)"
              ></div>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 主要信息列 - 只显示核心信息 -->
      <el-table-column label="文件名" min-width="260" show-overflow-tooltip>
        <template #default="scope">
          <span
            class="file-name-link"
            @click="previewFile(scope.row)"
            :title="scope.row.fileName"
          >
            {{ scope.row.fileName }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        prop="invoiceNumber"
        label="发票号码"
        width="200"
        show-overflow-tooltip
      />
      <el-table-column prop="invoiceDate" label="开票日期" width="160" />
      <el-table-column prop="totalAmount" label="价税合计" width="120" />

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button
            type="danger"
            size="small"
            @click="removeFile(scope.$index)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script>
import { Refresh } from '@element-plus/icons-vue'

export default {
  name: 'InvoiceInfoTable',
  components: {
    Refresh
  },
  props: {
    invoiceData: {
      type: Array,
      default: () => []
    },
    parsing: {
      type: Boolean,
      default: false
    },
    expandedRows: {
      type: Array,
      default: () => []
    }
  },
  emits: ['parse-all-files', 'expand-change', 'preview-file', 'remove-file'],
  setup(props, { emit }) {
    const parseAllFiles = () => {
      emit('parse-all-files')
    }

    const handleExpandChange = (row, expandedRows) => {
      emit('expand-change', row, expandedRows)
    }

    const previewFile = (row) => {
      emit('preview-file', row)
    }

    const removeFile = (index) => {
      emit('remove-file', index)
    }

    const formatRemark = (remark) => {
      if (!remark) return ''
      return remark.replace(/\n/g, '<br>')
    }

    return {
      parseAllFiles,
      handleExpandChange,
      previewFile,
      removeFile,
      formatRemark
    }
  }
}
</script>

<style scoped>
/* 卡片容器 - 现代化C端设计 */
.info-card {
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

.info-card::before {
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

.info-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(255, 255, 255, 0.15);
}

.info-card :deep(.el-card__header) {
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

/* 表格样式优化 */
.info-card :deep(.el-table) {
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.info-card :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.info-card :deep(.el-table th) {
  background: transparent;
  color: #374151;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
}

.info-card :deep(.el-table td) {
  border-bottom: 1px solid #f3f4f6;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.info-card :deep(.el-table__row:hover > td) {
  background: rgba(99, 102, 241, 0.05) !important;
}

/* 文件名链接样式 */
.file-name-link {
  color: #6366f1;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border-bottom: 1px solid transparent;
}

.file-name-link:hover {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
  transform: translateX(2px);
}

/* 展开内容样式 */
.expand-content {
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 12px;
  margin: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.basic-info-section h4,
.remark-section h4 {
  color: #374151;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.remark-content {
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #6366f1;
  color: #374151;
  line-height: 1.6;
}

/* 头部按钮样式 */
.card-header .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 12px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.card-header .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 255, 255, 0.2);
}

/* 操作按钮样式 */
.info-card :deep(.el-button--danger) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.info-card :deep(.el-button--danger:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
}
</style>