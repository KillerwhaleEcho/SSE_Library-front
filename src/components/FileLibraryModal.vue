<template>
  <el-dialog 
    :model-value="visible" 
    @update:model-value="$emit('update:visible', $event)"
    title="选择关联文件" 
    width="900px"
    class="file-library-modal"
    :modal="false"
    append-to-body
    :z-index="1000"
  >
    <!-- 搜索和筛选区域 -->
    <div class="modal-controls">
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜索文件名称、作者、关键词..."
          class="search-input"
          @keyup.enter="handleSearch"
        >
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>
      
      <div class="filter-controls">
        <el-select v-model="filterType" placeholder="文件类型" class="filter-select" size="large">
          <el-option label="全部" value=""></el-option>
          <el-option label="书籍" value="book"></el-option>
          <el-option label="文件" value="file"></el-option>
          <el-option label="视频" value="video"></el-option>
        </el-select>
        
        <el-select v-model="filterCategoryId" placeholder="分类" class="filter-select" size="large">
          <el-option label="全部" value=""></el-option>
          <el-option 
            v-for="category in categories" 
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="file-list-container">
      <div class="file-list">
        <div 
          v-for="file in fileList" 
          :key="getFileKey(file)"
          class="file-item"
          :class="{ 'selected': isFileSelected(file) }"
          @click="toggleFileSelection(file)"
        >
          <div class="file-checkbox">
            <div class="checkbox" :class="{ 'checked': isFileSelected(file) }">
              ✓
            </div>
          </div>
          
          <div class="file-cover">
            <img 
              v-if="file?.cover" 
              :src="file.cover" 
              :alt="getFileTitle(file)"
              class="cover-image"
            >
            <div v-else class="cover-placeholder">
              {{ getFileInitials(file) }}
            </div>
          </div>
          
          <div class="file-details">
            <div class="file-title">{{ getFileTitle(file) }}</div>
            <div class="file-author">{{ getFileAuthor(file) }}</div>
            <div class="file-meta">
              <span class="file-type">{{ getFileType(file) }}</span>
              <span class="file-year" v-if="file?.createYear">
                {{ file.createYear }}年
              </span>
            </div>
            <div class="file-tags" v-if="file?.tags">
              <span 
                v-for="tag in getFileTags(file)" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="fileList.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p>暂无文件</p>
        <p class="empty-tip">尝试调整搜索条件</p>
      </div>
    </div>

    <!-- 已选文件统计 -->
    <div class="selection-info" v-if="tempSelectedFiles.length > 0">
      <div class="selected-count">
        已选择 {{ tempSelectedFiles.length }} 个文件
      </div>
      <div class="selected-preview">
        <div 
          v-for="file in tempSelectedFiles.slice(0, 3)" 
          :key="getFileKey(file)"
          class="preview-item"
        >
          <img 
            v-if="file.cover" 
            :src="file.cover" 
            :alt="getFileTitle(file)"
            class="preview-cover"
          >
          <div v-else class="preview-placeholder">
            {{ getFileInitials(file) }}
          </div>
        </div>
        <div v-if="tempSelectedFiles.length > 3" class="more-files">
          +{{ tempSelectedFiles.length - 3 }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <button class="cancel-btn" @click="handleCancel">取消</button>
        <button class="confirm-btn" @click="handleConfirm" :disabled="tempSelectedFiles.length === 0">
          确认选择 ({{ tempSelectedFiles.length }})
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import * as allApi from '@/api/all.ts'
import type { Document, Category } from '@/api/all.ts'

interface Props {
  visible: boolean
  selectedFiles: Document[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'files-selected': [files: Document[]]
}>()

// 数据
const fileList = ref<Document[]>([])
const categories = ref<Category[]>([])
const searchKeyword = ref('')
const filterType = ref<'book' | 'file' | 'video' | 'null'>('null')
const filterCategoryId = ref<number | null>(null)
const tempSelectedFiles = ref<Document[]>([])

// 初始化临时选择
watch(() => props.visible, (newVal) => {
  if (newVal) {
    tempSelectedFiles.value = [...props.selectedFiles]
  }
})

// 安全的文件操作方法
const getFileKey = (file: Document) => {
  return file?.infoBrief?.documentId || Math.random().toString()
}

const getFileTitle = (file: Document) => {
  return file?.infoBrief?.name || '未知文件'
}

const getFileAuthor = (file: Document) => {
  return file.author || '未知作者'
}

const getFileType = (file: Document) => {
  const type = file?.infoBrief?.type
  const typeMap: { [key: string]: string } = {
    'book': '书籍',
    'file': '文件',
    'video': '视频'
  }
  return typeMap[type] || type || '未知类型'
}

const getFileInitials = (file: Document) => {
  const title = getFileTitle(file)
  return title.substring(0, 2) || '文'
}

const getFileTags = (file: Document) => {
  const tags = file?.tags
  if (!tags) return []

  // 如果 tags 已经是数组，确保每项是 string 并去除空项
  if (Array.isArray(tags)) {
    return tags
      .map(t => (typeof t === 'string' ? t.trim() : String(t)))
      .filter(t => t)
  }

  // 兜底返回空数组
  return []
}

// 文件选择相关方法
const isFileSelected = (file: Document) => {
  if (!file?.infoBrief?.documentId) return false
  return tempSelectedFiles.value.some(
    selectedFile => selectedFile?.infoBrief?.documentId === file.infoBrief.documentId
  )
}

const toggleFileSelection = (file: Document) => {
  if (!file?.infoBrief?.documentId) return
  
  const isSelected = isFileSelected(file)
  if (isSelected) {
    tempSelectedFiles.value = tempSelectedFiles.value.filter(
      selectedFile => selectedFile?.infoBrief?.documentId !== file.infoBrief.documentId
    )
  } else {
    tempSelectedFiles.value.push(file)
  }
}

const handleSearch = async () => {
  console.log('搜索关键词:', searchKeyword.value)
  try {
    const response = await allApi.searchBooksOrFiles(
      filterType.value,
      filterCategoryId.value,
      '',
      '',
      searchKeyword.value.trim()
    )
    console.log('搜索关联资料响应:', response)
    if (response.data) {
      fileList.value = response.data 
    } else {
      fileList.value = []
      console.warn('获取关联搜索资料数据格式不正确')
    }
    return fileList.value
  } catch (error) {
    console.error('获取关联搜索资料失败:', error)
    fileList.value = []
    throw error
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}

const handleConfirm = () => {
  // 过滤掉无效的文件
  const validFiles = tempSelectedFiles.value.filter(file => file?.infoBrief?.documentId)
  emit('files-selected', validFiles)
  emit('update:visible', false)
}

// 加载数据
const loadFiles = async () => {
  try {
    const response = await allApi.getHotDocuments()
    if (response.data) {
      console.log('获取关联文件数据成功', response.data)
      fileList.value = response.data.filter(file => file?.infoBrief) // 过滤掉没有 infoBrief 的文件
    }
  } catch (error) {
    console.error('加载文件失败:', error)
    fileList.value = []
  }
}

const loadCategories = async () => {
  try {
    const response = await allApi.getAllCategories()
    if (response.data) {
      console.log('获取关联分类数据成功', response.data)
      categories.value = response.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    categories.value = []
  }
}

onMounted(() => {
  loadFiles()
  loadCategories()
})
</script>

<style scoped>
/* 样式保持不变，与之前相同 */
.file-library-modal {
  :deep(.el-dialog__header) {
    border-bottom: 1px solid #e5e7eb;
    padding: 20px 24px;
    margin: 0;
  }
  
  :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  :deep(.el-dialog__body) {
    padding: 20px 24px;
  }
  
  :deep(.el-dialog__footer) {
    border-top: 1px solid #e5e7eb;
    padding: 16px 24px;
  }
}

.modal-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: flex-end;
}

.search-box {
  display: flex;
  flex: 1;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 6px 0 0 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #b994fe;
  outline: none;
  box-shadow: 0 0 8px 3px rgba(185, 148, 254, 0.3);
}

.search-btn {
  padding: 10px 20px;
  background-color: #b994fe;
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-btn:hover {
  background-color: #aa81f7;
}

.filter-controls {
  height: 100%;
  display: flex;
  gap: 12px;
}

.filter-select {
  width: 120px;
}

:deep(.filter-select .el-select__wrapper) {
  border-radius: 6px;
}

.file-list-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.file-list {
  display: flex;
  flex-direction: column;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
  gap: 12px;
}

.file-item:hover {
  background-color: #f8f9fa;
}

.file-item.selected {
  background-color: #f0eaff;
  border-left: 3px solid #b994fe;
}

.file-item:last-child {
  border-bottom: none;
}

.file-checkbox {
  flex-shrink: 0;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: transparent;
  transition: all 0.3s;
}

.checkbox.checked {
  background-color: #b994fe;
  border-color: #b994fe;
  color: white;
}

.file-cover {
  width: 60px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
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
  font-size: 16px;
  font-weight: 500;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.4;
}

.file-author {
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
}

.file-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
}

.file-type {
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.file-year {
  font-size: 12px;
  color: #999;
}

.file-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-tip {
  font-size: 14px;
  margin-top: 8px;
}

.selection-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
}

.selected-count {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.selected-preview {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-item {
  width: 40px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.preview-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #b994fe;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.more-files {
  font-size: 12px;
  color: #666;
  padding: 0 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  padding: 10px 20px;
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

.confirm-btn {
  padding: 10px 20px;
  background-color: #b994fe;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #aa81f7;
}

.confirm-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.file-list-container::-webkit-scrollbar {
  width: 6px;
}

.file-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.file-list-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.file-list-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>