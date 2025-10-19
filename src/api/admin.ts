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

export interface AdminProfile extends UserBrief {}

export interface AdminDocumentBrief {
  infoBrief: {
    name: string
    document_id: number
    type: string
    uploadTime: string
    status: string
    category: string
    course: string
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
  password: string
  collectionList: AdminDocumentBrief[]
  historyList: AdminDocumentBrief[]
}

export interface AdminUpdatePayload {
  userName?: string
  userAvatar?: string
  email?: string
  password?: string
}

export interface AdminUpdateResponse {
  userName: string
  userAvatar: string
  email: string
  password: string
}

export const getAdminDetail = (
  userId: number
): Promise<ApiResponse<AdminDetailResponse>> => {
  return request({
    url: `/user/${userId}`,
    method: 'get',
  })
}

export const updateAdminProfile = (
  userId: number,
  data: AdminUpdatePayload
): Promise<ApiResponse<AdminUpdateResponse>> => {
  return request({
    url: `/user/${userId}/change`,
    method: 'post',
    data,
  })
}
