//写接口时如果用request拿到的是res.data响应体，如果用service那拿到的是完整的响应，得res.data才能拿到响应体
import request from "../utils/request";
import service from "@/utils/service.ts";
import { type UserBrief } from "./all.ts";
import { type InfoBrief, type User } from "./all.ts";

interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
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

//获取管理员信息
export const getAdminDetail = (userId: string): Promise<User> => {
  return request({
    url: `/user/${userId}`,
    method: "get",
  });
};

//更新管理员信息相关
//经过测试后端返回的data里没有再嵌套一层userBrief，和前端一致
export type AdminUpdatePayload =
  | {
      userName?: string | null;
      userAvatar?: string | null;
      email?: string | null;
    }
  | FormData;


export const updateAdminProfile = (
  userId: string,
  data: AdminUpdatePayload,
): Promise<ApiResponse<UserBrief>> => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return service({
    url: `/user/${userId}`,
    method: "put",
    data,
    headers: isFormData
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' },
  });
};

//更改用户状态相关
export interface UpdateUserStatusPayload {
  userId: number;
  status: "active" | "disabled";
}

export const updateUserStatus = (
  payload: UpdateUserStatusPayload,
): Promise<ApiResponse<UserBrief>> => {
  return request({
    url: "/admin/user",
    method: "put",
    params: payload,
  });
};

//管理员获取用户列表
export const getUserList = (): Promise<ApiResponse<UserBrief[]>> => {
  return request({
    url: "/admin/usersList",
    method: "get",
  });
};


//管理员删除评论
export const deleteAdminComment = (documentId: number): Promise<ApiResponse<unknown>> => {
  return request({
    url: "/admin/comment",
    method: "delete",
    params: {
      document_id: documentId,
    },
  });
};
