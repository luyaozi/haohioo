/**
 * 特殊格式发票解析器
 * 处理非标准格式的发票，如四列结构、单行格式等
 */

export interface InvoiceInfo {
  buyerName: string
  buyerTaxId: string
  sellerName: string
  sellerTaxId: string
}

export class SpecialFormatParser {
  /**
   * 解析四列结构的购买方和销售方信息
   */
  static parseFourColumnStructure(text: string, invoiceInfo: InvoiceInfo): void {
    const lines = text.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || ''
      
      // 查找包含购买方和销售方名称的行
      if ((line.includes('名称：') || line.includes('名 称:')) && line.includes('\t')) {
        const columns = line.split('\t').filter(col => col.trim())
        
        // 分析行结构，寻找购买方和销售方信息
        let buyerNameCol = -1
        let sellerNameCol = -1
        
        for (let j = 0; j < columns.length; j++) {
          const col = columns[j]?.trim() || ''
          
          // 购买方名称列 - 支持多种格式
          if ((col.includes('购') || col.includes('买')) && (col.includes('名称：') || col.includes('名 称:'))) {
            // 标准格式：名称：xxx
            let buyerMatch = col.match(/名称：(.+)/)
            if (!buyerMatch) {
              // 特殊格式：买名 称:xxx
              buyerMatch = col.match(/名 称:(.+)/)
            }
            if (buyerMatch && buyerMatch[1]) {
              invoiceInfo.buyerName = buyerMatch[1].trim()
            }
            buyerNameCol = j
          }
          
          // 销售方名称列 - 支持多种格式
          if ((col.includes('销') || col.includes('售')) && (col.includes('名称：') || col.includes('名 称:'))) {
            // 标准格式：名称：xxx
            let sellerMatch = col.match(/名称：(.+)/)
            if (!sellerMatch) {
              // 特殊格式：售名 称:xxx
              sellerMatch = col.match(/名 称:(.+)/)
            }
            if (sellerMatch && sellerMatch[1]) {
              invoiceInfo.sellerName = sellerMatch[1].trim()
            }
            sellerNameCol = j
          }
        }
        
        // 如果名称在标签列中没有找到完整内容，检查相邻列
        if (buyerNameCol >= 0 && !invoiceInfo.buyerName && buyerNameCol + 1 < columns.length) {
          const nextCol = columns[buyerNameCol + 1]?.trim() || ''
          if (nextCol && !nextCol.includes('售') && !nextCol.includes('方')) {
            invoiceInfo.buyerName = nextCol
          }
        }
        
        if (sellerNameCol >= 0 && !invoiceInfo.sellerName && sellerNameCol + 1 < columns.length) {
          const nextCol = columns[sellerNameCol + 1]?.trim() || ''
          if (nextCol && !nextCol.includes('买') && !nextCol.includes('方')) {
            invoiceInfo.sellerName = nextCol
          }
        }
      }
      
      // 特殊处理：查找包含购买方和销售方信息的单行格式
      // 例如："买名 称:个人    售名 称:西安华讯得贸易有限公司"
      if (!invoiceInfo.buyerName && !invoiceInfo.sellerName && 
          (line.includes('买名 称:') || line.includes('售名 称:'))) {
        
        // 提取购买方 - 修复正则表达式，排除'售'字符
        const buyerMatch = line.match(/买名 称:([^售\s]+)/)
        if (buyerMatch && buyerMatch[1]) {
          invoiceInfo.buyerName = buyerMatch[1].trim()
        }
        
        // 提取销售方 - 更宽松的匹配
        const sellerMatch = line.match(/售名 称:(.+?)(?=\s|$)/) || line.match(/售名 称:(.+)/)
        if (sellerMatch && sellerMatch[1]) {
          invoiceInfo.sellerName = sellerMatch[1].trim()
        }
      }
      
      // 查找包含税号的行
      if (line.includes('统一社会信用代码') || line.includes('纳税人识别号')) {
        const columns = line.split('\t').filter(col => col.trim())
        
        for (let j = 0; j < columns.length; j++) {
          const col = columns[j]?.trim() || ''
          
          // 提取税号（18位数字字母组合）
          const taxIdMatch = col.match(/([A-Z0-9]{18})/)
          if (taxIdMatch && taxIdMatch[1]) {
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
      
      // 处理独立的税号行（只包含18位税号的行）
      const standaloneTaxIdMatch = line.match(/^([A-Z0-9]{18})$/)
      if (standaloneTaxIdMatch && standaloneTaxIdMatch[1]) {
        const taxId = standaloneTaxIdMatch[1]
        // 如果销售方税号还没有找到，则将其设为销售方税号
        if (!invoiceInfo.sellerTaxId) {
          invoiceInfo.sellerTaxId = taxId
        }
      }
    }
    
    // 如果没有通过四列结构找到，尝试其他模式
    if (!invoiceInfo.buyerName) {
      const buyerPatterns = [
        /购买方[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/,
        /买方[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/,
        /客户[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/
      ]
      
      for (const pattern of buyerPatterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
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
        if (match && match[1]) {
          invoiceInfo.sellerName = match[1].trim()
          break
        }
      }
    }
    
    // 处理个人购买方，清空税号
    if (invoiceInfo.buyerName && (invoiceInfo.buyerName.includes('个人') || invoiceInfo.buyerName.includes('（个人）'))) {
      invoiceInfo.buyerTaxId = ''
    }
  }

  /**
   * 提取基本字段信息
   */
  static extractBasicFields(text: string) {
    const result = {
      invoiceNumber: '',
      totalAmount: '',
      totalAmountChinese: '',
      invoiceDate: '',
      drawer: ''
    }

    // 解析发票号码
    result.invoiceNumber = this.extractInvoiceNumber(text)
    
    // 解析总金额
    result.totalAmount = this.extractTotalAmount(text)
    
    // 解析合计大写
    const totalAmountChineseMatch = text.match(/合计.*?[（(]大写[）)].*?([壹贰叁肆伍陆柒捌玖拾佰仟万亿零元角分整]+)/)
    if (totalAmountChineseMatch && totalAmountChineseMatch[1]) {
      result.totalAmountChinese = totalAmountChineseMatch[1]
    }
    
    // 解析开票人
    const drawerMatch = text.match(/开票人[：:]?\s*([^\s\n\t]+)/)
    if (drawerMatch && drawerMatch[1]) {
      result.drawer = drawerMatch[1]
    }
    
    // 解析开票日期
    result.invoiceDate = this.extractInvoiceDate(text)

    return result
  }

  /**
   * 提取发票号码
   */
  private static extractInvoiceNumber(text: string): string {
    // 多种发票号码模式
    const patterns = [
      /发票号码[：:]\s*(\d+)/,
      /发票代码[：:]\s*(\d+)/,
      /No[：:]\s*(\d+)/,
      /(\d{20,})/  // 20位以上的数字
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        console.log(`发票号码匹配: ${match[1]}`)
        return match[1]
      }
    }
    
    console.log('未找到发票号码')
    return ''
  }

  /**
   * 提取总金额
   */
  private static extractTotalAmount(text: string): string {
    // 多种金额模式，优先匹配更精确的模式
    const patterns = [
      /价税合计[（(]大写[）)].*?[￥¥](\d+\.?\d*)/,
      /合计[：:]\s*[￥¥]?(\d+\.\d{2})/,
      /总计[：:]\s*[￥¥]?(\d+\.\d{2})/,
      /[￥¥]\s*(\d+\.\d{2})/
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        console.log(`总金额匹配: ${match[1]}`)
        return match[1]
      }
    }
    
    console.log('未找到总金额')
    return ''
  }

  /**
   * 提取开票日期
   */
  private static extractInvoiceDate(text: string): string {
    const patterns = [
      /开票日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
      /日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
      /(\d{4}年\d{1,2}月\d{1,2}日)/
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        console.log(`开票日期匹配: ${match[1]}`)
        return match[1]
      }
    }
    
    console.log('未找到开票日期')
    return ''
  }
}