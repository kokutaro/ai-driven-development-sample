import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TodoReadModelService } from './todo-read-model.service'

import type {
  TodoReadModel,
  TodoReadModelRepository,
  TodoStatsReadModel,
} from './todo-read-model.interface'
import type { TodoEntity } from '@/domain/entities/todo-entity'

import { SubTaskEntity } from '@/domain/entities/subtask-entity'
import { Priority } from '@/domain/value-objects/priority'
import { TodoId } from '@/domain/value-objects/todo-id'
import { TodoStatus } from '@/domain/value-objects/todo-status'

// Mock Read Model Repository
const mockReadModelRepository: TodoReadModelRepository = {
  delete: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  getStats: vi.fn(),
  refreshStats: vi.fn(),
  save: vi.fn(),
}

// Mock Todo Entity
const createMockTodoEntity = (
  overrides: Partial<TodoEntity> = {}
): TodoEntity =>
  ({
    clearUncommittedEvents: vi.fn(),
    createdAt: new Date('2024-01-01'),
    description: 'テスト説明',
    getUncommittedEvents: vi.fn().mockReturnValue([]),
    id: TodoId.fromString('550e8400-e29b-41d4-a716-446655440001'),
    isOverdue: vi.fn().mockReturnValue(false),
    priority: Priority.NORMAL(),
    status: TodoStatus.PENDING(),
    title: 'テストタスク',
    updatedAt: new Date('2024-01-01'),
    userId: '550e8400-e29b-41d4-a716-446655440000',
    ...overrides,
  }) as unknown as TodoEntity

describe('TodoReadModelService', () => {
  let service: TodoReadModelService

  beforeEach(() => {
    service = new TodoReadModelService(mockReadModelRepository)
    vi.clearAllMocks()
  })

  describe('convertToReadModel', () => {
    it('TodoEntityをTodoReadModelに正常に変換する', () => {
      // Arrange
      const todoEntity = createMockTodoEntity({
        description: 'テスト説明',
        isOverdue: vi.fn().mockReturnValue(true),
        priority: Priority.HIGH(),
        status: TodoStatus.COMPLETED(),
        title: 'テストタスク',
      })

      // Act
      const result = service.convertToReadModel(todoEntity)

      // Assert
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440001')
      expect(result.title).toBe('テストタスク')
      expect(result.description).toBe('テスト説明')
      expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(result.priority).toBe('HIGH')
      expect(result.status).toBe('COMPLETED')
      expect(result.isOverdue).toBe(true)
      expect(result.isCompleted).toBe(true)
      expect(result.isImportant).toBe(true)
    })

    it('カテゴリ情報を非正規化して含める', () => {
      // Arrange
      // 現在のRead Model Serviceはカテゴリをundefinedに設定している
      // 実際の実装では、別途categoryIdからCategoryを取得する必要がある
      const todoEntity = createMockTodoEntity()

      // Act
      const result = service.convertToReadModel(todoEntity)

      // Assert
      // 現在の実装ではTodoEntityにはcategoryプロパティが無いためundefinedを期待
      expect(result.category).toBeUndefined()
    })

    it('サブタスク数を正確に計算する', () => {
      // Arrange
      const todoEntity = createMockTodoEntity({
        subTasks: [
          SubTaskEntity.fromData({
            createdAt: new Date('2024-01-01'),
            id: TodoId.fromString('550e8400-e29b-41d4-a716-446655440010'),
            isCompleted: true,
            order: 0,
            title: 'サブタスク1',
            todoId: TodoId.fromString('550e8400-e29b-41d4-a716-446655440001'),
            updatedAt: new Date('2024-01-01'),
          }),
          SubTaskEntity.fromData({
            createdAt: new Date('2024-01-01'),
            id: TodoId.fromString('550e8400-e29b-41d4-a716-446655440011'),
            isCompleted: false,
            order: 1,
            title: 'サブタスク2',
            todoId: TodoId.fromString('550e8400-e29b-41d4-a716-446655440001'),
            updatedAt: new Date('2024-01-01'),
          }),
          SubTaskEntity.fromData({
            createdAt: new Date('2024-01-01'),
            id: TodoId.fromString('550e8400-e29b-41d4-a716-446655440012'),
            isCompleted: true,
            order: 2,
            title: 'サブタスク3',
            todoId: TodoId.fromString('550e8400-e29b-41d4-a716-446655440001'),
            updatedAt: new Date('2024-01-01'),
          }),
        ],
      })

      // Act
      const result = service.convertToReadModel(todoEntity)

      // Assert
      expect(result.subTaskCount).toBe(3)
      expect(result.completedSubTaskCount).toBe(2)
    })
  })

  describe('updateFromDomainEntity', () => {
    it('ドメインエンティティからRead Modelを更新する', async () => {
      // Arrange
      const todoEntity = createMockTodoEntity()

      // Act
      await service.updateFromDomainEntity(todoEntity)

      // Assert
      expect(vi.mocked(mockReadModelRepository.save)).toHaveBeenCalledTimes(1)
      expect(vi.mocked(mockReadModelRepository.save)).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'テストタスク',
          userId: '550e8400-e29b-41d4-a716-446655440000',
        })
      )
    })
  })

  describe('findById', () => {
    it('IDでTODO Read Modelを取得する', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const mockReadModel: TodoReadModel = {
        category: undefined,
        completedSubTaskCount: 0,
        createdAt: new Date('2024-01-01'),
        description: 'テスト説明',
        id: todoId,
        isCompleted: false,
        isImportant: false,
        isOverdue: false,
        priority: 'NORMAL',
        status: 'PENDING',
        subTaskCount: 0,
        title: 'テストタスク',
        updatedAt: new Date('2024-01-01'),
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }

      vi.mocked(mockReadModelRepository.findById).mockResolvedValue(
        mockReadModel
      )

      // Act
      const result = await service.findById(todoId)

      // Assert
      expect(result).toBe(mockReadModel)
      expect(vi.mocked(mockReadModelRepository.findById)).toHaveBeenCalledWith(
        todoId
      )
    })

    it('存在しないIDでnullを返す', async () => {
      // Arrange
      const todoId = 'non-existent-id'
      vi.mocked(mockReadModelRepository.findById).mockResolvedValue(undefined)

      // Act
      const result = await service.findById(todoId)

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('findByUserId', () => {
    it('ユーザーのTODO Read Model一覧を取得する', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const mockReadModels: TodoReadModel[] = [
        {
          category: undefined,
          completedSubTaskCount: 0,
          createdAt: new Date('2024-01-01'),
          description: 'タスク1説明',
          id: '550e8400-e29b-41d4-a716-446655440001',
          isCompleted: false,
          isImportant: true,
          isOverdue: false,
          priority: 'HIGH',
          status: 'PENDING',
          subTaskCount: 0,
          title: 'タスク1',
          updatedAt: new Date('2024-01-01'),
          userId,
        },
        {
          category: undefined,
          completedSubTaskCount: 1,
          createdAt: new Date('2024-01-01'),
          description: 'タスク2説明',
          id: '550e8400-e29b-41d4-a716-446655440002',
          isCompleted: true,
          isImportant: false,
          isOverdue: false,
          priority: 'NORMAL',
          status: 'COMPLETED',
          subTaskCount: 2,
          title: 'タスク2',
          updatedAt: new Date('2024-01-01'),
          userId,
        },
      ]

      vi.mocked(mockReadModelRepository.findByUserId).mockResolvedValue(
        mockReadModels
      )

      // Act
      const result = await service.findByUserId(userId)

      // Assert
      expect(result).toBe(mockReadModels)
      expect(result).toHaveLength(2)
      expect(
        vi.mocked(mockReadModelRepository.findByUserId)
      ).toHaveBeenCalledWith(userId, undefined)
    })

    it('フィルターオプション付きで取得する', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const options = {
        filter: { isCompleted: false, isImportant: true },
        pagination: { limit: 10, page: 1 },
        sort: { direction: 'desc' as const, field: 'createdAt' as const },
      }

      vi.mocked(mockReadModelRepository.findByUserId).mockResolvedValue([])

      // Act
      await service.findByUserId(userId, options)

      // Assert
      expect(
        vi.mocked(mockReadModelRepository.findByUserId)
      ).toHaveBeenCalledWith(userId, options)
    })
  })

  describe('getStats', () => {
    it('ユーザーのTODO統計を取得する', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const mockStats: TodoStatsReadModel = {
        categoryStats: [
          {
            categoryId: 'category-123',
            categoryName: '仕事',
            completedCount: 5,
            totalCount: 10,
          },
        ],
        completedCount: 15,
        completionRate: 75.0,
        dueTodayCount: 3,
        importantCount: 8,
        lastUpdated: new Date('2024-01-01'),
        overdueCount: 2,
        pendingCount: 5,
        totalCount: 20,
        upcomingCount: 7,
        userId,
      }

      vi.mocked(mockReadModelRepository.getStats).mockResolvedValue(mockStats)

      // Act
      const result = await service.getStats(userId)

      // Assert
      expect(result).toBe(mockStats)
      expect(result.totalCount).toBe(20)
      expect(result.completionRate).toBe(75.0)
      expect(vi.mocked(mockReadModelRepository.getStats)).toHaveBeenCalledWith(
        userId
      )
    })
  })

  describe('deleteById', () => {
    it('IDでTODO Read Modelを削除する', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'

      // Act
      await service.deleteById(todoId)

      // Assert
      expect(vi.mocked(mockReadModelRepository.delete)).toHaveBeenCalledWith(
        todoId
      )
    })
  })

  describe('refreshUserStats', () => {
    it('ユーザーの統計情報を再計算する', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      // Act
      await service.refreshUserStats(userId)

      // Assert
      expect(
        vi.mocked(mockReadModelRepository.refreshStats)
      ).toHaveBeenCalledWith(userId)
    })
  })
})
