<template>
  <div class="user-list">
    <el-card class="user-card">
      <div class="user-card__toolbar">
        <el-input
          v-model="searchInput"
          size="large"
          clearable
          placeholder="请按照姓名搜索"
          @clear="resetSearch"
          @keyup.enter="handleSearch"
          class="user-card__search-input"
        >
          <template #append>
            <el-button type="primary" size="small" @click="handleSearch">
              搜索
            </el-button>
          </template>
        </el-input>
        <el-button
          type="primary"
          size="medium"
          :loading="loading"
          @click="fetchUsers"
          class="user-card__refresh"
        >
          刷新
        </el-button>
      </div>

      <div class="user-card__table">
        <el-table
          :data="filteredUsers"
          v-loading="loading"
          element-loading-text="正在加载用户数据..."
          empty-text="暂无用户数据"
          border
        >
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="name" label="姓名" width="200" align="center" />
          <el-table-column prop="email" label="邮箱" min-width="220" align="center" />
          <el-table-column label="状态" width="200" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === "active" ? "正常" : "停用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                @click="toggleStatus(row)"
              >
                {{
                  row.status === "active" ? "设为停用" : "设为正常"
                }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getUserList,
  updateUserStatus,
  type UserRow,
} from "../../api/admin";
import { type UserBrief } from "../../api/all";
import { DEMO_USERS } from "./mockData";

const users = ref<UserRow[]>([...DEMO_USERS]);
const loading = ref(false);
const searchInput = ref("");
const appliedKeyword = ref("");

const normalizeStatus = (status: string) => {
  if (status === "active" || status === "正常") return "active";
  if (status === "disabled" || status === "停用") return "disabled";
  return status;
};

// 将获取的用户数据提取关键信息展示
const mapToRows = (list: UserBrief[]): UserRow[] =>
  [...list]
    .sort((a, b) => a.userId - b.userId)
    .slice(0, 10)
    .map((item) => ({
      id: item.userId,
      name: item.username,
      email: item.email,
      status: normalizeStatus(item.status),
    }));

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await getUserList();
    users.value = mapToRows(response.data || []);
  } catch (error: any) {
    console.warn("获取用户数据失败", error);
    users.value = [...DEMO_USERS];
    ElMessage.warning("未连接后端，正在使用示例数据展示");
  } finally {
    loading.value = false;
  }
};

const filteredUsers = computed(() => {
  const keyword = appliedKeyword.value;
  if (!keyword) return users.value;

  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return users.value;
  return users.value.filter((user) =>
    user.name.trim().toLowerCase().includes(normalizedKeyword)
  );
});

const handleSearch = () => {
  appliedKeyword.value = searchInput.value.trim();
};

const resetSearch = () => {
  searchInput.value = "";
  appliedKeyword.value = "";
};

const toggleStatus = async (user: UserRow) => {
  const previousStatus = user.status;
  const targetStatus = user.status === "active" ? "disabled" : "active";
  user.status = targetStatus;

  try {
    const { data } = await updateUserStatus({
      userId: user.id,
      status: targetStatus,
    });
    if (data?.status) {
      user.status = normalizeStatus(data.status);
    }
    const message =
      user.status === "active" ? "已启用用户" : "已停用用户";
    ElMessage.success(message);
  } catch (error) {
    console.error("更新用户状态失败，请重试", error);
    user.status = previousStatus;
    ElMessage.error("更新用户状态失败，请重试");
  }
};

onMounted(fetchUsers);
</script>

<style scoped lang="css">
.user-list {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  scrollbar-width: none;
}

:deep(.el-card.is-always-shadow.user-card) {
  border: none;
  box-shadow: none;
}

.user-card {
  border-radius: 10px;
  background: #fff;
  overflow: auto;
  scrollbar-width: none;
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .user-card__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .user-card__search-input {
    width: 50%;
  }

  .user-card__refresh {
    margin-left: auto;
  }

  .user-card__table {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .user-card__table :deep(.el-table) {
    flex: 1;
    --el-table-border-color: rgba(185, 148, 254, 0.2);
    background-color: #fff;
    border-radius: 0;
  }

  .user-card__table :deep(.el-table__body-wrapper) {
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

  :deep(.el-tag) {
    border: none;
    background: linear-gradient(135deg, #b994fe 0%, #8e47bd 100%);
    color: #fff;
  }
}
</style>
