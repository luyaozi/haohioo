/**
 * PDF Worker 管理器
 * 确保 PDF.js worker 只初始化一次，提高性能
 * 参考 v1 版本的设计，使用更简单可靠的初始化策略
 */

let pdfjs: any = null
let workerInitialized = false
let initPromise: Promise<any> | null = null

/**
 * 测试 worker 源是否可用
 */
async function testWorkerSource(workerSrc: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 2000) // 减少超时时间

    if (workerSrc.startsWith("http")) {
      // 对于 HTTP 源，使用 fetch 测试
      fetch(workerSrc, { method: "HEAD" })
        .then((response) => {
          clearTimeout(timeout)
          resolve(response.ok)
        })
        .catch(() => {
          clearTimeout(timeout)
          resolve(false)
        })
    } else {
      // 对于本地源，假设可用（实际测试会在 PDF 解析时进行）
      clearTimeout(timeout)
      resolve(true)
    }
  })
}

/**
 * 设置 PDF.js worker，参考 v1 版本的 fallback 策略
 */
async function setupWorker(pdfjsModule: any): Promise<void> {
  // 检查是否已经设置过 worker
  if (pdfjsModule.GlobalWorkerOptions.workerSrc) {
    console.log(
      "✅ PDF.js worker 已设置，跳过重复设置:",
      pdfjsModule.GlobalWorkerOptions.workerSrc
    )
    return
  }

  const workerSources = [
    // 本地源 (优先，避免网络请求)
    "/pdf.worker.min.js",

    // CDN 源 (备用)
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
    "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js",

    // 开发环境路径
    "/_nuxt/node_modules/pdfjs-dist/build/pdf.worker.min.js",
  ]

  console.log("🔍 开始测试 PDF.js worker 源...")

  for (const workerSrc of workerSources) {
    try {
      console.log(`🧪 测试 worker 源: ${workerSrc}`)
      if (await testWorkerSource(workerSrc)) {
        pdfjsModule.GlobalWorkerOptions.workerSrc = workerSrc
        console.log(`✅ PDF.js worker 设置成功: ${workerSrc}`)
        return
      } else {
        console.warn(`❌ Worker 源不可用: ${workerSrc}`)
      }
    } catch (error) {
      console.warn(`⚠️ Worker 源测试失败: ${workerSrc}`, error)
    }
  }

  // 如果所有 worker 源都失败，禁用 worker（使用主线程）
  console.warn(
    "⚠️ 所有 PDF.js worker 源都不可用，将在主线程中运行（性能可能受影响）"
  )
  pdfjsModule.GlobalWorkerOptions.workerSrc = null
}

/**
 * 获取初始化的 PDF.js 实例
 * 确保只初始化一次，参考 v1 版本的设计
 */
export async function getPdfjs(): Promise<any> {
  // 如果已经初始化，直接返回
  if (workerInitialized && pdfjs) {
    console.log("📋 使用已初始化的 PDF.js 实例")
    return pdfjs
  }

  // 如果正在初始化，等待完成
  if (initPromise) {
    console.log("⏳ 等待 PDF.js 初始化完成...")
    return await initPromise
  }

  // 开始初始化
  initPromise = (async () => {
    try {
      console.log("🚀 开始初始化 PDF.js worker（全局单例）...")

      // 动态导入 pdfjs-dist
      pdfjs = await import("pdfjs-dist")

      // 设置 worker - 只设置一次
      await setupWorker(pdfjs)

      workerInitialized = true
      console.log("✅ PDF.js worker 全局初始化完成，后续解析将复用此实例")

      return pdfjs
    } catch (error) {
      console.error("❌ PDF.js worker 初始化失败:", error)
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
  console.log("🔄 PDF.js worker 状态已重置")
}
