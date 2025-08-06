<template>
  <el-card v-if="renameResults.length > 0" class="result-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>📋 重命名结果</span>
        <el-button type="success" @click="downloadAllFiles" size="default">
          <el-icon><Download /></el-icon>
          打包下载zip
        </el-button>
      </div>
    </template>

    <div class="download-tips">
      <el-alert title="下载提示" type="info" :closable="false" show-icon>
        <template #default>
          <p>1. 点击表格中的"下载"按钮可下载单个文件</p>
          <p>2. 点击右上角的"打包下载zip"按钮可将所有文件打包成ZIP格式下载</p>
        </template>
      </el-alert>
    </div>

    <el-table
      :data="renameResults"
      border
      stripe
      style="width: 100%"
      class="rename-results-table"
    >
      <el-table-column
        prop="originalName"
        label="原文件名"
        min-width="300"
        show-overflow-tooltip
      />
      <el-table-column
        prop="newName"
        label="新文件名"
        min-width="400"
        show-overflow-tooltip
      />
      <el-table-column label="状态" min-width="100">
        <template #default="scope">
          <el-tag :type="scope.row.success ? 'success' : 'danger'">
            {{ scope.row.success ? "成功" : "失败" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            @click="downloadSingleFile(scope.row)"
            :disabled="!scope.row.success"
          >
            <el-icon><Download /></el-icon>
            下载
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script>
import { Download } from "@element-plus/icons-vue"

export default {
  name: "RenameResultsCard",
  components: {
    Download,
  },
  props: {
    renameResults: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["download-all-files", "download-single-file"],
  setup(props, { emit }) {
    const downloadAllFiles = () => {
      emit("download-all-files")
    }

    const downloadSingleFile = (row) => {
      emit("download-single-file", row)
    }

    return {
      downloadAllFiles,
      downloadSingleFile,
      Download,
    }
  },
}
</script>

<style scoped>
/* 卡片容器 - 现代化C端设计 */
.result-card {
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

.result-card::before {
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

.result-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(255, 255, 255, 0.15);
}

.result-card :deep(.el-card__header) {
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

/* 下载提示区域 */
.download-tips {
  margin-bottom: 24px;
}

.download-tips :deep(.el-alert) {
  border-radius: 12px;
  border: none;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(147, 197, 253, 0.1) 100%
  );
  backdrop-filter: blur(10px);
}

.download-tips :deep(.el-alert__content) {
  padding: 16px 0;
}

.download-tips p {
  margin: 8px 0;
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
}

/* 表格样式 */
.rename-results-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: transparent;
}

.result-card :deep(.el-table) {
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
}

.result-card :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.result-card :deep(.el-table th) {
  background: transparent;
  color: #374151;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
  padding: 16px 12px;
}

.result-card :deep(.el-table td) {
  border-bottom: 1px solid #f3f4f6;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 16px 12px;
}

.result-card :deep(.el-table__row:hover > td) {
  background: rgba(99, 102, 241, 0.05) !important;
}

.result-card
  :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: rgba(248, 250, 252, 0.8);
}

.result-card
  :deep(.el-table--striped .el-table__body tr.el-table__row--striped:hover td) {
  background: rgba(99, 102, 241, 0.05) !important;
}

/* 状态标签样式 */
.result-card :deep(.el-tag) {
  border-radius: 8px;
  font-weight: 500;
  padding: 4px 12px;
  border: none;
}

.result-card :deep(.el-tag--success) {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
}

.result-card :deep(.el-tag--danger) {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

/* 操作按钮样式 */
.result-card :deep(.el-button--primary) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.result-card :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.result-card :deep(.el-button--primary:disabled) {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #9ca3af;
  transform: none;
  box-shadow: none;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .result-card :deep(.el-table) {
    font-size: 14px;
  }

  .result-card :deep(.el-table th),
  .result-card :deep(.el-table td) {
    padding: 12px 8px;
  }

  .download-tips p {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .result-card :deep(.el-table) {
    font-size: 12px;
  }

  .result-card :deep(.el-table th),
  .result-card :deep(.el-table td) {
    padding: 8px 6px;
  }

  .result-card :deep(.el-button) {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>
