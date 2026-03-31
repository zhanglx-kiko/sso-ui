// 通用响应结构 Result<T>
export interface ApiResult<T = unknown> {
  code: number
  msg: string
  data: T
}

// 分页结构 Page<T>
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
}

// 对应 LoginDTO
export interface LoginDTO {
  username: string
  password: string
  device?: string
}

// 对应 LoginVO
export interface LoginVO {
  id: string // 雪花算法ID转为了String
  username: string
  nickname: string
  avatar: string
  deptId: string
  tokenName: string
  tokenValue: string
}

// 对应 UserDTO (新增/修改)
export interface UserDTO {
  id?: string // 新增为空，修改必填
  username: string
  password?: string // 仅新增时可能需要，修改基本信息不需要
  nickname: string
  avatar?: string
  deptId?: string
  allowConcurrentLogin?: number // 0-禁止(会顶号)，1-允许(默认)
  status?: number // 1-正常, 0-禁用
}

// 对应 UserQueryDTO
export interface UserQueryDTO {
  pageNum: number
  pageSize: number
  username?: string
  deptId?: string
}

// 对应 UserPasswordDTO
export interface UserPasswordDTO {
  userId?: string // Controller里自动填充，但定义上可以保留
  oldPassword: string
  newPassword: string
}
