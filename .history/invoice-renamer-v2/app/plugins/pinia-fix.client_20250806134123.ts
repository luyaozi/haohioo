// 修复Pinia序列化问题的客户端插件
export default defineNuxtPlugin(() => {
  // 在客户端禁用Pinia状态序列化
  if (process.client) {
    const { $pinia } = useNuxtApp()
    
    // 重写shouldHydrate函数以避免序列化错误
    if ($pinia && $pinia._s) {
      for (const [id, store] of $pinia._s) {
        // 清理可能导致序列化问题的属性
        if (store.$state) {
          Object.keys(store.$state).forEach(key => {
            const value = store.$state[key]
            // 如果是File对象或包含File对象的数组/对象，则不序列化
            if (value instanceof File || 
                (Array.isArray(value) && value.some(item => item instanceof File)) ||
                (typeof value === 'object' && value !== null && hasFileObjects(value))) {
              // 标记为不可序列化
              Object.defineProperty(store.$state, key, {
                enumerable: false,
                configurable: true,
                writable: true,
                value: value
              })
            }
          })
        }
      }
    }
  }
})

// 检查对象是否包含File对象
function hasFileObjects(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      if (value instanceof File) return true
      if (typeof value === 'object' && value !== null && hasFileObjects(value)) return true
    }
  }
  
  return false
}