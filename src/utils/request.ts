import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { useMenuStore } from '@/stores/menu'
import router from '@/router'
import { TOKEN_EXPIRED_KEYWORDS, ROUTE_WHITE_LIST, HTTP_STATUS, BIZ_CODE } from '@/constants'

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

const pendingRequests = new Map<string, AbortController>()

const generateRequestKey = (config: InternalAxiosRequestConfig): string => {
  const { method, url } = config
  return `${method}-${url}`
}

const addPendingRequest = (config: InternalAxiosRequestConfig): void => {
  const key = generateRequestKey(config)
  if (pendingRequests.has(key)) {
    const controller = pendingRequests.get(key)
    controller?.abort()
  }
  const controller = new AbortController()
  config.signal = controller.signal
  pendingRequests.set(key, controller)
}

const removePendingRequest = (config: InternalAxiosRequestConfig): void => {
  const key = generateRequestKey(config)
  pendingRequests.delete(key)
}

const cancelAllPendingRequests = (): void => {
  pendingRequests.forEach((controller) => {
    controller.abort()
  })
  pendingRequests.clear()
}

let isRedirecting = false
let isLoggingOut = false

const isTokenExpiredError = (message: string): boolean => {
  if (!message) return false
  const lowerMessage = message.toLowerCase()
  return TOKEN_EXPIRED_KEYWORDS.some((keyword) => lowerMessage.includes(keyword.toLowerCase()))
}

const isWhiteListPage = (): boolean => {
  const currentPath = router.currentRoute.value.path
  return (ROUTE_WHITE_LIST as readonly string[]).includes(currentPath)
}

const isLogoutRequest = (config?: InternalAxiosRequestConfig): boolean => {
  if (!config) return false
  const url = config.url || ''
  return url.includes('/logout') || url.includes('/apis/v1/auth/logout')
}

const handleTokenExpired = (skipMessage = false): void => {
  if (isRedirecting) return
  isRedirecting = true

  cancelAllPendingRequests()

  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const menuStore = useMenuStore()

  userStore.clearAll()
  permissionStore.clearPermission()
  menuStore.clearMenu()

  if (!skipMessage && !isWhiteListPage()) {
    ElMessage.error('登录已过期，请重新登录')
  }

  const currentPath = router.currentRoute.value.path

  if (!isWhiteListPage()) {
    router.push({
      path: '/login',
      query: { redirect: currentPath },
    })
  }

  setTimeout(() => {
    isRedirecting = false
  }, 1000)
}

export const setLoggingOut = (value: boolean): void => {
  isLoggingOut = value
}

export const getLoggingOut = (): boolean => {
  return isLoggingOut
}

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    addPendingRequest(config)

    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['token'] = userStore.token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    removePendingRequest(response.config as InternalAxiosRequestConfig)

    const res = response.data
    const config = response.config as InternalAxiosRequestConfig

    if (res.code === BIZ_CODE.SUCCESS) {
      return res.data
    }

    if (isLoggingOut && isLogoutRequest(config)) {
      return Promise.reject(new Error(res.msg || 'Error'))
    }

    if (res.code === BIZ_CODE.UNAUTHORIZED || res.code === BIZ_CODE.TOKEN_EXPIRED) {
      handleTokenExpired(isLoggingOut || isWhiteListPage())
      return Promise.reject(new Error('Token已过期'))
    }

    if (isTokenExpiredError(res.msg)) {
      handleTokenExpired(isLoggingOut || isWhiteListPage())
      return Promise.reject(new Error('Token已过期'))
    }

    if (!isWhiteListPage()) {
      ElMessage.error(res.msg || '系统错误')
    }
    return Promise.reject(new Error(res.msg || 'Error'))
  },
  (error) => {
    removePendingRequest(error.config as InternalAxiosRequestConfig)

    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    const config = error.config as InternalAxiosRequestConfig

    if (isLoggingOut && isLogoutRequest(config)) {
      return Promise.reject(error)
    }

    const status = error.response?.status

    if (status === HTTP_STATUS.UNAUTHORIZED) {
      handleTokenExpired(isLoggingOut || isWhiteListPage())
      return Promise.reject(error)
    }

    const errorMessage = error.response?.data?.msg || error.message || '网络异常'

    if (isTokenExpiredError(errorMessage)) {
      handleTokenExpired(isLoggingOut || isWhiteListPage())
      return Promise.reject(error)
    }

    if (!isWhiteListPage()) {
      ElMessage.error(errorMessage)
    }
    return Promise.reject(error)
  },
)

export const cancelRequest = (config: InternalAxiosRequestConfig): void => {
  const key = generateRequestKey(config)
  if (pendingRequests.has(key)) {
    const controller = pendingRequests.get(key)
    controller?.abort()
    pendingRequests.delete(key)
  }
}

export const cancelAllRequests = cancelAllPendingRequests

export default service
