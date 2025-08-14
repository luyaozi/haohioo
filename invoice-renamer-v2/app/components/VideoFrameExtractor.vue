<template>
  <div class="video-extractor">
    <!-- 上传区域 -->
    <div class="upload-section">
      <div class="section-title">
        <span class="title-icon">📤</span>
        <h3>上传与设置</h3>
      </div>

      <div 
        class="upload-area" 
        :class="{ 'drag-over': isDragOver }"
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div class="upload-icon">🎬</div>
        <h4>点击上传视频文件</h4>
        <p>支持 MP4, WebM, OGG 等格式，最大文件大小 100MB</p>
        <button class="upload-btn" type="button">
          <span class="btn-icon">📁</span>
          选择视频文件
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="video/*"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>

      <!-- 设置面板 -->
      <div class="settings-panel">
        <div class="setting-item">
          <label for="frameRate">
            <span class="setting-icon">⚡</span>
            每秒帧数 (FPS)
          </label>
          <input
            id="frameRate"
            v-model.number="settings.frameRate"
            type="number"
            min="0.1"
            max="60"
            step="0.1"
            class="setting-input"
          />
        </div>

        <div class="setting-item">
          <label for="startTime">
            <span class="setting-icon">⏰</span>
            开始时间 (秒)
          </label>
          <input
            id="startTime"
            v-model.number="settings.startTime"
            type="number"
            min="0"
            class="setting-input"
          />
        </div>

        <div class="setting-item">
          <label for="endTime">
            <span class="setting-icon">⏱️</span>
            结束时间 (秒)
          </label>
          <input
            id="endTime"
            v-model.number="settings.endTime"
            type="number"
            min="0"
            :max="videoDuration"
            class="setting-input"
          />
        </div>

        <div class="setting-item">
          <label for="quality">
            <span class="setting-icon">⭐</span>
            图片质量 (0-1)
          </label>
          <input
            id="quality"
            v-model.number="settings.quality"
            type="number"
            min="0.1"
            max="1"
            step="0.1"
            class="setting-input"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button 
          class="action-btn primary" 
          :disabled="!videoFile || isExtracting"
          @click="extractFrames"
        >
          <span class="btn-icon">🔧</span>
          {{ isExtracting ? '提取中...' : '开始拆帧' }}
        </button>
        <button 
          class="action-btn secondary" 
          :disabled="frames.length === 0"
          @click="downloadAllFrames"
        >
          <span class="btn-icon">💾</span>
          下载全部帧
        </button>
        <button 
          class="action-btn" 
          @click="resetExtractor"
        >
          <span class="btn-icon">🔄</span>
          重置
        </button>
      </div>
    </div>

    <!-- 预览和结果区域 -->
    <div class="preview-section">
      <div class="section-title">
        <span class="title-icon">👁️</span>
        <h3>预览与结果</h3>
      </div>

      <!-- 视频预览 -->
      <div class="video-preview">
        <video 
          v-if="videoFile"
          ref="videoElement"
          :src="videoUrl"
          controls
          class="video-player"
          @loadedmetadata="handleVideoLoaded"
        />
        <div v-else class="video-placeholder">
          <div class="placeholder-icon">🎥</div>
          <p>视频预览区域</p>
        </div>
      </div>

      <!-- 进度显示 -->
      <div v-if="isExtracting || frames.length > 0" class="progress-section">
        <div class="progress-info">
          <span>处理进度: {{ Math.round(progress) }}%</span>
          <span>{{ statusText }}</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progress + '%' }"
          ></div>
        </div>
      </div>

      <!-- 提取结果 -->
      <div class="results-section">
        <div class="section-title">
          <span class="title-icon">🖼️</span>
          <h3>提取的帧 ({{ frames.length }})</h3>
        </div>

        <div v-if="frames.length === 0" class="no-results">
          <div class="no-results-icon">📦</div>
          <p>提取的帧将显示在这里</p>
        </div>

        <div v-else class="frames-grid">
          <div 
            v-for="(frame, index) in frames" 
            :key="index"
            class="frame-item"
            @click="downloadFrame(frame, index + 1)"
          >
            <img :src="frame.dataURL" :alt="`Frame ${index + 1}`" class="frame-image" />
            <div class="frame-info">
              <span class="frame-number">#{{ index + 1 }}</span>
              <span class="frame-time">{{ frame.time.toFixed(1) }}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Frame {
  time: number
  dataURL: string
}

interface Settings {
  frameRate: number
  startTime: number
  endTime: number
  quality: number
}

// 响应式数据
const fileInput = ref<HTMLInputElement>()
const videoElement = ref<HTMLVideoElement>()
const videoFile = ref<File | null>(null)
const videoUrl = ref<string>('')
const videoDuration = ref<number>(0)
const isDragOver = ref(false)
const isExtracting = ref(false)
const progress = ref(0)
const statusText = ref('准备就绪')
const frames = ref<Frame[]>([])

// 设置参数
const settings = ref<Settings>({
  frameRate: 1,
  startTime: 0,
  endTime: 10,
  quality: 0.9
})

// 文件上传处理
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processVideoFile(file)
  }
}

const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('video/')) {
    processVideoFile(file)
  }
}

const processVideoFile = (file: File) => {
  // 检查文件类型
  if (!file.type.startsWith('video/')) {
    alert('请选择有效的视频文件！')
    return
  }

  // 检查文件大小 (100MB)
  if (file.size > 100 * 1024 * 1024) {
    alert('文件大小不能超过100MB！')
    return
  }

  // 清理之前的URL
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }

  videoFile.value = file
  videoUrl.value = URL.createObjectURL(file)
  statusText.value = '视频已加载，可以开始拆帧'
}

const handleVideoLoaded = () => {
  if (videoElement.value) {
    videoDuration.value = videoElement.value.duration
    settings.value.endTime = Math.min(30, Math.floor(videoDuration.value))
  }
}

// 视频拆帧核心功能
const extractFrames = async () => {
  if (!videoFile.value || !videoElement.value) return

  // 验证参数
  if (settings.value.frameRate <= 0 || settings.value.frameRate > 60) {
    alert('帧率必须在0.1到60之间')
    return
  }

  if (settings.value.startTime < 0) {
    alert('开始时间不能为负数')
    return
  }

  if (settings.value.endTime <= settings.value.startTime) {
    alert('结束时间必须大于开始时间')
    return
  }

  // 确保结束时间不超过视频时长
  if (settings.value.endTime > videoDuration.value) {
    settings.value.endTime = videoDuration.value
  }

  // 计算帧数和间隔
  const totalFrames = Math.floor((settings.value.endTime - settings.value.startTime) * settings.value.frameRate)
  const frameInterval = 1 / settings.value.frameRate

  if (totalFrames > 1000) {
    if (!confirm(`这将提取 ${totalFrames} 帧，可能需要较长时间。确定要继续吗？`)) {
      return
    }
  }

  // 重置状态
  frames.value = []
  progress.value = 0
  isExtracting.value = true
  statusText.value = '开始提取帧...'

  // 创建Canvas用于提取帧
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  let currentFrame = 0

  // 提取帧的递归函数
  const captureFrame = (time: number): Promise<void> => {
    return new Promise((resolve) => {
      if (time > settings.value.endTime || currentFrame >= totalFrames) {
        // 完成
        progress.value = 100
        statusText.value = `完成！共提取了 ${frames.value.length} 帧`
        isExtracting.value = false
        resolve()
        return
      }

      videoElement.value!.currentTime = time

      const onSeeked = () => {
        // 设置Canvas尺寸
        canvas.width = videoElement.value!.videoWidth
        canvas.height = videoElement.value!.videoHeight

        // 绘制当前帧到Canvas
        ctx.drawImage(videoElement.value!, 0, 0, canvas.width, canvas.height)

        // 将Canvas转为Data URL
        const dataURL = canvas.toDataURL('image/jpeg', settings.value.quality)

        // 创建帧对象
        const frame: Frame = {
          time: videoElement.value!.currentTime,
          dataURL: dataURL
        }

        frames.value.push(frame)

        // 更新进度
        currentFrame++
        progress.value = Math.min((currentFrame / totalFrames) * 100, 100)
        statusText.value = `提取中: ${currentFrame}/${totalFrames} 帧 (${time.toFixed(1)}s)`

        // 移除事件监听器
        videoElement.value!.removeEventListener('seeked', onSeeked)

        // 捕获下一帧
        const nextTime = settings.value.startTime + currentFrame * frameInterval
        setTimeout(() => {
          captureFrame(nextTime).then(resolve)
        }, 50) // 添加小延迟确保视频帧更新
      }

      videoElement.value!.addEventListener('seeked', onSeeked)
    })
  }

  // 开始提取第一帧
  await captureFrame(settings.value.startTime)
}

// 下载功能
const downloadFrame = (frame: Frame, frameNumber: number) => {
  const link = document.createElement('a')
  link.href = frame.dataURL
  link.download = `frame_${frameNumber}.jpg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const downloadAllFrames = async () => {
  if (frames.value.length === 0) return

  try {
    // 动态导入JSZip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // 将所有帧添加到zip文件中
    frames.value.forEach((frame, index) => {
      // 将dataURL转换为blob数据
      const base64Data = frame.dataURL.split(',')[1]
      if (base64Data) {
        const fileName = `frame_${String(index + 1).padStart(3, '0')}_${frame.time.toFixed(1)}s.jpg`
        zip.file(fileName, base64Data, { base64: true })
      }
    })

    // 生成zip文件
    statusText.value = '正在打包文件...'
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // 创建下载链接
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `video_frames_${new Date().getTime()}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理URL对象
    URL.revokeObjectURL(url)
    statusText.value = `完成！共下载了 ${frames.value.length} 帧`
  } catch (error) {
    console.error('下载失败:', error)
    alert('下载失败，请重试')
  }
}

// 重置功能
const resetExtractor = () => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }

  videoFile.value = null
  videoUrl.value = ''
  videoDuration.value = 0
  frames.value = []
  progress.value = 0
  isExtracting.value = false
  statusText.value = '准备就绪'

  settings.value = {
    frameRate: 1,
    startTime: 0,
    endTime: 10,
    quality: 0.9
  }

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 组件卸载时清理
onUnmounted(() => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }
})
</script>

<style lang="scss" scoped>
.video-extractor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);

  .title-icon {
    font-size: 24px;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin: 0;
  }
}

// 上传区域样式
.upload-area {
  border: 3px dashed rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);

  &:hover,
  &.drag-over {
    border-color: rgba(102, 126, 234, 0.8);
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-2px);
  }

  .upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 20px;
    font-size: 0.9rem;
  }

  .upload-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }

    .btn-icon {
      font-size: 16px;
    }
  }
}

// 设置面板样式
.settings-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.setting-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 500;
    color: white;
    font-size: 0.9rem;

    .setting-icon {
      font-size: 16px;
    }
  }

  .setting-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.3);
    color: white;
    font-size: 0.9rem;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

// 操作按钮样式
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 120px;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;

  .btn-icon {
    font-size: 16px;
  }

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
  }

  &:not(.primary):not(.secondary) {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
}

// 预览区域样式
.video-preview {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  overflow: hidden;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .video-player {
    max-width: 100%;
    max-height: 100%;
    border-radius: 12px;
  }

  .video-placeholder {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);

    .placeholder-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.7;
    }

    p {
      font-size: 0.9rem;
    }
  }
}

// 进度显示样式
.progress-section {
  margin-bottom: 24px;

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }
}

// 结果区域样式
.results-section {
  .no-results {
    text-align: center;
    padding: 40px 20px;
    color: rgba(255, 255, 255, 0.5);

    .no-results-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.7;
    }

    p {
      font-size: 0.9rem;
    }
  }

  .frames-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
    max-height: 400px;
    overflow-y: auto;
    padding: 4px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    }
  }

  .frame-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .frame-image {
      width: 100%;
      height: 80px;
      object-fit: cover;
      display: block;
    }

    .frame-info {
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;

      .frame-number {
        font-weight: 600;
        color: white;
      }

      .frame-time {
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .video-extractor {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 0 16px;
  }

  .upload-area {
    padding: 30px 16px;

    .upload-icon {
      font-size: 36px;
    }

    h4 {
      font-size: 1.1rem;
    }
  }

  .settings-panel {
    padding: 20px;
  }

  .action-buttons {
    flex-direction: column;

    .action-btn {
      min-width: auto;
    }
  }

  .video-preview {
    height: 200px;
  }

  .frames-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .frame-item .frame-image {
    height: 60px;
  }
}
</style>