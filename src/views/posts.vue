<template>
  <div class="posts-page">
    <topbar class="topbar" @open-upload-modal="showUploadModal = true"></topbar>

    <div class="posts-container">
      <!-- 搜索和排序区域 -->
      <div class="forum-controls">
        <div class="search-box">
          <input type="text" v-model="searchKey" placeholder="搜索帖子关键字...">
          <button class="search-btn" @click="getPosts">搜索</button>
        </div>
        
        <div class="sort-control">
          <span>排序方式：</span>
          <button 
            class="sort-btn" 
            :class="{ active: sortOrder === 'time' }" 
            @click="setSortOrder('time')"
          >按发布时间</button>
          <button 
            class="sort-btn" 
            :class="{ active: sortOrder === 'hot' }" 
            @click="setSortOrder('hot')"
          >按热度</button>
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

    <!-- 使用分离的组件 -->
    <CategoryDialog 
      :visible="showCategoryDialog"
      @update:visible="showCategoryDialog = $event"
      :all-categories="allCategories"
      :selected-category-name="selectedCategoryName"
      :selected-category-id="selectedCategoryId"
      @category-selected="onCategorySelected"
      @reset-category="resetCategory"
      @category-added="handleCategoryAdded"
    />

    <UploadModal 
      v-model:visible="showUploadModal"
      :selected-category-name="selectedUploadCategoryName"
      :selected-category-id="selectedCategoryId"
      @open-category-dialog="showCategoryDialog = true"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import topbar from '@/layout/topbar.vue'
import PostItem from '@/components/postItem.vue'
import CategoryDialog from '@/components/CategoryDialog.vue'
import UploadModal from '@/components/UploadModal.vue'
import { onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import * as allApi from '@/api/all.ts'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 帖子相关数据
const posts = ref<allApi.Post[]>([])
const searchKey = ref<string>('')
const sortOrder = ref<"time" | "hot">("time")

// 弹窗控制
const showCategoryDialog = ref(false)
const showUploadModal = ref(false)

// 分类相关数据
const allCategories = ref<allApi.Category[]>([])
const selectedCategoryName = ref<string | null>(null)
const selectedCategoryId = ref<number | null>(null)
const selectedUploadCategoryName = ref<string | null>(null)

// 设置排序方式
const setSortOrder = (order: "time" | "hot") => {
  sortOrder.value = order
  getPosts()
}

// 获取帖子列表
const getPosts = async () => {
  try {
    const response = await allApi.getPosts(searchKey.value, sortOrder.value)
    if (response.data) {
      posts.value = response.data 
    } else {
      posts.value = []
      console.warn('获取帖子数据格式不正确')
    }
    return posts.value
  } catch (error) {
    console.error('获取帖子失败:', error)
    posts.value = []
    throw error
  }
}

// 帖子点击事件
const onPostSelected = (post: allApi.Post) => {
  console.log('选中的帖子:', post)
  router.push('/post/' + post.postId)
}

// 分类相关方法
const onCategorySelected = (selected: allApi.Category) => {
  console.log('选中的分类：', selected) 
  showCategoryDialog.value = false
  selectedCategoryId.value = selected.id
  
  if (showUploadModal.value === false) {
    // 如果在搜索场景下选择分类
    selectedCategoryName.value = selected.name
  } else {
    // 如果在上传场景下选择分类
    selectedUploadCategoryName.value = selected.name
  }
}

// 重置分类
const resetCategory = () => {
  selectedCategoryName.value = null
  selectedUploadCategoryName.value = null
  selectedCategoryId.value = null
}

// 上传成功处理
const handleUploadSuccess = () => {
  console.log('上传成功，可以刷新数据')
  // 可以在这里刷新帖子列表或执行其他操作
  getPosts()
}

// 获取所有分类
const getAllCategories = async () => {
  try {
    const response = await allApi.getAllCategories()
    if (response.data) {
      allCategories.value = response.data
    } else {
      allCategories.value = []
      console.warn('获取分类数据格式不正确')
    }
    return allCategories.value
  } catch (error) {
    console.error('获取所有分类失败:', error)
    allCategories.value = []
    throw error
  }
}

const handleCategoryAdded = async () => {
  console.log('分类添加成功，重新加载分类数据');
  
  try {
    await getAllCategories();
    
    ElMessage.success('分类数据已更新');
  } catch (error) {
    console.error('刷新分类数据失败:', error);
    ElMessage.error('刷新数据失败');
  }
};

onMounted(async () => {
  getPosts()
  getAllCategories() // 初始化时加载分类数据
})
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
  color: #666;
}

.sort-btn.active {
  background-color: #b994fe;
  color: white;
  border-color: #b994fe;
}

.sort-btn:hover:not(.active) {
  background-color: #f0f0f0;
  border-color: #b994fe;
}

/* 帖子列表样式 */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>