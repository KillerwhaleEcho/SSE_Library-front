<template>
  <div class="document-list">
    <el-card class="document-card">
      <div class="document-card__header">
        <h3 class="document-card__title">{{ TEXT.title }}</h3>
        <div class="document-card__actions">
          <el-button
            class="document-card__filter-btn"
            :class="{ 'document-card__filter-btn--active': showReviewingOnly }"
            size="medium"
            :type="showReviewingOnly ? 'primary' : 'info'"
            :plain="!showReviewingOnly"
            @click="toggleReviewingFilter"
          >
            {{
              showReviewingOnly
                ? TEXT.showAllDocuments
                : TEXT.filterReviewing
            }}
          </el-button>
          <el-button
            class="document-card__refresh-btn"
            type="primary"
            size="medium"
            :loading="loading"
            @click="fetchDocuments"
          >
            {{ TEXT.refresh }}
          </el-button>
        </div>
      </div>

      <el-table
        :data="filteredDocuments"
        border
        class="document-table"
        v-loading="loading"
        :element-loading-text="TEXT.loading"
        :empty-text="TEXT.empty"
      >
        <el-table-column :label="TEXT.cover" width="120">
          <template #default="{ row }">
            <el-image
              class="document-table__cover"
              :src="row.cover"
              :preview-src-list="row.cover ? [row.cover] : []"
              fit="cover"
            >
              <template #error>
                <div class="document-table__cover--fallback">
                  {{ TEXT.noCover }}
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column :label="TEXT.name" min-width="220">
          <template #default="{ row }">
            <el-link
              type="primary"
              :underline="false"
              @click.prevent="handleGoDetail(row)"
            >
              {{ row.name || TEXT.unknown }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="uploadTime" :label="TEXT.uploadTime" width="180" />

        <el-table-column :label="TEXT.status" width="160">
          <template #default="{ row }">
            <el-select
              v-model="row.status"
              size="small"
              @change="(value:any) => handleStatusChange(row, value)"
            >
              <el-option
                v-for="option in STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column :label="TEXT.action" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              {{ TEXT.edit }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="editVisible"
      :title="TEXT.editTitle"
      width="560px"
      destroy-on-close
      @close="resetEditForm"
    >
      <el-form label-width="108px" :model="editForm" class="document-edit-form">
        <el-form-item :label="TEXT.form.category">
          <el-input v-model="editForm.category" clearable />
        </el-form-item>
        <el-form-item :label="TEXT.form.type">
          <el-input v-model="editForm.type" clearable />
        </el-form-item>
        <el-form-item :label="TEXT.form.name">
          <el-input v-model="editForm.name" clearable />
        </el-form-item>
        <el-form-item :label="TEXT.form.isbn">
          <el-input v-model="editForm.isbn" clearable />
        </el-form-item>
        <el-form-item :label="TEXT.form.author">
          <el-input v-model="editForm.author" clearable />
        </el-form-item>
        <el-form-item :label="TEXT.form.tags">
          <el-input
            v-model="editForm.tags"
            :placeholder="TEXT.form.tagsPlaceholder"
            clearable
          />
        </el-form-item>
        <el-form-item :label="TEXT.form.createYear">
          <el-date-picker
            v-model="editForm.createYear"
            type="year"
            value-format="YYYY"
            :placeholder="TEXT.form.createYearPlaceholder"
            clearable
          />
        </el-form-item>
        <el-form-item :label="TEXT.form.vedioURL">
          <el-input v-model="editForm.vedioURL" clearable />
        </el-form-item>
        <el-form-item :label="TEXT.form.coverUrl">
          <el-input v-model="editForm.coverUrl" clearable />
        </el-form-item>
        <el-form-item :label="TEXT.form.coverFile">
          <input
            ref="coverInput"
            class="document-edit-form__file-input"
            type="file"
            accept="image/*"
            @change="handleCoverFile"
          />
          <span v-if="editForm.coverUrl" class="document-edit-form__hint">
            {{ TEXT.form.coverHint }}
          </span>
        </el-form-item>
        <el-form-item :label="TEXT.form.file">
          <input
            ref="fileInput"
            class="document-edit-form__file-input"
            type="file"
            @change="handleDocumentFile"
          />
        </el-form-item>
        <el-form-item :label="TEXT.form.introduction">
          <el-input
            v-model="editForm.introduction"
            type="textarea"
            :rows="4"
            :placeholder="TEXT.form.introductionPlaceholder"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editVisible = false">{{ TEXT.cancel }}</el-button>
          <el-button type="primary" :loading="saving" @click="handleSaveEdit">
            {{ TEXT.save }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import service from '../../utils/service'

interface ApiResponse<T = unknown> {
  code: number | string
  message?: string
  data: T
}

type DocumentStatus = '开放' | '审核中' | '关闭' | '已撤回'

interface BookItem {
  name: string
  document_id: number
  type: string
  uploadTime: string
  status: string
  category: string
  collections: number
  readCounts: number
  URL: string
  bookISBN: string
  author: string
  cover: string
  intruduction: string
  createYear: string
  tags?: string[]
}

type DocumentRow = BookItem & { status: DocumentStatus }

interface EditFormState {
  document_id: number | null
  type: string
  category: string
  name: string
  isbn: string
  tags: string
  author: string
  createYear: string
  coverUrl: string
  coverFile: File | null
  introduction: string
  file: File | null
  vedioURL: string
}

const router = useRouter()

const TEXT = {
  title: '资料列表',
  refresh: '刷新',
  filterReviewing: '查看审核中资料',
  showAllDocuments: '查看全部资料',
  loading: '正在加载资料，请稍候…',
  empty: '暂无资料',
  cover: '封面',
  noCover: '暂无封面',
  name: '资料名称',
  uploadTime: '上传时间',
  status: '资料状态',
  action: '操作',
  edit: '修改资料',
  editTitle: '编辑资料信息',
  cancel: '取消',
  save: '保存修改',
  unknown: '未命名资料',
  previewUnavailable: '暂无可展示的详情',
  statusUpdated: '状态更新成功',
  statusUpdateFailed: '状态更新失败，请重试',
  editSuccess: '资料信息已更新',
  editFailed: '保存失败，请稍后重试',
  editMissingId: '缺少资料编号，无法保存',
  mockFallback: '未获取到资料数据，列表为空',
  mockUsingDemo: '当前展示为模拟数据',
  form: {
    category: '资料分类',
    type: '资料类型',
    name: '资料名称',
    isbn: 'ISBN',
    author: '作者',
    tags: '标签',
    tagsPlaceholder: '多个标签请使用逗号分隔',
    createYear: '出版年份',
    createYearPlaceholder: '请选择年份',
    vedioURL: '视频链接',
    coverUrl: '封面地址',
    coverFile: '上传封面',
    coverHint: '若选择新封面，将优先使用本地文件',
    file: '上传资料文件',
    introduction: '简介',
    introductionPlaceholder: '请输入资料简介，最多 500 字',
  },
} as const

const USE_MOCK = true
let hasMockNotice = false

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const MOCK_DOCUMENTS: DocumentRow[] = [
  {
    name: 'Vue 3 实战指南',
    document_id: 101,
    type: '电子书',
    uploadTime: '2024-05-12 09:30:00',
    status: '开放',
    category: '前端开发',
    collections: 128,
    readCounts: 532,
    URL: 'https://example.com/docs/vue3',
    bookISBN: '978-7-121-12345-6',
    author: '张三',
    cover: 'https://picsum.photos/seed/vue3/120/160',
    intruduction: '系统介绍 Vue 3 核心特性与实战案例。',
    createYear: '2023',
    tags: ['Vue', '前端', 'JavaScript'],
  },
  {
    name: 'Spring Boot 微服务实践',
    document_id: 102,
    type: '讲义',
    uploadTime: '2024-06-01 14:15:00',
    status: '审核中',
    category: '后端开发',
    collections: 86,
    readCounts: 421,
    URL: 'https://example.com/docs/spring',
    bookISBN: '978-7-111-65432-1',
    author: '李四',
    cover: 'https://picsum.photos/seed/spring/120/160',
    intruduction: '覆盖 Spring Boot 微服务架构的核心概念与落地方案。',
    createYear: '2022',
    tags: ['Spring', '微服务', 'Java'],
  },
  {
    name: '数据分析入门',
    document_id: 103,
    type: '课件',
    uploadTime: '2024-04-22 16:45:00',
    status: '关闭',
    category: '数据科学',
    collections: 64,
    readCounts: 308,
    URL: 'https://example.com/docs/data-analysis',
    bookISBN: '978-7-302-76543-0',
    author: '王五',
    cover: 'https://picsum.photos/seed/data/120/160',
    intruduction: '以真实案例讲解 Pandas、NumPy 与可视化工具的使用。',
    createYear: '2021',
    tags: ['数据分析', 'Python', 'Pandas'],
  },
  {
    name: '产品原型设计规范',
    document_id: 104,
    type: '文档',
    uploadTime: '2024-07-08 10:20:00',
    status: '已撤回',
    category: '产品设计',
    collections: 25,
    readCounts: 102,
    URL: 'https://example.com/docs/ux',
    bookISBN: '978-7-900-12345-0',
    author: '赵六',
    cover: 'https://picsum.photos/seed/ux/120/160',
    intruduction: '梳理常见原型设计规范与组件库使用建议。',
    createYear: '2020',
    tags: ['产品设计', '原型', '交互'],
  },
] as const

const STATUS_OPTIONS: Array<{ label: string; value: DocumentStatus }> = [
  { label: '开放', value: '开放' },
  { label: '审核中', value: '审核中' },
  { label: '关闭', value: '关闭' },
  { label: '已撤回', value: '已撤回' },
]

const documents = ref<DocumentRow[]>([])
const loading = ref(false)
const editVisible = ref(false)
const saving = ref(false)
const coverInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const showReviewingOnly = ref(false)

const REVIEWING_STATUS =
  STATUS_OPTIONS.find((option) => option.value.includes('审核'))?.value ?? ('审核中' as DocumentStatus)

const filteredDocuments = computed(() =>
  showReviewingOnly.value
    ? documents.value.filter((item) => item.status === REVIEWING_STATUS)
    : documents.value,
)

const editForm = reactive<EditFormState>({
  document_id: null,
  type: '',
  category: '',
  name: '',
  isbn: '',
  tags: '',
  author: '',
  createYear: '',
  coverUrl: '',
  coverFile: null,
  introduction: '',
  file: null,
  vedioURL: '',
})

const normalizeDocument = (doc: BookItem): DocumentRow => {
  const fallbackStatus: DocumentStatus = '审核中'
  const status = STATUS_OPTIONS.find((option) => option.value === doc.status)?.value ?? fallbackStatus

  return {
    ...doc,
    status,
    uploadTime: doc.uploadTime || '',
    cover: doc.cover || '',
    intruduction: doc.intruduction || '',
    bookISBN: doc.bookISBN || '',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
  }
}

const fetchDocuments = async () => {
  loading.value = true
  try {
    if (USE_MOCK) {
      await delay(300)
      documents.value = MOCK_DOCUMENTS.map((item) => normalizeDocument(item))
      if (!hasMockNotice) {
        ElMessage.info(TEXT.mockUsingDemo)
        hasMockNotice = true
      }
      return
    }

    const res = await service.get<ApiResponse<BookItem[]>>('/documents', {
      params: {
        isSuggest: false,
      },
    })

    const list = Array.isArray(res.data) ? res.data : []
    if (list.length === 0) {
      documents.value = []
      ElMessage.info(TEXT.mockFallback)
      return
    }

    documents.value = list.map(normalizeDocument)
  } catch (error) {
    documents.value = []
    ElMessage.error((error as Error)?.message || TEXT.mockFallback)
  } finally {
    loading.value = false
  }
}

const handleGoDetail = (row: DocumentRow) => {
  if (!row.document_id) {
    ElMessage.warning(TEXT.previewUnavailable)
    return
  }

  router.push({
    name: 'BookInfo',
    query: {
      id: String(row.document_id),
    },
  })
}

const toggleReviewingFilter = () => {
  showReviewingOnly.value = !showReviewingOnly.value
}

const handleStatusChange = async (row: DocumentRow, nextStatus: DocumentStatus) => {
  if (!row.document_id) {
    ElMessage.error(TEXT.editMissingId)
    return
  }

  const previous = row.status
  row.status = nextStatus

  try {
    if (USE_MOCK) {
      await delay(200)
      const mockIndex = MOCK_DOCUMENTS.findIndex((item) => item.document_id === row.document_id)
      if (mockIndex !== -1) {
        MOCK_DOCUMENTS[mockIndex].status = nextStatus
      }
    } else {
      await service.put('/admin/document/status', {
        document_id: row.document_id,
        status: nextStatus,
      })
    }
    ElMessage.success(TEXT.statusUpdated)
  } catch (error) {
    row.status = previous
    ElMessage.error((error as Error)?.message || TEXT.statusUpdateFailed)
  }
}

const releaseBlob = (url: string) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

const openEditDialog = (row: DocumentRow) => {
  editVisible.value = true

  editForm.document_id = row.document_id ?? null
  editForm.category = row.category || ''
  editForm.type = row.type || ''
  editForm.name = row.name || ''
  editForm.isbn = row.bookISBN || ''
  editForm.tags = Array.isArray(row.tags) ? row.tags.join(', ') : ''
  editForm.author = row.author || ''
  editForm.createYear = row.createYear || ''
  editForm.coverUrl = row.cover || ''
  editForm.coverFile = null
  editForm.introduction = row.intruduction || ''
  editForm.file = null
  editForm.vedioURL = row.URL || ''

  if (coverInput.value) {
    coverInput.value.value = ''
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const resetEditForm = () => {
  releaseBlob(editForm.coverUrl)

  editForm.document_id = null
  editForm.category = ''
  editForm.type = ''
  editForm.name = ''
  editForm.isbn = ''
  editForm.tags = ''
  editForm.author = ''
  editForm.createYear = ''
  editForm.coverUrl = ''
  editForm.coverFile = null
  editForm.introduction = ''
  editForm.file = null
  editForm.vedioURL = ''

  if (coverInput.value) {
    coverInput.value.value = ''
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleCoverFile = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files && input.files[0] ? input.files[0] : null

  if (file) {
    releaseBlob(editForm.coverUrl)
    editForm.coverFile = file
    editForm.coverUrl = URL.createObjectURL(file)
  } else {
    editForm.coverFile = null
  }
}

const handleDocumentFile = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files && input.files[0] ? input.files[0] : null
  editForm.file = file
}

const buildSubmitFormData = () => {
  const formData = new FormData()

  formData.append('document_id', String(editForm.document_id))
  formData.append('type', editForm.type.trim())
  formData.append('category', editForm.category.trim())
  formData.append('name', editForm.name.trim())
  formData.append('isbn', editForm.isbn.trim())
  formData.append('tags', editForm.tags.trim())
  formData.append('author', editForm.author.trim())
  formData.append('createYear', editForm.createYear.trim())
  formData.append('introduction', editForm.introduction.trim())
  formData.append('vedioURL', editForm.vedioURL.trim())

  if (editForm.coverFile) {
    formData.append('cover', editForm.coverFile)
  } else if (editForm.coverUrl && !editForm.coverUrl.startsWith('blob:')) {
    formData.append('cover', editForm.coverUrl.trim())
  }

  if (editForm.file) {
    formData.append('file', editForm.file)
  }

  return formData
}

const handleSaveEdit = async () => {
  if (editForm.document_id === null) {
    ElMessage.error(TEXT.editMissingId)
    return
  }

  const current = USE_MOCK
    ? documents.value.find((item) => item.document_id === editForm.document_id) ?? null
    : null

  if (USE_MOCK && current === null) {
    ElMessage.error(TEXT.editMissingId)
    return
  }

  saving.value = true
  try {
    if (USE_MOCK && current) {
      await delay(400)
      const tags = editForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      current.type = editForm.type.trim()
      current.category = editForm.category.trim()
      current.name = editForm.name.trim()
      current.bookISBN = editForm.isbn.trim()
      current.author = editForm.author.trim()
      current.createYear = editForm.createYear.trim()
      current.cover = editForm.coverUrl.trim()
      current.intruduction = editForm.introduction.trim()
      current.URL = editForm.vedioURL.trim()
      current.tags = tags

      const mockTarget = MOCK_DOCUMENTS.find((item) => item.document_id === current.document_id)
      if (mockTarget) {
        mockTarget.type = current.type
        mockTarget.category = current.category
        mockTarget.name = current.name
        mockTarget.bookISBN = current.bookISBN
        mockTarget.author = current.author
        mockTarget.createYear = current.createYear
        mockTarget.cover = current.cover
        mockTarget.intruduction = current.intruduction
        mockTarget.URL = current.URL
        mockTarget.tags = [...current.tags]
      }
    } else {
      const formData = buildSubmitFormData()
      await service.put('/document', formData)
      await fetchDocuments()
    }

    ElMessage.success(TEXT.editSuccess)
    editVisible.value = false
  } catch (error) {
    ElMessage.error((error as Error)?.message || TEXT.editFailed)
  } finally {
    saving.value = false
  }
}

onMounted(fetchDocuments)
</script>

<style scoped lang="css">
.document-list {
  padding: 0;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.document-card {
  border-radius: 10px;
  background: #fff;
  border: none;
  box-shadow: none;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.document-card :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.document-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.document-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #311a45;
}

.document-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.document-card__filter-btn {
  border: 1px solid rgba(255, 166, 183, 0.45);
  background: #fff;
  color: #ff6f91;
  transition: all 0.3s ease;
}

.document-card__filter-btn:hover,
.document-card__filter-btn--active {
  background: rgba(255, 166, 183, 0.18);
}

.document-card__refresh-btn {
  border: none;
  background: linear-gradient(135deg, #ffa6b7 0%, #ff867f 100%);
  color: #fff;
  transition: all 0.3s ease;
}

.document-card__refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(255, 140, 148, 0.35);
}

.document-table {
  flex: 1;
}

:deep(.el-table) {
  --el-table-border-color: rgba(255, 166, 183, 0.25);
  background-color: #fff;
}

:deep(.el-table th) {
  background-color: rgba(255, 166, 183, 0.18);
  color: #5b294a;
  font-weight: 600;
}

:deep(.el-table tr:hover > td) {
  background-color: rgba(255, 166, 183, 0.15);
}

.document-table__cover {
  width: 72px;
  height: 96px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f6fa;
}

.document-table__cover--fallback {
  width: 72px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.document-edit-form__file-input {
  width: 100%;
}

.document-edit-form__hint {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  color: #999;
}
</style>
