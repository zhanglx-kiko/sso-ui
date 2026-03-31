export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
} as const

export const TOKEN_HEADER_KEY = 'token'

export const TOKEN_EXPIRED_KEYWORDS = ['token 已被冻结', 'token已被冻结', 'token expired', 'token invalid'] as const

export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  SUCCESS: 200,
} as const

export const BIZ_CODE = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  TOKEN_EXPIRED: 1001,
} as const

export const ROUTE_WHITE_LIST = ['/login', '/404'] as const
