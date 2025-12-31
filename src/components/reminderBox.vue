<template>
  <!-- 使用 el-popover 作为弹出容器 -->
  <el-popover
    v-model:visible="isPanelVisible"
    placement="bottom-end"
    trigger="click"
    :width="380"
    :max-height="450"
    popper-class="notification-popover"
  >
    <!-- 弹出框内容 -->
    <template #default>
      <div class="panel-header">
        <h3 class="panel-title">
          通知
          <span class="badge tab-badge" v-if="unreadReminder > 0">{{ unreadReminder }}</span>
        </h3>
        <button class="clear-btn" @click="handleClearAll" :disabled="!reminders?.length">
          清空全部
        </button>
      </div>
      <div class="panel-content">
        <div class="notification-list">
          <div 
            class="notification-item" 
            v-for="item in filteredReminders" 
            :key="item.reminderId"
            :class="{ unread: !item.isRead }"
            @click="handleNotificationClick(item)"
          >
            <div class="notification-title">{{ item.type }}</div>
            <div class="notification-desc">{{ item.content }}</div>
            <div class="notification-time">{{ formatTime(item.sendTime) }}</div>
          </div>
          <div class="empty-tip" v-if="!reminders?.length">暂无通知</div>
        </div>
      </div>
    </template>

    <!-- 触发按钮（引用元素） -->
    <template #reference>
      <div class="icon-container" data-tooltip="通知">
        <img src="@/assets/147_通知.png" alt="通知">
        <div class="badge" v-if="unreadReminder > 0">{{ unreadReminder }}</div>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as allApi from '@/api/all.ts';
import { ElPopover } from 'element-plus';
import ChatView from '@/views/chatView.vue';

// 组件props定义
const props = defineProps<{
  reminders: allApi.Reminder[]; 
  unreadReminder: number; 
}>();

const emit = defineEmits<{
  (e: 'clear-all'): void;                    // 清空所有通知
  (e: 'mark-read', reminderId: number): void; // 标记单个通知已读
}>();

const router = useRouter();
const isPanelVisible = ref(false); // 控制popover显示状态

const filteredReminders = computed(() => {
  // 只返回未读的提醒（isRead 为 false）
  return props.reminders?.filter(item => !item.isRead) || [];
});

// 点击通知项处理
const handleNotificationClick = (item: allApi.Reminder) => {
  emit('mark-read', item.reminderId);
  router.push({
    name: 'Chat',
    query: {
      reminder:'true'
    }
  });
  isPanelVisible.value = false; // 关闭popover
};

// 清空所有通知
const handleClearAll = () => {
  emit('clear-all');
};

// 监听外部传入的通知数据变化
watch(
  () => props.reminders,
  (newVal) => {
    // 可以在这里添加数据变化后的处理逻辑
  },
  { deep: true }
);

// 时间格式化方法
const formatTime = (time: Date | string): string => {
  const now = new Date();
  const createTime = new Date(time);
  const diff = now.getTime() - createTime.getTime();
  
  const day = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (day > 0) return `${day}天前`;
  
  const hour = Math.floor(diff / (60 * 60 * 1000));
  if (hour > 0) return `${hour}小时前`;
  
  const minute = Math.floor(diff / (60 * 1000));
  if (minute > 0) return `${minute}分钟前`;
  
  return '刚刚';
};
</script>

<style scoped>
/* 保留原有样式，移除弹窗定位相关样式 */
.notification-popover {
  max-height: 450px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-btn:enabled:hover {
  color: #ff4d4f;
}

.clear-btn:disabled {
  cursor: not-allowed;
  color: #ccc;
}

.panel-content {
  padding: 16px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  padding: 12px;
  border-radius: 6px;
  background-color: #fafafa;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item.unread {
  background-color: #f5f3ff;
  border-left: 3px solid #b994fe;
}

.notification-item:hover {
  background-color: #f0f0f5;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 6px 0;
  color: #1f2937;
}

.notification-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
}

.empty-tip {
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
  padding: 40px 0;
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

/* 滚动条优化 */
.notification-popover::-webkit-scrollbar {
  width: 6px;
}

.notification-popover::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 3px;
}

/* 图标容器样式（从topbar迁移过来） */
.icon-container {
  position: relative;
  margin: 0 8px;
}

.icon-container img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease-in-out;
}

.icon-container img:hover {
  transform: scale(1.1);
}

.icon-container::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(185,148,254, 0.7);
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
</style>