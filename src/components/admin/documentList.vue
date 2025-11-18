<template>
  <div class="document-list">
    <el-card class="document-card">
      <div class="document-card__header">
          <el-input
            placeholder="请按照书名或者作者搜索"
            clearable
            v-model="searchInput"
            class="document-card__search-input"
            @keyup.enter="handleSearch"
            @clear="handleClear"
            size="large"
          >
            <template #append>
              <el-button typr="primary" @click="handleSearch"
                >搜索</el-button
              >
            </template>
          </el-input>
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
              showReviewingOnly ? TEXT.showAllDocuments : TEXT.filterReviewing
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

      <div class="document-card__table">
        <el-table
          :data="displayedDocuments"
          border
          class="document-table"
          v-loading="loading"
          :element-loading-text="TEXT.loading"
          :empty-text="TEXT.empty"
        >
          <el-table-column :label="TEXT.cover" width="120" align="center">
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
          <el-table-column :label="TEXT.name" min-width="180" align="center">
            <template #default="{ row }">
              <el-link
                type="primary"
                :underline="false"
                @click.prevent="handleGoDetail(row)"
              >
                {{ row.infoBrief?.name || TEXT.unknown }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="作者" min-width="180" align="center">
            <template #default="{ row }">
              {{ row.author || "未知作者" }}
            </template>
          </el-table-column>
          <el-table-column :label="TEXT.uploadTime" width="150" align="center">
            <template #default="{ row }">
              {{ row.infoBrief?.uploadTime || TEXT.unknown }}
            </template>
          </el-table-column>

          <el-table-column :label="TEXT.status" width="160" align="center">
            <template #default="{ row }">
              <el-select
                v-model="row.infoBrief.status"
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

          <el-table-column :label="TEXT.action" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                @click="openEditDialog(row)"
              >
                {{ TEXT.edit }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <!-- 修改资料的弹窗 -->
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
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import service from "../../utils/service";
import { type ApiResponse } from "../../api/all";
import { type DocumentEditForm } from "../../types/api";
import { type Document } from "@/api/all.ts";
import { MOCK_DOCUMENTS } from "./mockData";

const TEXT = {
  title: "资料列表",
  refresh: "刷新",
  filterReviewing: "查看审核中资料",
  showAllDocuments: "查看全部资料",
  loading: "正在加载资料，请稍候…",
  empty: "暂无资料",
  cover: "封面",
  noCover: "暂无封面",
  name: "资料名称",
  uploadTime: "上传时间",
  status: "资料状态",
  action: "操作",
  edit: "修改资料",
  editTitle: "编辑资料信息",
  cancel: "取消",
  save: "保存修改",
  unknown: "未命名资料",
  previewUnavailable: "暂无可展示的详情",
  statusUpdated: "状态更新成功",
  statusUpdateFailed: "状态更新失败，请重试",
  editSuccess: "资料信息已更新",
  editFailed: "保存失败，请稍后重试",
  editMissingId: "缺少资料编号，无法保存",
  mockFallback: "未获取到资料数据，列表为空",
  mockUsingDemo: "当前展示为模拟数据",
  form: {
    category: "资料分类",
    type: "资料类型",
    name: "资料名称",
    isbn: "ISBN",
    author: "作者",
    tags: "标签",
    tagsPlaceholder: "多个标签请使用逗号分隔",
    createYear: "出版年份",
    createYearPlaceholder: "请选择年份",
    vedioURL: "视频链接",
    coverUrl: "封面地址",
    coverFile: "上传封面",
    coverHint: "若选择新封面，将优先使用本地文件",
    file: "上传资料文件",
    introduction: "简介",
    introductionPlaceholder: "请输入资料简介，最多 500 字",
  },
} as const;

const router = useRouter();
const searchInput = ref("");
const appliedKeyword = ref("");

const USE_MOCK = true;
const documents = ref<Document[]>([]);
const loading = ref(false);
const editVisible = ref(false);
const saving = ref(false);
const coverInput = ref<HTMLInputElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const showReviewingOnly = ref(false); //控制是否只展示待审核数据

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "开放", value: "开放" },
  { label: "审核中", value: "审核中" },
  { label: "关闭", value: "关闭" },
  { label: "已撤回", value: "已撤回" },
];

// 这段代码最终的结果是："开放" | "审核中" | "关闭" | "已撤回"
type DocumentStatus = (typeof STATUS_OPTIONS)[number]["value"];

// 按照要求返回资料，搜索逻辑也在其中。所以这个函数可以表示为：源数据 + 派生条件 -> 计算得到展示列表
const filteredDocuments = computed<Document[]>(() => {
  const keyword = appliedKeyword.value.toLowerCase();

  const baseList = showReviewingOnly.value
    ? documents.value.filter((item) => item.infoBrief.status === "审核中")
    : documents.value;

  if (!keyword) {
    return baseList;
  }

  return baseList.filter((item) => {
    const name = item.infoBrief.name?.toLowerCase() ?? "";
    const author = item.author?.toLowerCase() ?? "";
    return name.includes(keyword) || author.includes(keyword);
  });
});

const displayedDocuments = computed<Document[]>(() =>
  filteredDocuments.value.slice(0, 10)
);

const handleSearch = () => {
  appliedKeyword.value = searchInput.value.trim();
};

const handleClear = () => {
  searchInput.value = '';
  appliedKeyword.value = '';
}


const editForm = reactive<DocumentEditForm>({
  documentId: null,
  type: "",
  category: "",
  name: "",
  isbn: "",
  tags: "",
  author: "",
  createYear: "",
  coverUrl: "",
  coverFile: null,
  introduction: "",
  file: null,
  vedioURL: "",
});

const normalizeDocument = (doc: Document): Document => {
  const fallbackStatus: DocumentStatus = "审核中";
  const normalizedStatus: DocumentStatus =
    STATUS_OPTIONS.find((option) => option.value === doc.infoBrief.status)
      ?.value ?? fallbackStatus;

  return {
    ...doc,
    infoBrief: {
      ...doc.infoBrief,
      status: normalizedStatus,
      uploadTime: doc.infoBrief.uploadTime || "",
      name: doc.infoBrief.name || "",
      category: doc.infoBrief.category || "",
    },
    cover: doc.cover || "",
    introduction: doc.introduction || "",
    bookISBN: doc.bookISBN || "",
    tags: Array.isArray(doc.tags) ? doc.tags : [],
  };
};

const fetchDocuments = async () => {
  loading.value = true;
  try {
    if (USE_MOCK) {
      await delay(300);
      documents.value = MOCK_DOCUMENTS.map((item) => normalizeDocument(item));
      ElMessage.info(TEXT.mockUsingDemo);
      return;
    }

    const res = await service.get<ApiResponse<Document[]>>("/documents", {
      params: {
        isSuggest: false,
      },
    });

    const list = Array.isArray(res.data) ? res.data : [];
    if (list.length === 0) {
      documents.value = [];
      ElMessage.info(TEXT.mockFallback);
      return;
    }

    documents.value = list.map(normalizeDocument);
  } catch (error) {
    documents.value = [];
    ElMessage.error((error as Error)?.message || TEXT.mockFallback);
  } finally {
    loading.value = false;
  }
};

const handleGoDetail = (row: Document) => {
  if (!row.infoBrief?.documentId) {
    ElMessage.warning(TEXT.previewUnavailable);
    return;
  }

  router.push({
    name: "BookInfo",
    query: {
      id: String(row.infoBrief.documentId),
    },
  });
};

const toggleReviewingFilter = () => {
  showReviewingOnly.value = !showReviewingOnly.value;
};

const handleStatusChange = async (row: Document, nextStatus: string) => {
  if (!row.infoBrief?.documentId) {
    ElMessage.error(TEXT.editMissingId);
    return;
  }

  const previous = row.infoBrief.status;
  row.infoBrief.status = nextStatus as typeof row.infoBrief.status;

  try {
    if (USE_MOCK) {
      await delay(200);
      const mockIndex = MOCK_DOCUMENTS.findIndex(
        (item) => item.infoBrief.documentId === row.infoBrief.documentId
      );
      if (mockIndex !== -1) {
        MOCK_DOCUMENTS[mockIndex].infoBrief.status =
          nextStatus as (typeof MOCK_DOCUMENTS)[number]["infoBrief"]["status"];
      }
    } else {
      await service.put("/admin/document/status", {
        documentId: row.infoBrief.documentId,
        status: nextStatus,
      });
    }
    ElMessage.success(TEXT.statusUpdated);
  } catch (error) {
    row.infoBrief.status = previous;
    ElMessage.error((error as Error)?.message || TEXT.statusUpdateFailed);
  }
};

const releaseBlob = (url: string) => {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

const openEditDialog = (row: Document) => {
  editVisible.value = true;

  editForm.documentId = row.infoBrief.documentId ?? null;
  editForm.category = row.infoBrief.category || "";
  editForm.type = row.infoBrief.type || "";
  editForm.name = row.infoBrief.name || "";
  editForm.isbn = row.bookISBN || "";
  editForm.tags = Array.isArray(row.tags) ? row.tags.join(", ") : "";
  editForm.author = row.author || "";
  editForm.createYear = row.createYear || "";
  editForm.coverUrl = row.cover || "";
  editForm.coverFile = null;
  editForm.introduction = row.introduction || "";
  editForm.file = null;
  editForm.vedioURL = row.infoBrief.URL || "";

  if (coverInput.value) {
    coverInput.value.value = "";
  }
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const resetEditForm = () => {
  releaseBlob(editForm.coverUrl);

  editForm.documentId = null;
  editForm.category = "";
  editForm.type = "";
  editForm.name = "";
  editForm.isbn = "";
  editForm.tags = "";
  editForm.author = "";
  editForm.createYear = "";
  editForm.coverUrl = "";
  editForm.coverFile = null;
  editForm.introduction = "";
  editForm.file = null;
  editForm.vedioURL = "";

  if (coverInput.value) {
    coverInput.value.value = "";
  }
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const handleCoverFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files && input.files[0] ? input.files[0] : null;

  if (file) {
    releaseBlob(editForm.coverUrl);
    editForm.coverFile = file;
    editForm.coverUrl = URL.createObjectURL(file);
  } else {
    editForm.coverFile = null;
  }
};

const handleDocumentFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files && input.files[0] ? input.files[0] : null;
  editForm.file = file;
};

const buildSubmitFormData = () => {
  const formData = new FormData();

  formData.append("documentId", String(editForm.documentId));
  formData.append("type", editForm.type.trim());
  formData.append("category", editForm.category.trim());
  formData.append("name", editForm.name.trim());
  formData.append("isbn", editForm.isbn.trim());
  formData.append("tags", editForm.tags.trim());
  formData.append("author", editForm.author.trim());
  formData.append("createYear", editForm.createYear.trim());
  formData.append("introduction", editForm.introduction.trim());
  formData.append("vedioURL", editForm.vedioURL.trim());

  if (editForm.coverFile) {
    formData.append("cover", editForm.coverFile);
  } else if (editForm.coverUrl && !editForm.coverUrl.startsWith("blob:")) {
    formData.append("cover", editForm.coverUrl.trim());
  }

  if (editForm.file) {
    formData.append("file", editForm.file);
  }

  return formData;
};

const handleSaveEdit = async () => {
  if (editForm.documentId === null) {
    ElMessage.error(TEXT.editMissingId);
    return;
  }

  const current = USE_MOCK
    ? documents.value.find(
        (item) => item.infoBrief.documentId === editForm.documentId
      ) ?? null
    : null;

  if (USE_MOCK && current === null) {
    ElMessage.error(TEXT.editMissingId);
    return;
  }

  saving.value = true;
  try {
    if (USE_MOCK && current) {
      await delay(400);
      const tags = editForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      current.infoBrief.type =
        editForm.type.trim() as typeof current.infoBrief.type;
      current.infoBrief.category = editForm.category.trim();
      current.infoBrief.name = editForm.name.trim();
      current.bookISBN = editForm.isbn.trim();
      current.author = editForm.author.trim();
      current.createYear = editForm.createYear.trim();
      current.cover = editForm.coverUrl.trim();
      current.introduction = editForm.introduction.trim();
      current.infoBrief.URL = editForm.vedioURL.trim();
      current.tags = tags;

      const mockTarget = MOCK_DOCUMENTS.find(
        (item) => item.infoBrief.documentId === current.infoBrief.documentId
      );
      if (mockTarget) {
        mockTarget.infoBrief.type = current.infoBrief.type;
        mockTarget.infoBrief.category = current.infoBrief.category;
        mockTarget.infoBrief.name = current.infoBrief.name;
        mockTarget.bookISBN = current.bookISBN;
        mockTarget.author = current.author;
        mockTarget.createYear = current.createYear;
        mockTarget.cover = current.cover;
        mockTarget.introduction = current.introduction;
        mockTarget.infoBrief.URL = current.infoBrief.URL;
        mockTarget.tags = [...current.tags];
      }
    } else {
      const formData = buildSubmitFormData();
      await service.put("/document", formData);
      await fetchDocuments();
    }

    ElMessage.success(TEXT.editSuccess);
    editVisible.value = false;
  } catch (error) {
    ElMessage.error((error as Error)?.message || TEXT.editFailed);
  } finally {
    saving.value = false;
  }
};

onMounted(fetchDocuments);
</script>

<style scoped lang="css">
.document-list {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  scrollbar-width: none;
}

:deep(.el-card.document-card) {
  border: none;
  box-shadow: none;
  /* --el-card-border-color: transparent;
  --el-card-shadow: none; */
}

.document-card {
  border-radius: 10px;
  background: #fff;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
  scrollbar-width: none;
}

.document-card :deep(.el-card__body) {
  box-shadow: none;
  border: none;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.document-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}


.document-card__search-input {
 width: 50%;
}

.document-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.document-card__filter-btn {
  border: 1px solid rgba(185, 148, 254, 0.45);
  background: #fff;
  color: #5c3ca8;
  transition: all 0.3s ease;
}

.document-card__filter-btn:hover,
.document-card__filter-btn--active {
  background: rgba(185, 148, 254, 0.18);
}

.document-card__refresh-btn {
  border: none;
  background: linear-gradient(135deg, #b994fe 0%, #8e47bd 100%);
  color: #fff;
  transition: all 0.3s ease;
}

.document-card__refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(185, 148, 254, 0.35);
}

.document-card__table {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.document-card__table :deep(.el-table) {
  flex: 1;
  background-color: #fff;
  border-radius: 0;
}

.document-card__table :deep(.el-table__body-wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}



:deep(.el-table tr:hover > td) {
  background-color: rgba(185, 148, 254, 0.18);
}

.document-table__cover {
  width: 72px;
  height: 96px;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(185, 148, 254, 0.15) 0%, rgba(185, 148, 254, 0.3) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-table__cover--fallback {
  width: 72px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #4f377e;
  background: rgba(185, 148, 254, 0.15);
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
