#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 模拟解析结果测试
console.log('🧪 开始测试PDF解析结果...\n')

// 测试用例：基于您提供的发票内容
const testCases = [
  {
    name: '发票1 - 个人购买方',
    expectedData: {
      invoiceNumber: '25617000000159404991',
      invoiceDate: '2025年08月03日',
      buyerName: '个人',
      buyerTaxId: '', // 个人没有税号
      sellerName: '西安华讯得贸易有限公司',
      sellerTaxId: '91610139081030649M',
      itemName: '*纸制品*蓓秀黑金复方山茶油全包臀拉拉裤XXL码',
      totalAmount: '69.10',
      drawer: '王梅'
    },
    textLines: [
      '发票号码: 25617000000159404991',
      '电子发票(普通发票) 开票日期: 2025年08月03日',
      '购 销',
      '买 名 称 : 个人 售 名 称 : 西安华讯得贸易有限公司',
      '方 方',
      '信 统一社会信用代码 / 纳税人识别号 : 信 统一社会信用代码 / 纳税人识别号 :',
      '91610139081030649M',
      '息 息',
      '项目名称 规格型号 单位 数 量 单 价 金 额 税率 /征收率 税 额',
      '*纸制品*蓓秀黑金复方山茶油全包臀拉拉裤XXL码 黑金山茶油 箱 1 61.77 61.77 13% 8.03',
      '76片（26-30斤适用）【品牌直供 安心品质】',
      '*纸制品*蓓秀黑金复方山茶油全包臀拉拉裤XXL码 -0.62 13% -0.08',
      '76片（26-30斤适用）【品牌直供 安心品质】',
      '合 计 ¥61.15 ¥7.95',
      '价税合计(大写) 陆拾玖圆壹角 (小写) ¥69.10',
      '订单号:330983451652',
      '备',
      '注',
      '开票人: 王梅'
    ]
  },
  {
    name: '发票2 - 公司购买方',
    expectedData: {
      buyerName: '四川创联国培教育咨询有限公司',
      buyerTaxId: '91510104MA61TH556B',
      sellerName: '成都市新都区军屯加油站',
      sellerTaxId: '91510114202592263X7',
      itemName: '*汽油*成品油项目分类/',
      totalAmount: '200.00'
    },
    textLines: [
      '购买方 销售方',
      '名称：四川创联国培教育咨询有限公司 名称：成都市新都区军屯加油站',
      '统一社会信用代码/纳税人识别号：91510104MA61TH556B 统一社会信用代码/纳税人识别号：91510114202592263X7',
      '项目名称 规格型号 单位 数量 单价 金额 税率/征收率 税额',
      '*汽油*成品油项目分类/ 95# 升 26.809651474530 6.601769911504 176.99 13% 23.01',
      '石油制品/汽油类'
    ]
  }
]

// 模拟解析函数
function simulateParseSpecialFormat(lines) {
  const result = {
    buyerName: '',
    sellerName: '',
    buyerTaxId: '',
    sellerTaxId: '',
    itemName: '',
    invoiceNumber: '',
    invoiceDate: '',
    totalAmount: '',
    drawer: ''
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    // 发票号码
    const invoiceNumberMatch = line.match(/发票号码:\s*(\d+)/)
    if (invoiceNumberMatch) {
      result.invoiceNumber = invoiceNumberMatch[1]
    }

    // 开票日期
    const dateMatch = line.match(/开票日期:\s*(.+?)(?:\s|$)/)
    if (dateMatch) {
      result.invoiceDate = dateMatch[1].trim()
    }

    // 特殊格式：买 名 称 : 个人 售 名 称 : 西安华讯得贸易有限公司
    if (line.includes('买 名 称') || line.includes('售 名 称')) {
      console.log('📝 找到特殊格式名称行:', line)
      
      // 提取购买方
      const buyerMatch = line.match(/买 名 称\s*[:：]\s*([^\s]+)/)
      if (buyerMatch && buyerMatch[1]) {
        result.buyerName = buyerMatch[1].trim()
        console.log('✅ 提取到购买方名称:', result.buyerName)
      }
      
      // 提取销售方
      const sellerMatch = line.match(/售 名 称\s*[:：]\s*(.+?)(?=\s*$)/)
      if (sellerMatch && sellerMatch[1]) {
        result.sellerName = sellerMatch[1].trim()
        console.log('✅ 提取到销售方名称:', result.sellerName)
      }

      // 检查后续行是否包含税号
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j]
        if (!nextLine) continue
        
        const taxIdMatch = nextLine.match(/\b[A-Z0-9]{18}\b/)
        if (taxIdMatch && !result.sellerTaxId) {
          result.sellerTaxId = taxIdMatch[0]
          console.log('✅ 从后续行提取到销售方税号:', result.sellerTaxId)
          break
        }
      }
    }

    // 标准格式：名称：xxx
    if (line.includes('名称：') && line.includes('统一社会信用代码')) {
      const buyerNameMatch = line.match(/名称：([^统]+)/)
      const sellerNameMatch = line.match(/名称：[^名]*名称：(.+?)(?:\s|$)/)
      
      if (buyerNameMatch) {
        result.buyerName = buyerNameMatch[1].trim()
      }
      if (sellerNameMatch) {
        result.sellerName = sellerNameMatch[1].trim()
      }
    }

    // 税号行
    if (line.includes('统一社会信用代码') && line.includes('：')) {
      const taxIds = line.match(/[A-Z0-9]{18}/g)
      if (taxIds) {
        if (taxIds.length >= 1) result.buyerTaxId = taxIds[0]
        if (taxIds.length >= 2) result.sellerTaxId = taxIds[1]
      }
    }

    // 项目名称
    if (line.includes('*') && (line.includes('纸制品') || line.includes('汽油'))) {
      const itemMatch = line.match(/\*([^*]+)\*([^*]+)/)
      if (itemMatch) {
        result.itemName = `*${itemMatch[1]}*${itemMatch[2].split(/\s+/)[0]}`
      }
    }

    // 价税合计
    const totalMatch = line.match(/¥(\d+\.\d+)(?:\s*$)/)
    if (totalMatch && line.includes('小写')) {
      result.totalAmount = totalMatch[1]
    }

    // 开票人
    const drawerMatch = line.match(/开票人:\s*(.+)/)
    if (drawerMatch) {
      result.drawer = drawerMatch[1].trim()
    }
  }

  // 个人购买方清空税号
  if (result.buyerName && result.buyerName.includes('个人')) {
    result.buyerTaxId = ''
  }

  return result
}

// 运行测试
testCases.forEach((testCase, index) => {
  console.log(`\n🧪 测试用例 ${index + 1}: ${testCase.name}`)
  console.log('=' .repeat(50))
  
  const parseResult = simulateParseSpecialFormat(testCase.textLines)
  
  console.log('\n📊 解析结果:')
  console.log('发票号码:', parseResult.invoiceNumber || '未提取')
  console.log('开票日期:', parseResult.invoiceDate || '未提取')
  console.log('购买方名称:', parseResult.buyerName || '未提取')
  console.log('购买方税号:', parseResult.buyerTaxId || '未提取')
  console.log('销售方名称:', parseResult.sellerName || '未提取')
  console.log('销售方税号:', parseResult.sellerTaxId || '未提取')
  console.log('项目名称:', parseResult.itemName || '未提取')
  console.log('价税合计:', parseResult.totalAmount || '未提取')
  console.log('开票人:', parseResult.drawer || '未提取')
  
  console.log('\n🎯 期望结果:')
  Object.entries(testCase.expectedData).forEach(([key, value]) => {
    const actual = parseResult[key] || '未提取'
    const status = actual === value ? '✅' : '❌'
    console.log(`${status} ${key}: 期望"${value}" 实际"${actual}"`)
  })
})

console.log('\n🎉 测试完成！')
console.log('\n💡 建议的文件名格式:')
testCases.forEach((testCase, index) => {
  const result = simulateParseSpecialFormat(testCase.textLines)
  const fileName = `${result.buyerName || '未知'} ${result.sellerName || '未知'} ${result.totalAmount || '0'}元 （发票号：${result.invoiceNumber || '未知'}）.pdf`
  console.log(`${index + 1}. ${fileName}`)
})