/**
 * 发票信息提取的正则表达式模式配置
 */

export interface InvoicePatterns {
  [key: string]: RegExp[]
}

/**
 * 发票号码匹配模式
 */
export const invoiceNumberPatterns: RegExp[] = [
  /发票号码[：:]\s*(\d+)/,
  /票据号码[：:]\s*(\d+)/,
  /No[：:]\s*(\d+)/,
  /发票代码[：:]\s*(\d+)/,
  /(\d{8,})/,
]

/**
 * 金额匹配模式
 */
export const amountPatterns: RegExp[] = [
  /价税合计[：:]\s*[￥¥]?(\d+\.?\d*)/,
  /合计金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
  /总金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
  /[￥¥]\s*(\d+\.?\d*)/,
  /金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
  /合计[：:]\s*[￥¥]?(\d+\.?\d*)/,
  /(\d+\.\d{2})元/,
  /小写[：:]\s*[￥¥]?(\d+\.?\d*)/,
]

/**
 * 购买方信息匹配模式
 */
export const buyerPatterns: RegExp[] = [
  /购买方[：:]?\s*名称[：:]?\s*([^\n\r]+)/,
  /购买方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|销售方|$)/,
  /买方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|卖方|销售方|$)/,
  /客户[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|销售方|$)/,
]

/**
 * 销售方信息匹配模式
 */
export const sellerPatterns: RegExp[] = [
  /销售方[：:]?\s*名称[：:]?\s*([^\n\r]+)/,
  /销售方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|购买方|$)/,
  /卖方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|买方|购买方|$)/,
  /开票方[：:]?\s*([^\n\r]+?)(?=纳税人识别号|税号|地址|电话|开户行|账号|购买方|$)/,
]

/**
 * 开票日期匹配模式
 */
export const datePatterns: RegExp[] = [
  /开票日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
  /日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
  /(\d{4}年\d{1,2}月\d{1,2}日)/,
  /(\d{4}-\d{1,2}-\d{1,2})/,
]

/**
 * 购买方税号匹配模式
 */
export const buyerTaxIdPatterns: RegExp[] = [
  /购买方.*?纳税人识别号[：:]\s*([A-Z0-9]+)/,
  /购买方.*?税号[：:]\s*([A-Z0-9]+)/,
  /买方.*?纳税人识别号[：:]\s*([A-Z0-9]+)/,
  /买方.*?税号[：:]\s*([A-Z0-9]+)/,
  /纳税人识别号[：:]\s*([A-Z0-9]{15,20})/,
]

/**
 * 销售方税号匹配模式
 */
export const sellerTaxIdPatterns: RegExp[] = [
  /销售方.*?纳税人识别号[：:]\s*([A-Z0-9]+)/,
  /销售方.*?税号[：:]\s*([A-Z0-9]+)/,
  /卖方.*?纳税人识别号[：:]\s*([A-Z0-9]+)/,
  /卖方.*?税号[：:]\s*([A-Z0-9]+)/,
]

/**
 * 税额匹配模式
 */
export const taxAmountPatterns: RegExp[] = [
  /税额[：:]\s*[￥¥]?(\d+\.?\d*)/,
  /增值税额[：:]\s*[￥¥]?(\d+\.?\d*)/,
]

/**
 * 不含税金额匹配模式
 */
export const amountWithoutTaxPatterns: RegExp[] = [
  /不含税金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
  /金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
]

/**
 * 开票人匹配模式
 */
export const drawerPatterns: RegExp[] = [
  /开票人[：:]\s*([^\s\n\r]+)/,
  /制票人[：:]\s*([^\s\n\r]+)/,
]

/**
 * 收款人匹配模式
 */
export const payeePatterns: RegExp[] = [
  /收款人[：:]\s*([^\s\n\r]+)/,
]

/**
 * 复核人匹配模式
 */
export const reviewerPatterns: RegExp[] = [
  /复核人[：:]\s*([^\s\n\r]+)/,
  /审核人[：:]\s*([^\s\n\r]+)/,
]

/**
 * 项目名称匹配模式
 */
export const itemNamePatterns: RegExp[] = [
  /(?:商品|服务|项目)名称[：:]\s*([^\n\r]+)/,
  /货物或应税劳务.*?名称[：:]\s*([^\n\r]+)/,
  /品名[：:]\s*([^\n\r]+)/,
]

/**
 * 大写金额匹配模式
 */
export const totalAmountChinesePatterns: RegExp[] = [
  /大写[：:]\s*([^\n\r]+)/,
  /价税合计.*?大写[：:]\s*([^\n\r]+)/,
]

/**
 * 所有发票模式的集合
 */
export const invoicePatterns: InvoicePatterns = {
  invoiceNumber: invoiceNumberPatterns,
  amount: amountPatterns,
  buyer: buyerPatterns,
  seller: sellerPatterns,
  date: datePatterns,
  buyerTaxId: buyerTaxIdPatterns,
  sellerTaxId: sellerTaxIdPatterns,
  taxAmount: taxAmountPatterns,
  amountWithoutTax: amountWithoutTaxPatterns,
  drawer: drawerPatterns,
  payee: payeePatterns,
  reviewer: reviewerPatterns,
  itemName: itemNamePatterns,
  totalAmountChinese: totalAmountChinesePatterns,
}