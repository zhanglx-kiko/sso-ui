import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { getPermissionsByIdentificationApi } from '@/api/permission'
import { useUserStore } from '@/stores/user'
import type { ApiPermission, AppMenu, MenuItem } from '@/types/menu'

// 使用 Vite 提供的 import.meta.glob 批量静态导入所有视图组件
const viewModules = import.meta.glob('../views/**/*.vue')

export const usePermissionStore = defineStore('permission', () => {
  const isLoaded = ref(false)
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  const menuList = ref<AppMenu[]>([])
  const permissions = ref<string[]>([]) // 存放按钮级权限标识

  /**
   * 工具方法：将扁平的权限列表转换为树形结构
   * @param list 扁平权限数组
   * @returns 树形权限数组
   */
  const listToTree = (list: ApiPermission[]): ApiPermission[] => {
    const map: Record<string, ApiPermission> = {}
    const roots: ApiPermission[] = []

    // 1. 将所有节点存入 map，并初始化 children
    list.forEach((item) => {
      map[item.id] = { ...item, children: [] }
    })

    // 2. 遍历组装树形结构
    list.forEach((item) => {
      const node = map[item.id]
      // 假设 parentId 为 '0' 或 null/undefined 时表示根节点
      if (item.parentId && String(item.parentId) !== '0' && map[item.parentId]) {
        map[item.parentId].children?.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  /**
   * 工具方法：从扁平列表中提取所有按钮级别的权限标识 (假设 type === 3 为按钮)
   */
  const extractButtonPermissions = (flatList: ApiPermission[]): string[] => {
    return flatList
      .filter((item) => item.type === 3 && item.identification)
      .map((item) => item.identification)
  }

  /**
   * 1. 从后端获取当前登录用户的扁平权限数据，并处理成树形结构
   */
  const fetchPermissions = async (): Promise<ApiPermission[]> => {
    try {
      const userStore = useUserStore()
      const username = userStore.userInfo?.username

      if (!username) {
        console.error('未获取到当前登录用户的 username，无法拉取菜单权限')
        return []
      }

      // 调用接口获取该用户所有的权限项（扁平数组）
      // 1. 不传 identifications，全量拉取当前用户所有权限
      const allFlatList = await getPermissionsByIdentificationApi({ username })

      if (!allFlatList || allFlatList.length === 0) return []

      // 2. 前端过滤：只保留 identityLineage 包含 'system' 的节点（即该平台及其所有子节点）
      const flatList = allFlatList.filter(
        (item) => item.identityLineage && item.identityLineage.startsWith('system'),
      )

      if (!flatList || flatList.length === 0) {
        return []
      }

      // 提取并保存按钮级权限（给页面中的操作按钮鉴权用，如 v-auth 指令）
      const btnPerms = extractButtonPermissions(flatList)
      setPermissions(btnPerms)

      // 将扁平数组转换为树形结构并返回
      return listToTree(flatList)
    } catch (error) {
      console.error('获取用户权限菜单失败:', error)
      return []
    }
  }

  /**
   * 2. 将后端的 ApiPermission 树转换为前端中转的 AppMenu 树格式
   */
  const transformMenus = (nodes: ApiPermission[]): AppMenu[] => {
    const buildMenu = (treeNodes: ApiPermission[]): AppMenu[] => {
      return (
        treeNodes
          // 过滤掉按钮类型，只保留目录(1)和菜单(2)
          .filter((node) => node.type !== 3)
          .map((node) => {
            const menu: AppMenu = {
              id: node.id,
              // 路由 name 必须唯一，优先使用 identification，没有则使用 path 转换
              name: node.identification || node.path.replace(/\//g, '') || `Menu_${node.id}`,
              path: node.path,
              meta: {
                title: node.name,
                icon: node.iconStr,
                hidden: node.isFrame === 1, // 根据后端的 isFrame 控制是否隐藏
                permission: node.identification,
              },
            }

            // 记录前端组件的文件路径，以供生成 Vue Router 使用
            if (node.comPath) {
              ;(menu as any).componentPath = node.comPath
            }

            if (node.children && node.children.length > 0) {
              menu.children = buildMenu(node.children)
            }

            return menu
          })
      )
    }

    return buildMenu(nodes)
  }

  /**
   * 3. 将 AppMenu 树转换为 Vue Router 可注册的 RouteRecordRaw 路由数组
   */
  const generateRoutes = (menus: AppMenu[]): RouteRecordRaw[] => {
    return menus.map((menu) => {
      const route: RouteRecordRaw = {
        path: menu.path.startsWith('/') ? menu.path : `/${menu.path}`,
        name: menu.name,
        meta: menu.meta,
        children: [],
      }

      const componentPath = (menu as any).componentPath
      if (componentPath) {
        // 如果后端配置了组件路径，例如 "system/MenuMgr" 或者 "system/MenuMgr.vue"
        const cleanPath = componentPath.replace('.vue', '')
        const matchKey = `../views/${cleanPath}.vue`

        // 从 import.meta.glob 中匹配懒加载函数，找不到则退化到 404 页面
        route.component = viewModules[matchKey] || (() => import('@/views/error/NotFound.vue'))
      }

      if (menu.children && menu.children.length > 0) {
        route.children = generateRoutes(menu.children)
      }

      return route
    })
  }

  /**
   * 4. 将 AppMenu 树转换为 左侧菜单栏 (AppSidebar) 需要的 MenuItem 数组
   */
  const appMenuToMenuItem = (menus: AppMenu[]): MenuItem[] => {
    return menus.map((menu) => {
      const item: MenuItem = {
        id: menu.id,
        name: menu.name,
        path: menu.path,
        title: menu.meta.title,
        icon: menu.meta.icon,
        hidden: menu.meta.hidden,
        permission: menu.meta.permission,
        children: [],
      }

      if (menu.children && menu.children.length > 0) {
        item.children = appMenuToMenuItem(menu.children)
      }

      return item
    })
  }

  /**
   * 5. 这个方法已经在 fetchPermissions 中通过 extractButtonPermissions 完成了，
   * 留一个空实现或别名以兼容 router/index.ts 的调用逻辑。
   */
  const extractPermissions = (menus: AppMenu[]): string[] => {
    return permissions.value
  }

  // ============== State 变更方法 ==============

  const setMenuList = (menus: AppMenu[]) => {
    menuList.value = menus
  }

  const setDynamicRoutes = (routes: RouteRecordRaw[]) => {
    dynamicRoutes.value = routes
  }

  const setPermissions = (perms: string[]) => {
    permissions.value = perms
  }

  const setLoaded = (loaded: boolean) => {
    isLoaded.value = loaded
  }

  const clearPermission = () => {
    menuList.value = []
    dynamicRoutes.value = []
    permissions.value = []
    isLoaded.value = false
  }

  return {
    isLoaded,
    dynamicRoutes,
    menuList,
    permissions,
    fetchPermissions,
    transformMenus,
    generateRoutes,
    appMenuToMenuItem,
    extractPermissions,
    setMenuList,
    setDynamicRoutes,
    setPermissions,
    setLoaded,
    clearPermission,
  }
})
