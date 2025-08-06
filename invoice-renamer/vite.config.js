import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  build: {
    // 提高 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成 source map 用于调试
    sourcemap: false,
    // 使用默认压缩
    minify: true,
    rollupOptions: {
      output: {
        // 确保 worker 文件被正确处理
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.includes('pdf.worker')) {
            return 'assets/pdf.worker-[hash].js'
          }
          return 'assets/[name]-[hash].[ext]'
        },
        // 手动代码分割，优化加载性能
        manualChunks: {
          // Vue 核心库单独打包
          'vue-vendor': ['vue'],
          // Element Plus UI 库单独打包
          'element-vendor': ['element-plus'],
          // Element Plus 图标库单独打包
          'element-icons': ['@element-plus/icons-vue'],
          // PDF.js 相关库单独打包
          'pdf-vendor': ['pdfjs-dist'],
          // 其他工具库单独打包
          'utils-vendor': ['jszip', 'sortablejs']
        }
      }
    }
  },
  // 复制 PDF.js worker 文件到 public 目录
  assetsInclude: ['**/*.worker.js']
})