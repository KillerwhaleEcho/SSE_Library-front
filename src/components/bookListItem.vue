<template>
  <div class="book-item">
    <!-- 图书封面 -->
    <img 
      :src="document?.cover || defaultCover" 
      alt="book cover" 
      class="book-cover"
      @error="handleImgError"
    >
    <!-- 图书信息 -->
    <div class="book-info">
      <h4 class="book-title">{{ document?.name }}</h4>
      <div class="book-stats">
        <div class="book-count">
            <el-icon><OfficeBuilding /></el-icon>
            {{ document?.collections }}
        </div>
        <div class="book-count">
            <el-icon><OfficeBuilding /></el-icon>
            {{ document?.readCounts }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import defaultCover from '@/assets/coverexp.png'; // 引入默认封面图
import * as allApi from 'C:/Users/Echo/Desktop/SSE_Library/front/src/api/all.ts'

// 接收父组件传入的图书数据
const props = defineProps<{
  document: allApi.Document;
}>();

// 封面图加载失败时使用默认图
const handleImgError = (e: Event) => {
  (e.target as HTMLImageElement).src = defaultCover;
};
</script>

<style scoped>
.book-item {
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  gap: 16px; /* 封面与文字的间距 */
  padding: 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.book-item:hover {
  background-color: #f5f5f7; /*  hover 效果 */
}

/* 封面样式 */
.book-cover {
  width: 180px;
  object-fit: cover; /* 保持图片比例，裁剪多余部分 */
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影增强质感 */
}

/* 图书信息区 */
.book-info {
  flex: 1; /* 占满剩余空间 */
  min-width: 0; /* 解决文字过长溢出问题 */
}

.book-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap; /* 标题不换行 */
  overflow: hidden;
  text-overflow: ellipsis; /* 超出部分显示省略号 */
}

/* 统计信息 */
.book-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.book-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>