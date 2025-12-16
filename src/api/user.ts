import service from '../utils/service'
import request from '../utils/request'
import type { InfoBrief, UserBrief } from './all'

interface ApiResponse<T = any> {
  code: number
  message?: string
  data: T
}

interface LoginParams {
  email: string
  password: string
}

interface RegisterParams {
  email: string
  username: string
  userAvatar: string
  password: string
  Code: string
}

export interface UserAll {
  userBrief: UserBrief
  password: string
  collectionList: InfoBrief[] | null
  historyList: InfoBrief[] | null
}

export const loginAPI = (data: LoginParams): Promise<ApiResponse<{
  token: string
  user: {
    userId: number
    username: string
    userAvatar: string
    status: string
    createTime: string
    email: string
    role: string
  }
}>> => {
  return request({
    url: '/login',
    method: 'post',
    data
  })
}

export const registerAPI = (data: RegisterParams): Promise<ApiResponse<{
  userId: number
  username: string
  userAvatar: string
  status: string
  createTime: string
  email: string
  role: string
}>> => {
  return request({
    url: '/register',
    method: 'post',
    data
  })
}


export const sendEmailCode = (email: string, usage: string): Promise<{
  code: number;
  message: string;
  data: {
    success: boolean;
  };
}> => {
  return request({
    url: '/VCode',
    method: 'post',
    data: {
      email,
      usage
    }
  })
}

export const resetPasswordAPI = (data: {
  email: string;
  newPassword: string;
  Code: string;
}): Promise<ApiResponse<{ success: boolean }>> => {
  return request({
    url: '/Password',
    method: 'put',
    data
  })
}

export const getUserAll = (userId: number | string): Promise<ApiResponse<UserAll>> => {
  return service.get(`/user/${userId}`)
}

// 获取用户上传的文档列表
export const getUserUploadDoc = (userId: number | string): Promise<ApiResponse<InfoBrief[]>> => {
  return service.get('/user/document', {
    params: { userId }
  })
}