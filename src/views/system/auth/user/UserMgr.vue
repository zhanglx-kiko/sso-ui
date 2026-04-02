<template>
  <div class="page-shell">
    <AppPageHeader
      title="用户管理"
      description="集中维护账号信息、登录状态与并发访问策略，让整个权限体系更清晰。"
      :stats="headerStats"
    >
      <template #actions>
        <el-button plain @click="getList">刷新列表</el-button>
        <el-button type="primary" @click="openAddDialog">新增用户</el-button>
      </template>
    </AppPageHeader>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">筛选条件</h2>
          <p class="panel-subtitle">按用户名快速定位目标账号，并保留当前分页节奏。</p>
        </div>
      </div>

      <el-form :inline="true" :model="queryParams" class="filters-form">
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <div class="filters-actions">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </div>
        </el-form-item>
      </el-form>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">账号列表</h2>
          <p class="panel-subtitle">当前页展示用户账号、状态与最近的创建信息。</p>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" class="user-table">
        <el-table-column prop="id" label="编号" min-width="180" />
        <el-table-column prop="username" label="用户名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="nickname" label="昵称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openAssignRoleDialog(scope.row)">
              分配角色
            </el-button>
            <el-button link type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button
              link
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              :loading="actionRowId === normalizeId(scope.row.id)"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="warning" @click="handleResetPwd(scope.row)">重置密码</el-button>
            <el-popconfirm title="确定要删除该用户吗？" @confirm="handleDelete(scope.row)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="panel-footer">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </section>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="560px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="初始密码" prop="password">
          <el-input v-model="form.password" placeholder="留空默认 123456" />
        </el-form-item>
        <el-form-item label="允许并发" prop="allowConcurrentLogin">
          <el-radio-group v-model="form.allowConcurrentLogin">
            <el-radio :value="1">允许</el-radio>
            <el-radio :value="0">禁止互顶</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="roleDialog.visible"
      title="分配角色"
      width="560px"
      @close="resetRoleDialog"
    >
      <div v-loading="roleDialog.loading" class="role-dialog">
        <p class="role-dialog__description">
          为 <strong>{{ roleDialog.username || '当前用户' }}</strong> 选择可用角色。
        </p>

        <el-empty
          v-if="!roleDialog.loading && !roleOptions.length"
          description="暂无可分配角色"
          :image-size="88"
        />

        <el-checkbox-group
          v-else
          v-model="selectedRoleIds"
          class="role-dialog__group"
          :disabled="roleDialog.loading || roleDialog.saving"
        >
          <div v-for="role in roleOptions" :key="role.id" class="role-dialog__option">
            <el-checkbox :value="role.id">
              <span class="role-dialog__option-main">
                <span class="role-dialog__option-name">{{ role.roleName }}</span>
                <span v-if="role.roleCode" class="role-dialog__option-code">{{ role.roleCode }}</span>
              </span>
            </el-checkbox>
            <el-tag v-if="role.status === 0" type="warning">停用</el-tag>
          </div>
        </el-checkbox-group>

        <p v-if="roleOptions.length" class="role-dialog__summary">
          已选择 {{ selectedRoleIds.length }} 个角色，保存时会同步该用户与角色的绑定关系。
        </p>
      </div>

      <template #footer>
        <el-button @click="roleDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="roleDialog.saving" @click="submitRoleAssignments">
          保存角色
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import AppPageHeader from '@/components/AppPageHeader.vue'
import { resetPasswordApi } from '../../../../api/auth'
import { getUserListApi, addUserApi, updateUserInfoApi, removeUserApi } from '../../../../api/user'
import {
  bindUsersToRoleApi,
  getRolePageApi,
  getRoleWithUsersApi,
  getRolesByUserIdApi,
} from '../../../../api/role'
import { showGlobalError } from '../../../../stores/globalError'
import type { UserDTO, UserQueryDTO } from '../../../../types/auth'

interface RoleOption {
  id: string
  roleName: string
  roleCode?: string
  status?: number
}

interface ExtractResult {
  ids: string[]
  resolved: boolean
}

const loading = ref(false)
const total = ref(0)
const tableData = ref<UserDTO[]>([])
const formRef = ref<FormInstance>()
const submitting = ref(false)
const actionRowId = ref('')
const roleOptions = ref<RoleOption[]>([])
const selectedRoleIds = ref<string[]>([])
const originalRoleIds = ref<string[]>([])

const queryParams = reactive<UserQueryDTO>({
  pageNum: 1,
  pageSize: 10,
  username: '',
})

const dialog = reactive({
  visible: false,
  title: '',
})

const roleDialog = reactive({
  visible: false,
  loading: false,
  saving: false,
  userId: '',
  username: '',
})

const form = reactive<UserDTO>({
  id: undefined,
  username: '',
  nickname: '',
  password: '',
  allowConcurrentLogin: 1,
  status: 1,
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

const headerStats = computed(() => [
  {
    label: '用户总量',
    value: total.value || tableData.value.length,
    hint: '当前纳入系统的账号规模',
  },
  {
    label: '正常状态',
    value: tableData.value.filter((item) => item.status === 1).length,
    hint: '当前页可正常登录的账号',
  },
  {
    label: '禁用状态',
    value: tableData.value.filter((item) => item.status === 0).length,
    hint: '当前页已限制访问的账号',
  },
  {
    label: '分页容量',
    value: queryParams.pageSize,
    hint: '支持按节奏加载更多记录',
  },
])

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const normalizeId = (value: unknown): string => {
  return value === undefined || value === null ? '' : String(value)
}

const dedupeIds = (ids: string[]): string[] => {
  return Array.from(new Set(ids.filter(Boolean)))
}

const extractIdsFromArray = (payload: unknown[]): string[] => {
  return dedupeIds(
    payload
      .map((item) => {
        if (isRecord(item)) {
          return normalizeId(item.id ?? item.userId ?? item.roleId ?? item.value)
        }
        return normalizeId(item)
      })
      .filter(Boolean),
  )
}

const extractRoleRecords = (payload: unknown): RoleOption[] => {
  const list = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.records)
      ? payload.records
      : []

  return dedupeIds(
    list
      .map((item) => {
        if (!isRecord(item)) return ''
        return normalizeId(item.id ?? item.roleId)
      })
      .filter(Boolean),
  ).map((id) => {
    const current = list.find((item) => isRecord(item) && normalizeId(item.id ?? item.roleId) === id)
    const record = isRecord(current) ? current : {}
    const rawStatus =
      typeof record.status === 'number' ? record.status : Number(record.status ?? Number.NaN)

    return {
      id,
      roleName: String(record.roleName ?? record.name ?? record.label ?? record.roleCode ?? id),
      roleCode: record.roleCode ? String(record.roleCode) : '',
      status: Number.isNaN(rawStatus) ? undefined : rawStatus,
    }
  })
}

const extractAssignedRoleIds = (payload: unknown): string[] => {
  if (Array.isArray(payload)) {
    return extractIdsFromArray(payload)
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.records)) {
      return extractIdsFromArray(payload.records)
    }
    const singleId = normalizeId(payload.id ?? payload.roleId)
    return singleId ? [singleId] : []
  }

  return []
}

const extractRoleUserIds = (payload: unknown): ExtractResult => {
  if (Array.isArray(payload)) {
    return {
      ids: extractIdsFromArray(payload),
      resolved: true,
    }
  }

  if (isRecord(payload)) {
    const directCollections = [payload.userIds, payload.userIdList, payload.boundUserIds]
    for (const collection of directCollections) {
      if (Array.isArray(collection)) {
        return {
          ids: extractIdsFromArray(collection),
          resolved: true,
        }
      }
    }

    const relationCollections = [payload.users, payload.userList, payload.records, payload.items]
    for (const collection of relationCollections) {
      if (Array.isArray(collection)) {
        return {
          ids: extractIdsFromArray(collection),
          resolved: true,
        }
      }
    }
  }

  return {
    ids: [],
    resolved: false,
  }
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getUserListApi(queryParams)
    tableData.value = res.records
    total.value = Number(res.total) || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.username = ''
  handleSearch()
}

const handleDelete = async (row: UserDTO) => {
  if (!row.id) return
  await removeUserApi(row.id)
  ElMessage.success('删除成功')
  getList()
}

const handleResetPwd = async (row: UserDTO) => {
  if (!row.id) return
  await resetPasswordApi(row.id)
  ElMessage.success('重置成功，该用户需重新登录')
}

const resetForm = () => {
  form.id = undefined
  form.username = ''
  form.nickname = ''
  form.password = ''
  form.allowConcurrentLogin = 1
  form.status = 1
  formRef.value?.clearValidate()
}

const resetRoleDialog = () => {
  roleDialog.loading = false
  roleDialog.saving = false
  roleDialog.userId = ''
  roleDialog.username = ''
  roleOptions.value = []
  selectedRoleIds.value = []
  originalRoleIds.value = []
}

const openAddDialog = () => {
  resetForm()
  dialog.title = '新增用户'
  dialog.visible = true
}

const openEditDialog = (row: UserDTO) => {
  resetForm()
  Object.assign(form, row) // 回显数据
  dialog.title = '编辑用户'
  dialog.visible = true
}

const submitForm = async () => {
  if (!formRef.value || submitting.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true

    try {
      if (form.id) {
        await updateUserInfoApi(form)
        ElMessage.success('更新成功')
      } else {
        await addUserApi(form)
        ElMessage.success('新增成功')
      }
      dialog.visible = false
      getList()
    } finally {
      submitting.value = false
    }
  })
}

const handleToggleStatus = async (row: UserDTO) => {
  if (!row.id) return

  const nextStatus = row.status === 1 ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '禁用'
  const displayName = row.nickname || row.username

  try {
    await ElMessageBox.confirm(`确定要${actionText}用户“${displayName}”吗？`, `${actionText}用户`, {
      confirmButtonText: actionText,
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  actionRowId.value = normalizeId(row.id)

  try {
    await updateUserInfoApi({
      ...row,
      status: nextStatus,
    })
    ElMessage.success(`${actionText}成功`)
    getList()
  } finally {
    actionRowId.value = ''
  }
}

const openAssignRoleDialog = async (row: UserDTO) => {
  if (!row.id) return

  roleDialog.visible = true
  roleDialog.loading = true
  roleDialog.userId = normalizeId(row.id)
  roleDialog.username = row.nickname || row.username

  try {
    const [rolePage, userRoles] = await Promise.all([
      getRolePageApi({
        pageNum: 1,
        pageSize: 200,
        roleName: '',
      }),
      getRolesByUserIdApi(row.id),
    ])

    roleOptions.value = extractRoleRecords(rolePage).sort((left, right) => {
      const statusDiff = Number(right.status ?? 1) - Number(left.status ?? 1)
      if (statusDiff !== 0) return statusDiff
      return left.roleName.localeCompare(right.roleName, 'zh-CN')
    })

    const assignedRoleIds = extractAssignedRoleIds(userRoles)
    selectedRoleIds.value = assignedRoleIds
    originalRoleIds.value = [...assignedRoleIds]
  } catch (error) {
    roleDialog.visible = false
    resetRoleDialog()
    showGlobalError(error, {
      fallbackMessage: '加载角色信息失败',
    })
  } finally {
    roleDialog.loading = false
  }
}

const submitRoleAssignments = async () => {
  if (!roleDialog.userId || roleDialog.saving) return

  const nextRoleIds = dedupeIds(selectedRoleIds.value)
  const currentRoleIds = dedupeIds(originalRoleIds.value)
  const changedRoleIds = dedupeIds([...nextRoleIds, ...currentRoleIds]).filter(
    (roleId) => nextRoleIds.includes(roleId) !== currentRoleIds.includes(roleId),
  )

  if (changedRoleIds.length === 0) {
    roleDialog.visible = false
    ElMessage.success('角色分配未发生变化')
    return
  }

  roleDialog.saving = true

  try {
    for (const roleId of changedRoleIds) {
      const roleDetail = await getRoleWithUsersApi(roleId)
      const relation = extractRoleUserIds(roleDetail)

      if (!relation.resolved) {
        throw new Error('当前角色接口缺少可识别的用户关联数据，已停止保存以避免覆盖已有绑定')
      }

      const userIds = new Set(relation.ids)

      if (nextRoleIds.includes(roleId)) {
        userIds.add(roleDialog.userId)
      } else {
        userIds.delete(roleDialog.userId)
      }

      await bindUsersToRoleApi(roleId, Array.from(userIds))
    }

    originalRoleIds.value = [...nextRoleIds]
    roleDialog.visible = false
    ElMessage.success('角色分配已更新')
  } catch (error) {
    showGlobalError(error, {
      fallbackMessage: '保存角色分配失败',
    })
  } finally {
    roleDialog.saving = false
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.user-table :deep(.el-button.is-link) {
  font-weight: 600;
}

.role-dialog {
  display: flex;
  min-height: 180px;
  flex-direction: column;
  gap: 12px;
}

.role-dialog__description,
.role-dialog__summary {
  margin: 0;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.6;
}

.role-dialog__description strong {
  color: var(--app-title);
}

.role-dialog__group {
  display: grid;
  gap: 10px;
}

.role-dialog__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface-muted);
}

.role-dialog__option :deep(.el-checkbox) {
  min-width: 0;
}

.role-dialog__option :deep(.el-checkbox__label) {
  min-width: 0;
  padding-left: 8px;
}

.role-dialog__option-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.role-dialog__option-name {
  color: var(--app-title);
  font-weight: 600;
}

.role-dialog__option-code {
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.5;
}
</style>
