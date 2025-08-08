<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-icon">
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2" />
          <line
            x1="15"
            y1="9"
            x2="9"
            y2="15"
            stroke="#ef4444"
            stroke-width="2"
          />
          <line
            x1="9"
            y1="9"
            x2="15"
            y2="15"
            stroke="#ef4444"
            stroke-width="2"
          />
        </svg>
      </div>

      <h1 class="error-title">
        {{ error.statusCode === 404 ? "页面未找到" : "服务器错误" }}
      </h1>

      <p class="error-message">
        {{
          error.statusCode === 404
            ? "抱歉，您访问的页面不存在。"
            : "服务器遇到了一些问题，请稍后再试。"
        }}
      </p>

      <div class="error-details" v-if="error.statusCode !== 404">
        <details>
          <summary>错误详情</summary>
          <pre>{{ error.message }}</pre>
        </details>
      </div>

      <div class="error-actions">
        <button @click="handleError" class="btn-primary">返回首页</button>
        <button @click="refresh" class="btn-secondary">刷新页面</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NuxtError {
  statusCode: number
  statusMessage: string
  message: string
}

const props = defineProps<{
  error: NuxtError
}>()

// 设置页面标题
useHead({
  title: `错误 ${props.error.statusCode} - 智能发票重命名工具`,
  meta: [{ name: "robots", content: "noindex" }],
})

// 处理错误
const handleError = () => {
  clearError({ redirect: "/" })
}

// 刷新页面
const refresh = () => {
  window.location.reload()
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.error-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.error-icon {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.error-message {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.6;
}

.error-details {
  margin-bottom: 32px;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.error-details pre {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.8rem;
  color: #374151;
  overflow-x: auto;
  white-space: pre-wrap;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .error-container {
    padding: 24px;
  }

  .error-title {
    font-size: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
