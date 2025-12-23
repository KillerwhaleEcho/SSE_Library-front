<template>
  <div class="login-background" @click="handleBackgroundClick" :class="{ 'has-interacted': hasInteracted }">
    <!-- 欢迎界面 -->
    <div 
      class="welcome-box" 
      :class="{ 'welcome-box--moved': hasInteracted }"
    >
      <p class="welcome-box__title">SSE-Library</p>
      <div class="welcome-box__desc">Welcome to SSE-Library! Let's share knowladges.</div>
      <div class="welcome-box__hint" v-if="!hasInteracted">
        点击屏幕继续
      </div>
    </div>

    <!-- 表单容器（用于统一控制动画） -->
    <div class="form-container">
      <!-- 登录表单 -->
      <el-form
        class="form-card form-animate"
        v-if="isLogin && !isRegister && !isForgot"
        :class="{ 'form-card--active': isLogin && hasInteracted }"
        :model="loginForm"
        label-width="0"
      >
        <el-form-item class="centered-form-item">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
            clearable
            type="email"
            required
          />
        </el-form-item>
        <el-form-item class="centered-form-item">
          <el-input
            v-model="loginForm.password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            clearable
            type="password"
            show-password
            required
          />
        </el-form-item>
        <el-form-item class="centered-form-item button-group">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-button 
                class="form-card__link" 
                @click.prevent="switchToForgot"
              >
                忘记密码？
              </el-button>
            </el-col>
            <el-col :span="12" class="text-right">
              <el-button 
                class="form-card__link" 
                @click.prevent="switchToRegister"
              >
                注册账号
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item class="centered-form-item">
          <el-button 
            class="form-card__submit" 
            type="primary" 
            round
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 注册表单 -->
    <div class="form-container-register">
      <el-form
        class="form-card form-animate"
        v-if="isRegister && !isLogin && !isForgot"
        :class="{ 'form-card--active': isRegister && hasInteracted }"
        :model="registerForm"
        label-width="0"
        :rules="registerRules"
        ref="registerFormRef"
      >
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
            clearable
            type="email"
            required
          />
        </el-form-item>
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
            required
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="请输入密码（至少8位）"
            prefix-icon="Lock"
            clearable
            type="password"
            show-password
            minlength="8"
            required
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            placeholder="请确认密码"
            prefix-icon="Lock"
            clearable
            type="password"
            show-password
            required
          />
        </el-form-item>
        <!-- 新增头像上传行 -->
        <!-- 新增头像上传行 -->
        <el-form-item class="avatar-upload-row">
          <el-row :gutter="12" class="avatar-row">
            <!-- 头像显示框（方形） -->
            <el-col :span="6">
              <div class="avatar-preview">
                <img
                  v-if="avatarPreview"
                  :src="avatarPreview"
                  alt="用户头像"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  <el-icon class="avatar-icon"><User /></el-icon>
                </div>
              </div>
            </el-col>
            <!-- 上传按钮 -->
            <el-col :span="18">
              <el-upload class="avatar-uploader" action="#" :auto-upload="false" :show-file-list="false" accept="image/*"
                @change="handleAvatarChange">
                <!-- 默认情况下：组件会把选择的文件传给内置的 HTTP 上传逻辑 + handle 函数 ；所以需要禁用自动上传-->
                <!-- 这个组件内部会维护一个文件列表（因为可能一次选择多个文件），如果是change事件，对于你这里的场景，每次选择文件后，内部文件列表会新增一个文件，然后触发函数；select事件是在用户选择文件后立即触发，但此时文件还没有被添加到组件的内部文件列表中，选择多个文件就会多次触发。 -->
                <el-button size="small" type="primary" class="upload-button">选择头像</el-button>
                <p class="upload-hint">支持JPG、PNG格式，不超过2MB</p>
              </el-upload>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-row :gutter="12" class="verification-row">
            <el-col :span="16">
              <el-input
                v-model="registerForm.Code"
                placeholder="请输入验证码"
                prefix-icon="Code"
                clearable
                required
              />
            </el-col>
            <el-col :span="8">
              <el-button 
                type="primary" 
                round 
                class="form-card__submit"
                @click="getVerificationCode"
                :disabled="isCodeSending || countdown > 0"
              >
                {{ countdown > 0 ? `${countdown}s后重新获取` : '获取验证码' }}
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-button 
            class="form-card__link form-card__link--primary" 
            @click.prevent="switchToLogin"
          >
            已有账号，返回登录
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button 
            class="form-card__submit" 
            type="primary" 
            round
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 忘记密码表单 -->
    <div class="form-container">
      <el-form
        class="form-card form-animate"
        v-if="isForgot && !isLogin && !isRegister"
        :class="{ 'form-card--active': isForgot && hasInteracted }"
        :model="forgotForm"
        label-width="0"
        :rules="forgotRules"
        ref="forgotFormRef"
      >
        <el-form-item prop="email">
          <el-input
            v-model="forgotForm.email"
            placeholder="请输入绑定的邮箱地址"
            prefix-icon="Message"
            clearable
            type="email"
            required
          />
        </el-form-item>
        <el-form-item prop="verificationCode">
          <el-row :gutter="12" class="verification-row">
            <el-col :span="16">
              <el-input
                v-model="forgotForm.Code"
                placeholder="请输入验证码"
                prefix-icon="Code"
                clearable
                required
              />
            </el-col>
            <el-col :span="8">
              <el-button 
                type="primary" 
                round 
                class="form-card__submit"
                @click="getVerificationCode"
                :disabled="isCodeSending || countdown > 0"
              >
                {{ countdown > 0 ? `${countdown}s后重新获取` : '获取验证码' }}
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item prop="newPassword">
          <el-input
            v-model="forgotForm.newPassword"
            placeholder="请输入新密码（至少8位）"
            prefix-icon="Lock"
            clearable
            type="password"
            show-password
            minlength="8"
            required
          />
        </el-form-item>
        <el-form-item prop="confirmNewPassword">
          <el-input
            v-model="forgotForm.confirmNewPassword"
            placeholder="请确认新密码"
            prefix-icon="Lock"
            clearable
            type="password"
            show-password
            required
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            class="form-card__link" 
            @click.prevent="switchToLogin"
          >
            放弃修改，返回登录
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button 
            class="form-card__submit" 
            type="primary" 
            round
            @click="handlePasswordReset"
          >
            确认修改
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElForm, ElUpload } from 'element-plus';
import { User, Lock, Message, Promotion as Code } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { sendEmailCode,  resetPasswordAPI } from '@/api/user'
import type { UploadFile, UploadRequestOptions } from 'element-plus';

// 状态控制变量
const hasInteracted = ref(false); // 是否已点击屏幕
const isLogin = ref(false);      // 是否显示登录页
const isRegister = ref(false);   // 是否显示注册页
const isForgot = ref(false);     // 是否显示忘记密码页
const userStore = useAuthStore()
const router = useRouter()

// 表单数据
const loginForm = reactive({
  email: '',
  password: ''
});

const registerForm = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  Code: ''
});

/** 头像文件（真正上传的文件） */
const avatarFile = ref<File | null>(null)

/** 头像预览 */
const avatarPreview = ref<string>('')

const forgotForm = reactive({
  email: '',
  Code: '',
  newPassword: '',
  confirmNewPassword: ''
});

// 表单引用
const registerFormRef = ref<InstanceType<typeof ElForm>>();
const forgotFormRef = ref<InstanceType<typeof ElForm>>();

// 表单验证规则
const registerRules = reactive({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少为8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
});

const forgotRules = reactive({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  Code: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '新密码长度至少为8位', trigger: 'blur' }
  ],
  confirmNewPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (value !== forgotForm.newPassword) {
          callback(new Error('两次输入的新密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
});

// 验证码倒计时控制
const isCodeSending = ref(false);
const countdown = ref(0);
const timer = ref(null);

// 初始化：页面加载时默认隐藏所有表单
onMounted(() => {
  isLogin.value = false;
  isRegister.value = false;
  isForgot.value = false;
});

// 点击背景触发欢迎页动画和显示登录表单
const handleBackgroundClick = () => {
  if (!hasInteracted.value) {
    hasInteracted.value = true;
    // 延迟设置isLogin确保动画同步
    setTimeout(() => {
      isLogin.value = true;
    }, 100);
  }
};

// 切换到登录页
const switchToLogin = () => {
  isLogin.value = true;
  isRegister.value = false;
  isForgot.value = false;
};

// 切换到注册页
const switchToRegister = () => {
  isLogin.value = false;
  isRegister.value = true;
  isForgot.value = false;
};

// 切换到忘记密码页
const switchToForgot = () => {
  isLogin.value = false;
  isRegister.value = false;
  isForgot.value = true;
};

// 获取验证码
const getVerificationCode = async () => {
  const email = isRegister.value ? registerForm.email : forgotForm.email;
  const usage = isRegister.value ? 'register' : 'reset-password';
  
  if (!email) {
    ElMessage.warning('请先输入邮箱地址');
    return;
  }

  // 验证码发送
  try {
    // 调用API发送验证码
    const response = await sendEmailCode(email, usage);
    if (response.code === 200) {
      isCodeSending.value = true;
      ElMessage.success('验证码已发送，请查收')
    } else {
      ElMessage.error(response.data.message || '验证码发送失败')
      return
    }

    // 开始倒计时
    countdown.value = 10
    timer.value = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && timer.value) {
        clearInterval(timer.value)
        timer.value = null
        isCodeSending.value = false; // 倒计时结束，重置发送状态
      }
    }, 1000)
  } catch (error) {
    ElMessage.error('验证码发送失败，请稍后重试')
    console.error('发送验证码失败:', error)
  }
};

// 登录处理
const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) {
    ElMessage.warning('请填写完整的登录信息');
    return;
  }
  // 这里可以添加登录接口调用逻辑
  try {
    //await loginForm.value.validate()

    const result = await userStore.login(loginForm.email, loginForm.password)
    if (result.success) {
      ElMessage.success('登录成功！')
      localStorage.setItem('userId', result.data.user.userId.toString());
      localStorage.setItem('role', result.data.user.role)
      router.push('/home')
    } else {
      ElMessage.error('登录失败，请检查邮箱和密码')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请稍后重试')
  }
};


const avatarRawFile=ref()

const handleAvatarChange = async (uploadFile: UploadFile) => {
   avatarRawFile.value = uploadFile.raw//这样之后才拿到真正的File对象
  if (!avatarRawFile) return
  if (!avatarRawFile.value.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (avatarRawFile.value.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

}

// 注册处理函数中调用方式调整
const handleRegister = async () => {
  registerFormRef.value?.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请检查并完善表单信息');
      return;
    }
    // console.log("注册表单：",registerForm);
    try {
      const registerData = new FormData()

      registerData.append('username', registerForm.username)
      registerData.append('password', registerForm.password)
      registerData.append('email', registerForm.email)
      registerData.append('Code', registerForm.Code)
      if (avatarRawFile.value) {
        registerData.append('userAvatar', avatarRawFile.value)
      }
      console.log('---------------')
      for (const [k, v] of registerData.entries()) {
        console.log(k, v)
      }

      const registerRes = await userStore.register(registerData);
      ElMessage.closeAll();
      console.log(" registerRes =", registerRes)

      if (registerRes.success) {
        ElMessage.success('注册成功！即将跳转到登录页');
        setTimeout(switchToLogin, 1500);
      } else {
        ElMessage.error(registerRes.message || '注册失败，请稍后重试');
      }
    } catch (error) {
      ElMessage.closeAll();
      console.error('注册过程出错:', error);
    }
  });
};

// 密码重置处理
const handlePasswordReset = async () => {
  forgotFormRef.value?.validate(async (valid) => {
    if (valid) {
      if (!forgotForm.email || !forgotForm.Code || !forgotForm.newPassword) {
        ElMessage.warning('请填写完整的修改信息');
        return;
      }
      // 这里可以添加密码重置接口调用逻辑
      try {
        // 调用密码重置接口
        const resetRes = await userStore.resetPassword({
          email: forgotForm.email,
          newPassword: forgotForm.newPassword,
          Code: forgotForm.Code
        });

        if (resetRes.success) {
          ElMessage.success('密码修改成功，请使用新密码登录');
          // 重置表单并切换到登录页
          switchToLogin();
          forgotFormRef.value?.resetFields();
        } else {
          ElMessage.error(resetRes.message || '密码重置失败，请稍后重试');
        }
      } catch (error) {
        console.error('密码重置过程出错:', error);
        ElMessage.error('网络异常，请检查网络连接后重试');
      }
    } else {
      ElMessage.warning('修改密码表单验证失败');
    }
  });
};
</script>

<style scoped>
/* 背景样式 */
.login-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #ffffffff;/*#f9fbfc;*/
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.5s ease;
  overflow: hidden;
}

/* 欢迎界面样式 */
.welcome-box {
  position: absolute;
  top: 50%;
  left: 50%;
  width:100%;
  height:20%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  //color: #626062;
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;
  text-align: center;
}

/* 欢迎界面上移动画 */
.welcome-box--moved {
  top: 10%;
  transform: translate(-50%, -50%);
  opacity: 0.9;
}

.welcome-box__title {
  font-size: 4rem;
  font-weight: 700;
  height:70%;
  margin-bottom: 0rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.welcome-box__desc {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 600px;
  padding: 0 20px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
}

.welcome-box__hint {
  font-size: 0.9rem;
  opacity: 0.8;
  animation: pulse 2s infinite;
}

/* 表单容器样式 */
.form-container {
  position: absolute;
  top: 47%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.form-container-register {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
}
/* 表单卡片基础样式 */
.form-card {
  width: 480px;
  border-radius: 12px;
  padding: 2rem;
  overflow: hidden;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

/* 表单卡片激活状态（显示） */
.form-card--active {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

/* 表单项间距调整 */
.el-form-item {
  margin-bottom: 1.2rem;
}

/* 链接按钮样式 */
.form-card__link {
  background: none;
  border: none;
  color: #626062;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.form-card__link:hover {
  color:  #5b247f;
}

/* 核心样式：设置表单项占90%宽度并水平居中 */
.centered-form-item {
  margin-left: auto;  /* 水平居中 */
  margin-right: auto;
  margin-bottom: 1.2rem;  /* 表单项之间的间距 */
}

/* 保持按钮组样式 */
.button-group {
  margin-top: 10px;
}

.text-right {
  text-align: right;
}

.form-card__link {
  width: auto;
}

/* 登录按钮占满宽度 */
.form-card__submit {
  width: 100%;
}

/* 提交按钮样式 */
.form-card__submit {
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
  border: none;
  transition: all 0.3s ease;
}

.form-card__submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(91,36,127, 0.3);
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
}

/* 头像上传行样式 */
.avatar-upload-row {
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1.2rem;
}

.avatar-row {
  width: 100%;
  align-items: center; /* 垂直居中对齐 */
}

/* 头像预览框样式 */
.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 1px dashed #b994fe;
  overflow: hidden;
  position: relative;
  background-color: #ffffffff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持比例填充 */
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.avatar-icon {
  font-size: 24px;
}

/* 上传按钮样式 */
.avatar-uploader {
  width: 100%;
}

.upload-button {
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
  border: none;
  transition: all 0.3s ease;
}
.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(91,36,127, 0.3);
  background: linear-gradient(135deg, #b994fe 0%, #8e47bdff 100%);
}

.upload-hint {
  margin-top: 8px;
  font-size: 0.8rem;
  color: #909399;
  margin-bottom: 0;
}

/* 验证码行样式 */
.verification-row {
  width: 100%;
}

/* 动画定义 */
@keyframes pulse {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.8;
  }
}
</style>
