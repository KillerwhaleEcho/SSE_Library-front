<template>
  <!-- 顶栏容器 -->
  <header class="app-header">
    <!-- 左侧标题 -->
    <router-link to="/home" class="header-title" data-tooltip="首页">
      <h1>SSE-Library</h1>
    </router-link>

    <!-- 右侧用户区域 -->
    <div class="header-user">
      <router-link to="/posts" class="icon-container" data-tooltip="论坛">
        <img src="@/assets/147_地址.png" alt="论坛" />
      </router-link>
      <router-link to="/chat" class="icon-container" data-tooltip="聊天">
        <img src="@/assets/147_对话-08.png" alt="聊天" />
        <div class="badge" v-if="unreadChatMessage > 0">
          {{ unreadChatMessage }}
        </div>
      </router-link>

      <ReminderBox
        :reminders="reminders"
        :unread-reminder="unreadReminder"
        @clear-all="handleClearAll"
        @mark-read="handleMarkRead"
      />

      <el-popover
        placement="bottom-end"
        trigger="click"
        width="160"
        popper-class="upload-post-popover"
      >
        <!-- Popover 内容：两个选项 -->
        <template #default>
          <div class="popover-option" @click="handleUploadClick">
            <i class="el-icon-upload" style="margin-right: 8px"></i>
            上传文件
          </div>
          <div class="popover-option" @click="handlePostClick">
            <i class="el-icon-edit" style="margin-right: 8px"></i>
            发帖
          </div>
        </template>

        <!-- 触发按钮：原上传文件图标 -->
        <template #reference>
          <div class="icon-container" data-tooltip="上传/发帖">
            <img src="@/assets/147_添加.png" alt="上传/发帖" />
          </div>
        </template>
      </el-popover>

      <router-link
        :to="role ? `/${role}` : '/login'"
        class="icon-container"
        data-tooltip="个人主页"
      >
        <img src="@/assets/147_联系人.png" alt="个人主页" />
      </router-link>
    </div>
  </header>
</template>

<script setup lang="ts">
import ReminderBox from "@/components/reminderBox.vue";
import "element-plus/dist/index.css";
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import * as allApi from "@/api/all.ts";
import router from "@/router";
import { ElMessage } from "element-plus";

const props = defineProps<{
  activeSessionId?: number | null;
}>();

const userId = Number(localStorage.getItem("userId") || "0");
const role = localStorage.getItem("role") || "user";
const reminders = ref<allApi.Reminder[]>([]);
const showCategoryDialog = ref(false);
const allCategories = ref<any[]>([]);
const selectedCategoryName = ref<string | null>(null);
const selectedCategoryId = ref<number | null>(null);
const unreadChatMessage = ref(0);
const unreadReminder = ref(0);
const socket = ref<WebSocket | null>(null);

// 定义事件发射器，用于向父组件发送事件
const emit = defineEmits(["open-upload-modal", "ws-message", "reminder-sync"]);

const handleUploadClick = () => {
  emit("open-upload-modal"); // 触发事件，通知父组件打开弹窗
};

const handlePostClick = () => {
  router.push("/sendPost");
};

watch(showCategoryDialog, (newVal, oldVal) => {
  console.log("showCategoryDialog 变化:", {
    旧值: oldVal,
    新值: newVal, // true 表示弹窗显示，false 表示弹窗隐藏
  });
});

const handleClearAll = async () => {
  const unreadIds = reminders.value
    .filter((item) => !item.isRead)
    .map((item) => item.reminderId);

  if (unreadIds.length) {
    await Promise.all(
      unreadIds.map((id) => allApi.markReminderAsRead(id).catch(() => null))
    );
  }

  reminders.value = [];
  await getUnreadCountOfReminder();
  emit("reminder-sync");
};

const handleMarkRead = async (reminderId: number) => {
  reminders.value = reminders.value.map((item) =>
    item.reminderId === reminderId ? { ...item, isRead: true } : item
  );
  try {
    await allApi.markReminderAsRead(reminderId);
    console.log("通知已标记为已读");
  } finally {
    await getUnreadCountOfReminder();
    emit("reminder-sync");
  }
};

const fetchReminders = async () => {
  try {
    const response = await allApi.getReminders(userId);
    console.log("获取提醒成功", response);
    reminders.value = response.data;
  } catch (error) {
    console.error("获取通知失败：", error);
  }
};

const getUnreadCountOfMessages = async () => {
  try {
    const res = await allApi.getUnreadMessage("message", userId);
    unreadChatMessage.value = res.data;
  } catch {
    console.log("获取未读聊天数量失败");
  }
};

const getUnreadCountOfReminder = async () => {
  try {
    const res = await allApi.getUnreadMessage("reminder", userId);
    unreadReminder.value = res.data;
  } catch {
    console.log("获取未读聊天数量失败");
  }
};

const refreshUnreadMessages = async () => {
  await getUnreadCountOfMessages();
};

const refreshUnreadReminder = async () => {
  await fetchReminders();
  await getUnreadCountOfReminder();
};

const markSessionRead = async (sessionId: number) => {
  try {
    await allApi.markSessionAsRead(sessionId);
  } catch {
    console.log("标记会话已读失败");
  }
};

const initWebSocket = () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  if (socket.value) {
    socket.value.close();
  }

  const ws = new WebSocket(`ws://localhost:8080/api/ws?token=${token}`);
  socket.value = ws;

  ws.onmessage = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === "chat_message") {
        const sessionId = Number(payload.data?.sessionId);
        const senderId = Number(payload.data?.senderId);
        const activeSessionId = Number(props.activeSessionId ?? -1);
        if (senderId !== Number(userId)) {
          if (sessionId === activeSessionId) {
            markSessionRead(sessionId);
            emit("ws-message", payload);
            return;
          }
          unreadChatMessage.value++;
        }
      } else {
        unreadReminder.value++;
      }
      emit("ws-message", payload);
    } catch (error) {
      console.error("解析 WebSocket 消息失败", error);
    }
  };

  ws.onopen = () => {
    console.log("WebSocket 连接成功");
  };
  ws.onerror = (event) => {
    console.error("WebSocket 发生错误", event);
  };
  ws.onclose = () => {
    socket.value = null;
  };
};

onMounted(() => {
  fetchReminders();
  getUnreadCountOfMessages();
  getUnreadCountOfReminder();
  initWebSocket();
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
    socket.value = null;
  }
});

defineExpose({ refreshUnreadReminder, refreshUnreadMessages });
</script>

<style scoped>
.app-header {
  width: 100%;
  top: 0;
  left: 0;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 8px hsla(0, 0%, 0%, 0.1);
  position: sticky;
  z-index: 10000;
}

.header-title h1 {
  margin-left: 20px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #b994fe;
  cursor: pointer;
  transition: color 0.3s;
}

.header-title h1:hover {
  color: #916ad9ff;
}

.header-user {
  padding: 10px;
  display: flex;
  align-items: center;
}

.icon-container {
  position: relative;
}

.icon-container::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -30px; /* 控制文字出现的位置 */
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(185, 148, 254, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
}

.icon-container:hover::after {
  opacity: 1;
}

.icon-container img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: filter 0.3s ease-in-out, opacity 0.3s ease-in-out;
}
/* 悬停时放大效果 */
.icon-container img:hover {
  transform: scale(1.1);
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ff4d4f; /* 红点颜色：红色 */
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 0 4px;
  z-index: 1; /* 确保红点在图标上方 */
}

/* 原有样式保留，补充通知图标红点样式 */
.app-header {
  width: 100%;
  top: 0;
  left: 0;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 8px hsla(0, 0%, 0%, 0.1);
  position: sticky;
  z-index: 10000;
}

.header-title h1 {
  margin-left: 20px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #b994fe;
  cursor: pointer;
  transition: color 0.3s;
}

.header-title h1:hover {
  color: #916ad9ff;
}

.header-user {
  padding: 10px;
  display: flex;
  align-items: center;
  position: relative; /* 子组件弹窗基于此定位 */
}

.icon-container {
  position: relative;
  margin: 0 8px; /* 图标间距优化 */
}

/* 图标提示 tooltip 样式（原有逻辑保留） */
.icon-container::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(185, 148, 254, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
}

.icon-container:hover::after {
  opacity: 1;
}

/* 图标样式（原有逻辑保留） */
.icon-container img {
  width: 36px; /* 图标尺寸优化：避免过大 */
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease-in-out;
}

.icon-container img:hover {
  transform: scale(1.1); /*  hover放大效果 */
}

.upload-post-popover {
  padding: 8px 0;
}

.popover-option {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.popover-option:hover {
  background-color: #eadffe;
}
</style>
