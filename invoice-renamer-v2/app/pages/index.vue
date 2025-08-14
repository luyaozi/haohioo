<script setup lang="ts">
import {
  generateSEO,
  generateMetaTags,
  generateStructuredData,
} from "../../utils/seo"

// 强制页面重新渲染，避免样式缓存问题
onMounted(() => {
  // 强制重新计算样式
  nextTick(() => {
    document.documentElement.style.setProperty(
      "--force-rerender",
      Math.random().toString()
    )
  })
})

// 页面SEO配置
const seoConfig = generateSEO({
  url: "https://fapiao.haohio.xyz",
  title: "智能工具平台 - 提高工作效率的在线工具集合",
  description:
    "免费在线工具平台，包含发票重命名工具、视频拆帧工具等多种实用工具，帮助您提高工作效率。",
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

// 工具列表数据
const tools = [
  {
    id: "invoice-renamer",
    name: "智能发票重命名工具",
    description: "批量重命名PDF发票文件，智能提取发票信息并按规则重命名",
    icon: "📄",
    path: "/invoice-renamer",
    features: [
      "智能提取发票信息",
      "批量重命名PDF文件",
      "自定义命名规则",
      "本地处理，保护隐私",
    ],
  },
  {
    id: "video-frame-extractor",
    name: "视频拆帧工具",
    description: "从视频中提取关键帧，支持多种视频格式，快速生成图片序列",
    icon: "🎬",
    path: "/video-frame-extractor",
    features: [
      "支持多种视频格式",
      "自定义提取间隔",
      "高质量图片输出",
      "批量处理功能",
    ],
  },
]

// 即将推出的工具
const comingSoonTools = [
  {
    name: "PDF合并工具",
    description: "将多个PDF文件合并为一个文件",
    icon: "📑",
  },
  {
    name: "图片压缩工具",
    description: "在线压缩图片，减小文件大小",
    icon: "🖼️",
  },
  {
    name: "文档转换工具",
    description: "支持多种文档格式之间的转换",
    icon: "🔄",
  },
]
</script>

<template>
  <div class="tools-platform">
    <!-- 平台头部 -->
    <header class="platform-header" role="banner">
      <div class="header-content">
        <div class="platform-logo">
          <div class="logo-icon" aria-label="工具平台图标">🛠️</div>
          <h1 class="platform-title">智能工具平台</h1>
        </div>
        <p class="platform-subtitle">
          提高工作效率的在线工具集合 - 免费、安全、易用
        </p>
        <p class="platform-description">
          我们致力于为用户提供高质量的在线工具，帮助您更高效地处理日常工作任务。所有工具均在本地运行，确保您的数据安全。
        </p>
      </div>
      <div class="header-decoration" aria-hidden="true"></div>
    </header>

    <!-- 主要内容区域 -->
    <main class="platform-main" role="main">
      <!-- 可用工具区域 -->
      <section class="tools-section" aria-label="可用工具">
        <h2 class="section-title">🚀 可用工具</h2>
        <div class="tools-grid">
          <div
            v-for="tool in tools"
            :key="tool.id"
            class="tool-card"
            @click="navigateTo(tool.path)"
          >
            <div class="tool-icon">{{ tool.icon }}</div>
            <h3 class="tool-name">{{ tool.name }}</h3>
            <p class="tool-description">{{ tool.description }}</p>
            <div class="tool-features">
              <h4 class="features-title">主要功能</h4>
              <ul class="features-list">
                <li
                  v-for="feature in tool.features"
                  :key="feature"
                  class="feature-item"
                >
                  {{ feature }}
                </li>
              </ul>
            </div>
            <div class="tool-card-button">
              <span>立即使用</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 即将推出区域 -->
      <section class="coming-soon-section" aria-label="即将推出的工具">
        <h2 class="section-title">⏳ 即将推出</h2>
        <div class="coming-soon-grid">
          <div
            v-for="tool in comingSoonTools"
            :key="tool.name"
            class="coming-soon-card"
          >
            <div class="tool-icon">{{ tool.icon }}</div>
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.description }}</p>
            <div class="coming-soon-badge">敬请期待</div>
          </div>
        </div>
      </section>

      <!-- 关于平台 -->
      <section class="about-platform" aria-label="关于平台">
        <div class="about-content">
          <div class="about-text">
            <p>
              我们的智能工具平台专注于为用户提供实用、高效的在线工具。每个工具都经过精心设计和优化，确保最佳的用户体验。
            </p>
            <div class="platform-features">
              <div class="feature-card">
                <div class="feature-icon">🔒</div>
                <h3>数据安全</h3>
                <p>所有处理均在本地进行，不上传任何文件到服务器</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3>高效便捷</h3>
                <p>简洁的界面设计，快速完成各种文件处理任务</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🆓</div>
                <h3>完全免费</h3>
                <p>所有工具永久免费使用，无需注册或付费</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.tools-platform {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;

  /* 确保样式隔离，避免与其他页面冲突 */
  isolation: isolate;

  /* 强制重新渲染变量 */
  --force-rerender: var(--force-rerender, 0);

  /* 确保样式优先级 */
  z-index: 0;
}

.platform-header {
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

.platform-logo {
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

.platform-title {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.5px;
}

.platform-subtitle {
  font-size: 18px;
  color: #666;
  font-weight: 500;
  margin: 16px 0 12px 0;
}

.platform-description {
  font-size: 14px;
  color: #777;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
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

.platform-main {
  padding: 40px 20px 60px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 区域标题样式 */
.section-title {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 40px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 工具区域样式 */
.tools-section {
  margin-bottom: 80px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

/* 工具卡片样式 */
.tool-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  .tool-icon {
    font-size: 48px;
    text-align: center;
    margin-bottom: 20px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .tool-name {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 15px;
    color: #2d3748;
    text-align: center;
  }

  .tool-description {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 20px;
    color: #666;
    text-align: center;
  }

  .tool-features {
    margin-bottom: 25px;
    flex-grow: 1;
  }

  .features-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 10px;
    color: #4a5568;
    text-align: center;
  }

  .features-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .feature-item {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0;
    padding-left: 20px;
    position: relative;

    &::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
  }

  .tool-card-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    margin-top: auto;
    transition: all 0.3s ease;

    .arrow {
      transition: transform 0.3s ease;
    }

    &:hover .arrow {
      transform: translateX(4px);
    }
  }
}

/* 即将推出区域样式 */
.coming-soon-section {
  margin-bottom: 80px;
}

.coming-soon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.coming-soon-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-4px);
  }

  .tool-icon {
    font-size: 40px;
    margin-bottom: 16px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: white;
  }

  p {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .coming-soon-badge {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
}

/* 关于平台样式 */
.about-platform {
  margin-bottom: 60px;
}

.about-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.about-text {
  text-align: center;
  color: #333;

  p {
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 30px;
    color: #666;
  }
}

.platform-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 30px;
}

.feature-card {
  text-align: center;
  padding: 24px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-4px);
  }

  .feature-icon {
    font-size: 36px;
    margin-bottom: 16px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: #2d3748;
  }

  p {
    font-size: 0.95rem;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .platform-header {
    padding: 30px 15px 50px;
  }

  .platform-title {
    font-size: 28px;
  }

  .logo-icon {
    font-size: 36px;
  }

  .platform-main {
    padding: 30px 15px 40px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .coming-soon-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .platform-features {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .about-content {
    padding: 30px 20px;
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

@media (max-width: 768px) {
  .features-text {
    font-size: 13px;
  }

  .separator {
    margin: 0 6px;
  }

  .seo-content {
    margin-top: 40px;
    padding: 30px 20px;
  }

  .seo-text h2 {
    font-size: 24px;
  }

  .seo-text h3 {
    font-size: 18px;
  }

  .seo-text p {
    font-size: 15px;
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

  .features-text {
    font-size: 12px;
  }

  .seo-content {
    padding: 20px 15px;
  }

  .seo-text h2 {
    font-size: 20px;
  }

  .seo-text h3 {
    font-size: 16px;
  }

  .seo-text p {
    font-size: 14px;
  }

  .about-us-btn {
    padding: 6px 12px;
    font-size: 14px;
  }

  .btn-icon {
    font-size: 16px;
  }
}
</style>
