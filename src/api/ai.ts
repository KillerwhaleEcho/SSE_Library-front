import service from "../utils/service";

export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
}

export interface AISession {
  aiSessionId: number;
  userId: number;
  aiSessionName: string;
  lasttime: string;
}

export interface AIMessage {
  aiSessionId: number;
  aiMessageId: number;
  isUserSend: boolean;
  chainOfThought: string;
  content: string;
  state: string;
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
  >("/ai/chat/sessions", { userId });
};

export const getAIMessages = (sessionId: number) => {
  return service.get<ApiResponse<AIMessage[]>>(
    `/ai/chat/sessions/${sessionId}/messages`,
  );
};

export const getAISessions = (userId: number) => {
  return service.get<ApiResponse<AISession[]>>("/ai/chat/sessions", {
    params: {
      userId,
    },
  });
};

export const sendAndReceive = (
  sessionId: number,
  userId: number,
  question: string,
  isThink: boolean,
  onMessage: (chunk: string, eventName: string) => void,
  onError?: (error: unknown) => void,
  onClose?: () => void,
) => {
  const controller = new AbortController();
  const token = localStorage.getItem("token") || "";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const consumeStream = async () => {
    try {
      const response = await fetch(
        `/api/ai/chat/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId,
            question,
            isThink,
          }),
          credentials: "include",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`流式请求失败: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("AI回答为空");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventName = "message";
      let dataLines: string[] = [];

      const getDataPayload = (line: string) => {
        const raw = line.slice(5);
        return raw.startsWith(" ") ? raw.slice(1) : raw;
      };

      const emitEvent = () => {
        if (dataLines.length) {
          const chunk = dataLines.join("\n");
          if (eventName !== "end") {
            onMessage(chunk, eventName);
          }
        }
        dataLines = [];
        eventName = "message";
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let lineEnd = buffer.indexOf("\n");

        while (lineEnd >= 0) {
          const line = buffer.slice(0, lineEnd).replace(/\r$/, "");
          buffer = buffer.slice(lineEnd + 1);

          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(getDataPayload(line));
          } else if (line && !line.includes(":")) {
            dataLines.push(line);
          } else if (!line) {
            emitEvent();
          }

          lineEnd = buffer.indexOf("\n");
        }
      }

      const remaining = buffer + decoder.decode();
      if (remaining.trim()) {
        if (remaining.startsWith("data:")) {
          dataLines.push(getDataPayload(remaining));
        } else if (remaining.startsWith("event:")) {
          eventName = remaining.slice(6).trim();
        } else {
          dataLines.push(remaining);
        }
      }
      emitEvent();

      onClose?.();
    } catch (error) {
      if (!controller.signal.aborted) {
        onError?.(error);
      }
    }
  };

  void consumeStream();
  return controller;
};

export const pauseAI = (sessionId: number) => {
  return service.post<
    ApiResponse<{ sessionId: number; messageId: number; status: string }>
  >(`/ai/chat/sessions/${sessionId}/stop`);
};

export const modifyAITitle = (
  sessionId: number,
  newTitle: string,
  userId: number,
) => {
  return service.put<ApiResponse<any>>("/ai/chat/sessions", {
    newTitle,
    userId,
    sessionId,
  });
};

export const deleteAISession = (sessionId: number, userId: number) => {
  return service.delete<ApiResponse<any>>(`/ai/chat/sessions/${sessionId}`, {
    data: {
      userId,
    },
  });
};

// 获取AI总结
export const getAIsummary = (
  contentType: string,
  contentId: string,
  regenerate: boolean = false,
) => {
  return service.post<ApiResponse<AISummaryData>>(
    `/ai/${contentType}/${contentId}/summary`,
    { regenerate },
    { timeout: 120000 }, // 等待12,000ms，防止AI还在生成时，就过早地截断
  );
};
