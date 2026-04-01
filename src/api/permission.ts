import request from '@/utils/request'
import type {
  PermissionDTO,
  PermissionVO,
  ImportProgressDTO,
  ExportProgressDTO,
  PermissionQueryDTO,
} from '@/types/permission'

// 1. 新增权限项
export const addPermissionApi = (data: any) => {
  return request.post<unknown, any>('/apis/v1/permissions', data)
}

// 2. 修改权限项
export const updatePermissionApi = (id: string | number, data: any) => {
  return request.put<unknown, any>(`/apis/v1/permissions/${id}`, data)
}

// 3. 删除权限项（单个）
export const delPermissionApi = (id: string | number) => {
  return request.delete<unknown, any>(`/apis/v1/permissions/${id}`)
}

// 4. 批量删除权限项
export const batchDelPermissionApi = (idList: Array<string | number>) => {
  return request.delete<unknown, any[]>('/apis/v1/permissions/batch', { data: idList })
}

// 5. 查询权限树形列表
export const getPermissionTreeApi = (searchKey?: string) => {
  return request.get<unknown, any[]>('/apis/v1/permissions/tree', {
    params: { searchKey },
  })
}

// 6. 根据标识查询权限列表
export const getPermissionsByIdentificationApi = (data: PermissionQueryDTO) => {
  return request.post<unknown, any[]>(
    '/apis/v1/permissions/by-identification',
    data, // 把整个对象直接作为 JSON Body 传给后端
  )
}

// 7. 异步批量导入权限 (文件上传)
export const importPermissionsApi = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<unknown, string>('/apis/v1/permissions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 8. 查询导入进度
export const getImportProgressApi = (taskId: string) => {
  return request.get<unknown, any>(`/apis/v1/permissions/import/progress/${taskId}`)
}

// 9. 异步导出权限数据
export const exportPermissionsApi = () => {
  return request.get<unknown, string>('/apis/v1/permissions/export')
}

// 10. 查询导出进度
export const getExportProgressApi = (taskId: string) => {
  return request.get<unknown, any>(`/apis/v1/permissions/export/progress/${taskId}`)
}
