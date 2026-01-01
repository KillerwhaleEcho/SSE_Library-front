<template>
  <topbar
    ref="topbarRef"
    class="topbar"
    @open-upload-modal="showUploadModal = true"
    @ws-message="handleTopbarWsMessage"
    @reminder-sync="handleTopbarReminderSync"
  ></topbar>
  <div class="chat-view">
    <aside class="chat-list">
      <div class="reminder" @click="handleReminderSelect">
        <span>通知</span>
        <figure v-if="unreadReminderCount" class="reminder-icon">
          <img :src="reminderIconUrl" alt="未读" width="40px" />
          <span>{{ unreadReminderCount }}</span>
        </figure>
      </div>
      <!-- 传给default-active一个index，那个item就会高亮，这个高亮样式就是is-active -->
      <el-menu class="chat-menu" :default-active="currentSessionId === -1 ? '' : String(currentSessionId)
        " @select="handleSelect">
        <el-menu-item v-for="chatbox in appliedChatboxes" :index="chatbox.sessionId">
          <div class="chatbox-item">
            <figure class="contact-avatar">
              <img :src="chatbox.avatar2" alt="" />
              <img v-if="chatbox.unreadCount > 0" :src="unreadUrl" alt="未读消息" class="contact-avatar__badge" />
            </figure>
            <div class="chatbox-content">
              <div class="chatbox-up">
                <span class="chatbox-content-name">{{
                  chatbox.username2
                }}</span>
                <span class="chatbox-content-time">{{
                  formatTime(chatbox.lastTime)
                }}</span>
              </div>
              <div class="chatbox-down">
                <span v-if="chatbox.unreadCount > 0" class="matchedCount">[{{ chatbox.unreadCount }}条]</span>
                <span> {{ chatbox.lastMessage }}</span>
              </div>
            </div>
          </div>
        </el-menu-item>
      </el-menu>
    </aside>

    <section class="chatview-content">
      <div class="chatview-top">
        <div class="chatview-search">
          <el-select v-model="searchType" class="chatview-select" :teleported="false" placeholder="选择类型">
            <el-option label="用户" value="user" />
            <el-option label="聊天记录" value="message" />
          </el-select>
          <el-input v-model="searchInput" class="chatview-input" size="samll" @keyup.enter="handleSearch"
            :placeholder="searchPlaceholder" clearable>
            <template #append>
              <el-button size="samll" class="chatview-button" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
        <div v-if="currentSessionId !== -1" class="session-search" :class="{ 'is-open': localSearchExpanded }">
          <button class="session-search__icon" @click="toggleLocalSearch" title="本会话搜索">
            <img :src="localSearchIconUrl" alt="本会话搜索" />
          </button>
          <transition name="session-search-expand">
            <input v-show="localSearchExpanded" ref="localSearchInputRef" v-model="localSearchKeyword"
              class="session-search__input" placeholder="搜索当前会话的聊天记录" @keyup.enter="handleLocalSearch" />
          </transition>
        </div>
      </div>

      <div v-if="isReminder" class="chat-content-main">
        <div class="reminder-panel">
          <div class="reminder-header">
            <div>
              <p class="reminder-title">通知中心</p>
            </div>
            <div class="reminder-stats">
              <span class="reminder-chip reminder-chip__primary">未读 {{ unreadReminderCount }}</span>
              <span class="reminder-chip reminder-chip__ghost">全部 {{ reminders.length }}</span>
            </div>
          </div>
          <div v-if="sortedReminders.length" class="reminder-list">
            <article v-for="item in sortedReminders" :key="item.reminderId" class="reminder-card"
              :class="{ 'is-unread': !item.isRead }">
              <div class="reminder-card__meta">
                <span class="reminder-type" :class="`type-${item.type}`">
                  {{ getReminderLabel(item.type) }}
                </span>
                <span class="reminder-time">{{
                  formatTime(item.sendTime)
                }}</span>
              </div>
              <div class="reminder-content" @click="handleCheck(item)">
                {{ item.content }}
              </div>
              <div class="reminder-buttons">
                <button class="reminder-check" @click="handleCheck(item)">
                  查看详情
                </button>
                <button v-if="!item.isRead" class="reminder-mark" @click.stop="markReminderRead(item)">
                  标记已读
                </button>
              </div>
            </article>
          </div>
          <div v-else class="reminder-empty">暂无通知</div>
        </div>
      </div>
      <div v-else-if="!isReminder && currentSessionId != -1" class="chat-content-main">
        <div class="chat-panel">
          <div class="chat-messages" ref="messageListRef">
            <div v-if="!messages.length" class="chat-content__empty"></div>
            <transition-group v-else name="msg-fade" :css="enableMsgAnim" tag="div" class="chat-messages__inner">
              <div v-for="(msg, index) in messages" :key="`${msg.sessionId}-${msg.senderId}-${index}`"
                :id="`${msg.sessionId}-${msg.sendTime}`" class="message-row" :class="{ 'is-self': isSelfMessage(msg) }">
                <img class="message-avatar" :src="msg.senderAvatar" alt="avatar" />
                <div class="message-body">
                  <div class="message-bubble">
                    {{ msg.content }}
                  </div>
                  <span class="message-time">{{
                    formatTime(msg.sendTime)
                  }}</span>
                </div>
              </div>
            </transition-group>
            <!-- 一组可以带过渡 / 动画效果的列表元素容器 -->
          </div>
          <div class="chat-input-area">
            <textarea v-model="chatInput" class="chat-input" rows="3" placeholder="输入消息，Enter发送 / Shift+Enter换行"
              @keydown.enter.exact.prevent="handleSendClick">
      </textarea>
            <button class="send-button" :disabled="!canSendMessage" @click="handleSendClick">
              发送
            </button>
          </div>
        </div>
      </div>
      <div v-else class="chat-content__empty">
        <span>SSE-library</span>
      </div>
    </section>

    <el-dialog v-model="visible" title="搜索结果" width="560px" destroy-on-close class="chat-record-dialog">
      <el-menu v-if="searchResults.length" @select="handleResultSelect">
        <el-menu-item v-for="item in searchResults" :key="item.id" :index="item.id">
          <div class="chatbox-item">
            <figure class="contact-avatar">
              <img :src="item.avatar" />
            </figure>
            <div class="chatbox-content">
              <div class="chatbox-content-header">
                <span class="chatbox-content-name">{{ item.name }}</span>
                <span class="chatbox-tag" :class="`result-type-${item.type}`">{{
                  item.type === "message" ? "聊天记录" : "用户"
                }}</span>
                <span v-if="item.type === 'message'" class="chatbox-content-time">
                  {{ item.sendTime }}</span>
              </div>
              <div class="chatbox-down">
                <span v-if="item.type === 'session'" class="matchedCount">[{{ item.matchedCount }}条]</span>
                <span>{{ item.content }}</span>
              </div>
            </div>
          </div>
        </el-menu-item>
      </el-menu>
      <div v-else class="search-empty">暂无相关结果</div>
    </el-dialog>
  </div>

  <!-- 使用分离的组件 -->
  <CategoryDialog :visible="showCategoryDialog" @update:visible="showCategoryDialog = $event"
    :all-categories="allCategories" :selected-category-name="selectedCategoryName"
    :selected-category-id="selectedCategoryId" @category-selected="onCategorySelected" @reset-category="resetCategory"
    @category-added="handleCategoryAdded" />

  <UploadModal v-model:visible="showUploadModal" :selected-category-name="selectedUploadCategoryName"
    :selected-category-id="selectedCategoryId" @open-category-dialog="showCategoryDialog = true"
    @upload-success="handleUploadSuccess" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, useId } from "vue";
import { useRoute } from "vue-router";
import {
  sendMessageInterface,
  getMessageList,
  getSessionList,
  getUserDetail,
  getReminder,
  markReminderAsRead,
  globalSearch,
  searchUser,
  createChat,
} from "@/api/all";
import {
  type message,
  type chatBox,
  type Reminder,
  type UserBrief,
} from "@/api/all";
import { ElMessage } from "element-plus";
import {
  chatBoxFallback,
  fallbackReminders,
} from "../components/admin/mockData";
import reminderIcon from "@/assets/147_通知.png";
import unreadIcon from "@/assets/红点消息.png";
import localSearchIcon from "@/assets/搜索.png";
import * as allApi from "@/api/all";
import topbar from "@/layout/topbar.vue";
import router from "@/router";
import CategoryDialog from "@/components/CategoryDialog.vue";
import UploadModal from "@/components/UploadModal.vue";
import type { globalSearchItem } from "@/types/api";

interface SearchResultItem {
  id: string;
  type: "session" | "message" | "user";
  name: string;
  avatar: string;
  content: string;
  sessionId?: number;
  matchedCount?: number;
  userId?: number;
  sendTime?: string;
}

//数据
const userInfo = ref<UserBrief | null>();
const chatBoxes = ref<chatBox[]>([]);
const messages = ref<message[]>([]); //当前聊天界面的message而不是所有message
const chatInput = ref("");

const showCategoryDialog = ref(false);
const showUploadModal = ref(false);
// 分类相关数据
const allCategories = ref<allApi.Category[]>([]);
const selectedCategoryName = ref<string | null>(null);
const selectedCategoryId = ref<number | null>(null);
const selectedUploadCategoryName = ref<string | null>(null);

const currentSessionId = ref(-1);
const searchInput = ref("");
const searchType = ref<"message" | "user">("user");
const reminders = ref<Reminder[]>([]);
const reminderIconUrl = ref(reminderIcon);
const unreadUrl = ref(unreadIcon);
const localSearchIconUrl = ref(localSearchIcon);
const isReminder = ref(false);
const messageListRef = ref<HTMLElement | null>(null);
const enableMsgAnim = ref(true); //控制回话切换时让上一组消息被替换时不跑入场离厂动画
const visible = ref(false);
const searchResults = ref<SearchResultItem[]>([]);
const isSearchJump = ref(false);
const localSearchExpanded = ref(false);
const localSearchKeyword = ref("");
const localSearchInputRef = ref<HTMLInputElement | null>(null);
const topbarRef = ref<InstanceType<typeof topbar> | null>(null);
const route = useRoute();
const searchPlaceholder = computed(() =>
  searchType.value === "message"
    ? "请输入聊天记录的搜索关键词"
    : "请输入要搜索的用户名,点击可以直接与他聊天"
);
const unreadReminderCount = ref<Number|null>(null)

//状态控制变量
const useMockData = ref(false);
const loadingSession = ref(false);
const laodingMessages = ref(false);
const sending = ref(false);
const fetchingMessages = ref(false); //避免重复触发消息拉取

//后者改变影响前者但是前者修改不会影响后者
// 把username1固定为本人ID，构造appliedChatbox
const appliedChatboxes = computed(() => {
  const temp = chatBoxes.value.map((chatbox) => {
    const shouldSwap = chatbox.username2 === userInfo.value?.username;

    return {
      ...chatbox,
      username1: shouldSwap ? chatbox.username2 : chatbox.username1,
      username2: shouldSwap ? chatbox.username1 : chatbox.username2,
      avatar1: shouldSwap ? chatbox.avatar2 : chatbox.avatar1,
      avatar2: shouldSwap ? chatbox.avatar1 : chatbox.avatar2,
    };
  });

  return temp.sort((a, b) => {
    const timeA = new Date(a.lastTime).getTime();
    const timeB = new Date(b.lastTime).getTime();
    return timeB - timeA;
  });
});


const reminderTypeDict: Record<string, string> = {
  comment: "评论",
  like: "点赞",
  favorite: " 收藏",
};

const sortedReminders = computed(() => {
  return [...reminders.value].sort(
    (a, b) => new Date(b.sendTime).getTime() - new Date(a.sendTime).getTime()
  );
});

const canSendMessage = computed(
  () => chatInput.value.trim().length > 0 && currentSessionId.value != -1
);

const formatTime = (time: string) => {
  if (!time) return "";
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return time;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}月${day}日 ${hours}:${minutes}`;
};

const getReminderLabel = (type: string) => reminderTypeDict[type] ?? "未知";

const handleCheck = async (item: Reminder) => {
  const { sourceType, sourceId } = item;

  if (sourceType === "document") {
    router.push({
      name: "BookInfo",
      query: {
        id: String(sourceId),
      },
    });
    if (!item.isRead) {
      await markReminderRead(item);
    }
    return;
  }

  if (sourceType === "post") {
    router.push({
      name: "PostInfo",
      query: {
        postId: String(sourceId),
      },
    });
    if (!item.isRead) {
      await markReminderRead(item);
    }
    return;
  }
  ElMessage.warning("暂不支持查看该类型");
};

const markReminderRead = async (item: Reminder) => {
  item.isRead = true;
  try {
    const reponse = await markReminderAsRead(item.reminderId);
    if (reponse.code === 200) {
      await getUnreadCountOfReminder();
      await topbarRef.value?.refreshUnreadReminder();
      return;
    }
  } catch {
    ElMessage.error("标记已读失败");
    item.isRead = false;
  }
};

const isSelfMessage = (msg: message) => {
  const currentUserId = userInfo.value?.userId;
  if (!currentUserId) return false;
  return Number(msg.senderId) === Number(currentUserId);
};

const getUserId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userId");
};

const fetchUserInfo = async () => {
  const userId = getUserId();

  if (!userId) {
    ElMessage.error("无法获取用户信息，请先登录");
    router.push("/login");
  }

  try {
    const { data } = await getUserDetail(userId as string);
    userInfo.value = data.userBrief;
    // console.log(data),不是为啥这里data是响应体
    // console.log(data.userBrief)
  } catch {
    ElMessage.error("获取用户数据失败");
  }
};

const getSessions = async () => {
  if (loadingSession.value) return;

  if (useMockData.value) {
    chatBoxes.value = chatBoxFallback;
    return;
  }

  try {
    loadingSession.value = true;
    const res = await getSessionList(userInfo.value?.userId as number);
    chatBoxes.value = res.data; //类型没对齐的原因
  } catch {
    ElMessage.error("获取聊天列表失败");
  } finally {
    loadingSession.value = false;
  }
};

const getReminders = async () => {
  if (useMockData.value) {
    reminders.value = fallbackReminders;
    return;
  }

  try {
    const response = await getReminder(userInfo.value?.userId as number);
    reminders.value = Array.isArray(response.data) ? response.data : [];
  } catch {
    ElMessage.error("获取通知数据失败");
  }
};

//这个是搜索内容的点击处理
const handleResultSelect = async (id: string) => {
  const target = searchResults.value.find((item) => item.id === id);
  if (!target) return;

  visible.value = false;

  if (target.type === "message" && target.sessionId) {
    isSearchJump.value = true;
    await handleSelect(target.sessionId);
    await nextTick();
    scrollMessage(target.sessionId, target.sendTime as string);
    return;
  }

  if (target.type === "session") {
    await fetchMessages(target.sessionId as number);
    searchResults.value = mapMesasgesToResults(messages.value);
    visible.value = true;
  }

  if (target.type === "user" && target.userId) {
    const session = chatBoxes.value.find(
      (item) => item.userId1 === target.userId || item.userId2 === target.userId
    );
    if (session) {
      await handleSelect(session.sessionId);
    } else {
      await createNewChat(userInfo.value?.userId as number, target.userId);
      await getSessions();
      await handleSelect(target.sessionId as number);
    }
  }
};

const createNewChat = async (userId: number, oppositeId: number) => {
  try {
    await createChat(userId, oppositeId);
    ElMessage.success("成功与对方建立聊天");
  } catch {
    ElMessage.error("创建聊天失败");
  }
};

//定位到指定聊天记录的滚动逻辑
const scrollMessage = (sessionId: number, sendTime: string) => {
  const msgId = `${sessionId}-${sendTime}`;
  const el = document.getElementById(msgId);
  const container = messageListRef.value;
  if (!el || !container) return;

  const offsetTop = el.offsetTop - container.offsetTop;

  // 对“消息列表容器”滚动
  container.scrollTo({
    top: offsetTop - 40,
    behavior: "smooth",
  });

  // 搜索跳转已经完成，可以重新允许自动滚到底部
  isSearchJump.value = false;
};

const scrollToLatest = () => {
  nextTick(() => {
    const container = messageListRef.value;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
    // scrollTop：容器当前从顶部滚动下去的距离；scrollHeight：容器内部内容的总高度（只读）
    // 把当前滚动距离设置为内容的最大高度→ 滚动条直接跳到最底部。
  });
};

const isNearBottom = () => {
  const container = messageListRef.value;
  if (!container) return true;
  const threshold = 100; // px 容忍区间
  return (
    container.scrollHeight - container.scrollTop - container.clientHeight <
    threshold
  );
};

const resetLocalSearch = () => {
  localSearchExpanded.value = false;
  localSearchKeyword.value = "";
};

const handleReminderSelect = () => {
  isReminder.value = true;
  currentSessionId.value = -1;
  messages.value = [];
  resetLocalSearch();
};

//这个是聊天框的点击处理
const handleSelect = async (sessionId: number) => {
  // 切换会话时先关闭动画
  enableMsgAnim.value = false;
  isReminder.value = false;
  const sid = Number(sessionId);
  currentSessionId.value = sid;
  resetLocalSearch();

  const target = chatBoxes.value.find((item) => sessionId === item.sessionId);
  if (!target) return;
  target.unreadCount = 0;
  if (laodingMessages.value) {
    enableMsgAnim.value = true;
    return;
  }

  try {
    laodingMessages.value = true;
    await fetchMessages(sid);
  } catch (err) {
    messages.value = [];
    ElMessage.error("获取聊天记录失败");
  } finally {
    laodingMessages.value = false;
    // 同样：DOM 更新完再开动画
    await nextTick();
    enableMsgAnim.value = true;
    scrollToLatest();
    //后端应该是在拉取回话消息之后将未读数置为0，所以得放到最后调用刷新函数
    await await topbarRef.value?.refreshUnreadMessages?.();
  }
};

//将后端返回结果映射成要呈现的会话数据
const mapSessionsToResults = (list: globalSearchItem[]): SearchResultItem[] => {
  return list.map((item) => {
    const shouldSwap = item.userId2 === userInfo.value?.userId;

    return {
      id: `${item.sessionId}`,
      type: "session",
      name: shouldSwap ? item.username1 : item.username2,
      avatar: shouldSwap ? item.userAvatar1 : item.userAvatar2,
      content: item.example,
      sessionId: item.sessionId,
      matchedCount: item.matchedCount,
    };
  });
};

// 将后端返回结果映射成要呈现的会聊天数据
const mapMesasgesToResults = (list: message[]): SearchResultItem[] =>
  [...list].reverse().map((item) => ({
    id: `${item.sessionId}-${item.sendTime}`,
    type: "message",
    name: item.senderName,
    avatar: item.senderAvatar,
    content: item.content,
    sessionId: item.sessionId,
    sendTime: item.sendTime,
  }));

//将后端返回结果映射成要呈现的用户数据。TS的类型系统允许包含更多字段的对象传给只有部分字段的对象
const mapUsersToResults = (
  list: Array<Pick<UserBrief, "userId" | "username" | "userAvatar" | "email">>
): SearchResultItem[] =>
  list.map((user) => ({
    id: `user-${user.userId}`,
    type: "user",
    name: user.username,
    avatar: user.userAvatar,
    content: user.email || "用户",
    userId: user.userId,
  }));

const toggleLocalSearch = async () => {
  localSearchExpanded.value = !localSearchExpanded.value;
  if (localSearchExpanded.value) {
    await nextTick();
    localSearchInputRef.value?.focus();
  } else {
    localSearchKeyword.value = "";
  }
};

const handleLocalSearch = () => {
  const keyword = localSearchKeyword.value.trim();
  if (!keyword || currentSessionId.value === -1) return;
  const lowered = keyword.toLowerCase();
  const filtered = messages.value.filter(
    (item) =>
      item.sessionId === currentSessionId.value &&
      (item.content || "").toLowerCase().includes(lowered)
  );
  searchResults.value = mapMesasgesToResults(filtered);
  visible.value = true;
};

const handleSearch = async () => {
  const appliedInput = searchInput.value.trim();
  if (!appliedInput) return;

  try {
    if (searchType.value === "message") {
      const response = await globalSearch(
        userInfo.value?.userId as number,
        appliedInput
      );
      searchResults.value = mapSessionsToResults(response.data ?? []);
    } else {
      const response = await searchUser(undefined, appliedInput);
      searchResults.value = mapUsersToResults(response.data ?? []);
    }
    visible.value = true;
  } catch (error) {
    searchResults.value = [];
  }
};

const sendMessage = async (
  sessionId: number,
  receiverId: number,
  content: string
) => {
  if (sending.value) return;
  if (!content.trim()) {
    ElMessage.warning("发送的内容不能为空");
  }

  try {
    sending.value = true;
    await sendMessageInterface(sessionId, receiverId, content);
    chatInput.value = "";
  } catch {
    ElMessage.error("发送失败");
  } finally {
    sending.value = false;
  }
};

const getReceiverIdBySession = (sessionId: number) => {
  const chatbox = chatBoxes.value.find((item) => item.sessionId === sessionId);
  if (!chatbox) return null;
  if (chatbox.userId1 === userInfo.value?.userId) return chatbox.userId2;
  if (chatbox.userId2 === userInfo.value?.userId) return chatbox.userId1;
  return chatbox.userId2;
};

const fetchMessages = async (sessionId: number) => {
  if (!sessionId || fetchingMessages.value) return;
  try {
    fetchingMessages.value = true;
    const res = await getMessageList(
      sessionId,
      userInfo.value?.userId as number
    );
    messages.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    // 拉取失败时提示，避免频繁轮询重复提示
    if (!laodingMessages.value) {
      ElMessage.error("获取聊天记录失败");
    }
  } finally {
    fetchingMessages.value = false;
  }
};

const updateChatboxPreview = (
  sessionId: number,
  content: string,
  sendTime: string,
  isCurrentSession: boolean
) => {
  const exists = chatBoxes.value.some((item) => item.sessionId === sessionId);
  if (!exists) {
    getSessions();
    return;
  }

  chatBoxes.value = chatBoxes.value.map((item) =>
    item.sessionId === sessionId
      ? {
        ...item,
        lastMessage: content ?? item.lastMessage,
        lastTime: sendTime ?? item.lastTime,
        unreadCount: isCurrentSession ? 0 : item.unreadCount + 1,
      }
      : item
  );
};

const handleIncomingChatMessage = (payload: any) => {
  if (!payload || payload.type !== "chat_message" || !payload.data) return;
  //如果和userId不匹配直接返回
  const receiverId = Number(payload.receiverId);
  if (
    receiverId &&
    userInfo.value?.userId &&
    receiverId !== Number(userInfo.value.userId)
  ) {
    return;
  }

  const data = payload.data;
  const sessionId = Number(data.sessionId);

  const incomingMessage: message = {
    sessionId,
    senderId: Number(data.senderId),
    senderName: data.senderName || "",
    senderAvatar: data.senderAvatar || "",
    content: data.content || "",
    sendTime: data.sendTime,
    status: "未读" as any,
  };

  const isCurrentSession = sessionId === currentSessionId.value;

  if (isCurrentSession) {
    messages.value = [...messages.value, incomingMessage];
  }

  updateChatboxPreview(
    sessionId,
    incomingMessage.content,
    incomingMessage.sendTime,
    isCurrentSession
  );
};



const handleIncomingReminder = (payload :any) => {
  if (!payload || payload.type !== "reminder" || !payload.data) return;
  //如果和userId不匹配直接返回
  const receiverId = Number(payload.receiverId);
  if (
    receiverId &&
    userInfo.value?.userId &&
    receiverId !== Number(userInfo.value.userId)
  ) {
    return;
  }

  getUnreadCountOfReminder()
  getReminders()
}

const handleTopbarReminderSync = async () => {
  await getReminders();
  await getUnreadCountOfReminder();
};

const handleTopbarWsMessage = async (payload: any) => {
  if (!payload || !payload.type) return;
  if (payload.type === "chat_message") {
    handleIncomingChatMessage(payload);
    //如果是当前会话收到消息，不能让topbar的unreadCount增加，需要刷新纠正
    const sessionId = Number(payload.data?.sessionId);
    if (sessionId && sessionId === currentSessionId.value) {
      await topbarRef.value?.refreshUnreadMessages?.();
    }
    return;
  }
  if (payload.type === "reminder") {
    handleIncomingReminder(payload);
  }
};


const handleSendClick = async () => {
  if (!canSendMessage.value) return;
  const receiverId = getReceiverIdBySession(currentSessionId.value);
  try {
    await sendMessage(
      currentSessionId.value,
      receiverId as number,
      chatInput.value
    );
  } catch {
    ElMessage.error("消息发送失败");
  }

  scrollToLatest();
};

const getUnreadCountOfReminder =async () => {
  try {
    const res = await allApi.getUnreadMessage(
      'reminder',
      userInfo.value?.userId as number
    )
    unreadReminderCount.value = res.data
  } catch {
    ElMessage.error('获取未读通知数失败')
  }
}

// 分类相关方法
const onCategorySelected = (selected: allApi.Category) => {
  console.log("选中的分类：", selected);
  showCategoryDialog.value = false;
  selectedCategoryId.value = selected.id;

  if (showUploadModal.value === false) {
    // 如果在搜索场景下选择分类
    selectedCategoryName.value = selected.name;
  } else {
    // 如果在上传场景下选择分类
    selectedUploadCategoryName.value = selected.name;
  }
};

// 重置分类
const resetCategory = () => {
  selectedCategoryName.value = null;
  selectedUploadCategoryName.value = null;
  selectedCategoryId.value = null;
};

// 获取所有分类
const getAllCategories = async () => {
  try {
    const response = await allApi.getAllCategories();
    if (response.data) {
      allCategories.value = response.data;
    } else {
      allCategories.value = [];
      console.warn("获取分类数据格式不正确");
    }
    return allCategories.value;
  } catch (error) {
    console.error("获取所有分类失败:", error);
    allCategories.value = [];
    throw error;
  }
};

// 上传成功处理
const handleUploadSuccess = () => {
  console.log("上传成功，可以刷新数据");
};

const handleCategoryAdded = async () => {
  console.log("分类添加成功，重新加载分类数据");

  try {
    await getAllCategories();

    ElMessage.success("分类数据已更新");
  } catch (error) {
    console.error("刷新分类数据失败:", error);
    ElMessage.error("刷新数据失败");
  }
};
watch(
  () => showUploadModal.value,
  (newVal, oldVal) => {
    console.log("showUploadModal 变化:", oldVal, "->", newVal);

    if (newVal) {
      console.log("聊天页上传模态框已打开");
    } else {
      console.log("聊天页上传模态框已关闭");
    }
  }
);

watch(
  () => route.query.reminder,
  (val) => {
    if (val === "true" || val === "1") {
      handleReminderSelect();
    }
  }
);

watch(
  messages,
  async () => {
    if (isSearchJump.value) return;
    await nextTick();
    if (isNearBottom()) {
      scrollToLatest();
    }
  },
  { flush: "post", deep: true }
);

watch(currentSessionId, () => {
  if (!isSearchJump.value) {
    nextTick(() => {
      const el = messageListRef.value;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
});

onMounted(async () => {
  await fetchUserInfo(); //要用await，因为得按顺序执行
  await getSessions();
  await getReminders();
  getUnreadCountOfReminder()
  getAllCategories();
  const reminderFlag = route.query.reminder;
  if (reminderFlag === "true" || reminderFlag === "1") {
    handleReminderSelect();
  }
});
</script>

<style scoped>
.chat-view {
  display: flex;
  height: calc(100vh - 70px);
  width: 100%;
  background: #f6f7fb;
  border: none;
  border-radius: 14px;
  overflow: hidden;
}

.chat-list {
  flex: 0 0 clamp(240px, 22%, 320px);
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, #fbfcff 0%, #f2f5ff 100%);
  border-right: 1px solid #e9ecf5;
  overflow-y: auto;
  padding: 10px 14px 10px 10px;
  gap: 8px;
}

.chat-list::-webkit-scrollbar {
  /* Chrome/Edge/Safari 隐藏滚动条 */
  width: 0;
  height: 0;
}

.chat-menu {
  display: flex;
  flex-direction: column;
  border-right: none;
  background: transparent;
  gap: 6px;
}

.chat-menu.el-menu {
  background: transparent;
  border-right: none;
}

.chat-menu .el-menu-item {
  height: auto;
  width: 100%;
  line-height: normal;
  padding: 0 !important;
  border-radius: 8px;
  transition: background 0.2s ease, transform 0.15s ease;
  display: flex;
  align-items: center;
  min-width: 0;
}

.chat-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(2px);
}

.chat-menu .el-menu-item.is-active {
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #dfe5f7, 0 6px 16px rgba(17, 24, 39, 0.06);
}

.reminder {
  position: sticky;
  height: 40px;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: #ffffffcc;
  backdrop-filter: blur(6px);
  border: 1px solid #e9ecf5;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.reminder:hover {
  background-color: #d8caf7;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06);
}

.reminder-icon {
  display: flex;
  align-items: center;
  margin: 0;
  margin-right: 5px;
  font-size: 16px;
}

.chat-content__empty {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
  font-weight: 600;
  color: #b994fe;
  height: 100%;
  flex: 1;
}

.search-empty {
  padding: 18px 0;
  text-align: center;
  color: #8a829f;
  font-size: 14px;
}

/* 在浏览器检查下，可以看到这两个玩意的DOM元素在渲染时都没有被加上scopedId，所以全部包在deep里来脱离scoped控制避免在实际编译时被加上scopedId */
:deep(.chat-record-dialog .el-dialog__body) {
  margin-top: 15px;
  max-height: 420px;
  overflow-y: auto;
}

.chatbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  width: 100%;
}

.contact-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 44px;
  height: 44px;
  margin: 0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(17, 24, 39, 0.08);
}

.contact-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
  margin: 0;
}

.contact-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
  margin: 0;
}

.contact-avatar__badge {
  position: absolute;
  /* 绝对定位，导致元素脱离文档流，可以发生重叠*/
  top: -4px;
  right: -4px;
  object-fit: contain;
  /* 从顶部向上偏移4px，从右侧向右偏移4px，contain：保持宽高比，完整显示整个图片，可能会有留白 */
}

.chatbox-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 4px;
}

.chatbox-content span {
  display: block;
  line-height: 1.2;
  /*Element-plus有默认line-height：56px,这就是它会显得很高的原因*/
  margin: 0;
  padding: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chatbox-up {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
}

.chatbox-content-name {
  font-size: 16px;
  font-weight: 400;
}

.chatbox-content-time {
  font-size: 10px;
  font-weight: 200;
  margin-left: auto;
}


.chatbox-down {
  display: flex;
}

.matchedCount {
  color: #ac82f4;
}

.chatbox-content-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chatbox-tag {
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 12px;
  color: #4b5563;
  background: #eef2ff;
}


.result-type-user {
  color: #1d4ed8;
  background: #e0e7ff;
}

.result-type-message {
  color: #7c3aed;
  background: #f3e8ff;
}

.chatview-content {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.chatview-top {
  position: relative;
  padding: 10px 12px 4px;
  background: #f7f7fb;
}

.session-search {
  position: absolute;
  /* 适合悬浮、徽标、气泡等不需要参与流式排版的元素。 */
  left: 12px;
  top: calc(100% + 2px);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: #ffffff;
  border: 1px solid #e4e7f3;
  border-radius: 10px;
  width: fit-content;
  /* 这里也设置了width */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  z-index: 2;
}

.session-search.is-open {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.session-search__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.session-search__icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.session-search__input {
  width: 220px;
  opacity: 1;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 6px 4px;
  background: transparent;
  border-bottom: 1px solid #dfe1eb;
  transition: width 0.18s ease, padding 0.18s ease, opacity 0.18s ease,
    border-color 0.18s ease, transform 0.18s ease;
}

.session-search-expand-enter-active,
.session-search-expand-leave-active {
  transition: width 0.18s ease, padding 0.18s ease, opacity 0.18s ease,
    border-color 0.18s ease, transform 0.18s ease;
}

.session-search-expand-enter-from,
.session-search-expand-leave-to {
  width: 0;
  opacity: 0;
  padding: 6px 0;
  border-color: transparent;
  transform: translateX(-6px);
  /* 视觉效果是从稍微往左的位置淡入/滑入，或者在淡出时稍微往左滑一下。不会影响其他元素的排版，占位保持不变 */
}

.chatview-search {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fff;
  border: 1px solid #dfe1eb;
  border-radius: 12px;
  padding: 6px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.chatview-select {
  width: 142px;
}

:deep(.chatview-select .el-select__wrapper) {
  border-radius: 8px;
  min-height: 40px;
  padding-top: 6px;
  padding-bottom: 6px;
  font-size: 15px;
}

.chatview-input {
  flex: 1;
}

.chatview-input :deep(.el-input__wrapper) {
  min-height: 40px;
}

:deep(.el-input-group__append) {
  background-color: #b994fe !important;
}

.chatview-button {
  min-height: 40px;
  padding: 0 18px;
  min-width: 88px;
  background-color: #b994fe !important;
  color: white !important;
}

.chat-content-main {
  flex: 1;
  display: flex;
  background-color: #fff;
  min-height: 0;
  overflow: hidden;
}

.reminder-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  width: 100%;
  background: linear-gradient(180deg, #f9f7ff 0%, #ffffff 100%);
  overflow-y: auto;
}

.reminder-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.reminder-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #3c2f60;
}

.reminder-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #746b93;
}

.reminder-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reminder-chip {
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  border: 1px solid transparent;
}

.reminder-chip__primary {
  background: #efe7ff;
  color: #5c3cbe;
  border-color: #ddccff;
}

.reminder-chip__ghost {
  background: #ffffff;
  color: #8076a3;
  border-color: #ebe5ff;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
}

.reminder-card {
  background: #ffffff;
  border: 1px solid #ede7ff;
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 2px 4px rgba(91, 64, 165, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease; */
}

/* .reminder-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(91, 64, 165, 0.12);
  border-color: #d7c8ff;
} */

.reminder-card.is-unread {
  border-color: #c6b4ff;
  background: #f9f6ff;
}

.reminder-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.reminder-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  color: #3c2f60;
  background: #f0e8ff;
}

.reminder-type.type-comment {
  color: #2f855a;
  background: #e6ffef;
}

.reminder-type.type-like {
  color: #c53030;
  background: #ffecec;
}

.reminder-type.type-favorite {
  color: #b7791f;
  background: #fff6e6;
}

/* .reminder-type.type-chat {
  color: #2b6cb0;
  background: #e8f2ff;
} */

.reminder-type.type-admin {
  color: #5c3cbe;
  background: #efe7ff;
}

.reminder-time {
  font-size: 12px;
  color: #8a829f;
}

.reminder-content {
  margin-top: 10px;
  padding: 10px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.6;
  border-radius: 12px;
  background-color: rgb(242, 234, 253);
}

.reminder-buttons {
  margin-top: 10px;
  margin-left: auto;
}

.reminder-check {
  padding: 6px;
  font-size: 14px;
  line-height: 1.6;
  border-radius: 10px;
  font-weight: 500;
  background-color: #d8e2f4;
}

.reminder-mark {
  margin-left: 20px;
  padding: 4px;
  font-size: 14px;
  line-height: 1.6;
  border-radius: 10px;
  font-weight: 500;
  background-color: #eeeaf7;
}

.reminder-mark:hover {
  border-color: rgb(164, 211, 242);
}

.reminder-empty {
  width: 100%;
  padding: 48px 0;
  text-align: center;
  color: #8a829f;
  font-size: 14px;
  background: #fff;
  border: 1px dashed #e1d9ff;
  border-radius: 12px;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scroll-behavior: smooth;
  background: radial-gradient(1200px 600px at 80% -10%,
      #eef2ff 0%,
      transparent 60%),
    #f6f7fb;
}

.chat-messages__inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* .chat-messages::-webkit-scrollbar {
  width: 0;
  height: 0;
} */

/* .chat-messages {
  scrollbar-width: none;
  -ms-overflow-style: none;
} */

.message-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
}

.message-row.is-self {
  flex-direction: row-reverse;
}

.is-self {
  width: 80%;
  flex-direction: row-reverse;
  align-self: flex-end;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(17, 24, 39, 0.12);
}

.message-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 72%;
  gap: 6px;
}

.message-bubble {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 10px 14px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  box-shadow: 0 6px 16px rgba(17, 24, 39, 0.06);
  border: 1px solid #eef0f6;
}

.message-row.is-self .message-bubble {
  background: #dbeafe;
  border-color: #c7ddff;
  color: #0f172a;
}

.message-bubble::after {
  content: "";
  position: absolute;
  top: 10px;
  left: -6px;
  width: 10px;
  height: 10px;
  background: inherit;
  border-left: inherit;
  border-bottom: inherit;
  transform: rotate(45deg);
}

.message-row.is-self .message-bubble::after {
  left: auto;
  right: -6px;
  border-left: none;
  border-right: inherit;
}

.message-row.is-self .message-body {
  align-items: flex-end;
}

.message-row.is-self .message-bubble {
  background: #dbe6f3;
  color: #1f1f1f;
}

.message-row.is-self .message-avatar {
  align-self: flex-start;
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  margin-left: 2px;
}

/* 这个输入区域是由固定最小高度的，可以计算 */
.chat-input-area {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e9ecf5;
  background: #ffffff;
  gap: 8px;
  padding: 10px 12px;
}

.chat-input {
  width: 100%;
  min-height: 90px;
  border: 1px solid #e9ecf5;
  border-radius: 6px;
  padding: 6px 5px;
  align-self: center;
  font-size: 15px;
  font-weight: 550;
  resize: vertical;
  outline: none;
  background: #fbfcff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.chat-input:focus {
  border-color: #9ec5f2;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.35);
}

.send-button {
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, opacity 0.2s ease, box-shadow 0.2s ease;
  margin: 0 4px 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.25);
  align-self: flex-end;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.32);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.send-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* transition-group for messages */
.msg-fade-enter-active,
.msg-fade-leave-active {
  transition: all 0.25s ease;
}

.msg-fade-enter-from,
.msg-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
