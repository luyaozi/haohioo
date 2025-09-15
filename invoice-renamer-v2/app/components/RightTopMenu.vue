<script setup lang="ts">
import { appName } from "~/constants"
</script>

<template>
  <header class="header w-full flex items-center justify-between">
    <NuxtLink to="/" class="brand" aria-label="好嗨o 首页">
      <img src="/logo.png" alt="好嗨o" class="logo-img" />
      <span class="sr-only">{{ appName }}</span>
    </NuxtLink>
    <!-- <div class="flex justify-center items-center gap-4 text-base">
      <DarkToggle />
      <GitHubLink />
    </div> -->
  </header>
</template>

<style scoped>
.header {
  height: 60px;
  padding: 8px 12px;
}
.brand {
  display: inline-flex;
  align-items: center;
  height: 44px;
  text-decoration: none;
}
.logo-img {
  height: 26px;
  width: auto;
  display: block;
  image-rendering: -webkit-optimize-contrast;
  backface-visibility: hidden;
  transform: translateZ(0);
}
/* 无障碍隐藏文本 */
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
