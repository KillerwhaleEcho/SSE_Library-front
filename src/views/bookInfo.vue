<template>
    <div class="book-info-page">
        <topbar class="page-topbar" />

        <div class="page-body">
            <section class="document-section">
                <el-skeleton :loading="detailLoading" animated>
                    <template #template>
                        <div class="skeleton-hero">
                            <el-skeleton-item variant="image" class="skeleton-cover" />
                            <div class="skeleton-info">
                                <el-skeleton-item variant="h1" class="skeleton-title" />
                                <el-skeleton-item v-for="n in 3" :key="n" variant="text" class="skeleton-line" />
                            </div>
                        </div>
                    </template>
                    <template #default>
                        <div v-if="documentDetail" class="document-hero">
                            <div class="cover-column">
                                <div class="cover-wrapper">
                                    <img :src="coverSrc" alt="document cover" @error="handleImgError" />
                                </div>
                            </div>
                            <div class="hero-info">
                                <h1 class="doc-title">{{ brief?.name }}</h1>
                                <p class="doc-author" v-if="documentDetail.author">
                                    作者：{{ documentDetail.author }}
                                </p>
                                <p class="doc-meta" v-if="brief?.documentId">
                                    文档编号：{{ brief?.documentId }}
                                </p>
                                <div class="stats-row" v-if="brief">
                                    <div class="stat-item">
                                        <span class="stat-label">收藏</span>
                                        <span class="stat-value">{{ brief?.collections ?? 0 }}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">阅读</span>
                                        <span class="stat-value">{{ brief?.readCounts ?? 0 }}</span>
                                    </div>
                                </div>
                                <div class="tag-group" v-if="tags.length">
                                    <span v-for="tag in tags" :key="tag" class="tag-chip">{{ tag }}</span>
                                </div>
                                <div class="meta-grid" v-if="baseDetails.length">
                                    <div v-for="item in baseDetails" :key="item.label" class="meta-item">
                                        <span class="meta-label">{{ item.label }}</span>
                                        <span class="meta-value">{{ item.value || '暂无' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="documentDetail" class="document-actions-card">
                            <h2 class="section-title"></h2>
                            <div class="document-actions-row">
                                <button class="doc-action-button" @click="handleFavorite">
                                    <img :src="favoriteIconSrc" :alt="favoriteLabel" class="action-icon" />
                                    <span>{{ favoriteLabel }}</span>
                                </button>
                                <button class="doc-action-button" :class="{ disabled: !canPreview || previewLoading }"
                                    :disabled="!canPreview || previewLoading" @click="handlePreview">
                                    <img :src="previewIcon" alt="预览" class="action-icon" />
                                    <span>{{ previewButtonText }}</span>
                                </button>
                                <button class="doc-action-button" @click="handleDownload">
                                    <img :src="downloadIcon" alt="下载" class="action-icon" />
                                    <span>下载</span>
                                </button>
                            </div>
                            <div v-if="isAdminViewer" class="document-actions-row admin-action-row">
                                <button class="doc-action-button admin" :class="{ disabled: statusUpdating }"
                                    :disabled="statusUpdating" @click="handleStatusUpdate('open')">
                                    <span>开放 open</span>
                                </button>
                                <button class="doc-action-button admin" :class="{ disabled: statusUpdating }"
                                    :disabled="statusUpdating" @click="handleStatusUpdate('closed')">
                                    <span>关闭 closed</span>
                                </button>
                            </div>
                        </div>
                        <el-empty v-else description="未找到相关文档" />
                    </template>
                </el-skeleton>

                <div class="introduction-card" v-if="documentDetail?.introduction">
                    <h2 class="section-title">内容简介</h2>
                    <p class="introduction-text">{{ documentDetail.introduction }}</p>
                </div>
            </section>

            <section class="discussion-section">
                <div class="discussion-header">
                    <h2 class="section-title"></h2>
                    <div class="discussion-tabs">
                        <button type="button" class="discussion-tab"
                            :class="{ active: activeDiscussionTab === 'comment' }" @click="setDiscussionTab('comment')">
                            评论
                        </button>
                        <span class="tab-divider">|</span>
                        <button type="button" class="discussion-tab" :class="{ active: activeDiscussionTab === 'post' }"
                            @click="setDiscussionTab('post')">
                            帖子
                        </button>
                    </div>
                </div>
                <div v-if="activeDiscussionTab === 'comment'" class="discussion-panel">
                    <CommentSection source-type="document" :source-id="documentNumericId"
                        :source-data="documentSourceData" :viewer="commentViewer" :show-editor="true"
                        :show-comment-user="true" :show-reply-button="true" :show-source-name="false" />
                </div>
                <div v-else class="discussion-panel">
                    <div v-if="documentPosts.length" class="post-list">
                        <PostItem v-for="post in documentPosts" :key="post.postId" :post="post" />
                    </div>
                    <el-empty v-else description="暂无相关帖子" />
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import topbar from '@/layout/topbar.vue'
import CommentSection from '@/components/comments/CommentSection.vue'
import PostItem from '@/components/postItem.vue'
import defaultCover from '@/assets/coverexp.png'
import {
    type ApiResponse,
    type Document,
    type Post,
    type CommentSourceData,
    type FavoriteActionPayload,
    type UserBrief,
    getDocumentDetail,
    getUserFavoriteJudgement,
    postUserAddFavor,
    deleteUserFavor,
    updateDocumentStatus,
} from '@/api/all.ts'
import previewIcon from '@/assets/147_阅读.png'
import likeIcon from '@/assets/喜欢_like.png'
import unlikeIcon from '@/assets/不喜欢_unlike.png'
import downloadIcon from '@/assets/下载3_download-three.png'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const documentId = ref<string>('')
const detailLoading = ref(false)
const documentDetail = ref<Document | null>(null)
const favoriteProcessing = ref(false)
const favoriteJudgement = ref(false)
const previewLoading = ref(false)
const statusUpdating = ref(false)
const activeDiscussionTab = ref<'comment' | 'post'>('comment')

const brief = computed(() => documentDetail.value?.infoBrief ?? null)
const documentNumericId = computed<number | null>(() => {
    const raw = brief.value?.documentId ?? Number(documentId.value)
    if (typeof raw === 'number' && !Number.isNaN(raw)) return raw
    const parsed = Number(documentId.value)
    return Number.isNaN(parsed) ? null : parsed
})
const documentSourceData = computed<CommentSourceData | null>(() => {
    if (!brief.value || documentNumericId.value === null) return null
    return {
        sourceId: documentNumericId.value,
        sourceType: 'document',
        name: brief.value.name || `文档 #${documentNumericId.value}`,
    }
})
const coverSrc = computed(() => documentDetail.value?.cover || defaultCover)
const canPreview = computed(() => brief.value?.type === 'book' && Boolean(brief.value?.URL))
const tags = computed(() => documentDetail.value?.tags ?? [])
const previewButtonText = computed(() => (previewLoading.value ? '加载中...' : '预览'))
const isAdminViewer = computed(() => userInfo.value?.role === 'admin')
const documentPosts = computed<Post[]>(() => documentDetail.value?.postList ?? [])

const favoriteLabel = computed(() => (favoriteJudgement.value ? '停止收藏' : '收藏'))
const favoriteIconSrc = computed(() => (favoriteJudgement.value ? unlikeIcon : likeIcon))

const typeMap: Record<string, string> = {
    book: '书籍',
    file: '文件',
    video: '视频',
}

const formatTwoDigit = (value: number) => value.toString().padStart(2, '0')

const formattedDate = (value?: string | null) => {
    if (!value) return '未知'
    const normalized = value.replace(/-/g, '/').replace('T', ' ')
    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) return value
    const year = date.getFullYear()
    const month = formatTwoDigit(date.getMonth() + 1)
    const day = formatTwoDigit(date.getDate())
    const hours = formatTwoDigit(date.getHours())
    const minutes = formatTwoDigit(date.getMinutes())
    return `${year}-${month}-${day} ${hours}:${minutes}`
}

const docStatusDisplayMap: Record<string, string> = {
    open: '开放',
    closed: '关闭',
    pending: '待审核',
    withdrawn: '已撤回',
}
const currentDocumentStatus = computed(() => (brief.value?.status ? docStatusDisplayMap[brief.value.status] ?? brief.value.status : '未知'))
const baseDetails = computed(() => {
    if (!documentDetail.value || !brief.value) return [] as Array<{ label: string; value: string }>
    const details: Array<{ label: string; value: string }> = [
        {
            label: '资料类型',
            value: typeMap[brief.value.type ?? ''] ?? (brief.value.type ?? '未知'),
        },
        { label: '上传时间', value: formattedDate(brief.value.uploadTime) },
        { label: '分类', value: brief.value.category ?? '' },
        { label: '出版年份', value: documentDetail.value.createYear ?? '' },
        { label: 'ISBN', value: documentDetail.value.bookISBN ?? '' },
    ]
    if (isAdminViewer.value && brief.value.status) {
        details.unshift({ label: '状态', value: currentDocumentStatus.value })
    }
    return details
})

const commentViewer = computed<UserBrief | null>(() => {
    if (!userInfo.value) return null
    return {
        userId: userInfo.value.userId,
        username: userInfo.value.username,
        userAvatar: userInfo.value.userAvatar,
        status: (userInfo.value.status as UserBrief['status']) ?? 'active',
        createTime: userInfo.value.createTime,
        email: userInfo.value.email,
        role: userInfo.value.role,
    }
})

const handleImgError = (event: Event) => {
    (event.target as HTMLImageElement).src = defaultCover
}

const setDiscussionTab = (tab: 'comment' | 'post') => {
    activeDiscussionTab.value = tab
}

const ensureDocumentId = (raw: unknown): string | null => {
    if (Array.isArray(raw)) return raw[0] ?? null
    if (typeof raw === 'string' && raw.trim()) return raw
    return null
}

const loadDocumentDetail = async (id: string) => {
    detailLoading.value = true
    try {
        const response = (await getDocumentDetail(id)) as unknown as ApiResponse<Document>
        documentDetail.value = response.data ?? null
    } catch (error: any) {
        documentDetail.value = null
        ElMessage.error(error?.message || '获取文档详情失败')
    } finally {
        detailLoading.value = false
    }
}

const buildDispositionUrl = (disposition: 'inline' | 'attachment') => {
    const base = brief.value?.URL
    if (!base) return null
    const hasQuery = base.includes('?')
    const separator = hasQuery ? '&' : '?'
    return `${base}${separator}responseContentDisposition=${disposition}`
}

const triggerDocumentAction = (disposition: 'inline' | 'attachment') => {
    const targetUrl = buildDispositionUrl(disposition)
    if (!targetUrl) {
        ElMessage.warning('暂无可用的文档链接')
        return
    }
    window.open(targetUrl, '_blank', 'noopener')
}

const PREVIEW_URL_RELEASE_DELAY_MS = 60 * 1000

const fetchPdfBlob = async (targetUrl: string) => {
    const response = await fetch(targetUrl, {
        method: 'GET',
        cache: 'no-store',
        redirect: 'follow',
    })
    if (!response.ok) {
        throw new Error('加载预览内容失败，请稍后重试')
    }
    const arrayBuffer = await response.arrayBuffer()
    return new Blob([arrayBuffer], { type: 'application/pdf' })
}

const handlePreview = async () => {
    if (!canPreview.value) {
        ElMessage.info('该资料暂不支持在线预览')
        return
    }
    const sourceUrl = brief.value?.URL
    if (!sourceUrl) {
        ElMessage.warning('暂无可用的预览链接')
        return
    }

    if (previewLoading.value) return

    previewLoading.value = true
    let blobUrl: string | null = null
    try {
        const pdfBlob = await fetchPdfBlob(sourceUrl)
        blobUrl = URL.createObjectURL(pdfBlob)
        const previewWindow = window.open(blobUrl, '_blank', 'noopener')
        if (!previewWindow) {
            URL.revokeObjectURL(blobUrl)
            blobUrl = null
            ElMessage.error('浏览器阻止了新标签页，请允许弹出窗口后重试')
            return
        }
        window.setTimeout(() => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl)
            }
        }, PREVIEW_URL_RELEASE_DELAY_MS)
    } catch (error: any) {
        if (blobUrl) {
            URL.revokeObjectURL(blobUrl)
        }
        ElMessage.error(error?.message || '加载预览失败')
    } finally {
        previewLoading.value = false
    }
}

const handleDownload = () => {
    triggerDocumentAction('attachment')
}

const handleFavorite = async () => {
    if (favoriteProcessing.value) return
    const currentUserId = userInfo.value?.userId
    const sourceId = documentNumericId.value
    if (!currentUserId) {
        ElMessage.warning('请先登录后再收藏')
        return
    }
    if (sourceId === null) {
        ElMessage.warning('当前文档信息不完整，无法操作收藏')
        return
    }

    favoriteProcessing.value = true
    const wasFavorited = favoriteJudgement.value
    const payload: FavoriteActionPayload = { userId: currentUserId, sourceId, type: 'document' }

    try {
        await (wasFavorited ? deleteUserFavor(payload) : postUserAddFavor(payload))
        await refreshFavoriteJudgement()
        ElMessage.success(wasFavorited ? '取消收藏成功' : '收藏成功')
    } catch (error: any) {
        ElMessage.error(error?.message || (wasFavorited ? '取消收藏失败' : '收藏失败'))
    } finally {
        favoriteProcessing.value = false
    }
}

const handleStatusUpdate = async (targetStatus: 'open' | 'closed') => {
    if (!isAdminViewer.value || statusUpdating.value) return
    const docNumericId = brief.value?.documentId ?? Number(documentId.value)
    if (docNumericId === undefined || docNumericId === null) {
        ElMessage.warning('未找到文档编号，无法修改状态')
        return
    }
    if (brief.value?.status === targetStatus) {
        ElMessage.info('状态已是最新，无需修改')
        return
    }
    statusUpdating.value = true
    try {
        await updateDocumentStatus({ documentId: Number(docNumericId), status: targetStatus })
        ElMessage.success('状态已更新')
        if (documentId.value) {
            await loadDocumentDetail(documentId.value)
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '更新状态失败')
    } finally {
        statusUpdating.value = false
    }
}

const refreshFavoriteJudgement = async () => {
    const currentUserId = userInfo.value?.userId
    const sourceId = documentNumericId.value
    if (!currentUserId || sourceId === null) {
        favoriteJudgement.value = false
        return
    }
    try {
        const response = (await getUserFavoriteJudgement({
            userId: currentUserId,
            sourceId,
            type: 'document',
        })) as unknown as ApiResponse<{ judgement: boolean }>
        favoriteJudgement.value = Boolean(response?.data?.judgement)
    } catch (error: any) {
        favoriteJudgement.value = false
        console.error('获取收藏状态失败:', error)
    }
}

watch(
    () => route.query.id,
    async (rawId) => {
        const id = ensureDocumentId(rawId)
        if (!id) {
            ElMessage.warning('未找到文档ID')
            documentDetail.value = null
            return
        }
        documentId.value = id
        activeDiscussionTab.value = 'comment'
        await loadDocumentDetail(id)
    },
    { immediate: true },
)

watch(
    [
        () => userInfo.value?.userId,
        () => documentNumericId.value,
    ],
    async () => {
        await refreshFavoriteJudgement()
    },
    { immediate: true },
)

</script>

<style scoped>
.book-info-page {
    min-height: 100vh;
    background: #f7f6f9;
}

.page-topbar {
    position: sticky;
    top: 0;
    z-index: 100;
}

.page-body {
    max-width: 1080px;
    margin: 0 auto;
    padding: 60px 24px 60px;
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.document-section {
    background: #fff;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}

.document-hero {
    display: flex;
    gap: 32px;
    align-items: flex-start;
}

.cover-column {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 36px;
}

.cover-wrapper {
    width: 100%;
    border-radius: 16px;
    overflow: visible;
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.15);
}

.cover-wrapper img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 16px;
}

.document-actions-card {
    margin-top: 24px;
    padding: 24px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.document-actions-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.admin-action-row {
    margin-top: 12px;
}

.doc-action-button {
    flex: 1;
    min-width: 160px;
    padding: 14px 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #ffffff;
    color: #1f2937;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 0px 0px rgba(15, 23, 42, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.doc-action-button:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.18);
}

.doc-action-button:active:not(.disabled) {
    transform: translateY(0);
    box-shadow: 0 8px 16px rgba(79, 70, 229, 0.18);
}

.doc-action-button.disabled,
.doc-action-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.doc-action-button.admin {
    background: #eef2ff;
    color: #1d4ed8;
}

.action-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
}

.hero-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.doc-title {
    font-size: 28px;
    font-weight: 700;
    color: #1f2933;
    margin: 0;
}

.doc-author,
.doc-meta {
    margin: 0;
    color: #56616b;
    font-size: 16px;
}

.stats-row {
    display: flex;
    gap: 24px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #4b5563;
}

.stat-label {
    font-size: 14px;
    color: #94a3b8;
}

.stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
}

.tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.tag-chip {
    background: #eef2ff;
    border: none;
    border-radius: 999px;
    padding: 6px 12px;
    display: inline-flex;
    align-items: center;
    color: #3730a3;
    font-size: 13px;
}

.meta-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #f8fafc;
    border-radius: 12px;
    padding: 12px;
}

.meta-label {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.meta-value {
    font-size: 16px;
    color: #1e293b;
    font-weight: 500;
}

.document-action-hint {
    margin: 12px 0 0;
    color: #64748b;
    font-size: 14px;
}

.introduction-card {
    margin-top: 32px;
}

.discussion-section {
    background: #fff;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.discussion-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 16px;
}

.discussion-tabs {
    display: flex;
    align-items: center;
    gap: 8px;
}

.discussion-tab {
    border: none;
    background: transparent;
    font-size: 15px;
    color: #9ca3af;
    font-weight: 400;
    cursor: pointer;
    padding: 4px 6px;
    transition: color 0.2s ease, font-weight 0.2s ease;
}

.discussion-tab.active {
    color: #111827;
    font-weight: 600;
    font-size: 18px;
}

.tab-divider {
    color: #d1d5db;
    font-size: 14px;
}

.discussion-panel {
    border-top: 1px solid #eef2ff;
    padding-top: 16px;
}

.post-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.section-title {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px;
}

.introduction-text {
    margin: 0;
    line-height: 1.75;
    color: #4b5563;
    font-size: 16px;
    white-space: pre-line;
}

.skeleton-hero {
    display: flex;
    gap: 32px;
}

.skeleton-cover {
    width: 240px;
    height: 320px;
    border-radius: 16px;
}

.skeleton-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.skeleton-title {
    width: 60%;
    height: 32px;
}

.skeleton-line {
    height: 16px;
}

@media (max-width: 900px) {
    .document-hero {
        flex-direction: column;
        align-items: center;
    }

    .cover-column {
        width: 200px;
    }

    .hero-info {
        width: 100%;
    }

    .stats-row {
        flex-wrap: wrap;
        gap: 16px;
    }
}
</style>
