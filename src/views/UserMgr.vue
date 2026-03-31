<template>
  <div class="app-container">
    <el-card class="mb-20">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <div class="mb-20">
        <el-button type="primary" @click="openAddDialog">新增用户</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button link type="warning" @click="handleResetPwd(scope.row)">重置密码</el-button>
            <el-popconfirm title="确定要删除该用户吗？" @confirm="handleDelete(scope.row)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="初始密码" prop="password" v-if="!form.id">
          <el-input v-model="form.password" placeholder="留空默认123456" />
        </el-form-item>
        <el-form-item label="允许并发" prop="allowConcurrentLogin">
          <el-radio-group v-model="form.allowConcurrentLogin">
            <el-radio :label="1">允许</el-radio>
            <el-radio :label="0">禁止(互顶)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  getUserListApi,
  addUserApi,
  updateUserInfoApi,
  removeUserApi,
  resetPasswordApi,
} from '../api/auth'
import type { UserDTO, UserQueryDTO } from '../types/auth'
import { ElMessage, type FormInstance } from 'element-plus'

// --- 数据定义 ---
const loading = ref(false)
const total = ref(0)
const tableData = ref<UserDTO[]>([])
const formRef = ref<FormInstance>()

const queryParams = reactive<UserQueryDTO>({
  pageNum: 1,
  pageSize: 10,
  username: '',
})

const dialog = reactive({
  visible: false,
  title: '',
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

// --- 方法 ---

// 1. 获取列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getUserListApi(queryParams)
    tableData.value = res.records
    total.value = res.total
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

// 2. 删除
const handleDelete = async (row: UserDTO) => {
  if (!row.id) return
  await removeUserApi(row.id)
  ElMessage.success('删除成功')
  getList()
}

// 3. 重置密码
const handleResetPwd = async (row: UserDTO) => {
  if (!row.id) return
  await resetPasswordApi(row.id)
  ElMessage.success('重置成功，该用户需重新登录')
}

// 4. 新增/编辑
const resetForm = () => {
  form.id = undefined
  form.username = ''
  form.nickname = ''
  form.password = ''
  form.allowConcurrentLogin = 1
  form.status = 1
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
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.id) {
        await updateUserInfoApi(form)
        ElMessage.success('更新成功')
      } else {
        await addUserApi(form)
        ElMessage.success('新增成功')
      }
      dialog.visible = false
      getList()
    }
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.mb-20 {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
