<template>
  <div class="category-item">
    <span class="category-name">{{ category.name }}</span>
    <hr />
    <div class="category-stats">
      <div class="category-count">
        <el-icon><OfficeBuilding /></el-icon>
        {{ category.file_counts }}
      </div>
      <div class="category-count">
        <el-icon><Collection /></el-icon>
        {{ category.read_counts }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Search,
  Refresh,
  OfficeBuilding,
  Collection,
  Calendar,
  Money,
  Plus,
  User,
  Timer,
  ChatDotRound
} from '@element-plus/icons-vue'
import * as allApi from 'C:/Users/Echo/Desktop/SSE_Library/front/src/api/all.ts'

// 接收父组件传入的单个分类数据
const props = defineProps<{
  category: allApi.Category;
}>();
</script>

<style scoped>
/* 单个分类项样式（可根据需求调整） */
.category-item {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 120px;
  height: 120px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: rgba(185, 148, 254, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;
}

.category-item:hover {
  box-shadow: 0 0 8px 3px rgba(185, 148, 254, 0.3);
}

.category-name {
  font-size: 20px;
  font-weight: 500;
  width: 100%;
  height: 70%;
  color: #6b6a6a;
  font-weight: 550;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-stats {
  width: 100%;
  height: 30%;
  font-size: 14px;
  color: #888;
  display: flex;
  justify-content: space-between;
}

.category-count {
  font-size: 14px;
  color: #666;
  width: 50%;
  display: flex;
  align-items: center;
}
</style>