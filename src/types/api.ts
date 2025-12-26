   export interface LoginResponse {
     code: number
     message?: string
     data: {
       token: string
       user: UserInfo
     }
   }

   export interface RegisterResponse {
     code: number
     message?: string
     data: {
       username: string
       email: string
       role: string
       status: string
     }
   }

   export interface UserInfo {
     userId: number
     username: string
     email: string
     role: string
     userAvatar: string
     status: string
     createTime:string
}
   
//修改书籍信息的数据接口
 export interface DocumentEditForm {
  documentId: number | null
  type: string
  categoryId: number|null
  name: string
  isbn: string
  tags: string
  author: string
  createYear: string
  cover: File | string | null
  introduction: string
  file: File | string | null
  videoURL: string
}
