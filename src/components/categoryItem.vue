<template>
  <div class="category-item" @click="handleClick">
    <span class="category-name">{{ category.name }}</span>
    <hr />
    <div class="category-stats">
      <div class="category-count" data-tooltip="文件量">
        <img src="@/assets/147_阅读.png" alt="File Icon" data-tooltip="文件量"
          style="width:25px; height:25px; margin-right:4px;" />
        {{ category.fileCounts }}
      </div>
      <div class="category-count" data-tooltip="浏览量">
        <img src="@/assets/Fire (火热).png" alt="Collection Icon" data-tooltip="浏览量"
          style="width:20px; height:20px; margin-right:4px;" />
        {{ category.readCounts }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import * as allApi from '@/api/all.ts'

const props = defineProps<{
  category: allApi.Category;
}>();

const emit = defineEmits<{
  (e: 'click', category: allApi.Category): void
}>()

const router = useRouter()

const handleClick = () => {
  emit('click', props.category)
  const targetId = props.category?.id
  if (typeof targetId === 'number' && Number.isFinite(targetId)) {
    router.push({ path: '/categoryInfo', query: { id: targetId } })
  }
}
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
  cursor: pointer;
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