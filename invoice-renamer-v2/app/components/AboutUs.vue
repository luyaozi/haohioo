<template>
  <section class="seo-content about-content" aria-label="关于我们">
    <div class="seo-text">
      <h2>关于我们</h2>
      <h3>智能发票重命名工具</h3>

      <!-- 默认显示的5行内容 -->
      <div class="about-preview">
        <p>
          我们的<strong>智能发票重命名工具</strong>是一款完全免费的在线工具，专为财务人员、会计师和需要整理大量发票的用户设计。
        </p>
        <p>
          通过先进的PDF解析技术，工具能够自动识别和提取发票中的关键信息，如发票号码、开票日期、金额、开票方等。
        </p>
        <p>支持<strong>批量处理</strong>多个PDF发票文件，大幅提升工作效率。</p>
        <p>
          <strong>智能识别</strong
          >发票信息，<strong>自定义命名规则</strong>，满足不同的文件管理需求。
        </p>
        <p>
          <strong>隐私保护</strong
          >：所有处理均在本地完成，不上传任何文件到服务器，<strong>完全免费</strong>使用。
          <button
            v-if="!isExpanded"
            @click="toggleExpand"
            class="inline-expand-btn"
          >
            展开更多 👇
          </button>
        </p>
      </div>

      <!-- 展开显示的完整内容 -->
      <div v-show="isExpanded" class="about-full-content">
        <h3>主要特色功能</h3>
        <ul>
          <li>
            <strong>批量处理</strong
            >：支持同时处理多个PDF发票文件，大幅提升工作效率
          </li>
          <li>
            <strong>智能识别</strong>：自动提取发票号码、日期、金额等关键信息
          </li>
          <li>
            <strong>自定义规则</strong
            >：灵活的命名规则设置，满足不同的文件管理需求
          </li>
          <li>
            <strong>隐私保护</strong
            >：所有处理均在本地完成，不上传任何文件到服务器
          </li>
          <li><strong>免费使用</strong>：完全免费，无需注册，即开即用</li>
        </ul>

        <h3>适用场景</h3>
        <p>
          本工具特别适用于<strong>财务管理</strong>、<strong>报销整理</strong>、<strong>发票归档</strong>、
          <strong>会计记账</strong
          >等场景。无论您是企业财务人员、个人用户还是会计师事务所，
          都能通过我们的工具快速整理和管理发票文件，让文件管理变得简单高效。
        </p>

        <!-- 收起按钮 -->
        <div class="collapse-detail-section">
          <button @click="toggleExpand" class="about-expand-btn">
            <span class="btn-icon">👆</span>
            <span class="btn-text">收起详情</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 展开/收起状态
const isExpanded = ref(false)

// 切换展开状态
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style lang="scss" scoped>
/* SEO内容区域样式 */
.seo-content {
  margin-top: 60px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.seo-text {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.7;
  color: #333;
}

.seo-text h2 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.seo-text h3 {
  font-size: 20px;
  font-weight: 600;
  color: #34495e;
  margin: 32px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
}

.seo-text p {
  font-size: 14px;
  margin-bottom: 16px;
  text-align: justify;
}

.seo-text ul {
  margin: 16px 0;
  padding-left: 0;
  list-style: none;
}

.seo-text ul li {
  position: relative;
  padding: 12px 0 12px 24px;
  margin-bottom: 8px;
  border-left: 3px solid #667eea;
  padding-left: 20px;
  font-size: 14px;
  background: linear-gradient(
    90deg,
    rgba(102, 126, 234, 0.05) 0%,
    transparent 100%
  );
  border-radius: 0 8px 8px 0;
}

.seo-text ul li::before {
  content: "✓";
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #667eea;
  font-weight: bold;
  font-size: 14px;
}

.seo-text strong {
  color: #667eea;
  font-weight: 600;
}

.inline-expand-btn {
  background: transparent;
  border: none;
  color: #6b21a8;
  cursor: pointer;
  font-size: 0.875rem;
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.inline-expand-btn:hover {
  color: #7c3aed;
  background-color: rgba(107, 33, 168, 0.05);
}

.collapse-detail-section {
  margin-top: 1.5rem;
  text-align: center;
}

.about-expand-btn {
  background: transparent;
  border: none;
  color: #6b21a8;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.about-expand-btn:hover {
  color: #7c3aed;
  background-color: rgba(107, 33, 168, 0.05);
}

.about-full-content {
  margin-top: 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
}

.btn-text {
  font-weight: 500;
}

/* 关于我们内容区域动画 */
.about-content {
  animation: slideDown 0.3s ease-out;
  transform-origin: top;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .seo-content {
    margin-top: 40px;
    padding: 30px 20px;
  }

  .seo-text h2 {
    font-size: 24px;
  }

  .seo-text h3 {
    font-size: 16px;
  }

  .seo-text p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
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
}
</style>
