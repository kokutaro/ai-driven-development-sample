/**
 * RBACResolverのテスト
 *
 * TDD方式でRBACリゾルバーのテストを実装します。
 * 1. Red: 失敗するテストを書く
 * 2. Green: テストが通る最小限のコードを書く
 * 3. Refactor: コードをリファクタリングする
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DataLoaderContext } from '@/graphql/context/dataloader-context'
import type { GraphQLContext } from '@/graphql/context/graphql-context'
import type { PrismaClient } from '@prisma/client'

import { RBACResolver } from '@/graphql/resolvers/rbac.resolver'

// モックの設定
const mockPrismaClient = {
  permission: {
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  role: {
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  rolePermission: {
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
  userRole: {
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient

const mockDataLoaderContext = {
  categoryLoader: {
    clear: vi.fn(),
    clearAll: vi.fn(),
    load: vi.fn(),
    loadMany: vi.fn(),
  },
  subTaskLoader: {
    clear: vi.fn(),
    clearAll: vi.fn(),
    load: vi.fn(),
    loadMany: vi.fn(),
  },
  userLoader: {
    clear: vi.fn(),
    clearAll: vi.fn(),
    load: vi.fn(),
    loadMany: vi.fn(),
  },
} as unknown as DataLoaderContext

const mockAdminContext: GraphQLContext = {
  commandBus: {} as never,
  dataloaders: mockDataLoaderContext,
  prisma: mockPrismaClient,
  queryBus: {} as never,
  req: {} as never,
  res: {} as never,
  session: {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    user: {
      email: 'admin@example.com',
      id: 'admin-123',
      name: 'Admin User',
    },
  },
}

const mockUserContext: GraphQLContext = {
  ...mockAdminContext,
  session: {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    user: {
      email: 'user@example.com',
      id: 'user-123',
      name: 'Regular User',
    },
  },
}

const mockUnauthenticatedContext: GraphQLContext = {
  ...mockAdminContext,
  session: undefined,
}

// テスト用のモックデータ
const mockRole = {
  createdAt: new Date(),
  description: 'システム管理者',
  displayName: '管理者',
  id: 'role-admin',
  isSystem: true,
  name: 'admin',
  updatedAt: new Date(),
}

const mockPermission = {
  action: 'read',
  createdAt: new Date(),
  description: 'タスクを読み取る権限',
  displayName: 'タスク読み取り',
  id: 'perm-read-todo',
  isSystem: true,
  name: 'read_todo',
  resource: 'todo',
  updatedAt: new Date(),
}

const mockUserRole = {
  createdAt: new Date(),
  id: 'user-role-1',
  role: mockRole,
  roleId: 'role-admin',
  updatedAt: new Date(),
  userId: 'admin-123',
}

const mockAdminUserRoles = [
  {
    ...mockUserRole,
    role: {
      ...mockRole,
      rolePermissions: [
        {
          permission: mockPermission,
        },
      ],
    },
  },
]

describe('RBACResolver', () => {
  let resolver: RBACResolver

  beforeEach(() => {
    resolver = new RBACResolver()
    vi.clearAllMocks()
  })

  describe('roles クエリ', () => {
    it('管理者は全てのロール一覧を取得できる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockAdminUserRoles)
      mockPrismaClient.role.findMany = vi.fn().mockResolvedValue([mockRole])

      // Act
      const result = await resolver.roles(mockAdminContext)

      // Assert
      expect(result).toEqual([mockRole])
      expect(mockPrismaClient.role.findMany).toHaveBeenCalledWith({
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
    })

    it('管理者以外はエラーが発生する', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([])

      // Act & Assert
      await expect(resolver.roles(mockUserContext)).rejects.toThrow(
        '必要なロールが不足しています: admin'
      )
    })

    it('認証されていないユーザーはエラーが発生する', async () => {
      // Act & Assert
      await expect(resolver.roles(mockUnauthenticatedContext)).rejects.toThrow(
        'ログインが必要です'
      )
    })
  })

  describe('permissions クエリ', () => {
    it('管理者は全ての権限一覧を取得できる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockAdminUserRoles)
      mockPrismaClient.permission.findMany = vi
        .fn()
        .mockResolvedValue([mockPermission])

      // Act
      const result = await resolver.permissions(mockAdminContext)

      // Assert
      expect(result).toEqual([mockPermission])
      expect(mockPrismaClient.permission.findMany).toHaveBeenCalledWith({
        orderBy: {
          resource: 'asc',
        },
      })
    })

    it('管理者以外はエラーが発生する', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([])

      // Act & Assert
      await expect(resolver.permissions(mockUserContext)).rejects.toThrow(
        '必要なロールが不足しています: admin'
      )
    })
  })

  // userPermissions method is commented out in the resolver
  // describe('userPermissions クエリ', () => {
  //   it('ユーザーの権限情報を取得できる', async () => {
  //     // Arrange
  //     mockPrismaClient.userRole.findMany = vi
  //       .fn()
  //       .mockResolvedValue(mockAdminUserRoles)

  //     // Act
  //     const result = await resolver.userPermissions(
  //       'admin-123',
  //       mockAdminContext
  //     )

  //     // Assert
  //     expect(result.user.id).toBe('admin-123')
  //     expect(result.roles).toHaveLength(1)
  //     expect(result.permissions).toHaveLength(1)
  //     expect(result.roleNames).toContain('admin')
  //     expect(result.permissionNames).toContain('read_todo')
  //   })

  //   it('存在しないユーザーIDの場合は空の結果を返す', async () => {
  //     // Arrange
  //     mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([])

  //     // Act
  //     const result = await resolver.userPermissions(
  //       'nonexistent-123',
  //       mockAdminContext
  //     )

  //     // Assert
  //     expect(result.user.id).toBe('nonexistent-123')
  //     expect(result.roles).toHaveLength(0)
  //     expect(result.permissions).toHaveLength(0)
  //   })
  // })

  describe('checkPermission クエリ', () => {
    it('権限を持つユーザーの場合はtrueを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockAdminUserRoles)

      // Act
      const result = await resolver.checkPermission(
        'admin-123',
        'read_todo',
        mockAdminContext
      )

      // Assert
      expect(result.hasPermission).toBe(true)
      expect(result.permission).toBe('read_todo')
    })

    it('権限を持たないユーザーの場合はfalseを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([])

      // Act
      const result = await resolver.checkPermission(
        'user-123',
        'delete_todo',
        mockAdminContext
      )

      // Assert
      expect(result.hasPermission).toBe(false)
      expect(result.permission).toBe('delete_todo')
    })
  })

  describe('checkRole クエリ', () => {
    it('ロールを持つユーザーの場合はtrueを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockAdminUserRoles)

      // Act
      const result = await resolver.checkRole(
        'admin-123',
        'admin',
        mockAdminContext
      )

      // Assert
      expect(result.hasRole).toBe(true)
      expect(result.roleName).toBe('admin')
    })

    it('ロールを持たないユーザーの場合はfalseを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([])

      // Act
      const result = await resolver.checkRole(
        'user-123',
        'admin',
        mockAdminContext
      )

      // Assert
      expect(result.hasRole).toBe(false)
      expect(result.roleName).toBe('admin')
    })
  })

  describe('createRole ミューテーション', () => {
    it('管理者は新しいロールを作成できる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockAdminUserRoles)
      mockPrismaClient.role.create = vi.fn().mockResolvedValue(mockRole)

      const input = {
        description: 'コンテンツ編集者',
        displayName: '編集者',
        name: 'editor',
        permissionIds: ['perm-read-todo'],
      }

      // Act
      const result = await resolver.createRole(input, mockAdminContext)

      // Assert
      expect(result).toEqual(mockRole)
      expect(mockPrismaClient.role.create).toHaveBeenCalledWith({
        data: {
          description: 'コンテンツ編集者',
          displayName: '編集者',
          isSystem: false,
          name: 'editor',
        },
      })
    })

    it('管理者以外はエラーが発生する', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([])

      const input = {
        displayName: '編集者',
        name: 'editor',
      }

      // Act & Assert
      await expect(resolver.createRole(input, mockUserContext)).rejects.toThrow(
        '必要なロールが不足しています: admin'
      )
    })
  })

  describe('assignUserRole ミューテーション', () => {
    it('管理者はユーザーにロールを割り当てできる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockAdminUserRoles)
      mockPrismaClient.userRole.create = vi.fn().mockResolvedValue(mockUserRole)

      const input = {
        roleId: 'role-editor',
        userId: 'user-123',
      }

      // Act
      const result = await resolver.assignUserRole(input, mockAdminContext)

      // Assert
      expect(result).toBe(true)
      expect(mockPrismaClient.userRole.create).toHaveBeenCalledWith({
        data: {
          roleId: 'role-editor',
          userId: 'user-123',
        },
      })
    })

    it('管理者以外はエラーが発生する', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([])

      const input = {
        roleId: 'role-editor',
        userId: 'user-123',
      }

      // Act & Assert
      await expect(
        resolver.assignUserRole(input, mockUserContext)
      ).rejects.toThrow('必要なロールが不足しています: admin')
    })
  })

  describe('removeUserRole ミューテーション', () => {
    it('管理者はユーザーからロールを削除できる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockAdminUserRoles)
      mockPrismaClient.userRole.findUnique = vi
        .fn()
        .mockResolvedValue(mockUserRole)
      mockPrismaClient.userRole.delete = vi.fn().mockResolvedValue(mockUserRole)

      const input = {
        roleId: 'role-editor',
        userId: 'user-123',
      }

      // Act
      const result = await resolver.removeUserRole(input, mockAdminContext)

      // Assert
      expect(result).toBe(true)
      expect(mockPrismaClient.userRole.delete).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            roleId: 'role-editor',
            userId: 'user-123',
          },
        },
      })
    })

    it('存在しないユーザーロールの削除はエラーになる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockAdminUserRoles)
      mockPrismaClient.userRole.findUnique = vi.fn().mockResolvedValue(null)

      const input = {
        roleId: 'role-nonexistent',
        userId: 'user-123',
      }

      // Act & Assert
      await expect(
        resolver.removeUserRole(input, mockAdminContext)
      ).rejects.toThrow('ユーザーロールが見つかりません')
    })
  })
})
