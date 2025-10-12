<template>
  <div class="admin-panel">
    <!-- 左侧导航 -->
    <aside class="admin-panel__sidebar">
      <div class="admin-panel__brand">SSE-library</div>
      <el-menu
        :default-active="activeTab"
        class="admin-panel__menu"
        @select="handleSelect"
      >
        <!-- Element Plus的el-menu组件在触发select事件时，会传递被选中的菜单项的index作为参数。 -->
        <el-menu-item index="admin">管理员信息</el-menu-item>
        <el-menu-item index="users">用户列表</el-menu-item>
        <el-menu-item index="files" >文件</el-menu-item>
        <el-menu-item index="comments">评论列表</el-menu-item>
      </el-menu>
    </aside>

    <!-- 右侧内容 -->
    <section class="admin-panel__content">
      <!-- 管理员信息 -->
      <AdminInfo v-if="activeTab === 'admin'" />

      <!-- 用户列表 -->
      <UserList v-if="activeTab === 'users'" />
      <!-- 待审核文件列表 -->
       <doucument-list v-if="activeTab === 'files'" />
      <!-- 评论列表 --> 
      <comment-list v-if="activeTab === 'comments'" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AdminInfo from '../components/admin/adminInfo.vue'
import UserList from '../components/admin/userList.vue'

// 左侧菜单激活项（同 view 中不同栏目）
const activeTab = ref<'admin' | 'users'|'files'|'comments'>('admin')
const handleSelect = (index: string) => {
  if (index === 'admin' || index === 'users'||index==='files'||index==='comments') activeTab.value = index
}
</script>



<style scoped>


.admin-panel {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 100vh;
  padding: 24px;
  gap: 24px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f8 100%);
}


.admin-panel__brand{
  font-size: 18px;
  font-weight: 700;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #84db9dff 0%, #4ba264ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.admin-panel__sidebar {
  width: 240px;
  border-right: none;
  border-radius: 20px;
  border: 1px solid rgba(235, 238, 245, 0.7);
  background: #fff;
  box-shadow: 0 16px 36px rgba(31, 45, 61, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-panel__menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 12px 16px 16px;
}

.admin-panel__content {
  flex: 1;
  padding: 24px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 16px 36px rgba(31, 45, 61, 0.08);
  overflow: auto;
}

.admin-panel__menu :deep(.el-menu-item) {
  border-radius: 12px;
  margin: 4px 0;
  transition: all 0.2s ease;
}

.admin-panel__menu :deep(.el-menu-item:hover) {
  background: rgba(64, 158, 255, 0.08);
}

.admin-panel__menu :deep(.el-menu-item.is-active) {
  color: #409eff;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.18), rgba(64, 158, 255, 0.08));
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.25);
}
</style>
