import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 模拟PDF.js的文本提取（简化版）
async function extractTextFromPDF(pdfPath) {
  try {
    // 这里我们先读取文件，确认文件存在
    const pdfBuffer = fs.readFileSync(pdfPath)
    console.log(`✅ PDF文件读取成功，大小: ${pdfBuffer.length} bytes`)
    
    // 由于我们无法在Node.js中直接使用PDF.js，我们先检查文件是否存在
    // 然后在浏览器中手动触发解析
    console.log('📄 PDF文件路径:', pdfPath)
    console.log('🔍 请在浏览器中访问 http://localhost:3001/test 并点击"开始测试"按钮')
    console.log('🔍 然后查看浏览器控制台的详细日志')
    
  } catch (error) {
    console.error('❌ 读取PDF文件失败:', error.message)
  }
}

// 测试文件
const testFile = path.join(__dirname, '发票111', 'digital_25617000000159404991.pdf')
console.log('🧪 开始测试PDF文本提取...')
extractTextFromPDF(testFile)