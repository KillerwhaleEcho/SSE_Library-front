import { defineStore } from 'pinia'
import { ref } from 'vue'
import { searchAdminProfiles, type AdminProfile } from '../api/admin'

const STORAGE_KEY = 'adminInfo'
const storage = typeof window === 'undefined' ? null : window.localStorage

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

  const fetchAdminInfo = async (force = false) => {
    if (adminInfo.value && !force) return adminInfo.value

    const userId = ensureUserId()
    if (!userId) {
      error.value = '未找到管理员账号，请重新登录'
      adminInfo.value = null
      return Promise.reject(new Error(error.value))
    }

    startFetch()
    try {
      const response = await searchAdminProfiles({ userId })
      const profile = response.data?.[0]

      if (!profile) {
        throw new Error('未获取到管理员信息')
      }

      adminInfo.value = profile
      persist()
      return profile
    } catch (err: any) {
      error.value = err?.message || '获取管理员信息失败'
      if (!adminInfo.value) {
        adminInfo.value = fallbackAdminInfo
        persist()
      }
      throw err
    } finally {
      finishFetch()
    }
  }

  const clearAdminInfo = () => {
    adminInfo.value = null
    storage?.removeItem(STORAGE_KEY)
  }

  const updateAdminInfo = (payload: Partial<AdminProfile>) => {
    if (!adminInfo.value) {
      adminInfo.value = { ...fallbackAdminInfo, ...payload }
    } else {
      adminInfo.value = { ...adminInfo.value, ...payload }
    }
    persist()
  }

  hydrateFromStorage()

  return {
    adminInfo,
    loading,
    error,
    fetchAdminInfo,
    clearAdminInfo,
    updateAdminInfo,
  }
})
