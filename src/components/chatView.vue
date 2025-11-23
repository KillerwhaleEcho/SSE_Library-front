<template>
  <topbar class="topbar"></topbar>
  <div class="chat-view">
    <aside class="chat-list">
      <div class="notice" @click="handleNoticeSelect">
        <span>通知</span>
        <figure v-if="unreadNoticeCount" class="notice-icon">
          <img :src="unnoticedUrl" alt="未读" width="40px">
          <span>{{ unreadNoticeCount }}</span>
        </figure>
      </div>
      <el-menu class="chat-menu" @select="handleSelect">
        <el-menu-item v-for="chatbox in appliedChatboxes" :index="chatbox.sessionId">
          <div class="chatbox-item">
            <figure class="contact-avatar">
              <img :src="chatbox.userAvatar1" alt="">
              <img v-if="chatbox.unreadCount" :src="unreadUrl" alt="未读消息" class="contact-avatar__badge">
            </figure>
            <div class="chatbox-content">
              <span>{{ chatbox.userName2 }}</span>
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
      <div v-if="isNotice" class="chat-content-main">
通知页面
      </div>
      <div v-else-if="!isNotice && currentSessionId" class="chat-content-main">
        <div class="chat-panel">
          <div class="chat-messages" ref="messageListRef">
            <div v-if="!messages.length" class="chat-messages__empty">暂无消息</div>
            <template v-else>
              <div
                v-for="(msg, index) in messages"
                :key="`${msg.sessionId}-${msg.senderId}-${index}`"
                class="message-row"
                :class="{ 'is-self': isSelfMessage(msg) }"
              >
                <img class="message-avatar" :src="msg.senderAvatar" alt="avatar">
                <div class="message-body">
                  <div class="message-bubble">
                    {{ msg.content }}
                  </div>
                  <span class="message-time">{{ formatMessageTime(msg.sendTime) }}</span>
                </div>
              </div>
            </template>
          </div>
          <div class="chat-input-area">
            <textarea
              v-model="chatInput"
              class="chat-input"
              rows="3"
              placeholder="输入消息，Enter发送 / Shift+Enter换行"
              @keydown.enter.exact.prevent="handleEnterSend"
            >
            
          </textarea>
            <button
              class="send-button"
              :disabled="!canSendMessage"
              @click="handleSendClick"
            >
              发送(S)
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
import topbar from '@/layout/topbar.vue'
import { ref, onMounted, computed, watch, nextTick } from "vue";
import {
  sendMessageInterface,
  getMessageList,
  getSessionList,
  getUserDetail,
} from "@/api/all";
import { type message, type chatBox } from "@/api/all";
import { ElMessage } from "element-plus";
import { chatBoxFallback, messageFallback } from "./admin/mockData";
import noticeIcon from '@/assets/147_通知.png'
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
const unreadNoticeCount = ref(3)
const unnoticedUrl = ref(noticeIcon)
const unreadUrl = ref(unreadIcon)
const isNotice = ref(false)
const messageListRef = ref<HTMLElement | null>(null)



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

const isSelfMessage = (msg: message) => msg.senderId === userInfo.value?.userId

const scrollToLatest = () => {
  nextTick(() => {
    const container = messageListRef.value
    if (!container) return
    container.scrollTop = container.scrollHeight
  })
}



const getUserId = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('userId')
}

const fetchUserInfo = async () => {
  const userId = getUserId()
  if (userId === null) {
    ElMessage.error('获取用户数据失败')
    return
  }

  try {
    const { data } = await getUserDetail(userId as string)
    userInfo.value = data.userBrief
  } catch {
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


const handleNoticeSelect = async () => {
  isNotice.value = true
}


const handleSelect = async (sessionId: number) => {
  isNotice.value = false
  currentSessionId.value = sessionId

  if (laodingMessages.value) return;

  if (useMockData.value) {
    messages.value = messageFallback
    return
  }

  try {
    laodingMessages.value = true;
    const { data } = await getMessageList(sessionId, userInfo.value?.userId as number);
    if (data.code === 200) {
      messages.value = data.data;
    }
  } catch (err: any) {
    ElMessage.error("获取聊天记录失败");
  } finally {
    laodingMessages.value = false;
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
  if(searchInput.value.trim()==='') return 
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

onMounted(() => {
  getSessions()
  fetchUserInfo()
  scrollToLatest()
})

</script>

<style scoped>
.chat-view {
  display: flex;
  background-color: #fff;
  height: 100%;
  width: 100%;
  border: 1px solid #ece4f6;
}

.chat-list {
  width: 20%;

  border-right: 1px solid #ece4f6;
  border-left: 1px solid #ece4f6;
}

.chat-menu {
  display: flex;
  flex-direction: column;
  border-right: none;
}

.chat-menu:deep(.el-menu-item) {
  display: flex;
  align-content: center;
  padding: 0 !important;
  min-width: 0;
}

.notice {
  display: flex;
  background-color: #d3befb;
  height: 10%;
  padding-left: 10px;
  align-items: center;
  font-size: 20px;
}

.notice-icon {
  display: flex;
  align-items: center;
  margin: 0;
  margin-left: auto;
  margin-right: 5px;
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
  height: 10%;
  min-width: 0;
  /*由于这个类标记的是一个flex子项，而子项的min-width是auto，也就是至少要装下全部内容，所以要修改成0，才能配合后边的值让超出的文本隐藏，这个键值对的含义是允许子项收缩*/
}

.contact-avatar {
  position: relative;
  /* 相对定位，会成为绝对定位子元素的定位上下文 */
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 35px;
  height: 35px;
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
  /* 允许文字收缩 */
  font-size: 12px;
  margin-left: 4px;
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

.chatview-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.chatview-top{
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
  height: 100%;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.chat-messages {
  flex: 1;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.chat-messages::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.chat-messages {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chat-messages__empty {
  margin: auto;
  color: #bdbdbd;
  font-size: 16px;
}

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-row.is-self {
  flex-direction: row-reverse;
}

.message-row.is-self .message-body {
  align-items: flex-end;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
}

.message-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 60%;
  gap: 6px;
}

.message-bubble {
  background: #fff;
  border-radius: 6px;
  padding: 10px 14px;
  line-height: 1.4;
  font-size: 14px;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
}

.message-row.is-self .message-bubble {
  background: #95ec69;
  color: #1f1f1f;
}

.message-time {
  font-size: 12px;
  color: #b1b1b1;
}

.chat-input-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid #e4e4e4;
  background: #fff;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  width: 100%;
  min-height: 60px;
  border: none;
  padding: 0;
  font-size: 14px;
  resize: none;
  outline: none;
  line-height: 1.5;
  box-sizing: border-box;
}

.chat-input:focus {
  border-color: #b994fe;
  box-shadow: 0 0 0 2px rgba(185, 148, 254, 0.15);
}

.send-button {
  min-width: 96px;
  height: 40px;
  border: none;
  border-radius: 6px;
  background: #12b365;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  align-self: flex-end;
  transition: opacity 0.2s;
}

.send-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

</style>



