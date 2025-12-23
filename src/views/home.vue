<template>
  <div class="home-container">
    <topbar class="topbar" @open-upload-modal="showUploadModal = true"></topbar>

    <!-- 搜索表单 -->
    <div class="searchForm">
      <div class="search-guide">请选择资料类型、分类、年份、关键词类型以搜索资料</div>
      <el-row :gutter="20">
        <el-col :span="6"><div class="grid-content ep-bg-purple" />
          <el-select v-model="type_value" placeholder="书籍or文件" style="width: 100%" placement="top-start" class="purple-border-select">
            <el-option
              v-for="item in type_options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :span="6"><div class="grid-content ep-bg-purple" />
          <button class="category-select-btn" @click="showCategoryDialog = true">{{ selectedCategoryName || 'category' }}</button>
        </el-col>
        <el-col :span="6"><div class="grid-content ep-bg-purple" />
          <el-mention
            v-model="year_value"
            :options="year_options"
            style="width: width: 100%"
            placeholder="选择xx年以后"
            trigger=""
            ref="mentionRef"
            @focus="handleFocus"
          />
        </el-col>
        <el-col :span="6"><div class="grid-content ep-bg-purple" />
          <el-select v-model="key_type_value" placeholder="关键词类型" style="width: 100%" placement="top-start" class="purple-border-select">
            <el-option
              v-for="item in key_type_options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
      </el-row>
      <div class="input">
        <input v-model="key_value" type="text" placeholder="请输入文件名字、关键字">
        <div class="search-button" @click="handleSearch">搜索</div>
      </div>
    </div>

    <!-- 标签页容器 -->
    <div class="tabs-container" :class="{ 'active': activeTab }">
      <!-- 标签页导航 -->
      <div class="tabs-nav">
        <div 
          class="tab-nav-item" 
          :class="{ 'active': activeTab === 'recommend' }"
          @click="activeTab = 'recommend'"
        >
          推荐
        </div>
        <div 
          class="tab-nav-item" 
          :class="{ 'active': activeTab === 'fileList' }"
          @click="switchToFileList"
        >
          文件列表
        </div>
      </div>

      <!-- 标签页内容区 -->
      <div class="tabs-content">
        <!-- 推荐标签页 -->
        <div class="tab-pane" v-if="activeTab === 'recommend'">
          <div class="recommend-container">
            <!-- 热门分类列表 -->
            <div class="hot-categories">
              <h3>热门分类</h3>
              <div class="category-list">
                <!-- 循环渲染分类组件 -->
                <CategoryItem 
                  v-for="category in hotCategories" 
                  :key="category.id" 
                  :category="category"
                  @click="onCategorySelected(category)"
                />
              </div>
            </div>

            <!-- 热门书籍列表 -->
            <div class="hot-books">
              <h3>热门书籍</h3>
              <div class="book-list">
                <!-- 循环渲染图书组件 -->
                <BookItem 
                  v-for="book in hotBooks" 
                  :key="book.infoBrief.documentId" 
                  :document="book"
                  @click="onBookSelected(book)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 文件列表标签页 -->
        <div class="tab-pane" v-if="activeTab === 'fileList'">
          <div class="file-list-container">
            <div class="book-list">
              <!-- 循环渲染图书组件 -->
              <BookItem 
                v-for="book in fileList" 
                :key="book.infoBrief.documentId" 
                :document="book"
                @click="onBookSelected(book)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用分离的组件 -->
    <CategoryDialog 
      :visible="showCategoryDialog"
      @update:visible="showCategoryDialog = $event"
      :all-categories="allCategories"
      :selected-category-name="selectedCategoryName"
      :selected-category-id="selectedCategoryId"
      @category-selected="onCategorySelected"
      @reset-category="resetCategory"
      @category-added="handleCategoryAdded"
    />

    <UploadModal 
      v-model:visible="showUploadModal"
      :selected-category-name="selectedUploadCategoryName"
      :selected-category-id="selectedCategoryId"
      @open-category-dialog="showCategoryDialog = true"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import topbar from '@/layout/topbar.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted, nextTick, reactive, watch } from 'vue'
import * as allApi from '@/api/all.ts'
import CategoryItem from '@/components/categoryItem.vue'
import BookItem from '@/components/bookItem.vue'
import CategoryDialog from '@/components/CategoryDialog.vue'
import UploadModal from '@/components/UploadModal.vue'
import { ElMention } from 'element-plus'
import { ElMessage } from 'element-plus'

// 状态管理
const router = useRouter()
const activeTab = ref('recommend') // 默认显示推荐标签页
const showCategoryDialog = ref(false)
const showUploadModal = ref(false)
const selectedCategory = ref<allApi.Category | null>(null)
const selectedCategoryName = ref<string | null>(null)
const selectedCategoryId = ref<number | null>(null)
const selectedUploadCategoryName = ref<string | null>(null)
const selectedDocument = ref<allApi.Document | null>(null)
const searchKeyword = ref('')
const year_value = ref('')
const year_options = ref([
  {
    label: '2025',
    value: 2025,
  },
  {
    label: '2024',
    value: 2024,
  },
  {
    label: '2020',
    value: 2020,
  },
  {
    label: '2010',
    value: 2010,
  },
])
// 获取el-mention组件实例
const mentionRef = ref<InstanceType<typeof ElMention> | null>(null)
// 聚焦时手动显示选项列表
const handleFocus = async (): Promise<void> => {
  await nextTick()
  if (mentionRef.value && (mentionRef.value as any).showPicker) {
    (mentionRef.value as any).showPicker()
  }
}

const type_value = ref<'book' | 'file' | 'video' | 'null'>('null')
const type_options = [
  {
    value: 'book',
    label: '书籍',
  },
  {
    value: 'file',
    label: '文件',
  },
  {
    value: 'video',
    label: '视频',
  },
  {
    value: 'null',
    label: '不限',
  },
]

const key_type_value = ref('')
const key_type_options = [
  {
    value: 'name',
    label: '资料名',
  },
  {
    value: 'author',
    label: '作者',
  },
  {
    value: 'tag',
    label: '标签',
  },
  {
    value: 'ISBN',
    label: 'ISBN',
  },
  {
    value: 'null',
    label: '不限',
  },
]
const key_value = ref('')

// 分类数据
const hotCategories = ref<allApi.Category[]>([])
const allCategories = ref<allApi.Category[]>([])

// 书籍数据
const hotBooks = ref<allApi.Document[]>([])
const fileList = ref<allApi.Document[]>([])

// 生命周期
onMounted(() => {
  // 初始加载推荐数据
  loadRecommendData()
})

const switchToFileList = () =>{
  activeTab.value = 'fileList'
  handleSearch()
}

// 方法
const loadRecommendData = () => {
  // 实际项目中这里会调用API获取推荐数据
  console.log('加载推荐数据')
  getHotCategories()
  getHotDocuments()
  getAllCategories()
}

// 获取热门分类的函数
const getHotCategories = async () => {
  try {
    // 调用接口，传入is_suggest参数（根据实际需求决定是否需要）
    const response = await allApi.getHotCategories(10)
    console.log('热门分类响应:', response)
    // 假设接口返回的数据结构中，data包含categories数组
    if (response.data) {
      hotCategories.value = response.data
    } else {
      hotCategories.value = []
      console.warn('获取分类数据格式不正确')
    }
    
    return hotCategories.value
  } catch (error) {
    console.error('获取热门分类失败:', error)
    hotCategories.value = []
    throw error // 允许调用方捕获错误
  }
}

// 获取所有分类的函数
const getAllCategories = async () => {
  try {
    // 调用接口，传入is_suggest参数（根据实际需求决定是否需要）
    const response = await allApi.getAllCategories()
    
    // 假设接口返回的数据结构中，data包含categories数组
    if (response.data) {
      allCategories.value = response.data
    } else {
      allCategories.value = []
      console.warn('获取分类数据格式不正确')
    }

    return allCategories.value
  } catch (error) {
    console.error('获取所有分类失败:', error)
    allCategories.value = []
    throw error // 允许调用方捕获错误
  }
}

// 获取热门资料的函数
const getHotDocuments = async () => {
  try {
    const response = await allApi.getHotDocuments()
    if (response.data) {
      hotBooks.value = response.data 
    } else {
      hotBooks.value = []
      console.warn('获取热门资料数据格式不正确')
    }
    return hotBooks.value
  } catch (error) {
    console.error('获取热门资料失败:', error)
    hotBooks.value = []
    throw error
  }
}

const onBookSelected = (selected: allApi.Document) => {
  console.log('选中的资料：', selected) 
  selectedDocument.value = selected
  router.push('/document/' + selected.infoBrief.documentId)
}

// 处理选中的分类数据
const onCategorySelected = (selected: allApi.Category) => {
  console.log('选中的分类：', selected) 
  showCategoryDialog.value = false
  selectedCategoryId.value = selected.id
  selectedCategory.value = selected
  if (showUploadModal.value === false) {
    selectedCategoryName.value = selected.name
    confirmCategory()
  } else {
    selectedUploadCategoryName.value = selected.name
  }
}

// 确认分类后获取对应资料列表
const confirmCategory = async () => {
  activeTab.value = 'fileList'
  if (selectedCategoryId.value) {
    try {
      const response = await allApi.getBookList(false, selectedCategoryId.value)
      console.log('资料响应:', response)
      if (response.data) {
        fileList.value = response.data 
      } else {
        fileList.value = []
        console.warn('获取资料数据格式不正确')
      }
      return fileList.value
    } catch (error) {
      console.error('获取资料失败:', error)
      fileList.value = []
      throw error
    }
  }
}

const handleSearch = async () => {
  try {
    const response = await allApi.searchBooksOrFiles(
      type_value.value,
      selectedCategoryId.value,
      year_value.value,
      key_type_value.value,
      key_value.value.trim()
    )
    activeTab.value = 'fileList'
    console.log('搜索资料响应:', response)
    if (response.data) {
      fileList.value = response.data 
    } else {
      fileList.value = []
      console.warn('获取搜索资料数据格式不正确')
    }
    return fileList.value
  } catch (error) {
    console.error('获取搜索资料失败:', error)
    fileList.value = []
    throw error
  }
}

// 修改分类重置方法
const resetCategory = () => {
   selectedCategoryName.value = ''
   selectedUploadCategoryName.value = ''
}

const handleUploadSuccess = () => {
  console.log('上传成功，可以刷新数据')
  loadRecommendData()
}

const handleCategoryAdded = async () => {
  console.log('分类添加成功，重新加载分类数据');
  
  try {
    await getAllCategories();
    
    // 如果是当前在文件列表标签页，也重新获取资料列表
    if (activeTab.value === 'fileList' && selectedCategoryId.value) {
      await confirmCategory();
    }
    
    ElMessage.success('分类数据已更新');
  } catch (error) {
    console.error('刷新分类数据失败:', error);
    ElMessage.error('刷新数据失败');
  }
};
</script>

<style scoped>
.home-container{
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column; /* 子元素沿垂直方向排列 */
  justify-content: flex-start; /* 竖直方向从顶部开始排列（默认） */
  align-items: center; /* 水平方向居中对齐 */
  overflow-y: auto; /* 允许垂直滚动 */
  scrollbar-width: none; /* Firefox：隐藏滚动条 */
  -ms-overflow-style: none; /* IE/Edge：隐藏滚动条 */
}

.home-container::-webkit-scrollbar {
  display: none; 
}

.topbar {
  position: fixed; /* 固定在顶部 */
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100; /* 较高层级，默认覆盖在搜索表单上方 */
  /* 其他样式（背景色等，确保不透明） */
  background: #fff; /* 必须有背景色，避免内容穿透 */
}

.searchForm {
  position: absolute;
  top: 15%;
  left: 15%; 
  width: 70%;  
  height: 25%;
  border-radius: 10px; 
  z-index: 99;
}

.search-guide {
  margin-bottom: 5px;
  font-size: 20px;
  color: #b994fe;
  text-align: center;
}

.el-row {
  margin-bottom: 10px;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}

/* 针对自定义类名的下拉框，修改选中/聚焦时的边框样式 */
.purple-border-select {
  --el-select-border-color: #ddd; /* 默认边框色 */
  --el-select-hover-border-color: #b994fe; /*  hover 时边框色 */
  --el-select-focus-border-color: #b994fe; /* 聚焦/选中时边框色 */
}

.category-select-btn {
  width: 100%;
  height: 32px;
  background-color: #ffffff; 
  border: 1.4px solid #ddd; 
  color: #bab9b9; 
  border-radius: 4px; 
  cursor: pointer; 
  transition: all 0.2s; 
  line-height: 0px; 
  text-align: left;
  /* 可选：添加左侧内边距，避免文字贴边框 */
  padding-left: 12px; 
}

/* 3. 按钮 hover 状态：增强交互反馈 */
.category-select-btn:hover {
  border-color: #c1a1fd; /* 边框色加深 */
}

.input {
  position: absolute;
  margin-top: 15px;
  width: 100%; 
  height: 30%;
  border: 2px solid #ddd;  /* 容器边框 */
  display: flex;  /* 使用flex布局让输入框和按钮并排显示 */
  align-items: center;  /* 垂直居中对齐 */
  overflow: hidden;  /* 防止内部元素超出容器 */
}

.input :hover {
  border-color: #b994fe; 
}

/* 按钮样式调整 */
.input .search-button {
  height: 100%;  /* 按钮高度与容器一致 */
  width: 100px;
  border: 1px solid #ddd;  /* 移除按钮默认边框 */
  background: #fff;
  color: #666;
  font-size: 20px;
  font-weight: 500;
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
}

.input .search-button:hover {
  cursor: pointer;
  background: #f5f4f4;
}

/* 输入框样式 */
.input input {
  flex: 1;  /* 让输入框占满剩余空间 */
  height: 100%;  /* 输入框高度与容器一致 */
  padding: 0 12px;  /* 内部间距 */
  border: none;  /* 移除默认边框 */
  outline: none;  /* 移除聚焦时的默认轮廓 */
  font-size: 20px;  /* 字体大小 */
  background: transparent;
}

.input:has(input:focus) {
  border-color: #c1a1fd; /* 容器边框变紫色 */
  box-shadow: 0 0 8px 3px rgba(185, 148, 254, 0.3); /* 紫色外发光（荧光效果） */
}

/* 标签页容器样式 */
.tabs-container {
  position: relative;
  top: 40%;
  width: 80%;
}

/* 标签导航样式 */
.tabs-nav {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.tab-nav-item {
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-nav-item.active {
  border-bottom-color: #b994fe; /* 选中标签下划线颜色 */
  color: #b994fe; /* 选中标签文字颜色 */
  font-weight: 500;
}

.tab-nav-item:hover {
  color: #b994fe;
}

/* 标签内容区样式 */
.tabs-content {
  padding: 0 10px;
}

.tab-pane {
  display: block;
}

.category-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.book-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
</style>