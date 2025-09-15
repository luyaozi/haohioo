<script setup lang="ts">
const router = useRouter()

// 抛出 404，让 Nuxt 使用 error.vue，并返回正确状态码
throw createError({ statusCode: 404, statusMessage: 'Page Not Found' })
</script>

<template>
  <!-- 兜底模板不会渲染（因为上面已经抛错），保留以便本地调试时临时注释掉 throw -->
  <main p="x4 y10" text="center teal-700 dark:gray-200">
    <div text-4xl>
      <div i-ep-warning inline-block />
    </div>
    <div>Not found</div>
    <div>
      <button text-sm btn m="3 t8" @click="router.back()">
        Back
      </button>
    </div>
  </main>
</template>
