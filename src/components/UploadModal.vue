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
      :rules="dynamicFormRules"
    >
      <!-- 文件上传 - 根据类型动态显示 -->
      <el-form-item
        v-if="uploadForm.type !== 'video'"
        label="要上传的文件"
        prop="file"
        :required="uploadForm.type !== 'video'"
      >
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

      <!-- 封面图片上传（带预览功能）- 根据类型动态显示 -->
      <el-form-item
        v-if="uploadForm.type !== 'video'"
        label="封面图片"
        prop="cover"
        :required="uploadForm.type !== 'video'"
      >
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
          <div class="uploaded-file">{{ uploadForm.cover.name }}</div>
          <img :src="coverPreviewUrl" alt="封面预览" class="preview-img" />
        </div>
      </el-form-item>

      <!-- 分类 -->
      <el-form-item label="分类" prop="categoryId" required>
        <button
          type="button"
          class="category-select-btn"
          @click="$emit('open-category-dialog')"
        >
          {{ selectedCategoryName || "请选择分类" }}
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
          class="tag-input"
        />
      </el-form-item>

      <!-- 作者 -->
      <el-form-item label="作者" prop="author" required>
        <el-input v-model="uploadForm.author" placeholder="请输入作者" />
      </el-form-item>

      <!-- 出版年份 -->
      <el-form-item label="出版年份" prop="createYear" required>
        <el-input
          v-model="uploadForm.createYear"
          placeholder="请输入出版年份"
        />
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
        v-if="uploadForm.type === 'video'"
        label="视频URL"
        prop="videoURL"
        required
      >
        <el-input v-model="uploadForm.videoURL" placeholder="请输入视频URL" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="submitUpload" :loading="uploading">
        {{ uploading ? "上传中..." : "提交上传" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import type { UploadFile, FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import * as allApi from "@/api/all.ts";
import router from "@/router";

// Props 定义
interface Props {
  visible: boolean;
  selectedCategoryName?: string | null;
  selectedCategoryId?: number | null;
}

const props = defineProps<Props>();

// Emits 定义
const emit = defineEmits<{
  "update:visible": [value: boolean];
  "open-category-dialog": [];
  "upload-success": [];
}>();

// 表单数据
const uploadForm = reactive({
  file: null as File | null,
  cover: null as File | null,
  categoryId: null as number | null,
  type: "" as "book" | "file" | "video",
  name: "",
  ISBN: "",
  tags: [] as string[],
  author: "默认佚名",
  createYear: "未知",
  uploaderId: null as number | null,
  uploadTime: null as Date | null,
  introduction: "无",
  videoURL: "",
});

// 响应式数据
const inputTag = ref("");
const coverPreviewUrl = ref("");
const uploadFormRef = ref<FormInstance>();
const uploading = ref(false);

// 计算属性
const selectedCategoryId = computed(() => props.selectedCategoryId);

// 动态表单验证规则
const dynamicFormRules = computed(() => {
  const rules: FormRules = {
    categoryId: [{ required: true, message: "请选择分类", trigger: "change" }],
    type: [{ required: true, message: "请选择资料类型", trigger: "change" }],
    name: [{ required: true, message: "请输入资料名称", trigger: "blur" }],
    author: [{ required: true, message: "请输入作者", trigger: "blur" }],
    createYear: [
      { required: true, message: "请输入出版年份", trigger: "blur" },
    ],
  };

  // 根据类型动态添加验证规则
  if (uploadForm.type === "video") {
    // 视频类型：验证视频URL
    rules.videoURL = [
      { required: true, message: "请输入视频URL", trigger: "blur" },
    ];
    // 视频类型：文件和封面为非必选
  } else if (uploadForm.type === "book" || uploadForm.type === "file") {
    // 书籍和文件类型：验证文件和封面
    rules.file = [
      {
        required: true,
        message: "请上传文件",
        trigger: "change",
        validator: (_rule, value, callback) => {
          if (!value) {
            callback(new Error("请上传文件"));
          } else {
            callback();
          }
        },
      },
    ];

    rules.cover = [
      {
        required: true,
        message: "请上传封面图片",
        trigger: "change",
        validator: (_rule, value, callback) => {
          if (!value) {
            callback(new Error("请上传封面图片"));
          } else {
            callback();
          }
        },
      },
    ];
  }

  return rules;
});

// 事件处理函数
const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    uploadForm.file = uploadFile.raw;
  } else {
    ElMessage.error("文件上传失败，请重试");
  }
};

const handleCoverChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    uploadForm.cover = uploadFile.raw;
  } else {
    ElMessage.error("文件上传失败，请重试");
  }

  if (uploadFile.raw?.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      coverPreviewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(uploadFile.raw);
  }
};

const addTag = () => {
  const tag = inputTag.value.trim();
  if (tag && !uploadForm.tags.includes(tag)) {
    uploadForm.tags.push(tag);
    inputTag.value = "";
  }
};

const removeTag = (index: number) => {
  uploadForm.tags.splice(index, 1);
};

// 表单提交
const submitUpload = async () => {
  if (!uploadFormRef.value) return;

  try {
    // 验证分类
    if (!selectedCategoryId.value) {
      ElMessage.error("请选择分类");
      return;
    }

    uploadForm.categoryId = selectedCategoryId.value;

    // 前端验证：根据类型验证必要字段
    if (uploadForm.type === "book" || uploadForm.type === "file") {
      if (!uploadForm.file) {
        ElMessage.error("请上传文件");
        return;
      }
      if (!uploadForm.cover) {
        ElMessage.error("请上传封面图片");
        return;
      }
    } else if (uploadForm.type === "video") {
      if (!uploadForm.videoURL.trim()) {
        ElMessage.error("请输入视频URL");
        return;
      }
    }

    // 设置上传者ID
    const userId = Number(localStorage.getItem("userId") || "0");
    uploadForm.uploaderId = userId;

    // 表单验证
    const valid = await uploadFormRef.value.validate();
    if (!valid) return;

    uploading.value = true;

    // 构建上传数据
    const uploadData: any = {
      categoryId: uploadForm.categoryId,
      type: uploadForm.type,
      name: uploadForm.name.trim(),
      tags: uploadForm.tags,
      author: uploadForm.author.trim(),
      createYear: uploadForm.createYear,
      uploaderId: uploadForm.uploaderId,
      uploadTime: uploadForm.uploadTime,
      introduction: uploadForm.introduction.trim() || "无",
    };

    // 根据类型添加字段
    if (uploadForm.type === "book" || uploadForm.type === "file") {
      uploadData.file = uploadForm.file;
      uploadData.cover = uploadForm.cover;
      if (uploadForm.ISBN.trim()) {
        uploadData.ISBN = uploadForm.ISBN.trim();
      }
    } else if (uploadForm.type === "video") {
      uploadData.videoURL = uploadForm.videoURL.trim();
      // 视频类型可选上传文件
      if (uploadForm.file) {
        uploadData.file = uploadForm.file;
      }
      if (uploadForm.cover) {
        uploadData.cover = uploadForm.cover;
      }
    }

    // 调用上传接口
    const response = await allApi.uploadFile(uploadData);
    ElMessage.success("上传成功！");

    emit("update:visible", false);
    resetForm();
    emit("upload-success");

    // 跳转到文档详情页或首页
    if (response?.data?.documentId) {
      router.push({
        path: "/bookInfo",
        query: { id: response.data.documentId },
      });
    } else {
      router.push("/home");
    }
  } catch (error: any) {
    console.error("上传失败:", error);
    ElMessage.error(error.message || "上传失败，请重试");
  } finally {
    uploading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  uploadFormRef.value?.resetFields();
  Object.assign(uploadForm, {
    file: null,
    cover: null,
    categoryId: null,
    type: "",
    name: "",
    ISBN: "",
    tags: [],
    author: "默认佚名",
    createYear: "未知",
    uploaderId: null,
    uploadTime: null,
    introduction: "无",
    videoURL: "",
  });
  inputTag.value = "";
  coverPreviewUrl.value = "";
};

// 取消上传
const handleCancel = () => {
  emit("update:visible", false);
  resetForm();
};

// 监听分类选择变化
watch(
  () => props.selectedCategoryId,
  (newId) => {
    if (newId) {
      uploadForm.categoryId = newId;
    }
  }
);
</script>

<style scoped>
.upload-dialog .el-button {
  background-color: #b994fe;
  color: white;
  border: none;
}

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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.tag-item {
  margin: 0;
}

.tag-input {
  width: 200px;
  margin-top: 5px;
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
