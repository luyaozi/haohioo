#!/usr/bin/env node

/**
 * 构建后处理脚本
 * 确保 PDF.js worker 文件在构建后可用
 */

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const sourceWorker = join(projectRoot, 'node_modules/pdfjs-dist/build/pdf.worker.js');
const targetDir = join(projectRoot, 'dist');
const targetWorker = join(targetDir, 'pdf.worker.js');

try {
    // 检查源文件是否存在
    if (!existsSync(sourceWorker)) {
        console.error('❌ PDF.js worker 源文件不存在:', sourceWorker);
        process.exit(1);
    }

    // 检查目标目录是否存在
    if (!existsSync(targetDir)) {
        console.error('❌ 构建目录不存在:', targetDir);
        process.exit(1);
    }

    // 复制 worker 文件
    copyFileSync(sourceWorker, targetWorker);
    console.log('✅ PDF.js worker 文件复制成功:', targetWorker);

} catch (error) {
    console.error('❌ 复制 PDF.js worker 文件失败:', error.message);
    process.exit(1);
}