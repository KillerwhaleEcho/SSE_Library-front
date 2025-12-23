<!-- UploadModal.vue -->
<template>
  <el-dialog 
    :model-value="visible" 
    @update:model-value="$emit('update:visible', $event)"
    title="上传文件" 
    width="600px"
    class="upload-dialog"
    @close="resetForm"
    :modal="false"
    append-to-body
    :z-index="1000"
  >
    <el-form 
      ref="uploadFormRef" 
      :model="uploadForm" 
      label-width="100px"
      :rules="formRules"
    >
      <!-- 文件上传 -->
      <el-form-item label="要上传的文件" prop="file">
        <el-upload
          action="#"
          :on-change="handleFileChange"
          :auto-upload="false"
          accept=".pdf,.doc,.docx,.txt,.mp4"
          :show-file-list="false"
        >
          <el-button type="primary">点击上传文件</el-button>
        </el-upload>
        <div v-if="uploadForm.file" class="uploaded-file">
          {{ uploadForm.file.name }}
        </div>
      </el-form-item>

      <!-- 封面图片上传（带预览功能） -->
      <el-form-item label="封面图片" prop="cover">
        <el-upload
          action="#" 
          :on-change="handleCoverChange"
          :auto-upload="false"
          accept="image/*"
          :show-file-list="false"
        >
          <el-button type="primary">点击上传封面</el-button>
        </el-upload>

        <!-- 上传后显示文件名和图片预览 -->
        <div v-if="uploadForm.cover" class="cover-preview">
          <!-- 文件名 -->
          <div class="uploaded-file">{{ uploadForm.cover.name }}</div>
          <!-- 图片预览（使用 FileReader 读取本地文件） -->
          <img 
            :src="coverPreviewUrl" 
            alt="封面预览" 
            class="preview-img"
          >
        </div>
      </el-form-item>

      <!-- 分类 -->
      <el-form-item label="分类" prop="categoryId" required>
        <button type="button" class="category-select-btn" @click="$emit('open-category-dialog')">
          {{ selectedCategoryName || '请选择分类' }}
        </button>
        <div v-if="selectedCategoryId" class="selected-category-id">
          分类ID: {{ selectedCategoryId }}
        </div>
      </el-form-item>

      <!-- 资料类型 -->
      <el-form-item label="资料类型" prop="type" required>
        <el-select v-model="uploadForm.type" placeholder="请选择">
          <el-option label="书籍" value="book"></el-option>
          <el-option label="文件" value="file"></el-option>
          <el-option label="视频" value="video"></el-option>
        </el-select>
      </el-form-item>

      <!-- 名称 -->
      <el-form-item label="名称" prop="name" required>
        <el-input v-model="uploadForm.name" placeholder="请输入资料名称" />
      </el-form-item>

      <!-- ISBN -->
      <el-form-item label="ISBN" prop="ISBN">
        <el-input v-model="uploadForm.ISBN" placeholder="请输入ISBN号(可选)" />
      </el-form-item>

      <!-- 关键词 -->
      <el-form-item label="关键词" prop="tags">
        <div class="tags-container">
          <el-tag
            v-for="(tag, index) in uploadForm.tags"
            :key="index"
            closable
            @close="removeTag(index)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
        <el-input
          v-model="inputTag"
          @keyup.enter="addTag"
          placeholder="输入关键词，按回车添加"
          style="width: 200px; margin-top: 5px;"
        />
      </el-form-item>

      <!-- 作者 -->
      <el-form-item label="作者" prop="author" required>
        <el-input v-model="uploadForm.author" placeholder="请输入作者" />
      </el-form-item>

      <!-- 出版年份 -->
      <el-form-item label="出版年份" prop="createYear" required>
        <el-input v-model="uploadForm.createYear" placeholder="请输入出版年份" />
      </el-form-item>

      <!-- 介绍 -->
      <el-form-item label="介绍" prop="introduction">
        <el-input 
          v-model="uploadForm.introduction" 
          type="textarea" 
          :rows="3"
          placeholder="请输入资料介绍"
        />
      </el-form-item>

      <!-- 视频URL（类型为video时显示） -->
      <el-form-item 
        label="视频URL" 
        prop="videoURL" 
        v-if="uploadForm.type === 'video'"
      >
        <el-input v-model="uploadForm.videoURL" placeholder="请输入视频URL" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="submitUpload" :loading="uploading">
        {{ uploading ? '上传中...' : '提交上传' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { UploadFile, FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import * as allApi from '@/api/all.ts'
import { watch } from 'vue'
import router from '@/router'

// Props - 修复类型定义
interface Props {
  visible: boolean
  selectedCategoryName?: string | null
  selectedCategoryId?: number | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'open-category-dialog': []
  'upload-success': []
}>()

// 表单数据 - 根据接口定义调整
const uploadForm = reactive({
  file: null as File | null,
  cover: null as File | null,
  categoryId: 0 as number,
  type: '' as 'book' | 'file' | 'video',
  name: '',
  ISBN: '' as string,
  tags: [] as string[],
  author: '默认佚名',
  createYear: '未知',
  uploaderId: null as number | null,
  uploadTime: null as Date | null,
  introduction: '无',
  videoURL: '无'
})

// 响应式数据
const inputTag = ref('')
const coverPreviewUrl = ref('')
const uploadFormRef = ref<FormInstance>()
const uploading = ref(false)

// 表单验证规则
const formRules: FormRules = {
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  type: [{ required: true, message: '请选择资料类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入资料名称', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  createYear: [{ required: true, message: '请输入出版年份', trigger: 'blur' }],
}

// 计算属性
const selectedCategoryId = computed(() => props.selectedCategoryId)

// 方法
const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    uploadForm.file = uploadFile.raw
  } else {
    // 处理 raw 为 undefined 的情况
    ElMessage.error('文件上传失败，请重试')
  }
}

const handleCoverChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    uploadForm.cover = uploadFile.raw
  } else {
    // 处理 raw 为 undefined 的情况
    ElMessage.error('文件上传失败，请重试')
  }
  if (uploadFile.raw?.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      coverPreviewUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(uploadFile.raw)
  }
}

const addTag = () => {
  if (inputTag.value.trim()) {
    uploadForm.tags.push(inputTag.value.trim())
    inputTag.value = ''
  }
}

const removeTag = (index: number) => {
  uploadForm.tags.splice(index, 1)
}

const submitUpload = async () => {
  if (!uploadFormRef.value) return

  try {
    // 设置分类ID
    if (props.selectedCategoryId) {
      uploadForm.categoryId = props.selectedCategoryId
    }
    // 设置上传者ID（假设从本地存储获取）
    const userId = Number(localStorage.getItem('userId') || '0')
    console.log('上传者ID:', userId)
    uploadForm.uploaderId = userId

    const valid = await uploadFormRef.value.validate()
    if (!valid) return
    uploading.value = true

    // 创建符合 API 接口定义的对象
    const uploadData = {
      // 使用可选链操作符，确保类型匹配
      file: uploadForm.file ?? undefined,  // 如果是 null 就转为 undefined
      cover: uploadForm.cover ?? undefined,
      categoryId: uploadForm.categoryId,
      type: uploadForm.type,
      name: uploadForm.name,
      ISBN: uploadForm.ISBN ?? undefined,
      tags: uploadForm.tags,
      author: uploadForm.author,
      createYear: uploadForm.createYear,
      uploaderId: uploadForm.uploaderId,
      uploadTime: uploadForm.uploadTime,
      introduction: uploadForm.introduction,
      videoURL: uploadForm.type === 'video' ? uploadForm.videoURL : undefined
    }
    // 调用上传接口
    const response = await allApi.uploadFile(uploadData)
    console.log('上传文件成功:', response)
    ElMessage.success('上传成功！')
    emit('update:visible', false)
    resetForm()
    emit('upload-success')

    if (response) {
      //router.push(`/bookInfo/${response.data?.document?.infoBrief?.documentId}`)
    } else {
      //router.push('/home')
    }
    
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error(error.message || '上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

const resetForm = () => {
  uploadFormRef.value?.resetFields()
  // 手动重置响应式数据
  Object.assign(uploadForm, {
    file: null,
    cover: null,
    categoryId: null,
    type: '',
    name: '',
    ISBN: '',
    tags: [],
    author: '默认佚名',
    createYear: '未知',
    uploaderId: null,
    uploadTime: null,
    introduction: '无',
    videoURL: '无'
  })
  inputTag.value = ''
  coverPreviewUrl.value = ''
}

const handleCancel = () => {
  emit('update:visible', false)
  resetForm()
}

// 监听分类选择变化
watch(() => props.selectedCategoryId, (newId) => {
  if (newId) {
    uploadForm.categoryId = newId
  }
})
</script>

<style scoped>
.uploaded-file {
  margin-top: 5px;
  color: #606266;
  font-size: 14px;
}

.cover-preview {
  margin-top: 10px;
}

.preview-img {
  width: 150px;
  height: auto;
  margin-top: 5px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.upload-dialog .el-button {
  background-color: #b994fe;
  color: white;
  border: none;
}

.category-select-btn {
  width: 100%;
  height: 32px;
  background-color: #ffffff; 
  border: 1.4px solid #ddd; 
  color: #bab9b9; 
  border-radius: 4px; 
  cursor: pointer; 
  transition: all 0.2s; 
  line-height: 0px; 
  text-align: left;
  padding-left: 12px; 
}

.category-select-btn:hover {
  border-color: #c1a1fd;
}

.selected-category-id {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}

.tags-container {
  margin-bottom: 8px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 4px;
}

/* 移除焦点黑框 */
button:focus {
  outline: none;
}

button:focus-visible {
  outline: 2px solid #b994fe;
  outline-offset: 2px;
}
</style>