<template>
  <div class="admin-info">
    <el-card class="admin-card" shadow="never">
      <div  class="profile-layout">
        <aside class="profile-sidebar">
          <figure class="profile-avatar">
            <img :src="avatarUrl" alt="管理员头像" />
          </figure>
          <el-upload class="avatar-upload" action="#" :auto-upload="false" :show-file-list="false" accept="image/*"
            @change="handleAvatarChange">
            <!-- 默认情况下：组件会把选择的文件传给内置的 HTTP 上传逻辑 + handle 函数 ；所以需要禁用自动上传-->
            <!-- 这个组件内部会维护一个文件列表（因为可能一次选择多个文件），如果是change事件，对于你这里的场景，每次选择文件后，内部文件列表会新增一个文件，然后触发函数；select事件是在用户选择文件后立即触发，但此时文件还没有被添加到组件的内部文件列表中，选择多个文件就会多次触发。 -->
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
          <el-button class="sidebar-logout" type="danger" plain @click="handleLogout">
            退出登录
          </el-button>
        </aside>

        <section class="profile-main">
          <div class="profile-section">
            <h4 class="profile-section__title">基本信息</h4>
            <div class="profile-fields">
              <label class="profile-field">
                <span class="profile-field__label">Email</span>
                <el-input v-model="profileForm.email" placeholder="请输入邮箱"></el-input>
              </label>
              <label class="profile-field">
                <span class="profile-field__label">昵称</span>
                <el-input v-model="profileForm.username" placeholder="请输入昵称" />
              </label>
            </div>
            <div class="profile-actions">
              <el-button type="primary" @click="handleProfileSave">保存修改</el-button>
            </div>
          </div>

          <el-divider content-position="center" class="profile-divider">修改密码</el-divider>

          <div class="profile-section">
            <div class="profile-fields ">
              <label class="profile-field">
                <span class="profile-field__label">新密码</span>
                <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
                <!-- show-password属性可以让用户选择是否显示密码文本 -->
              </label>
              <label class="profile-field">
                <span class="profile-field__label">请重新输入密码</span>
                <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
              </label>
              <label class="profile-ver">
                <span class="profile-ver__label">验证码</span>
                <div class="profile-ver-form">
                  <el-input v-model="verificationCode" placeholder="请输入验证码"></el-input>
                  <el-button type="primary" round class="profile-ver__button" @click="getVerificationCode"
                    :disabled="isCodeSending || countdown > 0">
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import router from '@/router'
import { type UploadFile, ElMessage } from 'element-plus'
import { sendEmailCode,resetPasswordAPI } from '../../api/user'
import {  type UserBrief } from '@/api/all'
import {
  getAdminDetail,
  updateAdminProfile,
} from '@/api/admin'

const verificationCode = ref('')
const isCodeSending = ref(false)
const countdown = ref(0)
const timer = ref<number | null>(null)
const userId = ref(0)
const profileSaving = ref(false)
const passwordSaving = ref(false)
const avatarUploading = ref(false)
const loading = ref(false)
const adminInfo = ref<UserBrief | null>()
const emit = defineEmits<{ (e: 'updated'): void }>()


const DEFAULT_AVATAR = 'https://placehold.co/120x120?text=Avatar'
const avatarUrl = ref(DEFAULT_AVATAR)

watch(
  () => adminInfo.value?.userAvatar,
  (newAvatar) => {
    avatarUrl.value = newAvatar || DEFAULT_AVATAR
  },
  { immediate: true },
)

//要呈现的管理员信息，不包括头像
const profileForm = reactive({
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
// immediate的作用是在监听器创建的时候马上调用一次


const handleProfileSave = async () => {
  if (profileSaving.value) return
  if (!profileForm.email.trim()) {
    ElMessage.warning('邮箱不能为空')
    return
  }
  profileSaving.value = true
  try {
    await updateAdminProfile(
      String(userId.value),
      {
        email: profileForm.email.trim(),
        userName: profileForm.username.trim() || adminInfo.value?.username || '',
      }
    )
    // 邮箱为空会提示警告并return掉，但是昵称可以为空，会用原来的昵称作为回退值
    ElMessage.success('资料已更新')
    emit('updated')
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
    const reponse = await resetPasswordAPI({ email, newPassword: passwordForm.newPassword, Code: verificationCode.value })
    if (reponse.data) {
        ElMessage.success('密码已更新')
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    verificationCode.value=''
   }
  } catch (err: any) {
    ElMessage.error(err?.message || '密码更新失败')
  } finally {
    passwordSaving.value = false
  }
}


const handleAvatarChange = async (uploadFile: UploadFile) => {
  if (avatarUploading.value) return
  const file = uploadFile.raw
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }

  avatarUploading.value = true
  const previousAvatar = avatarUrl.value
  try {
    const formData = new FormData()
    formData.append('userAvatar', file)
    const response = await updateAdminProfile(String(userId.value), formData)
    const updated = response.data
    avatarUrl.value = updated.userAvatar || previousAvatar || DEFAULT_AVATAR

    
    ElMessage.success('头像已更新')
    emit('updated')
  } catch (err: any) {
    avatarUrl.value = adminInfo.value?.userAvatar || previousAvatar
    ElMessage.error(err?.message || '头像更新失败，请重试')
  } finally {
    avatarUploading.value = false
  }
}


const getVerificationCode = async () => {
  if (!passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
    ElMessage.warning("请先输入新密码和确认密码之后再获取验证码")
    return
  }

  try {
    const response = await sendEmailCode(
      profileForm.email,
      'reset-password',
    )
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
        isCodeSending.value = false;
      }
    }, 1000)
    // setInterval 是 JavaScript 中用于定期重复执行某个函数的方法，它返回一个定时器ID，这个ID可以用于清除定时器（使用 clearInterval）。
    // setInterval是同步调用的， 但是，setInterval的回调函数是异步执行的，它会在每个间隔时间（这里是1000毫秒）后执行

  } catch (error) {
    ElMessage.error('验证码发送失败，请稍后重试')
    console.log('验证码发送失败，请稍后重试')
  }
}


const getUserId = () => {
  if (typeof window === 'undefined') return null
  const cachedUserId = window.localStorage.getItem('userId')
  userId.value = Number(cachedUserId)
}


const fetchAdminInfo = async (force = false) => {
  if (adminInfo.value && !force) return adminInfo.value

if (!userId.value) {
  ElMessage.error('无法获取用户信息，请先登录')
  router.push('/login')
}

  loading.value = true
  try {
    const response = await getAdminDetail(String(userId.value))
    // 兼容响应结构：若拦截器已返回 data，则直接取；否则取 data.userBrief
    const detail = (response as any).userBrief ? response as any : (response as any).data || response
    adminInfo.value = detail.userBrief 
  } catch (err: any) {
    ElMessage.error('获取管理员信息失败')
  } finally {
    loading.value = false
  }
}



onMounted(() => {
  getUserId()
  fetchAdminInfo()
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
}

.profile-layout {
  display: flex;
  gap: 40px;
  padding: 5px 40px 5px 0px;
}

.profile-sidebar {
  width: 25%;
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
  border: 1px solid #dcd7f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(40, 20, 60, 0.08);
  transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
}




.profile-field :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 14px rgba(40, 20, 60, 0.12);
  transform: translateY(-1px);
  border-color: #cbb6fb;
}

.profile-field :deep(.is-focus .el-input__wrapper) {
  border-color: #b994fe;
  box-shadow: 0 0 0 3px rgba(185, 148, 254, 0.18), 0 6px 18px rgba(40, 20, 60, 0.12);
  transform: translateY(-1px);
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

/* transition 是CSS3的一个属性，用于设置元素的过渡效果。
all 表示该过渡效果应用于元素的所有可过渡属性。也就是说，只要任何CSS属性值发生变化，并且这个属性是可以有过渡效果的，那么就会以过渡的方式变化。
0.3s 表示过渡的持续时间是0.3秒。
ease 是过渡的时间函数，表示过渡效果的速度曲线。ease 是默认值，它表示过渡效果以慢速开始，然后变快，然后慢速结束。 */

.profile-actions :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(91, 36, 127, 0.3);
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
}


.profile-ver {
  display: flex;
  flex-direction: column;
}

.profile-ver__label {
  font-size: 14px;
  color: #5d4d74;
}



.profile-ver-form :deep(.el-input__wrapper) {
  background: #fff;
  border: 1px solid #dcd7f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(40, 20, 60, 0.08);
  transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
}

.profile-ver-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 14px rgba(40, 20, 60, 0.12);
  transform: translateY(-1px);
  border-color: #cbb6fb;
}

.profile-ver-form :deep(.is-focus .el-input__wrapper) {
  border-color: #b994fe;
  box-shadow: 0 0 0 3px rgba(185, 148, 254, 0.18), 0 6px 18px rgba(40, 20, 60, 0.12);
  transform: translateY(-1px);
}

.profile-ver__button {
  margin-left: 10px;
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(91, 36, 127, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}



.profile-ver__button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(91, 36, 127, 0.30);
  filter: brightness(1.03);
}

.profile-ver__button:active {
  transform: translateY(0);
  box-shadow: 0 3px 8px rgba(91, 36, 127, 0.18);
  filter: brightness(0.98);
}

.profile-ver__button.is-disabled,
.profile-ver__button:disabled {
  transform: none;
  box-shadow: none;
  filter: none;
  opacity: 0.7;
  cursor: not-allowed;
}

.profile-ver-form {
  display: flex;
}

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
