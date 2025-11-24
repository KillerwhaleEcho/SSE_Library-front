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
          <!-- 表单内容 -->
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
              prop="type"
              :rules="[{ required: true, message: '请选择类型', trigger: 'change' }]"
            >
              <el-radio-group v-model="categoryFormData.type" @change="handleTypeChange">
                <el-radio label="category">添加分类</el-radio>
                <el-radio label="course">添加课程</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 2. 动态内容（根据类型显示） -->
            <!-- 2.1 分类名称（选择"分类"时显示） -->
            <el-form-item 
              label="名称" 
              prop="name"
              :rules="[{ required: true, message: '请输入名称', trigger: 'blur' }]"
            >
              <el-input 
                v-model="categoryFormData.name" 
                placeholder="请输入名称"
                maxlength="50"
              />
            </el-form-item>

            <!-- 2.2 所属分类（选择"课程"时显示） -->
            <el-form-item 
              v-if="categoryFormData.type === 'course'"
              label="所属分类" 
              prop="parentId"
              :rules="[{ required: true, message: '请选择所属分类', trigger: 'change' }]"
            >
              <el-select 
                v-model="categoryFormData.parentId" 
                placeholder="请选择分类"
                clearable
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
            <el-form-item 
              label="描述" 
              prop="description"
            >
              <el-input 
                v-model="categoryFormData.description" 
                placeholder="请输入描述信息（可选）"
                type="textarea"
                rows="3"
                maxlength="200"
              />
            </el-form-item>

            <!-- 操作按钮 -->
            <el-form-item style="margin-bottom: 0;">
              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <el-button 
                  size="small" 
                  @click="resetCategoryForm"
                >
                  取消
                </el-button>
                <el-button 
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
        v-for="category in allCategories" 
        :key="category.id"
        @category-selected="onCategorySelected"
        :category="category"
      />
    </div>
    <template #footer>
      <el-button type="primary" @click="handleResetCategory">
        重置分类
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { ref, reactive } from 'vue'
import ParentCategoryItem from '@/components/parentCategoryItem.vue'
import type { ElMessage } from 'element-plus'

// Props - 修复类型定义
interface Props {
  visible: boolean
  allCategories: any[]
  selectedCategoryName?: string | null  // 修改为 string | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'category-selected': [category: any]
  'reset-category': []
}>()

// 数据
const searchCatKeyword = ref('')
const popoverVisible = ref(false)
const categoryFormRef = ref()

// 表单数据
const categoryFormData = reactive({
  type: '',
  name: '',
  parentId: null,
  description: ''
})

// 方法
const handleCatSearch = () => {
  // 搜索分类逻辑
}

const handleTypeChange = () => {
  categoryFormData.name = ''
  if (categoryFormData.type === 'category') {
    categoryFormData.parentId = null
  }
}

const resetCategoryForm = () => {
  categoryFormRef.value?.resetFields()
  popoverVisible.value = false
}

const submitCategoryForm = () => {
  categoryFormRef.value.validate((valid: boolean) => {
    if (valid) {
      const submitData = {
        type: categoryFormData.type,
        name: categoryFormData.name,
        description: categoryFormData.description,
        ...(categoryFormData.type === 'course' && { parentId: categoryFormData.parentId })
      }

      console.log('提交数据：', submitData)
      ElMessage.success(`${categoryFormData.type === 'category' ? '分类' : '课程'}添加成功`)
      resetCategoryForm()
    }
  })
}

const onCategorySelected = (category: any) => {
  emit('category-selected', category)
  emit('update:visible', false)
}

const handleResetCategory = () => {
  emit('reset-category')
  emit('update:visible', false)
}
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