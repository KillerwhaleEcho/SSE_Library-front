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

export interface AdminSearchParams {
  username?: string
  userId?: number
}

export const searchAdminProfiles = (
  params: AdminSearchParams
): Promise<ApiResponse<AdminProfile[]>> => {
  return request({
    url: '/admin/users',
    method: 'get',
    params,
  })
}
