/**
 * RBAC (Role-Based Access Control) システム
 *
 * ロールベースのアクセス制御機能を提供します。
 * - ユーザーロール管理
 * - 権限チェック
 * - リソースアクセス制御
 */
import type { PrismaClient } from '@prisma/client'

/**
 * 権限型定義
 */
export interface Permission {
  action: string
  createdAt: Date
  description: null | string
  displayName: string
  id: string
  isSystem: boolean
  name: string
  resource: string
  updatedAt: Date
}

/**
 * ロール型定義
 */
export interface Role {
  createdAt: Date
  description: null | string
  displayName: string
  id: string
  isSystem: boolean
  name: string
  updatedAt: Date
}

/**
 * ユーザーが指定された権限を持っているかチェックします
 *
 * @param userId - ユーザーID
 * @param permissionNameOrResource - 権限名またはリソース名
 * @param action - 操作（resourceを指定した場合のみ）
 * @param prisma - Prismaクライアント
 * @returns 権限を持っている場合はtrue
 */
export async function checkPermission(
  userId: string,
  permissionNameOrResource: string,
  actionOrPrisma?: PrismaClient | string,
  prismaClient?: PrismaClient
): Promise<boolean> {
  let permissionName: string
  let prisma: PrismaClient

  // オーバーロード対応
  if (typeof actionOrPrisma === 'string' && prismaClient) {
    // resource, action, prisma の形式
    const resource = permissionNameOrResource
    const action = actionOrPrisma
    prisma = prismaClient
    permissionName = `${action}_${resource}` // 例: read_todo, write_todo
  } else if (typeof actionOrPrisma === 'object') {
    // permissionName, prisma の形式
    permissionName = permissionNameOrResource
    prisma = actionOrPrisma
  } else {
    throw new TypeError('Invalid arguments for checkPermission')
  }

  const permissions = await getUserPermissions(userId, prisma)

  // 権限名で直接マッチング
  if (permissions.some((permission) => permission.name === permissionName)) {
    return true
  }

  // resource + action での組み合わせマッチング（resource.action形式）
  if (typeof actionOrPrisma === 'string' && prismaClient) {
    const resource = permissionNameOrResource
    const action = actionOrPrisma
    return permissions.some(
      (permission) =>
        permission.resource === resource && permission.action === action
    )
  }

  return false
}

/**
 * ユーザーの権限一覧を取得します（ロール経由）
 *
 * @param userId - ユーザーID
 * @param prisma - Prismaクライアント
 * @returns 権限一覧
 */
export async function getUserPermissions(
  userId: string,
  prisma: PrismaClient
): Promise<Permission[]> {
  const userRoles = await prisma.userRole.findMany({
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
    where: { userId },
  })

  // ロールから権限を収集（重複排除）
  const permissions = new Map<string, Permission>()

  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      const permission = rolePermission.permission
      permissions.set(permission.id, permission)
    }
  }

  return [...permissions.values()]
}

/**
 * ユーザーのロール一覧を取得します
 *
 * @param userId - ユーザーID
 * @param prisma - Prismaクライアント
 * @returns ロール一覧
 */
export async function getUserRoles(
  userId: string,
  prisma: PrismaClient
): Promise<Role[]> {
  const userRoles = await prisma.userRole.findMany({
    include: { role: true },
    where: { userId },
  })

  return userRoles.map((userRole) => userRole.role)
}

/**
 * ユーザーが指定されたロールを持っているかチェックします
 *
 * @param userId - ユーザーID
 * @param roleName - ロール名
 * @param prisma - Prismaクライアント
 * @returns ロールを持っている場合はtrue
 */
export async function hasRole(
  userId: string,
  roleName: string,
  prisma: PrismaClient
): Promise<boolean> {
  const roles = await getUserRoles(userId, prisma)
  return roles.some((role) => role.name === roleName)
}

/**
 * ユーザーが指定された権限を持っていることを要求します
 *
 * @param userId - ユーザーID
 * @param permissionNameOrResource - 権限名またはリソース名
 * @param actionOrPrisma - 操作またはPrismaクライアント
 * @param prismaClient - Prismaクライアント（resourceとactionを指定した場合）
 * @throws 権限を持っていない場合はエラー
 */
export async function requirePermission(
  userId: string,
  permissionNameOrResource: string,
  actionOrPrisma?: PrismaClient | string,
  prismaClient?: PrismaClient
): Promise<void> {
  let hasRequiredPermission: boolean

  if (typeof actionOrPrisma === 'string' && prismaClient) {
    // resource, action, prisma の形式
    hasRequiredPermission = await checkPermission(
      userId,
      permissionNameOrResource,
      actionOrPrisma,
      prismaClient
    )
  } else if (typeof actionOrPrisma === 'object') {
    // permissionName, prisma の形式
    hasRequiredPermission = await checkPermission(
      userId,
      permissionNameOrResource,
      actionOrPrisma
    )
  } else {
    throw new TypeError('Invalid arguments for requirePermission')
  }

  if (!hasRequiredPermission) {
    throw new Error(`必要な権限が不足しています: ${permissionNameOrResource}`)
  }
}

/**
 * ユーザーが指定されたロールを持っていることを要求します
 *
 * @param userId - ユーザーID
 * @param roleName - ロール名
 * @param prisma - Prismaクライアント
 * @throws ロールを持っていない場合はエラー
 */
export async function requireRole(
  userId: string,
  roleName: string,
  prisma: PrismaClient
): Promise<void> {
  const hasRequiredRole = await hasRole(userId, roleName, prisma)
  if (!hasRequiredRole) {
    throw new Error(`必要なロールが不足しています: ${roleName}`)
  }
}

/**
 * 事前定義されたシステムロール
 */
export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const

/**
 * 事前定義されたシステム権限
 */
export const SYSTEM_PERMISSIONS = {
  // システム権限
  ADMIN_PANEL: 'admin_panel',
  DELETE_CATEGORY: 'delete_category',
  DELETE_TODO: 'delete_todo',
  DELETE_USER: 'delete_user',

  MANAGE_CATEGORY: 'manage_category',
  MANAGE_TODO: 'manage_todo',
  MANAGE_USER: 'manage_user',
  // Category権限
  READ_CATEGORY: 'read_category',

  // Todo権限
  READ_TODO: 'read_todo',
  // User権限
  READ_USER: 'read_user',
  SYSTEM_CONFIG: 'system_config',
  WRITE_CATEGORY: 'write_category',

  WRITE_TODO: 'write_todo',
  WRITE_USER: 'write_user',
} as const
