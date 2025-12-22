import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginAPI, registerAPI, sendEmailCode, resetPasswordAPI, getUserAll, type UserAll } from '../api/user'



interface UserInfo {
  userId: number
  username: string
  userAvatar: string
  status: string
  email: string
  role: string
  createTime: string

  password?: string
  collectionList?: documentInfo[]
  historyList?: documentInfo[]
}

interface documentInfo {
  name: string
  document_id: number
  url: string
  type: string
  uploadTime: string
  status: string
  category: string
  collections: number
  readCounts: number

  uploader?: UserInfo
  bookISBN?: string
  author?: string
  cover?: string
  introduction?: string
  tags?: string[]
  createYear?: string
}

const normalizeUserBrief = (user: Partial<UserInfo> | Partial<UserAll['userBrief']> | null | undefined): UserInfo | null => {
  if (!user) return null
  return {
    userId: Number(user.userId ?? 0),
    username: String(user.username ?? ''),
    userAvatar: String(user.userAvatar ?? ''),
    status: String(user.status ?? 'active'),
    email: String(user.email ?? ''),
    role: String(user.role ?? ''),
    createTime: String(user.createTime ?? ''),
  }
}

const loadUserBriefFromStorage = (): UserInfo | null => {
  const stored = localStorage.getItem('userBrief')
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored) as Partial<UserInfo>
    return normalizeUserBrief(parsed)
  } catch (error) {
    console.warn('Failed to parse stored userBrief:', error)
    return null
  }
}


export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(loadUserBriefFromStorage())

  const persistUserBrief = (brief: UserInfo | null) => {
    if (!brief) return
    userInfo.value = brief
    localStorage.setItem('userBrief', JSON.stringify(brief))
    localStorage.setItem('userId', String(brief.userId ?? ''))
    localStorage.setItem('role',String(brief.role??''))
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await loginAPI({
        email,
        password
      })

      if (response.code === 200) {
        token.value = response.data.token
        const brief = normalizeUserBrief(response.data.user)
        if (brief) {
          persistUserBrief(brief)
        }
        localStorage.setItem('token', response.data.token)
        return { success: true, data: response.data }
      } else {
        return {
          success: false,
          message: response.message || '登录失败'
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return {
        success: false,
        message: '网络错误，请稍后重试'
      }
    }
  }

  const register = async (data: {
    username: string
    email: string
    password: string
    userAvatar: string
  }) => {
    try {
      // 处理角色映射（前端mentor对应后端tutor）
      const requestData = {
        username: data.username,
        email: data.email,
        password: data.password,
        userAvatar: data.userAvatar,
      }

      const response = await registerAPI(requestData)

      if (response.code === 200) {
        return {
          success: true,
          data: response.data
        }
      } else {
        return {
          success: false,
          message: response.message || '注册失败'
        }
      }
    } catch (error) {
      console.error('注册失败:', error)
      return {
        success: false,
        message: '网络错误，请稍后重试'
      }
    }
  }

  const sendEmailCodeAction = async (email: string) => {
    try {
      const response = await sendEmailCode(email)
      return response.code === 200;
    } catch (error) {
      console.error('发送验证码失败:', error)
      throw error
    }
  }

  // 在useAuthStore中添加
  const resetPasswordAction = async (data: {
    email: string;
    newPassword: string;
  }) => {
    try {
      const response = await resetPasswordAPI(data)
      if (response.code === 200) {
        return {
          success: true,
          message: '密码重置成功'
        }
      } else {
        return {
          success: false,
          message: response.message || '密码重置失败'
        }
      }
    } catch (error) {
      console.error('密码重置失败:', error)
      return {
        success: false,
        message: '请稍后重试'
      }
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userBrief')
    localStorage.removeItem('userId')
    localStorage.removeItem('role')
  }

  const refreshUserBrief = async () => {
    const targetUserId = userInfo.value?.userId || Number(localStorage.getItem('userId') || 0)
    if (!targetUserId) {
      return { success: false, message: '暂无可刷新用户信息' }
    }

    try {
      const response = await getUserAll(targetUserId)
      if (response.code === 200 && response.data?.userBrief) {
        const brief = normalizeUserBrief(response.data.userBrief)
        if (brief) {
          persistUserBrief(brief)
          return { success: true, data: brief }
        }
      }
      return { success: false, message: response.message || '刷新用户信息失败' }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      return { success: false, message: '刷新用户信息失败' }
    }
  }

  // 供组件直接调用的简洁别名
  const clearToken = () => {
    logout()
  }

  return {
    token,
    userInfo,
    login,
    register,
    sendEmailCode: sendEmailCodeAction,
    resetPassword: resetPasswordAction,
    logout,
    clearToken,
    refreshUserBrief
  }
})