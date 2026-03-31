import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { useMenuStore } from '@/stores/menu'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import type { MenuItem } from '@/types/menu'
import { ROUTE_WHITE_LIST } from '@/constants'

NProgress.configure({ showSpinner: false })

export const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/AuthLogin.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
]

export const layoutRoute: RouteRecordRaw = {
  path: '/',
  name: 'Layout',
  component: () => import('@/layouts/BasicLayout.vue'),
  redirect: '/dashboard',
  children: [],
}

export const fallbackMenus: MenuItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'PieChart',
    title: '仪表盘',
  },
  {
    id: 'users',
    name: 'UserMgr',
    path: '/users',
    icon: 'User',
    title: '用户管理',
  },
  {
    id: 'system',
    name: 'System',
    path: '/system',
    icon: 'Setting',
    title: '系统管理',
    children: [
      {
        id: 'system-menu',
        name: 'MenuMgr',
        path: '/system/menu',
        icon: 'List',
        title: '菜单管理',
      },
      {
        id: 'system-role',
        name: 'RoleMgr',
        path: '/system/role',
        icon: 'User',
        title: '角色管理',
      },
    ],
  },
]

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: staticRoutes,
})

const addDynamicRoutes = (routes: RouteRecordRaw[]): void => {
  routes.forEach((route) => {
    if (!router.hasRoute(route.name as string)) {
      router.addRoute('Layout', route)
    }
  })

  if (!router.hasRoute('CatchAll')) {
    router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'CatchAll',
      redirect: '/404',
    })
  }
}

const initDynamicRoutes = async (): Promise<MenuItem[]> => {
  const permissionStore = usePermissionStore()
  const menuStore = useMenuStore()

  try {
    const apiData = await permissionStore.fetchPermissions()

    if (!apiData || apiData.length === 0) {
      console.warn('No permission data from API, using fallback menus')
      return initFallbackRoutes()
    }

    const menus = permissionStore.transformMenus(apiData)
    const routes = permissionStore.generateRoutes(menus)
    const menuItems = permissionStore.appMenuToMenuItem(menus)
    const perms = permissionStore.extractPermissions(menus)

    permissionStore.setMenuList(menus)
    permissionStore.setDynamicRoutes(routes)
    permissionStore.setPermissions(perms)
    permissionStore.setLoaded(true)

    menuStore.setMenuList(menuItems)

    addDynamicRoutes(routes)

    return menuItems
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    return initFallbackRoutes()
  }
}

const initFallbackRoutes = (): MenuItem[] => {
  const permissionStore = usePermissionStore()
  const menuStore = useMenuStore()

  const fallbackRoutes: RouteRecordRaw[] = [
    {
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: '仪表盘', requiresAuth: true },
    },
    {
      path: 'users',
      name: 'UserMgr',
      component: () => import('@/views/UserMgr.vue'),
      meta: { title: '用户管理', requiresAuth: true },
    },
    {
      path: 'system',
      name: 'System',
      redirect: '/system/menu',
      meta: { title: '系统管理', requiresAuth: true },
      children: [
        {
          path: 'menu',
          name: 'MenuMgr',
          component: () => import('@/views/system/MenuMgr.vue'),
          meta: { title: '菜单管理', requiresAuth: true },
        },
        {
          path: 'role',
          name: 'RoleMgr',
          component: () => import('@/views/system/RoleMgr.vue'),
          meta: { title: '角色管理', requiresAuth: true },
        },
      ],
    },
  ]

  permissionStore.setDynamicRoutes(fallbackRoutes)
  permissionStore.setLoaded(true)
  menuStore.setMenuList(fallbackMenus)

  addDynamicRoutes(fallbackRoutes)

  return fallbackMenus
}

const isWhiteListPage = (path: string): boolean => {
  return ROUTE_WHITE_LIST.includes(path as (typeof ROUTE_WHITE_LIST)[number])
}

router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const hasToken = userStore.hasToken()

  if (to.meta.title) {
    document.title = `${to.meta.title} - 后台管理系统`
  }

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      if (!permissionStore.isLoaded) {
        router.addRoute(layoutRoute)
        await initDynamicRoutes()
        next({ ...to, replace: true })
      } else {
        next()
      }
    }
  } else {
    if (isWhiteListPage(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export const resetRouter = (): void => {
  const permissionStore = usePermissionStore()
  const dynamicRoutes = permissionStore.dynamicRoutes

  dynamicRoutes.forEach((route) => {
    if (route.name && router.hasRoute(route.name)) {
      router.removeRoute(route.name)
    }
  })

  if (router.hasRoute('CatchAll')) {
    router.removeRoute('CatchAll')
  }

  if (router.hasRoute('Layout')) {
    router.removeRoute('Layout')
  }

  permissionStore.clearPermission()
}

export default router
