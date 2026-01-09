<template>
    <div class="post-list">
        <div class="toolbar">
            <el-input v-model="searchInput" size="large" clearable placeholder="请按照帖子标题搜索" @clear="resetSearch"
                @keyup.enter="handleSearch" class="search-input">
                <template #append>
                    <el-button type="primary" size="small" @click="handleSearch">
                        搜索
                    </el-button>
                </template>
            </el-input>
            <el-button type="primary" size="medium" :loading="loading" @click="handleRefresh" class="refresh">
                刷新
            </el-button>
        </div>

        <div class="post-card__table">
            <el-table :data="filteredPosts" v-loading="loading" element-loading-text="正在加载帖子数据..." empty-text="暂无帖子数据"
                border>
                <el-table-column label="发帖人" align="center" min-width="220">
                    <template #default="{ row }">
                        <div class="post-user">
                            <img :src="row.senderAvatar" alt="avatar" class="post-user__avatar" />
                            <span class="post-user__name">{{ row.senderName }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="标题" min-width="500" align="center" >
                    <template #default="{row}">
                        <el-link type="primary" underline="false" @click="handleGoDetail(row.postId)">{{ row.title }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column label="删除" width="200" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" link size="small" @click="toggleDelete(row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { deletePost, getPosts, type Post } from '@/api/all';
import router from '@/router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, ref, computed } from 'vue';


const postList = ref<Post[]>()
const searchInput = ref('')
const appliedInput = ref('')
const loading = ref(false)

const filteredPosts = computed(() => {
    if (appliedInput.value) {
        return postList.value?.filter((item) =>
            item.title.includes(appliedInput.value.toLowerCase())
        )
    }
    return postList.value
})


const handleSearch = () => {
    appliedInput.value = searchInput.value.trim()
}

const resetSearch = () => {
    searchInput.value = ''
    appliedInput.value = ''
}

const handleRefresh = () => {
    resetSearch()
    getPostList()
}

const handleGoDetail = (postId:number) =>{
    router.push({
      name: "PostInfo",
      query: {
        postId: String(postId),
      },
    })
}

const toggleDelete = async (post: Post) => {
    try {
        await ElMessageBox.confirm(
            `确认删除“${post.title}”？`,
            '提示',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        await deletePost(post.postId)
        ElMessage.success('删除帖子成功')
        getPostList()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除帖子失败')
        }
    }
}


const getPostList = async () => {
    if (loading.value) return
    loading.value = true
    try {
        const res = await getPosts(null as any, 'time')
        postList.value = res.data
    } catch {
        ElMessage.error('获取帖子失败')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    getPostList()
})
</script>


<style scoped>
.post-list {
    padding: 20px 20px 0;
    display: flex;
    flex-direction: column;
    overflow: auto;
    scrollbar-width: none;
    gap: 20px;
}


.toolbar {
    display: flex;
    align-items: center;
}



.search-input {
    width: 50%;
}

.refresh {
    margin-left: auto;
}

.post-card__table {
    flex: 1;
    min-height: 0;
}

.post-card__table :deep(.el-table) {
    --el-table-border-color: rgba(185, 148, 254, 0.2);
    background-color: #fff;
}

.post-card__table :deep(.el-table__body-wrapper) {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

:deep(.el-table th) {
    background-color: rgba(185, 148, 254, 0.18);
    color: #3f2458;
    font-weight: 600;
}

.post-user {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
}

.post-user__avatar {
    width: 34px;
    height: 34px;
    border-radius: 6px;
    object-fit: cover;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.post-user__name {
    font-size: 14px;
    color: #374151;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
