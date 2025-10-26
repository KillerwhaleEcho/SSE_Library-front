<template>
  <div class="category-item">
    <div class="parent-item">
        <CategoryItem :category="category" @click="handleSelect(category)" />
    </div>
    <div class="child-items">
        <CategoryItem 
            v-for="subCategory in category.children" 
            :key="subCategory.id" 
            :category="subCategory" 
            @click="handleSelect(subCategory)"
        />
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
import CategoryItem from '@/components/categoryItem.vue';
import { defineProps, defineEmits } from 'vue';

// 接收父组件传入的单个分类数据
const props = defineProps<{
  category: allApi.Category;
}>();

// 定义向父页面传递事件的方法
const emit = defineEmits(['category-selected']);

// 处理点击事件，传递选中的分类数据
const handleSelect = (selectedCategory: allApi.Category) => {
  // 触发事件，将选中的分类数据传递给父页面
  emit('category-selected', selectedCategory);
};
</script>

<style scoped>
.category-item {
  width: 100%;
  display: flex;
  margin-bottom: 5px;
  padding: 8px;
}

.parent-item {
  width: 120px;
  margin-right: 16px;
}

.parent-item .category-item {
  width: 100px; 
  height: 60px;
}

.child-items {
  width: 80%;
  gap: 8px;
  flex-wrap: wrap;
  display: flex; /* 关键：启用 Flex 布局，子元素默认水平排列 */
  flex-direction: row;
}

.child-items .category-item {
  width: 100px; 
  height: 60px;
}
</style>