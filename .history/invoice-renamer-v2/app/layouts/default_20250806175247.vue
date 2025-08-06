<template>
  <div class="app-layout">
    <main class="main-content">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Footer from './Footer.vue'
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .main-content {
    flex: 1;
  }
}
</style>
