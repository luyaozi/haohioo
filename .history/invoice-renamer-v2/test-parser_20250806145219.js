import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 模拟浏览器环境的Blob
global.Blob = class Blob {
  constructor(parts, options = {}) {
    this.parts = parts;
    this.type = options.type || '';
  }
  
  arrayBuffer() {
    return Promise.resolve(Buffer.concat(this.parts.map(part => 
      Buffer.isBuffer(part) ? part : Buffer.from(part)
    )));
  }
};

// 导入解析器 - 需要编译后的JS文件
const { PDFToWordParser } = await import('./app/utils/pdfToWordParser.js').catch(async () => {
  // 如果JS文件不存在，尝试直接导入TS文件（需要ts-node）
  const { PDFToWordParser } = await import('./app/utils/pdfToWordParser.ts');
  return { PDFToWordParser };
});

const testDir = path.join(__dirname, '发票111');

async function testPDFParsing() {
  console.log('🧪 开始测试PDF解析功能...\n');
  
  // 获取所有PDF文件
  const files = fs.readdirSync(testDir).filter(file => file.endsWith('.pdf'));
  
  console.log(`📁 找到 ${files.length} 个PDF文件:\n`);
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  console.log('\n' + '='.repeat(80) + '\n');
  
  const parser = new PDFToWordParser();
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(testDir, file);
    
    console.log(`📄 测试文件 ${i + 1}/${files.length}: ${file}`);
    console.log('-'.repeat(60));
    
    try {
      // 读取PDF文件
      const fileBuffer = fs.readFileSync(filePath);
      const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });
      
      // 解析PDF
      const result = await parser.parseInvoice(fileBlob);
      
      console.log('✅ 解析结果:');
      console.log(`   购买方名称: ${result.buyerName || '未识别'}`);
      console.log(`   购买方税号: ${result.buyerTaxId || '未识别'}`);
      console.log(`   销售方名称: ${result.sellerName || '未识别'}`);
      console.log(`   销售方税号: ${result.sellerTaxId || '未识别'}`);
      console.log(`   发票号码: ${result.invoiceNumber || '未识别'}`);
      console.log(`   开票日期: ${result.invoiceDate || '未识别'}`);
      console.log(`   价税合计: ${result.totalAmount || '未识别'}`);
      console.log(`   开票人: ${result.drawer || '未识别'}`);
      console.log(`   项目名称: ${result.itemName || '未识别'}`);
      
      // 生成建议的文件名
      const suggestedName = parser.generateFileName(result);
      console.log(`   建议文件名: ${suggestedName}`);
      
    } catch (error) {
      console.log('❌ 解析失败:');
      console.log(`   错误信息: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  console.log('🎉 测试完成!');
}

// 运行测试
testPDFParsing().catch(console.error);