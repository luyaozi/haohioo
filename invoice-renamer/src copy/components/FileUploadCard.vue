<template>
  <el-card class="upload-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>📄 上传发票文件</span>
      </div>
    </template>

    <el-upload
      ref="uploadRef"
      class="upload-dragger"
      drag
      :auto-upload="false"
      :multiple="true"
      accept=".pdf"
      :on-change="handleFileChange"
      :file-list="fileList"
      :show-file-list="false"
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">
        将PDF发票文件拖到此处，或<em>点击上传</em>
        <div class="el-upload__tip">只能上传PDF格式的发票文件，支持多选</div>
      </div>
    </el-upload>
  </el-card>
</template>

<script>
import { ref } from "vue"
import { UploadFilled } from "@element-plus/icons-vue"

export default {
  name: "FileUploadCard",
  components: {
    UploadFilled,
  },
  props: {
    fileList: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["file-change"],
  setup(props, { emit }) {
    const uploadRef = ref()

    const handleFileChange = (file, fileList) => {
      emit("file-change", file, fileList)
    }

    return {
      uploadRef,
      handleFileChange,
    }
  },
}
</script>

<style scoped>
/* 卡片容器 - 现代化C端设计 */
.upload-card {
  margin-bottom: 24px;
  border-radius: 20px;
  border: none;
  box-shadow: 0 8px 40px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.upload-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.upload-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(255, 255, 255, 0.15);
}

.upload-card :deep(.el-card__header) {
  padding: calc(var(--el-card-padding) - 2px) var(--el-card-padding) 0;
}

/* 卡片头部 - 简约现代设计 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 20px;
  color: white;
  padding: 28px 32px;
  background: linear-gradient(
    135deg,
    rgba(103, 126, 234, 0.9) 0%,
    rgba(118, 75, 162, 0.9) 100%
  );
  margin: -20px -20px 0 -20px;
  position: relative;
  backdrop-filter: blur(10px);
}

.card-header::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
}

/* 上传区域 - C端友好设计 */
.upload-dragger {
  width: 100%;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  padding: 40px 20px;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);
}

.upload-dragger::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(99, 102, 241, 0.1),
    transparent
  );
  transition: left 0.8s ease;
}

.upload-dragger:hover::before {
  left: 100%;
}

.upload-dragger:hover {
  border-color: #4f46e5;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(99, 102, 241, 0.2);
}

.upload-dragger .el-icon--upload {
  font-size: 56px;
  color: #6366f1;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.upload-dragger:hover .el-icon--upload {
  color: #4f46e5;
  transform: scale(1.1);
}

.upload-dragger .el-upload__text {
  color: #374151;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.6;
}

.upload-dragger .el-upload__text em {
  color: #6366f1;
  font-style: normal;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.upload-dragger .el-upload__tip {
  color: #6b7280;
  font-size: 14px;
  margin-top: 8px;
  font-weight: 400;
}
</style>
