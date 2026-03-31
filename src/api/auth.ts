import request from '@/utils/request'
import type {
  LoginDTO,
  LoginVO,
  UserDTO,
  UserQueryDTO,
  UserPasswordDTO,
  PageResult,
} from '@/types/auth'

// 1. 登录
export const loginApi = (data: LoginDTO) => {
  return request.post<unknown, LoginVO>('/apis/v1/auth/login', data)
}

// 2. 注销
export const logoutApi = () => {
  return request.post<unknown, void>('/apis/v1/auth/logout')
}

// 3. 用户列表 (分页)
export const getUserListApi = (data: UserQueryDTO) => {
  return request.post<unknown, PageResult<UserDTO>>('/apis/v1/user/list', data)
}

// 4. 新增用户
export const addUserApi = (data: UserDTO) => {
  return request.post<unknown, void>('/apis/v1/user/add', data)
}

// 5. 修改基本信息
export const updateUserInfoApi = (data: UserDTO) => {
  return request.post<unknown, void>('/apis/v1/user/update/info', data)
}

// 6. 删除用户 (注意后端是 DELETE 方法)
export const removeUserApi = (userId: string) => {
  return request.delete<unknown, void>(`/apis/v1/user/remove/${userId}`)
}

// 7. 个人修改密码
export const updatePasswordApi = (data: UserPasswordDTO) => {
  return request.post<unknown, void>('/apis/v1/auth/user/update/password', data)
}

// 8. 管理员重置密码
export const resetPasswordApi = (userId: string) => {
  return request.post<unknown, void>(`/apis/v1/auth/user/reset-password/${userId}`)
}
