<template>
  <div class="chat-view">
    <aside class="chat-list">
      <div class="reminder" @click="handleReminderSelect">
        <span>通知</span>
        <figure v-if="unreadReminderCount" class="reminder-icon">
          <img :src="reminderIconUrl" alt="未读" width="40px">
          <span>{{ unreadReminderCount }}</span>
        </figure>
      </div>
      <el-menu class="chat-menu" :default-active="String(currentSessionId || '')" @select="handleSelect">
        <el-menu-item v-for="chatbox in appliedChatboxes" :index="String(chatbox.sessionId)">
          <div class="chatbox-item">
            <figure class="contact-avatar">
              <img :src="chatbox.userAvatar1" alt="">
              <img v-if="chatbox.unreadCount" :src="unreadUrl" alt="未读消息" class="contact-avatar__badge">
            </figure>
            <div class="chatbox-content">
              <span class="chatbox-content-name">{{ chatbox.userName2 }}</span>
              <span>{{ chatbox.lastMessage }}</span>
            </div>
          </div>
        </el-menu-item>
      </el-menu>
    </aside>

    <section class="chatview-content">
      <div class="chatview-top">
        <div class="chatview-search">
          <input v-model="searchInput" @keyup.enter="handleSearch" placeholder="请输入搜索关键词，包括联系人和聊天内容">
          </input>
          <div class="chatview-button">搜索</div>
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
                <span class="reminder-time">{{ formatReminderTime(item.sendTime) }}</span>
              </div>
              <p class="reminder-content">{{ item.content }}</p>
              <button v-if="!item.isRead" class="reminder-mark" @click="markRead(item)">标记已读</button>
            </article>
          </div>
          <div v-else class="reminder-empty">暂无通知</div>
        </div>
      </div>
      <div v-else-if="!isReminder && currentSessionId" class="chat-content-main">
        <div class="chat-panel">
          <div class="chat-messages" ref="messageListRef">
            <div v-if="!messages.length" class="chat-content__empty"></div>
            <transition-group v-else name="msg-fade" :css="enableMsgAnim" tag="div" class="chat-messages__inner">
              <div v-for="(msg, index) in messages" :key="`${msg.sessionId}-${msg.senderId}-${index}`"
                class="message-row" :class="{ 'is-self': isSelfMessage(msg) }">
                <img class="message-avatar" :src="msg.senderAvatar" alt="avatar">
                <div class="message-body">
                  <div class="message-bubble">
                    {{ msg.content }}
                  </div>
                  <span class="message-time">{{ formatMessageTime(msg.sendTime) }}</span>
                </div>
              </div>
            </transition-group>
            <!-- 一组可以带过渡 / 动画效果的列表元素容器 -->
          </div>
          <div class="chat-input-area">

            <textarea v-model="chatInput" class="chat-input" rows="3" placeholder="输入消息，Enter发送 / Shift+Enter换行"
              @keydown.enter.exact.prevent="handleEnterSend">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from "vue";
import {
  sendMessageInterface,
  getMessageList,
  getSessionList,
  getUserDetail,
  getReminder,
  markReminderRead,
} from "@/api/all";
import { type message, type chatBox, type Reminder } from "@/api/all";
import { ElMessage } from "element-plus";
import { chatBoxFallback, fallbackAdminInfo, messageFallback, fallbackReminders } from "./admin/mockData";
import reminderIcon from '@/assets/147_通知.png'
import unreadIcon from '@/assets/红点消息.png'
import type { UserBrief } from "@/api/admin";

//聊天框应该显示的数据
// export interface chatBox{
//   sessionId: number
//   userId1: number
//   userAvatar1: string
//   userName1: string
//   userId2: number
//   userAvatar2: string
//   userName2: string
//   lastMessage: string
//   lastTime: string
//   unreadCount:number
// }

//聊天消息相关
// export interface message{
//   sessionId: number,
//   senderId: number
//   sendTime: string,
//   senderName: string
//   senderAvatar: string
//   content: string
//   status:'已发送'|'未接收'|'未读'
// }

//数据
const userInfo = ref<UserBrief | null>()
const chatBoxes = ref<chatBox[]>([]);
const messages = ref<message[]>([]);//当前聊天界面的message而不是所有message
const chatInput = ref("");


const currentSessionId = ref(0);
const searchInput = ref("");
const appliedInput = ref('')
const reminders = ref<Reminder[]>([])
const reminderIconUrl = ref(reminderIcon)
const unreadUrl = ref(unreadIcon)
const isReminder = ref(false)
const messageListRef = ref<HTMLElement | null>(null)
const enableMsgAnim = ref(true)


//后者改变影响前者但是前者修改不会影响后者
// 把username1固定为本人ID，构造appliedChatbox
const appliedChatboxes = computed(() => {
  const temp = chatBoxes.value.map(chatbox => {
    // 使用条件判断来决定属性值
    const shouldSwap = chatbox.userName2 === userInfo.value?.username;

    return {
      ...chatbox,
      userName1: shouldSwap ? chatbox.userName2 : chatbox.userName1,
      userName2: shouldSwap ? chatbox.userName1 : chatbox.userName2,
      userAvatar1: shouldSwap ? chatbox.userAvatar2 : chatbox.userAvatar1,
      userAvatar2: shouldSwap ? chatbox.userAvatar1 : chatbox.userAvatar2
    };
  })

  return temp.sort((a, b) => {
    const timeA = new Date(a.lastTime).getTime()
    const timeB = new Date(b.lastTime).getTime()
    return timeB - timeA
  })
})



//状态控制变量
const useMockData = ref(true)
const loadingSession = ref(false);
const laodingMessages = ref(false);
const sending = ref(false);

const unreadReminderCount = computed(() => reminders.value.filter(item => !item.isRead).length)
const reminderTypeDict: Record<string, string> = {
  comment: '评论',
  like: '点赞',
  favorite: '收藏',
  chat: '私信',
  admin: '系统',
}




const sortedReminders = computed(() => {
  return [...reminders.value].sort((a, b) => new Date(b.sendTime).getTime() - new Date(a.sendTime).getTime())
})

const canSendMessage = computed(() => chatInput.value.trim().length > 0 && !!currentSessionId.value)

const formatMessageTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return time
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}


const formatReminderTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return time
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`
}

const getReminderLabel = (type: string) => reminderTypeDict[type] ?? '未知'


const markRead = async (item: Reminder) => {
  item.isRead = true;

  try {
    const reponse = await markReminderRead(item.reminderId)
    if (reponse.data.code === 200) {
      return
    }
  } catch {
    ElMessage.error('标记已读失败')
    item.isRead = false;
  }
}

const isSelfMessage = (msg: message) => {
  const currentUserId = userInfo.value?.userId
  if (!currentUserId) return false
  return Number(msg.senderId) === Number(currentUserId)
}


const scrollToLatest = () => {
  nextTick(() => {
    const container = messageListRef.value
    if (!container) return
    container.scrollTop = container.scrollHeight
    // scrollTop：容器当前从顶部滚动下去的距离（可写）；scrollHeight：容器内部内容的总高度（只读）
    // 把当前滚动距离设置为内容的最大高度→ 滚动条直接跳到最底部。
  })
}



const getUserId = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('userId')
}

const fetchUserInfo = async () => {
  const userId = getUserId()

  if (!userId) {
    userInfo.value = fallbackAdminInfo
    return
  }

  try {
    const { data } = await getUserDetail(userId as string)
    userInfo.value = data.userBrief
  } catch {
    userInfo.value = fallbackAdminInfo
    ElMessage.error('获取用户数据失败')
  }

}

const getSessions = async () => {
  if (loadingSession.value) return;

  if (useMockData.value) {
    chatBoxes.value = chatBoxFallback
    return
  }

  try {
    loadingSession.value = true;
    const { data } = await getSessionList(userInfo.value?.userId as number);
    if (data.code === 200) {
      chatBoxes.value = data.data;
    }
  } catch {
    ElMessage.error("获取聊天列表失败");
  } finally {
    loadingSession.value = false;
  }
};

const getReminders = async () => {
  if (useMockData.value) {
    reminders.value = fallbackReminders
    return
  }

  try {
    const response = await getReminder(userInfo.value?.userId as number)
    if (response.data.code === 200) {
      reminders.value = response.data.data
    }
  } catch {
    ElMessage.error('获取通知数据失败')
  }
}


const handleReminderSelect = async () => {
  isReminder.value = true
}

//这个是聊天框的点击处理


const handleSelect = async (sessionId: string | number) => {
  // 切换会话时先关闭动画
  enableMsgAnim.value = false
  isReminder.value = false

  const sid = Number(sessionId)
  if (!sid) {
    // sid 不合法也要把动画开回去
    enableMsgAnim.value = true
    return
  }

  currentSessionId.value = sid

  const target = chatBoxes.value.find((item) => item.sessionId === sid)
  if (target) target.unreadCount = 0

  if (laodingMessages.value) {
    enableMsgAnim.value = true
    return
  }

  if (useMockData.value) {
    messages.value = messageFallback.filter((item) => item.sessionId === sid)
    // 等 DOM 更新完再开动画（这样切换不会动，但后续新消息会动）
    await nextTick()
    enableMsgAnim.value = true
    return
  }

  try {
    laodingMessages.value = true
    const { data } = await getMessageList(
      sid,
      userInfo.value?.userId as number
    )
    if (data.code === 200) {
      messages.value = data.data
    } else {
      messages.value = []
    }
  } catch (err) {
    messages.value = []
    ElMessage.error("获取聊天记录失败")
  } finally {
    laodingMessages.value = false

    // 同样：DOM 更新完再开动画
    await nextTick()
    enableMsgAnim.value = true
  }
}



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
    const { data } = await sendMessageInterface(sessionId, receiverId, content);
    if (data.code === 200) {
      clearchatInput();
    }
  } catch {
    ElMessage.error("发送失败");
  } finally {
    sending.value = false;
  }
};

const clearchatInput = () => {
  chatInput.value = "";
};

const handleSearch = () => {
  if (searchInput.value.trim() === '') return
  appliedInput.value = searchInput.value.trim()
};

const getReceiverIdBySession = (sessionId: number) => {
  const chatbox = chatBoxes.value.find(item => item.sessionId === sessionId)
  if (!chatbox) return null
  if (chatbox.userId1 === userInfo.value?.userId) return chatbox.userId2
  if (chatbox.userId2 === userInfo.value?.userId) return chatbox.userId1
  return chatbox.userId2
}

const handleSendClick = async () => {
  if (!canSendMessage.value || !currentSessionId.value) return
  const receiverId = getReceiverIdBySession(currentSessionId.value)
  if (!receiverId) {
    ElMessage.warning("Receiver not found")
    return
  }
  await sendMessage(currentSessionId.value, receiverId, chatInput.value)
}

const handleEnterSend = () => {
  handleSendClick()
}

watch(messages, () => {
  scrollToLatest()
}, { flush: 'post', deep: true })

watch(currentSessionId, () => {
  scrollToLatest()
})

onMounted(async () => {
  await fetchUserInfo()
  getSessions()
  getReminders()
  scrollToLatest()
})

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
  overflow-x: hidden;
  scrollbar-gutter: stable;
  padding: 10px 14px 10px 10px;
  /* right padding reserves scrollbar space */
  gap: 8px;
  scrollbar-width: none;
  /* Firefox 隐藏滚动条 */
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

.chat-menu:deep(.el-menu) {
  background: transparent;
  border-right: none;
}

.chat-menu:deep(.el-menu-item) {
  height: auto;
  line-height: normal;
  padding: 0 !important;
  border-radius: 8px;
  transition: background 0.2s ease, transform 0.15s ease;
}

.chat-menu:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(2px);
}

.chat-menu:deep(.el-menu-item.is-active) {
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #dfe5f7, 0 6px 16px rgba(17, 24, 39, 0.06);
}

.chat-menu:deep(.el-menu-item) {
  display: flex;
  align-content: center;
  padding: 0 !important;
  min-width: 0;
}

.reminder {
  position: sticky;
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
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.reminder:hover {
  background: #ffffff;
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


.chatbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  min-width: 0;
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

.chatbox-content-name {
  font-size: 16px;
  font-weight: 400;
}

.chatview-content {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  height: 100%;
  min-width: 0;
}



.chatview-top {
  background-color: #f7f5f5;
  width: 100%;
  height: 9%;
}

.chatview-search {
  background-color: #fff;
  height: 70%;
  margin: 5px 5px 0px;
  border: 1px solid #ddd;
  /* 容器边框 */
  display: flex;
  /* 使用flex布局让输入框和按钮并排显示 */
  align-items: center;
  /* 垂直居中对齐 */
  overflow: hidden;
  /* 防止内部元素超出容器 */
  border-radius: 8px;
}

.chatview-search:hover {
  border-color: #b994fe;
}

.chatview-button {
  height: 100%;
  /* 按钮高度与容器一致 */
  width: 40px;
  border: 1px solid #ddd;
  /* 移除按钮默认边框 */
  background: #fff;
  color: #666;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
  /* 水平居中 */
}

.chatview-button:hover {
  cursor: pointer;
  /* 设置光标为手的样式 */
  background: #f5f4f4;
}

.chatview-search input {
  flex: 1;
  height: 100%;
  padding: 0 12px;
  border: none;
  outline: none;
  /* 移除聚焦时的默认轮廓 */
  font-size: 15px;
  background: transparent;
}

.chat-view:has(input:focus) {
  border-color: #c1a1fd;
  /* 容器边框变紫色 */
  box-shadow: 0 0 8px 3px rgba(185, 148, 254, 0.3);
  /* 紫色外发光（荧光效果） */
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
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #3a3652;
}

.reminder-mark {
  padding: 0;
  font-size: 14px;
  line-height: 2;
  border-radius: 5px;
}

.reminder-mark:hover {
  border-color: rgb(242, 242, 207);
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
  background: radial-gradient(1200px 600px at 80% -10%, #eef2ff 0%, transparent 60%), #f6f7fb;
}

.chat-messages__inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-messages::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.chat-messages {
  scrollbar-width: none;
  -ms-overflow-style: none;
}



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
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
}

.chat-input {
  width: 100%;
  min-height: 90px;
  border: 1px solid #e9ecf5;
  border-radius: 6px;
  padding: 10px 0;
  font-size: 15px;
  font-weight: 400;
  resize: vertical;
  outline: none;
  background: #fbfcff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.chat-input:focus {
  border-color: #93c5fd;
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
