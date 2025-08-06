import type { ParsedInvoiceInfo } from './parser'

// 发票解析结果类型
type InvoiceParseResult = Omit<ParsedInvoiceInfo, "fileName" | "parseMethod" | "fullText">

/**
 * 增强的发票解析器
 * 专门处理复杂的发票字段识别
 */
export class EnhancedInvoiceParser {
  /**
   * 解析购买方信息
   */
  static parseBuyerInfo(text: string): { buyerName?: string; buyerTaxId?: string } {
    const result: { buyerName?: string; buyerTaxId?: string } = {}
    
    // 查找购买方名称
    const buyerNameMatch = text.match(/购买方[：:]\s*([^\n\r]+)/) ||
                          text.match(/购\s*买\s*方[：:]\s*([^\n\r]+)/) ||
                          text.match(/客户名称[：:]\s*([^\n\r]+)/)
    
    if (buyerNameMatch?.[1]) {
      result.buyerName = buyerNameMatch[1].trim()
      console.log('🏢 购买方名称:', result.buyerName)
    }
    
    // 查找购买方税号
    const buyerTaxMatch = text.match(/购买方纳税人识别号[：:]\s*([A-Z0-9]{15,20})/) ||
                         text.match(/购买方税号[：:]\s*([A-Z0-9]{15,20})/) ||
                         text.match(/纳税人识别号[：:]\s*([A-Z0-9]{15,20})/)
    
    if (buyerTaxMatch?.[1]) {
      result.buyerTaxId = buyerTaxMatch[1].trim()
      console.log('🆔 购买方税号:', result.buyerTaxId)
    }
    
    return result
  }
  
  /**
   * 解析销售方信息
   */
  static parseSellerInfo(text: string): { sellerName?: string; sellerTaxId?: string } {
    const result: { sellerName?: string; sellerTaxId?: string } = {}
    
    // 查找销售方名称
    const sellerNameMatch = text.match(/销售方[：:]\s*([^\n\r]+)/) ||
                           text.match(/销\s*售\s*方[：:]\s*([^\n\r]+)/) ||
                           text.match(/开票单位[：:]\s*([^\n\r]+)/)
    
    if (sellerNameMatch?.[1]) {
      result.sellerName = sellerNameMatch[1].trim()
      console.log('🏪 销售方名称:', result.sellerName)
    }
    
    // 查找销售方税号
    const sellerTaxMatch = text.match(/销售方纳税人识别号[：:]\s*([A-Z0-9]{15,20})/) ||
                          text.match(/销售方税号[：:]\s*([A-Z0-9]{15,20})/) ||
                          text.match(/开票方税号[：:]\s*([A-Z0-9]{15,20})/)
    
    if (sellerTaxMatch?.[1]) {
      result.sellerTaxId = sellerTaxMatch[1].trim()
      console.log('🆔 销售方税号:', result.sellerTaxId)
    }
    
    return result
  }
  
  /**
   * 解析税额和不含税金额
   */
  static parseTaxInfo(text: string): { taxAmount?: string; amountWithoutTax?: string } {
    const result: { taxAmount?: string; amountWithoutTax?: string } = {}
    
    // 查找税额
    const taxAmountMatch = text.match(/税\s*额[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                          text.match(/税\s*金[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                          text.match(/增值税额[：:]\s*[￥¥]?(\d+\.?\d*)/)
    
    if (taxAmountMatch?.[1]) {
      result.taxAmount = taxAmountMatch[1]
      console.log('💸 税额:', result.taxAmount)
    }
    
    // 查找不含税金额
    const amountWithoutTaxMatch = text.match(/不含税金额[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                                 text.match(/金\s*额[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                                 text.match(/小\s*计[：:]\s*[￥¥]?(\d+\.?\d*)/)
    
    if (amountWithoutTaxMatch?.[1]) {
      result.amountWithoutTax = amountWithoutTaxMatch[1]
      console.log('💰 不含税金额:', result.amountWithoutTax)
    }
    
    return result
  }
  
  /**
   * 解析人员信息
   */
  static parsePersonnelInfo(text: string): { drawer?: string; payee?: string; reviewer?: string } {
    const result: { drawer?: string; payee?: string; reviewer?: string } = {}
    
    // 查找开票人
    const drawerMatch = text.match(/开票人[：:]\s*([^\s\n\r]+)/) ||
                       text.match(/开\s*票\s*人[：:]\s*([^\s\n\r]+)/)
    
    if (drawerMatch?.[1]) {
      result.drawer = drawerMatch[1].trim()
      console.log('👤 开票人:', result.drawer)
    }
    
    // 查找收款人
    const payeeMatch = text.match(/收款人[：:]\s*([^\s\n\r]+)/) ||
                      text.match(/收\s*款\s*人[：:]\s*([^\s\n\r]+)/)
    
    if (payeeMatch?.[1]) {
      result.payee = payeeMatch[1].trim()
      console.log('💰 收款人:', result.payee)
    }
    
    // 查找复核人
    const reviewerMatch = text.match(/复核人[：:]\s*([^\s\n\r]+)/) ||
                         text.match(/复\s*核\s*人[：:]\s*([^\s\n\r]+)/) ||
                         text.match(/审核人[：:]\s*([^\s\n\r]+)/)
    
    if (reviewerMatch?.[1]) {
      result.reviewer = reviewerMatch[1].trim()
      console.log('✅ 复核人:', result.reviewer)
    }
    
    return result
  }
  
  /**
   * 解析项目名称
   */
  static parseItemName(text: string): string | undefined {
    // 查找项目名称或商品名称
    const itemNameMatch = text.match(/项目名称[：:]\s*([^\n\r]+)/) ||
                         text.match(/商品名称[：:]\s*([^\n\r]+)/) ||
                         text.match(/货物或应税劳务[：:]\s*([^\n\r]+)/) ||
                         text.match(/服务名称[：:]\s*([^\n\r]+)/)
    
    if (itemNameMatch?.[1]) {
      const itemName = itemNameMatch[1].trim()
      console.log('📦 项目名称:', itemName)
      return itemName
    }
    
    return undefined
  }
  
  /**
   * 解析大写金额
   */
  static parseAmountInWords(text: string): string | undefined {
    // 查找大写金额
    const amountInWordsMatch = text.match(/大写金额[：:]\s*([^\n\r]+)/) ||
                              text.match(/价税合计\(大写\)[：:]\s*([^\n\r]+)/) ||
                              text.match(/合计金额\(大写\)[：:]\s*([^\n\r]+)/)
    
    if (amountInWordsMatch?.[1]) {
      const amountInWords = amountInWordsMatch[1].trim()
      console.log('🔤 大写金额:', amountInWords)
      return amountInWords
    }
    
    return undefined
  }
  
  /**
   * 综合解析所有字段
   */
  static parseAllFields(text: string): InvoiceParseResult {
    console.log('🔍 开始增强解析...')
    
    const result: any = {
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
    
    // 解析购买方信息
    const buyerInfo = this.parseBuyerInfo(text)
    if (buyerInfo.buyerName) result.buyerName = buyerInfo.buyerName
    if (buyerInfo.buyerTaxId) result.buyerTaxId = buyerInfo.buyerTaxId
    
    // 解析销售方信息
    const sellerInfo = this.parseSellerInfo(text)
    if (sellerInfo.sellerName) result.sellerName = sellerInfo.sellerName
    if (sellerInfo.sellerTaxId) result.sellerTaxId = sellerInfo.sellerTaxId
    
    // 解析税额信息
    const taxInfo = this.parseTaxInfo(text)
    if (taxInfo.taxAmount) result.taxAmount = taxInfo.taxAmount
    if (taxInfo.amountWithoutTax) result.amountWithoutTax = taxInfo.amountWithoutTax
    
    // 解析人员信息
    const personnelInfo = this.parsePersonnelInfo(text)
    if (personnelInfo.drawer) result.drawer = personnelInfo.drawer
    if (personnelInfo.payee) result.payee = personnelInfo.payee
    if (personnelInfo.reviewer) result.reviewer = personnelInfo.reviewer
    
    // 解析项目名称
    const itemName = this.parseItemName(text)
    if (itemName) result.itemName = itemName
    
    // 解析大写金额 (使用totalAmountChinese字段)
    const amountInWords = this.parseAmountInWords(text)
    if (amountInWords) result.totalAmountChinese = amountInWords
    
    console.log('✅ 增强解析完成')
    return result
  }
}