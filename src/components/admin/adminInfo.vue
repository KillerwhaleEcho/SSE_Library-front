<template>
  <div class="admin-info">
    <el-card class="admin-card" shadow="never">
      <div v-if="adminInfo" class="profile-layout">
        <aside class="profile-sidebar">
          <figure class="profile-avatar">
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
          <!-- 默认情况下：组件会把选择的文件传给内置的 HTTP 上传逻辑 + handle 函数 ；所以需要禁用自动上传-->
            <el-button size="small" type="primary">上传头像</el-button>
          </el-upload>
          <ul class="profile-summary">
            <li>
              <span class="profile-summary__label">角色</span>
              <span class="profile-summary__value">{{ profileForm.role }}</span>
            </li>
            <li>
              <span class="profile-summary__label">用户 ID</span>
              <span class="profile-summary__value">{{ profileForm.userId }}</span>
            </li>
            <li>
              <span class="profile-summary__label">创建时间</span>
              <span class="profile-summary__value">{{ profileForm.createTime }}</span>
            </li>
          </ul>
        </aside>

        <section class="profile-main">
          <div class="profile-section">
            <h4 class="profile-section__title">基本信息</h4>
            <div class="profile-fields">
              <label class="profile-field">
                <span class="profile-field__label">Email</span>
                <el-input v-model="profileForm.email" placeholder="请输入邮箱"  ></el-input>
              </label>
              <label class="profile-field">
                <span class="profile-field__label">昵称</span>
                <el-input v-model="profileForm.username" placeholder="请输入昵称" />
              </label>
            </div>
            <div class="profile-actions">
              <el-button class="profile__button" type="primary" @click="handleProfileSave">保存修改</el-button>
            </div>
          </div>

          <el-divider content-position="center" class="profile-divider">修改密码</el-divider>

          <div class="profile-section">
            <div class="profile-fields ">
              <label class="profile-field">
                <span class="profile-field__label">新密码</span>
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  show-password
                  placeholder="请输入新密码"
                />
                <!-- show-password属性可以让用户选择是否显示密码文本 -->
              </label>
              <label class="profile-field">
                <span class="profile-field__label">请重新输入密码</span>
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  show-password
                  placeholder="请再次输入新密码"
                />
              </label> 
               <label class="profile-ver">
                <span class="profile-ver__label">验证码</span>
                <div class="profile-ver-form">
                <el-input v-model="verificationCode"
                placeholder="请输入验证码"></el-input>
                 <el-button 
                type="primary" 
                round 
                class="profile-ver__button"
                @click="getVerificationCode"
                :disabled="isCodeSending || countdown > 0"
              >
                {{ countdown > 0 ? `${countdown}s后重新获取` : '获取验证码' }}
              </el-button>
                </div>
              </label>
            </div>
            <div class="profile-actions">
              <el-button type="primary" @click="handlePasswordSave" class="profile__button">保存修改</el-button>
            </div>
          </div>
        </section>
      </div>
      <div v-else class="admin-card__placeholder">
        <span v-if="loading">加载中...</span>
        <span v-else-if="error">{{ error }}</span>
        <span v-else>没有管理员信息</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { useAdminStore } from '../../stores/admin'
import { sendEmailCode } from '../../api/user'

const verificationCode = ref('')
const isCodeSending = ref(false)
const countdown = ref(0)
const timer=ref<number|null>(null)

const profileSaving = ref(false)
const passwordSaving = ref(false)
const avatarUploading = ref(false)
// 这三个变量是在做“防止重复提交”的保护
// 如果用户点击了提交按钮，函数还在执行中就又点击了一次按钮那就直接让处理函数return掉防止重复提交


const adminStore = useAdminStore()
const { adminInfo, loading, error } = storeToRefs(adminStore)

const avatarUrl = computed(
  () => adminInfo.value?.userAvatar || 'https://placehold.co/120x120?text=Avatar'//fallback中没有给出默认值所以加上了一个默认占位图
)

const profileForm = reactive({//要呈现的管理员信息，不包括头像
  email: '',
  username: '',
  role: '',
  userId: '',
  createTime: '',
})

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: '',
})


watch(
  () => adminInfo.value,
  (info) => {
    if (!info) return
    profileForm.email = info.email ?? ''
    profileForm.username = info.username ?? ''
    profileForm.role = info.role ?? ''
    profileForm.userId = info.userId?.toString() ?? ''
    profileForm.createTime = info.createTime ?? ''
  },
  { immediate: true },
)
//这是一个watch监听器，用于监听adminInfo.value，当值发生变化时就把新值作为参数传入回调函数，并更新profileForm中的各个字段

const handleProfileSave = async () => {
  if (profileSaving.value) return
  if (!profileForm.email.trim()) {
    ElMessage.warning('邮箱不能为空')
    return
  }
  profileSaving.value = true
  try {
    await adminStore.updateAdminInfo({
      email: profileForm.email.trim(),
      userName: profileForm.username.trim() || adminInfo.value?.username || '',
    })
    // 邮箱为空会提示警告并return掉，但是昵称可以为空，会用原来的昵称作为回退值
    ElMessage.success('资料已更新')
  } catch (err: any) {
    ElMessage.error(err?.message || '资料更新失败')
  } finally {
    profileSaving.value = false
  }
}

const handlePasswordSave = async () => {
  if (passwordSaving.value) return
  if (!passwordForm.newPassword) {
    ElMessage.warning('请填写新密码')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  const email = profileForm.email.trim()
  if (!email) {
    ElMessage.warning('邮箱不能为空')
    return
  }
  passwordSaving.value = true
  try {
    await adminStore.updatePassword({
      email,
      newPassword: passwordForm.newPassword,
      code:verificationCode.value,
    })
    ElMessage.success('密码已更新')
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    ElMessage.error(err?.message || '密码更新失败')
  } finally {
    passwordSaving.value = false
  }
}

const readFileAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
  //resolve和reject是Promise自动提供的的两个回调函数，分别用于处理成功和失败时改变promise的状态，这比较复杂，因为这是两个异步函数，可以在创建完成之后再调用

const handleAvatarChange = async (uploadFile: UploadFile) => {
  if (avatarUploading.value) return
  const file = uploadFile.raw//这样之后才拿到真正的File对象
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  avatarUploading.value = true
  try {
    const base64 = await readFileAsDataURL(file)
    await adminStore.updateAdminInfo({ userAvatar: base64 })
    ElMessage.success('头像已更新')
  } catch (err: any) {
    ElMessage.error(err?.message || '头像更新失败，请重试')
  } finally {
    avatarUploading.value = false
  }
}

const getVerificationCode= async() => {
  if (!passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
    ElMessage.warning("请先输入新密码和确认密码之后再获取验证码")
  return
  }

  try {
    const response = await sendEmailCode(profileForm.email)
    if (response.code === 200) {
      isCodeSending.value = true
      ElMessage.success('验证码已发送，请查收')
    } else {
      ElMessage.error('验证码发送失败')
      return 
    }

    countdown.value = 10;

    timer.value = window.setInterval(() => {
      countdown.value--
      if (countdown.value < 0 && timer.value) {
        clearInterval(timer.value)
        timer.value = null
        isCodeSending.value = false; // 倒计时结束，重置发送状态
      }
    },1000)

  } catch(error) {
    ElMessage.error('验证码发送失败，请稍后重试')
    console.log('验证码发送失败，请稍后重试')
  }
}

onMounted(() => {
  adminStore.fetchAdminInfo().catch((err) => {
    console.error('加载管理员信息失败', err)
    //永远不会触发，因为fetchAminInfo至少会返回fallback数据
  })
})
</script>


<style scoped lang="css">
.admin-info {
  padding: 0;
  border-radius: 5px;
}

.admin-card {
  border: none;
  overflow: hidden;
  background: #fff;
  /* box-shadow: 0 18px 36px rgba(91, 36, 127, 0.16); */
}

.profile-layout {
  display: flex;
  gap: 40px;
  padding: 5px 40px 5px 0px;
}

.profile-sidebar {
  width: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  padding-right: 32px;
  border-right: 1px solid #ece4f6;
}

.profile-avatar {
  margin: 0;
  width: 118px;
  height: 118px;
  border-radius: 50%;
  border: 4px solid rgba(185, 148, 254, 0.4);
  overflow: hidden;
  box-shadow: 0 15px 28px rgba(91, 36, 127, 0.18);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload :deep(.el-button) {
  width: 140px;
  border: none;
  background: linear-gradient(135deg, #b994fe 0%, #8e47bd 100%);
  color: #fff;
  transition: all 0.3s ease;
}

.avatar-upload :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(91, 36, 127, 0.3);
}

.profile-summary {
  width: 100%;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-summary li {
  border: 1px solid rgba(185, 148, 254, 0.28);
  border-radius: 12px;
  padding: 12px 16px;
  background: rgba(249, 245, 255, 0.8);
}

.profile-summary__label {
  font-size: 13px;
  color: #6c558d;
  margin-bottom: 4px;
  display: block;
}

.profile-summary__value {
  font-size: 16px;
  font-weight: 600;
  color: #3f2458;
  word-break: break-all;
}

.profile-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.profile-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-section__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #311a45;
}

.profile-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}



.profile-field {
  display: flex;
  flex-direction: column;

}

.profile-field__label {
  font-size: 14px;
  color: #5d4d74;
}

.profile-field :deep(.el-input__wrapper) {
  background: #fff;
  box-shadow: none;
  border: 1px solid #dcd7f0;
  border-radius: 5px;
}

.profile-field :deep(.el-input__wrapper:focus),
.profile-field :deep(.is-focus .el-input__wrapper) {
  border-color: #b994fe;
  box-shadow: 0 0 0 2px rgba(185, 148, 254, 0.18);
}

.profile-field :deep(.el-input__inner) {
  color: #311a45;
}

.profile-actions {
  display: flex;
  justify-content: flex-start;
}

.profile-actions :deep(.el-button) {
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
  border: none;
  transition: all 0.3s ease;
}

.profile-actions :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(91,36,127, 0.3);
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
}


.profile-ver{
  display: flex;
  flex-direction: column;
}

.profile-ver__label{
    font-size: 14px;
  color: #5d4d74;
}

.profile-ver__button{
  margin-left: 10px;
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
  border: none;
  transition: all 0.3s ease;
}

.profile-ver-form{
  display: flex;
}

/* .profile-verification__ */

.profile-divider {
  margin: 8px 0 0px;
  font-size: 13px;
  color: #7a6598;
}

.profile-divider :deep(.el-divider__text) {
  background: #fff;
}

.admin-card__placeholder {
  padding: 48px 0;
  text-align: center;
  color: #8f6fb2;
}

@media (max-width: 1024px) {
  .profile-layout {
    flex-direction: column;
    padding: 28px;
  }

  .profile-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ece4f6;
    padding-right: 0;
    padding-bottom: 28px;
  }

  .profile-main {
    width: 100%;
    padding-top: 10px;
  }
}


</style>
