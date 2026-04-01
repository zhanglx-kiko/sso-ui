import request from '@/utils/request'
import type { LoginDTO, LoginVO, UserPasswordDTO } from '@/types/auth'

// 1. 账号密码登录
export const loginApi = (data: LoginDTO) => {
  return request.post<unknown, LoginVO>('/apis/v1/auth/login', data)
}

// 2. 微信授权登录
export const wechatLoginApi = (code: string) => {
  return request.post<unknown, LoginVO>(`/apis/v1/auth/wechat/login?code=${code}`)
}

// 3. 注销
export const logoutApi = () => {
  return request.post<unknown, void>('/apis/v1/auth/logout')
}

// 4. 查询当前登录状态 (测试用)
export const isLoginApi = () => {
  return request.get<unknown, string>('/apis/v1/auth/isLogin')
}

// 5. 个人修改密码 (需登录)
export const updatePasswordApi = (data: UserPasswordDTO) => {
  return request.post<unknown, void>('/apis/v1/auth/user/update/password', data)
}

// 6. 管理员重置密码
export const resetPasswordApi = (userId: string) => {
  return request.post<unknown, void>(`/apis/v1/auth/user/reset-password/${userId}`)
}
