<template>
  <div class="header">
    <div class="header-left">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path || item.title">
          <span v-if="!item.path" class="breadcrumb-text">{{ item.title }}</span>
          <router-link v-else :to="item.path" class="breadcrumb-link">
            {{ item.title }}
          </router-link>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
      <el-tooltip content="全屏" placement="bottom">
        <div class="header-action" @click="toggleFullscreen">
          <el-icon :size="18">
            <FullScreen />
          </el-icon>
        </div>
      </el-tooltip>

      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-dropdown">
          <el-avatar :size="32" :src="userInfo?.avatar" class="user-avatar">
            <el-icon :size="18"><UserFilled /></el-icon>
          </el-avatar>
          <span class="user-name">{{ userInfo?.nickname || userInfo?.username || '用户' }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'
import { usePermissionStore } from '@/stores/permission'
import { resetRouter } from '@/router'
import { cancelAllRequests, setLoggingOut } from '@/utils/request'
import { logoutApi } from '@/api/auth'
import {
  FullScreen,
  UserFilled,
  ArrowDown,
  User,
  Lock,
  SwitchButton,
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const menuStore = useMenuStore()
const permissionStore = usePermissionStore()

const userInfo = computed(() => userStore.userInfo)
const breadcrumbs = computed(() => menuStore.breadcrumbs)

const isLoggingOut = ref(false)

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中')
      break
    case 'password':
      ElMessage.info('修改密码功能开发中')
      break
    case 'logout':
      if (isLoggingOut.value) return

      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })

        isLoggingOut.value = true
        setLoggingOut(true)

        cancelAllRequests()

        userStore.clearAll()
        permissionStore.clearPermission()
        menuStore.clearMenu()
        resetRouter()

        try {
          await logoutApi()
        } catch {
          // ignore
        }

        ElMessage.success('已退出登录')
        router.push('/login')
      } catch {
        // 用户取消
      } finally {
        isLoggingOut.value = false
        setLoggingOut(false)
      }
      break
  }
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.breadcrumb-text {
  color: #606266;
}

.breadcrumb-link {
  color: #303133;
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s;
}

.header-action:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background-color: #409eff;
}

.user-name {
  font-size: 14px;
  color: #303133;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  color: #909399;
  transition: transform 0.3s;
}

.user-dropdown:hover .dropdown-icon {
  transform: rotate(180deg);
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
