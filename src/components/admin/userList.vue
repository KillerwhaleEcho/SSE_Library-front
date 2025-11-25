<template>
  <div class="user-list">
    <el-card class="user-card">
      <div class="user-card__toolbar">
        <!-- <el-select
          v-model="searchKey"
          size="medium"
          class="user-card__search-select"
          :placeholder="TEXT.searchSelect"
        >
          <el-option :label="TEXT.searchByName" value="name" />
          <el-option :label="TEXT.searchById" value="id" />
        </el-select> -->
        <el-input
          v-model="searchInput"
          size="large"
          clearable
          :placeholder="TEXT.searchPlaceholder"
          @clear="resetSearch"
          @keyup.enter="handleSearch"
          class="user-card__search-input"
        >
          <template #append>
            <el-button type="primary" size="small" @click="handleSearch">
              {{ TEXT.search }}
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
          {{ TEXT.refresh }}
        </el-button>
      </div>

      <div class="user-card__table">
        <el-table
          :data="filteredUsers"
          v-loading="loading"
          :element-loading-text="TEXT.loading"
          :empty-text="TEXT.empty"
          border
        >
          <el-table-column prop="id" label="ID" width="80" align="center"/>
          <el-table-column prop="name" :label="TEXT.name" width="200" align="center"/>
          <el-table-column prop="email" :label="TEXT.email" min-width="220" align="center"/>
          <el-table-column :label="TEXT.status" width="200" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === "active" ? TEXT.normal : TEXT.disabled }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="TEXT.action" width="200" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                @click="toggleStatus(row)"
              >
                {{
                  row.status === "active" ? TEXT.setDisabled : TEXT.setActive
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
  type UserBrief,
} from "../../api/admin";
import {type UserRow } from "../../api/admin";
import {  DEMO_USERS} from "./mockData";

const TEXT = {
  title: "用户列表",
  refresh: "刷新",
  loading: "正在加载用户数据...",
  empty: "暂无用户数据",
  name: "姓名",
  email: "邮箱",
  status: "状态",
  action: "操作",
  setDisabled: "设为停用",
  setActive: "设为正常",
  normal: "正常",
  disabled: "停用",
  fetchError: "获取用户数据失败",
  successActivate: "已启用用户",
  successDeactivate: "已停用用户",
  updateError: "更新用户状态失败，请重试",
  search: "搜索",
  searchPlaceholder: "请按照姓名搜索",
  searchSelect: "请选择搜索类型",
  searchByName: "根据姓名",
  searchById: "根据 ID",
  mockFallback: "未连接后端，正在使用示例数据展示",
} as const;



const users = ref<UserRow[]>([...DEMO_USERS]);
const loading = ref(false);
// const searchKey = ref<"name" | "id">("name");
const searchInput = ref("");
const appliedKeyword = ref("");


const normalizeStatus = (status: string) => {
  if (status === "active" || status === TEXT.normal) return "active";
  if (status === "disabled" || status === TEXT.disabled) return "disabled";
  return status;
};

const mapToPayloadStatus = (status: string): "active" | "disabled" =>
  status === "active" ? "active" : "disabled";



//将获取的用户数据提取关键数据展示
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
    console.warn(TEXT.fetchError, error);
    users.value = [...DEMO_USERS];
    ElMessage.warning(TEXT.mockFallback);
  } finally {
    loading.value = false;
  }
};

const filteredUsers = computed(() => {
  const keyword = appliedKeyword.value;
  if (!keyword) return users.value;

  // if (searchKey.value === "id") {
  //   const targetId = Number(keyword);
  //   if (!Number.isInteger(targetId)) return [];
  //   return users.value.filter((user) => user.id === targetId);
  // }

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
  // 切换当前状态
  const previousStatus = user.status;
  const targetStatus = user.status === "active" ? "disabled" : "active";
  user.status = targetStatus;

  try {
    const { data } = await updateUserStatus({
      userId: user.id,
      status: mapToPayloadStatus(targetStatus),
    });
    if (data?.status) {
      user.status = normalizeStatus(data.status);
    }
    const message =
      user.status === "active" ? TEXT.successActivate : TEXT.successDeactivate;
    ElMessage.success(message);
  } catch (error) {
    console.error(TEXT.updateError, error);
    user.status = previousStatus;
    ElMessage.error(TEXT.updateError);
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

  /* .user-card__search-select {
    width: 120px;
  } */

  .user-card__search-input {
width: 50%;
  }

  .user-card__refresh {
    margin-left: auto;
  }
  .user-card__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #311a45;
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

  :deep(.el-table tr:hover > td) {
    background-color: rgba(185, 148, 254, 0.18);
  }

  :deep(.el-tag) {
    border: none;
    background: linear-gradient(135deg, #b994fe 0%, #8e47bd 100%);
    color: #fff;
  }
}
</style>
