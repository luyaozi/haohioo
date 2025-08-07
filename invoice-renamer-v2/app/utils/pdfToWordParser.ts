/**
 * PDF转Word文档解析器
 * 将PDF转换为结构化的文本，然后按行列解析发票信息
 */

import type { TextItem } from "pdfjs-dist/types/src/display/api"
import { getPdfjs } from "./pdfWorkerManager"
import { EnhancedInvoiceParser } from './invoice/enhancedParser'
import { invoicePatterns } from './invoice/patterns'
import { TextProcessor } from './textProcessor'
import { SpecialFormatParser } from './invoice/specialFormatParser'

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

  // 使用从patterns.ts导入的发票信息提取模式
  private invoicePatterns = invoicePatterns

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
        const sortedItems = TextProcessor.sortTextItems(textContent.items)
        const pageText = TextProcessor.reconstructText(sortedItems)

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
   * 解析四列结构的发票信息（使用SpecialFormatParser）
   */
  private parseFourColumnStructure(text: string): Partial<ParsedInvoiceInfo> {
    console.log('🔧 开始四列结构解析...')
    
    // 使用SpecialFormatParser解析购买方和销售方信息
    const invoiceInfo = {
      buyerName: '',
      buyerTaxId: '',
      sellerName: '',
      sellerTaxId: ''
    }
    
    SpecialFormatParser.parseFourColumnStructure(text, invoiceInfo)
    
    // 解析其他基本字段
    const basicFields = SpecialFormatParser.extractBasicFields(text)
    
    // 提取项目名称
    const itemName = TextProcessor.extractItemName(text)
    
    const result: Partial<ParsedInvoiceInfo> = {
      buyerName: invoiceInfo.buyerName,
      buyerTaxId: invoiceInfo.buyerTaxId,
      sellerName: invoiceInfo.sellerName,
      sellerTaxId: invoiceInfo.sellerTaxId,
      invoiceNumber: basicFields.invoiceNumber,
      totalAmount: basicFields.totalAmount,
      totalAmountChinese: basicFields.totalAmountChinese,
      invoiceDate: basicFields.invoiceDate,
      drawer: basicFields.drawer,
      itemName
    }
    
    console.log('🎯 四列结构解析结果:', result)
    return result
  }

  /**
   * 解析发票基本信息（使用现有的patterns）
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
      remarks: "",
    }

    // 使用正则表达式提取信息
    for (const [key, patterns] of Object.entries(this.invoicePatterns)) {
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          const value = match[1].trim()

          switch (key) {
            case "invoiceNumber":
              if (!info.invoiceNumber) info.invoiceNumber = value
              break
            case "invoiceDate":
              if (!info.invoiceDate) info.invoiceDate = value
              break
            case "buyerName":
              if (!info.buyerName) info.buyerName = value
              break
            case "sellerName":
              if (!info.sellerName) info.sellerName = value
              break
            case "totalAmount":
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
            case "remarks":
              if (!info.remarks) {
                // 过滤掉"\n备"、"\n注"、"备"、"注"等标签字符
                const cleanedRemarks = value
                  .replace(/\n备/g, '')
                  .replace(/\n注/g, '')
                  .replace(/^备$/g, '')
                  .replace(/^注$/g, '')
                  .replace(/^备\n注$/g, '')
                  .trim()
                
                // 如果清理后的内容为空或只包含空白字符，则设为"无备注"
                info.remarks = cleanedRemarks && cleanedRemarks.length > 0 ? cleanedRemarks : "无备注"
              }
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
