/**
 * RBAC (Role-Based Access Control) システムのテスト
 *
 * TDD方式でRBAC機能を実装します。
 * 1. Red: 失敗するテストを書く
 * 2. Green: テストが通る最小限のコードを書く
 * 3. Refactor: コードをリファクタリングする
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PrismaClient } from '@prisma/client'

import {
  checkPermission,
  getUserPermissions,
  getUserRoles,
  hasRole,
  requirePermission,
  requireRole,
} from '@/lib/rbac'

// モックの設定
const mockPrismaClient = {
  permission: {
    findMany: vi.fn(),
  },
  role: {
    findMany: vi.fn(),
  },
  rolePermission: {
    findMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  userRole: {
    findMany: vi.fn(),
  },
} as unknown as PrismaClient

// テスト用のモックデータ
const mockUser = {
  createdAt: new Date(),
  email: 'test@example.com',
  id: 'user-123',
  name: 'Test User',
  updatedAt: new Date(),
}

const mockRoles = [
  {
    createdAt: new Date(),
    description: 'システム管理者',
    displayName: '管理者',
    id: 'role-admin',
    isSystem: true,
    name: 'admin',
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    description: 'コンテンツ編集者',
    displayName: '編集者',
    id: 'role-editor',
    isSystem: true,
    name: 'editor',
    updatedAt: new Date(),
  },
]

const mockPermissions = [
  {
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
  {
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
  {
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
]

const mockUserRoles = [
  {
    createdAt: new Date(),
    id: 'user-role-1',
    roleId: 'role-editor',
    updatedAt: new Date(),
    userId: 'user-123',
  },
]

const _mockRolePermissions = [
  {
    createdAt: new Date(),
    id: 'role-perm-1',
    permissionId: 'perm-read-todo',
    roleId: 'role-admin',
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: 'role-perm-2',
    permissionId: 'perm-write-todo',
    roleId: 'role-admin',
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: 'role-perm-3',
    permissionId: 'perm-delete-todo',
    roleId: 'role-admin',
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: 'role-perm-4',
    permissionId: 'perm-read-todo',
    roleId: 'role-editor',
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: 'role-perm-5',
    permissionId: 'perm-write-todo',
    roleId: 'role-editor',
    updatedAt: new Date(),
  },
]

describe('RBAC システム', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserRoles', () => {
    it('ユーザーのロール一覧を取得する', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: mockRoles[1], // editor role
        },
      ])

      // Act
      const roles = await getUserRoles(mockUser.id, mockPrismaClient)

      // Assert
      expect(roles).toHaveLength(1)
      expect(roles[0].name).toBe('editor')
      expect(mockPrismaClient.userRole.findMany).toHaveBeenCalledWith({
        include: { role: true },
        where: { userId: mockUser.id },
      })
    })

    it('ロールを持たないユーザーの場合は空の配列を返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([])

      // Act
      const roles = await getUserRoles(mockUser.id, mockPrismaClient)

      // Assert
      expect(roles).toEqual([])
    })
  })

  describe('getUserPermissions', () => {
    it('ユーザーの権限一覧を取得する（ロール経由）', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: {
            ...mockRoles[1], // editor role
            rolePermissions: [
              {
                permission: mockPermissions[0], // read_todo
              },
              {
                permission: mockPermissions[1], // write_todo
              },
            ],
          },
        },
      ])

      // Act
      const permissions = await getUserPermissions(
        mockUser.id,
        mockPrismaClient
      )

      // Assert
      expect(permissions).toHaveLength(2)
      expect(permissions.map((p) => p.name)).toContain('read_todo')
      expect(permissions.map((p) => p.name)).toContain('write_todo')
    })

    it('権限を持たないユーザーの場合は空の配列を返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([])

      // Act
      const permissions = await getUserPermissions(
        mockUser.id,
        mockPrismaClient
      )

      // Assert
      expect(permissions).toEqual([])
    })
  })

  describe('hasRole', () => {
    it('ユーザーが指定されたロールを持つ場合はtrueを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: mockRoles[1], // editor role
        },
      ])

      // Act
      const result = await hasRole(mockUser.id, 'editor', mockPrismaClient)

      // Assert
      expect(result).toBe(true)
    })

    it('ユーザーが指定されたロールを持たない場合はfalseを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: mockRoles[1], // editor role
        },
      ])

      // Act
      const result = await hasRole(mockUser.id, 'admin', mockPrismaClient)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('checkPermission', () => {
    it('ユーザーが指定された権限を持つ場合はtrueを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: {
            ...mockRoles[1], // editor role
            rolePermissions: [
              {
                permission: mockPermissions[0], // read_todo
              },
              {
                permission: mockPermissions[1], // write_todo
              },
            ],
          },
        },
      ])

      // Act
      const result = await checkPermission(
        mockUser.id,
        'read_todo',
        mockPrismaClient
      )

      // Assert
      expect(result).toBe(true)
    })

    it('ユーザーが指定された権限を持たない場合はfalseを返す', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: {
            ...mockRoles[1], // editor role
            rolePermissions: [
              {
                permission: mockPermissions[0], // read_todo
              },
              {
                permission: mockPermissions[1], // write_todo
              },
            ],
          },
        },
      ])

      // Act
      const result = await checkPermission(
        mockUser.id,
        'delete_todo',
        mockPrismaClient
      )

      // Assert
      expect(result).toBe(false)
    })

    it('リソースと操作を分けて権限チェックできる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: {
            ...mockRoles[1], // editor role
            rolePermissions: [
              {
                permission: mockPermissions[0], // read_todo
              },
            ],
          },
        },
      ])

      // Act
      const result = await checkPermission(
        mockUser.id,
        'todo',
        'read',
        mockPrismaClient
      )

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('requireRole', () => {
    it('ユーザーが指定されたロールを持つ場合は正常に完了する', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: mockRoles[1], // editor role
        },
      ])

      // Act & Assert
      await expect(
        requireRole(mockUser.id, 'editor', mockPrismaClient)
      ).resolves.toBeUndefined()
    })

    it('ユーザーが指定されたロールを持たない場合はエラーを投げる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: mockRoles[1], // editor role
        },
      ])

      // Act & Assert
      await expect(
        requireRole(mockUser.id, 'admin', mockPrismaClient)
      ).rejects.toThrow('必要なロールが不足しています: admin')
    })
  })

  describe('requirePermission', () => {
    it('ユーザーが指定された権限を持つ場合は正常に完了する', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: {
            ...mockRoles[1], // editor role
            rolePermissions: [
              {
                permission: mockPermissions[0], // read_todo
              },
            ],
          },
        },
      ])

      // Act & Assert
      await expect(
        requirePermission(mockUser.id, 'read_todo', mockPrismaClient)
      ).resolves.toBeUndefined()
    })

    it('ユーザーが指定された権限を持たない場合はエラーを投げる', async () => {
      // Arrange
      mockPrismaClient.userRole.findMany = vi.fn().mockResolvedValue([
        {
          ...mockUserRoles[0],
          role: {
            ...mockRoles[1], // editor role
            rolePermissions: [
              {
                permission: mockPermissions[0], // read_todo
              },
            ],
          },
        },
      ])

      // Act & Assert
      await expect(
        requirePermission(mockUser.id, 'delete_todo', mockPrismaClient)
      ).rejects.toThrow('必要な権限が不足しています: delete_todo')
    })
  })
})
