<template>
  <div class="book-item">
    <!-- 图书封面 -->
    <img :src="document.infoBrief.cover || defaultCover" alt="book cover" class="book-cover" @error="handleImgError">

    <!-- 图书信息 -->
    <div class="book-info">
      <!-- 书名和简介 -->
      <h4 class="book-title">
        {{ document.infoBrief.name }}
      </h4>
      <p class="book-desc" v-if="document.introduction">
        {{ document.introduction }}
      </p>

      <!-- 作者 -->
      <div class="book-authors" v-if="document.author">
        <span>{{ document.author }}</span>
      </div>

      <!-- 统计信息（收藏、阅读量） -->
      <div class="book-stats">
        <div class="book-stat-item">
          <img src="@/assets/147_喜欢.png" alt="File Icon" style="width:25px; height:25px; margin-right:4px;" />
          <span>{{ document.infoBrief.collections || 0 }} 收藏</span>
        </div>
        <div class="book-stat-item">
          <img src="@/assets/Fire (火热).png" alt="File Icon" style="width:20px; height:20px; margin-right:4px;" />
          <span>{{ document.infoBrief.readCounts || 0 }} 阅读</span>
        </div>
      </div>

      <!-- 底部信息（年份、语言、文件信息、评分） -->
      <div class="book-meta">
        <span class="meta-item" v-if="document.createYear">
          年: {{ document.createYear }}
        </span>
        <span class="meta-item" v-if="document.infoBrief.category">
          分类: {{ document.infoBrief.category }}
        </span>
        <span class="meta-item" v-if="document.infoBrief.type">
          类型: {{ document.infoBrief.type }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import defaultCover from '@/assets/coverexp.png'; // 引入默认封面图
import * as allApi from '@/api/all.ts'

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
  gap: 16px;
  /* 封面与文字的间距 */
  padding: 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
  align-items: flex-start;
}

.book-item:hover {
  background-color: #f5f5f7;
  /*  hover 效果 */
}

/* 封面样式 */
.book-cover {
  width: 170px;
  object-fit: cover;
  /* 保持图片比例，裁剪多余部分 */
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* 轻微阴影增强质感 */
}

.book-info {
  position: relative;
  width: calc(100% - 170px - 16px);
  height: 100%;
  min-width: 0;
  /* 防止内容溢出 */
}

.book-title {
  margin: 0 0 8px 0;
  font-size: 25px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.book-desc {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /* 最多显示2行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-authors {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #409eff;
  /* 作者名蓝色 */
}

.book-stats {
  position: absolute;
  bottom: 0;
  display: flex;
  gap: 16px;
  margin-bottom: 0;
}

.book-stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;

  .el-icon {
    font-size: 14px;
  }
}

.book-meta {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  color: #888;
  margin-bottom: 0;
  justify-content: flex-end;
}

.meta-item::after {
  content: "|";
  margin-left: 20px;
  color: #ddd;
}

.meta-item:last-child::after {
  content: none;
}

.book-rating {
  margin-left: auto;

  /* 评分靠右 */
  .el-rate {
    --el-rate-icon-size: 14px;
  }
}
</style>