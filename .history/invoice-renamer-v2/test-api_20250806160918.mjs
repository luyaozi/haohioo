#!/usr/bin/env node

import fetch from 'node-fetch'

async function testPDFParsing() {
  try {
    console.log('🧪 开始测试PDF解析API...')
    
    const response = await fetch('http://localhost:3002/api/test-pdf/digital_25617000000159404991.pdf')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const pdfBuffer = await response.arrayBuffer()
    console.log('✅ PDF文件获取成功，大小:', pdfBuffer.byteLength, 'bytes')
    
    // 这里我们只是验证API是否可访问
    // 实际的解析会在浏览器中进行
    console.log('📝 请在浏览器中访问 http://localhost:3002/test 并点击"开始测试"按钮')
    console.log('📝 然后查看浏览器控制台的解析日志')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

testPDFParsing()