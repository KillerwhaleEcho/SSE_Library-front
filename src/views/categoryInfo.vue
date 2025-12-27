<template>
    <div class="category-page">
        <topbar class="page-topbar" />

        <div class="page-body">
            <section class="info-section">
                <div v-if="loadingCategory" class="loading-hint">加载分类信息...</div>
                <div v-else-if="category" class="info-card">
                    <div class="info-header">
                        <div class="title-block">
                            <p class="category-id">ID {{ category.id }}</p>
                            <h1 class="category-name">{{ category.name }}</h1>
                            <p class="category-desc">{{ category.description || '暂无描述' }}</p>
                        </div>
                        <div :class="['category-badge', category.isCourse ? 'course' : 'category']">
                            {{ category.isCourse ? '课程' : '分类' }}
                        </div>
                    </div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">是否课程</span>
                            <span class="value">{{ category.isCourse ? '是' : '否' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">文件数</span>
                            <span class="value">{{ category.fileCounts ?? 0 }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">浏览量</span>
                            <span class="value">{{ category.readCounts ?? 0 }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">所属分类 ID</span>
                            <span class="value">{{ category.parentId ?? '无' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">包含课程数</span>
                            <span class="value">{{ childCategories.length }}</span>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-hint">{{ categoryError || '未找到分类信息' }}</div>
            </section>

            <section class="relation-section" v-if="parentCategory || childCategories.length">
                <div v-if="parentCategory" class="relation-block">
                    <h2 class="section-title">所属分类</h2>
                    <div class="category-list">
                        <CategoryItem :category="parentCategory" />
                    </div>
                </div>
                <div v-if="childCategories.length" class="relation-block">
                    <h2 class="section-title">包含课程</h2>
                    <div class="category-list">
                        <CategoryItem v-for="item in childCategories" :key="item.id" :category="item" />
                    </div>
                </div>
            </section>

            <section class="doc-section">
                <div class="section-header">
                    <h2 class="section-title">包含文档</h2>
                    <span v-if="documents.length" class="section-count">共 {{ documents.length }} 个</span>
                </div>
                <div v-if="documentsLoading" class="loading-hint">加载文档...</div>
                <div v-else-if="documents.length" class="book-list">
                    <BookItem v-for="doc in documents" :key="doc.infoBrief.documentId" :document="doc"
                        @click="goDocument(doc)" />
                </div>
                <div v-else class="empty-hint">暂无文档</div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import topbar from '@/layout/topbar.vue'
import CategoryItem from '@/components/categoryItem.vue'
import BookItem from '@/components/bookItem.vue'
import { ElMessage } from 'element-plus'
import {
    type Category,
    type Document,
    getCategoryById,
    getBookList,
} from '@/api/all.ts'

const props = defineProps<{ categoryId?: number }>()
const route = useRoute()
const router = useRouter()

const category = ref<Category | null>(null)
const parentCategory = ref<Category | null>(null)
const childCategories = ref<Category[]>([])
const documents = ref<Document[]>([])
const loadingCategory = ref(false)
const documentsLoading = ref(false)
const categoryError = ref('')

const resolvedCategoryId = computed<number | null>(() => {
    if (typeof props.categoryId === 'number' && Number.isFinite(props.categoryId)) return props.categoryId
    const parsed = Number(route.query.id)
    return Number.isFinite(parsed) ? parsed : null
})

const normalizeCategory = (cat?: Partial<Category>): Category => {
    const safeCat: Partial<Category> = cat ?? {}
    const normalizedChildren = Array.isArray(safeCat.children)
        ? safeCat.children.map((child) => normalizeCategory(child))
        : []
    return {
        id: Number(safeCat.id ?? 0),
        name: safeCat.name ?? '',
        isCourse: (safeCat as any).isCourse ?? (safeCat as any).is_course ?? false,
        is_course: (safeCat as any).is_course ?? false,
        fileCounts: Number((safeCat as any).fileCounts ?? (safeCat as any).file_counts ?? 0),
        readCounts: Number((safeCat as any).readCounts ?? (safeCat as any).read_counts ?? 0),
        description: safeCat.description ?? '',
        parentId: (safeCat as any).parentId ?? (safeCat as any).parent_id ?? null,
        parent_id: (safeCat as any).parent_id ?? null,
        children: normalizedChildren,
    }
}

const loadParentCategory = async (parentId: number) => {
    try {
        const res = await getCategoryById(parentId)
        parentCategory.value = normalizeCategory(res.data)
    } catch (error) {
        parentCategory.value = null
        console.warn('加载所属分类失败', error)
    }
}

const loadDocuments = async (catId: number) => {
    documentsLoading.value = true
    try {
        const res = await getBookList(false, catId)
        const payload = (res as any)?.data ?? []
        const list = Array.isArray(payload) ? payload : (Array.isArray((payload as any).documents) ? (payload as any).documents : [])
        documents.value = list
    } catch (error: any) {
        documents.value = []
        ElMessage.error(error?.message || '加载文档失败')
    } finally {
        documentsLoading.value = false
    }
}

const loadCategory = async (catId: number) => {
    loadingCategory.value = true
    categoryError.value = ''
    category.value = null
    parentCategory.value = null
    childCategories.value = []
    try {
        const res = await getCategoryById(catId)
        const normalized = normalizeCategory(res.data)
        normalized.isCourse = Boolean((res.data as any)?.isCourse ?? (res.data as any)?.is_course)
        normalized.parentId = (res.data as any)?.parentId ?? (res.data as any)?.parent_id ?? normalized.parentId ?? null
        normalized.children = normalized.children ?? []
        category.value = normalized
        childCategories.value = normalized.children ?? []

        if (normalized.parentId !== null && normalized.parentId !== undefined) {
            await loadParentCategory(normalized.parentId)
        }

        await loadDocuments(catId)
    } catch (error: any) {
        category.value = null
        categoryError.value = error?.message || '加载分类失败'
        ElMessage.error(categoryError.value)
    } finally {
        loadingCategory.value = false
    }
}

const goDocument = (doc: Document) => {
    const docId = doc?.infoBrief?.documentId
    if (!docId) return
    router.push({ path: '/bookInfo', query: { id: docId } })
}

onMounted(() => {
    if (resolvedCategoryId.value !== null) {
        loadCategory(resolvedCategoryId.value)
    }
})

watch(resolvedCategoryId, (next) => {
    if (next !== null) {
        loadCategory(next)
    }
})
</script>

<style scoped>
.category-page {
    min-height: 100vh;
    background: #f5f5f8;
}

.page-topbar {
    position: sticky;
    top: 0;
    z-index: 10;
}

.page-body {
    max-width: 1200px;
    margin: 24px auto;
    padding: 0 16px 48px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.info-section,
.relation-section,
.doc-section {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

.info-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.info-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.title-block {
    flex: 1;
}

.category-id {
    margin: 0;
    color: #8c8c8c;
    font-size: 13px;
}

.category-name {
    margin: 4px 0 8px;
    font-size: 28px;
    font-weight: 700;
    color: #2d2d2d;
}

.category-desc {
    margin: 0;
    color: #555;
    line-height: 1.6;
}

.category-badge {
    padding: 8px 12px;
    border-radius: 10px;
    font-weight: 600;
    color: #fff;
    min-width: 70px;
    text-align: center;
}

.category-badge.course {
    background: linear-gradient(135deg, #7c4dff, #5c6bc0);
}

.category-badge.category {
    background: linear-gradient(135deg, #26c6da, #00acc1);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
}

.info-item {
    background: #f9f9fb;
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.label {
    color: #888;
    font-size: 14px;
}

.value {
    color: #1f1f1f;
    font-weight: 600;
}

.relation-block {
    margin-bottom: 12px;
}

.section-title {
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 700;
    color: #2d2d2d;
}

.category-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.doc-section .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.section-count {
    color: #8c8c8c;
}

.book-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
}

.loading-hint,
.empty-hint {
    color: #888;
    padding: 12px 0;
}
</style>
