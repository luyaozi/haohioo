<template>
  <div class="app-layout">
    <RightTopMenu class="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-white/30" />
    <main class="px-10 py-20 text-center main-content">
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
import RightTopMenu from '~/components/RightTopMenu.vue'
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
