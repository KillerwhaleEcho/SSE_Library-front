<!-- CategoryDialog.vue -->
<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="选择分类"
    :modal="false"
    append-to-body
    :z-index="2000"
  >
    <div class="search-cat">
      <el-input
        v-model="searchCatKeyword"
        placeholder="搜索分类"
        class="search-input"
        append-to-body
        @keyup.enter="handleCatSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div>
        <el-popover
          class="box-item"
          placement="right-start"
          width="350"
          trigger="click"
          v-model:visible="popoverVisible"
        >
          <!-- 添加分类表单内容 -->
          <el-form
            ref="categoryFormRef"
            :model="categoryFormData"
            label-width="50px"
            size="small"
            class="add-form"
          >
            <!-- 1. 类型选择（分类/课程） -->
            <el-form-item
              label="类型"
              prop="isCourse"
              :rules="[
                { required: true, message: '请选择类型', trigger: 'change' },
              ]"
            >
              <el-radio-group
                v-model="categoryFormData.isCourse"
                @change="handleTypeChange"
              >
                <el-radio :label="false">添加分类</el-radio>
                <el-radio :label="true">添加课程</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 2. 动态内容（根据类型显示） -->
            <!-- 2.1 分类名称（选择"分类"时显示） -->
            <el-form-item
              label="名称"
              prop="name"
              :rules="[
                { required: true, message: '请输入名称', trigger: 'blur' },
              ]"
            >
              <el-input
                v-model="categoryFormData.name"
                placeholder="请输入名称"
                maxlength="50"
              />
            </el-form-item>

            <!-- 2.2 所属分类（选择"课程"时显示） -->
            <el-form-item
              v-if="categoryFormData.isCourse === true"
              label="所属分类"
              prop="parentCatId"
              :rules="[
                {
                  required: true,
                  message: '请选择所属分类',
                  trigger: 'change',
                },
              ]"
            >
              <el-select
                v-model="categoryFormData.parentCatId"
                placeholder="请选择分类"
                clearable
                :teleported="false"
                :popper-append-to-body="false"
              >
                <el-option
                  v-for="category in allCategories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>

            <!-- 3. 描述信息（通用项） -->
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="categoryFormData.description"
                placeholder="请输入描述信息（可选）"
                type="textarea"
                rows="3"
                maxlength="200"
              />
            </el-form-item>

            <!-- 操作按钮 -->
            <el-form-item style="margin-bottom: 0">
              <div style="display: flex; justify-content: flex-end; gap: 10px">
                <el-button
                  class="cancel-button"
                  size="small"
                  @click="resetCategoryForm"
                >
                  取消
                </el-button>
                <el-button
                  class="reset-button"
                  size="small"
                  type="primary"
                  @click="submitCategoryForm"
                >
                  确认添加
                </el-button>
              </div>
            </el-form-item>
          </el-form>

          <!-- 触发按钮 -->
          <template #reference>
            <el-button>添加分类或课程</el-button>
          </template>
        </el-popover>
      </div>
    </div>

    <div class="category-guide">
      <div class="parent-word">分类</div>
      <div class="child-word">课程</div>
    </div>
    <div class="category-dialog">
      <ParentCategoryItem
        v-for="category in categories"
        :key="category.id"
        @category-selected="onCategorySelected"
        :category="category"
      />
    </div>
    <template #footer>
      <el-button
        type="primary"
        class="reset-button"
        @click="handleResetCategory"
      >
        重置分类
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { ref, reactive, watch } from "vue";
import ParentCategoryItem from "@/components/parentCategoryItem.vue";
import { ElMessage } from "element-plus";
import * as allApi from "@/api/all.ts";

// Props - 修复类型定义
interface Props {
  visible: boolean;
  allCategories: any[];
  selectedCategoryName?: string | null; // 修改为 string | null
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  "category-selected": [category: any];
  "reset-category": [];
  "category-added": [];
}>();

// 数据
const categories = ref<allApi.Category[]>(props.allCategories);
const searchCatKeyword = ref("");
const popoverVisible = ref(false);
const categoryFormRef = ref();

// 表单数据
const categoryFormData = reactive({
  isCourse: false,
  name: "",
  parentCatId: undefined as number | undefined,
  description: undefined as string | undefined,
});

// 方法
const handleCatSearch = async () => {
  try {
    const response = await allApi.searchCategoriesAndCourses(
      searchCatKeyword.value
    );
    console.log("搜索分类响应:", response);
    // 假设接口返回的数据结构中，data包含categories数组
    if (response.data) {
      categories.value = response.data;
    } else {
      categories.value = [];
      console.warn("获取搜索分类数据格式不正确");
    }

    return categories.value;
  } catch (error) {
    searchCatKeyword.value = "";
    console.error("搜索分类失败:", error);
    throw error; // 允许调用方捕获错误
  }
};

const handleTypeChange = () => {
  categoryFormData.name = "";
  if (!categoryFormData.isCourse) {
    categoryFormData.parentCatId = 0;
  }
};

const resetCategoryForm = () => {
  categoryFormRef.value?.resetFields();
  popoverVisible.value = false;
};

const submitCategoryForm = async () => {
  try {
    const isValid = await categoryFormRef.value.validate();

    if (!isValid) {
      console.warn("表单验证失败");
      return;
    }

    const submitData = {
      isCourse: categoryFormData.isCourse,
      name: categoryFormData.name,
      description: categoryFormData.description,
      ...(categoryFormData.isCourse && {
        parentCatId: categoryFormData.parentCatId,
      }),
    };

    if (ElMessage?.closeAll) {
      ElMessage.closeAll();
    }

    const res = await allApi.addCategoryOrCourse(submitData);
    console.log("提交结果：", res);

    if (res) {
      const successMessage = !categoryFormData.isCourse
        ? "分类添加成功"
        : "课程添加成功";

      ElMessage.success(`${successMessage}！`);

      resetCategoryForm();
      // ✅ 新增：关闭popover
      popoverVisible.value = false;

      // ✅ 新增：通知父组件刷新分类数据
      emit("category-added");
    } else {
      ElMessage.error("提交失败，请稍后重试");
    }
  } catch (error) {
    console.error("提交过程出错:", error);
    if (ElMessage?.closeAll) {
      ElMessage.closeAll();
    }
    ElMessage.error("提交失败，请检查网络或稍后重试");
  }
};

const onCategorySelected = (category: any) => {
  emit("category-selected", category);
  emit("update:visible", false);
};

const handleResetCategory = () => {
  emit("reset-category");
  emit("update:visible", false);
};

// 初始化或重置数据的方法
const initializeData = () => {
  // 重置分类数据（深拷贝以避免引用问题）
  categories.value = JSON.parse(JSON.stringify(props.allCategories));

  // 重置搜索关键词
  searchCatKeyword.value = "";

  // 如果需要，还可以重置其他状态
};

// 监听 visible 变化，当弹窗显示时重置数据
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // 弹窗显示时重置数据
      initializeData();
    }
  },
  { immediate: true } // 立即执行一次，确保初始化
);
</script>

<style scoped>
.search-cat {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.search-cat .el-button {
  background-color: #b994fe;
  color: white;
  border: none;
}
.search-cat .el-button:hover {
  background-color: rgb(167, 129, 236);
}

.reset-button {
  background-color: #b994fe;
  color: white;
  border: none;
}

.reset-button:hover {
  background-color: rgb(167, 129, 236);
}

.cancel-button {
  color: #b994fe;
  border-color: #b994fe;
  border-width: 1.5px;
}

.category-guide {
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
}

.parent-word {
  width: 125px;
  font-size: 16px;
  color: #888;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 2px solid transparent;
  border-bottom-color: #b994fe;
  color: #b994fe;
  font-weight: 500;
  margin-right: 16px;
}

.child-word {
  width: 80%;
  font-size: 16px;
  color: #888;
  display: flex;
  align-items: center;
  padding-left: 30px;
  border-bottom: 2px solid transparent;
  border-bottom-color: #b994fe;
  color: #b994fe;
  font-weight: 500;
}

.category-dialog {
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
}

.category-dialog::-webkit-scrollbar {
  display: none;
}

.add-form {
  padding: 10px 0;
}

.el-radio-group {
  display: flex;
  gap: 15px;
}

.el-textarea__inner {
  resize: none;
}
</style>
