<template>
  <!-- 顶栏容器 -->
  <header class="app-header">
    <!-- 左侧标题 -->
    <div class="header-title">
      <h1>SSE-Library</h1>
    </div>
    
    <!-- 右侧用户区域 -->
    <div class="header-user">
      <!-- 个人主页图标按钮 -->
      <el-button 
        circle 
        type="text" 
        class="user-btn"
        @click="handleUserClick"
      >
        <User /> <!-- 这里使用组件形式 -->
      </el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';
import { User } from '@element-plus/icons-vue';

const handleUserClick = () => {
  // 处理点击事件
  console.log('用户图标被点击');
};
</script>
<style scoped>
.app-header {
  width: 100%;
  top: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  //position: sticky;
  z-index: 1000;
}

.header-title h1 {
  margin: 0;
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
  display: flex;
  align-items: center;
}

.user-btn {
  font-size: 1.2rem;
  color: #666;
  transition: all 0.3s;
}

.user-btn:hover {
  color: #4096ff;
  background-color: rgba(64, 150, 255, 0.1);
}
</style>
