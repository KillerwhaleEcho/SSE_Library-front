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
            <el-button typr="primary" @click="handleSearch">搜索</el-button>
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
            {{ showReviewingOnly ? "查看全部资料" : "查看审核中资料" }}
          </el-button>
          <el-button
            class="document-card__refresh-btn"
            type="primary"
            size="medium"
            :loading="loading"
            @click="fetchDocuments"
          >
            刷新
          </el-button>
        </div>
      </div>

      <div class="document-card__table">
        <el-table
          :data="filteredDocuments"
          border
          v-loading="loading"
          element-loading-text="正在加载资料，请稍候…"
          empty-text="暂无资料"
        >
          <el-table-column label="封面" width="150" align="center">
            <template #default="{ row }">
              <div class="cover">
                <img
                  v-if="row.infoBrief?.cover"
                  :src="row.infoBrief.cover"
                  alt="封面"
                  class="cover-img"
                />
                <div v-else class="cover-placeholder">无封面</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="资料名称" min-width="180" align="center">
            <template #default="{ row }">
              <el-link
                type="primary"
                :underline="false"
                @click.prevent="handleGoDetail(row)"
              >
                {{ row.infoBrief?.name || "未命名资料" }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="作者" min-width="120" align="center">
            <template #default="{ row }">
              {{ row.author || "未知作者" }}
            </template>
          </el-table-column>
          <el-table-column label="上传时间" width="150" align="center">
            <template #default="{ row }">
              {{ row.infoBrief?.uploadTime || "未命名资料" }}
            </template>
          </el-table-column>

          <el-table-column label="资料状态" width="160" align="center">
            <template #default="{ row }">
              <el-select
                v-model="row.infoBrief.status"
                size="small"
                @change="(value: any) => handleStatusChange(row, value)"
              >
                <el-option
                  v-for="option in STATUS_OPTIONS"
                  :key="option.label"
                  :label="option.value"
                  :value="option.label"
                />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                @click="openEditDialog(row)"
              >
                修改资料
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <!-- 修改资料的弹窗 -->
    <el-dialog
      v-model="editVisible"
      title="编辑资料信息"
      width="560px"
      :modal="false"
      destroy-on-close
      @close="resetEditForm"
      z-index="1000"
    >
      <el-form label-width="108px" model="editForm" class="document-edit-form">
        <el-form-item label="资料分类" required="true">
          <el-input
            @click="handlechoose"
            :placeholder="selectedCategoryName"
          ></el-input>
        </el-form-item>
        <el-form-item label="资料类型" required="true">
          <el-select v-model="editForm.type">
            <el-option aria-label="书籍" value="book"></el-option>
            <el-option aria-label="文件" value="file"></el-option>
            <el-option aria-label="视频" value="video"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="资料名称" required="true">
          <el-input v-model="editForm.name" clearable />
        </el-form-item>
        <el-form-item label="ISBN">
          <el-input
            v-model="editForm.isbn"
            clearable
            placeholder="仅书籍需要填写"
          />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="editForm.author" clearable />
        </el-form-item>
        <el-form-item label="标签">
          <div class="dialog-tags">
            <div class="addtags">
              <el-input
                v-model="temp_tags"
                placeholder="输入标签后按回车或点击添加"
                clearable
                @keyup.enter.prevent="handleAddTag"
              />
              <el-button type="primary" @click="handleAddTag"
                >添加标签</el-button
              >
            </div>
            <div
              class="tag-list"
              v-if="editForm.tags && editForm.tags.length > 0"
            >
              <el-tag
                v-for="(tag, index) in editForm.tags"
                :key="`${tag}-${index}`"
                closable
                class="tag-item"
                @close="handleRemoveTag(index)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="出版年份">
          <el-date-picker
            v-model="editForm.createYear"
            type="year"
            value-format="YYYY"
            placeholder="请选择年份"
            clearable
          />
        </el-form-item>
        <el-form-item v-if="editForm.type === 'video'" label="视频链接">
          <el-input v-model="editForm.videoURL" clearable />
        </el-form-item>
        <el-form-item label="封面">
          <div class="cover-preview">
            <img
              v-if="coverPreview"
              :src="coverPreview"
              alt="封面预览"
              class="cover-img"
            />
            <span v-else class="cover-placeholder">暂无封面</span>
          </div>
          <el-upload
            class="document-edit-form__upload"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="handleCoverChange"
          >
            <el-button type="primary">选择封面</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item v-if="editForm.type != 'video'" label="资料文件">
          <el-upload
            class="document-edit-form__upload"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleDocumentChange"
          >
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="简介">
          <el-input
            v-model="editForm.introduction"
            type="textarea"
            :rows="4"
            placeholder="请输入资料简介，最多 500 字"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSaveEdit">
            保存修改
          </el-button>
        </span>
      </template>
    </el-dialog>

    <CategoryDialog
      :visible="categoryVisible"
      @update:visible="categoryVisible = $event"
      :all-categories="categories"
      :selected-category-name="selectedCategoryName"
      :selected-category-id="selectedCategoryId"
      @category-selected="onCategorySelected"
      @reset-category="resetCategory"
      @category-added="handleCategoryAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, type UploadFile } from "element-plus";
import {
  getBookList,
  updateFileInfo,
  updateFileStatus,
  getCategoriesAndCourses,
  type Category,
} from "../../api/all";
import { type DocumentEditForm } from "../../types/api";
import { type Document } from "@/api/all.ts";
import { MOCK_DOCUMENTS } from "./mockData";
import CategoryDialog from "../CategoryDialog.vue";

const router = useRouter();
const searchInput = ref("");
const appliedKeyword = ref("");

const USE_MOCK = false;
const documents = ref<Document[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(false);
const editVisible = ref(false);
const categoryVisible = ref(false);
const saving = ref(false);
const coverPreview = ref("");
const showReviewingOnly = ref(false); //控制是否只展示待审核数据

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const STATUS_OPTIONS = [
  { label: "open", value: "开放" },
  { label: "pending", value: "审核中" },
  { label: "closed", value: "关闭" },
  { label: "withdrawn", value: "已撤回" },
] as const;

// 这段代码最终的结果是："开放" | "审核中" | "关闭" | "已撤回"
type DocumentStatusEH = (typeof STATUS_OPTIONS)[number]["label"];

//先过滤得到基本数据，再执行搜索逻辑.如果不是搜索结果就只返回25个数据
const filteredDocuments = computed<Document[]>(() => {
  const keyword = appliedKeyword.value.toLowerCase();

  const baseList = showReviewingOnly.value
    ? documents.value.filter((item) => item.infoBrief.status === "pending")
    : documents.value;

  if (!keyword) {
    return baseList.slice(0, 25);
  }

  return baseList.filter((item) => {
    const name = item.infoBrief.name?.toLowerCase() ?? "";
    const author = item.author?.toLowerCase() ?? "";
    return name.includes(keyword) || author.includes(keyword);
  });
});

const handleSearch = () => {
  appliedKeyword.value = searchInput.value.trim();
};

const handleClear = () => {
  searchInput.value = "";
  appliedKeyword.value = "";
};

const selectedCategoryName = ref("");
const selectedCategoryId = ref<number | null>(null);
const temp_tags = ref("");
const editForm = reactive<DocumentEditForm>({
  documentId: null,
  type: "",
  categoryId: null,
  name: "",
  isbn: "",
  tags: [],
  author: "",
  createYear: "",
  cover: "",
  //后端传过来的实际上是个url，但是你传给后端的得是个file
  introduction: "",
  file: "",
  //后端传过来的数据，所以是个url，但是你传获取得是文件
  videoURL: "",
});

const handleAddTag = () => {
  const value = temp_tags.value.trim();
  if (!value) return;
  const current = normalizeTags(editForm.tags);
  if (current.includes(value)) {
    temp_tags.value = "";
    ElMessage("文档已经存在此标签");
    return;
  }
  editForm.tags = current.concat(value);
  temp_tags.value = "";
};

const handleRemoveTag = (index: number) => {
  const current = normalizeTags(editForm.tags);
  current.splice(index, 1); //还有个slice函数
  editForm.tags = current;
};

const normalizeTags = (val: unknown): string[] => {
  if (Array.isArray(val))
    return val.filter((t) => typeof t === "string" && t.trim());
  if (typeof val === "string") {
    try {
      // 如果这个字符串按照规则能解析成数组那就正常解析，如果不能直接走catch返回[]
      const parsed = JSON.parse(val);
      return Array.isArray(parsed)
        ? parsed.filter((t) => typeof t === "string" && t.trim())
        : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeDocument = (doc: Document): Document => {
  const normalizedStatus: DocumentStatusEH =
    STATUS_OPTIONS.find((option) => option.label === doc.infoBrief.status)
      ?.label ?? "pending";
  const normalizedCover = doc.infoBrief?.cover ?? "";
  const normalizedURL = doc.URL ?? "";
  const normalizedTags = normalizeTags(doc.tags);
  return {
    ...doc,
    URL: normalizedURL,
    infoBrief: {
      ...doc.infoBrief,
      status: normalizedStatus,
      uploadTime: doc.infoBrief.uploadTime || "",
      name: doc.infoBrief.name || "",
      category: doc.infoBrief.category || "",
      cover: normalizedCover,
    },
    introduction: doc.introduction || "",
    bookISBN: doc.bookISBN || "",
    tags: normalizedTags,
  };
};

const fetchDocuments = async () => {
  loading.value = true;
  if (USE_MOCK) {
    await delay(300);
    documents.value = MOCK_DOCUMENTS.map((item) => normalizeDocument(item));
    ElMessage.info("当前展示为模拟数据");
    loading.value = false;
    return;
  }

  try {
    const res = await getBookList(false);

    const list = Array.isArray(res.data) ? res.data : [];
    if (list.length === 0) {
      documents.value = [];
      ElMessage.info("未获取到资料数据，列表为空");
      return;
    }
    documents.value = list.map(normalizeDocument);
  } catch (error) {
    documents.value = [];
    ElMessage.error((error as Error)?.message || "未获取到资料数据，列表为空");
  } finally {
    loading.value = false;
  }
};

const handleGoDetail = (row: Document) => {
  if (!row.infoBrief?.documentId) {
    ElMessage.warning("暂无可展示的详情");
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
  const previous = row.infoBrief.status;
  row.infoBrief.status = nextStatus as typeof row.infoBrief.status;

  try {
    if (USE_MOCK) {
      await delay(200);
      const mockIndex = MOCK_DOCUMENTS.findIndex(
        (item) => item.infoBrief.documentId === row.infoBrief.documentId
      ); // find 和 findIndex 的本质区别:一个返回元素本身一个返回下标
      if (mockIndex !== -1) {
        MOCK_DOCUMENTS[mockIndex]!.infoBrief.status =
          nextStatus as (typeof MOCK_DOCUMENTS)[number]["infoBrief"]["status"]; //这里的number代表索引的类型，后面都是在选取属性
      }
    } else {
      await updateFileStatus(row.infoBrief.documentId, nextStatus);
    }
    ElMessage.success("状态更新成功");
  } catch (error) {
    row.infoBrief.status = previous;
    ElMessage.error((error as Error)?.message || "状态更新失败，请重试");
  }
};

const releaseBlob = (value: string | File | null) => {
  if (typeof value === "string" && value.startsWith("blob:")) {
    URL.revokeObjectURL(value);
  }
};

const openEditDialog = async (row: Document) => {
  editVisible.value = true;

  selectedCategoryName.value = row.infoBrief?.category || "";
  editForm.documentId = row.infoBrief.documentId || null;
  editForm.categoryId = null;
  editForm.type = row.infoBrief.type || "";
  editForm.name = row.infoBrief.name || "";
  editForm.isbn = row.bookISBN || "";
  editForm.tags = normalizeTags(row.tags);
  editForm.author = row.author || "";
  editForm.createYear = row.createYear || "";
  editForm.cover = row.infoBrief.cover || "";
  editForm.introduction = row.introduction || "";
  editForm.file = (row.infoBrief.type === "file" ? row.URL : "") || "";
  editForm.videoURL = (row.infoBrief.type === "video" ? row.URL : "") || "";

console.log('open')
  console.log('row.tags', row.tags, typeof row.tags)
  try {
    const res = await getCategoriesAndCourses();
    categories.value = res.data;
    //如果有多个相同name，有可能无法找到正确值
    const matchedCategory = categories.value.find(
      (item) => item.name === row.infoBrief.category
    );
    if (matchedCategory) {
      editForm.categoryId = matchedCategory.id;
    }
  } catch {
    ElMessage.error("获取分类失败");
  }
};

const resetEditForm = () => {
  releaseBlob(coverPreview.value);

  temp_tags.value = "";
  editForm.documentId = null;
  editForm.categoryId = null;
  editForm.type = "";
  editForm.name = "";
  editForm.isbn = "";
  editForm.tags = [];
  editForm.author = "";
  editForm.createYear = "";
  editForm.cover = "";
  editForm.introduction = "";
  editForm.file = "";
  editForm.videoURL = "";
  coverPreview.value = "";
};

const handleCoverChange = (file: UploadFile) => {
  const raw = file.raw;
  if (raw) {
    editForm.cover = raw;
  }
  ElMessage.success("选择封面成功");
};

const handleDocumentChange = (file: UploadFile) => {
  const raw = file.raw;
  if (raw) {
    editForm.file = raw;
  }
  ElMessage.success("选择文件成功");
};

const buildDocumentEditFormData = (data: DocumentEditForm) => {
  const formData = new FormData();
  formData.append("documentId", String(data.documentId));
  formData.append("type", data.type);
  if (data.categoryId) {
    formData.append("categoryId", String(data.categoryId));
  }
  formData.append("name", data.name);
  formData.append("ISBN", data.isbn);
  // tags 为字符串数组，FormData 需序列化
  const tags = normalizeTags(data.tags);
  formData.append("tags", JSON.stringify(tags));
  formData.append("author", data.author);
  formData.append("createYear", data.createYear);
  formData.append("introduction", data.introduction);

console.log('build')
  console.log('row.tags', data.tags, typeof data.tags)

  if (data.cover instanceof File) {
    formData.append("cover", data.cover);
  }

  if (
    (data.type === "file" || data.type === "book") &&
    data.file instanceof File
  ) {
    formData.append("file", data.file);
  }

  if (data.type === "video") {
    formData.append("vedioURL", data.videoURL);
  }

  return formData;
};

const handlechoose = async () => {
  if (categoryVisible.value) return;
  categoryVisible.value = true;
};

const handleSaveEdit = async () => {
  if (saving.value) return;

  if (editForm.type === "video" && !editForm.videoURL.trim()) {
    ElMessage.warning("当前文档类型为视频，视频链接不能为空");
    return;
  }

  saving.value = true;

  try {
    await updateFileInfo(buildDocumentEditFormData(editForm));
    await fetchDocuments();

    ElMessage.success("资料信息已更新");
    editVisible.value = false;
  } catch (error) {
    ElMessage.error((error as Error)?.message || "保存失败，请稍后重试");
  } finally {
    saving.value = false;
  }
};

const onCategorySelected = (val: Category) => {
  selectedCategoryId.value = val.id;
  selectedCategoryName.value = val.name;
  editForm.categoryId = val.id;
  categoryVisible.value = false;
};

const resetCategory = () => {
  selectedCategoryId.value = null;
  selectedCategoryName.value = "";
};

const handleCategoryAdded = async () => {
  try {
    const res = await getCategoriesAndCourses();
    categories.value = res.data ?? [];
  } catch {
    ElMessage.error("刷新分类失败");
  }
};

onMounted(fetchDocuments);

watch(
  () => editForm.cover,
  (value) => {
    releaseBlob(coverPreview.value);
    if (value instanceof File) {
      coverPreview.value = URL.createObjectURL(value);
      return;
    }
    //url经过处理已经变成string了
    coverPreview.value = typeof value === "string" ? value : ""; //typeof的结果是字符串
  },
  { immediate: true }
);
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

/* .document-card__refresh-btn {
  border: none;
  background: linear-gradient(135deg, #b994fe 0%, #8e47bd 100%);
  color: #fff;
  transition: all 0.3s ease;
}

.document-card__refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(185, 148, 254, 0.35);
} */

.document-card__table {
  flex: 1;
  min-height: 0;
  display: flex;
}

.document-card__table :deep(.el-table) {
  flex: 1;
  --el-table-border-color: rgba(185, 148, 254, 0.2);
  background-color: #fff;
  border-radius: 0;
}

.document-card__table :deep(.el-table__body-wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

:deep(.el-table th) {
  background-color: rgba(185, 148, 254, 0.18);
  color: #3f2458;
  font-weight: 600;
}

/* :deep(.el-table tr:hover > td) {
  background-color: rgba(185, 148, 254, 0.18);
} */

/* 外层容器：把这一格变成一个居中的小方块 */
.cover {
  display: flex;
  /* 用 flex 居中内部内容 */
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  /* 没图时有个淡背景 */
}

.cover-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  /* 按比例裁剪 */
  object-position: center;
}

/* 没有图片时的占位 */
.cover-placeholder {
  font-size: 14px;
  color: #9ca3af;
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

.dialog-tags {
  display: flex;
  flex-direction: column;
}

.addtags {
  display: flex;
  gap: 10px;
}

.tag-list {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  border-radius: 12px;
  background: #f3f4f6;
  color: #4b5563;
  padding: 2px 10px;
}

.cover-preview {
  margin: 0px 20px 10px 10px;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  font-size: 12px;
  color: #9ca3af;
}
</style>
