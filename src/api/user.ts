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
  username: string
  email: string
  password: string
  userAvatar: string
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
  email: string
  userId: number
  username: string
  userAvatar: string
  status: string
  createTime: string
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
    CodeId: number;
  };
}> => {
  return request({
    url: '/VCode',
    method: 'post',
    data: {
      email,
      //type: 0 // 0: 验证码邮件
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
  return request({
    url: `/user/${userId}`,
    method: 'get',
  })
}