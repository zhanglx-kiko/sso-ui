import request from '@/utils/request'
// 假设您的类型定义文件在 @/types/role
// import type { RoleDTO, RoleInfoVO, RolePermissionRelationshipMappingDTO, PageQuery, PageResult } from '@/types/role'

// 1. 新增角色
export const addRoleApi = (data: any) => {
  return request.post<unknown, any>('/apis/v1/roles', data)
}

// 2. 修改角色信息
export const updateRoleApi = (id: string | number, data: any) => {
  return request.put<unknown, any>(`/apis/v1/roles/${id}`, data)
}

// 3. 删除角色（单个）
export const delRoleApi = (id: string | number) => {
  return request.delete<unknown, any>(`/apis/v1/roles/${id}`)
}

// 4. 批量删除角色
export const batchDelRoleApi = (idList: Array<string | number>) => {
  return request.delete<unknown, void>('/apis/v1/roles/batch', { data: idList })
}

// 5. 分页查询角色列表
export const getRolePageApi = (data: any) => {
  return request.post<unknown, any>('/apis/v1/roles/page', data)
}

// 6. 获取角色详情
export const getRoleDetailApi = (roleId: string | number) => {
  return request.get<unknown, any>(`/apis/v1/roles/${roleId}`)
}

// 7. 获取角色详情（包含关联用户 ID 列表）
export const getRoleWithUsersApi = (roleId: string | number) => {
  return request.get<unknown, any>(`/apis/v1/roles/${roleId}/users`)
}

// 8. 为角色绑定用户
export const bindUsersToRoleApi = (roleId: string | number, userIds: Array<string | number>) => {
  return request.post<unknown, any>(`/apis/v1/roles/${roleId}/users`, userIds)
}

// 9. 为角色分配权限
export const associatePermissionsApi = (roleId: string | number, permissions: any[]) => {
  return request.post<unknown, any>(`/apis/v1/roles/${roleId}/permissions`, permissions)
}

// 10. 查询当前登录用户的角色列表
export const getMyRolesApi = () => {
  return request.get<unknown, any[]>('/apis/v1/roles/my-roles')
}

// 11. 根据用户 ID 查询用户关联的角色列表
export const getRolesByUserIdApi = (userId: string | number) => {
  return request.get<unknown, any[]>(`/apis/v1/roles/user/${userId}`)
}
