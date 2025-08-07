/**
 * PDF文本处理工具
 * 负责PDF文本的排序、重构和格式化
 */

import type { TextItem } from "pdfjs-dist/types/src/display/api"

export interface TextItemWithPosition {
  text: string
  x: number
  y: number
}

export interface PageData {
  pageNumber: number
  text: string
  items: TextItemWithPosition[]
}

export class TextProcessor {
  /**
   * 按位置排序文本项（从上到下，从左到右）
   */
  static sortTextItems(items: TextItem[]): TextItemWithPosition[] {
    return items
      .map(item => ({
        text: item.str || '',
        x: item.transform?.[4] || 0,
        y: item.transform?.[5] || 0
      }))
      .sort((a, b) => {
        // 首先按Y坐标排序（从上到下）
        const yDiff = b.y - a.y
        if (Math.abs(yDiff) > 5) { // 5像素的容差
          return yDiff
        }
        // 如果在同一行，按X坐标排序（从左到右）
        return a.x - b.x
      })
  }

  /**
   * 重构文本，保持行列结构
   */
  static reconstructText(items: TextItemWithPosition[]): string {
    if (!items.length) return ''
    
    const lines: string[] = []
    let currentLine: TextItemWithPosition[] = []
    let currentY = items[0]?.y || 0
    
    for (const item of items) {
      const { y, x } = item
      
      // 如果Y坐标差异超过阈值，说明是新行
      if (Math.abs(y - currentY) > 5) {
        if (currentLine.length > 0) {
          lines.push(this.formatLine(currentLine))
          currentLine = []
        }
        currentY = y
      }
      
      currentLine.push(item)
    }
    
    // 添加最后一行
    if (currentLine.length > 0) {
      lines.push(this.formatLine(currentLine))
    }
    
    return lines.join('\n')
  }

  /**
   * 格式化行，按列排列
   */
  private static formatLine(lineItems: TextItemWithPosition[]): string {
    // 按X坐标排序
    lineItems.sort((a, b) => a.x - b.x)
    
    // 检测列分隔
    const columns: string[] = []
    let currentColumn: TextItemWithPosition[] = []
    let lastX = -1
    
    for (const item of lineItems) {
      // 如果X坐标差异较大，说明是新列
      if (lastX >= 0 && item.x - lastX > 50) {
        if (currentColumn.length > 0) {
          columns.push(currentColumn.map(c => c.text).join(''))
          currentColumn = []
        }
      }
      
      currentColumn.push(item)
      lastX = item.x
    }
    
    // 添加最后一列
    if (currentColumn.length > 0) {
      columns.push(currentColumn.map(c => c.text).join(''))
    }
    
    // 用制表符连接列
    return columns.join('\t')
  }

  /**
   * 提取项目名称
   */
  static extractItemName(fullText: string): string {
    const lines = fullText.split('\n')
    let itemName = ''
    
    // 查找项目明细表格的开始位置
    let itemStartIndex = -1
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.includes('项目名称') || 
          line.includes('货物或应税劳务') ||
          (line.includes('*') && (line.includes('服务') || line.includes('商品')))) {
        itemStartIndex = i
        break
      }
    }
    
    if (itemStartIndex === -1) {
      console.log('未找到项目明细表格开始位置')
      return itemName
    }
    
    // 从表格开始位置向下查找第一个有效的项目行
    for (let i = itemStartIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 跳过空行
      if (!line) continue
      
      // 跳过分隔线
      if (/^[-─═]+$/.test(line)) continue
      
      // 跳过非项目明细行
      if (line.includes('合计') || 
          line.includes('价税合计') || 
          line.includes('开票人') ||
          line.includes('收款人') ||
          line.includes('复核') ||
          line.includes('销售方') ||
          line.includes('购买方')) {
        break
      }
      
      // 解析第一列作为项目名称
      const columns = line.split(/\t+/)
      if (columns.length > 0) {
        let firstColumn = columns[0].trim()
        
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
    
    console.log('提取到的项目名称:', itemName)
    return itemName
  }

  /**
   * 提取备注信息
   * 从发票fullText中提取"（小写）¥数字\n"之后到"\n开票人"之前的内容
   * 并过滤掉其中的"\n备"和"\n注"字符
   * @param fullText 发票的完整文本内容
   * @returns 提取的备注信息，如果没有找到则返回"无备注"
   */
  static extractRemarks(fullText: string): string {
    if (!fullText) return "无备注"
    
    try {
      // 查找"（小写）¥数字\n"之后的内容，直到"\n开票人"之前
      const startPattern = /（\s*小\s*写\s*）\s*¥[\d.]+\n/
      const endPattern = /\n开票人/
      
      const startMatch = fullText.match(startPattern)
      const endMatch = fullText.match(endPattern)
      
      if (startMatch && endMatch) {
        const startIndex = startMatch.index! + startMatch[0].length
        const endIndex = endMatch.index!
        
        if (startIndex < endIndex) {
          let remarks = fullText.substring(startIndex, endIndex)
          
          // 过滤掉"\n备"和"\n注"
          remarks = remarks.replace(/\n备/g, '').replace(/\n注/g, '')
          
          // 清理多余的换行符和空格，但保留有意义的内容
          remarks = remarks.trim()
          
          return remarks || "无备注"
        }
      }
      
      return "无备注"
    } catch (error) {
      console.error('提取备注信息时出错:', error)
      return "备注提取失败"
    }
  }
}