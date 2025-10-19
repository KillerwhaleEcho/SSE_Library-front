import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAdminDetail,
  updateAdminProfile,
  type AdminProfile,
  type AdminDetailResponse,
  type AdminUpdatePayload,
} from '../api/admin'

const STORAGE_KEY = 'adminInfo'
const storage = typeof window === 'undefined' ? null : window.localStorage
// typeof window === 'undefined' - 检查 window 对象是否存在，在 浏览器环境 中，window 对象存在


const fallbackAdminInfo: AdminProfile = {
  userId: 0,
  username: 'Sample Admin',
  userAvatar: '',
  status: 'active',
  createTime: '2024-01-01',
  email: 'admin@example.com',
  role: 'admin',
}

export const useAdminStore = defineStore('admin', () => {
  const adminInfo = ref<AdminProfile | null>(null)
  const loading = ref(false)
  const error = ref('')
  const password = ref('')
  const collectionList = ref<AdminDetailResponse['collectionList']>([])
  const historyList = ref<AdminDetailResponse['historyList']>([])

  const hydrateFromStorage = () => {
    if (!storage) return
    const cached = storage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        adminInfo.value = JSON.parse(cached) as AdminProfile
      } catch {
        storage.removeItem(STORAGE_KEY)
      }
    }
  }

  const startFetch = () => {
    loading.value = true
    error.value = ''
  }

  const finishFetch = () => {
    loading.value = false
  }

  const persist = () => {
    if (storage && adminInfo.value) {
      storage.setItem(STORAGE_KEY, JSON.stringify(adminInfo.value))
    }
  }

  const ensureUserId = (): number | null => {
    const cachedUserId = storage?.getItem('userId')
    if (!cachedUserId) return null
    const parsed = Number(cachedUserId)
    return Number.isNaN(parsed) ? null : parsed
  }

  const applyDetail = (detail: AdminDetailResponse) => {
    adminInfo.value = detail.userBrief
    password.value = detail.password ?? ''
    collectionList.value = detail.collectionList ?? []
    historyList.value = detail.historyList ?? []
    persist()
  }

  const fetchAdminInfo = async (force = false) => {
    if (adminInfo.value && !force) return adminInfo.value

    const userId = ensureUserId()
    if (!userId) {
      error.value = ''
      adminInfo.value = fallbackAdminInfo
      password.value = ''
      collectionList.value = []
      historyList.value = []
      persist()
      return adminInfo.value
    }

    startFetch()
    try {
      const response = await getAdminDetail(userId)
      applyDetail(response.data)
      return adminInfo.value
    } catch (err: any) {
      error.value = err?.message || '获取管理员信息失败'
      if (!adminInfo.value) {
        adminInfo.value = fallbackAdminInfo
        password.value = ''
        collectionList.value = []
        historyList.value = []
        persist()
      }
      throw err
    } finally {
      finishFetch()
    }
  }

  const clearAdminInfo = () => {
    adminInfo.value = null
    password.value = ''
    collectionList.value = []
    historyList.value = []
    storage?.removeItem(STORAGE_KEY)
  }

  const updateAdminInfo = async (payload: AdminUpdatePayload) => {
    const userId = adminInfo.value?.userId ?? ensureUserId()
    if (!userId) {
      throw new Error('未获取到有效的用户ID')
    }

    const response = await updateAdminProfile(userId, payload)
    const current = adminInfo.value ?? fallbackAdminInfo

    adminInfo.value = {
      ...current,//对象展开语法 ... 的作用：复制 current 对象的所有属性到新对象
      username: response.data.userName ?? current.username,
      userAvatar: response.data.userAvatar ?? current.userAvatar,
      email: response.data.email ?? current.email,
    }

    if (response.data.password) {
      password.value = response.data.password
    }

    persist()
    return response.data
  }

  hydrateFromStorage()

  return {
    adminInfo,
    password,
    collectionList,
    historyList,
    loading,
    error,
    fetchAdminInfo,
    clearAdminInfo,
    updateAdminInfo,
  }
})
