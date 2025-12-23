import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginAPI, registerAPI, sendEmailCode,  resetPasswordAPI } from '../api/user'



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

export const useAuthStore = defineStore('auth', () => {
const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const login = async (email: string, password: string) => {
    try {
      const response = await loginAPI({
        email,
        password
      })

      if (response.code === 200) {
        token.value = response.data.token
        userInfo.value = {
          userId: response.data.user.userId ?? 0,
          username: String(response.data.user.username ?? ''),
          userAvatar: response.data.user.userAvatar,
          status: response.data.user.status,
          email: response.data.user.email,
          role: response.data.user.role,
          createTime: response.data.user.createTime,
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

  const register = async (data: FormData) => {
    try {
      const response = await registerAPI(data)

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

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('admin_token')
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
    logout,
    clearToken
  }
})