<!--
CommentSection 组件可以依据 sourceType/sourceId 或 viewer.role 自动选择评论数据源，可展示指定文档/帖子、指定用户或全部评论；
在来源模式下支持登录后发表评论与回复，并会通过 sourceData 区分 document/post。
可配置显示的部分：评论编辑框(showEditor)、评论用户信息(showCommentUser)、回复按钮(showReplyButton)、评论关联来源标签(showSourceName)。

调用示例：
<CommentSection
    source-type="document"
    :source-id="docId"
    :source-data="{ sourceId: docId, sourceType: 'document', name: docName }"
    :viewer="currentViewer"
    :show-editor="true"
    :show-comment-user="true"
    :show-reply-button="true"
    :show-source-name="true"
/>
-->

<template>
    <section class="comments-section">
        <div v-if="shouldShowEditor" class="comment-editor">
            <el-input v-model="commentContent" type="textarea" :rows="4" maxlength="500" show-word-limit
                placeholder="轻轻敲醒沉睡的心灵，让我看看你的点评..." />
            <div class="editor-actions">
                <span class="editor-hint" v-if="!userInfo">登录后即可发表评论</span>
                <el-button type="primary" :loading="postingComment" :disabled="!commentContent.trim()"
                    @click="submitComment">
                    发表评论
                </el-button>
            </div>
        </div>

        <el-skeleton :loading="commentsLoading" animated>
            <template #template>
                <div v-for="n in 3" :key="n" class="comment-skeleton">
                    <el-skeleton-item variant="circle" class="comment-avatar" />
                    <div class="comment-skeleton-body">
                        <el-skeleton-item variant="text" style="width: 30%" />
                        <el-skeleton-item variant="text" />
                        <el-skeleton-item variant="text" style="width: 80%" />
                    </div>
                </div>
            </template>
            <template #default>
                <div v-if="hasCommentsSource">
                    <div v-if="hasComments" class="comment-list">
                        <el-card v-for="item in displayComments" :key="item.comment.commentId" class="comment-card"
                            shadow="never">
                            <div v-if="shouldShowCommentUser || shouldShowSourceName" class="comment-top">
                                <div v-if="shouldShowCommentUser" class="comment-header">
                                    <el-avatar :src="item.comment.commenter.userAvatar" :size="40" />
                                    <div class="comment-meta">
                                        <span class="commenter-name">{{ item.comment.commenter.username }}</span>
                                        <span class="comment-time">{{ formattedDate(item.comment.createdAt) }}</span>
                                    </div>
                                </div>
                                <button v-if="shouldShowSourceName && item.comment.sourceData"
                                    class="comment-document-chip" type="button"
                                    @click="handleSourceNavigate(item.comment.sourceData)">
                                    {{ item.comment.sourceData.name || sourceFallbackLabel(item.comment.sourceData) }}
                                </button>
                            </div>

                            <div v-if="item.comment.parentId !== null" class="reply-reference" :class="{
                                'reply-loading': item.parentLoading,
                                'reply-error': item.parentError,
                                'reply-missing': !item.parentLoading && !item.parentError && !item.parent
                            }">
                                <template v-if="item.parentLoading">
                                    <span class="reply-status-text">原评论加载中...</span>
                                </template>
                                <template v-else-if="item.parentError">
                                    <span class="reply-status-text">原评论加载失败</span>
                                </template>
                                <template v-else-if="item.parent">
                                    <div class="reply-label">回复给：</div>
                                    <div class="reply-parent">
                                        <div class="reply-parent-header">
                                            <span class="reply-parent-name">{{ item.parent.commenter.username }}</span>
                                            <span class="reply-parent-time">{{ formattedDate(item.parent.createdAt)
                                            }}</span>
                                        </div>
                                        <p class="reply-parent-content">{{ item.parent.content || '（原评论暂无内容）' }}</p>
                                    </div>
                                </template>
                                <template v-else>
                                    <span class="reply-status-text">原评论已不可见</span>
                                </template>
                            </div>

                            <p class="comment-content">{{ item.comment.content || '（该评论暂无内容）' }}</p>
                            <div v-if="shouldShowReplyButton || canDeleteComment(item.comment)" class="comment-actions">
                                <el-button v-if="shouldShowReplyButton" type="primary" link size="small"
                                    @click="openReplyBox(item.comment)">
                                    回复
                                </el-button>
                                <el-button v-if="canDeleteComment(item.comment)" type="danger" link size="small"
                                    :loading="isDeletingComment(item.comment.commentId)"
                                    @click="handleDeleteComment(item.comment)">
                                    删除
                                </el-button>
                            </div>
                        </el-card>
                    </div>
                    <el-empty v-else description="暂无评论" />
                </div>
                <el-empty v-else description="暂无可用评论源" />
            </template>
        </el-skeleton>

        <el-dialog v-if="shouldShowReplyButton" v-model="replyingModalVisible" append-to-body width="480px" title="回复评论"
            @closed="closeReplyBox">
            <div v-if="replyingTo" class="reply-context">
                <div class="reply-context-header">回复给：{{ replyingTo.commenter.username }}</div>
                <p class="reply-context-content">{{ replyingTo.content || '（原评论暂无内容）' }}</p>
            </div>
            <el-input v-model="replyingContent" type="textarea" :rows="4" maxlength="500" show-word-limit
                placeholder="说亿点好听的..." />
            <template #footer>
                <div class="reply-footer">
                    <el-button @click="closeReplyBox">取消</el-button>
                    <el-button type="primary" :loading="postingComment" :disabled="!replyingContent.trim()"
                        @click="submitReply">
                        提交回复
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import {
    type ApiResponse,
    type DocumentComment,
    type CommentSourceData,
    type CreateCommentPayload,
    type UserBrief,
    getCommentsBySource,
    getUserComments,
    getAllComments,
    getSingleComment,
    createComment,
    deleteUserComment,
    deleteAdminComment,
} from '@/api/all.ts'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
    sourceId?: string | number | null
    sourceType?: string | null
    sourceData?: CommentSourceData | null
    viewer?: UserBrief | null
    showEditor?: boolean
    showCommentUser?: boolean
    showReplyButton?: boolean
    showSourceName?: boolean
}>()

const router = useRouter()
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const commentsLoading = ref(false)
const postingComment = ref(false)
const comments = ref<DocumentComment[]>([])
const commentContent = ref('')
const replyingTo = ref<DocumentComment | null>(null)
const replyingContent = ref('')
const replyingModalVisible = ref(false)
const deletingCommentMap = ref<Record<number, boolean>>({})

const shouldShowCommentUser = computed(() => props.showCommentUser !== false)
const shouldShowSourceName = computed(() => props.showSourceName === true)

const normalizedSourceType = computed(() => {
    const direct = typeof props.sourceType === 'string' ? props.sourceType.trim().toLowerCase() : ''
    if (direct) return direct
    const fromData = props.sourceData?.sourceType
    if (fromData && typeof fromData === 'string') return fromData.trim().toLowerCase()
    return ''
})

const resolvedSourceId = computed(() => {
    const raw = props.sourceId ?? props.sourceData?.sourceId
    if (raw === null || raw === undefined) return ''
    if (typeof raw === 'string') return raw.trim()
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
    return ''
})

const resolvedSourceNumericId = computed(() => {
    const id = resolvedSourceId.value
    if (!id) return null
    const parsed = Number(id)
    return Number.isNaN(parsed) ? null : parsed
})

const effectiveViewer = computed<UserBrief | null>(() => {
    if (props.viewer) return props.viewer
    if (userInfo.value) {
        return {
            userId: userInfo.value.userId,
            username: userInfo.value.username,
            userAvatar: userInfo.value.userAvatar,
            status: (userInfo.value.status as UserBrief['status']) ?? 'active',
            createTime: userInfo.value.createTime,
            email: userInfo.value.email,
            role: userInfo.value.role,
        }
    }
    return null
})

const resolvedSourcePayload = computed<CommentSourceData | null>(() => {
    const id = resolvedSourceNumericId.value
    const type = normalizedSourceType.value
    if (id === null || !type) return null
    const providedName = typeof props.sourceData?.name === 'string' ? props.sourceData.name.trim() : ''
    const fallbackName = type === 'post' ? `帖子 #${id}` : `文档 #${id}`
    return {
        sourceId: id,
        sourceType: type,
        name: providedName || fallbackName,
    }
})

type CommentFetchMode =
    | { kind: 'source'; sourceType: string; sourceId: string }
    | { kind: 'user'; userId: number }
    | { kind: 'admin' }
    | { kind: 'none' }

const commentFetchMode = computed<CommentFetchMode>(() => {
    if (normalizedSourceType.value && resolvedSourceId.value) {
        return { kind: 'source', sourceType: normalizedSourceType.value, sourceId: resolvedSourceId.value }
    }

    const viewer = effectiveViewer.value
    if (!viewer) {
        return { kind: 'none' }
    }

    const viewerRole = (viewer.role || '').toLowerCase()

    if (viewerRole.includes('admin')) {
        return { kind: 'admin' }
    }

    if (viewerRole === 'user' && viewer.userId !== undefined && viewer.userId !== null) {
        return { kind: 'user', userId: viewer.userId }
    }

    return { kind: 'none' }
})

const isSourceMode = computed(() => commentFetchMode.value.kind === 'source')
const shouldShowEditor = computed(() => props.showEditor !== false && isSourceMode.value)
const shouldShowReplyButton = computed(() => props.showReplyButton !== false && isSourceMode.value)
const hasCommentsSource = computed(() => commentFetchMode.value.kind !== 'none')
const hasComments = computed(() => comments.value.length > 0)
const normalizedViewerRole = computed(() => (effectiveViewer.value?.role || '').toLowerCase())
const viewerUserId = computed(() => effectiveViewer.value?.userId ?? null)

const canDeleteComment = (comment: DocumentComment) => {
    const role = normalizedViewerRole.value
    if (!role) return false
    if (role.includes('admin')) return true
    if (role === 'user' && viewerUserId.value !== null) {
        return comment.commenter?.userId === viewerUserId.value
    }
    return false
}

const isDeletingComment = (commentId: number) => deletingCommentMap.value[commentId] === true

const handleDeleteComment = async (comment: DocumentComment) => {
    if (!effectiveViewer.value) {
        ElMessage.warning('请先登录再尝试删除评论')
        router.push('/login')
        return
    }

    if (!canDeleteComment(comment)) return

    deletingCommentMap.value[comment.commentId] = true
    try {
        const role = normalizedViewerRole.value
        if (role.includes('admin')) {
            await deleteAdminComment(comment.commentId)
        } else if (role === 'user' && viewerUserId.value !== null) {
            await deleteUserComment(viewerUserId.value, comment.commentId)
        } else {
            throw new Error('当前身份不支持删除评论')
        }
        ElMessage.success('评论删除成功')
        await refreshComments(commentFetchMode.value)
    } catch (error: any) {
        ElMessage.error(error?.message || '删除评论失败')
    } finally {
        deletingCommentMap.value[comment.commentId] = false
    }
}

const parentCommentCache = ref<Record<number, DocumentComment | null>>({})
const parentLoadingState = ref<Record<number, boolean>>({})
const parentErrorState = ref<Record<number, boolean>>({})

interface DisplayComment {
    comment: DocumentComment
    parent: DocumentComment | null
    parentId: number | null
    parentLoading: boolean
    parentError: boolean
}

const displayComments = computed<DisplayComment[]>(() =>
    comments.value.map((item) => {
        const parentId = item.parentId ?? null
        const parentLoading = parentId !== null ? parentLoadingState.value[parentId] ?? false : false
        const parentError = parentId !== null ? parentErrorState.value[parentId] ?? false : false
        const parentData = parentId !== null ? parentCommentCache.value[parentId] ?? null : null
        return {
            comment: item,
            parent: parentData,
            parentId,
            parentLoading,
            parentError,
        }
    })
)

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

const resetParentCommentState = () => {
    parentCommentCache.value = {}
    parentLoadingState.value = {}
    parentErrorState.value = {}
}

const unwrapCommentResponse = (
    raw: ApiResponse<DocumentComment> | (DocumentComment & { code?: number; message?: string }),
): DocumentComment => {
    if (raw && typeof raw === 'object' && 'data' in raw && raw.data) {
        return raw.data as DocumentComment
    }
    if (raw && typeof raw === 'object') {
        const { code: _code, message: _message, ...rest } = raw as DocumentComment & {
            code?: number
            message?: string
        }
        return rest as DocumentComment
    }
    throw new Error('无效的评论响应数据')
}

const fetchParentComment = async (parentId: number) => {
    if (parentLoadingState.value[parentId]) return
    if (Object.prototype.hasOwnProperty.call(parentCommentCache.value, parentId)) return

    parentLoadingState.value[parentId] = true
    parentErrorState.value[parentId] = false
    try {
        const response = await getSingleComment(parentId)
        const payload = (response.data ?? response) as ApiResponse<DocumentComment> | (DocumentComment & {
            code?: number
            message?: string
        })
        const data = unwrapCommentResponse(payload)
        parentCommentCache.value[parentId] = {
            ...data,
            parentId: data.parentId ?? null,
            content: data.content ?? null,
            sourceData: deriveSourceData(data),
        }
    } catch (error) {
        parentErrorState.value[parentId] = true
        parentCommentCache.value[parentId] = null
        console.warn('Failed to fetch parent comment', error)
    } finally {
        parentLoadingState.value[parentId] = false
    }
}

const ensureParentComments = async (list: DocumentComment[]) => {
    const tasks = list
        .filter((item) => item.parentId !== null)
        .map((item) => {
            const parentId = Number(item.parentId)
            if (Number.isNaN(parentId)) return Promise.resolve()
            return fetchParentComment(parentId)
        })
    await Promise.all(tasks)
}

const sourceFallbackLabel = (source: CommentSourceData) => {
    return source.sourceType === 'post' ? `帖子 #${source.sourceId}` : `文档 #${source.sourceId}`
}

const handleSourceNavigate = (source?: CommentSourceData | null) => {
    if (!source) return
    const idValue = source.sourceId
    const targetUrl = source.sourceType === 'post'
        ? `/postInfo?postId=${idValue}`
        : `/bookInfo?id=${idValue}`
    window.open(targetUrl, '_blank', 'noopener')
}

const deriveSourceData = (comment: DocumentComment): CommentSourceData | null => {
    if (comment.sourceData && typeof comment.sourceData.sourceId === 'number' && comment.sourceData.sourceType) {
        const normalizedType = String(comment.sourceData.sourceType).trim().toLowerCase()
        const name = comment.sourceData.name?.trim() || ''
        return {
            sourceId: comment.sourceData.sourceId,
            sourceType: normalizedType,
            name: name || (normalizedType === 'post' ? `帖子 #${comment.sourceData.sourceId}` : `文档 #${comment.sourceData.sourceId}`),
        }
    }
    if (comment.document && typeof comment.document.documentId === 'number') {
        return {
            sourceId: comment.document.documentId,
            sourceType: 'document',
            name: comment.document.name || `文档 #${comment.document.documentId}`,
        }
    }
    return null
}

const loadCommentsForMode = async (mode: CommentFetchMode) => {
    if (mode.kind === 'none') {
        comments.value = []
        return
    }

    commentsLoading.value = true
    try {
        let response: ApiResponse<DocumentComment[]>

        if (mode.kind === 'source') {
            response = (await getCommentsBySource(mode.sourceType, mode.sourceId)) as unknown as ApiResponse<DocumentComment[]>
        } else if (mode.kind === 'user') {
            response = (await getUserComments(mode.userId)) as unknown as ApiResponse<DocumentComment[]>
        } else {
            response = (await getAllComments()) as unknown as ApiResponse<DocumentComment[]>
        }

        const data = Array.isArray(response.data) ? response.data : []
        comments.value = data.map((item) => ({
            ...item,
            parentId: item.parentId ?? null,
            content: item.content ?? null,
            sourceData: deriveSourceData(item),
        }))
        await ensureParentComments(comments.value)
    } catch (error: any) {
        comments.value = []
        ElMessage.error(error?.message || '获取评论失败')
        resetParentCommentState()
    } finally {
        commentsLoading.value = false
    }
}

const refreshComments = async (mode: CommentFetchMode = commentFetchMode.value) => {
    resetParentCommentState()
    if (mode.kind === 'none') {
        commentsLoading.value = false
        comments.value = []
        return
    }
    await loadCommentsForMode(mode)
}

const buildCommenterPayload = (): UserBrief | null => {
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
}

const formatNow = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = formatTwoDigit(now.getMonth() + 1)
    const day = formatTwoDigit(now.getDate())
    const hours = formatTwoDigit(now.getHours())
    const minutes = formatTwoDigit(now.getMinutes())
    const seconds = formatTwoDigit(now.getSeconds())
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const ensureCommentPayload = (source: 'main' | 'reply') => {
    const commenter = buildCommenterPayload()
    if (!commenter) {
        ElMessage.warning('请先登录再发表评论')
        router.push('/login')
        return null
    }

    const sourcePayload = resolvedSourcePayload.value
    if (!sourcePayload) {
        ElMessage.error('当前内容不支持发表评论')
        return null
    }

    const content = source === 'main' ? commentContent.value.trim() : replyingContent.value.trim()
    if (!content) {
        ElMessage.warning('请先输入评论内容')
        return null
    }

    const parentId = source === 'main' ? null : replyingTo.value?.commentId ?? null

    return {
        payload: {
            commenter,
            sourceData: sourcePayload,
            content,
            createTime: formatNow(),
            parentId,
        } as CreateCommentPayload,
        content,
    }
}

const postComment = async (source: 'main' | 'reply') => {
    const result = ensureCommentPayload(source)
    if (!result) return

    postingComment.value = true
    try {
        const response = (await createComment(result.payload)) as unknown as ApiResponse<DocumentComment[]>
        comments.value = Array.isArray(response.data) ? response.data : []
        await ensureParentComments(comments.value)
        if (source === 'main') {
            commentContent.value = ''
        } else {
            replyingContent.value = ''
            replyingTo.value = null
            replyingModalVisible.value = false
        }
        ElMessage.success(response.message || '评论发表成功')
    } catch (error: any) {
        ElMessage.error(error?.message || '评论发表失败')
    } finally {
        postingComment.value = false
    }
}

const submitComment = async () => {
    await postComment('main')
}

const submitReply = async () => {
    await postComment('reply')
}

const openReplyBox = (comment: DocumentComment) => {
    if (!shouldShowReplyButton.value) return
    const commenter = buildCommenterPayload()
    if (!commenter) {
        ElMessage.warning('请先登录再发表评论')
        router.push('/login')
        return
    }
    replyingTo.value = comment
    replyingContent.value = ''
    replyingModalVisible.value = true
}

const closeReplyBox = () => {
    replyingModalVisible.value = false
    replyingTo.value = null
    replyingContent.value = ''
}

watch(
    commentFetchMode,
    async (mode, prevMode) => {
        const switchedToNonSource = mode.kind !== 'source'
        const switchedSource =
            prevMode && prevMode.kind === 'source' && mode.kind === 'source' &&
            (prevMode.sourceId !== mode.sourceId || prevMode.sourceType !== mode.sourceType)

        if (switchedToNonSource || switchedSource) {
            commentContent.value = ''
            replyingContent.value = ''
            replyingTo.value = null
            replyingModalVisible.value = false
        }
        await refreshComments(mode)
    },
    { immediate: true },
)

watch(
    () => [props.sourceId, props.sourceType, props.sourceData],
    () => {
        if (!isSourceMode.value) return
        // 清理草稿内容以避免不同文档间的串联
        commentContent.value = ''
        replyingContent.value = ''
        replyingTo.value = null
        replyingModalVisible.value = false
    },
)
</script>

<style scoped>
.comments-section {
    background: #fff;
    border-radius: 16px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.comment-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 8px;
}

.section-title {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px;
}

.editor-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.editor-hint {
    font-size: 13px;
    color: #9ca3af;
}

.comment-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comment-card {
    border-radius: 14px;
    border: 1px solid #e5e7eb;
}

.comment-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.comment-header {
    display: flex;
    gap: 12px;
    align-items: center;
}

.comment-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.commenter-name {
    font-weight: 600;
    color: #1f2937;
}

.comment-time {
    font-size: 13px;
    color: #9ca3af;
}

.comment-document-chip {
    margin-left: auto;
    background: #eef2ff;
    border: none;
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    color: #3730a3;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease;
}

.comment-document-chip:hover {
    background: #e0e7ff;
    transform: translateY(-1px);
}

.comment-document-chip:focus-visible {
    outline: 2px solid #a5b4fc;
    outline-offset: 2px;
}

.reply-reference {
    margin-bottom: 12px;
    padding: 12px;
    border-left: 3px solid #c7d2fe;
    border-radius: 10px;
    background: #f8faff;
}

.reply-reference.reply-missing {
    color: #64748b;
    background: #f1f5f9;
    border-left-color: #cbd5f5;
}

.reply-reference.reply-loading {
    background: #eef2ff;
    border-left-color: #a5b4fc;
    color: #4338ca;
}

.reply-reference.reply-error {
    background: #fef2f2;
    border-left-color: #fca5a5;
    color: #b91c1c;
}

.reply-status-text {
    font-size: 14px;
    color: inherit;
}

.reply-label {
    font-size: 13px;
    color: #4f46e5;
    font-weight: 600;
    margin-bottom: 6px;
}

.reply-parent {
    background: #eef2ff;
    border-radius: 8px;
    padding: 10px 12px;
}

.reply-parent-header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #4338ca;
    margin-bottom: 6px;
}

.reply-parent-name {
    font-weight: 600;
}

.reply-parent-time {
    color: #818cf8;
}

.reply-parent-content {
    margin: 0;
    font-size: 14px;
    color: #4c1d95;
    line-height: 1.6;
}

.comment-content {
    margin: 0;
    font-size: 15px;
    color: #475569;
    line-height: 1.6;
    white-space: pre-line;
}

.comment-actions {
    margin-top: 8px;
    display: flex;
    gap: 12px;
    align-items: center;
}

.reply-context {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 12px;
    background: #eef2ff;
}

.reply-context-header {
    font-weight: 600;
    color: #4f46e5;
}

.reply-context-content {
    margin: 0;
    font-size: 14px;
    color: #4338ca;
    line-height: 1.6;
}

.reply-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.comment-skeleton {
    display: flex;
    gap: 16px;
    padding: 16px 0;
}

.comment-avatar {
    width: 40px;
    height: 40px;
}

.comment-skeleton-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
</style>
