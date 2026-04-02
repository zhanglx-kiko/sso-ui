<template>
  <div class="page-shell">
    <AppPageHeader
      eyebrow="权限树"
      title="菜单管理"
      description="把平台、模块、菜单与按钮权限放进同一棵树里，后续扩展会更顺畅。"
      :stats="headerStats"
    >
      <template #actions>
        <el-button plain @click="toggleExpand">{{ expandAll ? '收起树' : '展开树' }}</el-button>
        <el-button type="primary" @click="handleAdd">新增顶级权限</el-button>
      </template>
    </AppPageHeader>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">筛选条件</h2>
          <p class="panel-subtitle">按菜单名称或权限标识筛选当前权限树。</p>
        </div>
      </div>

      <el-form :inline="true" class="filters-form">
        <el-form-item label="权限名称">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入权限项名称或标识"
            clearable
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
          <h2 class="panel-title">权限树</h2>
          <p class="panel-subtitle">当前采用树形结构展示平台、模块、菜单和按钮层级。</p>
        </div>
      </div>

      <el-table
        :key="tableKey"
        :data="filteredMenuData"
        v-loading="loading"
        row-key="id"
        class="permission-table"
        :default-expand-all="expandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="菜单/权限名称" min-width="220" />
        <el-table-column prop="icon" label="图标" width="90" align="center">
          <template #default="scope">
            <span v-if="scope.row.icon" class="icon-cell">
              <el-icon><component :is="scope.row.icon" /></el-icon>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="110" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.type === -1" type="danger">平台</el-tag>
            <el-tag v-else-if="scope.row.type === 0" type="warning">模块</el-tag>
            <el-tag v-else-if="scope.row.type === 1" type="success">菜单</el-tag>
            <el-tag v-else-if="scope.row.type === 2" type="info">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="identification" label="权限标识" min-width="220" />
        <el-table-column prop="path" label="路由地址" min-width="220" />
        <el-table-column prop="comPath" label="组件路径" min-width="220" />
        <el-table-column prop="displayNo" label="排序" width="90" align="center" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleAddSub(scope.row)">新增</el-button>
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, reactive, ref } from 'vue'
import { Lock, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AppPageHeader from '@/components/AppPageHeader.vue'

interface PermissionNode {
  id: string
  name: string
  type: number
  identification: string
  path: string
  icon?: any
  displayNo: number
  comPath?: string
  children?: PermissionNode[]
}

const loading = ref(false)
const expandAll = ref(true)
const tableKey = ref(0)
const queryParams = reactive({
  keyword: '',
})

const menuData = ref<PermissionNode[]>([
  {
    id: '3000000000000000002',
    name: '系统基础设施',
    type: -1,
    identification: 'system',
    path: '/system',
    icon: markRaw(Setting),
    displayNo: 1,
    children: [
      {
        id: '3000000000000000013',
        name: '权限管控',
        type: 0,
        identification: 'system:auth',
        path: '/system/auth',
        icon: markRaw(Lock),
        displayNo: 1,
        children: [
          {
            id: '3000000000000000132',
            name: '权限管理',
            type: 1,
            identification: 'system:auth:permission',
            path: '/system/auth/permission',
            comPath: 'system/auth/permission/index',
            displayNo: 1,
          },
        ],
      },
    ],
  },
])

const countNodes = (nodes: PermissionNode[]): number => {
  return nodes.reduce((sum, node) => {
    return sum + 1 + countNodes(node.children || [])
  }, 0)
}

const filterTree = (nodes: PermissionNode[], keyword: string): PermissionNode[] => {
  if (!keyword.trim()) return nodes

  return nodes.reduce<PermissionNode[]>((result, node) => {
    const children = filterTree(node.children || [], keyword)
    const matched =
      node.name.includes(keyword) ||
      node.identification.includes(keyword) ||
      node.path.includes(keyword)

    if (!matched && children.length === 0) {
      return result
    }

    result.push({
      ...node,
      children: children.length > 0 ? children : undefined,
    })

    return result
  }, [])
}

const filteredMenuData = computed(() => filterTree(menuData.value, queryParams.keyword))
const totalNodes = computed(() => countNodes(filteredMenuData.value))
const headerStats = computed(() => [
  {
    label: '节点总数',
    value: countNodes(menuData.value),
    hint: '平台、模块、菜单和按钮统一收敛',
  },
  {
    label: '模块数量',
    value: menuData.value.flatMap((item) => item.children || []).length,
    hint: '当前已配置的功能分组层级',
  },
  {
    label: '筛选结果',
    value: totalNodes.value,
    hint: queryParams.keyword ? '当前关键字下的匹配节点' : '当前展示全部节点',
  },
  {
    label: '树状态',
    value: expandAll.value ? '展开' : '折叠',
    hint: '便于快速浏览复杂权限结构',
  },
])

const handleSearch = () => {
  ElMessage.success(queryParams.keyword ? '已应用权限筛选' : '正在展示全部权限')
}

const resetQuery = () => {
  queryParams.keyword = ''
  ElMessage.info('已重置筛选条件')
}

const toggleExpand = () => {
  expandAll.value = !expandAll.value
  tableKey.value += 1
}

const handleAdd = () => ElMessage.info('新增顶级节点')
const handleAddSub = (row: PermissionNode) => ElMessage.info(`新增子节点 -> ${row.name}`)
const handleEdit = (row: PermissionNode) => ElMessage.info(`编辑 -> ${row.name}`)
const handleDelete = (row: PermissionNode) => ElMessage.warning(`删除 -> ${row.name}`)
</script>

<style scoped>
.icon-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #e8f0fe;
  color: var(--app-accent-strong);
}

.permission-table :deep(.el-button.is-link) {
  font-weight: 600;
}
</style>
