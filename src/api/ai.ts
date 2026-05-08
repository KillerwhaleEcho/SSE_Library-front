import service from "../utils/service";
import request from "../utils/request";



export interface ApiResponse<T = any> {
    code: number;
    message?: string;
    data: T;
}

export interface AISession{
    sessionId: number
    userId: number
    sessionName: string
    lasttime:string
}

export interface AIMessage{
    aiSessionId: number
    aiMessageId: number
    isUserSend: boolean
    chainOfThought:string
    content: string
    state:string
}


export const createAIchat = (userId: number) => {
    return service.post<
      ApiResponse<{
        aiSessionId: number;
        createTime: string;
      }>
    >("/ai/chat/sessions",userId);
}

export const getAIMessages = (sessionId: number) => {
  return service.get<ApiResponse<AIMessage[]>>(
    `/ai/chat/sessions/${sessionId}/messages`,
  );
};

export const getAISessions = (userId:number) => {
    return service.get<ApiResponse<AISession>>("/ai/chat/sessions", {
        params: {
            userId
    }});
}


export const sendAndReceive = (
  sessionId: number,
  userId: number,
  question: string,
  isThink: boolean,
) => {
  const params = new URLSearchParams({
    userId: String(userId),
    question,
    isThink: String(isThink),
  });

  return new EventSource(
    `/api/ai/chat/sessions/${sessionId}/messages?${params.toString()}`,
  );
};



export const pauseAI = (sessionId: number)=>{
    return service.post<ApiResponse<{sessionId:number,messageId:number,status:string}>>(`/ai/chat/sessions/${sessionId}/stop`)
}

export const modifyAITitle = (sessionId: number, newTitle:string,userId:number) => {
    return service.post<ApiResponse<any>>(`/ai/chat/sessions/${sessionId}/modify`, { newTitle,userId })
}

export const deleteAISession = (sessionId:number,userId:number) => {
    return service.delete<ApiResponse<any>>(`/ai/chat/sessions/${sessionId}/delete`, {
        params: {
        userId
    }})
}