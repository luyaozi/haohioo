/**
 * 发票信息解析器
 * 专门处理从文本中提取发票字段信息
 */

import { invoicePatterns } from './patterns'

export interface ParsedInvoiceInfo {
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

export class InvoiceInfoParser {
  /**
   * 解析发票信息
   */
  static parseInvoiceInfo(
    text: string
  ): Omit<ParsedInvoiceInfo, "fileName" | "parseMethod" | "fullText"> {
    console.log('🔍 开始解析发票信息，文本长度:', text.length)
    console.log('📄 原始文本预览:', text.substring(0, 500))

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
    for (const [key, patterns] of Object.entries(invoicePatterns)) {
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          const value = match[1].trim()
          console.log(`✅ 匹配到 ${key}:`, value, '使用模式:', pattern.source)

          switch (key) {
            case "invoiceNumber":
              if (!info.invoiceNumber) info.invoiceNumber = value
              break
            case "date":
              if (!info.invoiceDate) info.invoiceDate = value
              break
            case "buyer":
              if (!info.buyerName) info.buyerName = value
              break
            case "seller":
              if (!info.sellerName) info.sellerName = value
              break
            case "amount":
              if (!info.totalAmount) info.totalAmount = value
              break
            case "buyerTaxId":
              if (!info.buyerTaxId) info.buyerTaxId = value
              break
            case "sellerTaxId":
              if (!info.sellerTaxId) info.sellerTaxId = value
              break
            case "taxAmount":
              if (!info.taxAmount) info.taxAmount = value
              break
            case "amountWithoutTax":
              if (!info.amountWithoutTax) info.amountWithoutTax = value
              break
            case "drawer":
              if (!info.drawer) info.drawer = value
              break
            case "payee":
              if (!info.payee) info.payee = value
              break
            case "reviewer":
              if (!info.reviewer) info.reviewer = value
              break
            case "itemName":
              if (!info.itemName) info.itemName = value
              break
            case "totalAmountChinese":
              if (!info.totalAmountChinese) info.totalAmountChinese = value
              break
          }
          break // 找到第一个匹配就跳出
        }
      }
    }

    console.log('📊 解析结果:', info)
    return info
  }

  /**
   * 增强的发票信息解析 - 使用多种策略
   */
  static parseInvoiceInfoEnhanced(text: string): Omit<ParsedInvoiceInfo, "fileName" | "parseMethod" | "fullText"> {
    // 首先使用基础解析
    const basicInfo = this.parseInvoiceInfo(text)

    // 如果基础解析结果不够好，尝试其他策略
    const enhancedInfo = { ...basicInfo }

    // 策略1: 按行分析
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    // 策略2: 寻找表格结构
    this.parseTableStructure(lines, enhancedInfo)

    // 策略3: 上下文分析
    this.parseWithContext(text, enhancedInfo)

    console.log('🚀 增强解析结果:', enhancedInfo)
    return enhancedInfo
  }

  /**
   * 解析表格结构
   */
  private static parseTableStructure(lines: string[], info: any) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // 寻找包含关键字的行
      if (line?.includes('发票号码') && !info.invoiceNumber) {
        // 尝试在同一行或下一行找到号码
        const numberMatch = line.match(/(\d{8,})/) || (lines[i + 1]?.match(/(\d{8,})/))
        if (numberMatch?.[1]) {
          info.invoiceNumber = numberMatch[1]
          console.log('📋 表格解析 - 发票号码:', info.invoiceNumber)
        }
      }

      if (line?.includes('开票日期') && !info.invoiceDate) {
        const dateMatch = line.match(/(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/) || 
                         (lines[i + 1]?.match(/(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/))
        if (dateMatch?.[1]) {
          info.invoiceDate = dateMatch[1]
          console.log('📅 表格解析 - 开票日期:', info.invoiceDate)
        }
      }

      if (line?.includes('价税合计') && !info.totalAmount) {
        const amountMatch = line.match(/[￥¥]?(\d+\.?\d*)/) || 
                           (lines[i + 1]?.match(/[￥¥]?(\d+\.?\d*)/))
        if (amountMatch?.[1]) {
          info.totalAmount = amountMatch[1]
          console.log('💰 表格解析 - 价税合计:', info.totalAmount)
        }
      }
    }
  }

  /**
   * 上下文分析
   */
  private static parseWithContext(text: string, info: any) {
    // 移除多余的空格和换行，但保持结构
    const cleanText = text.replace(/\s+/g, ' ').trim()

    // 更宽松的模式匹配
    const relaxedPatterns = {
      invoiceNumber: [
        /发票号码\s*[：:]*\s*(\d{8,})/,
        /票据号码\s*[：:]*\s*(\d{8,})/,
        /No\s*[：:]*\s*(\d{8,})/,
      ],
      totalAmount: [
        /价税合计\s*[：:]*\s*[￥¥]*\s*(\d+\.?\d*)/,
        /合计金额\s*[：:]*\s*[￥¥]*\s*(\d+\.?\d*)/,
        /总计\s*[：:]*\s*[￥¥]*\s*(\d+\.?\d*)/,
      ],
      buyerName: [
        /购买方\s*[：:]*\s*名称\s*[：:]*\s*([^纳税人识别号税号地址电话开户行账号销售方]+)/,
        /买方\s*[：:]*\s*([^纳税人识别号税号地址电话开户行账号卖方销售方]+)/,
      ],
      sellerName: [
        /销售方\s*[：:]*\s*名称\s*[：:]*\s*([^纳税人识别号税号地址电话开户行账号购买方]+)/,
        /卖方\s*[：:]*\s*([^纳税人识别号税号地址电话开户行账号买方购买方]+)/,
      ]
    }

    for (const [key, patterns] of Object.entries(relaxedPatterns)) {
      if (info[key]) continue // 如果已经有值，跳过

      for (const pattern of patterns) {
        const match = cleanText.match(pattern)
        if (match && match[1]) {
          const value = match[1].trim()
          if (value.length > 0 && value.length < 100) { // 合理的长度检查
            info[key] = value
            console.log(`🎯 上下文解析 - ${key}:`, value)
            break
          }
        }
      }
    }
  }
}