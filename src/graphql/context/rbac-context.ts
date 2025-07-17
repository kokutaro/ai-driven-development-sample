/**
 * GraphQL RBAC コンテキストヘルパー
 *
 * GraphQLリゾルバー内でRBACシステムを使用するためのヘルパー関数群です。
 * GraphQLContextを受け取り、認証・認可チェックを行います。
 */
import type { GraphQLContext } from './graphql-context'

import {
  checkPermission,
  getUserPermissions,
  getUserRoles,
  hasRole,
  requirePermission,
  requireRole,
} from '@/lib/rbac'

/**
 * GraphQLコンテキストでユーザーが指定された権限を持っているかチェックします
 *
 * @param context - GraphQLコンテキスト
 * @param permissionNameOrResource - 権限名またはリソース名
 * @param action - 操作（resourceを指定した場合のみ）
 * @returns 権限を持っている場合はtrue
 */
export async function checkPermissionInContext(
  context: GraphQLContext,
  permissionNameOrResource: string,
  action?: string
): Promise<boolean> {
  const user = getUserFromGraphQLContext(context)

  return action
    ? checkPermission(user.id, permissionNameOrResource, action, context.prisma)
    : checkPermission(user.id, permissionNameOrResource, context.prisma)
}

/**
 * GraphQLコンテキストから認証されたユーザー情報を取得します
 *
 * @param context - GraphQLコンテキスト
 * @returns ユーザー情報
 * @throws 認証されていない場合はエラー
 */
export function getUserFromGraphQLContext(context: GraphQLContext) {
  if (!context.session?.user?.id) {
    throw new Error('ログインが必要です')
  }
  return {
    ...context.session.user,
    id: context.session.user.id, // 型アサーション - 上記のチェックでstringであることが保証される
  }
}

/**
 * GraphQLコンテキストでユーザーの権限一覧を取得します
 *
 * @param context - GraphQLコンテキスト
 * @returns 権限一覧
 */
export async function getUserPermissionsInContext(context: GraphQLContext) {
  const user = getUserFromGraphQLContext(context)
  return getUserPermissions(user.id, context.prisma)
}

/**
 * GraphQLコンテキストでユーザーのロール一覧を取得します
 *
 * @param context - GraphQLコンテキスト
 * @returns ロール一覧
 */
export async function getUserRolesInContext(context: GraphQLContext) {
  const user = getUserFromGraphQLContext(context)
  return getUserRoles(user.id, context.prisma)
}

/**
 * GraphQLコンテキストでユーザーが指定されたロールを持っているかチェックします
 *
 * @param context - GraphQLコンテキスト
 * @param roleName - ロール名
 * @returns ロールを持っている場合はtrue
 */
export async function hasRoleInContext(
  context: GraphQLContext,
  roleName: string
): Promise<boolean> {
  const user = getUserFromGraphQLContext(context)
  return hasRole(user.id, roleName, context.prisma)
}

/**
 * 認証と権限チェックを組み合わせたヘルパー関数
 *
 * @param context - GraphQLコンテキスト
 * @param permissionNameOrResource - 権限名またはリソース名
 * @param action - 操作（resourceを指定した場合のみ）
 * @returns 認証されたユーザー情報
 * @throws 認証または権限が不足している場合はエラー
 */
export async function requireAuthWithPermission(
  context: GraphQLContext,
  permissionNameOrResource: string,
  action?: string
) {
  const user = getUserFromGraphQLContext(context)

  await (action
    ? requirePermission(
        user.id,
        permissionNameOrResource,
        action,
        context.prisma
      )
    : requirePermission(user.id, permissionNameOrResource, context.prisma))
  return user
}

/**
 * 認証とロールチェックを組み合わせたヘルパー関数
 *
 * @param context - GraphQLコンテキスト
 * @param roleName - 必要なロール名
 * @returns 認証されたユーザー情報
 * @throws 認証またはロールが不足している場合はエラー
 */
export async function requireAuthWithRole(
  context: GraphQLContext,
  roleName: string
) {
  const user = getUserFromGraphQLContext(context)
  await requireRole(user.id, roleName, context.prisma)
  return user
}

/**
 * デコレータ：権限要求
 * TypeGraphQLデコレータとして使用するためのヘルパー
 *
 * @param permissionName - 必要な権限名
 */
export function RequirePermission(permissionName: string) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      // GraphQLContextを見つける（通常は最後の引数）
      const context = args.find(
        (arg) =>
          arg && typeof arg === 'object' && 'prisma' in arg && 'session' in arg
      ) as GraphQLContext | undefined

      if (!context) {
        throw new Error('GraphQLコンテキストが見つかりません')
      }

      await requirePermissionInContext(context, permissionName)
      return originalMethod.apply(this, args) as Promise<unknown>
    }

    return descriptor
  }
}

/**
 * GraphQLコンテキストでユーザーが指定された権限を持っていることを要求します
 *
 * @param context - GraphQLコンテキスト
 * @param permissionNameOrResource - 権限名またはリソース名
 * @param action - 操作（resourceを指定した場合のみ）
 * @throws 権限を持っていない場合はエラー
 */
export async function requirePermissionInContext(
  context: GraphQLContext,
  permissionNameOrResource: string,
  action?: string
): Promise<void> {
  const user = getUserFromGraphQLContext(context)

  await (action
    ? requirePermission(
        user.id,
        permissionNameOrResource,
        action,
        context.prisma
      )
    : requirePermission(user.id, permissionNameOrResource, context.prisma))
}

/**
 * デコレータ：ロール要求
 * TypeGraphQLデコレータとして使用するためのヘルパー
 *
 * @param roleName - 必要なロール名
 */
export function RequireRole(roleName: string) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      // GraphQLContextを見つける（通常は最後の引数）
      const context = args.find(
        (arg) =>
          arg && typeof arg === 'object' && 'prisma' in arg && 'session' in arg
      ) as GraphQLContext | undefined

      if (!context) {
        throw new Error('GraphQLコンテキストが見つかりません')
      }

      await requireRoleInContext(context, roleName)
      return originalMethod.apply(this, args) as Promise<unknown>
    }

    return descriptor
  }
}

/**
 * GraphQLコンテキストでユーザーが指定されたロールを持っていることを要求します
 *
 * @param context - GraphQLコンテキスト
 * @param roleName - ロール名
 * @throws ロールを持っていない場合はエラー
 */
export async function requireRoleInContext(
  context: GraphQLContext,
  roleName: string
): Promise<void> {
  const user = getUserFromGraphQLContext(context)
  await requireRole(user.id, roleName, context.prisma)
}
