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
    >
      <!-- 文件上传 -->
      <el-form-item label="要上传的文件" prop="file">
        <el-upload
          action="#"
          :on-change="handleFileChange"
          :auto-upload="false"
          accept=".pdf,.doc,.docx,.txt,.mp4"
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
          :show-file-list="true"
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
      <el-form-item label="分类" prop="category">
        <button type="button" class="category-select-btn" @click="$emit('open-category-dialog')">
          {{ selectedCategoryName || 'category' }}
        </button>
      </el-form-item>

      <!-- 资料类型 -->
      <el-form-item label="资料类型" prop="type">
        <el-select v-model="uploadForm.type" placeholder="请选择">
          <el-option label="书籍" value="book"></el-option>
          <el-option label="文件" value="file"></el-option>
          <el-option label="视频" value="video"></el-option>
        </el-select>
      </el-form-item>

      <!-- 名称 -->
      <el-form-item label="名称" prop="name">
        <el-input v-model="uploadForm.name" />
      </el-form-item>

      <!-- ISBN -->
      <el-form-item label="ISBN" prop="ISBN">
        <el-input v-model="uploadForm.ISBN" />
      </el-form-item>

      <!-- 关键词 -->
      <el-form-item label="关键词" prop="tags">
        <el-tag
          v-for="(tag, index) in uploadForm.tags"
          :key="index"
          closable
          @close="uploadForm.tags.splice(index, 1)"
        >
          {{ tag }}
        </el-tag>
        <el-input
          v-model="inputTag"
          @keyup.enter="addTag"
          placeholder="输入关键词，按回车添加"
          style="width: 200px; margin-top: 5px;"
        />
      </el-form-item>

      <!-- 作者 -->
      <el-form-item label="作者" prop="author">
        <el-input v-model="uploadForm.author" />
      </el-form-item>

      <!-- 上传者ID -->
      <el-form-item label="上传者ID" prop="uploaderId">
        <el-input v-model.number="uploadForm.uploaderId" type="number" />
      </el-form-item>

      <!-- 上传时间（自动生成，可隐藏） -->
      <el-form-item label="上传时间" prop="uploadTime">
        <el-date-picker
          v-model="uploadForm.uploadTime"
          type="datetime"
          placeholder="选择上传时间"
        />
      </el-form-item>

      <!-- 介绍 -->
      <el-form-item label="介绍" prop="introduction">
        <el-input v-model="uploadForm.introduction" type="textarea" />
      </el-form-item>

      <!-- 视频URL（类型为video时显示） -->
      <el-form-item 
        label="视频URL" 
        prop="videoURL" 
        v-if="uploadForm.type === 'video'"
      >
        <el-input v-model="uploadForm.videoURL" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="submitUpload">提交上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { ElMessage, UploadFile } from 'element-plus'

// Props - 修复类型定义
interface Props {
  visible: boolean
  selectedCategoryName?: string | null  // 修改为 string | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'open-category-dialog': []
  'upload-success': []
}>()

// 表单数据
const uploadForm = reactive({
  file: null,
  cover: null,
  categoryId: null,
  type: '',
  name: '',
  ISBN: '',
  tags: [],
  author: '默认佚名',
  createYear: '',
  uploaderId: null,
  uploadTime: new Date(),
  introduction: '',
  videoURL: ''
})

// 响应式数据
const inputTag = ref('')
const coverPreviewUrl = ref('')
const uploadFormRef = ref()

// 方法
const handleFileChange = (uploadFile: UploadFile) => {
  uploadForm.file = uploadFile.raw
}

const handleCoverChange = (uploadFile: UploadFile) => {
  uploadForm.cover = uploadFile.raw
  if (uploadFile.raw.type.startsWith('image/')) {
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

const submitUpload = () => {
  uploadFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      const formData = new FormData()
      for (const key in uploadForm) {
        if (key === 'file' || key === 'cover') {
          if (uploadForm[key]) {
            formData.append(key, uploadForm[key])
          }
        } else if (key === 'tags') {
          formData.append(key, uploadForm[key].join(','))
        } else {
          formData.append(key, uploadForm[key])
        }
      }

      console.log('提交的表单数据：', formData)
      ElMessage.success('模拟上传成功（实际需对接接口）')
      emit('update:visible', false)
      resetForm()
      emit('upload-success')
    }
  })
}

const resetForm = () => {
  uploadFormRef.value?.resetFields()
  uploadForm.file = null
  uploadForm.cover = null
  uploadForm.tags = []
  uploadForm.uploadTime = new Date()
  inputTag.value = ''
  coverPreviewUrl.value = ''
}

const handleCancel = () => {
  emit('update:visible', false)
  resetForm()
}
</script>

<style scoped>
.uploaded-file {
  margin-top: 5px;
  color: #606266;
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
</style>