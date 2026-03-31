<template>
  <div class="sidebar" :class="{ 'is-collapse': isCollapse }">
    <div class="sidebar-logo">
      <div class="logo-content">
        <el-icon class="logo-icon" :size="28">
          <Platform />
        </el-icon>
        <transition name="fade">
          <span v-show="!isCollapse" class="logo-text">SSO 管理平台</span>
        </transition>
      </div>
    </div>

    <el-scrollbar class="sidebar-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <SidebarItem
          v-for="menu in menuList"
          :key="menu.id"
          :item="menu"
          :base-path="menu.path"
        />
      </el-menu>
    </el-scrollbar>

    <div class="sidebar-footer">
      <el-tooltip
        :content="isCollapse ? '展开菜单' : '收起菜单'"
        placement="right"
        :disabled="!isCollapse"
      >
        <div class="collapse-btn" @click="toggleCollapse">
          <el-icon :size="18">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import { Platform, Fold, Expand } from '@element-plus/icons-vue'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const menuStore = useMenuStore()

const isCollapse = computed(() => menuStore.isCollapse)
const activeMenu = computed(() => menuStore.activeMenu || route.path)
const menuList = computed(() => menuStore.menuList)

const toggleCollapse = () => {
  menuStore.toggleCollapse()
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  height: 100%;
  background-color: #304156;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar.is-collapse {
  width: 64px;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
  border-bottom: 1px solid #1f2d3d;
  overflow: hidden;
}

.logo-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  white-space: nowrap;
}

.logo-icon {
  color: #409eff;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.sidebar-scrollbar {
  flex: 1;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
  background-color: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #bfcbd9;
  --el-menu-active-color: #409eff;
  --el-menu-hover-bg-color: #263445;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #263445 !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #409eff !important;
  color: #fff !important;
}

:deep(.el-sub-menu .el-menu-item) {
  padding-left: 50px !important;
  background-color: #1f2d3d;
}

:deep(.el-sub-menu .el-menu-item:hover) {
  background-color: #263445 !important;
}

:deep(.el-sub-menu .el-menu-item.is-active) {
  background-color: #409eff !important;
}

.sidebar-footer {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #1f2d3d;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  color: #bfcbd9;
  transition: all 0.3s;
}

.collapse-btn:hover {
  background-color: #263445;
  color: #409eff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
