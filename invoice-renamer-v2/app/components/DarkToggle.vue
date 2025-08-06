<script setup lang="ts">
const color = useColorMode()

// 强制设置为浅色模式
color.preference = 'light'

useHead({
  meta: [{
    id: 'theme-color',
    name: 'theme-color',
    content: '#ffffff', // 固定为白色主题
  }],
})

// 禁用深色模式切换
function toggleDark() {
  // 不执行任何操作，保持浅色模式
  return
}
</script>

<template>
  <!-- 隐藏深色模式切换按钮 -->
  <div style="display: none;">
    <button class="inline-flex justify-center items-center" @click="toggleDark">
      <div class="i-ri-sun-line" />
    </button>
  </div>
</template>
