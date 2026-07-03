<template>
  <Teleport to="body">
    <transition name="ai-chat-fade">
      <section
        v-if="modelValue"
        class="ai-chat-shell"
        aria-label="AI 对话窗口"
        @click="closeSessionMenu"
      >
        <div
          class="ai-chat-panel"
          :class="{ 'history-collapsed': !showHistory }"
          @click.stop="closeSessionMenu"
          @contextmenu="closeSessionMenu"
        >
          <aside v-show="showHistory" class="ai-chat-history">
            <div class="history-header">
              <span>对话历史</span>
              <button
                class="icon-button"
                type="button"
                title="新建对话"
                @click="handleCreateSession"
              >
                +
              </button>
            </div>
            <div class="history-list">
              <div
                v-for="session in sessions"
                :key="getSessionId(session)"
                class="history-entry"
                :class="{ active: getSessionId(session) === activeSessionId }"
                @contextmenu.prevent.stop="openSessionMenu($event, session)"
              >
                <button
                  class="history-item"
                  type="button"
                  @click="handleSelectSession(getSessionId(session))"
                >
                  <span>{{ session.aiSessionName || "新对话" }} </span>
                  <time>{{ formatSessionTime(session.lasttime) }}</time>
                </button>
              </div>
              <div v-if="!sessions.length" class="history-empty">
                暂无历史对话
              </div>
            </div>
          </aside>

          <main class="ai-chat-main">
            <header class="ai-chat-header">
              <div>
                <p class="ai-chat-title">AI 助手</p>
                <p class="ai-chat-subtitle">
                  {{ activeSessionId ? "正在对话" : "请选择或新建对话" }}
                </p>
              </div>
              <div class="ai-chat-actions">
                <button
                  class="text-button"
                  type="button"
                  @click="showHistory = !showHistory"
                >
                  {{ showHistory ? "收起历史" : "查看历史" }}
                </button>
                <button
                  class="text-button primary"
                  type="button"
                  @click="handleCreateSession"
                >
                  新建对话
                </button>
                <button
                  class="icon-button"
                  type="button"
                  title="关闭"
                  @click="handleClose"
                >
                  ×
                </button>
              </div>
            </header>

            <div ref="messageListRef" class="ai-chat-messages">
              <div v-if="!activeSessionId" class="ai-chat-empty">
                新建对话后开始提问
              </div>
              <div v-else-if="!displayMessages.length" class="ai-chat-empty">
                还没有消息
              </div>
              <div
                v-for="message in displayMessages"
                :key="message.id"
                class="message-row"
                :class="{ user: message.role === 'user' }"
              >
                <div class="message-bubble">
                  <details v-if="message.thought" class="message-thought">
                    <summary>思考过程</summary>
                    <div
                      class="message-content message-thought-content"
                      v-html="renderMarkdown(message.thought)"
                    ></div>
                  </details>
                  <!-- details是HTML的原生折叠容器，点击summary标签时才会展开；summary是折叠块的标题-->
                  <p v-if="message.role === 'user'">{{ message.content }}</p>
                  <div
                    v-else
                    class="message-content"
                    v-html="renderMarkdown(message.content)"
                  ></div>
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
                  <button
                    v-if="isStreaming"
                    class="stop-button"
                    type="button"
                    @click="handleStop"
                  >
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
        <div
          v-if="sessionMenu.visible"
          class="session-context-menu"
          :style="{ left: `${sessionMenu.x}px`, top: `${sessionMenu.y}px` }"
          @click.stop
          @contextmenu.prevent
        >
          <!-- 
@click.stop
阻止点击菜单内部时事件冒泡。否则外层 AIChatPanel 的点击关闭逻辑会立刻把菜单关掉。
@contextmenu.prevent
在这个自定义菜单上再次右键时，阻止浏览器默认右键菜单弹出来。 -->
          <button type="button" @click="handleContextRename">修改标题</button>
          <button class="danger" type="button" @click="handleContextDelete">
            删除会话
          </button>
        </div>
      </section>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import MarkdownIt from "markdown-it";
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
const pendingTitleRefreshSessionId = ref<number | null>(null);
const sessionMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  session: aiApi.AISession | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  session: null,
});
let streamController: AbortController | null = null;
const aiChatMessageBoxOptions = {
  customClass: "ai-chat-message-box",
  modalClass: "ai-chat-message-box-overlay",
};
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

markdown.renderer.rules.link_open = (tokens, index, options, _env, self) => {
  const token = tokens[index];
  if (!token) return "";

  token.attrSet("target", "_blank");
  token.attrSet("rel", "noopener noreferrer");
  return self.renderToken(tokens, index, options);
};

const unwrapApiData = <T,>(response: unknown): T => {
  const maybeResponse = response as { data?: unknown };
  const data = maybeResponse.data;
  if (data && typeof data === "object" && "data" in data) {
    return (data as { data: T }).data;
  }
  return data as T;
};

const canSend = computed(() => {
  return Boolean(
    activeSessionId.value && question.value.trim() && !isStreaming.value,
  );
});

const scrollToBottom = async () => {
  await nextTick();
  const el = messageListRef.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
};

const closeStream = () => {
  if (streamController) {
    streamController.abort();
    streamController = null;
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

const thinkingEventNames = new Set([
  "thinking",
  "think",
  "reasoning",
  "thought",
]);
const contentEventNames = new Set([
  "message",
  "answer",
  "data",
  "content",
  "delta",
]);

const renderMarkdown = (content: string) => {
  return markdown.render(content || "");
};

const getSessionId = (session: aiApi.AISession) => {
  return session.aiSessionId;
};

const loadSessions = async () => {
  if (!userId) return;
  try {
    const res = await aiApi.getAISessions(userId);
    const sessionList = unwrapApiData<aiApi.AISession[]>(res);
    sessions.value = Array.isArray(sessionList) ? sessionList : [];
    const firstSession = sessions.value[0];
    if (!activeSessionId.value && firstSession) {
      await handleSelectSession(getSessionId(firstSession));
    }
  } catch {
    ElMessage.error("获取 AI 对话历史失败");
  }
};

const loadMessages = async (sessionId: number) => {
  try {
    const res = await aiApi.getAIMessages(sessionId);
    displayMessages.value = normalizeMessages(
      unwrapApiData<aiApi.AIMessage[]>(res) || [],
    );
    await scrollToBottom();
  } catch {
    ElMessage.error("获取 AI 消息失败");
  }
};

const handleSelectSession = async (sessionId: number) => {
  if (!Number.isFinite(sessionId)) {
    ElMessage.error("AI 会话 ID 异常");
    return;
  }
  closeSessionMenu();
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
    const created = unwrapApiData<{ aiSessionId: number; createTime: string }>(
      res,
    );
    activeSessionId.value = created.aiSessionId;
    pendingTitleRefreshSessionId.value = created.aiSessionId;
    displayMessages.value = [];
    await loadSessions();
  } catch {
    ElMessage.error("新建 AI 对话失败");
  }
};

const handleRenameSession = async (session: aiApi.AISession) => {
  const sessionId = getSessionId(session);
  if (!Number.isFinite(sessionId)) {
    ElMessage.error("AI 会话 ID 异常");
    return;
  }

  try {
    const { value } = await ElMessageBox.prompt(
      "请输入新的会话标题",
      "修改标题",
      {
        ...aiChatMessageBoxOptions,
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        inputValue: session.aiSessionName || `AI 对话 ${sessionId}`,
        inputPattern: /\S+/,
        inputErrorMessage: "标题不能为空",
      },
    );

    const newTitle = value.trim();
    if (!newTitle) return;

    await aiApi.modifyAITitle(sessionId, newTitle, userId);
    const target = sessions.value.find(
      (item) => getSessionId(item) === sessionId,
    );
    if (target) {
      target.aiSessionName = newTitle;
    }
    ElMessage.success("会话标题已修改");
  } catch (error) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error("修改会话标题失败");
    }
  }
};

const openSessionMenu = (event: MouseEvent, session: aiApi.AISession) => {
  const menuWidth = 136;
  const menuHeight = 84;
  sessionMenu.value = {
    visible: true,
    x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)),
    y: Math.max(
      8,
      Math.min(event.clientY, window.innerHeight - menuHeight - 8),
    ),
    session,
  };
};

const closeSessionMenu = () => {
  sessionMenu.value.visible = false;
  sessionMenu.value.session = null;
};

const handleContextRename = async () => {
  const session = sessionMenu.value.session;
  closeSessionMenu();
  if (session) {
    await handleRenameSession(session);
  }
};

const handleContextDelete = async () => {
  const session = sessionMenu.value.session;
  closeSessionMenu();
  if (session) {
    await handleDeleteSession(session);
  }
};

const handleDeleteSession = async (session: aiApi.AISession) => {
  const sessionId = getSessionId(session);
  if (!Number.isFinite(sessionId)) {
    ElMessage.error("AI 会话 ID 异常");
    return;
  }

  try {
    await ElMessageBox.confirm(
      "删除后无法恢复，确认删除该 AI 会话吗？",
      "删除会话",
      {
        ...aiChatMessageBoxOptions,
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    closeStream();
    await aiApi.deleteAISession(sessionId, userId);
    sessions.value = sessions.value.filter(
      (item) => getSessionId(item) !== sessionId,
    );

    if (activeSessionId.value === sessionId) {
      activeSessionId.value = null;
      displayMessages.value = [];
      const nextSession = sessions.value[0];
      if (nextSession) {
        await handleSelectSession(getSessionId(nextSession));
      }
    }

    ElMessage.success("会话已删除");
  } catch (error) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error("删除会话失败");
    }
  }
};

const getStreamingAssistantMessage = () => {
  const last = displayMessages.value[displayMessages.value.length - 1];
  if (last?.role === "assistant" && last.id === "streaming") {
    return last;
  }

  const message: DisplayMessage = {
    id: "streaming",
    role: "assistant",
    content: "",
  };
  displayMessages.value.push(message);
  return message;
};

const appendAssistantChunk = (chunk: string, eventName = "message") => {
  const normalizedEvent = eventName.toLowerCase();
  if (normalizedEvent === "end" || normalizedEvent === "done") {
    return;
  }

  const message = getStreamingAssistantMessage();
  if (isThink.value && thinkingEventNames.has(normalizedEvent)) {
    message.thought = `${message.thought || ""}${chunk}`;
  } else if (
    contentEventNames.has(normalizedEvent) ||
    !thinkingEventNames.has(normalizedEvent)
  ) {
    message.content += chunk;
    console.log(JSON.stringify(message.content));
  }
};

const handleSend = async () => {
  const sessionId = activeSessionId.value;
  const content = question.value.trim();
  if (!sessionId || !content || isStreaming.value) return;
  const shouldRefreshSessionTitle =
    pendingTitleRefreshSessionId.value === sessionId &&
    displayMessages.value.length === 0;

  displayMessages.value.push({
    id: `local-${Date.now()}`,
    role: "user",
    content,
  });
  question.value = "";
  isStreaming.value = true;
  await scrollToBottom();

  streamController = aiApi.sendAndReceive(
    sessionId,
    userId,
    content,
    isThink.value,
    appendAssistantChunk,
    () => {
      closeStream();
    },
    () => {
      streamController = null;
      isStreaming.value = false;
      if (shouldRefreshSessionTitle) {
        pendingTitleRefreshSessionId.value = null;
        loadSessions();
      }
    },
  );
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
  },
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
  justify-content: center;
  align-items: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.18);
}

.ai-chat-panel {
  width: 50vw;
  height: min(820px, calc(100vh - 48px));
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
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
  min-height: 0;
  display: flex;
  flex-direction: column;
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
  flex: 0 0 58px;
  height: 58px;
  padding: 0 14px;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid #edf0f5;
}

.history-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 10px;
}

.history-entry {
  width: 100%;
  min-height: 58px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #374151;
}

.history-item {
  min-width: 0;
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
  color: inherit;
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

.history-entry:hover,
.history-entry.active {
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
  min-height: 0;
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

.session-context-menu {
  position: fixed;
  z-index: 20001;
  width: 136px;
  padding: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
}

.session-context-menu button {
  width: 100%;
  height: 32px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #374151;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  padding: 0 10px;
}

.session-context-menu button:hover {
  background: #f3f4f6;
}

.session-context-menu button.danger {
  color: #b91c1c;
}

.session-context-menu button.danger:hover {
  background: #fee2e2;
}

:global(.ai-chat-message-box-overlay) {
  z-index: 20010 !important;
}

:global(.ai-chat-message-box) {
  z-index: 20011 !important;
}

.ai-chat-messages {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
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
  white-space: pre-wrap;
}

.message-thought summary {
  cursor: pointer;
  color: #5b35b1;
  font-weight: 600;
  user-select: none;
}

.message-thought-content {
  margin-top: 8px;
  font-size: 13px;
}

.message-content {
  white-space: normal;
  font-size: 14px;
}

.message-content :deep(p),
.message-content :deep(ul),
.message-content :deep(ol),
.message-content :deep(pre),
.message-content :deep(blockquote),
.message-content :deep(table),
.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4),
.message-content :deep(h5),
.message-content :deep(h6) {
  margin: 0 0 8px;
}

.message-content :deep(p:last-child),
.message-content :deep(ul:last-child),
.message-content :deep(ol:last-child),
.message-content :deep(pre:last-child),
.message-content :deep(blockquote:last-child),
.message-content :deep(table:last-child) {
  margin-bottom: 0;
}

.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4),
.message-content :deep(h5),
.message-content :deep(h6) {
  color: inherit;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  padding-left: 20px;
}

.message-content :deep(li + li) {
  margin-top: 3px;
}

.message-content :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
  padding: 10px;
  border-radius: 6px;
  background: #111827;
  color: #f9fafb;
  line-height: 1.5;
}

.message-content :deep(code) {
  border-radius: 4px;
  padding: 2px 5px;
  background: #eef2ff;
  color: #4c1d95;
  font-family: Consolas, "Courier New", monospace;
  font-size: 13px;
}

.message-content :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.message-content :deep(blockquote) {
  padding-left: 10px;
  border-left: 3px solid #c7d2fe;
  color: #4b5563;
}

.message-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.message-content :deep(th),
.message-content :deep(td) {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: top;
}

.message-content :deep(th) {
  background: #f3f4f6;
  font-weight: 700;
}

.message-content :deep(a) {
  color: #5b35b1;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.message-content :deep(img) {
  max-width: 100%;
  border-radius: 6px;
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
    padding: 20px;
  }

  .ai-chat-panel {
    width: calc(100vw - 150px);
    height: calc(100vh - 85px);
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
