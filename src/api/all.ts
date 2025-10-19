import service from '../utils/service'
import request from '../utils/request'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 用户相关类型
export interface User {
  userId: number;
  username: string;
  userAvatar: string;
  status: 'active' | 'banned';
  createTime: string;
  email: string;
  role: 'user' | 'admin';

  password?: string; // 仅用于注册和登录
  collectionList?: Document[]; // 用户收藏的书籍/文件
  historyList?: Document[]; // 用户浏览历史
}

// 评论相关类型
export interface Comment {
  comment_id: number;
  content: string;
  commenter: User;
  document: Document;
  create_at: string;
}

// 书籍/文件相关类型
export interface Document {
  document_id: number;
  name: string;
  type: 'book' | 'file' | null;
  uploadTime: string;
  status: 'available' | 'processing' | 'failed';
  category?: string;
  course?: string;
  collections: number;
  readCounts: number;
  URL: string;

  bookISBN?: string;
  author?: string;
  uploader?: User;
  cover?: string;
  tags?: string[];
  introduction?: string;
  createYear?: string;
}

// 分类相关类型
export interface Category {
  id: number;
  name: string;
  is_course: boolean;
  file_counts: number;
  read_counts: number;
  description?: string;
  parent_id?: number;
  children?: Category[];
}

// 上传资料相关类型
export interface UploadFile {
  file: File;
  name: string;
  description?: string;
  categoryId?: string;
}

// 1. 获取对某本书的评论
export const getBookComments = (bookId: string) => {
  return service.get<ApiResponse<Comment[]>>(`/books/${bookId}/comments`);
};

// 2. 发起预览/下载
export const previewOrDownloadBook = (bookId: string, type: 'preview' | 'download') => {
  return service.get<ApiResponse<{ url: string }>>(`/books/${bookId}/${type}`);
};

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
    params: { }
  });
};
//3.4 获取热门书籍/文件
export const getHotDocuments = () => {
  return service.get<ApiResponse<{ documents: Document[] }>>('/books', {
    params: { is_suggest: true,category: '' }
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
export const getBookList = (is_suggest: boolean, category?: string) => {
  return service.get<ApiResponse<{  documents: Document[] }>>('/books', {
    params: { is_suggest, category }
  });
};

// 6. 修改资料信息
export const updateFileInfo = (fileId: string, data: { name?: string; description?: string; categoryId?: string }) => {
  return service.put<ApiResponse<null>>(`/files/${fileId}`, data);
};

// 7. 搜索书籍或文件
export const searchBooksOrFiles = (keyword: string, params?: { categoryId?: string; page?: number; pageSize?: number }) => {
  return service.get<ApiResponse<{ results: (Document | any)[]; total: number }>>('/search', {
    params: { keyword, ...params },
  });
};

// 8. 获取指定书目
export const getSpecifiedBook = (id: string) => {
  return service.get<ApiResponse<Document>>(`/books/${id}`);
};

// 9. 发表评论
export const postComment = (bookId: string, content: string) => {
  return service.post<ApiResponse<Comment>>(`/books/${bookId}/comments`, { content });
};

// 10. 搜索分类和课程
export const searchCategoriesAndCourses = (keyword: string, params?: { page?: number; pageSize?: number }) => {
  return service.get<ApiResponse<{ categories: Category[]; courses: any[]; total: number }>>('/categoriesAndCourses/search', {
    params: { keyword, ...params },
  });
};