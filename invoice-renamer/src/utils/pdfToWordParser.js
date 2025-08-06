/**
 * PDF转Word文档解析器
 * 将PDF转换为结构化的文本，然后按行列解析发票信息
 */

// 检测环境
const isNode = typeof window === 'undefined';

class PDFToWordParser {
    constructor() {
        this.initialized = false;
        this.fs = null;
        this.path = null;
        this.getDocument = null;
        this.invoicePatterns = {
            // 发票号码模式
            invoiceNumber: [
                /发票号码[：:]\s*(\d+)/,
                /发票代码[：:]\s*(\d+)/,
                /No[：:]\s*(\d+)/,
                /(\d{20,})/  // 20位以上数字
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
        };
    }

    /**
     * 设置 PDF.js Worker，包含多重 fallback 策略
     */
    async setupWorker(pdfjs) {
        const workerSources = [
            // 1. 尝试使用 CDN
            `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
            // 2. 备用 CDN
            `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
            // 3. 本地 public 目录
            '/pdf.worker.js',
            // 4. 开发环境路径
            '/node_modules/pdfjs-dist/build/pdf.worker.js'
        ];

        for (const workerSrc of workerSources) {
            try {
                // 测试 worker 是否可用
                await this.testWorkerSource(workerSrc);
                pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
                console.log(`PDF.js worker 设置成功: ${workerSrc}`);
                return;
            } catch (error) {
                console.warn(`PDF.js worker 源不可用: ${workerSrc}`, error.message);
                continue;
            }
        }

        // 如果所有 worker 源都失败，禁用 worker（使用主线程）
        console.warn('所有 PDF.js worker 源都不可用，将在主线程中运行（性能可能受影响）');
        pdfjs.GlobalWorkerOptions.workerSrc = null;
    }

    /**
     * 测试 worker 源是否可用
     */
    async testWorkerSource(workerSrc) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Worker 测试超时'));
            }, 3000);

            // 尝试加载 worker 脚本
            if (workerSrc.startsWith('http')) {
                // 对于 HTTP 源，使用 fetch 测试
                fetch(workerSrc, { method: 'HEAD' })
                    .then(response => {
                        clearTimeout(timeout);
                        if (response.ok) {
                            resolve();
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    })
                    .catch(error => {
                        clearTimeout(timeout);
                        reject(error);
                    });
            } else {
                // 对于本地源，假设可用（实际测试会在 PDF 解析时进行）
                clearTimeout(timeout);
                resolve();
            }
        });
    }

    /**
     * 初始化模块
     */
    async init() {
        if (!this.initialized) {
            if (isNode) {
                // Node.js 环境
                this.fs = (await import('fs')).default;
                this.path = (await import('path')).default;
                const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
                this.getDocument = pdfjs.getDocument || pdfjs.default?.getDocument;
            } else {
                // 浏览器环境
                const pdfjs = await import('pdfjs-dist');
                this.getDocument = pdfjs.getDocument;
                
                // 设置 worker - 多重 fallback 策略
                await this.setupWorker(pdfjs);
            }
            this.initialized = true;
        }
    }

    /**
     * 解析PDF文件
     */
    async parsePDF(pdfPath) {
        await this.init();
        
        try {
            console.log(`开始解析PDF: ${pdfPath}`);
            
            // 读取PDF文件
            const data = new Uint8Array(this.fs.readFileSync(pdfPath));
            const pdf = await this.getDocument({ data }).promise;
            
            let fullText = '';
            const pages = [];
            
            // 逐页提取文本
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // 按位置排序文本项
                const sortedItems = this.sortTextItems(textContent.items);
                const pageText = this.reconstructText(sortedItems);
                
                pages.push({
                    pageNumber: i,
                    text: pageText,
                    items: sortedItems
                });
                
                fullText += pageText + '\n';
            }
            
            return {
                fullText,
                pages,
                fileName: isNode ? this.path.basename(pdfPath) : pdfPath.split('/').pop()
            };
            
        } catch (error) {
            console.error(`解析PDF失败: ${pdfPath}`, error);
            throw error;
        }
    }

    /**
     * 按位置排序文本项（从上到下，从左到右）
     */
    sortTextItems(items) {
        return items.sort((a, b) => {
            // 首先按Y坐标排序（从上到下）
            const yDiff = b.transform[5] - a.transform[5];
            if (Math.abs(yDiff) > 5) { // 5像素的容差
                return yDiff;
            }
            // 如果在同一行，按X坐标排序（从左到右）
            return a.transform[4] - b.transform[4];
        });
    }

    /**
     * 重构文本，保持行列结构
     */
    reconstructText(items) {
        if (!items.length) return '';
        
        const lines = [];
        let currentLine = [];
        let currentY = items[0].transform[5];
        
        for (const item of items) {
            const y = item.transform[5];
            const x = item.transform[4];
            
            // 如果Y坐标差异超过阈值，说明是新行
            if (Math.abs(y - currentY) > 5) {
                if (currentLine.length > 0) {
                    lines.push(this.formatLine(currentLine));
                    currentLine = [];
                }
                currentY = y;
            }
            
            currentLine.push({
                text: item.str,
                x: x,
                y: y
            });
        }
        
        // 添加最后一行
        if (currentLine.length > 0) {
            lines.push(this.formatLine(currentLine));
        }
        
        return lines.join('\n');
    }

    /**
     * 格式化行，按列排列
     */
    formatLine(lineItems) {
        // 按X坐标排序
        lineItems.sort((a, b) => a.x - b.x);
        
        // 检测列分隔
        const columns = [];
        let currentColumn = [];
        let lastX = -1;
        
        for (const item of lineItems) {
            // 如果X坐标差异较大，说明是新列
            if (lastX >= 0 && item.x - lastX > 50) {
                if (currentColumn.length > 0) {
                    columns.push(currentColumn.map(c => c.text).join(''));
                    currentColumn = [];
                }
            }
            
            currentColumn.push(item);
            lastX = item.x;
        }
        
        // 添加最后一列
        if (currentColumn.length > 0) {
            columns.push(currentColumn.map(c => c.text).join(''));
        }
        
        // 用制表符连接列
        return columns.join('\t');
    }

    /**
     * 解析发票信息
     */
    parseInvoiceInfo(textData) {
        console.log('开始解析发票信息...');
        
        const invoiceInfo = {
            fileName: textData.fileName,
            invoiceNumber: '',
            totalAmount: '',
            totalAmountChinese: '',  // 新增合计大写
            buyerName: '',
            buyerTaxId: '',
            sellerName: '',
            sellerTaxId: '',
            invoiceDate: '',
            drawer: '',  // 新增开票人
            itemName: ''  // 新增项目名称
        };

        const text = textData.fullText;
        const lines = text.split('\n');

        // 解析发票号码
        invoiceInfo.invoiceNumber = this.extractInvoiceNumber(text);
        
        // 解析总金额
        invoiceInfo.totalAmount = this.extractTotalAmount(text);
        
        // 解析合计大写
        const totalAmountChineseMatch = text.match(/合计.*?[（(]大写[）)].*?([壹贰叁肆伍陆柒捌玖拾佰仟万亿零元角分整]+)/);
        if (totalAmountChineseMatch) {
            invoiceInfo.totalAmountChinese = totalAmountChineseMatch[1];
        }
        
        // 解析开票人
        const drawerMatch = text.match(/开票人[：:]?\s*([^\s\n\t]+)/);
        if (drawerMatch) {
            invoiceInfo.drawer = drawerMatch[1];
        }
        
        // 解析购买方和销售方信息
        this.parseFourColumnStructure(text, invoiceInfo);
        
        // 解析开票日期
        invoiceInfo.invoiceDate = this.extractInvoiceDate(text);
        
        // 提取项目名称
        invoiceInfo.itemName = this.extractItemName(textData);

        console.log('解析完成的发票信息:', invoiceInfo);
        return invoiceInfo;
    }

    /**
     * 解析四列结构的购买方和销售方信息
     */
    parseFourColumnStructure(text, invoiceInfo) {
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 查找包含购买方和销售方名称的行
            if ((line.includes('名称：') || line.includes('名 称:')) && line.includes('\t')) {
                const columns = line.split('\t').filter(col => col.trim());
                
                // 分析行结构，寻找购买方和销售方信息
                let buyerNameCol = -1;
                let sellerNameCol = -1;
                
                for (let j = 0; j < columns.length; j++) {
                    const col = columns[j].trim();
                    
                    // 购买方名称列 - 支持多种格式
                    if ((col.includes('购') || col.includes('买')) && (col.includes('名称：') || col.includes('名 称:'))) {
                        // 标准格式：名称：xxx
                        let buyerMatch = col.match(/名称：(.+)/);
                        if (!buyerMatch) {
                            // 特殊格式：买名 称:xxx
                            buyerMatch = col.match(/名 称:(.+)/);
                        }
                        if (buyerMatch) {
                            invoiceInfo.buyerName = buyerMatch[1].trim();
                        }
                        buyerNameCol = j;
                    }
                    
                    // 销售方名称列 - 支持多种格式
                    if ((col.includes('销') || col.includes('售')) && (col.includes('名称：') || col.includes('名 称:'))) {
                        // 标准格式：名称：xxx
                        let sellerMatch = col.match(/名称：(.+)/);
                        if (!sellerMatch) {
                            // 特殊格式：售名 称:xxx
                            sellerMatch = col.match(/名 称:(.+)/);
                        }
                        if (sellerMatch) {
                            invoiceInfo.sellerName = sellerMatch[1].trim();
                        }
                        sellerNameCol = j;
                    }
                }
                
                // 如果名称在标签列中没有找到完整内容，检查相邻列
                if (buyerNameCol >= 0 && !invoiceInfo.buyerName && buyerNameCol + 1 < columns.length) {
                    const nextCol = columns[buyerNameCol + 1].trim();
                    if (nextCol && !nextCol.includes('售') && !nextCol.includes('方')) {
                        invoiceInfo.buyerName = nextCol;
                    }
                }
                
                if (sellerNameCol >= 0 && !invoiceInfo.sellerName && sellerNameCol + 1 < columns.length) {
                    const nextCol = columns[sellerNameCol + 1].trim();
                    if (nextCol && !nextCol.includes('买') && !nextCol.includes('方')) {
                        invoiceInfo.sellerName = nextCol;
                    }
                }
            }
            
            // 特殊处理：查找包含购买方和销售方信息的单行格式
            // 例如："买名 称:个人    售名 称:西安华讯得贸易有限公司"
            if (!invoiceInfo.buyerName && !invoiceInfo.sellerName && 
                (line.includes('买名 称:') || line.includes('售名 称:'))) {
                
                // 提取购买方
                const buyerMatch = line.match(/买名 称:([^\s]+)/);
                if (buyerMatch) {
                    invoiceInfo.buyerName = buyerMatch[1].trim();
                }
                
                // 提取销售方
                const sellerMatch = line.match(/售名 称:(.+?)(?=\s|$)/);
                if (sellerMatch) {
                    invoiceInfo.sellerName = sellerMatch[1].trim();
                }
            }
            
            // 查找包含税号的行
            if (line.includes('统一社会信用代码') || line.includes('纳税人识别号')) {
                const columns = line.split('\t').filter(col => col.trim());
                
                for (let j = 0; j < columns.length; j++) {
                    const col = columns[j].trim();
                    
                    // 提取税号（18位数字字母组合）
                    const taxIdMatch = col.match(/([A-Z0-9]{18})/);
                    if (taxIdMatch) {
                        const taxId = taxIdMatch[1];
                        
                        // 根据位置判断是购买方还是销售方的税号
                        if (j < columns.length / 2) {
                            invoiceInfo.buyerTaxId = taxId;
                        } else {
                            invoiceInfo.sellerTaxId = taxId;
                        }
                    }
                }
            }
        }
        
        // 如果没有通过四列结构找到，尝试其他模式
        if (!invoiceInfo.buyerName) {
            const buyerPatterns = [
                /购买方[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/,
                /买方[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/,
                /客户[^：]*：[^销]*?([^：\s]+(?:公司|企业|个人|店))/
            ];
            
            for (const pattern of buyerPatterns) {
                 const match = text.match(pattern);
                 if (match) {
                     invoiceInfo.buyerName = match[1].trim();
                     break;
                 }
             }
         }
         
         if (!invoiceInfo.sellerName) {
             const sellerPatterns = [
                 /销售方[^：]*：[^购]*?([^：\s]+(?:公司|企业|个人|店))/,
                 /卖方[^：]*：[^购]*?([^：\s]+(?:公司|企业|个人|店))/,
                 /开票方[^：]*：[^购]*?([^：\s]+(?:公司|企业|个人|店))/
             ];
             
             for (const pattern of sellerPatterns) {
                 const match = text.match(pattern);
                 if (match) {
                     invoiceInfo.sellerName = match[1].trim();
                     break;
                 }
             }
        }
        
        // 处理个人购买方，清空税号
        if (invoiceInfo.buyerName && (invoiceInfo.buyerName.includes('个人') || invoiceInfo.buyerName.includes('（个人）'))) {
            invoiceInfo.buyerTaxId = '';
        }
    }

    /**
     * 提取项目名称
     */
    extractItemName(textData) {
        const lines = textData.fullText.split('\n');
        let itemName = '';
        
        // 查找项目明细表格的开始位置
        let itemStartIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('项目名称') || 
                line.includes('货物或应税劳务') ||
                line.includes('*') && (line.includes('服务') || line.includes('商品'))) {
                itemStartIndex = i;
                break;
            }
        }
        
        if (itemStartIndex === -1) {
            console.log('未找到项目明细表格开始位置');
            return itemName;
        }
        
        // 从表格开始位置向下查找第一个有效的项目行
        for (let i = itemStartIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 跳过空行
            if (!line) continue;
            
            // 跳过分隔线
            if (/^[-─═]+$/.test(line)) continue;
            
            // 跳过非项目明细行
            if (line.includes('合计') || 
                line.includes('价税合计') || 
                line.includes('开票人') ||
                line.includes('收款人') ||
                line.includes('复核') ||
                line.includes('销售方') ||
                line.includes('购买方')) {
                break;
            }
            
            // 解析第一列作为项目名称
            const columns = line.split(/\t+/);
            if (columns.length > 0) {
                let firstColumn = columns[0].trim();
                
                // 处理星号分类项目
                if (firstColumn.startsWith('*') && firstColumn.endsWith('*')) {
                    // 提取星号中间的内容
                    const match = firstColumn.match(/\*([^*]+)\*/);
                    if (match) {
                        itemName = match[1];
                        break;
                    }
                } else if (firstColumn) {
                    itemName = firstColumn;
                    break;
                }
            }
        }
        
        console.log('提取到的项目名称:', itemName);
        return itemName;
    }

    /**
     * 提取发票号码
     */
    extractInvoiceNumber(text) {
        // 多种发票号码模式
        const patterns = [
            /发票号码[：:]\s*(\d+)/,
            /No[：:]\s*(\d+)/,
            /(\d{20,})/  // 20位以上的数字
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                console.log(`发票号码匹配: ${match[1]}`);
                return match[1];
            }
        }
        
        console.log('未找到发票号码');
        return '';
    }

    /**
     * 提取总金额
     */
    extractTotalAmount(text) {
        // 多种金额模式，优先匹配更精确的模式
        const patterns = [
            /价税合计[（(]大写[）)].*?[￥¥](\d+\.?\d*)/,
            /合计[：:]\s*[￥¥]?(\d+\.\d{2})/,
            /总计[：:]\s*[￥¥]?(\d+\.\d{2})/,
            /[￥¥]\s*(\d+\.\d{2})/
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                console.log(`总金额匹配: ${match[1]}`);
                return match[1];
            }
        }
        
        console.log('未找到总金额');
        return '';
    }

    /**
     * 提取开票日期
     */
    extractInvoiceDate(text) {
        const patterns = [
            /开票日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
            /日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
            /(\d{4}年\d{1,2}月\d{1,2}日)/
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                console.log(`开票日期匹配: ${match[1]}`);
                return match[1];
            }
        }
        
        console.log('未找到开票日期');
        return '';
    }

    /**
     * 解析浏览器中的PDF文件对象
     */
    async parseFile(file) {
        await this.init();
        
        try {
            console.log(`开始解析PDF文件: ${file.name}`);
            
            // 将File对象转换为ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            
            // 使用pdfjs-dist解析PDF
            const pdf = await this.getDocument({ data }).promise;
            
            let fullText = '';
            const pages = [];
            
            // 逐页提取文本
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // 按位置排序文本项
                const sortedItems = this.sortTextItems(textContent.items);
                const pageText = this.reconstructText(sortedItems);
                
                pages.push({
                    pageNumber: i,
                    text: pageText,
                    items: sortedItems
                });
                
                fullText += pageText + '\n';
            }
            
            const textData = {
                fullText,
                pages,
                fileName: file.name
            };
            
            // 解析发票信息
            const invoiceInfo = this.parseInvoiceInfo(textData);
            
            return invoiceInfo;
            
        } catch (error) {
            console.error(`解析PDF文件失败: ${file.name}`, error);
            throw error;
        }
    }

    /**
     * 批量处理PDF文件
     */
    async batchProcess(pdfPaths) {
        const results = [];
        
        for (const pdfPath of pdfPaths) {
            try {
                const fileName = isNode ? this.path.basename(pdfPath) : pdfPath.split('/').pop();
                console.log(`\n处理文件: ${fileName}`);
                
                const textData = await this.parsePDF(pdfPath);
                const invoiceInfo = this.parseInvoiceInfo(textData);
                
                results.push({
                    success: true,
                    filePath: pdfPath,
                    invoiceInfo,
                    textData
                });
                
                console.log(`✓ 成功解析: ${invoiceInfo.invoiceNumber || '未找到发票号'}`);
                
            } catch (error) {
                console.error(`✗ 解析失败: ${fileName}`, error.message);
                results.push({
                    success: false,
                    filePath: pdfPath,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * 生成详细报告
     */
    generateReport(results) {
        const report = {
            summary: {
                total: results.length,
                success: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            },
            details: results.map(result => {
                const fileName = isNode ? this.path.basename(result.filePath) : result.filePath.split('/').pop();
                if (result.success) {
                    const info = result.invoiceInfo;
                    return {
                        fileName,
                        invoiceNumber: info.invoiceNumber || '未识别',
                        totalAmount: info.totalAmount || '未识别',
                        buyerName: info.buyerName || '未识别',
                        sellerName: info.sellerName || '未识别',
                        buyerTaxId: info.buyerTaxId || '未识别',
                        sellerTaxId: info.sellerTaxId || '未识别',
                        invoiceDate: info.invoiceDate || '未识别',
                        status: '成功'
                    };
                } else {
                    return {
                        fileName,
                        status: '失败',
                        error: result.error
                    };
                }
            })
        };
        
        return report;
    }
}

export default PDFToWordParser;