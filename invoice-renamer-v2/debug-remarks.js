const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = './public/pdf.worker.min.js';

async function extractTextFromPDF(filePath) {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // 提取文本项
      const textItems = textContent.items.map(item => item.str);
      const pageText = textItems.join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF解析错误:', error);
    return '';
  }
}

async function testRemarks() {
  console.log('=== 测试备注信息提取 ===\n');
  
  // 测试文件1
  const file1 = '/Users/lyao/WORK/AI/haohioo/invoice-renamer-v2/发票111/【风韵出行-17.61元-1个行程】高德打车电子发票.pdf';
  console.log('📄 测试文件1: 高德打车电子发票');
  const text1 = await extractTextFromPDF(file1);
  console.log('原始文本长度:', text1.length);
  console.log('原始文本内容:');
  console.log('---开始---');
  console.log(text1);
  console.log('---结束---\n');
  
  // 查找备注相关内容
  console.log('🔍 查找备注相关内容:');
  const lines1 = text1.split('\n');
  lines1.forEach((line, index) => {
    if (line.includes('备注') || line.includes('说明') || line.includes('附注') || 
        line.includes('银行') || line.includes('账号') || line.includes('开户')) {
      console.log(`第${index + 1}行: ${line}`);
    }
  });
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试文件2
  const file2 = '/Users/lyao/WORK/AI/haohioo/invoice-renamer-v2/发票111/鲁遥 创联教育 213元 （发票号：25617000000157293120）.pdf';
  console.log('📄 测试文件2: 创联教育发票');
  const text2 = await extractTextFromPDF(file2);
  console.log('原始文本长度:', text2.length);
  console.log('原始文本内容:');
  console.log('---开始---');
  console.log(text2);
  console.log('---结束---\n');
  
  // 查找备注相关内容
  console.log('🔍 查找备注相关内容:');
  const lines2 = text2.split('\n');
  lines2.forEach((line, index) => {
    if (line.includes('备注') || line.includes('说明') || line.includes('附注') || 
        line.includes('收款人') || line.includes('复核人') || line.includes('张静思') || line.includes('刘婧')) {
      console.log(`第${index + 1}行: ${line}`);
    }
  });
}

testRemarks().catch(console.error);