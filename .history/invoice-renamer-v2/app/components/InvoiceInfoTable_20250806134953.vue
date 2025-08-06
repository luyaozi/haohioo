<template>
  <div class="invoice-info-table">
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><Document /></el-icon>
            <span class="header-title">发票信息</span>
            <el-tag v-if="invoiceData.length > 0" type="info" size="small">
              {{ invoiceData.length }} 个文件
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button
              type="primary"
              size="small"
              @click="$emit('parse-all-files')"
              :loading="parsing"
            >
              <el-icon><Refresh /></el-icon>
              重新解析
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-content">
        <el-table
          :data="invoiceData"
          style="width: 100%"
          :row-key="(row: any) => row.fileName"
          :expand-row-keys="expandedRows"
          @expand-change="handleExpandChange"
          v-loading="parsing"
          loading-text="正在解析发票信息..."
        >
          <!-- 展开行 -->
          <el-table-column type="expand" width="50">
            <template #default="{ row }">
              <div class="expand-content">
                <div class="expand-section">
                  <h4>详细信息</h4>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>购买方税号:</label>
                      <span>{{ row.buyerTaxId || "未识别" }}</span>
                    </div>
                    <div class="info-item">
                      <label>销售方税号:</label>
                      <span>{{ row.sellerTaxId || "未识别" }}</span>
                    </div>
                    <div class="info-item">
                      <label>税额:</label>
                      <span>{{ row.taxAmount || "未识别" }}</span>
                    </div>
                    <div class="info-item">
                      <label>不含税金额:</label>
                      <span>{{ row.amountWithoutTax || "未识别" }}</span>
                    </div>
                    <div class="info-item">
                      <label>开票人:</label>
                      <span>{{ row.drawer || "未识别" }}</span>
                    </div>
                    <div class="info-item">
                      <label>收款人:</label>
                      <span>{{ row.payee || "未识别" }}</span>
                    </div>
                    <div class="info-item">
                      <label>复核人:</label>
                      <span>{{ row.reviewer || "未识别" }}</span>
                    </div>
                    <div class="info-item">
                      <label>项目名称:</label>
                      <span>{{ row.itemName || "未识别" }}</span>
                    </div>
                  </div>
                </div>

                <div class="expand-section">
                  <h4>
                    原始文本
                    <el-tag size="small" type="info">{{
                      row.parseMethod
                    }}</el-tag>
                  </h4>
                  <div class="full-text">
                    {{ row.fullText || "无文本内容" }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 文件名 -->
          <el-table-column prop="fileName" label="文件名" min-width="200">
            <template #default="{ row }">
              <div class="file-name-cell">
                <el-icon class="file-icon"><Document /></el-icon>
                <span class="file-name" :title="row.fileName">{{
                  row.fileName
                }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 发票号码 -->
          <el-table-column
            prop="invoiceNumber"
            label="发票号码"
            min-width="150"
          >
            <template #default="{ row }">
              <span v-if="row.invoiceNumber" class="invoice-number">{{
                row.invoiceNumber
              }}</span>
              <el-tag v-else type="warning" size="small">未识别</el-tag>
            </template>
          </el-table-column>

          <!-- 开票日期 -->
          <el-table-column prop="invoiceDate" label="开票日期" min-width="120">
            <template #default="{ row }">
              <span v-if="row.invoiceDate" class="invoice-date">{{
                row.invoiceDate
              }}</span>
              <el-tag v-else type="warning" size="small">未识别</el-tag>
            </template>
          </el-table-column>

          <!-- 购买方 -->
          <el-table-column prop="buyerName" label="购买方" min-width="150">
            <template #default="{ row }">
              <span
                v-if="row.buyerName"
                class="buyer-name"
                :title="row.buyerName"
              >
                {{ truncateText(row.buyerName, 20) }}
              </span>
              <el-tag v-else type="warning" size="small">未识别</el-tag>
            </template>
          </el-table-column>

          <!-- 销售方 -->
          <el-table-column prop="sellerName" label="销售方" min-width="150">
            <template #default="{ row }">
              <span
                v-if="row.sellerName"
                class="seller-name"
                :title="row.sellerName"
              >
                {{ truncateText(row.sellerName, 20) }}
              </span>
              <el-tag v-else type="warning" size="small">未识别</el-tag>
            </template>
          </el-table-column>

          <!-- 价税合计 -->
          <el-table-column prop="totalAmount" label="价税合计" min-width="120">
            <template #default="{ row }">
              <span v-if="row.totalAmount" class="total-amount"
                >¥{{ row.totalAmount }}</span
              >
              <el-tag v-else type="warning" size="small">未识别</el-tag>
            </template>
          </el-table-column>

          <!-- 操作 -->
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row, $index }">
              <div class="action-buttons">
                <el-button
                  type="primary"
                  size="small"
                  text
                  @click="$emit('preview-file', row.file)"
                >
                  <el-icon><View /></el-icon>
                  预览
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  text
                  @click="$emit('remove-file', $index)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空状态 -->
        <div v-if="invoiceData.length === 0 && !parsing" class="empty-state">
          <el-empty description="暂无发票数据">
            <template #image>
              <el-icon class="empty-icon"><Document /></el-icon>
            </template>
            <template #description>
              <p>请先上传PDF发票文件</p>
            </template>
          </el-empty>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Document, Refresh, View, Delete } from "@element-plus/icons-vue"

// Props
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

interface Props {
  invoiceData: InvoiceData[]
  parsing: boolean
  expandedRows: string[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  "parse-all-files": []
  "expand-change": [row: InvoiceData, expandedRows: string[]]
  "preview-file": [file: File]
  "remove-file": [index: number]
}>()

// 处理展开行变化
const handleExpandChange = (row: InvoiceData, expandedRows: string[]) => {
  emit("expand-change", row, expandedRows)
}

// 截断文本
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}
</script>

<style lang="scss" scoped>
.invoice-info-table {
  margin-bottom: 24px;

  .table-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    :deep(.el-card__header) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-bottom: none;
      padding: 20px 24px;
    }

    :deep(.el-card__body) {
      padding: 0;
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

  .table-content {
    :deep(.el-table) {
      background: transparent;

      .el-table__header {
        background: #f8f9fa;

        th {
          background: #f8f9fa;
          border-bottom: 1px solid #e8e8e8;
          font-weight: 600;
          color: #333;
        }
      }

      .el-table__body {
        tr {
          &:hover {
            background: #f8f9fa;
          }

          td {
            border-bottom: 1px solid #f0f0f0;
            padding: 12px 0;
          }
        }
      }

      .el-table__expanded-cell {
        background: #f8f9fa;
        padding: 20px;
      }
    }

    .file-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .file-icon {
        color: #ff4757;
        font-size: 16px;
      }

      .file-name {
        font-weight: 500;
        color: #333;
      }
    }

    .invoice-number {
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      font-size: 13px;
      color: #333;
      background: #f0f2ff;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .invoice-date {
      color: #666;
      font-size: 14px;
    }

    .buyer-name,
    .seller-name {
      color: #333;
      font-size: 14px;
    }

    .total-amount {
      color: #e74c3c;
      font-weight: 600;
      font-size: 14px;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .expand-content {
      .expand-section {
        margin-bottom: 24px;

        &:last-child {
          margin-bottom: 0;
        }

        h4 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;

          .info-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e8e8e8;

            label {
              font-weight: 500;
              color: #666;
              margin-right: 8px;
              min-width: 80px;
              font-size: 13px;
            }

            span {
              color: #333;
              font-size: 13px;
              word-break: break-all;
            }
          }
        }

        .full-text {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 6px;
          padding: 16px;
          font-size: 13px;
          line-height: 1.6;
          color: #333;
          max-height: 200px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }
      }
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;

      .empty-icon {
        font-size: 64px;
        color: #d9d9d9;
      }

      :deep(.el-empty__description) {
        color: #999;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .invoice-info-table {
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

    .table-content {
      :deep(.el-table) {
        .el-table__header,
        .el-table__body {
          font-size: 12px;
        }
      }

      .expand-content {
        .expand-section {
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  }
}
</style>
