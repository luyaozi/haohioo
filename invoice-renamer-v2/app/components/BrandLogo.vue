<template>
  <!-- 品牌 Logo：好嗨o（渐变填充 + 连接圆环） -->
  <svg
    class="brand-logo"
    :width="size"
    :height="size * 0.32"
    viewBox="0 0 300 96"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="好嗨o Logo"
  >
    <defs>
      <linearGradient id="hh-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#6a5cff" />
        <stop offset="50%" stop-color="#586BFF" />
        <stop offset="100%" stop-color="#0EC5FF" />
      </linearGradient>
      <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.12" />
      </filter>
    </defs>

    <!-- 文本：好嗨 -->
    <text
      x="4"
      y="66"
      font-size="64"
      font-weight="800"
      font-family="'PingFang SC', 'HarmonyOS Sans', 'Noto Sans SC', 'Microsoft YaHei', system-ui, -apple-system, sans-serif"
      fill="url(#hh-grad)"
      letter-spacing="2"
      filter="url(#soft-shadow)"
    >好嗨</text>

    <!-- 连接线到圆环的“o” -->
    <line x1="184" y1="54" x2="232" y2="54" stroke="url(#hh-grad)" stroke-width="12" stroke-linecap="round" />

    <!-- 圆环“o” -->
    <circle cx="262" cy="54" r="30" fill="none" stroke="url(#hh-grad)" stroke-width="12" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  // 基础尺寸（宽度），高度会按比例缩放
  size?: number
}
withDefaults(defineProps<Props>(), {
  size: 260,
})
</script>

<style scoped>
.brand-logo { display: block; }
</style>