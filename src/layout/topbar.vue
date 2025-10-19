<template>
  <!-- 顶栏容器 -->
  <header class="app-header">
    <!-- 左侧标题 -->
    <div class="header-title">
      <h1>SSE-Library</h1>
    </div>
    
    <!-- 右侧用户区域 -->
    <div class="header-user">
      <div class="icon-container" data-tooltip="上传文件">
        <img src="@/assets/147_添加.png" alt="上传文件" @click="handleUploadClick">
      </div>
      <router-link to="/user" class="icon-container" data-tooltip="个人主页">
        <img src="@/assets/147_联系人.png" alt="个人主页">
      </router-link>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';
import { User } from '@element-plus/icons-vue';
import { defineEmits } from 'vue';

// 定义事件发射器，用于向父组件发送事件
const emit = defineEmits(['open-upload-modal']);

// 点击图标时触发事件
const handleUploadClick = () => {
  emit('open-upload-modal'); // 触发事件，通知父组件打开弹窗
};
</script>

<style scoped>
.app-header {
  width: 100%;
  top: 0;
  left: 0;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 8px hsla(0, 0%, 0%, 0.10);
  position: sticky;
  z-index: 10000;
}

.header-title h1 {
  margin-left: 20px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #b994fe;
  cursor: pointer;
  transition: color 0.3s;
}

.header-title h1:hover {
  color: #916ad9ff; 
}

.header-user {
  padding: 10px;
  display: flex;
  align-items: center;
}

.icon-container {
  position: relative;
}

.icon-container::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -30px; /* 控制文字出现的位置 */
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(185,148,254, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
}

.icon-container:hover::after {
  opacity: 1;
}

.icon-container img{
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: filter 0.3s ease-in-out, opacity 0.3s ease-in-out;
}
/* 悬停时放大效果 */
.icon-container img:hover{
  transform: scale(1.1);
}
</style>
