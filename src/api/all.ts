import service from '../utils/service'
import request from '../utils/request'
import { useRadio } from 'element-plus/es/components/radio/src/use-radio.mjs'

export interface ApiResponse<T = any> {
  code: number
  message?: string
  data: T
}


// 用户相关类型

export interface UserBrief {
  userId: number;
  username: string;
  userAvatar: string;
  status: 'active' | 'banned';
  createTime: string;
  email: string;
  role: 'user' | 'admin';
}

export interface User {
  userBrief:UserBrief

  password?: string; // 仅用于注册和登录
  collectionList?: Document[]; // 用户收藏的书籍/文件
  historyList?: Document[]; // 用户浏览历史
}

// 评论相关类型
export interface Comment {
  commentId: number;
  content: string;
  commenter: User;
  document: Document;
  create_at: string;
}
export interface DocumentComment {
  commentId: number;
  parentId?: number | null;
  commenter: UserBrief;
  document: InfoBrief;
  createdAt: string;
  content: string | null;
}

// 书籍/文件相关类型
export interface InfoBrief {
  documentId: number;
  name: string;
  type: 'book' | 'file' | 'video' | null;
  uploadTime: string;
  status: '开放' | '审核中' | '关闭' | '已撤回'
  category?: string;
  collections: number;
  readCounts: number;
  URL: string;
}
export interface Document {
  infoBrief: InfoBrief;
  bookISBN?: string;
  author?: string;
  uploader?: UserBrief;
  cover?: string;
  tags?: string[];
  introduction?: string;
  createYear?: string;
}

export interface UploadFile {
  file: File,
  cover: File,
  categoryId: number,
  type: 'book' | 'file' | 'video',
  name: string,
  ISBN: string,
  tags: string[],
  author: string | '默认佚名',
  createYear: string | '未知',
  uploaderId: number | null,
  uploadTime: Date | null,
  introduction: string | '无',
  videoURL: string | '无'
}

// 分类相关类型
export interface Category {
  id: number;
  name: string;
  is_course: boolean;
  fileCounts: number;
  readCounts: number;
  description?: string;
  parent_id?: number;
  children?: Category[];
}

export interface message
  {
  sessionId: number;
  senderId: number;
  sendTime: string;
  senderName: string;
  senderAvatar: string;
  content: string;
    status: '已发送'|'未读'|'未接收'
  }

export interface chatBox{
      sessionId: number,
    userId1: number,
    userAvatar1: string,
    userName1: string,
    userId2: number,
    userAvatar2:string,
    userName2: string,
  lastMessage: string,
    lastTime: string,
    unreadCount: number
}


// 3.1 获取分类和课程
export const getCategoriesAndCourses = (is_suggest?: boolean) => {
  return service.get<ApiResponse<{ categories: Category[] }>>('/category', {
    params: { is_suggest }
  });
};

// 3.2 获取热门分类
export const getHotCategories = (count?: number) => {
  return service.get<ApiResponse<{ categories: Category[] }>>('/user/hotCategories', {
    params: { count }
  });
};
//3.3 获取所有分类
export const getAllCategories = () => {
  return service.get<ApiResponse<{ categories: Category[] }>>('/category', {
    params: {}
  });
};
//3.4 获取热门书籍/文件
export const getHotDocuments = () => {
  return service.get<ApiResponse<{ documents: Document[] }>>('/documents', {
    params: { is_suggest: true, categoryId: undefined }
  });
};


// 4. 上传资料
export const uploadFile = (data: UploadFile) => {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('name', data.name);
  if (data.description) formData.append('description', data.description);
  if (data.categoryId) formData.append('categoryId', data.categoryId);
  return service.post<ApiResponse<{ fileId: string }>>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 5. 获取书籍列表
export const getBookList = (is_suggest: boolean, categoryId?: number) => {
  return service.get<ApiResponse<{ documents: Document[] }>>('/documents', {
    params: { is_suggest, categoryId },
  });
};

// 6. 修改资料信息
export const updateFileInfo = (fileId: string, data: { name?: string; description?: string; categoryId?: string }) => {
  return service.put<ApiResponse<null>>(`/files/${fileId}`, data);
};

// 7. 搜索书籍或文件
export const searchBooksOrFiles = (
  type: 'book' | 'file' | 'video' | 'null',
  categoryId: number | null,
  year: string | null,
  keyType: string | null,
  keyword: string | null,
) => {
  return service.get<ApiResponse<{ documents: Document[] }>>('/searchdoc', {
    params: { type, categoryId, year, keyType, keyword },
  });
};


// 10. 搜索分类和课程
export const searchCategoriesAndCourses = (keyword: string, params?: { page?: number; pageSize?: number }) => {
  return service.get<ApiResponse<{ categories: Category[]; courses: any[]; total: number }>>('/categoriesAndCourses/search', {
    params: { keyword, ...params },
  });
};

// 11.发送消息,接口名加上interface避免重名
export const sendMessageInterface = (sessionId:number,receiverId:number,content :string) => {
  return service.post<ApiResponse<{ senssionId: number, receiverId: number, content: string }>>('/char/send', { sessionId, receiverId, content })
}

//获取聊天回话列表
export const getSessionList = (userId: number) => {
  return service.get<ApiResponse<chatBox[]>>('/chat/sessions', {params:{ userId } })
}


//获取聊天记录
export const getMessageList = (sessionId:number,userId:number) => {
  return service.get<ApiResponse<message[]>>('/chat/messages', { params: { sessionId, userId } })
}

// 获取用户的详细信息
export const getUserDetail = (userId: string) => {
  return service.get<User>(`/user/${userId}`)
}
