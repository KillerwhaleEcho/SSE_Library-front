<template>
  <div class="comment-list">
    <el-card class="comment-card">
      <header class="comment-card__header">
        <div class="comment-card__search">
          <el-select v-model="searchKey" placeholder="请选择搜索类型" class="comment-card__search-select" size="large">
            <el-option label="姓名" value="name" />
            <el-option label="评论内容" value="content" />
            <el-option label="评论时间" value="time" />
          </el-select>
          <!-- 搜索内容：根据搜索类型切换输入/日期选择 -->
          <el-input v-if="searchKey !== 'time'" v-model="searchInput" placeholder="请输入搜索内容"
            class="comment-card__search-input" clearable @clear="resetSearch" @keyup.enter="handleSearch" size="large">
            <template #append>
              <el-button @click="handleSearch">
                搜索
              </el-button>
            </template>
          </el-input>

          <el-date-picker v-else v-model="searchDate" type="date" placeholder="请选择日期" class="comment-card__search-input"
            clearable format="YYYY-MM-DD" value-format="YYYY-MM-DD" @change="handleSearch" @clear="resetSearch"
            size="large" />
          <!-- format是ui展示出来的数据格式，value-format是v-model绑定数据的格式 -->

        </div>
        <el-button class="comment-card__refresh" type="primary" :loading="loading" @click="fetchComments">
          {{ TEXT.refresh }}
        </el-button>
      </header>
      <section class="comment-card__body" v-loading="loading" :element-loading-text="TEXT.loading">
        <el-empty v-if="!loading && displayedComments.length === 0" :description="TEXT.empty" />
<CommentSection :viewer="userInfo" :show-comment-user="true" :show-source-name="true">
</CommentSection>
        
      </section>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteAdminComment, getAdminComments, type CommentItem } from '@/api/admin'
import { createMockComments } from './mockData'
import { type UserBrief, getUserDetail } from '@/api/all'
import CommentSection from '../comments/CommentSection.vue'

const TEXT = {
  refresh: '刷新',
  loading: '正在加载评论...',
  empty: '暂无评论',
  delete: '删除',
  confirmTitle: '删除确认',
  confirmMessage: (name: string) => `确认删除来自 ${name || '该用户'} 的评论吗？`,
  cancel: '取消',
  deleteSuccess: '评论已删除',
  loadFailed: '获取评论失败，请稍后重试',
  deleteFailed: '删除评论失败，请稍后重试',
  missingDocument: '缺少文档信息，无法删除评论',
  unknownUser: '匿名用户',
  mockHint: '当前展示的是示例评论数据，后端接入后将自动更新',
} as const

const loading = ref(false)
const comments = ref<CommentItem[]>(createMockComments())
const searchKey = ref<'name' | 'content' | 'time' | ''>('')
const searchInput = ref('')
const searchDate = ref<string | null>('')
const appliedKeyword = ref('')
const userInfo = ref<UserBrief | null>()

const displayedComments = computed(() => {
  const keyword = appliedKeyword.value.trim().toLowerCase()
  const key = searchKey.value

  const sorted = [...comments.value].sort((a, b) => {
    const timeA = Date.parse(a.create_at)
    const timeB = Date.parse(b.create_at)
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return 0
    }
    return timeB - timeA
  })

  if (!keyword) {
    return sorted
  }

  const matchers: Record<typeof key, (item: CommentItem) => boolean> = {
    name: (item) => (item.commenter?.username ?? '').toLowerCase().includes(keyword),
    content: (item) => item.content.toLowerCase().includes(keyword),
    time: (item) => formatDateTime(item.create_at).toLowerCase().includes(keyword),
    //默认匹配类型 如果key=‘’就是下面这种情况
    '': (item) =>
      (item.commenter?.username ?? '').toLowerCase().includes(keyword) ||
      item.content.toLowerCase().includes(keyword) ||
      formatDateTime(item.create_at).toLowerCase().includes(keyword),
  }

  return sorted.filter(matchers[key])
})

const fetchComments = async () => {
  loading.value = true
  try {
    const res = await getAdminComments()
    comments.value =res.data
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    ElMessage.info(TEXT.mockHint)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchKey.value === 'time') {
    appliedKeyword.value = (searchDate.value || '').trim()
  } else {
    appliedKeyword.value = searchInput.value.trim()
  }
}

const resetSearch = () => {
  searchInput.value = ''
  searchDate.value = ''
  appliedKeyword.value = ''
}


// 切换搜索类型时重置输入，防止残留关键词/日期
watch(searchKey, () => {
  resetSearch()
})


const formatDateTime = (value: string) => {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return value || ''
  }

  const date = new Date(timestamp)
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}


const getUserId = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('userId')
}

const fetchUserInfo = async () => {
  const userId = getUserId()
  try {
    const { data } = await getUserDetail(userId as string)
    userInfo.value = data.userBrief
  } catch {
    ElMessage.error('获取用户数据失败')
  }
}

onMounted(() => {
  fetchUserInfo()
})

</script>

<style scoped lang="css">
.comment-list {
  padding: 0;
  display: flex;
  flex-direction: column;
  align-content: center;
}

.comment-card {
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}

:deep(.el-card.comment-card) {
  border: none;
  box-shadow: none;
}

.comment-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  border: none;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.comment-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.comment-card__search {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.comment-card__search-select {
  width: 150px;
}

.comment-card__search-input {
  width: 50%;
}


/* 让 el-date-picker 内部输入与普通输入同宽 */
.comment-card__search-input :deep(.el-input__wrapper) {
  width: 100%;
}

.comment-card__refresh {
  white-space: nowrap;
}

.comment-card__body {
  flex: 1;
  min-height: 0;
  position: relative;
}

.comment-timeline {
  padding: 0 4px;
  margin: 0;
}

.comment-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 166, 183, 0.12);
  border-radius: 10px;
  padding: 16px 18px;
}

.comment-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.comment-item__user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-item__avatar {
  background: rgba(255, 166, 183, 0.25);
  color: #5b294a;
  font-weight: 600;
}

.comment-item__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comment-item__name {
  font-weight: 600;
  color: #5b294a;
}

.comment-item__id {
  font-size: 12px;
  color: #909399;
}

.comment-item__meta-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-item__doc {
  background: rgba(160, 123, 200, 0.12);
  border: none;
  color: #6f3dc1;
}

.comment-item__content {
  margin: 0;
  color: #4a3b5c;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.el-timeline-item__timestamp) {
  color: #a07bc8;
  font-weight: 600;
}

:deep(.el-button.is-link) {
  color: #f56c6c;
}

:deep(.el-button.is-link:hover) {
  color: #d9534f;
}
</style>
