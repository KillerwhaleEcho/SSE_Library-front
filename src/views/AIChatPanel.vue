<template>
  <Teleport to="body">
    <transition name="ai-chat-fade">
      <section v-if="modelValue" class="ai-chat-shell" aria-label="AI 对话窗口">
        <div class="ai-chat-panel" :class="{ 'history-collapsed': !showHistory }">
          <aside v-show="showHistory" class="ai-chat-history">
            <div class="history-header">
              <span>对话历史</span>
              <button class="icon-button" type="button" title="新建对话" @click="handleCreateSession">
                +
              </button>
            </div>
            <div class="history-list">
              <button
                v-for="session in sessions"
                :key="session.sessionId"
                class="history-item"
                :class="{ active: session.sessionId === activeSessionId }"
                type="button"
                @click="handleSelectSession(session.sessionId)"
              >
                <span>{{ session.sessionName || `AI 对话 ${session.sessionId}` }}</span>
                <time>{{ formatSessionTime(session.lasttime) }}</time>
              </button>
              <div v-if="!sessions.length" class="history-empty">暂无历史对话</div>
            </div>
          </aside>

          <main class="ai-chat-main">
            <header class="ai-chat-header">
              <div>
                <p class="ai-chat-title">AI 助手</p>
                <p class="ai-chat-subtitle">{{ activeSessionId ? "正在对话" : "请选择或新建对话" }}</p>
              </div>
              <div class="ai-chat-actions">
                <button class="text-button" type="button" @click="showHistory = !showHistory">
                  {{ showHistory ? "收起历史" : "查看历史" }}
                </button>
                <button class="text-button primary" type="button" @click="handleCreateSession">
                  新建对话
                </button>
                <button class="icon-button" type="button" title="关闭" @click="handleClose">×</button>
              </div>
            </header>

            <div ref="messageListRef" class="ai-chat-messages">
              <div v-if="!activeSessionId" class="ai-chat-empty">新建对话后开始提问</div>
              <div v-else-if="!displayMessages.length" class="ai-chat-empty">还没有消息</div>
              <div
                v-for="message in displayMessages"
                :key="message.id"
                class="message-row"
                :class="{ user: message.role === 'user' }"
              >
                <div class="message-bubble">
                  <p v-if="message.thought" class="message-thought">{{ message.thought }}</p>
                  <p>{{ message.content }}</p>
                </div>
              </div>
            </div>

            <footer class="ai-chat-input">
              <label class="think-toggle">
                <input v-model="isThink" type="checkbox" />
                <span>深度思考</span>
              </label>
              <div class="input-row">
                <textarea
                  v-model="question"
                  rows="3"
                  placeholder="输入你的问题"
                  @keydown.enter.exact.prevent="handleSend"
                ></textarea>
                <div class="send-actions">
                  <button v-if="isStreaming" class="stop-button" type="button" @click="handleStop">
                    停止
                  </button>
                  <button
                    class="send-button"
                    type="button"
                    :disabled="!canSend"
                    @click="handleSend"
                  >
                    发送
                  </button>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </section>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import * as aiApi from "@/api/ai";

type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thought?: string;
};

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const userId = Number(localStorage.getItem("userId") || "0");
const sessions = ref<aiApi.AISession[]>([]);
const activeSessionId = ref<number | null>(null);
const displayMessages = ref<DisplayMessage[]>([]);
const question = ref("");
const isThink = ref(false);
const isStreaming = ref(false);
const showHistory = ref(true);
const messageListRef = ref<HTMLElement | null>(null);
let eventSource: EventSource | null = null;

const unwrapApiData = <T,>(response: unknown): T => {
  const maybeResponse = response as { data?: unknown };
  const data = maybeResponse.data;
  if (data && typeof data === "object" && "data" in data) {
    return (data as { data: T }).data;
  }
  return data as T;
};

const canSend = computed(() => {
  return Boolean(activeSessionId.value && question.value.trim() && !isStreaming.value);
});

const scrollToBottom = async () => {
  await nextTick();
  const el = messageListRef.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
};

const closeStream = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  isStreaming.value = false;
};

const normalizeMessages = (messages: aiApi.AIMessage[]) => {
  return messages.map((item) => ({
    id: String(item.aiMessageId),
    role: item.isUserSend ? "user" : "assistant",
    content: item.content || "",
    thought: item.chainOfThought || "",
  })) satisfies DisplayMessage[];
};

const loadSessions = async () => {
  if (!userId) return;
  try {
    const res = await aiApi.getAISessions(userId);
    const sessionList = unwrapApiData<aiApi.AISession[]>(res);
    sessions.value = Array.isArray(sessionList) ? sessionList : [];
    const firstSession = sessions.value[0];
    if (!activeSessionId.value && firstSession) {
      await handleSelectSession(firstSession.sessionId);
    }
  } catch {
    ElMessage.error("获取 AI 对话历史失败");
  }
};

const loadMessages = async (sessionId: number) => {
  try {
    const res = await aiApi.getAIMessages(sessionId);
    displayMessages.value = normalizeMessages(unwrapApiData<aiApi.AIMessage[]>(res) || []);
    await scrollToBottom();
  } catch {
    ElMessage.error("获取 AI 消息失败");
  }
};

const handleSelectSession = async (sessionId: number) => {
  closeStream();
  activeSessionId.value = sessionId;
  await loadMessages(sessionId);
};

const handleCreateSession = async () => {
  if (!userId) {
    ElMessage.warning("请先登录");
    return;
  }
  closeStream();
  try {
    const res = await aiApi.createAIchat(userId);
    const created = unwrapApiData<{ aiSessionId: number; createTime: string }>(res);
    activeSessionId.value = created.aiSessionId;
    displayMessages.value = [];
    await loadSessions();
  } catch {
    ElMessage.error("新建 AI 对话失败");
  }
};

const appendAssistantChunk = (chunk: string) => {
  const last = displayMessages.value[displayMessages.value.length - 1];
  if (last?.role === "assistant" && last.id === "streaming") {
    last.content += chunk;
  } else {
    displayMessages.value.push({
      id: "streaming",
      role: "assistant",
      content: chunk,
    });
  }
  scrollToBottom();
};

const handleSend = async () => {
  const sessionId = activeSessionId.value;
  const content = question.value.trim();
  if (!sessionId || !content || isStreaming.value) return;

  displayMessages.value.push({
    id: `local-${Date.now()}`,
    role: "user",
    content,
  });
  question.value = "";
  isStreaming.value = true;
  await scrollToBottom();

  eventSource = aiApi.sendAndReceive(sessionId, userId, content, isThink.value);
  eventSource.onmessage = (event) => {
    appendAssistantChunk(event.data);
  };
  eventSource.onerror = () => {
    closeStream();
    loadSessions();
  };
};

const handleStop = async () => {
  const sessionId = activeSessionId.value;
  closeStream();
  if (!sessionId) return;
  try {
    await aiApi.pauseAI(sessionId);
  } catch {
    ElMessage.error("停止 AI 回复失败");
  }
};

const handleClose = () => {
  closeStream();
  emit("update:modelValue", false);
};

const formatSessionTime = (time: string) => {
  if (!time) return "";
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return time;
  return date.toLocaleDateString();
};

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      loadSessions();
    } else {
      closeStream();
    }
  }
);

onBeforeUnmount(() => {
  closeStream();
});
</script>

<style scoped>
.ai-chat-shell {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 74px 24px 24px 188px;
  background: rgba(17, 24, 39, 0.18);
}

.ai-chat-panel {
  width: min(920px, calc(100vw - 212px));
  height: min(720px, calc(100vh - 98px));
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
}

.ai-chat-panel.history-collapsed {
  grid-template-columns: minmax(0, 1fr);
}

.ai-chat-history {
  min-width: 0;
  border-right: 1px solid #edf0f5;
  background: #f8fafc;
}

.history-header,
.ai-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-header {
  height: 58px;
  padding: 0 14px;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid #edf0f5;
}

.history-list {
  height: calc(100% - 58px);
  overflow-y: auto;
  padding: 10px;
}

.history-item {
  width: 100%;
  min-height: 58px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 5px;
  padding: 9px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #374151;
  cursor: pointer;
  text-align: left;
}

.history-item span {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.history-item time {
  color: #8a94a6;
  font-size: 12px;
}

.history-item:hover,
.history-item.active {
  background: #ede9fe;
  color: #5b35b1;
}

.history-empty,
.ai-chat-empty {
  color: #8a94a6;
  font-size: 14px;
}

.history-empty {
  padding: 18px 8px;
  text-align: center;
}

.ai-chat-main {
  min-width: 0;
  display: grid;
  grid-template-rows: 68px minmax(0, 1fr) auto;
}

.ai-chat-header {
  padding: 0 18px;
  border-bottom: 1px solid #edf0f5;
}

.ai-chat-title,
.ai-chat-subtitle,
.message-bubble p {
  margin: 0;
}

.ai-chat-title {
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.ai-chat-subtitle {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.ai-chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-button,
.icon-button,
.send-button,
.stop-button {
  border: 0;
  cursor: pointer;
  font-size: 14px;
}

.text-button {
  height: 34px;
  padding: 0 12px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #374151;
}

.text-button.primary,
.send-button {
  background: #7c5cff;
  color: #ffffff;
}

.icon-button {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 6px;
  background: #eef2ff;
  color: #5b35b1;
  font-size: 20px;
  line-height: 32px;
}

.ai-chat-messages {
  overflow-y: auto;
  padding: 18px;
  background: #fbfcfe;
}

.ai-chat-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-row {
  display: flex;
  margin-bottom: 14px;
}

.message-row.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(78%, 620px);
  padding: 11px 13px;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-row.user .message-bubble {
  background: #7c5cff;
  color: #ffffff;
}

.message-thought {
  margin-bottom: 8px !important;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(124, 92, 255, 0.2);
  color: #6b7280;
  font-size: 13px;
}

.ai-chat-input {
  padding: 12px 14px 14px;
  border-top: 1px solid #edf0f5;
  background: #ffffff;
}

.think-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #4b5563;
  font-size: 13px;
}

.input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 82px;
  gap: 12px;
  align-items: stretch;
}

.input-row textarea {
  width: 100%;
  min-width: 0;
  min-height: 74px;
  box-sizing: border-box;
  resize: none;
  border: 1px solid #d7dce5;
  border-radius: 8px;
  padding: 10px 12px;
  color: #111827;
  font: inherit;
  line-height: 1.5;
  outline: none;
}

.input-row textarea:focus {
  border-color: #8b73ff;
  box-shadow: 0 0 0 3px rgba(124, 92, 255, 0.12);
}

.send-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  justify-content: flex-end;
}

.send-button,
.stop-button {
  width: 82px;
  height: 36px;
  border-radius: 6px;
}

.send-button:disabled {
  cursor: not-allowed;
  background: #c7cdd8;
}

.stop-button {
  background: #fee2e2;
  color: #b91c1c;
}

.ai-chat-fade-enter-active,
.ai-chat-fade-leave-active {
  transition: opacity 0.18s ease;
}

.ai-chat-fade-enter-from,
.ai-chat-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1120px) {
  .ai-chat-shell {
    padding-left: 24px;
  }

  .ai-chat-panel {
    width: min(920px, calc(100vw - 48px));
  }
}

@media (max-width: 760px) {
  .ai-chat-shell {
    padding: 66px 10px 10px;
  }

  .ai-chat-panel {
    width: 100%;
    height: calc(100vh - 76px);
    grid-template-columns: 1fr;
  }

  .ai-chat-history {
    display: none;
  }

  .ai-chat-header {
    gap: 10px;
  }

  .ai-chat-actions {
    gap: 6px;
  }

  .text-button {
    padding: 0 9px;
    font-size: 13px;
  }

  .input-row {
    grid-template-columns: 1fr;
  }

  .send-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>
