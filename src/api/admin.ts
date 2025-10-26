import request from '../utils/request'

interface ApiResponse<T = any> {
  code: number
  message?: string
  data: T
}

export interface UserBrief {
  userId: number
  username: string
  userAvatar: string
  status: string
  createTime: string
  email: string
  role: string
}

export interface DocumentBrief {
  infoBrief: {
    name: string
    document_id: number
    type: string
    uploadTime: string
    status: string
    category: string
    collections: number
    readCounts: number
    URL: string
  }
  bookISBN: string
  author: string
  uploader: UserBrief
  Cover: string
  tags: string[]
  introduction: string
  createYear: string
}

export interface AdminDetailResponse {
  userBrief: UserBrief
  collectionList?: DocumentBrief[]
  historyList?: DocumentBrief[]
}

export interface AdminUpdatePayload {
  userName?: string | null
  userAvatar?: string | Blob | null
  email?: string | null
}

export interface AdminUpdateResponse {
  userBrief: UserBrief
}

export interface AdminPasswordPayload {
  email: string
  newPassword: string
}

export interface AdminPasswordResponse {
  success: boolean
}

export const getAdminDetail = (
  userId: string
): Promise<ApiResponse<AdminDetailResponse>> => {
  return request({
    url: `/user/${userId}`,
    method: 'get',
  })
}

export const getAdminUserList = (): Promise<ApiResponse<UserBrief[]>> => {
  return request({
    url: '/admin/users',
    method: 'get',
  })
}

export const updateAdminProfile = (
  userId: string,
  data: AdminUpdatePayload
): Promise<ApiResponse<AdminUpdateResponse>> => {
  return request({
    url: `/user/${userId}`,
    method: 'put',
    data,
  })
}

export const updateAdminPassword = (
  data: AdminPasswordPayload,
): Promise<ApiResponse<AdminPasswordResponse>> => {
  return request({
    url: '/user/Password',
    method: 'put',
    data,
  })
}

export interface UpdateUserStatusPayload {
  userId: number
  status: 'active' | 'disabled'
}

export const updateUserStatus = (
  payload: UpdateUserStatusPayload
): Promise<ApiResponse<UserBrief>> => {
  return request({
    url: '/admin/user',
    method: 'put',
    data: payload,
  })
}
