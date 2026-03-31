import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { ApiPermission, AppMenu, MenuItem } from '@/types/menu'
import request from '@/utils/request'

const MODULES_IMPORT = import.meta.glob('@/views/**/*.vue')

export const usePermissionStore = defineStore('permission', () => {
  const menuList = ref<AppMenu[]>([])
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  const isLoaded = ref(false)
  const permissions = ref<string[]>([])

  const fetchPermissions = async (subsystem?: string): Promise<ApiPermission[]> => {
    const params: Record<string, string> = {}
    if (subsystem) {
      params.subsystem = subsystem
    }
    const data = await request.get<unknown, ApiPermission[]>('/apis/v1/permissions', { params })
    return data
  }

  const transformMenus = (apiData: ApiPermission[]): AppMenu[] => {
    const filteredData = filterMenuData(apiData)
    const sortedData = sortByDisplayNo(filteredData)
    return buildMenuTree(sortedData)
  }

  const filterMenuData = (data: ApiPermission[]): ApiPermission[] => {
    return data.filter((item) => item.type === 0 || item.type === 1)
  }

  const sortByDisplayNo = (data: ApiPermission[]): ApiPermission[] => {
    return [...data].sort((a, b) => a.displayNo - b.displayNo)
  }

  const buildMenuTree = (data: ApiPermission[]): AppMenu[] => {
    const map = new Map<string, AppMenu>()
    const roots: AppMenu[] = []

    data.forEach((item) => {
      const menu = transformSingleMenu(item)
      map.set(item.id, menu)
    })

    data.forEach((item) => {
      const menu = map.get(item.id)!
      const parentId = item.parentId
      if (parentId === '0' || parentId === 'null' || !parentId) {
        roots.push(menu)
      } else {
        const parent = map.get(parentId)
        if (parent) {
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(menu)
        }
      }
    })

    setRedirectForParent(roots)
    return roots
  }

  const transformSingleMenu = (item: ApiPermission): AppMenu => {
    const isExternal = item.isFrame === 1
    const isHidden = item.remark?.includes('hidden') ?? false

    const menu: AppMenu = {
      id: item.id,
      name: item.identification || item.name,
      path: normalizePath(item.path, isExternal),
      meta: {
        title: item.name,
        icon: item.iconStr || undefined,
        hidden: isHidden,
        keepAlive: false,
        permission: item.identification,
        isExternal,
        requiresAuth: true,
      },
    }

    if (!isExternal && item.comPath) {
      menu.component = loadComponent(item.comPath)
    }

    return menu
  }

  const normalizePath = (path: string, isExternal: boolean): string => {
    if (isExternal) {
      return path.startsWith('http') ? path : `https://${path}`
    }
    return path.startsWith('/') ? path : `/${path}`
  }

  const loadComponent = (comPath: string): (() => Promise<unknown>) | undefined => {
    const componentPath = `/src/views/${comPath}.vue`
    if (MODULES_IMPORT[componentPath]) {
      return MODULES_IMPORT[componentPath] as () => Promise<unknown>
    }
    console.warn(`Component not found: ${componentPath}`)
    return undefined
  }

  const setRedirectForParent = (menus: AppMenu[]): void => {
    menus.forEach((menu) => {
      if (menu.children && menu.children.length > 0) {
        setRedirectForParent(menu.children)
        const firstChild = menu.children[0]
        if (firstChild && !firstChild.meta.isExternal) {
          menu.redirect = firstChild.path
        }
      }
    })
  }

  const generateRoutes = (menus: AppMenu[]): RouteRecordRaw[] => {
    const routes: RouteRecordRaw[] = menus.map((menu) => convertToRoute(menu))
    return routes
  }

  const convertToRoute = (menu: AppMenu): RouteRecordRaw => {
    const route = {
      path: menu.path,
      name: menu.name,
      meta: menu.meta,
      component: menu.component,
      redirect: menu.redirect,
      children: menu.children?.map((child) => convertToRoute(child)),
    }

    return route as unknown as RouteRecordRaw
  }

  const appMenuToMenuItem = (menus: AppMenu[]): MenuItem[] => {
    return menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      path: menu.path,
      icon: menu.meta.icon,
      title: menu.meta.title,
      hidden: menu.meta.hidden,
      external: menu.meta.isExternal,
      permission: menu.meta.permission,
      keepAlive: menu.meta.keepAlive,
      children: menu.children ? appMenuToMenuItem(menu.children) : undefined,
    }))
  }

  const extractPermissions = (menus: AppMenu[]): string[] => {
    const perms: string[] = []
    const extract = (items: AppMenu[]) => {
      items.forEach((item) => {
        if (item.meta.permission) {
          perms.push(item.meta.permission)
        }
        if (item.children) {
          extract(item.children)
        }
      })
    }
    extract(menus)
    return perms
  }

  const clearPermission = (): void => {
    menuList.value = []
    dynamicRoutes.value = []
    isLoaded.value = false
    permissions.value = []
  }

  const setMenuList = (menus: AppMenu[]): void => {
    menuList.value = menus
  }

  const setDynamicRoutes = (routes: RouteRecordRaw[]): void => {
    dynamicRoutes.value = routes
  }

  const setLoaded = (loaded: boolean): void => {
    isLoaded.value = loaded
  }

  const setPermissions = (perms: string[]): void => {
    permissions.value = perms
  }

  return {
    menuList,
    dynamicRoutes,
    isLoaded,
    permissions,
    fetchPermissions,
    transformMenus,
    generateRoutes,
    appMenuToMenuItem,
    extractPermissions,
    clearPermission,
    setMenuList,
    setDynamicRoutes,
    setLoaded,
    setPermissions,
  }
})
