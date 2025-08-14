<script setup lang="ts">
import {
  generateSEO,
  generateMetaTags,
  generateStructuredData,
} from "../../utils/seo"

// 页面SEO配置
const seoConfig = generateSEO({
  url: "https://fapiao.haohio.xyz/invoice-renamer",
  title: "智能发票重命名工具 - 批量重命名PDF发票文件",
  description: "免费在线PDF发票批量重命名工具，智能提取发票信息并按规则重命名，本地处理保护隐私。"
})

// 设置页面头部信息
useHead({
  title: seoConfig.title,
  meta: generateMetaTags(seoConfig),
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(generateStructuredData(seoConfig)),
    },
  ],
})

</script>

<template>
  <div class="invoice-app">
    <!-- 页面导航 -->
    <PageNavigation 
      current-page-icon="📄" 
      current-page-title="发票重命名工具" 
    />

    <!-- 应用头部 -->
    <header class="app-header" role="banner">
      <div class="header-content">
        <div class="app-logo">
          <div class="logo-icon" aria-label="发票图标">📄</div>
          <h1 class="app-title">智能发票重命名工具</h1>
        </div>
        <p class="app-subtitle">
          让文件管理变得简单高效 - 免费在线PDF发票批量重命名
        </p>

        <!-- 简单的功能介绍 -->
        <div class="features-intro" aria-label="主要功能">
          <p class="features-text">
            <span class="feature-item">📋 智能提取发票信息</span>
            <span class="separator">|</span>
            <span class="feature-item">🔄 批量重命名PDF文件</span>
            <span class="separator">|</span>
            <span class="feature-item">⚙️ 自定义命名规则</span>
            <span class="separator">|</span>
            <span class="feature-item">💾 本地处理，保护隐私</span>
          </p>
        </div>
      </div>
      <div class="header-decoration" aria-hidden="true"></div>
    </header>

    <!-- 主要内容区域 -->
    <main class="app-main" role="main">
      <section aria-label="发票重命名工具">
        <h2 class="sr-only">发票重命名工具</h2>
        <InvoiceRenamer />
      </section>

      <!-- 关于我们组件 -->
      <AboutUs />
    </main>
  </div>
</template>

<style lang="scss" scoped>
/* 确保样式隔离，避免与其他页面冲突 */
.invoice-app {
  isolation: isolate;
}

/* 导航样式已移至 PageNavigation 组件 */

.invoice-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  padding-top: 60px; /* 为固定导航留出空间 */
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

/* 功能介绍样式 */
.features-intro {
  margin-top: 16px;
  text-align: center;
}

.features-text {
  font-size: 14px;
  font-weight: 400;
  margin: 0;
  line-height: 1.5;
}

.feature-item {
  color: #667eea;
  font-weight: 500;
  transition: color 0.3s ease;
}

.separator {
  color: #999;
  margin: 0 8px;
  opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 15px;
  }

  .nav-home {
    padding: 6px 12px;
    font-size: 14px;
  }

  .nav-current {
    font-size: 14px;
  }

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

/* 无障碍访问 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>