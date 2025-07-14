/**
 * RBAC GraphQLリゾルバー
 *
 * ロールベースアクセス制御のGraphQL APIを提供します。
 * 管理者権限が必要な機能と、一般ユーザーが使用できる機能を分けています。
 */
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'

import { requireRoleInContext } from '../context/rbac-context'
import { withPrismaErrorHandling } from '../errors/prisma-error-handler'
import {
  AssignUserRoleInput,
  CreateRoleInput,
  Permission,
  PermissionCheckResult,
  RemoveUserRoleInput,
  Role,
  RoleCheckResult,
  UserPermissionsResponse,
} from '../types/rbac.types'

import type { GraphQLContext } from '../context/graphql-context'

import {
  checkPermission,
  getUserPermissions,
  getUserRoles,
  hasRole,
  SYSTEM_ROLES,
} from '@/lib/rbac'

@Resolver()
export class RBACResolver {
  /**
   * ユーザーにロールを割り当てます（管理者のみ）
   *
   * @param input - ユーザーロール割り当てデータ
   * @param context - GraphQLコンテキスト
   * @returns 成功フラグ
   */
  @Mutation(() => Boolean)
  async assignUserRole(
    @Arg('input', () => AssignUserRoleInput) input: AssignUserRoleInput,
    @Ctx() context: GraphQLContext
  ): Promise<boolean> {
    // 管理者権限が必要
    await requireRoleInContext(context, SYSTEM_ROLES.ADMIN)

    return withPrismaErrorHandling(
      async () => {
        await context.prisma.userRole.create({
          data: {
            roleId: input.roleId,
            userId: input.userId,
          },
        })

        return true
      },
      'create',
      'UserRole'
    )
  }

  /**
   * ユーザーの権限をチェックします
   *
   * @param userId - ユーザーID
   * @param permission - 権限名
   * @param context - GraphQLコンテキスト
   * @returns 権限チェック結果
   */
  @Query(() => PermissionCheckResult)
  async checkPermission(
    @Arg('userId', () => String) userId: string,
    @Arg('permission', () => String) permission: string,
    @Ctx() context: GraphQLContext
  ): Promise<PermissionCheckResult> {
    return withPrismaErrorHandling(
      async () => {
        const hasPermission = await checkPermission(
          userId,
          permission,
          context.prisma
        )

        return {
          hasPermission,
          permission,
          reason: hasPermission ? '権限あり' : '権限なし',
        }
      },
      'check',
      'Permission'
    )
  }

  /**
   * ユーザーのロールをチェックします
   *
   * @param userId - ユーザーID
   * @param roleName - ロール名
   * @param context - GraphQLコンテキスト
   * @returns ロールチェック結果
   */
  @Query(() => RoleCheckResult)
  async checkRole(
    @Arg('userId', () => String) userId: string,
    @Arg('roleName', () => String) roleName: string,
    @Ctx() context: GraphQLContext
  ): Promise<RoleCheckResult> {
    return withPrismaErrorHandling(
      async () => {
        const hasRoleResult = await hasRole(userId, roleName, context.prisma)

        return {
          hasRole: hasRoleResult,
          reason: hasRoleResult ? 'ロールあり' : 'ロールなし',
          roleName,
        }
      },
      'check',
      'Role'
    )
  }

  /**
   * 新しいロールを作成します（管理者のみ）
   *
   * @param input - ロール作成データ
   * @param context - GraphQLコンテキスト
   * @returns 作成されたロール
   */
  @Mutation(() => Role)
  async createRole(
    @Arg('input', () => CreateRoleInput) input: CreateRoleInput,
    @Ctx() context: GraphQLContext
  ): Promise<Role> {
    // 管理者権限が必要
    await requireRoleInContext(context, SYSTEM_ROLES.ADMIN)

    // 入力バリデーション
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('ロール名は必須です')
    }

    if (!input.displayName || input.displayName.trim().length === 0) {
      throw new Error('表示名は必須です')
    }

    return withPrismaErrorHandling(
      async () => {
        // ロールを作成
        const role = await context.prisma.role.create({
          data: {
            description: input.description?.trim(),
            displayName: input.displayName.trim(),
            isSystem: false, // ユーザー作成ロールはシステムロールではない
            name: input.name.trim(),
          },
        })

        // 権限を割り当て（指定されている場合）
        if (input.permissionIds && input.permissionIds.length > 0) {
          await context.prisma.rolePermission.createMany({
            data: input.permissionIds.map((permissionId) => ({
              permissionId,
              roleId: role.id,
            })),
          })
        }

        return {
          createdAt: role.createdAt,
          description: role.description ?? undefined,
          displayName: role.displayName,
          id: role.id,
          isSystem: role.isSystem,
          name: role.name,
          updatedAt: role.updatedAt,
        }
      },
      'create',
      'Role'
    )
  }

  /**
   * 全ての権限一覧を取得します（管理者のみ）
   *
   * @param context - GraphQLコンテキスト
   * @returns 権限一覧
   */
  @Query(() => [Permission])
  async permissions(@Ctx() context: GraphQLContext): Promise<Permission[]> {
    // 管理者権限が必要
    await requireRoleInContext(context, SYSTEM_ROLES.ADMIN)

    return withPrismaErrorHandling(
      async () => {
        const permissions = await context.prisma.permission.findMany({
          orderBy: {
            resource: 'asc',
          },
        })

        return permissions.map((permission) => ({
          action: permission.action,
          createdAt: permission.createdAt,
          description: permission.description ?? undefined,
          displayName: permission.displayName,
          id: permission.id,
          isSystem: permission.isSystem,
          name: permission.name,
          resource: permission.resource,
          updatedAt: permission.updatedAt,
        }))
      },
      'findMany',
      'Permission'
    )
  }

  /**
   * ユーザーからロールを削除します（管理者のみ）
   *
   * @param input - ユーザーロール削除データ
   * @param context - GraphQLコンテキスト
   * @returns 成功フラグ
   */
  @Mutation(() => Boolean)
  async removeUserRole(
    @Arg('input', () => RemoveUserRoleInput) input: RemoveUserRoleInput,
    @Ctx() context: GraphQLContext
  ): Promise<boolean> {
    // 管理者権限が必要
    await requireRoleInContext(context, SYSTEM_ROLES.ADMIN)

    return withPrismaErrorHandling(
      async () => {
        // 存在確認
        const existingUserRole = await context.prisma.userRole.findUnique({
          where: {
            userId_roleId: {
              roleId: input.roleId,
              userId: input.userId,
            },
          },
        })

        if (!existingUserRole) {
          throw new Error('ユーザーロールが見つかりません')
        }

        await context.prisma.userRole.delete({
          where: {
            userId_roleId: {
              roleId: input.roleId,
              userId: input.userId,
            },
          },
        })

        return true
      },
      'delete',
      'UserRole'
    )
  }

  /**
   * 全てのロール一覧を取得します（管理者のみ）
   *
   * @param context - GraphQLコンテキスト
   * @returns ロール一覧
   */
  @Query(() => [Role])
  async roles(@Ctx() context: GraphQLContext): Promise<Role[]> {
    // 管理者権限が必要
    await requireRoleInContext(context, SYSTEM_ROLES.ADMIN)

    return withPrismaErrorHandling(
      async () => {
        const roles = await context.prisma.role.findMany({
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        return roles.map((role) => ({
          createdAt: role.createdAt,
          description: role.description ?? undefined,
          displayName: role.displayName,
          id: role.id,
          isSystem: role.isSystem,
          name: role.name,
          permissions: role.rolePermissions.map((rp) => ({
            action: rp.permission.action,
            createdAt: rp.permission.createdAt,
            description: rp.permission.description ?? undefined,
            displayName: rp.permission.displayName,
            id: rp.permission.id,
            isSystem: rp.permission.isSystem,
            name: rp.permission.name,
            resource: rp.permission.resource,
            updatedAt: rp.permission.updatedAt,
          })),
          updatedAt: role.updatedAt,
        }))
      },
      'findMany',
      'Role'
    )
  }

  /**
   * 指定されたユーザーの権限情報を取得します
   *
   * @param userId - ユーザーID
   * @param context - GraphQLコンテキスト
   * @returns ユーザー権限情報
   */
  @Query(() => UserPermissionsResponse)
  async userPermissions(
    @Arg('userId', () => String) userId: string,
    @Ctx() context: GraphQLContext
  ): Promise<UserPermissionsResponse> {
    // 自分の情報を取得するか、管理者権限が必要
    const currentUser = context.session?.user
    if (!currentUser?.id) {
      throw new Error('ログインが必要です')
    }

    const isOwnInfo = currentUser.id === userId
    const isAdmin = await hasRole(
      currentUser.id,
      SYSTEM_ROLES.ADMIN,
      context.prisma
    )

    if (!isOwnInfo && !isAdmin) {
      throw new Error('他のユーザーの権限情報を取得する権限がありません')
    }

    return withPrismaErrorHandling(
      async () => {
        const [roles, permissions] = await Promise.all([
          getUserRoles(userId, context.prisma),
          getUserPermissions(userId, context.prisma),
        ])

        return {
          permissionNames: permissions.map((permission) => permission.name),
          permissions: permissions.map((permission) => ({
            action: permission.action,
            createdAt: permission.createdAt,
            description: permission.description ?? undefined,
            displayName: permission.displayName,
            id: permission.id,
            isSystem: permission.isSystem,
            name: permission.name,
            resource: permission.resource,
            updatedAt: permission.updatedAt,
          })),
          roleNames: roles.map((role) => role.name),
          roles: roles.map((role) => ({
            createdAt: role.createdAt,
            description: role.description ?? undefined,
            displayName: role.displayName,
            id: role.id,
            isSystem: role.isSystem,
            name: role.name,
            updatedAt: role.updatedAt,
          })),
          user: {
            createdAt: new Date(),
            email: currentUser.email ?? undefined,
            id: userId,
            name: currentUser.name ?? undefined,
            updatedAt: new Date(),
          },
        }
      },
      'findMany',
      'UserPermissions'
    )
  }
}
