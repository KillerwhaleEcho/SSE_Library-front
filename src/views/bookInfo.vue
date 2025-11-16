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
                                <div class="cover-actions">
                                    <button class="cover-action" :class="{ disabled: !canPreview }"
                                        :disabled="!canPreview" @click="handlePreview">
                                        <img :src="previewIcon" alt="预览" class="action-icon" />
                                        <span>预览</span>
                                    </button>
                                    <button class="cover-action" @click="handleDownload">
                                        <img :src="downloadIcon" alt="下载" class="action-icon" />
                                        <span>下载</span>
                                    </button>
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
                                <div class="uploader-card" v-if="uploader">
                                    <el-avatar :src="uploader.userAvatar" :size="48" class="uploader-avatar" />
                                    <div class="uploader-info">
                                        <span class="uploader-name">
                                            上传者：{{ uploader.username }} (ID: {{ uploader.userId }})
                                        </span>
                                        <span class="uploader-meta">
                                            角色：{{ uploader.role }} · 状态：{{ uploader.status }}
                                        </span>
                                        <span class="uploader-meta">
                                            注册时间：{{ formattedDate(uploader.createTime) }} · 邮箱：{{ uploader.email }}
                                        </span>
                                    </div>
                                </div>
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

            <CommentSection :document-id="documentId" :document-brief="brief ?? null" :viewer="commentViewer"
                :show-editor="true" :show-comment-user="true" :show-reply-button="true" :show-document-name="true" />
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
import defaultCover from '@/assets/coverexp.png'
import {
    type ApiResponse,
    type Document,
    type UserBrief,
    getDocumentDetail,
} from '@/api/all.ts'
import previewIcon from '@/assets/147_阅读.png'
import downloadIcon from '@/assets/下载3_download-three.png'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const documentId = ref<string>('')
const detailLoading = ref(false)
const documentDetail = ref<Document | null>(null)

const brief = computed(() => documentDetail.value?.infoBrief ?? null)
const uploader = computed<UserBrief | null>(() => documentDetail.value?.uploader ?? null)
const coverSrc = computed(() => documentDetail.value?.cover || defaultCover)
const canPreview = computed(() => brief.value?.type === 'book' && Boolean(brief.value?.URL))
const tags = computed(() => documentDetail.value?.tags ?? [])

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

const baseDetails = computed(() => {
    if (!documentDetail.value || !brief.value) return [] as Array<{ label: string; value: string }>
    return [
        {
            label: '资料类型',
            value: typeMap[brief.value.type ?? ''] ?? (brief.value.type ?? '未知'),
        },
        { label: '上传时间', value: formattedDate(brief.value.uploadTime) },
        { label: '分类', value: brief.value.category ?? '' },
        { label: '出版年份', value: documentDetail.value.createYear ?? '' },
        { label: 'ISBN', value: documentDetail.value.bookISBN ?? '' },
    ]
})

const commentViewer = computed<UserBrief | null>(() => {
    if (!userInfo.value) return null
    return {
        userId: userInfo.value.userId,
        username: userInfo.value.username,
        userAvatar: userInfo.value.userAvatar,
        status: userInfo.value.status,
        createTime: userInfo.value.createTime,
        email: userInfo.value.email,
        role: userInfo.value.role,
    }
})

const handleImgError = (event: Event) => {
    (event.target as HTMLImageElement).src = defaultCover
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

const handlePreview = () => {
    if (!canPreview.value) {
        ElMessage.info('该资料暂不支持在线预览')
        return
    }
    triggerDocumentAction('inline')
}

const handleDownload = () => {
    triggerDocumentAction('attachment')
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
        await loadDocumentDetail(id)
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
    width: 280px;
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

.cover-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
}

.cover-action {
    width: 100%;
    padding: 12px 16px;
    display: flex;
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
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cover-action:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.16);
}

.cover-action:active:not(.disabled) {
    transform: translateY(0);
    box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
}

.cover-action.disabled,
.cover-action:disabled {
    cursor: not-allowed;
    opacity: 0.5;
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

.uploader-card {
    display: flex;
    gap: 16px;
    align-items: center;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.08));
    border-radius: 16px;
    padding: 16px;
}

.uploader-avatar {
    border: 2px solid #4c51bf;
}

.uploader-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.uploader-name {
    font-size: 16px;
    font-weight: 600;
    color: #312e81;
}

.uploader-meta {
    font-size: 13px;
    color: #4338ca;
}

.introduction-card {
    margin-top: 32px;
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
