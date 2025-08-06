<template>
  <div class="w-full">
    <el-card shadow="never" class="rounded-lg border-gray-200">
      <!-- 头部操作区 -->
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-gray-800 m-0">发票信息</h3>
            <span class="px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">{{ invoiceData.length }} 个文件</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="mr-3">
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
            </div>
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
      <div v-if="viewMode === 'table'" class="w-full overflow-visible">
        <div class="w-full overflow-visible">
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
                <div class="p-5 bg-gray-50 rounded-lg my-2">
                  <div class="mb-5">
                    <h4 class="flex items-center gap-2 mb-3 text-gray-800 text-sm font-semibold m-0">详细信息</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div class="flex items-center gap-2 text-xs py-1">
                        <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">购买方税号:</label>
                        <span class="text-gray-800 flex-1">{{ row.buyerTaxId || '未识别' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs py-1">
                        <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">销售方税号:</label>
                        <span class="text-gray-800 flex-1">{{ row.sellerTaxId || '未识别' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs py-1">
                        <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">税额:</label>
                        <span class="text-gray-800 flex-1">{{ row.taxAmount ? `¥${row.taxAmount}` : '未识别' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs py-1">
                        <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">不含税金额:</label>
                        <span class="text-gray-800 flex-1">{{ row.amountWithoutTax ? `¥${row.amountWithoutTax}` : '未识别' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs py-1">
                        <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">开票人:</label>
                        <span class="text-gray-800 flex-1">{{ row.drawer || '未识别' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs py-1">
                        <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">收款人:</label>
                        <span class="text-gray-800 flex-1">{{ row.payee || '未识别' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs py-1">
                        <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">复核人:</label>
                        <span class="text-gray-800 flex-1">{{ row.reviewer || '未识别' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs py-1">
                        <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">项目名称:</label>
                        <span class="text-gray-800 flex-1">{{ row.itemName || '未识别' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs py-1">
                        <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">大写金额:</label>
                        <span class="text-gray-800 flex-1">{{ row.totalAmountChinese || '未识别' }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="mb-0">
                    <h4 class="flex items-center gap-2 mb-3 text-gray-800 text-sm font-semibold m-0">原始文本 <el-tag size="small" type="info">{{ row.parseMethod || 'PDFToWordParser' }}</el-tag></h4>
                    <div class="bg-white border border-gray-200 rounded-md p-3 text-xs leading-relaxed text-gray-600 max-h-50 overflow-y-auto whitespace-pre-wrap break-all">
                      {{ row.fullText || '无文本内容' }}
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 文件名列 -->
            <el-table-column prop="fileName" label="文件名" sortable min-width="200">
              <template #default="{ row }">
                <div class="flex items-center py-1">
                  <el-tooltip :content="row.fileName" placement="top">
                    <span class="text-sm text-gray-800 truncate max-w-full">{{ row.fileName }}</span>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>

            <!-- 发票号码列 -->
            <el-table-column prop="invoiceNumber" label="发票号码" sortable min-width="120">
              <template #default="{ row }">
                <div class="flex items-center py-1">
                  <span v-if="row.invoiceNumber" class="text-sm text-gray-800">{{ row.invoiceNumber }}</span>
                  <span v-else class="text-sm text-gray-400">未识别</span>
                </div>
              </template>
            </el-table-column>

            <!-- 开票日期列 -->
            <el-table-column prop="invoiceDate" label="开票日期" sortable min-width="120">
              <template #default="{ row }">
                <div class="flex items-center py-1">
                  <span v-if="row.invoiceDate" class="text-sm text-gray-800">{{ row.invoiceDate }}</span>
                  <span v-else class="text-sm text-gray-400">未识别</span>
                </div>
              </template>
            </el-table-column>

            <!-- 价税合计列 -->
            <el-table-column prop="totalAmount" label="价税合计" sortable min-width="120">
              <template #default="{ row }">
                <div class="flex items-center py-1">
                  <span v-if="row.totalAmount" class="text-sm font-medium text-blue-600">¥{{ row.totalAmount }}</span>
                  <span v-else class="text-sm text-gray-400">未识别</span>
                </div>
              </template>
            </el-table-column>

            <!-- 操作列 -->
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row, $index }">
                <div class="flex items-center justify-center gap-2 py-1 whitespace-nowrap">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="$emit('preview-file', row.file)"
                  >
                    <el-icon><View /></el-icon>
                    预览
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="$emit('remove-file', $index)"
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
      <div v-else class="w-full" v-loading="parsing" loading-text="正在解析发票信息...">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="(invoice, index) in invoiceData" 
            :key="invoice.fileName"
            class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <!-- 发票预览图 -->
            <div class="relative h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center cursor-pointer overflow-hidden" @click="handlePreviewClick(invoice.file)">
              <div class="flex flex-col items-center gap-2 text-blue-600 transition-all duration-300">
                <el-icon class="text-3xl"><Document /></el-icon>
                <span class="text-sm font-medium">点击预览</span>
              </div>
              <div class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                <el-icon class="text-2xl text-white"><ZoomIn /></el-icon>
              </div>
            </div>

            <!-- 发票信息 -->
            <div class="p-4">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-base font-semibold text-gray-800 m-0 flex-1 mr-2 leading-tight" :title="invoice.fileName">
                  {{ truncateFileName(invoice.fileName) }}
                </h3>
                <div class="flex items-center gap-1 flex-shrink-0">
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
                    @click="$emit('remove-file', index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

              <div class="flex flex-col gap-2 mb-3">
                <div class="flex items-center gap-2 text-xs">
                  <label class="font-medium text-gray-600 min-w-16 flex-shrink-0">发票号码:</label>
                  <span v-if="invoice.invoiceNumber" class="text-gray-800 flex-1">{{ invoice.invoiceNumber }}</span>
                  <el-tag v-else type="warning" size="small">未识别</el-tag>
                </div>
                
                <div class="flex items-center gap-2 text-xs">
                  <label class="font-medium text-gray-600 min-w-16 flex-shrink-0">开票日期:</label>
                  <span v-if="invoice.invoiceDate" class="text-gray-800 flex-1">{{ invoice.invoiceDate }}</span>
                  <el-tag v-else type="warning" size="small">未识别</el-tag>
                </div>
                
                <div class="flex items-center gap-2 text-xs">
                  <label class="font-medium text-gray-600 min-w-16 flex-shrink-0">购买方:</label>
                  <span v-if="invoice.buyerName" class="text-gray-800 flex-1 truncate" :title="invoice.buyerName">
                    {{ truncateText(invoice.buyerName, 15) }}
                  </span>
                  <el-tag v-else type="warning" size="small">未识别</el-tag>
                </div>
                
                <div class="flex items-center gap-2 text-xs">
                  <label class="font-medium text-gray-600 min-w-16 flex-shrink-0">销售方:</label>
                  <span v-if="invoice.sellerName" class="text-gray-800 flex-1 truncate" :title="invoice.sellerName">
                    {{ truncateText(invoice.sellerName, 15) }}
                  </span>
                  <el-tag v-else type="warning" size="small">未识别</el-tag>
                </div>
                
                <div class="flex items-center gap-2 text-xs p-2 bg-green-50 border border-green-200 rounded">
                  <label class="font-medium text-gray-600 min-w-16 flex-shrink-0">价税合计:</label>
                  <span v-if="invoice.totalAmount" class="font-semibold text-green-600 text-sm flex-1">¥{{ invoice.totalAmount }}</span>
                  <el-tag v-else type="warning" size="small">未识别</el-tag>
                </div>
              </div>

              <!-- 展开详细信息按钮 -->
              <div class="text-center pt-2 border-t border-gray-100">
                <el-button 
                  type="info" 
                  size="small" 
                  text 
                  @click="toggleCardExpand(invoice.fileName)"
                >
                  <el-icon><ArrowDown v-if="!expandedCards.includes(invoice.fileName)" /><ArrowUp v-else /></el-icon>
                  {{ expandedCards.includes(invoice.fileName) ? '收起详情' : '展开详情' }}
                </el-button>
              </div>

              <!-- 展开的详细信息 -->
              <div v-if="expandedCards.includes(invoice.fileName)" class="mt-3 pt-3 border-t border-gray-100">
                <div class="grid grid-cols-1 gap-2">
                  <div class="flex items-center gap-2 text-xs py-1">
                    <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">购买方税号:</label>
                    <span class="text-gray-800 flex-1 break-all">{{ invoice.buyerTaxId || '未识别' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs py-1">
                    <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">销售方税号:</label>
                    <span class="text-gray-800 flex-1 break-all">{{ invoice.sellerTaxId || '未识别' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs py-1">
                    <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">税额:</label>
                    <span class="text-gray-800 flex-1 break-all">{{ invoice.taxAmount || '未识别' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs py-1">
                    <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">不含税金额:</label>
                    <span class="text-gray-800 flex-1 break-all">{{ invoice.amountWithoutTax || '未识别' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs py-1">
                    <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">开票人:</label>
                    <span class="text-gray-800 flex-1 break-all">{{ invoice.drawer || '未识别' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs py-1">
                    <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">收款人:</label>
                    <span class="text-gray-800 flex-1 break-all">{{ invoice.payee || '未识别' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs py-1">
                    <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">复核人:</label>
                    <span class="text-gray-800 flex-1 break-all">{{ invoice.reviewer || '未识别' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs py-1">
                    <label class="font-medium text-gray-600 min-w-20 flex-shrink-0">项目名称:</label>
                    <span class="text-gray-800 flex-1 break-all">{{ invoice.itemName || '未识别' }}</span>
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
import { ref, computed } from 'vue'
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
} from '@element-plus/icons-vue'

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
  'parse-all-files': []
  'expand-change': [row: InvoiceData, expandedRows: string[]]
  'preview-file': [file: File]
  'remove-file': [index: number]
}>()

// 响应式数据
const viewMode = ref<'table' | 'card'>('table')
const expandedCards = ref<string[]>([])

// 计算属性
const tableHeight = computed(() => {
  return Math.min(600, Math.max(300, props.invoiceData.length * 60 + 100))
})

// 方法
const handleExpandChange = (row: InvoiceData, expandedRows: string[]) => {
  emit('expand-change', row, expandedRows)
}

const handlePreviewClick = (file: File) => {
  emit('preview-file', file)
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
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const truncateFileName = (fileName: string) => {
  if (!fileName) return ''
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
  return nameWithoutExt.length > 20 ? nameWithoutExt.substring(0, 20) + '...' : nameWithoutExt
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
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: var(--el-color-primary);
}

.invoice-date {
  color: var(--el-text-color-regular);
}

.buyer-name, .seller-name {
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
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  margin: 10px 0;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
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
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
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