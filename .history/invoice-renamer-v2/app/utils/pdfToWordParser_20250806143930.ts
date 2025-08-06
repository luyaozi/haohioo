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
      // v1版本验证过的精确模式
      /买名 称:([^\s]+)/,
      /购买方[：:]?\s*名称[：:]?\s*([^\n\r]+)/,
      /购买方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|销售方|$)/,
      /买方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|卖方|销售方|$)/,
      /客户[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|销售方|$)/,
    ],

    // 销售方信息
    seller: [
      // v1版本验证过的精确模式
      /售名 称:(.+?)(?=\s|$)/,
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
    
    // 使用增强解析器补充缺失字段
    const enhancedInfo = EnhancedInvoiceParser.parseAllFields(fullText)
    
    // 合并解析结果，优先使用增强解析的结果
    // 只过滤掉真正的空值，保留"未识别"等有意义的值
    const invoiceInfo = {
      ...basicInfo,
      ...Object.fromEntries(
        Object.entries(enhancedInfo).filter(([_, value]) => 
          value !== undefined && 
          value !== null && 
          value.toString().trim() !== ""
        )
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

    // 使用四列结构解析购买方和销售方信息
    this.parseFourColumnStructure(text, info)

    return info
  }

  /**
   * 解析四列结构的购买方和销售方信息
   * 基于 v1 版本逻辑，优化四列结构识别
   */
  private parseFourColumnStructure(text: string, invoiceInfo: Record<string, any>) {
    const lines = text.split('\n')
    
    // 首先尝试识别标准四列结构
    this.parseStandardFourColumnStructure(lines, invoiceInfo)
    
    // 如果标准四列结构没有找到完整信息，尝试其他解析方式
    if (!invoiceInfo.buyerName || !invoiceInfo.sellerName) {
      this.parseAlternativeFormats(text, invoiceInfo)
    }
    
    // 解析税号信息
    this.parseTaxIds(lines, invoiceInfo)
    
    // 处理个人购买方，清空税号
    if (invoiceInfo.buyerName && (invoiceInfo.buyerName.includes('个人') || invoiceInfo.buyerName.includes('（个人）'))) {
      invoiceInfo.buyerTaxId = ''
    }
  }

  /**
   * 解析标准四列结构
   * 第一列：购买方标签，第二列：购买方内容，第三列：销售方标签，第四列：销售方内容
   */
  private parseStandardFourColumnStructure(lines: string[], invoiceInfo: Record<string, any>) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line || !line.includes('\t')) continue
      
      const columns = line.split('\t').filter(col => col.trim())
      if (columns.length < 4) continue
      
      // 检查是否是名称行的四列结构
      if (this.isNameRow(columns)) {
        // 第一列应该包含购买方标识，第二列是购买方名称
        // 第三列应该包含销售方标识，第四列是销售方名称
        
        const col1 = columns[0]?.trim() || ''
        const col2 = columns[1]?.trim() || ''
        const col3 = columns[2]?.trim() || ''
        const col4 = columns[3]?.trim() || ''
        
        // 识别购买方信息
        if (this.isBuyerColumn(col1) && col2) {
          // 从第二列提取购买方名称
          const buyerName = this.extractNameFromColumn(col2)
          if (buyerName) {
            invoiceInfo.buyerName = buyerName
          }
        }
        
        // 识别销售方信息
        if (this.isSellerColumn(col3) && col4) {
          // 从第四列提取销售方名称
          const sellerName = this.extractNameFromColumn(col4)
          if (sellerName) {
            invoiceInfo.sellerName = sellerName
          }
        }
        
        // 如果找到了名称信息，记录这一行，继续查找后续相关行
        if (invoiceInfo.buyerName || invoiceInfo.sellerName) {
          console.log(`四列结构解析成功 - 购买方: ${invoiceInfo.buyerName}, 销售方: ${invoiceInfo.sellerName}`)
          break
        }
      }
    }
  }

  /**
   * 判断是否是名称行
   */
  private isNameRow(columns: string[]): boolean {
    const lineText = columns.join(' ')
    return lineText.includes('名称') || lineText.includes('名 称')
  }

  /**
   * 判断是否是购买方列
   */
  private isBuyerColumn(column: string): boolean {
    return column.includes('购买方') || column.includes('买方') || 
           (column.includes('购') && column.includes('名称')) ||
           (column.includes('买') && column.includes('名称'))
  }

  /**
   * 判断是否是销售方列
   */
  private isSellerColumn(column: string): boolean {
    return column.includes('销售方') || column.includes('卖方') || column.includes('售方') ||
           (column.includes('销') && column.includes('名称')) ||
           (column.includes('售') && column.includes('名称'))
  }

  /**
   * 从列中提取名称
   */
  private extractNameFromColumn(column: string): string {
    // 移除常见的标签和符号
    let name = column.replace(/名称[：:]/g, '').replace(/名 称[：:]/g, '').trim()
    
    // 如果还包含其他标识符，进一步清理
    name = name.replace(/^[购买销售方]+[：:]?/g, '').trim()
    
    return name
  }

  /**
   * 解析其他格式（兼容性处理）
   */
  private parseAlternativeFormats(text: string, invoiceInfo: Record<string, any>) {
    const lines = text.split('\n')
    
    for (const line of lines) {
      // 特殊处理：查找包含购买方和销售方信息的单行格式
      // 例如："买名 称:个人    售名 称:西安华讯得贸易有限公司"
      if ((line.includes('买名 称:') || line.includes('售名 称:')) && 
          (!invoiceInfo.buyerName || !invoiceInfo.sellerName)) {
        
        // 提取购买方
         if (!invoiceInfo.buyerName) {
           const buyerMatch = line.match(/买名 称:([^\s\t]+)/)
           if (buyerMatch && buyerMatch[1]) {
             invoiceInfo.buyerName = buyerMatch[1].trim()
           }
         }
         
         // 提取销售方
         if (!invoiceInfo.sellerName) {
           const sellerMatch = line.match(/售名 称:(.+?)(?=\s|$)/)
           if (sellerMatch && sellerMatch[1]) {
             invoiceInfo.sellerName = sellerMatch[1].trim()
           }
         }
      }
      
      // 处理包含名称的制表符分隔行
      if ((line.includes('名称：') || line.includes('名 称:')) && line.includes('\t')) {
        const columns = line.split('\t').filter(col => col.trim())
        
        for (let j = 0; j < columns.length; j++) {
          const col = columns[j]?.trim()
          if (!col) continue
          
          // 购买方名称列
          if (!invoiceInfo.buyerName && this.isBuyerColumn(col)) {
            const buyerMatch = col.match(/名称[：:](.+)/) || col.match(/名 称[：:](.+)/)
            if (buyerMatch) {
              invoiceInfo.buyerName = buyerMatch[1].trim()
            } else if (j + 1 < columns.length) {
              const nextCol = columns[j + 1]?.trim()
              if (nextCol && !this.isSellerColumn(nextCol)) {
                invoiceInfo.buyerName = nextCol
              }
            }
          }
          
          // 销售方名称列
          if (!invoiceInfo.sellerName && this.isSellerColumn(col)) {
            const sellerMatch = col.match(/名称[：:](.+)/) || col.match(/名 称[：:](.+)/)
            if (sellerMatch) {
              invoiceInfo.sellerName = sellerMatch[1].trim()
            } else if (j + 1 < columns.length) {
              const nextCol = columns[j + 1]?.trim()
              if (nextCol && !this.isBuyerColumn(nextCol)) {
                invoiceInfo.sellerName = nextCol
              }
            }
          }
        }
      }
    }
    
    // 如果仍然没有找到，尝试正则表达式模式
    if (!invoiceInfo.buyerName) {
      const buyerPatterns = [
        /购买方[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/,
        /买方[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/,
        /客户[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/
      ]
      
      for (const pattern of buyerPatterns) {
        const match = text.match(pattern)
        if (match) {
          invoiceInfo.buyerName = match[1].trim()
          break
        }
      }
    }
    
    if (!invoiceInfo.sellerName) {
      const sellerPatterns = [
        /销售方[^：]*：[^购]*?([^：\s]+(?:公司|企业|个人|店))/,
        /卖方[^：]*：[^购]*?([^：\s]+(?:公司|企业|个人|店))/,
        /开票方[^：]*：[^购]*?([^：\s]+(?:公司|企业|个人|店))/
      ]
      
      for (const pattern of sellerPatterns) {
        const match = text.match(pattern)
        if (match) {
          invoiceInfo.sellerName = match[1].trim()
          break
        }
      }
    }
  }

  /**
   * 解析税号信息
   */
  private parseTaxIds(lines: string[], invoiceInfo: Record<string, any>) {
    for (const line of lines) {
      if (line.includes('统一社会信用代码') || line.includes('纳税人识别号')) {
        const columns = line.split('\t').filter(col => col.trim())
        
        for (let j = 0; j < columns.length; j++) {
          const col = columns[j]?.trim()
          if (!col) continue
          
          // 提取税号（18位数字字母组合）
          const taxIdMatch = col.match(/([A-Z0-9]{18})/)
          if (taxIdMatch) {
            const taxId = taxIdMatch[1]
            
            // 根据位置判断是购买方还是销售方的税号
            if (j < columns.length / 2) {
              invoiceInfo.buyerTaxId = taxId
            } else {
              invoiceInfo.sellerTaxId = taxId
            }
          }
        }
      }
    }
  }
}

export default PDFToWordParser
