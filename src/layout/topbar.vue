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
        <img src="@/assets/147_地址.png" alt="个人主页">
      </router-link>
      <router-link to="/chat" class="icon-container" data-tooltip="聊天">
        <img src="@/assets/147_对话-08.png" alt="个人主页">
      </router-link>

      <ReminderBox 
        :reminders="reminders"
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
            <i class="el-icon-upload" style="margin-right: 8px;"></i>
            上传文件
          </div>
          <div class="popover-option" @click="handlePostClick">
            <i class="el-icon-edit" style="margin-right: 8px;"></i>
            发帖
          </div>
        </template>
        
        <!-- 触发按钮：原上传文件图标 -->
        <template #reference>
          <div class="icon-container" data-tooltip="上传/发帖">
            <img src="@/assets/147_添加.png" alt="上传/发帖">
          </div>
        </template>
      </el-popover>

      <router-link to="/user" class="icon-container" data-tooltip="个人主页">
        <img src="@/assets/147_联系人.png" alt="个人主页">
      </router-link>
    </div>

    <!-- 上传文件弹窗组件 -->
     <UploadModal 
      :showUploadModal="showUploadModal"
      :all-categories="allCategories"
      :selected-upload-category-name="selectedUploadCategoryName"
      @select-category="showCategoryDialog = true"
      @submit="handleUploadSubmit"
    />

    <!-- 分类弹窗（如果需要） -->
    <CategoryDialog 
      :showCategoryDialog="showCategoryDialog"
      :all-categories="allCategories"
      @category-selected="onCategorySelected"
    />
  </header>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import ReminderBox from '@/components/reminderBox.vue';
import 'element-plus/dist/index.css';
import { ref, computed, onMounted } from 'vue';
import * as allApi from '@/api/all.ts'
import UploadModal from '@/components/UploadModal.vue'
import CategoryDialog from '@/components/CategoryDialog.vue'

const handleUploadClick = () => {
  showUploadModal.value = true;
};

const handlePostClick = () => {
};

const userId = Number(localStorage.getItem('userId') || '0'); 
const reminders = ref<allApi.Reminder[]>([]);
const showUploadModal = ref(false)
const showCategoryDialog = ref(false)
const allCategories = ref<any[]>([])
const selectedUploadCategoryName = ref<string | null>(null)

const handleClearAll = () => {
  // 先标记所有未读通知为已读
  reminders.value
    .filter(item => !item.ifRead) // 筛选未读通知
    .forEach(item => handleMarkRead(item.reminderId)); // 逐个标记
    
  // 清空本地通知列表
  reminders.value = [];
};

const handleMarkRead = (reminderId: number) => {
  reminders.value = reminders.value.map(item => 
    item.reminderId === reminderId ? { ...item, ifRead: true } : item
  );
  allApi.markReminderAsRead(reminderId).then(() => console.log('通知已标记为已读'));
};

const fetchReminders = async () => {
  try {
    const response = await allApi.getReminders( userId );
    console.log("获取提醒成功", response);
    reminders.value = response.data;
  } catch (error) {
    console.error('获取通知失败：', error);
  }
};

// 获取所有分类
const getAllCategories = async () => {
  try {
    const response = await allApi.getAllCategories()
    allCategories.value = response.data || []
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 处理分类选择
const onCategorySelected = (category: any) => {
  selectedUploadCategoryName.value = category.name
  showCategoryDialog.value = false
}

// 处理上传提交
const handleUploadSubmit = (formData: FormData) => {
  // 实际上传逻辑
  console.log('提交上传数据:', formData)
  // 调用上传接口示例:
  // await allApi.uploadFile(formData)
}

onMounted(() => {
  fetchReminders();
  getAllCategories();
})
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
  box-shadow: 0 2px 8px hsla(0, 0%, 0%, 0.10);
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

.icon-container img{
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: filter 0.3s ease-in-out, opacity 0.3s ease-in-out;
}
/* 悬停时放大效果 */
.icon-container img:hover{
  transform: scale(1.1);
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
  box-shadow: 0 2px 8px hsla(0, 0%, 0%, 0.10);
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
