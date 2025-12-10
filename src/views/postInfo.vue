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
								<button class="action-button" type="button" @click="handleLikePlaceholder">
									👍 点赞功能开发中
								</button>
								<button class="action-button" type="button" @click="handleCollectPlaceholder">
									📁 收藏功能开发中
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
				<CommentSection source-type="post" :source-id="postIdForComment" :source-data="postSourceData"
					:show-editor="true" :show-comment-user="true" :show-reply-button="true" :show-source-name="false" />
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import topbar from '@/layout/topbar.vue'
import CommentSection from '@/components/comments/CommentSection.vue'
import {
	type ApiResponse,
	type CommentSourceData,
	type InfoBrief,
	type PostDetail,
	getPostDetail,
} from '@/api/all.ts'

const route = useRoute()
const detailLoading = ref(false)
const postDetail = ref<PostDetail | null>(null)

const normalizedPostId = ref<number | null>(null)

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

const postIdForComment = computed<number | null>(() => {
	if (postDetail.value?.postId) return postDetail.value.postId
	return normalizedPostId.value
})

const postSourceData = computed<CommentSourceData | null>(() => {
	if (postIdForComment.value === null) return null
	return {
		sourceId: postIdForComment.value,
		sourceType: 'post',
		name: postDetail.value?.title || `帖子 #${postIdForComment.value}`,
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
	} catch (error: any) {
		postDetail.value = null
		ElMessage.error(error?.message || '获取帖子详情失败')
	} finally {
		detailLoading.value = false
	}
}

const handleLikePlaceholder = () => {
	ElMessage.info('点赞功能开发中，敬请期待')
}

const handleCollectPlaceholder = () => {
	ElMessage.info('收藏功能开发中，敬请期待')
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
</script>

<style scoped>
.post-info-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #f6f7fb 0%, #ffffff 40%);
	display: flex;
	flex-direction: column;
}

.page-topbar {
	flex-shrink: 0;
}

.page-body {
	width: 100%;
	max-width: 960px;
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
	gap: 16px;
	margin: 24px 0;
}

.action-button {
	border: 1px dashed #94a3b8;
	border-radius: 999px;
	padding: 10px 20px;
	background: transparent;
	cursor: pointer;
	font-size: 14px;
	color: #475569;
	transition: background 0.2s ease;
}

.action-button:hover {
	background: rgba(59, 130, 246, 0.08);
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
	box-shadow: 0 8px 24px rgba(15, 36, 84, 0.05);
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
