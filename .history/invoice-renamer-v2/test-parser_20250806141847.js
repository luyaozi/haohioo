// 测试解析器
const testText = `
购买方
名称: 未识别
纳税人识别号: 91510104MA61TH556B
地址、电话:
开户行及账号:

销售方
名称: 未识别
纳税人识别号: 91510104MA61TH556B
地址、电话:
开户行及账号:

项目名称: 客运服务费
价税合计(大写) 陆拾玖圆壹角
(小写) ¥69.10

开票人: 朱迪
`;

// 测试购买方名称解析 - 使用修复后的模式
const buyerNamePatterns = [
  /购买方[：:]?\s*名称[：:]\s*([^\n\r]+)/,
  /购买方[\s\n\r]*名称[：:]\s*([^\n\r]+)/,
  /购买方[：:]\s*([^\n\r]+)/,
];

console.log('测试购买方名称解析:');
buyerNamePatterns.forEach((pattern, index) => {
  const match = testText.match(pattern);
  console.log(`模式 ${index + 1}:`, match ? match[1] : '未匹配');
});

// 测试销售方名称解析 - 使用修复后的模式
const sellerNamePatterns = [
  /销售方[：:]?\s*名称[：:]\s*([^\n\r]+)/,
  /销售方[\s\n\r]*名称[：:]\s*([^\n\r]+)/,
  /销售方[：:]\s*([^\n\r]+)/,
];

console.log('\n测试销售方名称解析:');
sellerNamePatterns.forEach((pattern, index) => {
  const match = testText.match(pattern);
  console.log(`模式 ${index + 1}:`, match ? match[1] : '未匹配');
});

// 测试购买方税号解析
const buyerTaxPatterns = [
  /购买方[：:]?\s*纳税人识别号[：:]\s*([A-Z0-9]{15,20})/,
  /购买方[\s\n\r]*纳税人识别号[：:]\s*([A-Z0-9]{15,20})/,
];

console.log('\n测试购买方税号解析:');
buyerTaxPatterns.forEach((pattern, index) => {
  const match = testText.match(pattern);
  console.log(`模式 ${index + 1}:`, match ? match[1] : '未匹配');
});

// 测试销售方税号解析
const sellerTaxPatterns = [
  /销售方[：:]?\s*纳税人识别号[：:]\s*([A-Z0-9]{15,20})/,
  /销售方[\s\n\r]*纳税人识别号[：:]\s*([A-Z0-9]{15,20})/,
];

console.log('\n测试销售方税号解析:');
sellerTaxPatterns.forEach((pattern, index) => {
  const match = testText.match(pattern);
  console.log(`模式 ${index + 1}:`, match ? match[1] : '未匹配');
});

// 测试大写金额解析
const amountInWordsPatterns = [
  /大写金额[：:]\s*([^\n\r]+)/,
  /价税合计\(大写\)[：:]\s*([^\n\r]+)/,
  /价税合计\s*\(大写\)\s*([^(小写)]+)(?=\s*\(小写\))/,
  /\(大写\)\s*([^(小写)\n\r]+)(?=\s*\(小写\))/
];

console.log('\n测试大写金额解析:');
amountInWordsPatterns.forEach((pattern, index) => {
  const match = testText.match(pattern);
  console.log(`模式 ${index + 1}:`, match ? match[1] : '未匹配');
});