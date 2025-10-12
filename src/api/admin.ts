import request from '../utils/request'

interface ApiResponse<T = any> {
  code: number
  message?: string
  data: T
}

export interface AdminProfile {
  userId: number
  username: string
  userAvatar: string
  status: string
  email: string
  role: string
  createTime: string
}

export const fetchAdminProfile = (): Promise<ApiResponse<AdminProfile>> => {
  return request({
    url: '/admin/info',
    method: 'get',
  })
}
