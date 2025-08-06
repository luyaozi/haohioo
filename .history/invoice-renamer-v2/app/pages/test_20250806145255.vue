<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">PDF解析测试</h1>
    
    <div class="mb-6">
      <button 
        @click="runTests" 
        :disabled="testing"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {{ testing ? '测试中...' : '开始测试' }}
      </button>
    </div>
    
    <div v-if="testResults.length > 0" class="space-y-6">
      <div 
        v-for="(result, index) in testResults" 
        :key="index"
        class="border rounded-lg p-4 bg-gray-50"
      >
        <h3 class="text-lg font-semibold mb-3 text-blue-600">
          {{ result.fileName }}
        </h3>
        
        <div v-if="result.success" class="space-y-2">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium">购买方名称:</span>
              <span class="ml-2" :class="result.data.buyerName ? 'text-green-600' : 'text-red-500'">
                {{ result.data.buyerName || '未识别' }}
              </span>
            </div>
            <div>
              <span class="font-medium">购买方税号:</span>
              <span class="ml-2" :class="result.data.buyerTaxId ? 'text-green-600' : 'text-red-500'">
                {{ result.data.buyerTaxId || '未识别' }}
              </span>
            </div>
            <div>
              <span class="font-medium">销售方名称:</span>
              <span class="ml-2" :class="result.data.sellerName ? 'text-green-600' : 'text-red-500'">
                {{ result.data.sellerName || '未识别' }}
              </span>
            </div>
            <div>
              <span class="font-medium">销售方税号:</span>
              <span class="ml-2" :class="result.data.sellerTaxId ? 'text-green-600' : 'text-red-500'">
                {{ result.data.sellerTaxId || '未识别' }}
              </span>
            </div>
            <div>
              <span class="font-medium">发票号码:</span>
              <span class="ml-2" :class="result.data.invoiceNumber ? 'text-green-600' : 'text-red-500'">
                {{ result.data.invoiceNumber || '未识别' }}
              </span>
            </div>
            <div>
              <span class="font-medium">开票日期:</span>
              <span class="ml-2" :class="result.data.invoiceDate ? 'text-green-600' : 'text-red-500'">
                {{ result.data.invoiceDate || '未识别' }}
              </span>
            </div>
            <div>
              <span class="font-medium">价税合计:</span>
              <span class="ml-2" :class="result.data.totalAmount ? 'text-green-600' : 'text-red-500'">
                {{ result.data.totalAmount || '未识别' }}
              </span>
            </div>
            <div>
              <span class="font-medium">开票人:</span>
              <span class="ml-2" :class="result.data.drawer ? 'text-green-600' : 'text-red-500'">
                {{ result.data.drawer || '未识别' }}
              </span>
            </div>
          </div>
          
          <div class="mt-3 p-2 bg-blue-50 rounded">
            <span class="font-medium">建议文件名:</span>
            <span class="ml-2 text-blue-700">{{ result.suggestedName }}</span>
          </div>
          
          <div v-if="result.rawText" class="mt-3">
            <details class="cursor-pointer">
              <summary class="font-medium text-gray-600">查看原始文本 (点击展开)</summary>
              <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">{{ result.rawText }}</pre>
            </details>
          </div>
        </div>
        
        <div v-else class="text-red-600">
          <span class="font-medium">解析失败:</span>
          <span class="ml-2">{{ result.error }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="testing" class="mt-6">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p class="mt-2 text-gray-600">正在测试第 {{ currentTestIndex + 1 }} 个文件...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PDFToWordParser } from '~/utils/pdfToWordParser'

const testing = ref(false)
const testResults = ref([])
const currentTestIndex = ref(0)

// 测试文件列表
const testFiles = [
  'digital_25617000000159404991.pdf',
  'dzfp_25617000000157131307_华西街（个人） (1).pdf',
  '【曹操出行-14.08元-1个行程】高德打车电子发票.pdf',
  '【风韵出行-17.61元-1个行程】高德打车电子发票.pdf',
  '【首汽约车-13.00元-1个行程】高德打车电子发票.pdf',
  '小拉出行电子发票.pdf',
  '鲁遥 创联教育 17.61元（发票号：25427000000324868238）.pdf',
  '鲁遥 创联教育 200元 （发票号：25512000000178722112）.pdf',
  '鲁遥 创联教育 213元 （发票号：25617000000157293120）.pdf',
  '鲁遥 创联教育 475.02元（发票号：25117000000989545210）.pdf'
]

async function runTests() {
  testing.value = true
  testResults.value = []
  currentTestIndex.value = 0
  
  const parser = new PDFToWordParser()
  
  for (let i = 0; i < testFiles.length; i++) {
    currentTestIndex.value = i
    const fileName = testFiles[i]
    
    try {
      // 模拟从服务器获取PDF文件
      const response = await fetch(`/api/test-pdf/${encodeURIComponent(fileName)}`)
      if (!response.ok) {
        throw new Error(`无法加载文件: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const result = await parser.parseInvoice(blob)
      const suggestedName = parser.generateFileName(result)
      
      // 获取原始文本用于调试
      const rawText = await parser.extractTextFromPDF(blob)
      
      testResults.value.push({
        fileName,
        success: true,
        data: result,
        suggestedName,
        rawText: rawText.substring(0, 1000) + (rawText.length > 1000 ? '...' : '')
      })
      
    } catch (error) {
      testResults.value.push({
        fileName,
        success: false,
        error: error.message
      })
    }
    
    // 添加小延迟以避免过快的请求
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  testing.value = false
}
</script>