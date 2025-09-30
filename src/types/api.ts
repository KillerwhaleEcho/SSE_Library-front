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
