/**
 * PDF转Word文档解析器
 * 将PDF转换为结构化的文本，然后按行列解析发票信息
 */

import type { TextItem } from "pdfjs-dist/types/src/display/api"
import { getPdfjs } from "./pdfWorkerManager"
import { EnhancedInvoiceParser } from './invoice/enhancedParser'

interface ParsedInvoiceInfo {
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
  parseMethod: string
  fullText: string
}

export class PDFToWordParser {
  private initialized = false
  private getDocument: any = null
  private instanceId: string

  constructor() {
    this.instanceId = Math.random().toString(36).substr(2, 9)
    console.log(`🏗️ 创建 PDFToWordParser 实例: ${this.instanceId}`)
  }

  // 发票信息提取的正则表达式模式
  private invoicePatterns = {
    // 发票号码
    invoiceNumber: [
      /发票号码[：:]\s*(\d+)/,
      /票据号码[：:]\s*(\d+)/,
      /No[：:]\s*(\d+)/,
      /发票代码[：:]\s*(\d+)/,
      /(\d{8,})/,
    ],

    // 金额
    amount: [
      /价税合计[：:]\s*[￥¥]?(\d+\.?\d*)/,
      /合计金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
      /总金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
      /[￥¥]\s*(\d+\.?\d*)/,
      /金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
      /合计[：:]\s*[￥¥]?(\d+\.?\d*)/,
      /(\d+\.\d{2})元/,
      /小写[：:]\s*[￥¥]?(\d+\.?\d*)/,
    ],

    // 购买方信息
    buyer: [
      /购买方[：:]?\s*名称[：:]?\s*([^\n\r]+)/,
      /购买方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|销售方|$)/,
      /买方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|卖方|销售方|$)/,
      /客户[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|销售方|$)/,
    ],

    // 销售方信息
    seller: [
      /销售方[：:]?\s*名称[：:]?\s*([^\n\r]+)/,
      /销售方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|购买方|$)/,
      /卖方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|买方|购买方|$)/,
      /开票方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|购买方|$)/,
    ],

    // 开票日期
    date: [
      /开票日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
      /日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
      /(\d{4}年\d{1,2}月\d{1,2}日)/,
      /(\d{4}-\d{1,2}-\d{1,2})/,
    ],

    // 税号
    buyerTaxId: [
      /购买方.*?纳税人识别号[：:]\s*([A-Z0-9]+)/,
      /购买方.*?税号[：:]\s*([A-Z0-9]+)/,
      /买方.*?纳税人识别号[：:]\s*([A-Z0-9]+)/,
      /买方.*?税号[：:]\s*([A-Z0-9]+)/,
    ],

    sellerTaxId: [
      /销售方.*?纳税人识别号[：:]\s*([A-Z0-9]+)/,
      /销售方.*?税号[：:]\s*([A-Z0-9]+)/,
      /卖方.*?纳税人识别号[：:]\s*([A-Z0-9]+)/,
      /卖方.*?税号[：:]\s*([A-Z0-9]+)/,
    ],

    // 税额
    taxAmount: [
      /税额[：:]\s*[￥¥]?(\d+\.?\d*)/,
      /增值税额[：:]\s*[￥¥]?(\d+\.?\d*)/,
    ],

    // 不含税金额
    amountWithoutTax: [
      /不含税金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
      /金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
    ],

    // 开票人
    drawer: [/开票人[：:]\s*([^\s\n\r]+)/, /制票人[：:]\s*([^\s\n\r]+)/],

    // 收款人
    payee: [/收款人[：:]\s*([^\s\n\r]+)/],

    // 复核人
    reviewer: [/复核人[：:]\s*([^\s\n\r]+)/, /审核人[：:]\s*([^\s\n\r]+)/],

    // 项目名称
    itemName: [
      /(?:商品|服务|项目)名称[：:]\s*([^\n\r]+)/,
      /货物或应税劳务.*?名称[：:]\s*([^\n\r]+)/,
      /品名[：:]\s*([^\n\r]+)/,
    ],

    // 大写金额
    totalAmountChinese: [
      /大写[：:]\s*([^\n\r]+)/,
      /价税合计.*?大写[：:]\s*([^\n\r]+)/,
    ],
  }

  /**
   * 初始化 PDF.js
   */
  private async init() {
    if (this.initialized) {
      console.log(`📋 实例 ${this.instanceId} 已初始化，跳过重复初始化`)
      return
    }

    try {
      console.log(`🚀 开始初始化实例 ${this.instanceId}`)
      // 使用全局worker管理器
      const pdfjs = await getPdfjs()
      this.getDocument = pdfjs.getDocument
      this.initialized = true
      console.log(`✅ 实例 ${this.instanceId} 初始化成功`)
    } catch (error) {
      console.error(`❌ 实例 ${this.instanceId} 初始化失败:`, error)
      throw new Error("PDF解析器初始化失败")
    }
  }

  /**
   * 解析PDF文件
   */
  async parseFile(file: File): Promise<ParsedInvoiceInfo> {
    await this.init()

    if (!this.getDocument) {
      throw new Error("PDF解析器未正确初始化")
    }

    try {
      console.log(`开始解析PDF: ${file.name}`)

      // 读取PDF文件
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const pdf = await this.getDocument!({ data }).promise

      let fullText = ""
      const pages = []

      // 逐页提取文本
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()

        // 按位置排序文本项
        const sortedItems = this.sortTextItems(textContent.items)
        const pageText = this.reconstructText(sortedItems)

        pages.push({
          pageNumber: i,
          text: pageText,
          items: sortedItems,
        })

        fullText += pageText + "\n"
      }

      // 使用基础解析器
    const basicInfo = this.parseInvoiceInfo(fullText)
    
    // 使用四列结构解析器（重点解析购买方和销售方信息）
    const fourColumnInfo = this.parseFourColumnStructure(fullText)
    
    // 使用增强解析器补充缺失字段
    const enhancedInfo = EnhancedInvoiceParser.parseAllFields(fullText)
    
    // 合并解析结果，优先级：四列结构 > 增强解析 > 基础解析
     const invoiceInfo = {
       ...basicInfo,
       ...Object.fromEntries(
         Object.entries(enhancedInfo).filter(([_, value]) => value && typeof value === 'string' && value.trim() !== "")
       ),
       ...Object.fromEntries(
         Object.entries(fourColumnInfo).filter(([_, value]) => value && typeof value === 'string' && value.trim() !== "")
       )
     }
    
    console.log('📊 基础解析结果:', basicInfo)
     console.log('🔧 四列结构解析结果:', fourColumnInfo)
     console.log('🚀 增强解析结果:', enhancedInfo)
     console.log('✅ 最终解析结果:', invoiceInfo)

      return {
        ...invoiceInfo,
        fileName: file.name,
        parseMethod: "PDFToWordParser",
        fullText,
      }
    } catch (error: any) {
      console.error(`解析PDF失败: ${file.name}`, error)
      throw new Error(`解析PDF失败: ${error.message}`)
    }
  }

  /**
   * 按位置排序文本项（从上到下，从左到右）
   */
  private sortTextItems(items: TextItem[]) {
    return items.sort((a, b) => {
      // 首先按Y坐标排序（从上到下）
      const yDiff = b.transform[5] - a.transform[5]
      if (Math.abs(yDiff) > 5) {
        // 5像素的容差
        return yDiff
      }
      // 如果在同一行，按X坐标排序（从左到右）
      return a.transform[4] - b.transform[4]
    })
  }

  /**
   * 重构文本，保持空间关系
   */
  private reconstructText(items: TextItem[]): string {
    if (items.length === 0) return ""

    let result = ""
    let currentY = items[0]?.transform[5] || 0
    let currentLine = ""

    for (const item of items) {
      const y = item.transform[5]

      // 如果Y坐标变化超过阈值，认为是新行
      if (Math.abs(y - currentY) > 5) {
        if (currentLine.trim()) {
          result += currentLine.trim() + "\n"
        }
        currentLine = item.str
        currentY = y
      } else {
        // 同一行，添加适当的空格
        if (
          currentLine &&
          !currentLine.endsWith(" ") &&
          !item.str.startsWith(" ")
        ) {
          currentLine += " "
        }
        currentLine += item.str
      }
    }

    // 添加最后一行
    if (currentLine.trim()) {
      result += currentLine.trim()
    }

    return result
  }

  /**
   * 解析四列结构的发票信息（基于v1版本逻辑，按行分析制表符分隔的列结构）
   */
  private parseFourColumnStructure(text: string): Partial<ParsedInvoiceInfo> {
    console.log('🔧 开始四列结构解析...')
    
    const result: Partial<ParsedInvoiceInfo> = {}
    const lines = text.split('\n')
    
    // 调试：输出前50行文本内容来分析发票格式
    console.log('🔍 输出前50行文本内容进行分析...')
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const line = lines[i]
      if (line && line.trim()) {
        console.log(`📝 第${i}行:`, JSON.stringify(line))
        if (line.includes('\t')) {
          const columns = line.split('\t')
          console.log(`   制表符分割(${columns.length}列):`, columns.map(col => `"${col.trim()}"`))
        }
      }
    }
    
    // 调试：输出所有包含购买方/销售方相关关键词的行
    console.log('🔍 查找包含购买方/销售方信息的行...')
    const keywords = ['名称', '购买方', '销售方', '买方', '卖方', '收款方', '付款方']
    lines.forEach((line, index) => {
      if (line) {
        const foundKeywords = keywords.filter(keyword => line.includes(keyword))
        if (foundKeywords.length > 0) {
          console.log(`📝 第${index}行包含关键词[${foundKeywords.join(', ')}]:`, JSON.stringify(line))
          console.log(`📝 该行是否包含制表符:`, line.includes('\t'))
          if (line.includes('\t')) {
            const columns = line.split('\t')
            console.log(`📝 制表符分割结果(${columns.length}列):`, columns.map(col => `"${col}"`))
          }
        }
      }
    })
    
    try {
      // 遍历每一行，查找包含购买方和销售方名称的行
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!line) continue
        
        // 查找包含购买方和销售方名称的行（排除表头行）
        if ((line.includes('名称：') || line.includes('名 称:')) && line.includes('\t') && 
            !line.includes('项目名称') && !line.includes('规格型号')) {
          console.log('📝 找到名称行:', line)
          const columns = line.split('\t').filter(col => col.trim())
          console.log('📝 名称行分割结果:', columns.map(col => `"${col}"`))
          
          // 分析行结构，寻找购买方和销售方信息
          let buyerNameCol = -1
          let sellerNameCol = -1
          
          for (let j = 0; j < columns.length; j++) {
            const col = columns[j]?.trim()
            if (!col) continue
            
            // 购买方名称列 - 支持多种格式
            if ((col.includes('购') || col.includes('买')) && (col.includes('名称：') || col.includes('名 称:'))) {
              console.log('🔍 找到购买方名称列:', col)
              // 标准格式：名称：xxx
              let buyerMatch = col.match(/名称：(.+)/)
              if (!buyerMatch) {
                // 特殊格式：买名 称:xxx
                buyerMatch = col.match(/名 称:(.+)/)
              }
              if (buyerMatch && buyerMatch[1]) {
                result.buyerName = buyerMatch[1].trim()
                console.log('✅ 提取到购买方名称:', result.buyerName)
              }
              buyerNameCol = j
            }
            
            // 销售方名称列 - 支持多种格式
            if ((col.includes('销') || col.includes('售')) && (col.includes('名称：') || col.includes('名 称:'))) {
              console.log('🔍 找到销售方名称列:', col)
              // 标准格式：名称：xxx
              let sellerMatch = col.match(/名称：(.+)/)
              if (!sellerMatch) {
                // 特殊格式：售名 称:xxx
                sellerMatch = col.match(/名 称:(.+)/)
              }
              if (sellerMatch && sellerMatch[1]) {
                result.sellerName = sellerMatch[1].trim()
                console.log('✅ 提取到销售方名称:', result.sellerName)
              }
              sellerNameCol = j
            }
          }
          
          // 如果名称在标签列中没有找到完整内容，检查相邻列
          if (buyerNameCol >= 0 && !result.buyerName && buyerNameCol + 1 < columns.length) {
            const nextCol = columns[buyerNameCol + 1]?.trim()
            if (nextCol && !nextCol.includes('售') && !nextCol.includes('方')) {
              result.buyerName = nextCol
              console.log('✅ 从相邻列提取到购买方名称:', result.buyerName)
            }
          }
          
          if (sellerNameCol >= 0 && !result.sellerName && sellerNameCol + 1 < columns.length) {
            const nextCol = columns[sellerNameCol + 1]?.trim()
            if (nextCol && !nextCol.includes('买') && !nextCol.includes('方')) {
              result.sellerName = nextCol
              console.log('✅ 从相邻列提取到销售方名称:', result.sellerName)
            }
          }
        }
        
        // 特殊处理：查找包含购买方和销售方信息的单行格式
        // 例如："买 名 称 : 个人 售 名 称 : 西安华讯得贸易有限公司"
        if (!result.buyerName && !result.sellerName && 
            (line.includes('买 名 称') || line.includes('售 名 称'))) {
          console.log('📝 找到特殊格式名称行:', line)
          
          // 提取购买方 - 支持多种格式
          let buyerMatch = line.match(/买 名 称\s*[:：]\s*([^\s]+)/)
          if (!buyerMatch) {
            buyerMatch = line.match(/买名 称\s*[:：]\s*([^\s]+)/)
          }
          if (buyerMatch && buyerMatch[1]) {
            result.buyerName = buyerMatch[1].trim()
            console.log('✅ 提取到购买方名称(特殊格式):', result.buyerName)
          }
          
          // 提取销售方 - 支持多种格式
          let sellerMatch = line.match(/售 名 称\s*[:：]\s*(.+?)(?=\s*$)/)
          if (!sellerMatch) {
            sellerMatch = line.match(/售名 称\s*[:：]\s*(.+?)(?=\s*$)/)
          }
          if (sellerMatch && sellerMatch[1]) {
            result.sellerName = sellerMatch[1].trim()
            console.log('✅ 提取到销售方名称(特殊格式):', result.sellerName)
          }
        }
        
        // 查找包含税号的行（排除表头行）
        if ((line.includes('统一社会信用代码') || line.includes('纳税人识别号')) && 
            !line.includes('信 统一社会信用代码 / 纳税人识别号 : 信 统一社会信用代码 / 纳税人识别号 :')) {
          console.log('📝 找到税号行:', line)
          
          // 尝试多种分割方式
          let columns = []
          if (line.includes('\t')) {
            columns = line.split('\t').filter(col => col.trim())
            console.log('📝 制表符分割结果:', columns.map(col => `"${col}"`))
          } else {
            // 如果没有制表符，尝试按空格分割
            columns = line.split(/\s+/).filter(col => col.trim())
            console.log('📝 空格分割结果:', columns.map(col => `"${col}"`))
          }
          
          // 在整行中查找税号
          const allTaxIds = line.match(/[A-Z0-9]{18}/g)
          if (allTaxIds) {
            console.log('🔍 在整行中找到税号:', allTaxIds)
            
            // 如果找到多个税号，第一个是购买方，第二个是销售方
            if (allTaxIds.length >= 1) {
              result.buyerTaxId = allTaxIds[0]
              console.log('✅ 设置购买方税号:', allTaxIds[0])
            }
            if (allTaxIds.length >= 2) {
              result.sellerTaxId = allTaxIds[1]
              console.log('✅ 设置销售方税号:', allTaxIds[1])
            }
          } else {
            // 如果没有找到标准18位税号，尝试在各列中查找
            for (let j = 0; j < columns.length; j++) {
              const col = columns[j]?.trim()
              if (!col) continue
              
              // 提取税号（18位数字字母组合）
              const taxIdMatch = col.match(/([A-Z0-9]{18})/)
              if (taxIdMatch && taxIdMatch[1]) {
                const taxId = taxIdMatch[1]
                console.log(`🔍 在第${j}列找到税号:`, taxId)
                
                // 根据位置判断是购买方还是销售方的税号
                if (j < columns.length / 2) {
                  result.buyerTaxId = taxId
                  console.log('✅ 设置为购买方税号:', taxId)
                } else {
                  result.sellerTaxId = taxId
                  console.log('✅ 设置为销售方税号:', taxId)
                }
              }
            }
          }
        }
        
        // 查找单独的购买方信息行
        if ((line.includes('购买方') || line.includes('买方')) && !line.includes('项目名称') && !line.includes('规格型号')) {
          console.log('📝 找到购买方信息行:', line)
          
          // 提取购买方名称
          const buyerNameMatch = line.match(/(?:购买方|买方)[：:\s]*([^\s\t]+)/)
          if (buyerNameMatch && buyerNameMatch[1]) {
            result.buyerName = buyerNameMatch[1].trim()
            console.log('✅ 从购买方行提取到名称:', result.buyerName)
          }
          
          // 提取购买方税号
          const buyerTaxMatch = line.match(/\b[A-Z0-9]{18}\b/)
          if (buyerTaxMatch) {
            result.buyerTaxId = buyerTaxMatch[0]
            console.log('✅ 从购买方行提取到税号:', result.buyerTaxId)
          }
        }
        
        // 查找单独的销售方信息行
        if ((line.includes('销售方') || line.includes('卖方') || line.includes('售方')) && !line.includes('项目名称') && !line.includes('规格型号')) {
          console.log('📝 找到销售方信息行:', line)
          
          // 提取销售方名称
          const sellerNameMatch = line.match(/(?:销售方|卖方|售方)[：:\s]*([^\s\t]+)/)
          if (sellerNameMatch && sellerNameMatch[1]) {
            result.sellerName = sellerNameMatch[1].trim()
            console.log('✅ 从销售方行提取到名称:', result.sellerName)
          }
          
          // 提取销售方税号
          const sellerTaxMatch = line.match(/\b[A-Z0-9]{18}\b/)
          if (sellerTaxMatch) {
            result.sellerTaxId = sellerTaxMatch[0]
            console.log('✅ 从销售方行提取到税号:', result.sellerTaxId)
          }
        }
      }
      
      // 如果没有通过四列结构找到，尝试其他模式
       if (!result.buyerName) {
         console.log('🔍 尝试其他购买方模式...')
         const buyerPatterns = [
           /购买方[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/,
           /买方[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/,
           /客户[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/,
           // 新增：更灵活的模式
           /购买方.*?名称[：:]?\s*([^\s\n\t]+)/,
           /买方.*?名称[：:]?\s*([^\s\n\t]+)/,
           /购.*?名称[：:]?\s*([^\s\n\t]+)/
         ]
         
         for (const pattern of buyerPatterns) {
           const match = text.match(pattern)
           if (match && match[1]) {
             result.buyerName = match[1].trim()
             console.log('✅ 通过模式匹配找到购买方名称:', result.buyerName)
             break
           }
         }
       }
       
       if (!result.sellerName) {
         console.log('🔍 尝试其他销售方模式...')
         const sellerPatterns = [
           /销售方[^：]*：[^购]*?([^：\s]+(?:公司|企业|个人|店))/,
           /卖方[^：]*：[^购]*?([^：\s]+(?:公司|企业|个人|店))/,
           /开票方[^：]*：[^购]*?([^：\s]+(?:公司|企业|个人|店))/,
           // 新增：更灵活的模式
           /销售方.*?名称[：:]?\s*([^\s\n\t]+)/,
           /卖方.*?名称[：:]?\s*([^\s\n\t]+)/,
           /销.*?名称[：:]?\s*([^\s\n\t]+)/
         ]
         
         for (const pattern of sellerPatterns) {
           const match = text.match(pattern)
           if (match && match[1]) {
             result.sellerName = match[1].trim()
             console.log('✅ 通过模式匹配找到销售方名称:', result.sellerName)
             break
           }
         }
       }
       
       // 如果仍然没有找到名称，尝试在包含关键词的行中查找
       if (!result.buyerName || !result.sellerName) {
         console.log('🔍 在关键词行中查找名称信息...')
         for (let i = 0; i < lines.length; i++) {
           const line = lines[i]
           if (!line) continue
           
           // 查找包含购买方信息的行
           if (!result.buyerName && (line.includes('购买方') || line.includes('买方'))) {
             console.log('📝 找到购买方相关行:', line)
             // 尝试提取紧跟在关键词后的内容
             const buyerMatch = line.match(/(?:购买方|买方)[^：]*[：:]?\s*([^\s\n\t]+)/)
             if (buyerMatch && buyerMatch[1]) {
               result.buyerName = buyerMatch[1].trim()
               console.log('✅ 从关键词行提取购买方名称:', result.buyerName)
             }
           }
           
           // 查找包含销售方信息的行
           if (!result.sellerName && (line.includes('销售方') || line.includes('卖方'))) {
             console.log('📝 找到销售方相关行:', line)
             // 尝试提取紧跟在关键词后的内容
             const sellerMatch = line.match(/(?:销售方|卖方)[^：]*[：:]?\s*([^\s\n\t]+)/)
             if (sellerMatch && sellerMatch[1]) {
               result.sellerName = sellerMatch[1].trim()
               console.log('✅ 从关键词行提取销售方名称:', result.sellerName)
             }
           }
         }
       }
      
      // 处理个人购买方，清空税号
      if (result.buyerName && (result.buyerName.includes('个人') || result.buyerName.includes('（个人）'))) {
        result.buyerTaxId = ''
        console.log('✅ 个人购买方，清空税号')
      }
      
      // 提取项目名称
      result.itemName = this.extractItemNameFromLines(lines)
      
    } catch (error) {
      console.warn('四列结构解析出错:', error)
    }
    
    console.log('🎯 四列结构解析结果:', result)
    return result
  }

  /**
   * 从行数据中提取项目名称
   */
  private extractItemNameFromLines(lines: string[]): string {
     let itemName = ''
     
     // 查找项目明细表格的开始位置
     let itemStartIndex = -1
     for (let i = 0; i < lines.length; i++) {
       const line = lines[i]
       if (!line) continue
       const trimmedLine = line.trim()
       if (trimmedLine.includes('项目名称') || 
           trimmedLine.includes('货物或应税劳务') ||
           (trimmedLine.includes('*') && (trimmedLine.includes('服务') || trimmedLine.includes('商品')))) {
         itemStartIndex = i
         break
       }
     }
     
     if (itemStartIndex === -1) {
       console.log('❌ 未找到项目明细表格开始位置')
       return itemName
     }
     
     // 从表格开始位置向下查找第一个有效的项目行
     for (let i = itemStartIndex + 1; i < lines.length; i++) {
       const line = lines[i]
       if (!line) continue
       const trimmedLine = line.trim()
       
       // 跳过空行
       if (!trimmedLine) continue
       
       // 跳过分隔线
       if (/^[-─═]+$/.test(trimmedLine)) continue
       
       // 跳过非项目明细行
       if (trimmedLine.includes('合计') || 
           trimmedLine.includes('价税合计') || 
           trimmedLine.includes('开票人') ||
           trimmedLine.includes('收款人') ||
           trimmedLine.includes('复核') ||
           trimmedLine.includes('销售方') ||
           trimmedLine.includes('购买方')) {
         break
       }
       
       // 解析第一列作为项目名称
       const columns = trimmedLine.split(/\t+/)
       if (columns.length > 0) {
         const firstColumn = columns[0]?.trim()
         if (!firstColumn) continue
         
         // 处理星号分类项目
         if (firstColumn.startsWith('*') && firstColumn.endsWith('*')) {
           // 提取星号中间的内容
           const match = firstColumn.match(/\*([^*]+)\*/)
           if (match && match[1]) {
             itemName = match[1]
             break
           }
         } else if (firstColumn) {
           itemName = firstColumn
           break
         }
       }
     }
     
     console.log('✅ 提取到的项目名称:', itemName)
     return itemName
   }

  /**
   * 解析发票信息
   */
  private parseInvoiceInfo(
    text: string
  ): Omit<ParsedInvoiceInfo, "fileName" | "parseMethod" | "fullText"> {
    const info: any = {
      invoiceNumber: "",
      invoiceDate: "",
      buyerName: "",
      buyerTaxId: "",
      sellerName: "",
      sellerTaxId: "",
      totalAmount: "",
      totalAmountChinese: "",
      taxAmount: "",
      amountWithoutTax: "",
      drawer: "",
      payee: "",
      reviewer: "",
      itemName: "",
    }

    // 使用正则表达式提取信息
    for (const [key, patterns] of Object.entries(this.invoicePatterns)) {
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          const value = match[1].trim()

          switch (key) {
            case "invoiceNumber":
              info.invoiceNumber = value
              break
            case "date":
              info.invoiceDate = value
              break
            case "buyer":
              info.buyerName = value
              break
            case "seller":
              info.sellerName = value
              break
            case "amount":
              info.totalAmount = value
              break
            case "buyerTaxId":
              info.buyerTaxId = value
              break
            case "sellerTaxId":
              info.sellerTaxId = value
              break
            case "taxAmount":
              info.taxAmount = value
              break
            case "amountWithoutTax":
              info.amountWithoutTax = value
              break
            case "drawer":
              info.drawer = value
              break
            case "payee":
              info.payee = value
              break
            case "reviewer":
              info.reviewer = value
              break
            case "itemName":
              info.itemName = value
              break
            case "totalAmountChinese":
              info.totalAmountChinese = value
              break
          }
          break
        }
      }
    }

    return info
  }
}

export default PDFToWordParser
