import service from '../utils/service'
import request from '../utils/request'

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
  role: "user"
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


export const sendEmailCode = (email: string): Promise<{
  code: number;
  message: string;
  data: {
    success: boolean;
  };
}> => {
  return request({
    url: '/getCode',
    method: 'post',
    data: { 
      email,
      //type: 0 // 0: 验证码邮件
    }
  })
}

export const verifyEmailCode = (email: string, code: string): Promise<{
  code: number;
  message: string;
  data: null;
}> => {
  return request({
    url: '/verifyCode',
    method: 'post',
    data: { email, code }
  })
}
