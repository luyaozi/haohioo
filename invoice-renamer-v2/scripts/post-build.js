#!/usr/bin/env node

/**
 * 构建后处理脚本 - V2版本
 * 确保 PDF.js worker 文件在构建后可用
 * 支持多种部署环境：开发、构建、Docker等
 */

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 定义可能的源文件路径（按优先级排序）
const possibleSources = [
  // 1. pnpm 环境
  join(projectRoot, 'node_modules/.pnpm/pdfjs-dist@3.11.174/node_modules/pdfjs-dist/build/pdf.worker.min.js'),
  // 2. npm 标准环境
  join(projectRoot, 'node_modules/pdfjs-dist/build/pdf.worker.min.js'),
  // 3. 备用路径
  join(projectRoot, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js'),
];

// 定义目标路径
const targetDir = join(projectRoot, '.output/public');
const targetWorker = join(targetDir, 'pdf.worker.min.js');

// 备用目标路径（用于开发环境）
const devTargetDir = join(projectRoot, 'public');
const devTargetWorker = join(devTargetDir, 'pdf.worker.min.js');

/**
 * 查找可用的源文件
 */
function findAvailableSource() {
  for (const source of possibleSources) {
    if (existsSync(source)) {
      console.log('✅ 找到 PDF.js worker 源文件:', source);
      return source;
    }
  }
  return null;
}

/**
 * 复制文件到指定目标
 */
function copyWorkerFile(source, target, targetDesc) {
  try {
    const targetDirPath = dirname(target);
    
    // 确保目标目录存在
    if (!existsSync(targetDirPath)) {
      mkdirSync(targetDirPath, { recursive: true });
      console.log('📁 创建目标目录:', targetDirPath);
    }

    // 复制文件
    copyFileSync(source, target);
    console.log(`✅ PDF.js worker 文件复制成功 (${targetDesc}):`, target);
    return true;
  } catch (error) {
    console.error(`❌ 复制 PDF.js worker 文件失败 (${targetDesc}):`, error.message);
    return false;
  }
}

/**
 * 主处理逻辑
 */
function main() {
  console.log('🔄 开始处理 PDF.js worker 文件...');
  
  // 查找源文件
  const sourceWorker = findAvailableSource();
  if (!sourceWorker) {
    console.error('❌ 未找到 PDF.js worker 源文件，请检查 pdfjs-dist 依赖是否正确安装');
    console.log('💡 尝试运行: pnpm install 或 npm install');
    process.exit(1);
  }

  let success = false;

  // 1. 尝试复制到构建输出目录（生产环境）
  if (existsSync(dirname(targetWorker))) {
    success = copyWorkerFile(sourceWorker, targetWorker, '生产构建') || success;
  }

  // 2. 复制到开发环境目录（确保开发时也有最新版本）
  success = copyWorkerFile(sourceWorker, devTargetWorker, '开发环境') || success;

  if (success) {
    console.log('🎉 PDF.js worker 文件处理完成！');
  } else {
    console.error('❌ PDF.js worker 文件处理失败');
    process.exit(1);
  }
}

// 执行主逻辑
main();