<template>
  <div class="user-list">
    <el-card class="user-card" shadow="hover">
      <div class="user-card__header">
        <h3 class="user-card__title">{{ TEXT.title }}</h3>
        <el-button type="primary" size="small" :loading="loading" @click="fetchUsers">
          {{ TEXT.refresh }}
        </el-button>
      </div>

      <el-table
        :data="users"
        v-loading="loading"
        :element-loading-text="TEXT.loading"
        :empty-text="TEXT.empty"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" :label="TEXT.name" min-width="140" />
        <el-table-column prop="email" :label="TEXT.email" min-width="220" />
        <el-table-column :label="TEXT.status" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? TEXT.normal : TEXT.inactive }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="TEXT.action" width="140">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="toggleStatus(row)">
              {{ row.status === 'active' ? TEXT.setInactive : TEXT.setActive }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'
import type { AdminProfile } from '../../api/admin'

interface ApiResponse<T = unknown> {
  code: number
  message?: string
  data: T
}

type UserRow = {
  id: number
  name: string
  email: string
  status: string
}

const TEXT = {
  title: '\u7528\u6237\u5217\u8868',
  refresh: '\u5237\u65B0',
  loading: '\u6B63\u5728\u52A0\u8F7D\u7528\u6237\u6570\u636E...',
  empty: '\u6682\u65E0\u7528\u6237\u6570\u636E',
  name: '\u59D3\u540D',
  email: '\u90AE\u7BB1',
  status: '\u72B6\u6001',
  action: '\u64CD\u4F5C',
  setInactive: '\u8BBE\u4E3A\u505C\u7528',
  setActive: '\u8BBE\u4E3A\u6B63\u5E38',
  normal: '\u6B63\u5E38',
  inactive: '\u505C\u7528',
  fetchError: '\u83B7\u53D6\u7528\u6237\u6570\u636E\u5931\u8D25',
  successActivate: '\u5DF2\u542F\u7528\u7528\u6237',
  successDeactivate: '\u5DF2\u505C\u7528\u7528\u6237',
  mockFallback: '\u672A\u8FDE\u63A5\u540E\u7AEF\uFF0C\u6B63\u5728\u4F7F\u7528\u793A\u4F8B\u6570\u636E\u5C55\u793A',
} as const

const DEMO_USERS: UserRow[] = [
  {
    id: 1,
    name: '\u5F20\u4E09',
    email: 'zhangsan@example.com',
    status: 'active',
  },
]

const users = ref<UserRow[]>([...DEMO_USERS])
const loading = ref(false)

const normalizeStatus = (status: string) => {
  if (status === 'active' || status === TEXT.normal) return 'active'
  if (status === 'inactive' || status === TEXT.inactive) return 'inactive'
  return status
}

const mapToRows = (list: AdminProfile[]): UserRow[] =>
  [...list]
    .sort((a, b) => a.userId - b.userId)
    .slice(0, 10)
    .map((item) => ({
      id: item.userId,
      name: item.username,
      email: item.email,
      status: normalizeStatus(item.status),
    }))

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await request<ApiResponse<AdminProfile[]>, ApiResponse<AdminProfile[]>>({
      url: '/admin/users',
      method: 'get',
    })
    users.value = mapToRows(response.data || [])
  } catch (error: any) {
    console.warn(TEXT.fetchError, error)
    users.value = [...DEMO_USERS]
    ElMessage.warning(TEXT.mockFallback)
  } finally {
    loading.value = false
  }
}

const toggleStatus = (user: UserRow) => {
  //转换状态
  user.status = user.status === 'active' ? 'inactive' : 'active'
  const message = user.status === 'active' ? TEXT.successActivate : TEXT.successDeactivate
  ElMessage.success(message)
}

onMounted(fetchUsers)
</script>

<style scoped lang="scss">
.user-list {
  padding: 20px;
}

.user-card {
  .user-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .user-card__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2329;
  }
}
</style>
