<template>
    <div class="page">
        <topbar class="topbar" @open-upload-modal="showUploadModal = true"></topbar>

        <main class="page-body">
            <section class="section section-brief">
                <div class="brief-left">
                    <div class="avatar-wrapper">
                        <img :src="displayAvatar" alt="user avatar" />
                        <button v-if="isEditing" class="avatar-btn" type="button" @click="triggerAvatarSelect">
                            更换头像
                        </button>
                        <input ref="avatarInputRef" class="sr-only" type="file" accept="image/*"
                            @change="handleAvatarChange" />
                    </div>
                    <div class="name-block">
                        <input v-if="isEditing" v-model="formUsername" class="brief-input" type="text"
                            placeholder="输入用户名" :disabled="savingProfile" />
                        <h2 v-else>{{ userBrief?.username || '未命名用户' }}</h2>
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
                            <input v-if="isEditing" v-model="formEmail" class="brief-input" type="email"
                                placeholder="输入邮箱" :disabled="savingProfile" />
                            <p v-else class="value">{{ userBrief?.email || '暂无' }}</p>
                        </div>
                        <div class="info-item">
                            <p class="label">注册时间</p>
                            <p class="value">{{ userBrief?.createTime || '—' }}</p>
                        </div>
                    </div>
                    <div class="brief-actions">
                        <template v-if="isEditing">
                            <button class="save-btn" type="button" :disabled="savingProfile" @click="handleSaveProfile">
                                保存
                            </button>
                            <button class="cancel-btn" type="button" :disabled="savingProfile"
                                @click="handleCancelEdit">
                                取消
                            </button>
                        </template>
                        <button v-else class="edit-btn" type="button" @click="handleEditProfile">
                            编辑个人资料
                        </button>
                        <button class="logout-btn" type="button" @click="handleLogout">
                            退出登录
                        </button>
                    </div>
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
                        <div v-if="collectionDocs.length" class="book-list">
                            <BookListItem v-for="doc in collectionDocs" :key="doc.infoBrief.documentId"
                                :document="doc" @click="goDocument(doc)" />
                        </div>
                        <p v-else class="placeholder">暂无收藏记录</p>
                    </div>

                    <div v-else>
                        <div v-if="historyDocs.length" class="book-list">
                            <BookListItem v-for="doc in historyDocs" :key="doc.infoBrief.documentId" :document="doc"
                                @click="goDocument(doc)" />
                        </div>
                        <p v-else class="placeholder">暂无浏览历史</p>
                    </div>
                </template>

                <template v-else-if="activeTab === 'comments'">
                    <CommentSection :viewer="commentViewer" :show-editor="false" :show-reply-button="false"
                        :show-source-name="true" :show-search-bar="true" />
                </template>

                <template v-else-if="activeTab === 'uploads'">
                    <div v-if="uploadsDocs.length" class="book-list">
                        <BookListItem v-for="doc in uploadsDocs" :key="doc.infoBrief.documentId" :document="doc"
                            @click="goDocument(doc)" />
                    </div>
                    <p v-else class="placeholder">暂无上传记录</p>
                </template>

                <template v-else-if="activeTab === 'posts'">
                    <div class="doc-tabs">
                        <button type="button" class="doc-tab" :class="{ active: activePostTab === 'collect' }"
                            @click="activePostTab = 'collect'">
                            收藏
                        </button>
                        <span class="tab-divider">|</span>
                        <button type="button" class="doc-tab" :class="{ active: activePostTab === 'mine' }"
                            @click="activePostTab = 'mine'">
                            我的发帖
                        </button>
                    </div>

                    <div v-if="activePostTab === 'collect'">
                        <PostItem v-for="post in collectPosts" :key="post.postId" :post="post" />
                        <p v-if="!collectPosts.length" class="placeholder">暂无收藏帖子</p>
                    </div>

                    <div v-else>
                        <PostItem v-for="post in myPosts" :key="post.postId" :post="post" />
                        <p v-if="!myPosts.length" class="placeholder">暂无发帖记录</p>
                    </div>
                </template>

                <template v-else>
                    <p class="placeholder">{{ activePlaceholder }}</p>
                </template>
            </section>

            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        </main>
    </div>
    <!-- 使用分离的组件 -->
    <CategoryDialog :visible="showCategoryDialog" @update:visible="showCategoryDialog = $event"
        :all-categories="allCategories" :selected-category-name="selectedCategoryName"
        :selected-category-id="selectedCategoryId" @category-selected="onCategorySelected"
        @reset-category="resetCategory" @category-added="handleCategoryAdded" />

    <UploadModal v-model:visible="showUploadModal" :selected-category-name="selectedUploadCategoryName"
        :selected-category-id="selectedCategoryId" @open-category-dialog="showCategoryDialog = true"
        @upload-success="handleUploadSuccess" />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import topbar from '@/layout/topbar.vue'
import { getUserAll, getUserPostList, getUserUploadDoc, updateUserProfile, type UserAll } from '@/api/user'
import { useAuthStore } from '@/stores/auth'
import BookListItem from '@/components/bookListItem.vue'
import CommentSection from '@/components/comments/CommentSection.vue'
import type { Document, InfoBrief, Post, UserBrief } from '@/api/all.ts'
import * as allApi from "@/api/all";
import { ElMessage } from 'element-plus'
import CategoryDialog from '@/components/CategoryDialog.vue'
import UploadModal from '@/components/UploadModal.vue'
import PostItem from '@/components/postItem.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const userAll = ref<UserAll | null>(null)
const uploadsDocs = ref<Document[]>([])
const errorMessage = ref('')
const defaultAvatar = 'https://placehold.co/120x120?text=Avatar'
const isEditing = ref(false)
const savingProfile = ref(false)
const formUsername = ref('')
const formEmail = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarInputRef = ref<HTMLInputElement | null>(null)
let avatarPreviewUrl: string | null = null

const showCategoryDialog = ref(false)
const showUploadModal = ref(false)
// 分类相关数据
const allCategories = ref<allApi.Category[]>([])
const selectedCategoryName = ref<string | null>(null)
const selectedCategoryId = ref<number | null>(null)
const selectedUploadCategoryName = ref<string | null>(null)
const collectPosts = ref<Post[]>([])
const myPosts = ref<Post[]>([])
const activePostTab = ref<'collect' | 'mine'>('collect')

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
const displayAvatar = computed(() => avatarPreview.value || userBrief.value?.userAvatar || defaultAvatar)

const mapBriefToDoc = (item: InfoBrief): Document => ({
    infoBrief: item,
    author: (item as any)?.author ?? '',
    introduction: (item as any)?.introduction ?? '',
    createYear: (item as any)?.createYear ?? '',
})

const collectionDocs = computed(() => collectionList.value?.map(mapBriefToDoc) ?? [])
const historyDocs = computed(() => historyList.value?.map(mapBriefToDoc) ?? [])
const statusLabel = computed(() => {
    const status = userBrief.value?.status
    if (status === 'active') return '正常'
    if (status === 'inactive') return '停用'
    return status || '未知'
})

const updatePageTitle = () => {
    const name = userBrief.value?.username || '用户'
    document.title = `${name} - 个人主页`
}

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

const fetchUserPosts = async () => {
    errorMessage.value = ''
    collectPosts.value = []
    myPosts.value = []

    if (!resolvedUserId.value) {
        errorMessage.value = '未能获取用户信息，请先登录。'
        return
    }

    try {
        const res = await getUserPostList(resolvedUserId.value)
        if (res.code === 200 || res.code === 0) {
            collectPosts.value = res.data?.collectPostList ?? []
            myPosts.value = res.data?.myPostList ?? []
        } else {
            errorMessage.value = res.message || '获取帖子列表失败'
        }
    } catch (error) {
        console.error('获取帖子列表失败', error)
        errorMessage.value = '网络异常，请稍后重试'
    }
}

const goDocument = (doc: Document) => {
    const docId = doc?.infoBrief?.documentId
    if (!docId) return
    router.push({ path: '/bookInfo', query: { id: docId } })
}

const handleEditProfile = () => {
    isEditing.value = true
    formUsername.value = userBrief.value?.username || ''
    formEmail.value = userBrief.value?.email || ''
    avatarFile.value = null
    avatarPreview.value = null
}

const clearAvatarSelection = () => {
    avatarFile.value = null
    avatarPreview.value = null
    if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
        avatarPreviewUrl = null
    }
    if (avatarInputRef.value) {
        avatarInputRef.value.value = ''
    }
}

const triggerAvatarSelect = () => {
    avatarInputRef.value?.click()
}

const handleAvatarChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0] ?? null
    clearAvatarSelection()
    if (file) {
        avatarFile.value = file
        avatarPreviewUrl = URL.createObjectURL(file)
        avatarPreview.value = avatarPreviewUrl
    }
}

const handleCancelEdit = () => {
    isEditing.value = false
    clearAvatarSelection()
    formUsername.value = userBrief.value?.username || ''
    formEmail.value = userBrief.value?.email || ''
}

const handleSaveProfile = async () => {
    errorMessage.value = ''
    if (!resolvedUserId.value) {
        errorMessage.value = '未能获取用户信息，请先登录。'
        return
    }

    savingProfile.value = true
    try {
        await updateUserProfile(resolvedUserId.value, {
            userName: formUsername.value,
            email: formEmail.value,
            userAvatar: avatarFile.value ?? null,
        })

        await fetchUserAll()
        await authStore.refreshUserBrief()
        isEditing.value = false
        clearAvatarSelection()
    } catch (error) {
        console.error('更新个人资料失败', error)
        errorMessage.value = '更新个人资料失败，请稍后重试'
    } finally {
        savingProfile.value = false
    }
}

const handleLogout = () => {
    authStore.logout()
    userAll.value = null
    router.push('/login')
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

// 分类相关方法
const onCategorySelected = (selected: allApi.Category) => {
    console.log('选中的分类：', selected)
    showCategoryDialog.value = false
    selectedCategoryId.value = selected.id

    if (showUploadModal.value === false) {
        // 如果在搜索场景下选择分类
        selectedCategoryName.value = selected.name
    } else {
        // 如果在上传场景下选择分类
        selectedUploadCategoryName.value = selected.name
    }
}

// 重置分类
const resetCategory = () => {
    selectedCategoryName.value = null
    selectedUploadCategoryName.value = null
    selectedCategoryId.value = null
}

// 获取所有分类
const getAllCategories = async () => {
    try {
        const response = await allApi.getAllCategories()
        if (response.data) {
            allCategories.value = response.data
        } else {
            allCategories.value = []
            console.warn('获取分类数据格式不正确')
        }
        return allCategories.value
    } catch (error) {
        console.error('获取所有分类失败:', error)
        allCategories.value = []
        throw error
    }
}

// 上传成功处理
const handleUploadSuccess = () => {
    console.log('上传成功，可以刷新数据')
}

const handleCategoryAdded = async () => {
    console.log('分类添加成功，重新加载分类数据');

    try {
        await getAllCategories();

        ElMessage.success('分类数据已更新');
    } catch (error) {
        console.error('刷新分类数据失败:', error);
        ElMessage.error('刷新数据失败');
    }
};
watch(() => showUploadModal.value, (newVal, oldVal) => {
    console.log('showUploadModal 变化:', oldVal, '->', newVal)

    if (newVal) {
        console.log('个人信息页上传模态框已打开')
    } else {
        console.log('个人信息页上传模态框已关闭')
    }
})

onMounted(() => {
    fetchUserAll()
    updateUnderline()
    getAllCategories();
    window.addEventListener('resize', updateUnderline)
})

watch(userBrief, () => updatePageTitle(), { immediate: true })

watch(userBrief, (brief) => {
    if (isEditing.value) return
    formUsername.value = brief?.username || ''
    formEmail.value = brief?.email || ''
}, { immediate: true })

watch(
    () => route.query.userId,
    () => {
        fetchUserAll()
        if (activeTab.value === 'uploads') {
            fetchUserUploads()
        }
        if (activeTab.value === 'posts') {
            fetchUserPosts()
        }
    },
)

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateUnderline)
    clearAvatarSelection()
})

watch(activeTab, (tab) => {
    updateUnderline()
    if (tab === 'uploads') {
        fetchUserUploads()
    }
    if (tab === 'posts') {
        fetchUserPosts()
    }
})
</script>

<style scoped>
.page {
    min-height: 100vh;
    background: #f7f6f9;
    overflow-y: auto;
    /* 允许垂直滚动 */
    scrollbar-width: none;
    /* Firefox：隐藏滚动条 */
    -ms-overflow-style: none;
    /* IE/Edge：隐藏滚动条 */
}

.page::-webkit-scrollbar {
    display: none;
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
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    background: #f4f2ff;
    border: 2px solid #f0edff;
    position: relative;
}

.avatar-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-btn {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 10px;
    border-radius: 10px;
    border: none;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    backdrop-filter: blur(4px);
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}

.name-block h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #1f1f2e;
}

.brief-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    font-size: 15px;
    color: #1f1f2e;
    background: #fff;
    box-sizing: border-box;
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

.brief-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
    justify-items: end;
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

.save-btn {
    justify-self: stretch;
    padding: 12px 16px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.save-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.save-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(34, 197, 94, 0.35);
}

.cancel-btn {
    justify-self: stretch;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #374151;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.cancel-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.cancel-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(55, 65, 81, 0.15);
    background: #f9fafb;
}

.logout-btn {
    justify-self: end;
    width: 160px;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: #fff7f7;
    color: #b91c1c;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    margin-top: 8px;
}

.logout-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(185, 28, 28, 0.15);
    background: #ffecec;
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

.book-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
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
