<template>
  <template v-if="!item.hidden">
    <template v-if="hasChildren">
      <el-sub-menu :index="resolvePath(item.path)" :popper-class="'sidebar-popper'">
        <template #title>
          <el-icon v-if="item.icon">
            <component :is="getIcon(item.icon)" />
          </el-icon>
          <span>{{ item.title }}</span>
          <el-badge v-if="item.badge" :value="item.badge" class="menu-badge" :max="99" />
        </template>
        <SidebarItem
          v-for="child in visibleChildren"
          :key="child.id"
          :item="child"
          :base-path="resolvePath(item.path)"
        />
      </el-sub-menu>
    </template>

    <template v-else>
      <el-tooltip v-if="isCollapse" :content="item.title" placement="right" :show-after="300">
        <component
          :is="externalLink ? 'a' : 'router-link'"
          :to="!externalLink ? resolvePath(item.path) : undefined"
          :href="externalLink ? resolvePath(item.path) : undefined"
          :target="externalLink ? '_blank' : undefined"
          class="menu-link"
        >
          <el-menu-item :index="resolvePath(item.path)">
            <el-icon v-if="item.icon">
              <component :is="getIcon(item.icon)" />
            </el-icon>
            <template #title>
              <span>{{ item.title }}</span>
              <el-badge v-if="item.badge" :value="item.badge" class="menu-badge" :max="99" />
            </template>
          </el-menu-item>
        </component>
      </el-tooltip>

      <component
        v-else
        :is="externalLink ? 'a' : 'router-link'"
        :to="!externalLink ? resolvePath(item.path) : undefined"
        :href="externalLink ? resolvePath(item.path) : undefined"
        :target="externalLink ? '_blank' : undefined"
        class="menu-link"
      >
        <el-menu-item :index="resolvePath(item.path)">
          <el-icon v-if="item.icon">
            <component :is="getIcon(item.icon)" />
          </el-icon>
          <template #title>
            <span>{{ item.title }}</span>
            <el-badge v-if="item.badge" :value="item.badge" class="menu-badge" :max="99" />
          </template>
        </el-menu-item>
      </component>
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed, inject, unref, type Component } from 'vue'
import type { MenuItem } from '@/types/menu'
import {
  House,
  User,
  Setting,
  Document,
  DataAnalysis,
  Message,
  Bell,
  Calendar,
  Folder,
  Grid,
  List,
  Monitor,
  PieChart,
  ShoppingCart,
  Tickets,
  Timer,
  Trophy,
  Van,
  Wallet,
  WarnTriangleFilled,
  ChatDotRound,
  Cpu,
  Connection,
  Link as LinkIcon,
  Lock,
  Shop,
  Present,
} from '@element-plus/icons-vue'

interface Props {
  item: MenuItem
  basePath?: string
}

const props = withDefaults(defineProps<Props>(), {
  basePath: '',
})

const injectedCollapse = inject('isCollapse', false)
const isCollapse = computed(() => Boolean(unref(injectedCollapse)))

const iconMap: Record<string, Component> = {
  House,
  User,
  Setting,
  Document,
  DataAnalysis,
  Message,
  Bell,
  Calendar,
  Folder,
  ChartPie: PieChart,
  Grid,
  List,
  Monitor,
  PieChart,
  ShoppingCart,
  Tickets,
  Timer,
  Trophy,
  Van,
  Wallet,
  WarnTriangleFilled,
  ChatDotRound,
  Cpu,
  Connection,
  Link: LinkIcon,
  Lock,
  Shop,
  Present,
  lock: Lock,
  setting: Setting,
  shop: Shop,
  'shopping-cart': ShoppingCart,
  present: Present,
  document: Document,
}

const getIcon = (iconName: string): Component => {
  return iconMap[iconName] || Document
}

const resolvePath = (routePath: string): string => {
  if (isExternal(routePath)) {
    return routePath
  }
  if (routePath.startsWith('/')) {
    return routePath
  }
  if (isExternal(props.basePath)) {
    return props.basePath
  }
  const base = props.basePath.endsWith('/') ? props.basePath.slice(0, -1) : props.basePath
  const path = routePath.startsWith('/') ? routePath : `/${routePath}`
  return base ? `${base}${path}` : path
}

const isExternal = (path: string): boolean => {
  return /^(https?:|mailto:|tel:)/.test(path)
}

const externalLink = computed(() => {
  return props.item.external || isExternal(props.item.path)
})

const visibleChildren = computed(() => {
  if (!props.item.children) return []
  return props.item.children.filter((child) => !child.hidden)
})

const hasChildren = computed(() => {
  return visibleChildren.value.length > 0
})
</script>

<style scoped>
.menu-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.menu-badge {
  margin-left: 8px;
}

:deep(.el-badge__content) {
  transform: scale(0.86);
  border: none;
  box-shadow: none;
}
</style>
