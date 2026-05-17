import service from "../utils/service";

export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
}

export interface AISession {
  sessionId: number
  userId: number
  sessionName: string
  lasttime: string
}

export interface AIMessage {
  aiSessionId: number
  aiMessageId: number
  isUserSend: boolean
  chainOfThought: string
  content: string
  state: string
}

// AI总结的结构体
export interface AISummaryData {
  fromcache: boolean;
  contentType: string;
  contentId: number;
  summaryId: number;
  summary: string;
}


export const createAIchat = (userId: number) => {
  return service.post<
    ApiResponse<{
      aiSessionId: number;
      createTime: string;
    }>
  >("/ai/chat/sessions", userId);
}

export const getAIMessages = (sessionId: number) => {
  return service.get<ApiResponse<AIMessage[]>>(
    `/ai/chat/sessions/${sessionId}/messages`,
  );
};

export const getAISessions = (userId:number) => {
    return service.get<ApiResponse<AISession[]>>("/ai/chat/sessions", {
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



export const pauseAI = (sessionId: number) => {
  return service.post<ApiResponse<{ sessionId: number, messageId: number, status: string }>>(`/ai/chat/sessions/${sessionId}/stop`)
}

export const modifyAITitle = ( newTitle:string,userId:number) => {
    return service.put<ApiResponse<any>>(`/ai/chat/sessions`, { newTitle,userId })
}

export const deleteAISession = (sessionId: number, userId: number) => {
  return service.delete<ApiResponse<any>>(`/ai/chat/sessions/${sessionId}`, {
    params: {
      userId
    }
  })
}

// 获取AI总结
export const getAIsummary = (contentType: string, contentId: string, regenerate: boolean = false) => {
  return service.post<ApiResponse<AISummaryData>>(
    `/ai/${contentType}/${contentId}/summary`,
    { regenerate },
    { timeout: 120000 },  // 等待12,000ms，防止AI还在生成时，就过早地截断
  );
}

