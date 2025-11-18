import request from '../utils/request'
import { type InfoBrief, type User, type Document } from './all.ts'

interface ApiResponse<T = any> {
  code: number
  message?: string
  data: T
}

//all.ts中没有这个，但是获取管理员信息是需要使用故添加
export interface UserBrief {
  userId: number
  username: string
  userAvatar: string
  status: string
  createTime: string
  email: string
  role: string
}


// 呈现管理员信息时的数据接口
export type UserRow = {
  id: number;
  name: string;
  email: string;
  status: string;
};

// 在呈现评论时document的类型是Infobrief而不是完整的资料信息,所以添加这个接口
export interface CommentItem {
  commentId: number;
  content: string;
  commenter: UserBrief;
  document: InfoBrief;
  create_at: string;
}




// 以下是接口部分



//获取管理员信息相关
export const getAdminDetail = (
  userId: string
): Promise<User> => {
  return request({
    url: `/user/${userId}`,
    method: 'get',
  })
  // 返回的是request实例，这个实例在截拦器里返回的是整个后端响应对象，（通常包含 code、message、data），若要拿到用户详情，还需要 response.data。
}



//更新管理员信息相关
export interface AdminUpdatePayload {
  userName?: string | null
  userAvatar?: string | Blob | null
  email?: string | null
}

export interface AdminUpdateResponse {
  userBrief: UserBrief
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

//更新密码相关
export interface AdminPasswordPayload {
  email: string
  newPassword: string
  code:string
}

export interface AdminPasswordResponse {
  success: boolean
}

export const updateAdminPassword = (
  data: AdminPasswordPayload,
): Promise<ApiResponse<AdminPasswordResponse>> => {
  return request({
    url: '/Password',
    method: 'put',
    data,
  })
}

//更改用户状态相关
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


//管理员获取用户列表
export const getUserList = (): Promise<ApiResponse<UserBrief[]>> => {
  return request({
    url: '/admin/usersList',
    method: 'get',
  })
}

//管理员获取评论列表
export type CommentListResponse = ApiResponse<CommentItem[]>

export const getAdminComments = (): Promise<CommentListResponse> => {
  return request({
    url: '/admin/comments',
    method: 'get',
  })
}



//管理员删除评论
export const deleteAdminComment = (documentId: number): Promise<ApiResponse<unknown>> => {
  return request({
    url: '/admin/comment',
    method: 'delete',
    params: {
      document_id: documentId,
    },
  })
}