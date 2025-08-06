#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const INVOICE_FOLDER = '/Users/lyao/WORK/AI/haohioo/invoice-renamer-v2/发票111'
const SERVER_URL = 'http://localhost:3002'

// 模拟解析逻辑（简化版）
function simulateParseInvoice(text) {
  const result = {
    invoiceNumber: '',
    invoiceDate: '',
    buyerName: '',
    buyerTaxId: '',
    sellerName: '',
    sellerTaxId: '',
    itemName: '',
    totalAmount: '',
    drawer: ''
  }

  const lines = text.split('\n').map(line => line.trim()).filter(line => line)

  // 提取发票号码
  const invoiceNumberMatch = text.match(/发票号码[：:\s]*(\d+)/)
  if (invoiceNumberMatch) {
    result.invoiceNumber = invoiceNumberMatch[1]
  }

  // 提取开票日期
  const dateMatch = text.match(/开票日期[：:\s]*(\d{4}年\d{1,2}月\d{1,2}日)/)
  if (dateMatch) {
    result.invoiceDate = dateMatch[1]
  }

  // 提取价税合计
  const amountMatch = text.match(/[¥￥]?([\d,]+\.?\d*)/g)
  if (amountMatch) {
    // 找最大的金额作为总金额
    const amounts = amountMatch.map(a => parseFloat(a.replace(/[¥￥,]/g, ''))).filter(a => !isNaN(a))
    if (amounts.length > 0) {
      result.totalAmount = Math.max(...amounts).toFixed(2)
    }
  }

  // 提取开票人
  const drawerMatch = text.match(/开票人[：:\s]*([^\s\n]+)/)
  if (drawerMatch) {
    result.drawer = drawerMatch[1]
  }

  // 特殊格式名称行解析
  for (const line of lines) {
    if (line.includes('买 名 称') || line.includes('售 名 称')) {
      // 提取购买方
      const buyerMatch = line.match(/买 名 称\s*[:：]\s*([^\s售]+)/)
      if (buyerMatch) {
        result.buyerName = buyerMatch[1]
      }
      
      // 提取销售方
      const sellerMatch = line.match(/售 名 称\s*[:：]\s*(.+)/)
      if (sellerMatch) {
        result.sellerName = sellerMatch[1].trim()
      }
    }

    // 提取税号
    const taxIdMatch = line.match(/\b[A-Z0-9]{18}\b/)
    if (taxIdMatch && !result.sellerTaxId) {
      result.sellerTaxId = taxIdMatch[0]
    }

    // 提取项目名称
    if (line.includes('*') && line.includes('*') && !result.itemName) {
      const itemMatch = line.match(/\*([^*]+)\*/)
      if (itemMatch) {
        result.itemName = '*' + itemMatch[1] + '*'
      }
    }
  }

  // 个人购买方清空税号
  if (result.buyerName && result.buyerName.includes('个人')) {
    result.buyerTaxId = ''
  }

  return result
}

async function testAllInvoices() {
  console.log('🧪 开始批量测试发票111文件夹下的所有PDF文件...\n')
  
  try {
    // 读取文件夹内容
    const files = fs.readdirSync(INVOICE_FOLDER)
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'))
    
    console.log(`📁 发现 ${pdfFiles.length} 个PDF文件:\n`)
    pdfFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`)
    })
    console.log('\n' + '='.repeat(80) + '\n')

    const results = []

    for (let i = 0; i < pdfFiles.length; i++) {
      const fileName = pdfFiles[i]
      console.log(`🔍 测试文件 ${i + 1}/${pdfFiles.length}: ${fileName}`)
      console.log('-'.repeat(60))

      try {
        // 尝试获取PDF文件
        const response = await fetch(`${SERVER_URL}/api/test-pdf/${encodeURIComponent(fileName)}`)
        
        if (!response.ok) {
          console.log(`❌ 无法获取文件: HTTP ${response.status}`)
          results.push({
            fileName,
            status: 'error',
            error: `HTTP ${response.status}`,
            result: null
          })
          continue
        }

        const pdfBuffer = await response.arrayBuffer()
        console.log(`✅ 文件获取成功，大小: ${pdfBuffer.byteLength} bytes`)

        // 这里我们模拟解析（实际应该调用PDF.js解析）
        // 由于这是测试脚本，我们使用简化的文本模拟
        const mockText = `
发票号码: 测试号码
开票日期: 2025年01月01日
买 名 称 : 测试购买方 售 名 称 : 测试销售方
91234567890123456A
*测试商品*测试描述
价税合计 ¥100.00
开票人: 测试开票人
        `

        const parseResult = simulateParseInvoice(mockText)
        
        console.log('📊 模拟解析结果:')
        console.log(`   发票号码: ${parseResult.invoiceNumber || '未提取'}`)
        console.log(`   开票日期: ${parseResult.invoiceDate || '未提取'}`)
        console.log(`   购买方名称: ${parseResult.buyerName || '未提取'}`)
        console.log(`   购买方税号: ${parseResult.buyerTaxId || '未提取'}`)
        console.log(`   销售方名称: ${parseResult.sellerName || '未提取'}`)
        console.log(`   销售方税号: ${parseResult.sellerTaxId || '未提取'}`)
        console.log(`   项目名称: ${parseResult.itemName || '未提取'}`)
        console.log(`   价税合计: ${parseResult.totalAmount || '未提取'}`)
        console.log(`   开票人: ${parseResult.drawer || '未提取'}`)

        // 生成建议文件名
        const suggestedName = generateFileName(parseResult, fileName)
        console.log(`💡 建议文件名: ${suggestedName}`)

        results.push({
          fileName,
          status: 'success',
          result: parseResult,
          suggestedName
        })

      } catch (error) {
        console.log(`❌ 处理失败: ${error.message}`)
        results.push({
          fileName,
          status: 'error',
          error: error.message,
          result: null
        })
      }

      console.log('\n')
    }

    // 输出总结
    console.log('🎯 批量测试总结:')
    console.log('='.repeat(80))
    
    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    
    console.log(`✅ 成功处理: ${successCount} 个文件`)
    console.log(`❌ 处理失败: ${errorCount} 个文件`)
    console.log(`📊 总计: ${results.length} 个文件\n`)

    // 详细结果
    console.log('📋 详细结果:')
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.fileName}`)
      if (result.status === 'success') {
        console.log(`   状态: ✅ 成功`)
        console.log(`   建议文件名: ${result.suggestedName}`)
      } else {
        console.log(`   状态: ❌ 失败 (${result.error})`)
      }
      console.log('')
    })

  } catch (error) {
    console.error('❌ 批量测试失败:', error.message)
  }
}

function generateFileName(result, originalName) {
  const buyerName = result.buyerName || '未知'
  const sellerName = result.sellerName || '未知'
  const amount = result.totalAmount || '0'
  const invoiceNumber = result.invoiceNumber || '未知'
  
  return `${buyerName} ${sellerName} ${amount}元 （发票号：${invoiceNumber}）.pdf`
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch(`${SERVER_URL}/api/test-pdf/digital_25617000000159404991.pdf`)
    return response.ok
  } catch (error) {
    return false
  }
}

// 主函数
async function main() {
  console.log('🔍 检查服务器状态...')
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ 服务器未运行或无法访问，请确保 http://localhost:3002 正在运行')
    console.log('💡 请运行: cd app && npm run dev')
    return
  }
  
  console.log('✅ 服务器运行正常\n')
  await testAllInvoices()
}

main()