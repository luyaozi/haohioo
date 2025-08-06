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
   * 解析四列结构的发票信息（专门处理购买方和销售方信息）
   */
  private parseFourColumnStructure(text: string): Partial<ParsedInvoiceInfo> {
    const result: Partial<ParsedInvoiceInfo> = {}
    
    try {
      // 查找四列结构的关键标识
      const fourColumnPattern = /购买方[:：]\s*([^\s]+)\s+纳税人识别号[:：]\s*([^\s]+)\s+销售方[:：]\s*([^\s]+)\s+纳税人识别号[:：]\s*([^\s]+)/
      const match = text.match(fourColumnPattern)
      
      if (match) {
        result.buyerName = match[1]?.trim() || ''
        result.buyerTaxId = match[2]?.trim() || ''
        result.sellerName = match[3]?.trim() || ''
        result.sellerTaxId = match[4]?.trim() || ''
      } else {
        // 尝试分别匹配购买方和销售方信息
        const buyerPattern = /购买方[:：]\s*([^\n\r]+?)(?:\s+纳税人识别号[:：]\s*([^\s\n\r]+))?/
        const sellerPattern = /销售方[:：]\s*([^\n\r]+?)(?:\s+纳税人识别号[:：]\s*([^\s\n\r]+))?/
        
        const buyerMatch = text.match(buyerPattern)
        if (buyerMatch) {
          result.buyerName = buyerMatch[1]?.trim() || ''
          if (buyerMatch[2]) {
            result.buyerTaxId = buyerMatch[2].trim()
          }
        }
        
        const sellerMatch = text.match(sellerPattern)
        if (sellerMatch) {
          result.sellerName = sellerMatch[1]?.trim() || ''
          if (sellerMatch[2]) {
            result.sellerTaxId = sellerMatch[2].trim()
          }
        }
        
        // 如果上面的模式没有匹配到税号，尝试单独查找
         if (!result.buyerTaxId && result.buyerName) {
           const buyerTaxPattern = new RegExp(`${result.buyerName}[\\s\\S]*?纳税人识别号[:：]\\s*([^\\s\\n\\r]+)`)
           const buyerTaxMatch = text.match(buyerTaxPattern)
           if (buyerTaxMatch && buyerTaxMatch[1]) {
             result.buyerTaxId = buyerTaxMatch[1].trim()
           }
         }
         
         if (!result.sellerTaxId && result.sellerName) {
           const sellerTaxPattern = new RegExp(`${result.sellerName}[\\s\\S]*?纳税人识别号[:：]\\s*([^\\s\\n\\r]+)`)
           const sellerTaxMatch = text.match(sellerTaxPattern)
           if (sellerTaxMatch && sellerTaxMatch[1]) {
             result.sellerTaxId = sellerTaxMatch[1].trim()
           }
         }
      }
      
      // 查找商品名称（通常在表格中）
      const itemPatterns = [
        /货物或应税劳务、服务名称[^\n]*\n[^\n]*\n\s*([^\n\s]+)/,
        /项目名称[^\n]*\n[^\n]*\n\s*([^\n\s]+)/,
        /商品名称[^\n]*\n[^\n]*\n\s*([^\n\s]+)/
      ]
      
      for (const pattern of itemPatterns) {
        const itemMatch = text.match(pattern)
        if (itemMatch && itemMatch[1]) {
          result.itemName = itemMatch[1].trim()
          break
        }
      }
      
    } catch (error) {
      console.warn('四列结构解析出错:', error)
    }
    
    return result
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
