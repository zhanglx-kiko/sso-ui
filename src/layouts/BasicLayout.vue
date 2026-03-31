<template>
  <div class="basic-layout">
    <Sidebar />
    <div class="layout-main" :class="{ 'is-collapse': isCollapse }">
      <Header />
      <div class="layout-content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import Sidebar from './components/AppSidebar.vue'
import Header from './components/AppHeader.vue'

const route = useRoute()
const menuStore = useMenuStore()

const isCollapse = computed(() => menuStore.isCollapse)
const cachedViews = ref<string[]>([])

provide('isCollapse', isCollapse)

watch(
  () => route.path,
  (path) => {
    menuStore.setActiveMenu(path)
  },
  { immediate: true }
)
</script>

<style scoped>
.basic-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.layout-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 220px;
  transition: margin-left 0.3s ease;
  overflow: hidden;
}

.layout-main.is-collapse {
  margin-left: 64px;
}

.layout-content {
  flex: 1;
  padding: 20px;
  background-color: #f0f2f5;
  overflow: auto;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
