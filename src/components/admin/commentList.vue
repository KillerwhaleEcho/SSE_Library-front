<template>
  <div class="comment-list">
    <el-card class="comment-card">
      <header class="comment-card__header">
        <div class="comment-card__search">
          <el-select
            v-model="searchKey"
            placeholder="请选择搜索类型"
            class="comment-card__search-select"
            clearable
            @clear="resetSearch"
          >
            <el-option label="姓名" value="name" />
            <el-option label="评论内容" value="content" />
            <el-option label="评论时间" value="time" />
          </el-select>
          <el-input
            v-model="searchInput"
            placeholder="请输入搜索内容"
            class="comment-card__search-input"
            clearable
            @clear="resetSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button type="primary" @click="handleSearch">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        <el-button
          class="comment-card__refresh"
          type="primary"
          :loading="loading"
          @click="fetchComments"
        >
          {{ TEXT.refresh }}
        </el-button>
      </header>

      <section
        class="comment-card__body"
        v-loading="loading"
        :element-loading-text="TEXT.loading"
      >
        <el-empty
          v-if="!loading && displayedComments.length === 0"
          :description="TEXT.empty"
        />
        <el-timeline v-else class="comment-timeline">
          <el-timeline-item
            v-for="comment in displayedComments"
            :key="comment.commentId"
            :timestamp="formatDateTime(comment.create_at)"
            placement="top"
          >
            <article class="comment-item">
              <header class="comment-item__meta">
                <div class="comment-item__user">
                  <el-avatar
                    :src="comment.commenter?.userAvatar"
                    :size="44"
                    class="comment-item__avatar"
                  >
                    {{ getAvatarFallback(comment.commenter?.username) }}
                  </el-avatar>
                  <div class="comment-item__info">
                    <span class="comment-item__name">
                      {{ comment.commenter?.username || TEXT.unknownUser }}
                    </span>
                    <span class="comment-item__id">
                      ID: {{ comment.commenter?.userId ?? "-" }}
                    </span>
                  </div>
                </div>

                <div class="comment-item__meta-right">
                  <el-tag
                    v-if="comment.document?.name"
                    size="small"
                    type="info"
                    class="comment-item__doc"
                  >
                    {{ comment.document.name }}
                  </el-tag>
                  <el-button
                    type="danger"
                    link
                    size="small"
                    @click="handleDelete(comment)"
                  >
                    {{ TEXT.delete }}
                  </el-button>
                </div>
              </header>

              <p class="comment-item__content">
                {{ comment.content }}
              </p>
            </article>
          </el-timeline-item>
        </el-timeline>
      </section>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteAdminComment, getAdminComments, type CommentItem } from '@/api/admin'
import { createMockComments } from './mockData'

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
const searchKey = ref<'name' | 'content' | 'time' | ''>('name')
const searchInput = ref('')
const appliedKeyword = ref('')

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
    comments.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    ElMessage.info(TEXT.mockHint)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  appliedKeyword.value = searchInput.value.trim()
}

const resetSearch = () => {
  searchInput.value = ''
  appliedKeyword.value = ''
}

const handleDelete = async (comment: CommentItem) => {
  const username = comment.commenter?.username || TEXT.unknownUser
  const documentId = comment.document?.documentId

  if (documentId === undefined || documentId === null) {
    ElMessage.error(TEXT.missingDocument)
    return
  }

  try {
    await ElMessageBox.confirm(TEXT.confirmMessage(username), TEXT.confirmTitle, {
      confirmButtonText: TEXT.delete,
      cancelButtonText: TEXT.cancel,
      type: 'warning',
    })

    await deleteAdminComment(documentId)

    comments.value = comments.value.filter((item) => item.commentId !== comment.commentId)
    ElMessage.success(TEXT.deleteSuccess)
  } catch (error) {
    if (error === 'cancel') {
      return
    }
    console.error('Failed to delete comment:', error)
    ElMessage.error(TEXT.deleteFailed)
  }
}

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

const getAvatarFallback = (username?: string) => {
  if (!username) {
    return 'U'
  }
  return username.trim().charAt(0).toUpperCase() || 'U'
}

onMounted(fetchComments)
</script>

<style scoped lang="css">
.comment-list {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.comment-card {
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  flex: 1;
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
  width: 140px;
}

.comment-card__search-input {
  flex: 1;
  min-width: 200px;
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
