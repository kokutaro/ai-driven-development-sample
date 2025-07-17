/**
 * GraphQL RBAC統合テスト
 *
 * GraphQLリゾルバーにRBACシステムを統合するテストです。
 * TDD方式でGraphQLコンテキストでのRBAC機能を実装します。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DataLoaderContext } from '@/graphql/context/dataloader-context'
import type { GraphQLContext } from '@/graphql/context/graphql-context'
import type { PrismaClient } from '@prisma/client'

import {
  checkPermissionInContext,
  getUserFromGraphQLContext,
  hasRoleInContext,
  requireAuthWithPermission,
  requireAuthWithRole,
  requirePermissionInContext,
  requireRoleInContext,
} from '@/graphql/context/rbac-context'

// モックの設定
const mockPrismaClient = {
  userRole: {
    findMany: vi.fn(),
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

const mockGraphQLContext: GraphQLContext = {
  commandBus: {} as never,
  dataloaders: mockDataLoaderContext,
  prisma: mockPrismaClient,
  queryBus: {} as never,
  req: {} as never,
  res: {} as never,
  session: {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    user: {
      email: 'test@example.com',
      id: 'user-123',
      name: 'Test User',
    },
  },
}

const mockUnauthenticatedContext: GraphQLContext = {
  ...mockGraphQLContext,
  session: undefined,
}

// テスト用のモックデータ
const mockUserRolesAdmin = [
  {
    createdAt: new Date(),
    id: 'user-role-1',
    role: {
      createdAt: new Date(),
      description: 'システム管理者',
      displayName: '管理者',
      id: 'role-admin',
      isSystem: true,
      name: 'admin',
      rolePermissions: [
        {
          permission: {
            action: 'read',
            createdAt: new Date(),
            description: 'タスクを読み取る権限',
            displayName: 'タスク読み取り',
            id: 'perm-read-todo',
            isSystem: true,
            name: 'read_todo',
            resource: 'todo',
            updatedAt: new Date(),
          },
        },
        {
          permission: {
            action: 'write',
            createdAt: new Date(),
            description: 'タスクを作成・更新する権限',
            displayName: 'タスク書き込み',
            id: 'perm-write-todo',
            isSystem: true,
            name: 'write_todo',
            resource: 'todo',
            updatedAt: new Date(),
          },
        },
        {
          permission: {
            action: 'delete',
            createdAt: new Date(),
            description: 'タスクを削除する権限',
            displayName: 'タスク削除',
            id: 'perm-delete-todo',
            isSystem: true,
            name: 'delete_todo',
            resource: 'todo',
            updatedAt: new Date(),
          },
        },
      ],
      updatedAt: new Date(),
    },
    roleId: 'role-admin',
    updatedAt: new Date(),
    userId: 'user-123',
  },
]

const mockUserRolesViewer = [
  {
    createdAt: new Date(),
    id: 'user-role-2',
    role: {
      createdAt: new Date(),
      description: '閲覧のみ可能',
      displayName: '閲覧者',
      id: 'role-viewer',
      isSystem: true,
      name: 'viewer',
      rolePermissions: [
        {
          permission: {
            action: 'read',
            createdAt: new Date(),
            description: 'タスクを読み取る権限',
            displayName: 'タスク読み取り',
            id: 'perm-read-todo',
            isSystem: true,
            name: 'read_todo',
            resource: 'todo',
            updatedAt: new Date(),
          },
        },
      ],
      updatedAt: new Date(),
    },
    roleId: 'role-viewer',
    updatedAt: new Date(),
    userId: 'user-123',
  },
]

describe('GraphQL RBAC統合システム', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserFromGraphQLContext', () => {
    it('認証されたユーザーの情報を取得する', () => {
      // Act
      const user = getUserFromGraphQLContext(mockGraphQLContext)

      // Assert
      expect(user).toEqual({
        email: 'test@example.com',
        id: 'user-123',
        name: 'Test User',
      })
    })

    it('認証されていない場合はエラーを投げる', () => {
      // Act & Assert
      expect(() =>
        getUserFromGraphQLContext(mockUnauthenticatedContext)
      ).toThrow('ログインが必要です')
    })
  })

  describe('hasRoleInContext', () => {
    it('ユーザーが指定されたロールを持つ場合はtrueを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesAdmin)

      // Act
      const result = await hasRoleInContext(mockGraphQLContext, 'admin')

      // Assert
      expect(result).toBe(true)
      expect(mockPrismaClient.userRole.findMany).toHaveBeenCalledWith({
        include: { role: true },
        where: { userId: 'user-123' },
      })
    })

    it('ユーザーが指定されたロールを持たない場合はfalseを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesViewer)

      // Act
      const result = await hasRoleInContext(mockGraphQLContext, 'admin')

      // Assert
      expect(result).toBe(false)
    })

    it('認証されていない場合はエラーを投げる', async () => {
      // Act & Assert
      await expect(
        hasRoleInContext(mockUnauthenticatedContext, 'admin')
      ).rejects.toThrow('ログインが必要です')
    })
  })

  describe('checkPermissionInContext', () => {
    it('ユーザーが指定された権限を持つ場合はtrueを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesAdmin)

      // Act
      const result = await checkPermissionInContext(
        mockGraphQLContext,
        'read_todo'
      )

      // Assert
      expect(result).toBe(true)
    })

    it('ユーザーが指定された権限を持たない場合はfalseを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesViewer)

      // Act
      const result = await checkPermissionInContext(
        mockGraphQLContext,
        'delete_todo'
      )

      // Assert
      expect(result).toBe(false)
    })

    it('リソースと操作を分けて権限チェックできる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesAdmin)

      // Act
      const result = await checkPermissionInContext(
        mockGraphQLContext,
        'todo',
        'read'
      )

      // Assert
      expect(result).toBe(true)
    })

    it('認証されていない場合はエラーを投げる', async () => {
      // Act & Assert
      await expect(
        checkPermissionInContext(mockUnauthenticatedContext, 'read_todo')
      ).rejects.toThrow('ログインが必要です')
    })
  })

  describe('requireRoleInContext', () => {
    it('ユーザーが指定されたロールを持つ場合は正常に完了する', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesAdmin)

      // Act & Assert
      await expect(
        requireRoleInContext(mockGraphQLContext, 'admin')
      ).resolves.toBeUndefined()
    })

    it('ユーザーが指定されたロールを持たない場合はエラーを投げる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesViewer)

      // Act & Assert
      await expect(
        requireRoleInContext(mockGraphQLContext, 'admin')
      ).rejects.toThrow('必要なロールが不足しています: admin')
    })

    it('認証されていない場合はエラーを投げる', async () => {
      // Act & Assert
      await expect(
        requireRoleInContext(mockUnauthenticatedContext, 'admin')
      ).rejects.toThrow('ログインが必要です')
    })
  })

  describe('requirePermissionInContext', () => {
    it('ユーザーが指定された権限を持つ場合は正常に完了する', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesAdmin)

      // Act & Assert
      await expect(
        requirePermissionInContext(mockGraphQLContext, 'read_todo')
      ).resolves.toBeUndefined()
    })

    it('ユーザーが指定された権限を持たない場合はエラーを投げる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesViewer)

      // Act & Assert
      await expect(
        requirePermissionInContext(mockGraphQLContext, 'delete_todo')
      ).rejects.toThrow('必要な権限が不足しています: delete_todo')
    })

    it('認証されていない場合はエラーを投げる', async () => {
      // Act & Assert
      await expect(
        requirePermissionInContext(mockUnauthenticatedContext, 'read_todo')
      ).rejects.toThrow('ログインが必要です')
    })
  })

  describe('requireAuthWithRole', () => {
    it('認証とロールチェックを組み合わせる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesAdmin)

      // Act
      const result = await requireAuthWithRole(mockGraphQLContext, 'admin')

      // Assert
      expect(result).toEqual({
        email: 'test@example.com',
        id: 'user-123',
        name: 'Test User',
      })
    })

    it('認証またはロールが不足している場合はエラーを投げる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesViewer)

      // Act & Assert
      await expect(
        requireAuthWithRole(mockGraphQLContext, 'admin')
      ).rejects.toThrow('必要なロールが不足しています: admin')
    })
  })

  describe('requireAuthWithPermission', () => {
    it('認証と権限チェックを組み合わせる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesAdmin)

      // Act
      const result = await requireAuthWithPermission(
        mockGraphQLContext,
        'read_todo'
      )

      // Assert
      expect(result).toEqual({
        email: 'test@example.com',
        id: 'user-123',
        name: 'Test User',
      })
    })

    it('認証または権限が不足している場合はエラーを投げる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi
        .fn()
        .mockResolvedValue(mockUserRolesViewer)

      // Act & Assert
      await expect(
        requireAuthWithPermission(mockGraphQLContext, 'delete_todo')
      ).rejects.toThrow('必要な権限が不足しています: delete_todo')
    })
  })
})
