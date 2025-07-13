import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetTodoStatsQueryHandler } from './get-todo-stats.handler'
import { GetTodoStatsQuery } from './get-todo-stats.query'

import type { TodoEntity } from '@/domain/entities/todo-entity'
import type { TodoRepository } from '@/domain/repositories/todo-repository'

import { DueDate } from '@/domain/value-objects/due-date'
import { Priority } from '@/domain/value-objects/priority'
import { TodoId } from '@/domain/value-objects/todo-id'
import { TodoStatus } from '@/domain/value-objects/todo-status'

// Mock Repository
const mockTodoRepository: TodoRepository = {
  countBySpecification: vi.fn(),
  countByUserId: vi.fn(),
  delete: vi.fn(),
  deleteAllByUserId: vi.fn(),
  deleteMany: vi.fn(),
  exists: vi.fn(),
  findAllByUserId: vi.fn(),
  findById: vi.fn(),
  findBySpecification: vi.fn(),
  findByUserId: vi.fn(),
  findWithPagination: vi.fn(),
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

describe('GetTodoStatsQueryHandler', () => {
  let handler: GetTodoStatsQueryHandler

  beforeEach(() => {
    handler = new GetTodoStatsQueryHandler(mockTodoRepository)
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('TODO統計情報を正常に取得し、成功結果を返す', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodoStatsQuery(userId)

      const today = new Date()
      today.setHours(23, 59, 59, 999)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const mockTodos = [
        // 未完了タスク
        createMockTodoEntity({
          priority: Priority.HIGH(),
          status: TodoStatus.PENDING(),
        }),
        // 完了タスク
        createMockTodoEntity({
          status: TodoStatus.COMPLETED(),
        }),
        // 今日締切タスク
        createMockTodoEntity({
          dueDate: DueDate.fromDate(today),
          status: TodoStatus.PENDING(),
        }),
        // 期限切れタスク
        createMockTodoEntity({
          dueDate: DueDate.fromDate(yesterday),
          isOverdue: vi.fn().mockReturnValue(true),
          status: TodoStatus.PENDING(),
        }),
        // 今後の予定タスク
        createMockTodoEntity({
          dueDate: DueDate.fromDate(tomorrow),
          status: TodoStatus.PENDING(),
        }),
      ]

      vi.mocked(mockTodoRepository.findAllByUserId).mockResolvedValue(mockTodos)

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(true)
      expect(result.stats).toEqual({
        dueToday: 1,
        important: 1,
        overdue: 1,
        pending: 4,
        total: 5,
        upcoming: 1,
      })
      expect(result.error).toBeUndefined()
    })

    it('空のTODOリストで統計情報を正常に取得する', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodoStatsQuery(userId)

      vi.mocked(mockTodoRepository.findAllByUserId).mockResolvedValue([])

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(true)
      expect(result.stats).toEqual({
        dueToday: 0,
        important: 0,
        overdue: 0,
        pending: 0,
        total: 0,
        upcoming: 0,
      })
    })

    it('無効なユーザーIDで失敗結果を返す', async () => {
      // Arrange
      const query = new GetTodoStatsQuery('')

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.stats).toBeUndefined()
      expect(result.error).toBe('ユーザーIDは必須です')
    })

    it('リポジトリエラー時に失敗結果を返す', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodoStatsQuery(userId)

      vi.mocked(mockTodoRepository.findAllByUserId).mockRejectedValue(
        new Error('データベースエラー')
      )

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.stats).toBeUndefined()
      expect(result.error).toBe(
        'TODO統計情報の取得に失敗しました: データベースエラー'
      )
    })
  })
})
