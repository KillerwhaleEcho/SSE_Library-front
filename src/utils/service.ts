import { useAuthStore } from '../stores/auth'
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  type AxiosResponse
} from 'axios'
import { ElLoading, ElMessage } from 'element-plus'
import router from '../router'

// 创建axios实例 进行基本参数配置
const service = axios.create({
  // 使用相对路径，让Vite代理处理跨域
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  // 设置接口访问超时时间
  timeout: 10000, // request timeout，
  // 跨域时候允许携带凭证
  withCredentials: true,
})

let loadingInstance: any = null // 用于存储loading实例
let pendingRequests = 0 // 记录当前正在进行的请求数

// 用于存储请求的Map
const pendingMap = new Map<string, Function>()

// 生成请求的唯一key
const generateRequestKey = (config: AxiosRequestConfig): string => {
  const { url, method, params, data } = config
  return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&')
}

// 添加请求到pendingMap
const addPending = (config: AxiosRequestConfig): void => {
  const requestKey = generateRequestKey(config)
  config.cancelToken = config.cancelToken || new axios.CancelToken((cancel) => {
    if (!pendingMap.has(requestKey)) {
      pendingMap.set(requestKey, cancel)
    }
  })
}

// 从pendingMap中移除请求
const removePending = (config: AxiosRequestConfig): void => {
  const requestKey = generateRequestKey(config)
  if (pendingMap.has(requestKey)) {
    const cancel = pendingMap.get(requestKey)
    if (cancel) {
      cancel(requestKey)
      pendingMap.delete(requestKey)
    }
  }
}

// 清空pendingMap中的请求
const clearPending = (): void => {
  for (const [requestKey, cancel] of pendingMap) {
    cancel(requestKey)
  }
  pendingMap.clear()
}

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 检查是否存在重复请求，若存在则取消已发的请求
    removePending(config)
    // 将当前请求添加到pendingMap
    addPending(config)

    pendingRequests++ // 请求数 +1

    if (!loadingInstance) {
      loadingInstance = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)',
      })
    }

    // 处理 token
    const userStore = useAuthStore()
    let token = userStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    pendingRequests-- // 请求失败也要减少计数
    if (pendingRequests === 0 && loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 从pendingMap中移除请求
    removePending(response.config)

    pendingRequests-- // 请求完成，计数减 1

    if (pendingRequests === 0 && loadingInstance) {
      // 只有最后一个请求返回时才关闭 loading
      loadingInstance.close()
      loadingInstance = null
    }

    const { code, message, data } = response.data

    // 根据后端约定的状态码进行处理
    if (code !== 200 && code !== 0) {
      // 显示错误信息
      ElMessage.error(message || '请求失败')

      // 特定错误码处理
      switch (code) {
        case 401: // 未授权或token过期
          const userStore = useAuthStore()
          //userStore.clearToken()
          router.push('/login')
          break
        case 403: // 权限不足
          ElMessage.warning('权限不足，无法访问')
          break
        case 404: // 资源不存在
          ElMessage.warning('请求的资源不存在')
          break
        case 500: // 服务器错误
          ElMessage.error('服务器错误，请稍后重试')
          break
        default:
          // 其他错误码处理
          break
      }

      // 返回错误信息，让调用方能够进一步处理
      return Promise.reject(new Error(message || `Error: code ${code}`))
    }

    // 正常返回数据
    return response.data
  },
  (error: any) => {
    // 如果是取消请求的错误，直接返回
    if (axios.isCancel(error)) {
      console.log('请求被取消:', error.message)
      pendingRequests-- // 请求取消，计数减 1
      return Promise.reject(error)
    }

    // 从pendingMap中移除请求
    if (error.config) {
      removePending(error.config)
    }

    pendingRequests-- // 请求失败，计数减 1

    if (pendingRequests === 0 && loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }

    // 处理HTTP错误状态码
    let message = '网络连接异常，请稍后重试'

    if (error.response) {
      const status = error.response.status

      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 清除用户信息并跳转到登录页
          const userStore = useAuthStore()
          //userStore.clearToken()
          router.push('/login')
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 408:
          message = '请求超时'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 501:
          message = '服务未实现'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = `请求失败(${status})`
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      message = '服务器无响应'
    } else {
      // 请求配置错误
      message = '请求配置错误'
    }

    // 超时错误特殊处理
    if (error.code === 'ECONNABORTED' && error.message && error.message.includes('timeout')) {
      message = '请求超时，请检查网络'
    }

    // 网络错误特殊处理
    if (!window.navigator.onLine) {
      message = '网络已断开，请检查网络连接'
    }

    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default service
