<template>
  <div class="admin">
    <topbar />

    <div class="admin__page">
      <section class="profile-card" v-loading="infoLoading">
        <div class="profile-card__left">
          <div class="avatar-wrapper">
            <img :src="avatarSrc" alt="用户头像" />
          </div>
          <div class="profile-name">
            <h2>{{ adminDetail?.username || '未命名用户' }}</h2>
            <p class="uid">UID {{ adminDetail?.userId ?? '--' }}</p>
            <span class="status-badge">正常</span>
          </div>
        </div>

        <div class="ptofile-card-right">
<div class="profile-card__meta">
          <div class="meta-box">
            <p class="meta-label">邮箱</p>
            <p class="meta-value">{{ adminDetail?.email || '暂无邮箱' }}</p>
          </div>
          <div class="meta-box">
            <p class="meta-label">注册时间</p>
            <p class="meta-value">{{ adminDetail?.createTime || '--' }}</p>
          </div>
        </div>

        <div class="profile-card__actions">
          <el-button class="btn-danger" type="danger" plain @click="handleLogout">
            退出登录
          </el-button>
        </div>
        </div>
      </section>

      <section class="content-shell">
        <div class="tab-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-nav__item"
            :class="{ active: tab.key === activeTab }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="content-card">
          <AdminInfo v-if="activeTab === 'info'" @updated="handleProfileUpdated" />
          <commentList v-else-if="activeTab === 'comments'" />
          <documentList v-else-if="activeTab === 'files'" />
          <userList v-else-if="activeTab === 'users'" />
          <postList v-else-if="activeTab==='posts'"/>
          <div v-else class="empty-panel">
            <h4>暂无内容</h4>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import router from '@/router'
import topbar from '@/layout/topbar.vue'
import AdminInfo from '../components/admin/adminInfo.vue'
import commentList from '../components/admin/commentList.vue'
import documentList from '../components/admin/documentList.vue'
import userList from '../components/admin/userList.vue'
import postList from '@/components/admin/postList.vue'
import { type UserBrief } from '@/api/all'
import { getAdminDetail } from '@/api/admin'

type TabKey = 'info' | 'comments' | 'files' | 'users'|'posts'

const tabs = [
  { key: 'info' as TabKey, label: '修改信息' },
  { key: 'comments' as TabKey, label: '评论列表' },
  { key: 'files' as TabKey, label: '文件列表' },
  { key: 'users' as TabKey, label: '用户列表' },
  {key:'posts' as TabKey,label:'帖子列表'}
]

const activeTab = ref<TabKey>('info')
const adminDetail = ref<UserBrief | null>(null)
const infoLoading = ref(false)

const DEFAULT_AVATAR = 'https://placehold.co/140x140?text=Avatar'
const avatarSrc = computed(() => adminDetail.value?.userAvatar || DEFAULT_AVATAR)

const fetchAdminInfo = async () => {
  if (typeof window === 'undefined') return
  const cachedUserId = window.localStorage.getItem('userId')
  if (!cachedUserId) return

  infoLoading.value = true
  try {
    const response = await getAdminDetail(String(cachedUserId))
    const detail = (response as any).userBrief ? response as any : (response as any).data || response
    adminDetail.value = detail.userBrief || detail
  } finally {
    infoLoading.value = false
  }
}


const handleLogout = () => {
  router.push('/login')
}

const handleProfileUpdated = () => {
  fetchAdminInfo()
}


onMounted(() => {
  fetchAdminInfo()
})
</script>

<style scoped>
.admin {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f5ff 0%, #f6f7ff 55%, #f8f6ff 100%);
  color: #2f2459;
}

.admin__page {
  max-width: 1024px;
  margin: 10px auto 32px;
  padding: 0 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-card {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 1fr auto;
  gap: 24px;
  align-items: center;
  padding: 26px 32px;
  border-radius: 26px;
  background: #ffffff;
  box-shadow: 0 22px 60px rgba(102, 81, 222, 0.08);
  border: 1px solid rgba(120, 98, 255, 0.08);
}

.profile-card__left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.avatar-wrapper {
  width: 122px;
  height: 122px;
  border-radius: 50%;
  overflow: hidden;
  border: 5px solid rgba(160, 140, 255, 0.2);
  box-shadow: 0 16px 30px rgba(83, 60, 210, 0.12);
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-name h2 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #2d1f6a;
}

.profile-name .uid {
  margin: 0 0 10px;
  color: #7a6ba5;
  font-weight: 500;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: #ecfdf3;
  color: #14894f;
  font-weight: 700;
  font-size: 12px;
  box-shadow: inset 0 0 0 1px rgba(21, 163, 94, 0.08);
}
.ptofile-card-right{
display: flex;
flex-direction: column;
gap: 8px;
}

.profile-card__meta {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.meta-box {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(132, 108, 230, 0.16);
  background: linear-gradient(180deg, #fbfaff 0%, #f8f7ff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.meta-label {
  margin: 0 0 8px;
  color: #8b7bb8;
  font-size: 13px;
}

.meta-value {
  margin: 0;
  color: #2f2459;
  font-weight: 700;
  font-size: 16px;
  word-break: break-all;
}

.profile-card__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: stretch;
  justify-content: center;
}

.btn-primary {
  width: 156px;
  background: linear-gradient(135deg, #a686f4 0%, #7f6ae8 100%);
  border: none;
  box-shadow: 0 12px 28px rgba(111, 89, 241, 0.26);
}

.btn-danger {
  width: 156px;
  color: #d43b40;
  border-color: rgba(212, 59, 64, 0.28);
  align-self: flex-end;
}

.content-shell {
  background: transparent;
}

.tab-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px 12px;
  border-bottom: 1px solid #ede9fb;
}

.tab-nav__item {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 8px;
  color: #7a69b6;
  font-size: 16px;
  font-weight: 600;
  position: relative;
  cursor: pointer;
  transition: color 0.2s ease;
}

.tab-nav__item.active {
  color: #5d3ad8;
}

.tab-nav__item.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -12px;
  transform: translateX(-50%);
  width: 70px;
  height: 3px;
  border-radius: 999px;
  background: #5d3ad8;
}

.content-card {
  margin-top: 10px;
  background: #ffffff;
  border-radius: 22px;
  padding: 20px 22px 28px;
  box-shadow: 0 18px 50px rgba(102, 81, 222, 0.08);
  min-height: 240px;
}

.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #7d6aa8;
  height: 220px;
  font-weight: 600;
}

.empty-panel h4 {
  margin: 0;
  font-size: 16px;
  color: #584697;
}

@media (max-width: 960px) {
  .profile-card {
    grid-template-columns: 1fr;
  }

  .profile-card__actions {
    flex-direction: row;
    justify-content: flex-start;
  }

  .btn-primary,
  .btn-danger {
    width: auto;
    padding: 0 18px;
  }

  .tab-nav__item {
    font-size: 15px;
  }
}
</style>
