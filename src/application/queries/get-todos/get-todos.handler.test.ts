import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetTodosQueryHandler } from './get-todos.handler'
import { GetTodosQuery } from './get-todos.query'

import type { TodoEntity } from '@/domain/entities/todo-entity'
import type { TodoRepository } from '@/domain/repositories/todo-repository'

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

describe('GetTodosQueryHandler', () => {
  let handler: GetTodosQueryHandler

  beforeEach(() => {
    handler = new GetTodosQueryHandler(mockTodoRepository)
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('フィルターなしでTODO一覧を取得し、成功結果を返す', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodosQuery(userId)

      const mockTodos = [
        createMockTodoEntity({ title: 'タスク1' }),
        createMockTodoEntity({ title: 'タスク2' }),
      ]

      vi.mocked(mockTodoRepository.findByUserId).mockResolvedValue(mockTodos)
      vi.mocked(mockTodoRepository.countByUserId).mockResolvedValue(2)

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(true)
      expect(result.todos).toHaveLength(2)
      expect(result.todos?.[0].title).toBe('タスク1')
      expect(result.todos?.[1].title).toBe('タスク2')
      expect(result.error).toBeUndefined()
      expect(vi.mocked(mockTodoRepository.findByUserId)).toHaveBeenCalledWith(
        userId,
        expect.any(Object)
      )
    })

    it('ページング指定でTODO一覧を取得する', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodosQuery(userId, undefined, { limit: 5, page: 2 })

      const mockTodos = [createMockTodoEntity()]
      vi.mocked(mockTodoRepository.findByUserId).mockResolvedValue(mockTodos)
      vi.mocked(mockTodoRepository.countByUserId).mockResolvedValue(10)

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(true)
      expect(result.pagination).toEqual({
        hasNext: false,
        hasPrevious: true,
        limit: 5,
        page: 2,
        total: 10,
        totalPages: 2,
      })
    })

    it('フィルター条件でTODO一覧を取得する', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const filter = {
        isCompleted: false,
        isImportant: true,
        searchTerm: 'テスト',
      }
      const query = new GetTodosQuery(userId, filter)

      const mockTodos = [createMockTodoEntity()]
      vi.mocked(mockTodoRepository.findByUserId).mockResolvedValue(mockTodos)
      vi.mocked(mockTodoRepository.countByUserId).mockResolvedValue(1)

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(true)
      expect(result.todos).toHaveLength(1)
      expect(vi.mocked(mockTodoRepository.findByUserId)).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          pagination: expect.any(Object),
          sort: expect.any(Object),
          specification: expect.any(Object),
        })
      )
    })

    it('無効なユーザーIDで失敗結果を返す', async () => {
      // Arrange
      const query = new GetTodosQuery('')

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todos).toBeUndefined()
      expect(result.error).toBe('ユーザーIDは必須です')
    })

    it('リポジトリエラー時に失敗結果を返す', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodosQuery(userId)

      vi.mocked(mockTodoRepository.findByUserId).mockRejectedValue(
        new Error('データベースエラー')
      )

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todos).toBeUndefined()
      expect(result.error).toBe(
        'TODO一覧の取得に失敗しました: データベースエラー'
      )
    })

    it('空の結果を正常に処理する', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodosQuery(userId)

      vi.mocked(mockTodoRepository.findByUserId).mockResolvedValue([])
      vi.mocked(mockTodoRepository.countByUserId).mockResolvedValue(0)

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(true)
      expect(result.todos).toHaveLength(0)
      expect(result.pagination?.total).toBe(0)
    })
  })
})
