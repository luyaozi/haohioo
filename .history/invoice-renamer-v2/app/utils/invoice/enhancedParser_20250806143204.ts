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
    
    // 查找购买方名称 - 支持多行格式
    // 优先使用v1版本验证过的精确模式
    const buyerNameMatch = text.match(/买名 称:([^\s]+)/) ||
                          text.match(/购买方[：:]?\s*名称[：:]\s*([^\n\r]+)/) ||
                          text.match(/购买方[：:]\s*([^\n\r]+)/) ||
                          text.match(/购\s*买\s*方[：:]\s*([^\n\r]+)/) ||
                          text.match(/客户名称[：:]\s*([^\n\r]+)/) ||
                          // 处理多行格式：购买方 换行 名称: xxx
                          text.match(/购买方[\s\n\r]*名称[：:]\s*([^\n\r]+)/) ||
                          text.match(/购\s*买\s*方[\s\n\r]*名\s*称[：:]\s*([^\n\r]+)/) ||
                          // 新增：处理 "买 名 称 : 个人" 这种格式
                          text.match(/买\s*名\s*称\s*[：:]\s*([^\s\n\r销售方]+)/) ||
                          text.match(/购\s*买\s*名\s*称\s*[：:]\s*([^\s\n\r销售方]+)/) ||
                          // 新增：处理表格格式中的购买方信息
                          text.match(/购买方[\s\S]*?名称[：:]\s*([^\n\r\t]+)/) ||
                          text.match(/买方[：:]\s*([^\n\r\t]+)/) ||
                          // 处理四川创联国培教育咨询有限公司这种完整公司名
                          text.match(/([^\s\n\r\t]*(?:公司|企业|集团|有限|股份|教育|咨询|科技|贸易|服务|发展|投资|管理|建设|工程|设计|制造|销售|商贸|文化|传媒|网络|信息|技术|软件|电子|通信|医疗|药业|食品|餐饮|酒店|旅游|物流|运输|房地产|装饰|广告|印刷|包装|纺织|服装|化工|机械|电器|汽车|金融|保险|证券|银行|基金|租赁|担保|典当|拍卖|中介|代理|咨询|顾问|策划|设计|培训|教学|研究|开发|生产|加工|制作|维修|安装|施工|监理|检测|认证|评估|审计|会计|法律|翻译|劳务|清洁|保安|物业|家政|养老|托幼|殡葬|其他)[^\s\n\r\t]*)/)
    
    if (buyerNameMatch?.[1]) {
      result.buyerName = buyerNameMatch[1].trim()
      console.log('🏢 购买方名称:', result.buyerName)
    }
    
    // 查找购买方税号 - 支持多行格式
    const buyerTaxMatch = text.match(/购买方[：:]?\s*纳税人识别号[：:]\s*([A-Z0-9]{15,20})/) ||
                         text.match(/购买方[：:]?\s*税号[：:]\s*([A-Z0-9]{15,20})/) ||
                         text.match(/购买方[\s\n\r]*纳税人识别号[：:]\s*([A-Z0-9]{15,20})/) ||
                         text.match(/购买方[\s\n\r]*税号[：:]\s*([A-Z0-9]{15,20})/) ||
                         text.match(/购买方[\s\S]*?纳税人识别号[：:]\s*([A-Z0-9]{15,20})/)
    
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
    
    // 查找销售方名称 - 支持多行格式
    const sellerNameMatch = text.match(/销售方[：:]?\s*名称[：:]\s*([^\n\r]+)/) ||
                           text.match(/销售方[：:]\s*([^\n\r]+)/) ||
                           text.match(/销\s*售\s*方[：:]\s*([^\n\r]+)/) ||
                           text.match(/开票单位[：:]\s*([^\n\r]+)/) ||
                           // 处理多行格式：销售方 换行 名称: xxx
                           text.match(/销售方[\s\n\r]*名称[：:]\s*([^\n\r]+)/) ||
                           text.match(/销\s*售\s*方[\s\n\r]*名\s*称[：:]\s*([^\n\r]+)/) ||
                           // 新增：处理 "售 名 称 : 西安华讯得贸易有限公司" 这种格式
                           text.match(/售\s*名\s*称\s*[：:]\s*([^\s\n\r购买方方信息统一社会信用代码]+)/) ||
                           text.match(/销\s*售\s*名\s*称\s*[：:]\s*([^\s\n\r购买方方信息统一社会信用代码]+)/) ||
                           // 新增：处理表格格式中的销售方信息
                           text.match(/销售方[\s\S]*?名称[：:]\s*([^\n\r\t]+)/) ||
                           text.match(/卖方[：:]\s*([^\n\r\t]+)/) ||
                           // 处理成都吉利优行科技有限公司这种完整公司名
                           text.match(/(成都[^\s\n\r\t]*(?:公司|企业|集团|有限|股份|教育|咨询|科技|贸易|服务|发展|投资|管理|建设|工程|设计|制造|销售|商贸|文化|传媒|网络|信息|技术|软件|电子|通信|医疗|药业|食品|餐饮|酒店|旅游|物流|运输|房地产|装饰|广告|印刷|包装|纺织|服装|化工|机械|电器|汽车|金融|保险|证券|银行|基金|租赁|担保|典当|拍卖|中介|代理|咨询|顾问|策划|设计|培训|教学|研究|开发|生产|加工|制作|维修|安装|施工|监理|检测|认证|评估|审计|会计|法律|翻译|劳务|清洁|保安|物业|家政|养老|托幼|殡葬|其他)[^\s\n\r\t]*)/)
    
    if (sellerNameMatch?.[1]) {
      result.sellerName = sellerNameMatch[1].trim()
      console.log('🏪 销售方名称:', result.sellerName)
    }
    
    // 查找销售方税号 - 支持多行格式
    const sellerTaxMatch = text.match(/销售方[：:]?\s*纳税人识别号[：:]\s*([A-Z0-9]{15,20})/) ||
                          text.match(/销售方[：:]?\s*税号[：:]\s*([A-Z0-9]{15,20})/) ||
                          text.match(/销售方[\s\n\r]*纳税人识别号[：:]\s*([A-Z0-9]{15,20})/) ||
                          text.match(/销售方[\s\n\r]*税号[：:]\s*([A-Z0-9]{15,20})/) ||
                          text.match(/销售方[\s\S]*?纳税人识别号[：:]\s*([A-Z0-9]{15,20})/) ||
                          text.match(/开票方税号[：:]\s*([A-Z0-9]{15,20})/) ||
                          // 新增：处理独立的税号格式
                          text.match(/统一社会信用代码\s*\/\s*纳税人识别号\s*[：:]\s*([A-Z0-9]{15,20})/)
    
    if (sellerTaxMatch?.[1]) {
      result.sellerTaxId = sellerTaxMatch[1].trim()
      console.log('🆔 销售方税号:', result.sellerTaxId)
    }
    
    return result
  }
  
  /**
   * 解析税额和不含税金额
   */
  static parseTaxInfo(text: string): { taxAmount?: string; amountWithoutTax?: string; totalAmount?: string } {
    const result: { taxAmount?: string; amountWithoutTax?: string; totalAmount?: string } = {}
    
    // 查找税额 - 支持表格格式
    const taxAmountMatch = text.match(/税\s*额[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                          text.match(/税\s*金[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                          text.match(/增值税额[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                          // 新增：处理表格中的税额 "合 计 ¥61.15 ¥7.95"
                          text.match(/合\s*计\s*[￥¥]?\d+\.?\d*\s*[￥¥](\d+\.?\d*)/)
    
    if (taxAmountMatch?.[1]) {
      result.taxAmount = taxAmountMatch[1]
      console.log('💸 税额:', result.taxAmount)
    }
    
    // 查找不含税金额 - 支持表格格式
    const amountWithoutTaxMatch = text.match(/不含税金额[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                                 text.match(/金\s*额[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                                 text.match(/小\s*计[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                                 // 新增：处理表格中的金额 "合 计 ¥61.15 ¥7.95"
                                 text.match(/合\s*计\s*[￥¥](\d+\.?\d*)\s*[￥¥]?\d+\.?\d*/)
    
    if (amountWithoutTaxMatch?.[1]) {
      result.amountWithoutTax = amountWithoutTaxMatch[1]
      console.log('💰 不含税金额:', result.amountWithoutTax)
    }
    
    // 查找价税合计 - 支持特殊格式
    const totalAmountMatch = text.match(/价税合计[：:]\s*[￥¥]?(\d+\.?\d*)/) ||
                            text.match(/价税合计\s*\(大写\).*?\(小写\)\s*[￥¥](\d+\.?\d*)/) ||
                            text.match(/\(小写\)\s*[￥¥](\d+\.?\d*)/) ||
                            text.match(/合计金额[：:]\s*[￥¥]?(\d+\.?\d*)/)
    
    if (totalAmountMatch?.[1]) {
      result.totalAmount = totalAmountMatch[1]
      console.log('💰 价税合计:', result.totalAmount)
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
                         text.match(/服务名称[：:]\s*([^\n\r]+)/) ||
                         // 新增：处理表格中的商品信息，匹配以*开头的商品行
                         text.match(/\*[^*]+\*([^箱个件台套批次\d\n\r]+)/) ||
                         // 匹配商品详细描述
                         text.match(/\*纸制品\*([^箱个件台套批次\d\n\r]+)/) ||
                         text.match(/\*[^*]+\*([^规格型号单位数量单价金额税率征收率税额\n\r]+)/)
    
    if (itemNameMatch?.[1]) {
      let itemName = itemNameMatch[1].trim()
      // 清理商品名称，移除多余的空格和特殊字符
      itemName = itemName.replace(/\s+/g, ' ').replace(/【[^】]*】/g, '').trim()
      console.log('📦 项目名称:', itemName)
      return itemName
    }
    
    return undefined
  }
  
  /**
   * 解析大写金额
   */
  static parseAmountInWords(text: string): string | undefined {
    // 查找大写金额 - 支持特殊格式
    const amountInWordsMatch = text.match(/大写金额[：:]\s*([^\n\r]+)/) ||
                              text.match(/价税合计\(大写\)[：:]\s*([^\n\r]+)/) ||
                              text.match(/合计金额\(大写\)[：:]\s*([^\n\r]+)/) ||
                              // 新增：处理 "价税合计(大写) 陆拾玖圆壹角" 这种格式
                              text.match(/价税合计\s*\(大写\)\s*([^(小写)]+)(?=\s*\(小写\))/) ||
                              text.match(/\(大写\)\s*([^(小写)\n\r]+)(?=\s*\(小写\))/)
    
    if (amountInWordsMatch?.[1]) {
      let amountInWords = amountInWordsMatch[1].trim()
      // 清理大写金额，移除多余的空格
      amountInWords = amountInWords.replace(/\s+/g, '')
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
    if (taxInfo.totalAmount) result.totalAmount = taxInfo.totalAmount
    
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