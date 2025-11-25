<template>
  <div class="admin">
    <head class="admin__topbar">
      <h1 class="admin__title">SSE-library</h1>
      <el-menu
        class="admin__menu"
        :default-active="activeTab"
        @select="handleSelect"
      >
        <el-menu-item index="admin">我的信息</el-menu-item>
        <el-menu-item index="chat">聊天区</el-menu-item>
        <el-menu-item index="users">用户列表</el-menu-item>
        <el-menu-item index="files">资料列表</el-menu-item>
        <el-menu-item index="comments">评论列表</el-menu-item>
      </el-menu>
    </head>
    <div class="admin__content">
      <adminInfo v-if="activeTab === 'admin'"> </adminInfo>
      <userList v-if="activeTab === 'users'"></userList>
      <documentList v-if="activeTab === 'files'"></documentList>
      <commentList v-if="activeTab === 'comments'"></commentList>
      <chatView v-if="activeTab === 'chat'"></chatView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import adminInfo from "../components/admin/adminInfo.vue";
import userList from "../components/admin/userList.vue";
import commentList from "../components/admin/commentList.vue";
import documentList from "../components/admin/documentList.vue";
import chatView from "@/components/chatView.vue";

// 左侧菜单激活项（同 view 中不同栏目）
const activeTab = ref<"admin" | "users" | "files" | "comments" | "chat">(
  "admin"
);

const handleSelect = (index: string) => {
  if (
    index === "admin" ||
    index === "users" ||
    index === "files" ||
    index === "comments" ||
    index === "chat"
  )
    activeTab.value = index;
};

</script>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100vh;
  gap: 10px;
  margin: 0;
  padding: 0;
  overflow: auto;
  scrollbar-width: none;
}

.admin__topbar {
  width: 100%;
  top: 0;
  left: 0;
  /* 都指的是与父容器的间距 */
  padding: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 8px hsla(0, 0%, 0%, 0.1);
  position: sticky;
  /* 设置元素为粘性定位。粘性定位是相对定位和固定定位的混合。元素在跨越特定阈值前为相对定位，之后为固定定位。这里结合top:0，当页面滚动时，元素会固定在顶部。 */
  z-index: 10000;
  /*设置元素的堆叠顺序。数值越大，元素在层叠上下文中的位置越高。这里设置一个较大的值，确保该元素显示在其他元素之上。 */
  background-color: #fff;
  /* header 默认的 background-color 值就是 transparent，它不会自动继承父节点的背景； */
}

.admin__title {
  margin-left: 20px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #b994fe;
  cursor: pointer;
  transition: color 0.3s;
}
.admin__title:hover {
  color: #916ad9ff;
}

.admin__menu {
  display: flex;
  padding-left: 25px;
  border-right: none;
}

.admin__menu :deep(.el-menu-item:hover) {
  background-color: transparent !important;
  color: #916ad9ff;
}

.admin__menu:deep(.el-menu-item.is-active) {
  /* 括号里的其实是个交集选择器 */
  color: #916ad9ff;
  background-color: transparent !important;
}

.admin__content {
  width: 100%;
  height: 100%;
}
</style>
