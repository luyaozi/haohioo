<template>
  <div class="w-full">
    <el-card shadow="never" class="rounded-lg border-gray-200">
      <!-- 头部操作区 -->
      <template #header>
        <div class="flex justify-between items-center py-1">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-gray-800 m-0 leading-none">
              发票信息
            </h3>
            <span
              class="px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded-full leading-none flex items-center"
              >{{ invoiceData.length }} 个文件</span
            >
          </div>
          <div class="flex items-center gap-3">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="table">
                <el-icon><Grid /></el-icon>
                表格视图
              </el-radio-button>
              <el-radio-button value="card">
                <el-icon><Postcard /></el-icon>
                卡片视图
              </el-radio-button>
            </el-radio-group>
            <el-button
              type="primary"
              size="small"
              :loading="parsing"
              @click="$emit('parse-all-files')"
            >
              <el-icon><Refresh /></el-icon>
              重新解析
            </el-button>
          </div>
        </div>
      </template>

      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="table-view">
        <div class="table-wrapper">
          <el-table
            :data="invoiceData"
            style="width: 100%"
            :row-key="(row: any) => row.fileName"
            :expand-row-keys="expandedRows"
            @expand-change="handleExpandChange"
            v-loading="parsing"
            loading-text="正在解析发票信息..."
            :height="tableHeight"
            :default-sort="{ prop: 'fileName', order: 'ascending' }"
          >
            <!-- 展开行 -->
            <el-table-column type="expand" width="50">
              <template #default="{ row }">
                <div class="expand-content">
                  <div class="expand-section">
                    <h4>详细信息</h4>

                    <div class="info-grid">
                      <div class="info-item">
                        <label>购买方名称:</label>
                        <span>{{ row.buyerName || "未识别" }}</span>
                      </div>
                      <div class="info-item">
                        <label>购买方税号:</label>
                        <span>{{ row.buyerTaxId || "未识别" }}</span>
                      </div>
                      <div class="info-item">
                        <label>销售方名称:</label>
                        <span>{{ row.sellerName || "未识别" }}</span>
                      </div>
                      <div class="info-item">
                        <label>销售方税号:</label>
                        <span>{{ row.sellerTaxId || "未识别" }}</span>
                      </div>

                      <div class="info-item">
                        <label>开票人:</label>
                        <span>{{ row.drawer || "未识别" }}</span>
                      </div>

                      <div class="info-item">
                        <label>大写金额:</label>
                        <span>{{ row.totalAmountChinese || "未识别" }}</span>
                      </div>
                      <div class="info-item">
                        <label>项目名称:</label>
                        <span class="w-full">{{
                          row.itemName || "未识别"
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="expand-section">
                    <h4>
                      原始文本
                      <el-tag size="small" type="info">{{
                        row.parseMethod || "PDFToWordParser"
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
            <el-table-column
              prop="fileName"
              label="文件名"
              min-width="200"
              show-overflow-tooltip
              sortable
            >
              <template #default="{ row }">
                <div class="file-name-cell">
                  <el-icon class="file-icon"><Document /></el-icon>
                  <span class="file-name">{{ row.fileName }}</span>
                </div>
              </template>
            </el-table-column>

            <!-- 发票号码 -->
            <el-table-column
              prop="invoiceNumber"
              label="发票号码"
              min-width="180"
              show-overflow-tooltip
              sortable
            >
              <template #default="{ row }">
                <span v-if="row.invoiceNumber" class="invoice-number">{{
                  row.invoiceNumber
                }}</span>
                <el-tag v-else type="warning" size="small">未识别</el-tag>
              </template>
            </el-table-column>

            <!-- 开票日期 -->
            <el-table-column
              prop="invoiceDate"
              label="开票日期"
              min-width="120"
              sortable
            >
              <template #default="{ row }">
                <span v-if="row.invoiceDate" class="invoice-date">{{
                  row.invoiceDate
                }}</span>
                <el-tag v-else type="warning" size="small">未识别</el-tag>
              </template>
            </el-table-column>

            <!-- 价税合计 -->
            <el-table-column
              prop="totalAmount"
              label="价税合计"
              min-width="120"
              sortable
              :sort-method="sortByAmount"
            >
              <template #default="{ row }">
                <span v-if="row.totalAmount" class="total-amount"
                  >¥{{ row.totalAmount }}</span
                >
                <el-tag v-else type="warning" size="small">未识别</el-tag>
              </template>
            </el-table-column>

            <!-- 操作 -->
            <el-table-column label="操作" width="150" fixed="right">
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
                    @click.stop="handleRemoveFile(row.fileName)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <div
          class="cards-grid"
          v-loading="parsing"
          loading-text="正在解析发票信息..."
        >
          <div
            v-for="(invoice, index) in invoiceData"
            :key="invoice.fileName"
            class="invoice-card"
          >
            <!-- 发票预览图 -->
            <div
              class="invoice-preview"
              @click="handlePreviewClick(invoice.file)"
            >
              <div class="preview-placeholder">
                <el-icon class="preview-icon"><Document /></el-icon>
                <span class="preview-text">点击预览</span>
              </div>
              <div class="preview-overlay">
                <el-icon class="zoom-icon"><ZoomIn /></el-icon>
              </div>
            </div>

            <!-- 发票信息 -->
            <div class="invoice-info">
              <div class="invoice-header">
                <h3 class="invoice-title" :title="invoice.fileName">
                  {{ truncateFileName(invoice.fileName) }}
                </h3>
                <div class="invoice-actions">
                  <el-button
                    type="primary"
                    size="small"
                    text
                    @click="$emit('preview-file', invoice.file)"
                  >
                    <el-icon><View /></el-icon>
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click.stop="handleRemoveFile(invoice.fileName)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

              <div class="invoice-details">
                <div class="detail-item amount-item">
                  <label>价税合计:</label>
                  <span v-if="invoice.totalAmount" class="amount-value"
                    >¥{{ invoice.totalAmount }}</span
                  >
                  <el-tag v-else type="warning" size="small">未识别</el-tag>
                </div>
              </div>
              <div class="detail-item">
                <label>发票号码:</label>
                <span v-if="invoice.invoiceNumber" class="value">{{
                  invoice.invoiceNumber
                }}</span>
                <el-tag v-else type="warning" size="small">未识别</el-tag>
              </div>

              <div class="detail-item mb-5px">
                <label>开票日期:</label>
                <span v-if="invoice.invoiceDate" class="value">{{
                  invoice.invoiceDate
                }}</span>
                <el-tag v-else type="warning" size="small">未识别</el-tag>
              </div>
              <!-- 
                <div class="detail-item">
                  <label>购买方:</label>
                  <span
                    v-if="invoice.buyerName"
                    class="value"
                    :title="invoice.buyerName"
                  >
                    {{ truncateText(invoice.buyerName, 15) }}
                  </span>
                  <el-tag v-else type="warning" size="small">未识别</el-tag>
                </div>

                <div class="detail-item">
                  <label>销售方:</label>
                  <span
                    v-if="invoice.sellerName"
                    class="value"
                    :title="invoice.sellerName"
                  >
                    {{ truncateText(invoice.sellerName, 15) }}
                  </span>
                  <el-tag v-else type="warning" size="small">未识别</el-tag>
                </div> -->

              <!-- 展开详细信息按钮 -->
              <div class="expand-button">
                <el-button
                  type="info"
                  size="small"
                  text
                  @click="toggleCardExpand(invoice.fileName)"
                >
                  <el-icon
                    ><ArrowDown
                      v-if="
                        !expandedCards.includes(invoice.fileName)
                      " /><ArrowUp v-else
                  /></el-icon>
                  {{
                    expandedCards.includes(invoice.fileName)
                      ? "收起详情"
                      : "展开详情"
                  }}
                </el-button>
              </div>

              <!-- 展开的详细信息 -->
              <div
                v-if="expandedCards.includes(invoice.fileName)"
                class="expanded-details"
              >
                <div class="expanded-grid">
                  <div class="expanded-item">
                    <label>购买方名称:</label>
                    <span>{{ invoice.buyerName || "未识别" }}</span>
                  </div>
                  <div class="expanded-item">
                    <label>购买方税号:</label>
                    <span>{{ invoice.buyerTaxId || "未识别" }}</span>
                  </div>

                  <div class="expanded-item">
                    <label>销售方名称:</label>
                    <span>{{ invoice.sellerName || "未识别" }}</span>
                  </div>
                  <div class="expanded-item">
                    <label>销售方税号:</label>
                    <span>{{ invoice.sellerTaxId || "未识别" }}</span>
                  </div>

                  <div class="expanded-item">
                    <label>开票人:</label>
                    <span>{{ invoice.drawer || "未识别" }}</span>
                  </div>

                  <div class="expanded-item">
                    <label>项目名称:</label>
                    <span>{{ invoice.itemName || "未识别" }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import {
  Document,
  Refresh,
  View,
  Delete,
  Grid,
  Postcard,
  ZoomIn,
  ArrowDown,
  ArrowUp,
} from "@element-plus/icons-vue"

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

const props = defineProps<{
  invoiceData: InvoiceData[]
  parsing: boolean
  expandedRows: string[]
}>()

// Emits
const emit = defineEmits<{
  "parse-all-files": []
  "expand-change": [row: InvoiceData, expandedRows: string[]]
  "preview-file": [file: File]
  "remove-file": [index: number]
}>()

// 响应式数据
const viewMode = ref<"table" | "card">("table")
const expandedCards = ref<string[]>([])

// 计算属性
const tableHeight = computed(() => {
  return Math.min(600, Math.max(300, props.invoiceData.length * 60 + 100))
})

// 方法
const handleExpandChange = (row: InvoiceData, expandedRows: string[]) => {
  emit("expand-change", row, expandedRows)
}

const handlePreviewClick = (file: File) => {
  emit("preview-file", file)
}

const toggleCardExpand = (fileName: string) => {
  const index = expandedCards.value.indexOf(fileName)
  if (index > -1) {
    expandedCards.value.splice(index, 1)
  } else {
    expandedCards.value.push(fileName)
  }
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

const truncateFileName = (fileName: string) => {
  if (!fileName) return ""
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "")
  return nameWithoutExt.length > 20
    ? nameWithoutExt.substring(0, 20) + "..."
    : nameWithoutExt
}

// 价格合计排序方法
const sortByAmount = (a: InvoiceData, b: InvoiceData) => {
  // 将字符串转换为数字进行比较
  const amountA = parseFloat(a.totalAmount) || 0
  const amountB = parseFloat(b.totalAmount) || 0
  return amountA - amountB
}

// 处理删除文件
const handleRemoveFile = (index: number) => {
  console.log('🗑️ InvoiceInfoDisplay: 删除按钮被点击，索引:', index)
  emit('remove-file', index)
}
</script>

<style scoped>
.invoice-info-display {
  margin-bottom: 20px;
}

.display-card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  margin-right: 12px;
}

/* 表格视图样式 */
.table-view {
  width: 100%;
  overflow: visible;
}

.table-wrapper {
  width: 100%;
  overflow: visible;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table .el-table__header-wrapper) {
  border-radius: 8px 8px 0 0;
}

:deep(.el-table .el-table__body-wrapper) {
  overflow-x: auto;
}

:deep(.el-table th) {
  background-color: #f8f9fa !important;
  color: #606266;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
  padding: 12px 8px;
}

/* 确保固定列表头也有背景色 */
:deep(.el-table .el-table__fixed-right .el-table__header-wrapper th) {
  background-color: #f8f9fa !important;
}

:deep(.el-table .el-table__fixed .el-table__header-wrapper th) {
  background-color: #f8f9fa !important;
}

:deep(.el-table td) {
  padding: 12px 8px;
  border-bottom: 1px solid #f0f2f5;
  vertical-align: top;
}

:deep(.el-table .el-table__row:hover) {
  background-color: #f5f7fa;
}

:deep(.el-table .el-table__expanded-cell) {
  padding: 20px;
  background-color: #fafbfc;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: var(--el-color-primary);
  font-size: 16px;
  flex-shrink: 0;
}

.file-name {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.invoice-number {
  font-family: "Monaco", "Menlo", monospace;
  font-size: 13px;
  color: var(--el-color-primary);
}

.invoice-date {
  color: var(--el-text-color-regular);
}

.buyer-name,
.seller-name {
  color: var(--el-text-color-primary);
}

.total-amount {
  font-weight: 600;
  color: var(--el-color-success);
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
}

.expand-content {
  padding: 0px 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  /* margin: 10px 0; */
}

.expand-section {
  margin-bottom: 20px;
}

.expand-section:last-child {
  margin-bottom: 0;
}

.expand-section h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item label {
  font-weight: 500;
  color: var(--el-text-color-regular);
  min-width: 80px;
  font-size: 13px;
}

.info-item span {
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.full-text {
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 卡片视图样式 */
.card-view {
  width: 100%;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 4px;
}

.invoice-card {
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.invoice-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--el-color-primary-light-7);
}

.invoice-preview {
  position: relative;
  height: 160px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9),
    var(--el-color-primary-light-8)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-color-primary);
  transition: all 0.3s ease;
}

.preview-icon {
  font-size: 32px;
}

.preview-text {
  font-size: 14px;
  font-weight: 500;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.invoice-preview:hover .preview-overlay {
  opacity: 1;
}

.zoom-icon {
  font-size: 24px;
  color: white;
}

.invoice-info {
  padding: 16px;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.invoice-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.invoice-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.detail-item label {
  font-weight: 500;
  color: var(--el-text-color-regular);
  min-width: 70px;
  flex-shrink: 0;
}

.detail-item .value {
  color: var(--el-text-color-primary);
  flex: 1;
}

.amount-item {
  padding: 8px 12px;
  background: var(--el-color-success-light-9);
  border-radius: 6px;
  border: 1px solid var(--el-color-success-light-7);
}

.amount-value {
  font-weight: 600;
  color: var(--el-color-success);
  font-size: 16px;
}

.expand-button {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.expanded-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.expanded-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.expanded-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 0;
}

.expanded-item label {
  font-weight: 500;
  color: var(--el-text-color-regular);
  min-width: 80px;
  flex-shrink: 0;
}

.expanded-item span {
  color: var(--el-text-color-primary);
  flex: 1;
  word-break: break-all;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: var(--el-color-info-light-5);
}

/* 表格内容样式 */
.table-cell-content {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.table-cell-content.expandable {
  cursor: pointer;
  color: #409eff;
}

.table-cell-content.expandable:hover {
  text-decoration: underline;
}

.amount-text {
  color: #f56c6c;
  font-weight: 600;
  font-size: 14px;
}

.buyer-seller-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
  font-size: 13px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .invoice-preview {
    height: 120px;
  }

  .preview-icon {
    font-size: 24px;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .view-toggle {
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  .invoice-card {
    margin: 0 -4px;
  }

  .invoice-info {
    padding: 12px;
  }

  .invoice-title {
    font-size: 14px;
  }

  .detail-item {
    font-size: 12px;
  }

  .amount-value {
    font-size: 14px;
  }
}
</style>
