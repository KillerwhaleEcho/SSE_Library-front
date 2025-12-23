<template>
  <div class="create-post-page">
    <topbar class="topbar"></topbar>

    <div class="post-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1>发布新帖子</h1>
        <p>分享你的知识和想法</p>
      </div>

      <!-- 发帖表单 -->
      <div class="post-form">
        <!-- 标题输入 -->
        <div class="form-group">
          <label class="form-label">帖子标题</label>
          <input v-model="postTitle" type="text" class="title-input" placeholder="请输入帖子标题..." maxlength="100">
          <div class="char-count">{{ postTitle.length }}/100</div>
        </div>

        <!-- 正文内容 -->
        <div class="form-group">
          <label class="form-label">正文内容</label>
          <textarea v-model="postContent" class="content-textarea" placeholder="请输入帖子内容..." rows="12"
            maxlength="5000"></textarea>
          <div class="char-count">{{ postContent.length }}/5000</div>
        </div>

        <!-- 关联文件 -->
        <div class="form-group">
          <div class="file-header">
            <label class="form-label">关联文件</label>
            <button class="select-file-btn" @click="showFileLibrary = true">
              从文件库选择
            </button>
          </div>

          <!-- 已选文件展示 -->
          <div class="selected-files" v-if="selectedFiles.length > 0">
            <h4>已选文件 ({{ selectedFiles.length }})</h4>
            <div class="file-grid">
              <div v-for="file in selectedFiles" :key="file.infoBrief.documentId" class="file-card">
                <div class="file-cover">
                  <img v-if="file.infoBrief.cover" :src="file.infoBrief.cover" :alt="file.infoBrief.name"
                    class="cover-image">
                  <div v-else class="cover-placeholder">
                    {{ file.infoBrief.name.substring(0, 2) }}
                  </div>
                </div>
                <div class="file-info">
                  <div class="file-title">{{ file.infoBrief.name }}</div>
                  <div class="file-meta">
                    <span class="file-author">{{ file.author }}</span>
                    <span class="file-type">{{ file.infoBrief.type }}</span>
                  </div>
                </div>
                <button class="remove-btn" @click="removeFile(file)">
                  ×
                </button>
              </div>
            </div>
          </div>

          <div v-else class="no-files">
            <p>暂未选择文件</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <button class="cancel-btn" @click="handleCancel">取消</button>
          <button class="submit-btn" @click="handleSubmit" :disabled="!canSubmit">
            发布帖子
          </button>
        </div>
      </div>
    </div>

    <!-- 文件库选择弹窗 -->
    <FileLibraryModal :visible="showFileLibrary" @update:visible="showFileLibrary = $event"
      :selected-files="selectedFiles" @files-selected="handleFilesSelected" />
  </div>
</template>

<script setup lang="ts">
import topbar from '@/layout/topbar.vue'
import FileLibraryModal from '@/components/FileLibraryModal.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Document } from '@/api/all.ts'
import * as allApi from '@/api/all.ts'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 表单数据
const postTitle = ref('')
const postContent = ref('')
const selectedFiles = ref<Document[]>([])
const showFileLibrary = ref(false)

// 计算属性：是否可以提交
const canSubmit = computed(() => {
  return postTitle.value.trim().length > 0 &&
    postContent.value.trim().length > 0
})

// 处理文件选择
const handleFilesSelected = (files: Document[]) => {
  selectedFiles.value = files
  showFileLibrary.value = false
}

// 移除文件
const removeFile = (fileToRemove: Document) => {
  selectedFiles.value = selectedFiles.value.filter(
    file => file.infoBrief.documentId !== fileToRemove.infoBrief.documentId
  )
}

// 提交帖子
const handleSubmit = async () => {
  if (!canSubmit.value) return

  try {
    // 获取当前用户ID（假设从本地存储获取）
    const userId = Number(localStorage.getItem('userId') || '0')

    if (!userId) {
      ElMessage.error('请先登录')
      return
    }

    // 构造提交数据
    const postData: allApi.UploadPostForm = {
      senderId: userId,
      title: postTitle.value.trim(),
      content: postContent.value.trim(),
    }

    // 添加可选字段
    // 如果有选中的文件，添加到 documents 字段
    if (selectedFiles.value.length > 0) {
      postData.documents = selectedFiles.value.map(file => ({
        documentId: file.infoBrief.documentId,
        cover: file.infoBrief.cover || '' // 使用文件的封面，如果没有则为空字符串
      }))
    }

    console.log('提交帖子数据:', postData)

    // 调用发帖API
    const response = await allApi.uploadPost(postData)

    console.log('帖子发布成功:', response)
    ElMessage.success('帖子发布成功！')

    // 跳转到帖子列表页或帖子详情页
    // 如果接口返回了帖子ID，可以跳转到帖子详情页
    if (response) {
      router.push(`/post/${response.data.postId}`)
    } else {
      router.push('/posts')
    }

  } catch (error: any) {
    console.error('发布帖子失败:', error)
    ElMessage.error(error.message || '发布失败，请重试')
  }
}

// 取消发布
const handleCancel = () => {
  if (postTitle.value || postContent.value || selectedFiles.value.length > 0) {
    // 如果有内容，确认是否放弃
    if (confirm('确定要放弃当前编辑的内容吗？')) {
      router.push('/posts')
    }
  } else {
    router.push('/posts')
  }
}
</script>

<style scoped>
.create-post-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.create-post-page::-webkit-scrollbar {
  display: none;
}

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background: #fff;
}

.post-container {
  width: 60%;
  margin-top: 80px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 40px;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px 0;
  border-bottom: 1px solid #e5e7eb;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.page-header p {
  font-size: 16px;
  color: #666;
}

/* 表单样式 */
.post-form {
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 30px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

/* 标题输入 */
.title-input {
  width: 95%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.3s;
}

.title-input:focus {
  border-color: #b994fe;
  box-shadow: 0 0 8px 3px rgba(185, 148, 254, 0.3);
  outline: none;
}

/* 内容文本域 */
.content-textarea {
  width: 95%;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s;
  font-family: inherit;
}

.content-textarea:focus {
  border-color: #b994fe;
  box-shadow: 0 0 8px 3px rgba(185, 148, 254, 0.3);
  outline: none;
}

/* 字符计数 */
.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

/* 文件选择头部 */
.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.select-file-btn {
  padding: 8px 16px;
  background-color: #b994fe;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.select-file-btn:hover {
  background-color: #aa81f7;
}

/* 已选文件区域 */
.selected-files h4 {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  font-weight: 500;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.file-card {
  position: relative;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
  border: 1px solid #e5e7eb;
}

.file-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.file-cover {
  width: 50px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #b994fe;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.file-author {
  color: #b994fe;
}

.file-type {
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}

.remove-btn:hover {
  background: #ff3742;
}

.no-files {
  text-align: center;
  padding: 40px;
  color: #999;
  background: #f8f9fa;
  border-radius: 6px;
  border: 2px dashed #e5e7eb;
}

/* 操作按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 12px 24px;
  background: white;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.cancel-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.submit-btn {
  padding: 12px 24px;
  background-color: #b994fe;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #aa81f7;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>