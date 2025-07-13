import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetTodoByIdQueryHandler } from './get-todo-by-id.handler'
import { GetTodoByIdQuery } from './get-todo-by-id.query'

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

describe('GetTodoByIdQueryHandler', () => {
  let handler: GetTodoByIdQueryHandler

  beforeEach(() => {
    handler = new GetTodoByIdQueryHandler(mockTodoRepository)
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('TODOを正常に取得し、成功結果を返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodoByIdQuery(todoId, userId)

      const mockTodo = createMockTodoEntity({
        id: TodoId.fromString(todoId),
        userId,
      })

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(mockTodo)

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(true)
      expect(result.todo).toBe(mockTodo)
      expect(result.error).toBeUndefined()
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(
        TodoId.fromString(todoId)
      )
    })

    it('TODOが見つからない場合、失敗結果を返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodoByIdQuery(todoId, userId)

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(null)

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todo).toBeUndefined()
      expect(result.error).toBe('TODOが見つかりません')
    })

    it('異なるユーザーのTODOアクセス時、認可エラーを返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const differentUserId = '550e8400-e29b-41d4-a716-446655440002'
      const query = new GetTodoByIdQuery(todoId, userId)

      const mockTodo = createMockTodoEntity({
        id: TodoId.fromString(todoId),
        userId: differentUserId, // 異なるユーザーID
      })

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(mockTodo)

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todo).toBeUndefined()
      expect(result.error).toBe('このTODOにアクセスする権限がありません')
    })

    it('無効なTODO IDで失敗結果を返す', async () => {
      // Arrange
      const query = new GetTodoByIdQuery(
        '',
        '550e8400-e29b-41d4-a716-446655440000'
      )

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todo).toBeUndefined()
      expect(result.error).toBe('TODO IDは必須です')
    })

    it('無効なユーザーIDで失敗結果を返す', async () => {
      // Arrange
      const query = new GetTodoByIdQuery(
        '550e8400-e29b-41d4-a716-446655440001',
        ''
      )

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todo).toBeUndefined()
      expect(result.error).toBe('ユーザーIDは必須です')
    })

    it('リポジトリエラー時に失敗結果を返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodoByIdQuery(todoId, userId)

      vi.mocked(mockTodoRepository.findById).mockRejectedValue(
        new Error('データベースエラー')
      )

      // Act
      const result = await handler.handle(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todo).toBeUndefined()
      expect(result.error).toBe(
        'TODO詳細の取得に失敗しました: データベースエラー'
      )
    })
  })
})
