<template>
    <div class="page">
        <Topbar />

        <main class="page-body">
            <section class="section section-brief">
                <div class="brief-left">
                    <div class="avatar-wrapper">
                        <img :src="userBrief?.userAvatar || defaultAvatar" alt="user avatar" />
                    </div>
                    <div class="name-block">
                        <h2>{{ userBrief?.username || '未命名用户' }}</h2>
                        <p class="user-id">UID {{ userBrief?.userId ?? '—' }}</p>
                        <span class="status" :data-status="userBrief?.status || 'inactive'">
                            {{ statusLabel }}
                        </span>
                    </div>
                </div>

                <div class="brief-right">
                    <div class="info-grid">
                        <div class="info-item">
                            <p class="label">邮箱</p>
                            <p class="value">{{ userBrief?.email || '暂无' }}</p>
                        </div>
                        <div class="info-item">
                            <p class="label">角色</p>
                            <p class="value">{{ userBrief?.role || '未分配' }}</p>
                        </div>
                        <div class="info-item">
                            <p class="label">注册时间</p>
                            <p class="value">{{ userBrief?.createTime || '—' }}</p>
                        </div>
                        <div class="info-item">
                            <p class="label">账号状态</p>
                            <p class="value">{{ statusLabel }}</p>
                        </div>
                    </div>

                    <button class="edit-btn" type="button" @click="handleEditProfile">
                        编辑个人资料
                    </button>
                </div>
            </section>

            <section class="section-tabs">
                <div class="tabs" role="tablist" ref="tabContainer">
                    <button v-for="(tab, index) in tabs" :key="tab.key" class="tab-button"
                        :class="{ active: tab.key === activeTab }" role="tab" type="button"
                        :aria-selected="tab.key === activeTab" :ref="el => setTabRef(el, index)"
                        @click="handleTabClick(tab.key)">
                        {{ tab.label }}
                    </button>
                    <span class="tab-underline" :style="underlineStyle" :data-dir="underlineDirection"></span>
                </div>
            </section>

            <section class="section tab-content" role="tabpanel">
                <template v-if="activeTab === 'docs'">
                    <div class="doc-tabs">
                        <button type="button" class="doc-tab" :class="{ active: activeDocTab === 'collection' }"
                            @click="activeDocTab = 'collection'">
                            收藏
                        </button>
                        <span class="tab-divider">|</span>
                        <button type="button" class="doc-tab" :class="{ active: activeDocTab === 'history' }"
                            @click="activeDocTab = 'history'">
                            历史
                        </button>
                    </div>

                    <div v-if="activeDocTab === 'collection'">
                        <BookListItem v-for="doc in collectionDocs" :key="doc.infoBrief.documentId" :document="doc" />
                        <p v-if="!collectionDocs.length" class="placeholder">暂无收藏记录</p>
                    </div>

                    <div v-else>
                        <BookListItem v-for="doc in historyDocs" :key="doc.infoBrief.documentId" :document="doc" />
                        <p v-if="!historyDocs.length" class="placeholder">暂无浏览历史</p>
                    </div>
                </template>

                <template v-else-if="activeTab === 'comments'">
                    <CommentSection :viewer="commentViewer" :show-editor="false" :show-reply-button="false"
                        :show-source-name="true" />
                </template>

                <template v-else-if="activeTab === 'uploads'">
                    <BookListItem v-for="doc in uploadsDocs" :key="doc.infoBrief.documentId" :document="doc" />
                    <p v-if="!uploadsDocs.length" class="placeholder">暂无上传记录</p>
                </template>

                <template v-else>
                    <p class="placeholder">{{ activePlaceholder }}</p>
                </template>
            </section>

            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Topbar from '@/layout/topbar.vue'
import { getUserAll, getUserUploadDoc, type UserAll } from '@/api/user'
import { useAuthStore } from '@/stores/auth'
import BookListItem from '@/components/bookListItem.vue'
import CommentSection from '@/components/comments/CommentSection.vue'
import type { Document, InfoBrief, UserBrief } from '@/api/all.ts'

const authStore = useAuthStore()
const route = useRoute()
const userAll = ref<UserAll | null>(null)
const uploadsDocs = ref<Document[]>([])
const errorMessage = ref('')
const defaultAvatar = 'https://placehold.co/120x120?text=Avatar'

type TabKey = 'docs' | 'comments' | 'uploads' | 'posts'
interface TabItem {
    key: TabKey
    label: string
    placeholder: string
}

const tabs: TabItem[] = [
    { key: 'docs', label: '文档列表', placeholder: '文档列表内容占位，稍后填充。' },
    { key: 'comments', label: '评论', placeholder: '评论内容占位，稍后填充。' },
    { key: 'uploads', label: '我的上传', placeholder: '我的上传占位，稍后填充。' },
    { key: 'posts', label: '帖子列表', placeholder: '帖子列表占位，稍后填充。' }
]

const activeTab = ref<TabKey>('docs')
const tabRefs = ref<(HTMLElement | null)[]>([])
const tabContainer = ref<HTMLElement | null>(null)
const underlineStyle = ref({ left: '0px', right: '0px' })
const underlineDirection = ref<'right' | 'left'>('right')
const previousLeft = ref(0)
const activeDocTab = ref<'collection' | 'history'>('collection')
const commentViewer = computed<UserBrief | null>(() => {
    const brief = userBrief.value
    if (!brief) return null
    return {
        userId: brief.userId,
        username: brief.username,
        userAvatar: brief.userAvatar,
        status: brief.status,
        createTime: brief.createTime,
        email: brief.email,
        role: brief.role,
    }
})

const setTabRef = (el: HTMLElement | null, index: number) => {
    tabRefs.value[index] = el
}

const routeUserId = computed(() => {
    const raw = route.query.userId
    const parsed = typeof raw === 'string' ? Number(raw) : Array.isArray(raw) ? Number(raw[0]) : NaN
    return Number.isFinite(parsed) ? parsed : null
})

const resolvedUserId = computed(() => {
    if (routeUserId.value !== null) return routeUserId.value
    return authStore.userInfo?.userId ?? Number(localStorage.getItem('userId') || 0)
})

const userBrief = computed(() => userAll.value?.userBrief)
const collectionList = computed(() => userAll.value?.collectionList ?? [])
const historyList = computed(() => userAll.value?.historyList ?? [])

const mapBriefToDoc = (item: InfoBrief): Document => ({
    infoBrief: item,
    cover: '',
    author: '',
    introduction: '',
    createYear: '',
})

const collectionDocs = computed(() => collectionList.value?.map(mapBriefToDoc) ?? [])
const historyDocs = computed(() => historyList.value?.map(mapBriefToDoc) ?? [])
const statusLabel = computed(() => {
    const status = userBrief.value?.status
    if (status === 'active') return '正常'
    if (status === 'inactive') return '停用'
    return status || '未知'
})

const fetchUserAll = async () => {
    errorMessage.value = ''
    if (!resolvedUserId.value) {
        errorMessage.value = '未能获取用户信息，请先登录。'
        return
    }

    try {
        const res = await getUserAll(resolvedUserId.value)
        if (res.code === 200) {
            userAll.value = res.data
        } else {
            errorMessage.value = res.message || '获取用户信息失败'
        }
    } catch (error) {
        console.error('获取用户信息失败', error)
        errorMessage.value = '网络异常，请稍后重试'
    }
}

const fetchUserUploads = async () => {
    errorMessage.value = ''
    if (!resolvedUserId.value) {
        errorMessage.value = '未能获取用户信息，请先登录。'
        uploadsDocs.value = []
        return
    }

    try {
        const res = await getUserUploadDoc(resolvedUserId.value)
        if (res.code === 200) {
            uploadsDocs.value = res.data?.map(mapBriefToDoc) ?? []
        } else {
            errorMessage.value = res.message || '获取上传记录失败'
        }
    } catch (error) {
        console.error('获取上传记录失败', error)
        errorMessage.value = '网络异常，请稍后重试'
    }
}

const handleEditProfile = () => {
    console.info('编辑个人资料功能待实现')
}

const handleTabClick = (key: TabKey) => {
    activeTab.value = key
}

const updateUnderline = () => {
    nextTick(() => {
        const index = tabs.findIndex(tab => tab.key === activeTab.value)
        const el = tabRefs.value[index]
        const container = tabContainer.value
        if (!el || !container) return
        const left = el.offsetLeft
        const right = container.clientWidth - (el.offsetLeft + el.offsetWidth)
        underlineDirection.value = left >= previousLeft.value ? 'right' : 'left'
        previousLeft.value = left
        underlineStyle.value = {
            left: `${left}px`,
            right: `${right}px`
        }
    })
}

const activePlaceholder = computed(() => {
    return tabs.find(tab => tab.key === activeTab.value)?.placeholder || ''
})

onMounted(() => {
    fetchUserAll()
    updateUnderline()
    window.addEventListener('resize', updateUnderline)
})

watch(
    () => route.query.userId,
    () => {
        fetchUserAll()
        if (activeTab.value === 'uploads') {
            fetchUserUploads()
        }
    },
)

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateUnderline)
})

watch(activeTab, (tab) => {
    updateUnderline()
    if (tab === 'uploads') {
        fetchUserUploads()
    }
})
</script>

<style scoped>
.page {
    min-height: 100vh;
    background: #f7f6f9;
}

.page-body {
    width: 1080px;
    margin: 24px auto 80px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.section {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
    padding: 24px;
}

.section-brief {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 24px;
    align-items: center;
}

.brief-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.avatar-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    background: #f4f2ff;
}

.avatar-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.name-block h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #1f1f2e;
}

.user-id {
    margin: 6px 0;
    color: #6f6f85;
    font-size: 14px;
}

.status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: #4b3ba7;
    background: #ede9ff;
}

.status[data-status='active'] {
    color: #1e8f4b;
    background: #e8f9ef;
}

.status[data-status='inactive'] {
    color: #9e2a2b;
    background: #ffecec;
}

.brief-right {
    display: grid;
    grid-template-rows: auto auto;
    gap: 16px;
    position: relative;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px 18px;
}

.info-item {
    padding: 12px 14px;
    border: 1px solid #f0edff;
    border-radius: 12px;
    background: #fbfaff;
}

.label {
    margin: 0 0 6px;
    font-size: 12px;
    color: #7a7691;
    letter-spacing: 0.2px;
}

.value {
    margin: 0;
    font-size: 16px;
    color: #1f1f2e;
    font-weight: 600;
}

.edit-btn {
    justify-self: end;
    width: 160px;
    padding: 12px 16px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #c3b4ff 0%, #8f82ff 100%);
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.edit-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(143, 130, 255, 0.35);
}

.section-tabs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: transparent;
    box-shadow: none;
    padding: 12px 0 4px;
}

.tabs {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0edff;
}

.tab-button {
    position: relative;
    background: transparent;
    border: none;
    padding: 4px 2px;
    font-size: 15px;
    color: #8c8c9a;
    cursor: pointer;
    transition: color 0.2s ease;
}

.tab-button.active {
    font-size: 18px;
    font-weight: 700;
    color: #5b247f;
}

.tab-underline {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: var(--primary-color, #5b247f);
    border-radius: 999px;
    will-change: left, right;
    display: block;
}

.tab-underline[data-dir="right"] {
    transition: right 0.2s cubic-bezier(0.33, 0, 0.2, 1), left 0.2s cubic-bezier(0.33, 0, 0.2, 1) 0.1s;
}

.tab-underline[data-dir="left"] {
    transition: left 0.2s cubic-bezier(0.33, 0, 0.2, 1), right 0.2s cubic-bezier(0.33, 0, 0.2, 1) 0.1s;
}

.tab-content {
    margin-top: 0;
}

.doc-tabs {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.tab-divider {
    color: #d0cfe4;
    font-size: 14px;
}

.doc-tab {
    background: transparent;
    border: none;
    padding: 4px 8px;
    font-size: 14px;
    color: #7a7691;
    cursor: pointer;
}

.doc-tab.active {
    font-size: 16px;
    font-weight: 700;
    color: #1f1f2e;
}

.placeholder {
    margin: 0;
    text-align: center;
    color: #7a7691;
    font-size: 14px;
}

.error {
    margin: 0;
    color: #c0392b;
    font-weight: 600;
    padding: 8px 12px;
    background: #ffecec;
    border-radius: 8px;
    border: 1px solid #ffd2d2;
}

@media (max-width: 1120px) {
    .page-body {
        width: calc(100% - 32px);
        padding: 0 12px;
    }

    .section-brief {
        grid-template-columns: 1fr;
    }

    .brief-left {
        justify-content: flex-start;
    }

    .edit-btn {
        width: 100%;
        justify-self: stretch;
    }
}
</style>
