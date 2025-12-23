import { my } from 'element-plus/es/locales.mjs'
import service from '../utils/service'
import type { DocumentEditForm } from '@/types/api'
import { useId } from 'vue'

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
  status: 'active' | 'disabled';
  createTime: string;
  email: string;
  role: string;
}

export interface User {
  userBrief?: UserBrief;

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

export type CommentSourceType = 'document' | 'post'

export interface CommentSourceData {
  sourceId: number
  name: string
  sourceType: CommentSourceType | string
}

export interface DocumentComment {
  commentId: number;
  parentId?: number | null;
  commenter: UserBrief;
  document?: InfoBrief;
  sourceData?: CommentSourceData | null;
  createdAt: string;
  content: string | null;
}

export type FavoriteTargetType = 'document' | 'post'

export interface FavoriteActionPayload {
  userId: number
  sourceId: number
  type: FavoriteTargetType
}

export interface PostLikePayload {
  userId: number
  postId: number
}

// 书籍/文件相关类型
export interface InfoBrief {
  documentId: number;
  name: string;
  type: 'book' | 'file' | 'video' | null;
  uploadTime: string;
  status: 'open' | 'closed' | 'pending' | 'withdrawn' | string;
  category?: string;
  collections: number;
  readCounts: number;
  cover?: string;
}
export interface Document {
  infoBrief: InfoBrief;
  bookISBN?: string;
  author?: string;
  uploader?: UserBrief;
  URL?: string;
  tags?: string[];
  introduction?: string;
  createYear?: string;
  postList?: Post[];
}

export interface UploadFile {
  file?: File,
  cover?: File,
  categoryId: number,
  type: 'book' | 'file' | 'video',
  name: string,
  ISBN: string,
  tags: string[],
  author: string | '默认佚名',
  createYear: string | '未知',
  uploaderId: number,
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

export interface Categoryform {
  isCourse: boolean;
  name: string;
  parentCatId?: number;
  description?: string;
}

export interface message {
  sessionId: number;
  senderId: number;
  sendTime: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  status: '已发送' | '未读' | '未接收'
}

export interface chatBox {
  sessionId: number,
  userId1: number,
  avatar1: string,
  username1: string,
  userId2: number,
  avatar2: string,
  username2: string,
  lastMessage: string,
  lastTime: string,
  unreadCount: number
}


export interface Post {
  postId: number;
  senderId: number;
  title: string;
  content: string;
  collectCount: number;
  commentCount: number;
  likeCount: number;
  sendTime: string;
  documentId?: number;
  cover?: string;
}

export interface PostDetail {
  postId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  title: string;
  content: string;
  commentCount: number;
  collectCount: number;
  likeCount: number;
  sendTime: string;
  documentList?: InfoBrief[];
}

export interface UploadPostForm {
  senderId: number;
  title: string;
  content: string;
  documents?: [
    documentId: number,
    cover: string
  ];
}

export interface Reminder {
  reminderId: number;
  receiverId: number;
  type: "评论" | "点赞" | "收藏" | "系统消息";
  content: string;
  sendTime: string;
  isRead: boolean;
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

  // 添加文件字段
  formData.append('file', data.file);
  formData.append('cover', data.cover);

  // 添加其他字段
  formData.append('categoryId', data.categoryId.toString());
  formData.append('type', data.type);
  formData.append('name', data.name);
  formData.append('uploaderId', data.uploaderId.toString());
  formData.append('uploadTime', data.uploadTime.toISOString());
  formData.append('introduction', data.introduction);

  // 处理可能为空的字段
  if (data.tags !== null) {
    formData.append('tags', data.tags.join(',')); // 数组转字符串
  }
  if (data.createYear !== null) {
    formData.append('createYear', data.createYear);
  }
  if (data.author !== null) {
    formData.append('author', data.author);
  }
  if (data.ISBN !== null) {
    formData.append('ISBN', data.ISBN);
  }
  if (data.videoURL !== null) {
    formData.append('videoURL', data.videoURL);
  }

  return service.post<ApiResponse<{ document: Document }>>('/user/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 上传帖子接口
export const uploadPost = (data: UploadPostForm) => {
  const formData = new FormData();

  // 添加必需字段
  formData.append('senderId', data.senderId.toString());
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('sendTime', data.sendTime.toISOString());
  formData.append('senderName', data.senderName);
  formData.append('senderAvatar', data.senderAvatar);

  // 处理可选字段
  if (data.documents && data.documents.length > 0) {
    // 假设 documents 是一个数组，需要序列化
    formData.append('documents', JSON.stringify(data.documents));
  }

  return service.post<ApiResponse<string>>('/post', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 5. 获取书籍列表
export const getBookList = (is_suggest: boolean, categoryId?: number) => {
  return service.get<ApiResponse<{ documents: Document[] }>>('/documents', {
    params: { is_suggest, categoryId },
  });
};

// 修改资料状态
export const updateFileStatus = (docId: number, status: string) => { return service.put<ApiResponse<null>>('/admin/document/status', { docId, status }) }


// 6. 修改资料信息
export const updateFileInfo = (data: DocumentEditForm) => {
  return service.put<ApiResponse<null>>('/document', data)
}

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

// 10.1 添加分类
export const addCategoryOrCourse = (data: Categoryform) => {
  return service.post<ApiResponse<{ success: boolean }>>('/category', data);
}

// 11.1 获取帖子列表
export const getPosts = (key: string, order: "time" | "hot") => {
  return service.get<ApiResponse<{ posts: Post[] }>>('/getPosts', {
    params: { key, order },
  });
};

// 11.1.1 获取帖子详情
export const getPostDetail = (postId: number | string) => {
  return service.get<ApiResponse<PostDetail>>(`/post/${postId}`);
};

// 11.2 发帖
export const createPost = (payload: { senderId: number; title: string; content: string; documentId?: number }) => {
  return service.post<ApiResponse<{ postId: number }>>('/createPost', payload);
}

// 12. 获取提醒列表
export const getReminders = (userId: number) => {
  return service.get<ApiResponse<{ reminders: Reminder[] }>>('/getReminder', {
    params: { userId },
  });
};

// 13. 标记提醒为已读
export const markReminderAsRead = (reminderId: number) => {
  return service.post<ApiResponse<any>>('/markRead', {
    reminderId
  });
};

// 书籍/文件评论相关类型
export interface CreateCommentPayload {
  commenter: UserBrief;
  sourceData: CommentSourceData;
  content: string;
  parentId: number | null;
}

// 获取指定书籍/文件的详细信息
export const getDocumentDetail = (documentId: string | number) => {
  return service.get<ApiResponse<Document>>(`/document/${documentId}`);
};

// 根据来源获取评论
export const getCommentsBySource = (sourceType: CommentSourceType | string, sourceId: string | number) => {
  return service.get<ApiResponse<DocumentComment[]>>(`/${sourceType}/${sourceId}/comments`);
};

// 获取指定用户发表过的所有评论
export const getUserComments = (userId: string | number) => {
  return service.get<ApiResponse<DocumentComment[]>>(`/user/${userId}/comments`);
};

// 管理员获取所有评论
export const getAllComments = () => {
  return service.get<ApiResponse<DocumentComment[]>>('/admin/comments');
};

// 获取单条评论
export const getSingleComment = (commentId: string | number) => {
  return service
    .get<ApiResponse<DocumentComment>>(`/comment/${commentId}`)
    .then((response) => response.data);
};

// 发表评论
export const createComment = (
  payload: CreateCommentPayload,
) => {
  return service.post<ApiResponse<DocumentComment[]>>('/user/comments', payload);
};

// 普通用户删除自己的评论
export const deleteUserComment = (userId: string | number, commentId: string | number) => {
  return service.delete<ApiResponse<null>>('/user/comment', {
    params: { userId, commentId },
  });
};

// 管理员删除任意评论
export const deleteAdminComment = (commentId: string | number) => {
  return service.delete<ApiResponse<null>>('/admin/comment', {
    params: { commentId },
  });
};


// 收藏
export const postUserAddFavor = (payload: FavoriteActionPayload) => {
  return service.post<ApiResponse<unknown>>('/user/collect', payload);
};

// 取消收藏
export const deleteUserFavor = (payload: FavoriteActionPayload) => {
  return service.delete<ApiResponse<unknown>>('/user/collect', { data: payload });
};

// 判断是否已收藏
export const getUserFavoriteJudgement = (params: FavoriteActionPayload) => {
  return service.get<ApiResponse<{ judgement: boolean }>>('/user/checkFavorite', { params });
};

// 点赞帖子
export const postUserLikePost = (payload: PostLikePayload) => {
  return service.post<ApiResponse<unknown>>('/user/like', payload);
};

// 取消点赞帖子
export const deleteUserLikePost = (payload: PostLikePayload) => {
  return service.delete<ApiResponse<unknown>>('/user/like', { data: payload });
};

// 判断是否点赞
export const getUserLikeJudgement = (params: PostLikePayload) => {
  return service.get<ApiResponse<{ judgement: boolean }>>('/user/checkLike', { params });
};

// 管理员调整文档状态
export const updateDocumentStatus = (payload: { documentId: number; status: 'open' | 'closed' | 'pending' | 'withdrawn' }) => {
  return service.put<ApiResponse<null>>('/admin/document/status', payload);
};


// 发送消息,接口名加上interface避免重名
export const sendMessageInterface = (sessionId: number, receiverId: number, content: string) => {
  return service.post<ApiResponse<{code:number,data:any }>>('/chat/message', { sessionId, receiverId, content })
}

//获取总未读消息数量
export const getUnreadMessage = (type:string,id: number) => {
  return service.get<ApiResponse<number>>('/unreadMessage',{params:{type,id} })
}

//创建聊天
export const createChat = (myId: number, oppositeId: number) => {
  return service.post<ApiResponse<chatBox>>("/createChat", {
    myId,
    oppositeId,
  });
};


//获取聊天回话列表
export const getSessionList = (userId: number) => {
  return service.get<ApiResponse<chatBox[]>>('/chat/sessions', { params: { userId }  })
}


//获取聊天记录
export const getMessageList = (sessionId: number, userId: number) => {
  const config = {
    params: { sessionId, userId },
    noLoading: true, // 用 config.noLoading 标记，避免自定义 header 触发 CORS
  }
  return service.get<ApiResponse<message[]>>('/chat/messages', config)
}

//搜索聊天记录
export const searchMessage = (userId: number, searchKey: string) => {
  return service.get<ApiResponse<message[]>>('/chat/search', { params: { userId, searchKey } })
}

//搜索用户
export const searchUser = (userId?: number, username?: string) => {
  return service.get<ApiResponse<UserBrief[]>>("/admin/user",{params:{userId,username}});
}

//获取提醒（通知）
export const getReminder = (userId: number) => {
  return service.get<ApiResponse<Reminder[]>>('/getReminder', { params: { userId } })
}



// 获取用户的详细信息
export const getUserDetail = (userId: string) => {
  return service.get<User>(`/user/${userId}`)
}
