<template>
  <div class="comment-list">
    <el-card class="comment-card">
      <section class="comment-card__body" v-loading="loading" element-loading-text="正在全力加载">
            <CommentSection :viewer="userInfo" :show-comment-user="true" :show-source-name="true" :show-search-bar="true">
        </CommentSection>
      </section>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage} from 'element-plus'
import { type UserBrief, getUserDetail } from '@/api/all'
import CommentSection from '../comments/CommentSection.vue'


const loading = ref(false)
const userInfo = ref<UserBrief | null>()


const getUserId = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('userId')
}

const fetchUserInfo = async () => {
  const userId = getUserId()
  try {
    const { data } = await getUserDetail(userId as string)
    userInfo.value = data.userBrief
  } catch {
    ElMessage.error('获取用户数据失败')
  }
}

onMounted(() => {
  fetchUserInfo()
})

</script>

<style scoped lang="css">
.comment-list {
  padding: 0;
  display: flex;
  flex-direction: column;
  align-content: center;
}

.comment-card {
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}

:deep(.el-card.comment-card) {
  border: none;
  box-shadow: none;
}

.comment-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  border: none;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.comment-card__body {
  flex: 1;
  min-height: 0;
  position: relative;
}





</style>
