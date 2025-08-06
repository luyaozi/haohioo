/**
 * PDF转Word文档解析器
 * 将PDF转换为结构化的文本，然后按行列解析发票信息
 */

interface TextItem {
  str: string
  transform: number[]
  width: number
  height: number
}

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
  
  private invoicePatterns = {
    // 发票号码模式
    invoiceNumber: [
      /发票号码[：:]\s*(\d+)/,
      /发票代码[：:]\s*(\d+)/,
      /No[：:]\s*(\d+)/,
      /(\d{20,})/ // 20位以上数字
    ],
    
    // 金额模式
    amount: [
      /[￥¥$]\s*(\d+\.?\d*)/,
      /金额[：:]\s*[￥¥]?(\d+\.?\d*)/,
      /合计[：:]\s*[￥¥]?(\d+\.?\d*)/,
      /(\d+\.\d{2})元/
    ],
    
    // 购买方信息
    buyer: [
      /购买方[：:]?\s*(.+?)(?=销售方|$)/,
      /买方[：:]?\s*(.+?)(?=卖方|销售方|$)/,
      /客户[：:]?\s*(.+?)(?=销售方|$)/
    ],
    
    // 销售方信息
    seller: [
      /销售方[：:]?\s*(.+?)(?=购买方|$)/,
      /卖方[：:]?\s*(.+?)(?=买方|购买方|$)/,
      /开票方[：:]?\s*(.+?)(?=购买方|$)/
    ],
    
    // 开票日期
    date: [
      /开票日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
      /日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
      /(\d{4}年\d{1,2}月\d{1,2}日)/
    ]
  }

  /**
   * 设置 PDF.js Worker，包含多重 fallback 策略
   */
  private async setupWorker(pdfjs: any) {
    const workerSources = [
      // 1. 尝试使用 CDN
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
      // 2. 备用 CDN
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
      // 3. 本地 public 目录
      '/pdf.worker.js',
      // 4. 开发环境路径
      '/node_modules/pdfjs-dist/build/pdf.worker.js'
    ]

    for (const workerSrc of workerSources) {
      try {
        // 测试 worker 是否可用
        await this.testWorkerSource(workerSrc)
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        console.log(`PDF.js worker 设置成功: ${workerSrc}`)
        return
      } catch (error: any) {
        console.warn(`PDF.js worker 源不可用: ${workerSrc}`, error.message)
        continue
      }
    }

    // 如果所有 worker 源都失败，禁用 worker（使用主线程）
    console.warn('所有 PDF.js worker 源都不可用，将在主线程中运行（性能可能受影响）')
    pdfjs.GlobalWorkerOptions.workerSrc = null
  }

  /**
   * 测试 worker 源是否可用
   */
  private async testWorkerSource(workerSrc: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker 测试超时'))
      }, 3000)

      // 尝试加载 worker 脚本
      if (workerSrc.startsWith('http')) {
        // 对于 HTTP 源，使用 fetch 测试
        fetch(workerSrc, { method: 'HEAD' })
          .then(response => {
            clearTimeout(timeout)
            if (response.ok) {
              resolve()
            } else {
              reject(new Error(`HTTP ${response.status}`))
            }
          })
          .catch(error => {
            clearTimeout(timeout)
            reject(error)
          })
      } else {
        // 对于本地源，假设可用（实际测试会在 PDF 解析时进行）
        clearTimeout(timeout)
        resolve()
      }
    })
  }

  /**
   * 初始化模块
   */
  private async init() {
    if (!this.initialized) {
      // 浏览器环境
      const pdfjs = await import('pdfjs-dist')
      this.getDocument = pdfjs.getDocument
      
      // 设置 worker - 多重 fallback 策略
      await this.setupWorker(pdfjs)
      this.initialized = true
    }
  }

  /**
   * 解析PDF文件
   */
  async parseFile(file: File): Promise<ParsedInvoiceInfo> {
    await this.init()
    
    try {
      console.log(`开始解析PDF: ${file.name}`)
      
      // 读取PDF文件
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const pdf = await this.getDocument({ data }).promise
      
      let fullText = ''
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
          items: sortedItems
        })
        
        fullText += pageText + '\n'
      }
      
      // 解析发票信息
      const invoiceInfo = this.parseInvoiceInfo(fullText)
      
      return {
        ...invoiceInfo,
        fileName: file.name,
        parseMethod: 'PDFToWordParser',
        fullText
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
      if (Math.abs(yDiff) > 5) { // 5像素的容差
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
    if (items.length === 0) return ''
    
    let result = ''
    let currentY = items[0].transform[5]
    let currentLine = ''
    
    for (const item of items) {
      const y = item.transform[5]
      
      // 如果Y坐标变化超过阈值，认为是新行
      if (Math.abs(y - currentY) > 5) {
        if (currentLine.trim()) {
          result += currentLine.trim() + '\n'
        }
        currentLine = item.str
        currentY = y
      } else {
        // 同一行，添加适当的空格
        if (currentLine && !currentLine.endsWith(' ') && !item.str.startsWith(' ')) {
          currentLine += ' '
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
  private parseInvoiceInfo(text: string): Omit<ParsedInvoiceInfo, 'fileName' | 'parseMethod' | 'fullText'> {
    const info: any = {
      invoiceNumber: '',
      invoiceDate: '',
      buyerName: '',
      buyerTaxId: '',
      sellerName: '',
      sellerTaxId: '',
      totalAmount: '',
      totalAmountChinese: '',
      taxAmount: '',
      amountWithoutTax: '',
      drawer: '',
      payee: '',
      reviewer: '',
      itemName: ''
    }

    // 使用正则表达式提取信息
    for (const [key, patterns] of Object.entries(this.invoicePatterns)) {
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          if (key === 'invoiceNumber') {
            info.invoiceNumber = match[1].trim()
          } else if (key === 'date') {
            info.invoiceDate = match[1].trim()
          } else if (key === 'buyer') {
            info.buyerName = match[1].trim()
          } else if (key === 'seller') {
            info.sellerName = match[1].trim()
          } else if (key === 'amount') {
            info.totalAmount = match[1].trim()
          }
          break
        }
      }
    }

    // 尝试提取更多字段
    this.extractAdditionalFields(text, info)

    return info
  }

  /**
   * 提取额外字段
   */
  private extractAdditionalFields(text: string, info: any) {
    // 提取税号
    const taxIdPattern = /税号[：:]\s*([A-Z0-9]+)/g
    let taxMatch
    const taxIds = []
    while ((taxMatch = taxIdPattern.exec(text)) !== null) {
      taxIds.push(taxMatch[1])
    }
    if (taxIds.length >= 2) {
      info.buyerTaxId = taxIds[0]
      info.sellerTaxId = taxIds[1]
    } else if (taxIds.length === 1) {
      info.buyerTaxId = taxIds[0]
    }

    // 提取开票人、收款人、复核人
    const drawerMatch = text.match(/开票人[：:]\s*([^\s]+)/)
    if (drawerMatch) info.drawer = drawerMatch[1]

    const payeeMatch = text.match(/收款人[：:]\s*([^\s]+)/)
    if (payeeMatch) info.payee = payeeMatch[1]

    const reviewerMatch = text.match(/复核人[：:]\s*([^\s]+)/)
    if (reviewerMatch) info.reviewer = reviewerMatch[1]

    // 提取税额
    const taxAmountMatch = text.match(/税额[：:]\s*[￥¥]?(\d+\.?\d*)/)
    if (taxAmountMatch) info.taxAmount = taxAmountMatch[1]

    // 提取不含税金额
    const amountWithoutTaxMatch = text.match(/不含税金额[：:]\s*[￥¥]?(\d+\.?\d*)/)
    if (amountWithoutTaxMatch) info.amountWithoutTax = amountWithoutTaxMatch[1]

    // 提取项目名称（通常在商品或服务名称行）
    const itemNameMatch = text.match(/(?:商品|服务|项目)名称[：:]\s*([^\n]+)/)
    if (itemNameMatch) info.itemName = itemNameMatch[1].trim()
  }
}

export default PDFToWordParser