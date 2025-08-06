const fs = require('fs');
const path = require('path');

// 模拟一个简单的PDF文本提取来查看格式
const testPdfPath = path.join(__dirname, '发票111', 'digital_25617000000159404991.pdf');

console.log('测试PDF文件路径:', testPdfPath);
console.log('文件是否存在:', fs.existsSync(testPdfPath));

// 这里我们需要实际的PDF解析，但先检查文件
if (fs.existsSync(testPdfPath)) {
  const stats = fs.statSync(testPdfPath);
  console.log('文件大小:', stats.size, 'bytes');
} else {
  console.log('文件不存在');
}