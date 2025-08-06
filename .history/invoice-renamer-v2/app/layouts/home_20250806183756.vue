<template>
  <div class="app-layout">
    <main class="px-10 py-20 text-center main-content">
      <RightTopMenu class="absolute top-4 right-4" />

      <slot />
      <div class="mx-auto mt-5 text-center text-sm opacity-25">
        [Home Layout]
      </div>
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
