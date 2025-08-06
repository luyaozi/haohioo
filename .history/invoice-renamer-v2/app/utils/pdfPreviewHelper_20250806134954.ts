/**
 * PDF预览助手工具
 * 借鉴v1版本的简洁实现，使用embed标签而不是复杂的PDF.js渲染
 */

/**
 * 创建PDF预览URL
 * @param file PDF文件对象
 * @returns Promise<string> 预览URL
 */
export function createPdfPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 创建Blob URL用于预览
      const blob = new Blob([file], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      resolve(url)
    } catch (error) {
      console.error("创建PDF预览URL失败:", error)
      reject(error)
    }
  })
}

/**
 * 清理PDF预览URL
 * @param url 需要清理的URL
 */
export function cleanupPdfPreviewUrl(url: string): void {
  if (url && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url)
    } catch (error) {
      console.warn("清理PDF预览URL失败:", error)
    }
  }
}

/**
 * 检查浏览器是否支持PDF预览
 * @returns boolean 是否支持
 */
export function isBrowserSupportPdfPreview(): boolean {
  // 检查浏览器是否支持PDF预览
  const userAgent = navigator.userAgent.toLowerCase()

  // Chrome, Firefox, Safari, Edge 都支持embed PDF预览
  return (
    userAgent.includes("chrome") ||
    userAgent.includes("firefox") ||
    userAgent.includes("safari") ||
    userAgent.includes("edge")
  )
}

/**
 * 在新窗口中打开PDF
 * @param file PDF文件对象
 */
export async function openPdfInNewWindow(file: File): Promise<void> {
  try {
    const url = await createPdfPreviewUrl(file)
    const newWindow = window.open(url, "_blank")

    if (!newWindow) {
      throw new Error("无法打开新窗口，请检查浏览器弹窗设置")
    }

    // 在新窗口关闭时清理URL
    newWindow.addEventListener("beforeunload", () => {
      cleanupPdfPreviewUrl(url)
    })
  } catch (error) {
    console.error("在新窗口打开PDF失败:", error)
    throw error
  }
}

/**
 * 下载PDF文件
 * @param file PDF文件对象
 * @param fileName 下载文件名（可选）
 */
export function downloadPdfFile(file: File, fileName?: string): void {
  try {
    const url = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName || file.name

    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理URL
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error("下载PDF文件失败:", error)
    throw error
  }
}

/**
 * 获取PDF文件信息
 * @param file PDF文件对象
 * @returns 文件信息对象
 */
export function getPdfFileInfo(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    formattedSize: formatFileSize(file.size),
    formattedDate: new Date(file.lastModified).toLocaleString("zh-CN"),
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
