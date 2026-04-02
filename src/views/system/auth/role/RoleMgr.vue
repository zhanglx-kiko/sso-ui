<template>
  <div class="page-shell">
    <AppPageHeader
      eyebrow="角色中心"
      title="角色管理"
      description="在统一页面框架内维护角色层级、权限归属和描述信息。"
      :stats="headerStats"
    >
      <template #actions>
        <el-button plain @click="handleSearch">刷新视图</el-button>
        <el-button type="primary" @click="openAddDialog">新增角色</el-button>
      </template>
    </AppPageHeader>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">筛选条件</h2>
          <p class="panel-subtitle">按角色名称快速检索，确认当前权限模型是否清晰可用。</p>
        </div>
      </div>

      <el-form :inline="true" :model="queryParams" class="filters-form">
        <el-form-item label="角色名称">
          <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable />
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
          <h2 class="panel-title">角色列表</h2>
          <p class="panel-subtitle">这里展示当前角色编码、状态与职责备注。</p>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" class="role-table">
        <el-table-column prop="id" label="编号" min-width="180" />
        <el-table-column prop="roleName" label="角色名称" min-width="180" />
        <el-table-column prop="roleCode" label="角色编码" min-width="180" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="220" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleAssignPermission(scope.row)">
              分配权限
            </el-button>
            <el-button link type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppPageHeader from '@/components/AppPageHeader.vue'

// 占位数据与逻辑
const loading = ref(false)
const tableData = ref([
  { id: '1', roleName: '超级管理员', roleCode: '管理端全局角色', status: 1, remark: '拥有所有权限' },
  { id: '2', roleName: '普通用户', roleCode: '基础访问角色', status: 1, remark: '普通浏览权限' },
])

const queryParams = reactive({ roleName: '' })

const headerStats = computed(() => [
  {
    label: '角色总数',
    value: tableData.value.length,
    hint: '角色模型决定权限分配边界',
  },
  {
    label: '启用状态',
    value: tableData.value.filter((item) => item.status === 1).length,
    hint: '当前仍在使用中的角色',
  },
  {
    label: '停用状态',
    value: tableData.value.filter((item) => item.status !== 1).length,
    hint: '已暂停的权限身份',
  },
  {
    label: '当前查询',
    value: queryParams.roleName || '全部',
    hint: '便于快速聚焦目标角色',
  },
])

const handleSearch = () => ElMessage.info('触发搜索')
const resetQuery = () => {
  queryParams.roleName = ''
  handleSearch()
}
const openAddDialog = () => ElMessage.info('触发新增角色')
const openEditDialog = (row: any) => ElMessage.info('触发编辑角色: ' + row.roleName)
const handleDelete = (row: any) => ElMessage.warning('触发删除角色: ' + row.roleName)
const handleAssignPermission = (row: any) => ElMessage.success('触发表单分配权限: ' + row.roleName)
</script>

<style scoped>
.role-table :deep(.el-button.is-link) {
  font-weight: 600;
}
</style>
