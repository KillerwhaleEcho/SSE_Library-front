import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAdminDetail,
  updateAdminProfile,
  updateAdminPassword,
  type UserBrief,
  type AdminDetailResponse,
  type AdminUpdatePayload,
  type AdminPasswordPayload,
} from '../api/admin'

const STORAGE_KEY = 'adminInfo'
const storage = typeof window === 'undefined' ? null : window.localStorage
// typeof window === 'undefined' - 检查 window 对象是否存在，在 浏览器环境 中，window 对象存在


const fallbackAdminInfo: UserBrief = {
  userId: 0,
  username: 'Sample Admin',
  userAvatar: '',
  status: 'active',
  createTime: '2024-01-01',
  email: 'admin@example.com',
  role: 'admin',
}

export const useAdminStore = defineStore('admin', () => {
  const adminInfo = ref<UserBrief | null>(null)
  const loading = ref(false)
  const error = ref('')
  const collectionList = ref<AdminDetailResponse['collectionList']>([])
  const historyList = ref<AdminDetailResponse['historyList']>([])
// <AdminDetailResponse['collectionList']> 是 TypeScript 的泛型，它使用了索引访问类型（indexed access type）来获取 AdminDetailResponse 类型中的 collectionList 属性的类型。


  //从存储中水合/激活
  const hydrateFromStorage = () => {
    if (!storage) return
    const cached = storage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        adminInfo.value = JSON.parse(cached) as UserBrief
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

  //从存储中回去ID,getItem会返回一个string||null的值
  const ensureUserId = (): string | null => {
    const cachedUserId = storage?.getItem('userId')
    if (!cachedUserId) return null
    return cachedUserId
  }

  // 把后端返回的信息应用
  const applyDetail = (detail: AdminDetailResponse) => {
    adminInfo.value = detail.userBrief//两个是一样的
    collectionList.value = detail.collectionList ?? []
    historyList.value = detail.historyList ?? []
    persist()
  }

  const fetchAdminInfo = async (force = false) => {
    if (adminInfo.value && !force) return adminInfo.value
// 这个force是一个强制刷新开关。fetchAdminInfo的默认逻辑是如果adminInfo已经有数据那就直接返回缓存避免重复请求，但是如果传入true就会绕过这段缓存判断，强制请求最新数据

    const userId = ensureUserId()
    if (!userId) {
      error.value = ''
      adminInfo.value = fallbackAdminInfo
      // collectionList.value = []  感觉是多余的
      // historyList.value = []
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
    collectionList.value = []
    historyList.value = []
    storage?.removeItem(STORAGE_KEY)
  }

  const updateAdminInfo = async (payload: AdminUpdatePayload) => {
    const sourceUserId = adminInfo.value?.userId ?? ensureUserId()
    if (
      sourceUserId === null ||
      sourceUserId === undefined ||
      (typeof sourceUserId === 'string' && sourceUserId.trim() === '')
    ) {
      throw new Error('未获取到有效的用户ID')
    }

    //如果是从adminInfo里取出来的ID就是number类型，如果从ensureUserId中获得的就是string类型，所以这段代码是有用的
    const userId = String(sourceUserId)

    //规范化处理，只处理不为空的字段，undefined和null一律置为null
    const normalized: AdminUpdatePayload = {}
    if ('userName' in payload) {
      normalized.userName = payload.userName ?? null
    }
    if ('userAvatar' in payload) {
      normalized.userAvatar = payload.userAvatar ?? null
    }
    if ('email' in payload) {
      normalized.email = payload.email ?? null
    }


    const response = await updateAdminProfile(userId, normalized)
    const updated = response.data.userBrief
    if (!updated) {
      throw new Error('资料更新失败：缺少返回的用户数据')
    }

    adminInfo.value = updated
    persist()
    return response.data
  }

  const updatePassword = async (payload: AdminPasswordPayload) => {
    const response = await updateAdminPassword(payload)
    if (!response.data?.success) {
      throw new Error(response.message || '密码更新失败')
    }
    return response.data
  }

  hydrateFromStorage()

  return {
    adminInfo,
    collectionList,
    historyList,
    loading,
    error,
    fetchAdminInfo,
    clearAdminInfo,
    updateAdminInfo,
    updatePassword,
  }
})
