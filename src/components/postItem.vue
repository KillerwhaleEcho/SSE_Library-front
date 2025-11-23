<template>
  <div class="post-item">
    <div class="post-author">
      <img :src="post.senderAvatar" alt="用户头像" class="avatar">
      <div class="author-info">
        <div class="author-name">{{ post.senderName }}</div>
        <div class="post-time">{{ post.sendTime }}</div>
      </div>
    </div>
    
    <div class="post-body">
      <div class="post-content">
        <h3 class="post-title">{{ post.title }}</h3>
        <div class="post-excerpt">
          <p>{{ post.content }}</p>
        </div>
      </div>
      <img :src="defaultCover" alt="封面" class="post-cover"></img>
    </div>
    
    
    <div class="post-stats">
      <span class="stat-item"><i class="icon-comment"></i> {{ post.commentCount }} 评论</span>
      <span class="stat-item"><i class="icon-like"></i> {{ post.likeCount }} 点赞</span>
      <span class="stat-item">
        <img src="@/assets/Fire (火热).png" alt="Office Building Icon" style="width:18px; height:18px; margin-right:4px;vertical-align: bottom;" />
        {{ post.readCount }} 浏览</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as allApi from 'C:/Users/Echo/Desktop/SSE_Library/front/src/api/all.ts'

import defaultCover from '@/assets/coverexp.png'; // 引入默认封面图

// 接收父组件传入的图书数据
const props = defineProps<{
  post: allApi.Post;
}>();
</script>

<style scoped>
.post-item {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(185, 148, 254, 0.3);
  transition: box-shadow 0.3s;
}

.post-item:hover {
  box-shadow: 0 4px 8px rgba(185, 148, 254, 0.3);
}

/* 作者信息 */
.post-author {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 600;
  color: #333;
}

.post-time {
  font-size: 12px;
  color: #888;
}

.post-body {
  display: flex; /* 子元素水平排列 */
  gap: 20px; /* 子元素之间保留20px间距（可选，可删除） */
  justify-content: space-between; /* 关键！子元素分别靠左右两端放置 */
  align-items: center; /* 可选：子元素垂直居中对齐（按需添加） */
  width: 100%; /* 确保容器占满父级宽度，否则两端对齐效果不明显 */
}

.post-cover {
  width: 100px;
  object-fit: cover;
  border-radius: 6px;
}

/* 帖子内容 */
.post-title {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 18px;
}

.post-excerpt {
  color: #555;
  line-height: 1.6;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 限制显示2行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 帖子统计信息 */
.post-stats {
  display: flex;
  gap: 20px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #eee;
  color: #888;
  font-size: 14px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 图标样式模拟 */
.icon-comment::before { content: "💬"; }
.icon-like::before { content: "❤️"; }
.icon-view::before { content: "👁️"; }
</style>
