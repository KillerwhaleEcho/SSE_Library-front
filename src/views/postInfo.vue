<template>
	<div class="post-info-page">
		<topbar class="page-topbar" />
		<div class="page-body">
			<section class="post-section">
				<el-skeleton :loading="detailLoading" animated>
					<template #template>
						<div class="skeleton-hero">
							<el-skeleton-item variant="circle" class="skeleton-avatar" />
							<div class="skeleton-content">
								<el-skeleton-item variant="h1" class="skeleton-title" />
								<el-skeleton-item v-for="n in 3" :key="n" variant="text" class="skeleton-line" />
							</div>
						</div>
					</template>
					<template #default>
						<div v-if="postDetail" class="post-card">
							<div class="post-header">
								<el-avatar :src="postDetail.senderAvatar" :size="64" />
								<div class="author-meta">
									<h1 class="post-title">{{ postDetail.title }}</h1>
									<div class="author-row">
										<span class="author-name">{{ postDetail.senderName }}</span>
										<span class="divider">·</span>
										<span class="send-time">{{ formattedSendTime }}</span>
									</div>
									<div class="stats-row">
										<span>评论 {{ postDetail.commentCount }}</span>
										<span>收藏 {{ postDetail.collectCount }}</span>
										<span>点赞 {{ postDetail.likeCount }}</span>
									</div>
								</div>
							</div>

							<div class="post-actions">
								<button class="action-button" type="button" :class="{ disabled: likeProcessing }"
									:disabled="likeProcessing" @click="handleLike">
									<img :src="likeIconSrc" :alt="likeLabel" class="action-icon" />
									<span>{{ likeLabel }}</span>
								</button>
								<button class="action-button" type="button" :class="{ disabled: favoriteProcessing }"
									:disabled="favoriteProcessing" @click="handleFavorite">
									<img :src="favoriteIconSrc" :alt="favoriteLabel" class="action-icon" />
									<span>{{ favoriteLabel }}</span>
								</button>
							</div>

							<div class="post-content">
								<p v-for="(block, index) in postContentBlocks" :key="index">
									{{ block }}
								</p>
								<p v-if="!postContentBlocks.length" class="empty-content">暂无正文内容</p>
							</div>
						</div>
						<el-empty v-else description="未找到对应帖子" />
					</template>
				</el-skeleton>
			</section>

			<section v-if="referencedDocuments.length" class="documents-section">
				<h2 class="section-title">提及的文档</h2>
				<div class="document-button-list">
					<button v-for="doc in referencedDocuments" :key="doc.documentId" type="button" class="document-chip"
						@click="handleDocumentNavigate(doc)">
						{{ doc.name || `文档 #${doc.documentId}` }}
					</button>
				</div>
			</section>

			<section class="comments-section">
				<h2 class="section-title">评论区</h2>
				<CommentSection v-if="postDetail && postNumericId !== null" source-type="post"
					:source-id="postNumericId" :source-data="postSourceData" :show-editor="true"
					:show-comment-user="true" :show-reply-button="true" :show-source-name="false"
					:show-search-bar="false" />
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
import {
	type ApiResponse,
	type CommentSourceData,
	type InfoBrief,
	type FavoriteActionPayload,
	type PostLikePayload,
	type PostDetail,
	getPostDetail,
	getUserFavoriteJudgement,
	getUserLikeJudgement,
	postUserAddFavor,
	deleteUserFavor,
	postUserLikePost,
	deleteUserLikePost,
} from '@/api/all.ts'
import favoriteIcon from '@/assets/喜欢_like.png'
import unfavoriteIcon from '@/assets/不喜欢_unlike.png'
import likedIcon from '@/assets/赞_good-two.png'
import unlikedIcon from '@/assets/没赞_no-good.png'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)
const detailLoading = ref(false)
const postDetail = ref<PostDetail | null>(null)

const normalizedPostId = ref<number | null>(null)
const favoriteProcessing = ref(false)
const favoriteJudgement = ref(false)
const likeProcessing = ref(false)
const likeJudgement = ref(false)

const ensurePostId = (raw: unknown): number | null => {
	if (Array.isArray(raw)) {
		return ensurePostId(raw[0])
	}
	if (typeof raw === 'string') {
		const trimmed = raw.trim()
		if (!trimmed) return null
		const parsed = Number(trimmed)
		return Number.isNaN(parsed) ? null : parsed
	}
	if (typeof raw === 'number' && Number.isFinite(raw)) {
		return raw
	}
	return null
}

const formatTwoDigit = (value: number) => value.toString().padStart(2, '0')

const formatDateTime = (value?: string | null) => {
	if (!value) return '未知时间'
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

const formattedSendTime = computed(() => formatDateTime(postDetail.value?.sendTime))

const postContentBlocks = computed(() => {
	const content = postDetail.value?.content ?? ''
	return content
		.split(/\r?\n/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
})

const applyLocalFavoriteDelta = (delta: number) => {
	if (!postDetail.value) return
	const current = Number(postDetail.value.collectCount ?? 0)
	const next = Math.max(0, current + delta)
	postDetail.value = { ...postDetail.value, collectCount: next }
}

const updatePageTitle = () => {
	const title = postDetail.value?.title || '帖子'
	document.title = `${title} - 帖子详情`
}

const postNumericId = computed<number | null>(() => {
	const rawId = postDetail.value?.postId ?? normalizedPostId.value
	return typeof rawId === 'number' && Number.isFinite(rawId) ? rawId : null
})

const favoriteLabel = computed(() => (favoriteJudgement.value ? '取消收藏' : '收藏帖子'))
const favoriteIconSrc = computed(() => (favoriteJudgement.value ? unfavoriteIcon : favoriteIcon))

const likeLabel = computed(() => (likeJudgement.value ? '取消点赞' : '点赞'))
const likeIconSrc = computed(() => (likeJudgement.value ? likedIcon : unlikedIcon))

const postSourceData = computed<CommentSourceData | null>(() => {
	if (postNumericId.value === null) return null
	return {
		sourceId: postNumericId.value,
		sourceType: 'post',
		name: postDetail.value?.title || `帖子 #${postNumericId.value}`,
	}
})

const referencedDocuments = computed<InfoBrief[]>(() => {
	const list = postDetail.value?.documentList ?? []
	return list.filter((doc): doc is InfoBrief => Boolean(doc?.documentId))
})

const handleDocumentNavigate = (doc: InfoBrief) => {
	const docId = doc.documentId
	if (typeof docId !== 'number') {
		ElMessage.warning('文档编号无效，无法打开详情')
		return
	}
	const targetUrl = `/bookInfo?id=${docId}`
	window.open(targetUrl, '_blank', 'noopener')
}

const loadPostDetail = async (id: number) => {
	detailLoading.value = true
	try {
		const response = (await getPostDetail(id)) as unknown as ApiResponse<PostDetail>
		postDetail.value = response.data ?? null
		updatePageTitle()
	} catch (error: any) {
		postDetail.value = null
		ElMessage.error(error?.message || '获取帖子详情失败')
	} finally {
		detailLoading.value = false
	}
}

const handleLike = async () => {
	if (likeProcessing.value) return
	const currentUserId = userInfo.value?.userId
	const sourceId = postNumericId.value
	if (!currentUserId) {
		ElMessage.warning('请先登录后再点赞')
		return
	}
	if (sourceId === null) {
		ElMessage.warning('帖子信息不完整，无法操作点赞')
		return
	}

	likeProcessing.value = true
	const wasLiked = likeJudgement.value
	const payload: PostLikePayload = { userId: currentUserId, postId: sourceId }
	try {
		await (wasLiked ? deleteUserLikePost(payload) : postUserLikePost(payload))
		await refreshLikeJudgement()
		try {
			await authStore.refreshUserBrief()
		} catch (error) {
			console.warn('刷新用户信息失败', error)
		}
		ElMessage.success(wasLiked ? '已取消点赞' : '点赞成功')
	} catch (error: any) {
		ElMessage.error(error?.message || (wasLiked ? '取消点赞失败' : '点赞失败'))
	} finally {
		likeProcessing.value = false
	}
}

const handleFavorite = async () => {
	if (favoriteProcessing.value) return
	const currentUserId = userInfo.value?.userId
	const sourceId = postNumericId.value
	if (!currentUserId) {
		ElMessage.warning('请先登录后再收藏')
		return
	}
	if (sourceId === null) {
		ElMessage.warning('帖子信息不完整，无法收藏')
		return
	}

	favoriteProcessing.value = true
	const wasFavorited = favoriteJudgement.value
	const payload: FavoriteActionPayload = { userId: currentUserId, sourceId, type: 'post' }
	try {
		await (wasFavorited ? deleteUserFavor(payload) : postUserAddFavor(payload))
		applyLocalFavoriteDelta(wasFavorited ? -1 : 1)
		await refreshFavoriteJudgement()
		try {
			await authStore.refreshUserBrief()
		} catch (error) {
			console.warn('刷新用户信息失败', error)
		}
		ElMessage.success(wasFavorited ? '已取消收藏' : '收藏成功')
	} catch (error: any) {
		ElMessage.error(error?.message || (wasFavorited ? '取消收藏失败' : '收藏失败'))
	} finally {
		favoriteProcessing.value = false
	}
}

const refreshFavoriteJudgement = async () => {
	const currentUserId = userInfo.value?.userId
	const sourceId = postNumericId.value
	if (!currentUserId || sourceId === null) {
		favoriteJudgement.value = false
		return
	}
	try {
		const response = (await getUserFavoriteJudgement({
			userId: currentUserId,
			sourceId,
			type: 'post',
		})) as unknown as ApiResponse<{ judgement: boolean }>
		favoriteJudgement.value = Boolean(response?.data?.judgement)
	} catch (error) {
		favoriteJudgement.value = false
		console.error('获取收藏状态失败:', error)
	}
}

const refreshLikeJudgement = async () => {
	const currentUserId = userInfo.value?.userId
	const sourceId = postNumericId.value
	if (!currentUserId || sourceId === null) {
		likeJudgement.value = false
		return
	}
	try {
		const response = (await getUserLikeJudgement({
			userId: currentUserId,
			postId: sourceId,
		})) as unknown as ApiResponse<{ judgement?: boolean; isLiked?: boolean; postId?: number } | boolean>
		const rawJudgement =
			typeof response?.data === 'boolean'
				? response.data
				: response?.data?.judgement ?? response?.data?.isLiked
		likeJudgement.value = Boolean(rawJudgement)
	} catch (error) {
		likeJudgement.value = false
		console.error('获取点赞状态失败:', error)
	}
}

watch(
	() => route.query.postId,
	(rawPostId) => {
		const id = ensurePostId(rawPostId)
		normalizedPostId.value = id
		if (id === null) {
			postDetail.value = null
			ElMessage.warning('未提供有效的帖子编号')
			return
		}
		loadPostDetail(id)
	},
	{ immediate: true },
)

watch(
	[
		() => userInfo.value?.userId,
		() => postNumericId.value,
	],
	async () => {
		await Promise.all([refreshFavoriteJudgement(), refreshLikeJudgement()])
	},
	{ immediate: true },
)

watch(
	() => postDetail.value?.title,
	() => updatePageTitle(),
	{ immediate: true },
)
</script>

<style scoped>
.post-info-page {
	min-height: 100vh;
	background: #f7f6f9;
	display: flex;
	flex-direction: column;
}

.page-topbar {
	flex-shrink: 0;
}

.page-body {
	width: 100%;
	max-width: 1080px;
	margin: 24px auto 64px;
	padding: 0 20px 40px;
	display: flex;
	flex-direction: column;
	gap: 32px;
}

.post-card {
	background-color: #fff;
	border-radius: 16px;
	padding: 32px;
	box-shadow: 0 10px 30px rgba(15, 36, 84, 0.06);
}

.post-header {
	display: flex;
	gap: 20px;
	align-items: flex-start;
}

.author-meta {
	flex: 1;
}

.post-title {
	margin: 0 0 8px;
	font-size: 28px;
	color: #0f2354;
	line-height: 1.3;
}

.author-row {
	display: flex;
	align-items: center;
	gap: 8px;
	color: #6b7280;
	font-size: 14px;
}

.stats-row {
	display: flex;
	gap: 24px;
	margin-top: 12px;
	font-size: 14px;
	color: #4b5563;
}

.post-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	margin: 24px 0;
}

.action-button {
	flex: 1;
	min-width: 200px;
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
	transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.action-button:hover:not(.disabled):not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.action-button:active:not(.disabled):not(:disabled) {
	transform: translateY(0);
	box-shadow: 0 8px 16px rgba(79, 70, 229, 0.18);
}

.action-icon {
	width: 24px;
	height: 24px;
	object-fit: contain;
}

.post-content {
	border-top: 1px solid #eef2ff;
	padding-top: 20px;
	line-height: 1.8;
	color: #111827;
	font-size: 16px;
	white-space: pre-wrap;
}

.post-content p {
	margin-bottom: 1em;
}

.empty-content {
	color: #9ca3af;
	font-style: italic;
}

.documents-section,
.comments-section {
	background: #fff;
	border-radius: 16px;
	padding: 28px;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.comments-section> :deep(.comments-section) {
	background: transparent;
	box-shadow: none;
	padding: 16px;
}

.document-button-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.document-chip {
	width: 100%;
	border: 1px solid #cbd5f5;
	border-radius: 10px;
	padding: 12px 18px;
	text-align: left;
	background: #f8f9ff;
	color: #1f2a44;
	font-size: 15px;
	cursor: pointer;
	transition: transform 0.15s ease, background 0.2s ease;
}

.document-chip:hover {
	background: #e6edff;
	transform: translateX(3px);
}

.section-title {
	margin: 0 0 16px;
	font-size: 22px;
	color: #0f2354;
}

.comment-placeholder {
	margin-top: 12px;
	color: #94a3b8;
	font-size: 14px;
}

.skeleton-hero {
	display: flex;
	gap: 16px;
}

.skeleton-avatar {
	width: 64px;
	height: 64px;
}

.skeleton-content {
	flex: 1;
}

.divider {
	color: #9ca3af;
}
</style>
