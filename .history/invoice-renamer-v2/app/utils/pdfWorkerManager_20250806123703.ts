/**
 * PDF Worker 管理器
 * 确保 PDF.js worker 只初始化一次，提高性能
 */

let pdfjs: any = null
let workerInitialized = false
let initPromise: Promise<any> | null = null

/**
 * 测试 worker 源是否可用
 */
async function testWorkerSource(workerSrc: string): Promise<boolean> {
  try {
    const response = await fetch(workerSrc, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 设置 PDF.js worker
 */
async function setupWorker(pdfjsModule: any): Promise<void> {
  const workerSources = [
    // CDN 源 (优先)
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
    
    // 本地源 (备用)
    '/pdf.worker.min.js',
    '/_nuxt/node_modules/pdfjs-dist/build/pdf.worker.min.js',
  ]

  for (const workerSrc of workerSources) {
    try {
      if (await testWorkerSource(workerSrc)) {
        pdfjsModule.GlobalWorkerOptions.workerSrc = workerSrc
        console.log(`✅ PDF.js worker 设置成功: \`${workerSrc}\``)
        return
      }
    } catch (error) {
      console.warn(`⚠️ Worker 源测试失败: ${workerSrc}`, error)
    }
  }

  throw new Error('无法找到可用的 PDF.js worker 源')
}

/**
 * 获取初始化的 PDF.js 实例
 * 确保只初始化一次
 */
export async function getPdfjs(): Promise<any> {
  // 如果已经初始化，直接返回
  if (workerInitialized && pdfjs) {
    return pdfjs
  }

  // 如果正在初始化，等待完成
  if (initPromise) {
    return await initPromise
  }

  // 开始初始化
  initPromise = (async () => {
    try {
      console.log('🚀 开始初始化 PDF.js worker...')
      
      // 动态导入 pdfjs-dist
      pdfjs = await import('pdfjs-dist')
      
      // 设置 worker
      await setupWorker(pdfjs)
      
      workerInitialized = true
      console.log('✅ PDF.js worker 全局初始化完成')
      
      return pdfjs
    } catch (error) {
      console.error('❌ PDF.js worker 初始化失败:', error)
      // 重置状态，允许重试
      pdfjs = null
      workerInitialized = false
      initPromise = null
      throw error
    }
  })()

  return await initPromise
}

/**
 * 检查 worker 是否已初始化
 */
export function isWorkerInitialized(): boolean {
  return workerInitialized
}

/**
 * 重置 worker 状态（用于测试或错误恢复）
 */
export function resetWorker(): void {
  pdfjs = null
  workerInitialized = false
  initPromise = null
  console.log('🔄 PDF.js worker 状态已重置')
}