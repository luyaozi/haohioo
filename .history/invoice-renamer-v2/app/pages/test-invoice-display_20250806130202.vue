<template>
  <div class="test-page">
    <div class="container">
      <h1>发票信息显示组件测试</h1>
      <p class="description">
        这个页面用于测试新的发票信息显示组件，包括表格视图和卡片视图的切换功能。
      </p>
      
      <InvoiceInfoDisplay 
        :invoice-data="mockInvoiceData"
        @preview="handlePreview"
        @re-parse="handleReParse"
      />
      
      <!-- PDF预览对话框 -->
      <PDFPreviewDialog
        v-model:visible="previewDialogVisible"
        :file="currentPreviewFile"
        @download="handleDownload"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 预览相关状态
const previewDialogVisible = ref(false)
const currentPreviewFile = ref(null)

// 模拟发票数据
const mockInvoiceData = ref([
  {
    fileName: '消费电子发票_副本.pdf',
    invoiceNumber: '25517000000276570255',
    invoiceDate: '2025年07月29日',
    buyerName: '四川省成都市教育科学研究院',
    buyerTaxId: '12510100MB0W123456',
    sellerName: '成都市锦江区教育科学研究院',
    sellerTaxId: '91510104MA61234567',
    totalAmount: '29.81',
    totalAmountChinese: '贰拾玖元捌角壹分',
    taxAmount: '2.68',
    amountWithoutTax: '27.13',
    drawer: '张三',
    payee: '李四',
    reviewer: '王五',
    itemName: '教育咨询服务',
    parseMethod: 'PDFToWordParser',
    fullText: `电子发票
发票号码: 25517000000276570255
开票日期: 2025年07月29日
购买方: 四川省成都市教育科学研究院
纳税人识别号: 12510100MB0W123456
销售方: 成都市锦江区教育科学研究院
纳税人识别号: 91510104MA61234567
商品名称: 教育咨询服务
金额: 27.13
税额: 2.68
价税合计: 29.81
大写: 贰拾玖元捌角壹分
开票人: 张三
收款人: 李四
复核人: 王五`,
    file: null // 在实际使用中这里会是File对象
  },
  {
    fileName: '办公用品采购发票.pdf',
    invoiceNumber: '25517000000276570256',
    invoiceDate: '2025年07月28日',
    buyerName: '成都科技有限公司',
    buyerTaxId: '91510100MA61234568',
    sellerName: '四川办公用品有限公司',
    sellerTaxId: '91510100MA61234569',
    totalAmount: '1580.00',
    totalAmountChinese: '壹仟伍佰捌拾元整',
    taxAmount: '142.20',
    amountWithoutTax: '1437.80',
    drawer: '赵六',
    payee: '钱七',
    reviewer: '孙八',
    itemName: '办公桌椅、文具用品',
    parseMethod: 'PDFToWordParser',
    fullText: `增值税普通发票
发票号码: 25517000000276570256
开票日期: 2025年07月28日
购买方: 成都科技有限公司
纳税人识别号: 91510100MA61234568
销售方: 四川办公用品有限公司
纳税人识别号: 91510100MA61234569
商品名称: 办公桌椅、文具用品
金额: 1437.80
税额: 142.20
价税合计: 1580.00
大写: 壹仟伍佰捌拾元整
开票人: 赵六
收款人: 钱七
复核人: 孙八`,
    file: null
  },
  {
    fileName: '餐饮服务发票.pdf',
    invoiceNumber: '25517000000276570257',
    invoiceDate: '2025年07月27日',
    buyerName: '成都美食餐厅',
    buyerTaxId: '',
    sellerName: '四川食材供应商',
    sellerTaxId: '91510100MA61234570',
    totalAmount: '856.50',
    totalAmountChinese: '',
    taxAmount: '',
    amountWithoutTax: '',
    drawer: '',
    payee: '',
    reviewer: '',
    itemName: '新鲜蔬菜、肉类食材',
    parseMethod: 'PDFToWordParser',
    fullText: `普通发票
发票号码: 25517000000276570257
开票日期: 2025年07月27日
购买方: 成都美食餐厅
销售方: 四川食材供应商
纳税人识别号: 91510100MA61234570
商品名称: 新鲜蔬菜、肉类食材
价税合计: 856.50`,
    file: null
  }
])

// 处理预览
const handlePreview = (file) => {
  console.log('预览文件:', file)
  currentPreviewFile.value = file
  previewDialogVisible.value = true
}

// 处理重新解析
const handleReParse = () => {
  console.log('重新解析发票信息')
  // 这里可以添加重新解析的逻辑
}

// 处理下载
const handleDownload = (file) => {
  console.log('下载文件:', file)
  // 这里可以添加下载逻辑
}
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: white;
  text-align: center;
  margin-bottom: 16px;
  font-size: 28px;
  font-weight: 600;
}

.description {
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin-bottom: 32px;
  font-size: 16px;
  line-height: 1.6;
}
</style>