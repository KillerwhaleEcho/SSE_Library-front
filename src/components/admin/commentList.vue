<template>
  <div class="comment-list">
    <el-card class="comment-card">
      <div class="comment-card__header">
        <h3 class="comment-card__title">{{ TEXT.title }}</h3>
        <el-button
          size="small"
          type="primary"
          :loading="loading"
          @click="fetchComments"
        >
          {{ TEXT.refresh }}
        </el-button>
      </div>

      <div
        class="comment-card__body"
        v-loading="loading"
        :element-loading-text="TEXT.loading"
      >
        <el-empty
          v-if="!loading && sortedComments.length === 0"
          :description="TEXT.empty"
        />
        <el-timeline v-else class="comment-timeline">
          <el-timeline-item
            v-for="comment in sortedComments"
            :key="comment.comment_id"
            :timestamp="formatDateTime(comment.created_at)"
            placement="top"
          >
            <div class="comment-item">
              <div class="comment-item__meta">
                <div class="comment-item__user">
                  <el-avatar
                    :src="comment.commenter?.userAvatar"
                    :size="46"
                    class="comment-item__avatar"
                  >
                    {{ getAvatarFallback(comment.commenter?.username) }}
                  </el-avatar>
                  <div class="comment-item__info">
                    <span class="comment-item__name">
                      {{ comment.commenter?.username || TEXT.unknownUser }}
                    </span>
                    <span class="comment-item__id">
                      ID: {{ comment.commenter?.userId ?? '-' }}
                    </span>
                  </div>
                </div>

                <div class="comment-item__spacer" />

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
              <div class="comment-item__content">
                {{ comment.content }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '../../utils/service'

interface CommentUser {
  userId: number
  username: string
  userAvatar: string
  status: string
  createTime: string
  email: string
  role: string
}

interface CommentDocument {
  name: string
  document_id: number
  type: string
  uploadTime: string
  status: string
  category: string
  collections: number
  readCounts: number
  URL: string
}

interface CommentItem {
  comment_id: number
  commenter: CommentUser | null
  document: CommentDocument | null
  created_at: string
  content: string
}

interface CommentResponse {
  code: number
  message: string
  data: CommentItem[]
}

interface ActionResponse {
  code: number
  message: string
}

const TEXT = {
  title: '评论管理',
  refresh: '刷新',
  loading: '正在加载评论...',
  empty: '暂无评论',
  delete: '删除',
  confirmTitle: '删除确认',
  confirmMessage: (name: string) =>
    `确认删除来自 ${name || '该用户'} 的评论吗？`,
  cancel: '取消',
  deleteSuccess: '评论已删除',
  loadFailed: '获取评论失败，请稍后重试',
  deleteFailed: '删除评论失败，请稍后重试',
  missingDocument: '缺少文档信息，无法删除评论',
  unknownUser: '匿名用户',
  mockHint: '当前展示的是示例评论数据，后端接入后将自动更新',
}

const createMockComments = (): CommentItem[] => [
  {
    comment_id: 1,
    commenter: {
      userId: 301,
      username: 'Alice',
      userAvatar: 'https://avatars.dicebear.com/api/initials/Alice.svg',
      status: 'active',
      createTime: '2024-03-12 09:21:00',
      email: 'alice@example.com',
      role: 'reader',
    },
    document: {
      name: '现代教育技术研究报告',
      document_id: 9001,
      type: 'pdf',
      uploadTime: '2024-03-10 18:32:00',
      status: 'published',
      category: '教育学',
      collections: 87,
      readCounts: 423,
      URL: '#',
    },
    created_at: '2024-03-18 10:15:26',
    content: '这份报告的数据分析部分非常详细，对课堂教学设计提供了很多启发。',
  },
  {
    comment_id: 2,
    commenter: {
      userId: 302,
      username: 'Bob',
      userAvatar: 'https://avatars.dicebear.com/api/initials/Bob.svg',
      status: 'active',
      createTime: '2024-01-08 14:07:00',
      email: 'bob@example.com',
      role: 'reader',
    },
    document: {
      name: '人工智能导论课程讲义',
      document_id: 9002,
      type: 'ppt',
      uploadTime: '2024-02-26 11:48:00',
      status: 'published',
      category: '计算机科学',
      collections: 132,
      readCounts: 1024,
      URL: '#',
    },
    created_at: '2024-03-19 16:42:03',
    content: '整理得很系统，特别是第二章机器学习部分的思维导图，便于理解。',
  },
  {
    comment_id: 3,
    commenter: {
      userId: 303,
      username: 'Celia',
      userAvatar: 'https://avatars.dicebear.com/api/initials/Celia.svg',
      status: 'active',
      createTime: '2023-12-21 20:12:00',
      email: 'celia@example.com',
      role: 'reader',
    },
    document: {
      name: '高等数学习题精解',
      document_id: 9003,
      type: 'pdf',
      uploadTime: '2024-03-15 09:05:00',
      status: 'published',
      category: '数学',
      collections: 65,
      readCounts: 358,
      URL: '#',
    },
    created_at: '2024-03-20 08:27:51',
    content: '答案步骤写得很清晰，建议下一版能增加一些易错点小贴士。',
  },
]

const loading = ref(false)
const comments = ref<CommentItem[]>(createMockComments())

const sortedComments = computed(() => {
  return [...comments.value].sort((a, b) => {
    const timeA = Date.parse(a.created_at)
    const timeB = Date.parse(b.created_at)
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return 0
    }
    return timeA - timeB
  })
})

const fetchComments = async () => {
  loading.value = true
  try {
    const res = await service.get<CommentResponse>('/admin/comments')
    comments.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    ElMessage.info(TEXT.mockHint)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (comment: CommentItem) => {
  const username = comment.commenter?.username || TEXT.unknownUser
  const documentId = comment.document?.document_id

  if (documentId === undefined || documentId === null) {
    ElMessage.error(TEXT.missingDocument)
    return
  }

  try {
    await ElMessageBox.confirm(
      TEXT.confirmMessage(username),
      TEXT.confirmTitle,
      {
        confirmButtonText: TEXT.delete,
        cancelButtonText: TEXT.cancel,
        type: 'warning',
      },
    )

    await service.delete<ActionResponse>('/admin/comment', {
      params: {
        document_id: documentId,
      },
    })

    comments.value = comments.value.filter(
      (item) => item.comment_id !== comment.comment_id,
    )

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
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
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
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.comment-card {
  border-radius: 10px;
  background: #fff;
  border: none;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;

  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
}

.comment-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.comment-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #311a45;
}

.comment-card__body {
  flex: 1;
  min-height: 0;
  position: relative;
}

.comment-timeline {
  padding: 0 6px;
}

.comment-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.comment-item__user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-item__avatar {
  background: rgba(255, 166, 183, 0.2);
  color: #5b294a;
  font-weight: 600;
}

.comment-item__info {
  display: flex;
  flex-direction: row;
  gap: 4px;
}

.comment-item__name {
  font-weight: 600;
  color: #5b294a;
}

.comment-item__id {
    margin-top: 1px;
  font-size: 12px;
  color: #909399;
}

.comment-item__spacer {
  flex: 1;
}

.comment-item__doc {
  background: rgba(160, 123, 200, 0.12);
  border: none;
  color: #6f3dc1;
}

.comment-item__content {
  padding: 14px 16px;
  background: rgba(255, 166, 183, 0.12);
  border-radius: 8px;
  color: #4a3b5c;
  line-height: 1.6;
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
