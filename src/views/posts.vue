<template>
  <div class="posts-page">
    <topbar class="topbar"></topbar>

    <div class="posts-container">
      <!-- 搜索和排序区域 -->
      <div class="forum-controls">
        <div class="search-box">
          <input type="text" v-model="searchKey" placeholder="搜索帖子关键字...">
          <button class="search-btn" @click="getPosts">搜索</button>
        </div>
        
        <div class="sort-control">
          <span>排序方式：</span>
          <button class="sort-btn active" data-sort="time" @click="sortOrder = 'time'; getPosts()">按发布时间</button>
          <button class="sort-btn" data-sort="hot" @click="sortOrder = 'hot'; getPosts()">按热度</button>
        </div>
      </div>
      
      <!-- 帖子列表 -->
      <div class="posts-list">
        <PostItem 
          v-for="post in posts" 
          :key="post.postId" 
          :post="post"
          @click="onPostSelected(post)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import topbar from '@/layout/topbar.vue'
import BookItem from '@/components/bookItem.vue';
import PostItem from '@/components/postItem.vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router'
import * as allApi from '@/api/all.ts'

const router = useRouter()
const posts = ref<allApi.Post[]>([])
const searchKey = ref<string>('');
const sortOrder = ref<"time" | "hot">("time");
const showCategoryDialog = ref(false)
const showUploadModal = ref(false)

const getPosts = async () => {
  try {

    const response = await allApi.getPosts(searchKey.value, sortOrder.value);
    if (response.data) {
      posts.value = response.data; 
    } else {
      posts.value = [];
      console.warn('获取热门资料数据格式不正确');
    }
    return posts.value;
  } catch (error) {
    console.error('获取热门资料失败:', error);
    posts.value = [];
    throw error;
  }
};

const onPostSelected = (post: allApi.Post) => {
  console.log('选中的帖子:', post);
  router.push('/post/' + post.postId);
};

onMounted(async () => {
  getPosts();
});
</script>

<style scoped>
.posts-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column; /* 子元素沿垂直方向排列 */
  justify-content: flex-start; /* 竖直方向从顶部开始排列（默认） */
  align-items: center; /* 水平方向居中对齐 */
  overflow-y: auto; /* 允许垂直滚动 */
  scrollbar-width: none; /* Firefox：隐藏滚动条 */
  -ms-overflow-style: none; /* IE/Edge：隐藏滚动条 */
}

.posts-page::-webkit-scrollbar {
  display: none; 
}

.posts-container {
  width: 60%; 
  margin-left: auto; /* 左侧自动外边距 */
  margin-right: auto; /* 右侧自动外边距 */
}

/* 搜索和排序控制区 */
.forum-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.search-box {
  display: flex;
  flex: 0 0 60%;
}

.search-box input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
}

.search-btn {
  padding: 10px 20px;
  background-color: #b994fe;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-btn:hover {
  background-color: #aa81f7;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-btn {
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.sort-btn.active {
  background-color: #b994fe;
  color: white;
  border-color: #b994fe;
}

/* 帖子列表样式 */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>