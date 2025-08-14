<script setup lang="ts">
interface Props {
  currentPageIcon: string
  currentPageTitle: string
}

defineProps<Props>()
</script>

<template>
  <nav class="page-nav">
    <div class="nav-content">
      <NuxtLink to="/" class="nav-home">
        <span class="nav-icon">🏠</span>
        <span>返回首页</span>
      </NuxtLink>
      <div class="nav-current">
        <span class="nav-icon">{{ currentPageIcon }}</span>
        <span>{{ currentPageTitle }}</span>
      </div>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
/* 页面导航样式 */
.page-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 0;
}

.nav-content {
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-home {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
  text-decoration: none;
  color: #667eea;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid rgba(102, 126, 234, 0.2);

  &:hover {
    background: rgba(102, 126, 234, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }

  .nav-icon {
    font-size: 16px;
  }
}

.nav-current {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-weight: 500;

  .nav-icon {
    font-size: 16px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 16px;
  }

  .nav-home,
  .nav-current {
    padding: 6px 12px;
    font-size: 14px;

    .nav-icon {
      font-size: 14px;
    }
  }
}

@media (max-width: 480px) {
  .nav-home span:last-child,
  .nav-current span:last-child {
    display: none;
  }

  .nav-home,
  .nav-current {
    padding: 8px;
    min-width: 40px;
    justify-content: center;
  }
}
</style>