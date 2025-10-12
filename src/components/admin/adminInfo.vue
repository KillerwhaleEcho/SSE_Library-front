<template>
  <div class="admin-info">
    <el-card class="admin-card" shadow="hover">
      <div v-if="adminInfo" class="admin-card__layout">
        <div class="admin-card__avatar-block">
          <figure class="admin-card__avatar">
            <img :src="avatarUrl" alt="管理员头像" />
          </figure>
          <el-upload
            class="avatar-upload"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleAvatarChange"
          >
            <!-- accept="image/*": 接受的文件类型，这里为所有图片类型。action="#"：上传的地址，这里设置为"#"表示不上传到默认的地址 -->
            <el-button size="small" type="primary" round>上传头像</el-button>
            <!-- type="primary" 是 Element Plus 按钮的类型属性，用于定义按钮的视觉样式和语义含义。 -->
          </el-upload>
        </div>
        <div class="admin-card__content">
          <header class="admin-card__header">
            <h3 class="admin-card__name">{{ displayName }}</h3>
          </header>
          <ul class="admin-card__meta">
            <li v-for="item in infoList" :key="item.label">
              <span class="admin-card__label">{{ item.label }}</span>
              <span class="admin-card__value">{{ item.value }}</span>
            </li>
          </ul>
          <div class="admin-card__actions">
            <el-button type="primary" round @click="openEditDialog">修改信息</el-button>
          </div>
        </div>
      </div>
      <div v-else class="admin-card__placeholder">
        <span v-if="loading">加载中...</span>
        <span v-else-if="error">{{ error }}</span>
        <span v-else>没有管理员信息</span>
      </div>
    </el-card>

    <el-dialog
      v-model="isEditDialogVisible"
      title="修改管理员信息"
      width="420px"
      destroy-on-close
    >
      <el-form label-width="90px" :model="editForm" class="admin-edit-form">
        <el-form-item label="用户 ID">
          <el-input v-model="editForm.userId" type="number" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" type="email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isEditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditSave">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { useAdminStore } from '../../stores/admin'

const adminStore = useAdminStore()
const { adminInfo, loading, error } = storeToRefs(adminStore)

const displayName = computed(() => adminInfo.value?.username )
const avatarUrl = computed(
  () => adminInfo.value?.userAvatar || 'https://placehold.co/120x120?text=Avatar'
)

const infoList = computed(() => {
  if (!adminInfo.value) return []
  return [
    { label: '角色', value: adminInfo.value.role  },
    { label: '用户 ID', value: adminInfo.value.userId?.toString() },
    { label: '创建时间', value: adminInfo.value.createTime  },
    { label: '邮箱', value: adminInfo.value.email },
  ]
})

const isEditDialogVisible = ref(false)
const editForm = reactive({
  userId: '',
  username: '',
  email: '',
})

const openEditDialog = () => {
  if (!adminInfo.value) return
  editForm.userId = adminInfo.value.userId?.toString() ?? ''
  editForm.username = adminInfo.value.username ?? ''
  editForm.email = adminInfo.value.email ?? ''
  isEditDialogVisible.value = true
}

const handleEditSave = () => {
  adminStore.updateAdminInfo({
    userId: Number(editForm.userId) || 0,
    username: editForm.username.trim() || '未命名管理员',
    email: editForm.email.trim(),
  })
  isEditDialogVisible.value = false
  ElMessage.success('管理员信息已更新')
}

const handleAvatarChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    adminStore.updateAdminInfo({ userAvatar: String(reader.result) })
    ElMessage.success('头像已更新')
  }
  reader.onerror = () => {
    ElMessage.error('头像读取失败，请重试')
  }
  reader.readAsDataURL(file)
}

onMounted(() => {
  adminStore.fetchAdminInfo().catch((err) => {
    console.error('加载管理员信息失败', err)
  })
})
</script>

<style scoped lang="css">
.admin-info {
  padding: 24px 20px;
}

.admin-card {
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(140deg, rgba(64, 158, 255, 0.12) 0%, rgba(64, 158, 255, 0.04) 100%);
  backdrop-filter: blur(6px);
}

.admin-card__layout {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 28px;
}

.admin-card__avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.admin-card__avatar {
  margin: 0;
  width: 118px;
  height: 118px;
  border-radius: 50%;
  border: 4px solid #fff;
  overflow: hidden;
  box-shadow: 0 24px 38px rgba(31, 45, 61, 0.16);
}

.admin-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload :deep(.el-button) {
  padding: 6px 16px;
}

.admin-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.admin-card__header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.admin-card__name {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #1f2d3d;
}

.admin-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.admin-card__meta li {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  padding: 16px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(31, 45, 61, 0.08);
  min-height: 96px;
  overflow: hidden;
}

.admin-card__label {
  font-size: 13px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.admin-card__value {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
  word-break: break-word;
}

.admin-card__actions {
  display: flex;
  justify-content: flex-end;
}

.admin-card__placeholder {
  padding: 48px 0;
  text-align: center;
  color: #909399;
}

.admin-edit-form .el-input {
  width: 100%;
}

@media (max-width: 768px) {
  .admin-card__layout {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-card__avatar {
    width: 96px;
    height: 96px;
  }

  .admin-card__meta {
    grid-template-columns: 1fr;
  }
}
</style>
