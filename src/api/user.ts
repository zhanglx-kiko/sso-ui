import request from '@/utils/request'
import type { UserDTO, UserQueryDTO, PageResult } from '@/types/auth' // 请根据您的实际类型路径调整

// 1. 分页查询用户列表
export const getUserListApi = (data: UserQueryDTO) => {
  return request.post<unknown, PageResult<UserDTO>>('/apis/v1/user/list', data)
}

// 2. 新增用户
export const addUserApi = (data: UserDTO) => {
  return request.post<unknown, void>('/apis/v1/user/add', data)
}

// 3. 更新用户基本信息
export const updateUserInfoApi = (data: UserDTO) => {
  return request.post<unknown, void>('/apis/v1/user/update/info', data)
}

// 4. 删除用户
export const removeUserApi = (userId: string | number) => {
  return request.delete<unknown, void>(`/apis/v1/user/remove/${userId}`)
}
