<template>
  <el-dialog 
    :visible="showUploadModal" 
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
          <div class="uploaded-file">{{ uploadForm.cover.name }}</div>
          <img 
            :src="coverPreviewUrl" 
            alt="封面预览" 
            class="preview-img"
          >
        </div>
      </el-form-item>

      <!-- 分类 -->
      <el-form-item label="分类" prop="category">
        <button class="category-select-btn" @click="onSelectCategory">{{ selectedUploadCategoryName || 'category' }}</button>
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
          @keyup.enter.native="addTag"
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

      <!-- 上传时间 -->
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
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="submitUpload">提交上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { UploadFile, ElForm } from 'element-plus'
import { ElMessage } from 'element-plus'

//  props
const props = defineProps<{
  showUploadModal: boolean
  allCategories: any[]
  selectedUploadCategoryName?: string | null
}>()

//  emits
const emit = defineEmits<{
  (e: 'update:showUploadModal', value: boolean): void
  (e: 'select-category'): void
  (e: 'submit', formData: FormData): void
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

// 关键词输入框临时变量
const inputTag = ref('')
const coverPreviewUrl = ref('')
// 表单引用
const uploadFormRef = ref<InstanceType<typeof ElForm> | null>(null)

// 文件上传变更事件（文件）
const handleFileChange = (uploadFile: UploadFile) => {
  uploadForm.file = uploadFile.raw
}

// 封面上传变更事件
const handleCoverChange = (uploadFile: UploadFile) => {
  uploadForm.cover = uploadFile.raw
  // 生成预览图（仅针对图片文件）
  if (uploadFile.raw?.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      coverPreviewUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(uploadFile.raw)
  }
}

// 添加关键词
const addTag = () => {
  if (inputTag.value.trim()) {
    uploadForm.tags.push(inputTag.value.trim())
    inputTag.value = ''
  }
}

// 提交上传
const submitUpload = () => {
  uploadFormRef.value?.validate((valid) => {
    if (valid) {
      // 构造 FormData 用于文件上传
      const formData = new FormData()
      for (const key in uploadForm) {
        const value = uploadForm[key as keyof typeof uploadForm]
        if (key === 'file' || key === 'cover') {
          if (value) {
            formData.append(key, value)
          }
        } else if (key === 'tags') {
          formData.append(key, (value as string[]).join(','))
        } else {
          formData.append(key, value as string | Blob)
        }
      }

      emit('submit', formData)
      ElMessage.success('模拟上传成功（实际需对接接口）')
      handleClose()
      resetForm()
    }
  })
}

// 关闭弹窗
const handleClose = () => {
  emit('update:showUploadModal', false)
}

// 重置表单
const resetForm = () => {
  uploadFormRef.value?.resetFields()
  uploadForm.file = null
  uploadForm.cover = null
  uploadForm.tags = []
  uploadForm.uploadTime = new Date()
  inputTag.value = ''
  coverPreviewUrl.value = ''
}

// 选择分类
const onSelectCategory = () => {
  emit('select-category')
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