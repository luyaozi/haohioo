<template>
  <div id="app">
    <div class="app-header">
      <div class="header-content">
        <div class="app-logo">
          <div class="logo-icon">📄</div>
          <h1 class="app-title">智能发票重命名</h1>
        </div>
        <div class="app-subtitle">让文件管理变得简单高效</div>
      </div>
      <div class="header-decoration"></div>
    </div>
    <div class="app-main">
      <InvoiceRenamer />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from "vue"

// 使用 defineAsyncComponent 正确处理动态导入
const InvoiceRenamer = defineAsyncComponent(
  () => import("./components/InvoiceRenamer.vue")
)

export default {
  name: "App",
  components: {
    InvoiceRenamer,
  },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1a1a1a;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.app-header {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.9) 100%
  );
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 40px 20px 60px;
  text-align: center;
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
}

.app-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.logo-icon {
  font-size: 48px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.app-title {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 16px;
  color: #666;
  font-weight: 400;
  opacity: 0.8;
  margin-top: 8px;
}

.header-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  clip-path: polygon(0 60%, 100% 0%, 100% 100%, 0% 100%);
}

.app-main {
  padding: 40px 20px 60px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    padding: 30px 15px 50px;
  }

  .app-title {
    font-size: 28px;
  }

  .logo-icon {
    font-size: 36px;
  }

  .app-main {
    padding: 30px 15px 40px;
  }
}

@media (max-width: 480px) {
  .app-logo {
    flex-direction: column;
    gap: 12px;
  }

  .app-title {
    font-size: 24px;
  }

  .app-subtitle {
    font-size: 14px;
  }
}
</style>
