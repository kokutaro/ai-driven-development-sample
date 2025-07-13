import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetTodoByIdQueryHandler } from '../queries/get-todo-by-id/get-todo-by-id.handler'
import { GetTodoByIdQuery } from '../queries/get-todo-by-id/get-todo-by-id.query'
import { GetTodoStatsQueryHandler } from '../queries/get-todo-stats/get-todo-stats.handler'
import { GetTodoStatsQuery } from '../queries/get-todo-stats/get-todo-stats.query'
import { GetTodosQueryHandler } from '../queries/get-todos/get-todos.handler'
import { GetTodosQuery } from '../queries/get-todos/get-todos.query'

import { QueryBusImpl } from './query-bus'
import { QueryRegistryImpl } from './query-registry'

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

describe('QueryBus Integration Tests', () => {
  let queryBus: QueryBusImpl
  let queryRegistry: QueryRegistryImpl

  beforeEach(() => {
    queryRegistry = new QueryRegistryImpl()
    queryBus = new QueryBusImpl(queryRegistry)

    // 実際のQuery Handlerを登録
    const getTodosHandler = new GetTodosQueryHandler(mockTodoRepository)
    const getTodoByIdHandler = new GetTodoByIdQueryHandler(mockTodoRepository)
    const getTodoStatsHandler = new GetTodoStatsQueryHandler(mockTodoRepository)

    queryBus.register(GetTodosQuery, getTodosHandler)
    queryBus.register(GetTodoByIdQuery, getTodoByIdHandler)
    queryBus.register(GetTodoStatsQuery, getTodoStatsHandler)

    // Mock reset
    vi.clearAllMocks()
  })

  describe('CQRS Query Workflow', () => {
    it('GetTodosQueryを正常に実行し、レスポンスを返す', async () => {
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
      const result = await queryBus.execute(query)

      // Assert
      expect((result as { success: boolean }).success).toBe(true)
      expect(
        (result as { todos: Array<{ title: string }> }).todos
      ).toHaveLength(2)
      expect(
        (result as { todos: Array<{ title: string }> }).todos?.[0].title
      ).toBe('タスク1')
      expect(
        (result as { todos: Array<{ title: string }> }).todos?.[1].title
      ).toBe('タスク2')
      expect((result as { error?: string }).error).toBeUndefined()
      expect(mockTodoRepository.findByUserId).toHaveBeenCalledTimes(1)
    })

    it('GetTodoByIdQueryを正常に実行し、レスポンスを返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodoByIdQuery(todoId, userId)

      const mockTodo = createMockTodoEntity({
        id: TodoId.fromString(todoId),
        title: '詳細取得テスト',
        userId,
      })

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(mockTodo)

      // Act
      const result = await queryBus.execute(query)

      // Assert
      expect((result as { success: boolean }).success).toBe(true)
      expect((result as { todo: typeof mockTodo }).todo).toBe(mockTodo)
      expect((result as { todo: { title: string } }).todo?.title).toBe(
        '詳細取得テスト'
      )
      expect((result as { error?: string }).error).toBeUndefined()
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId)
    })

    it('GetTodoStatsQueryを正常に実行し、レスポンスを返す', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodoStatsQuery(userId)

      const today = new Date()
      const mockTodos = [
        createMockTodoEntity({
          priority: Priority.HIGH(),
          status: TodoStatus.PENDING(),
        }),
        createMockTodoEntity({
          status: TodoStatus.COMPLETED(),
        }),
        createMockTodoEntity({
          dueDate: DueDate.fromDate(today),
          status: TodoStatus.PENDING(),
        }),
      ]

      vi.mocked(mockTodoRepository.findAllByUserId).mockResolvedValue(mockTodos)

      // Act
      const result = await queryBus.execute(query)

      // Assert
      expect((result as { success: boolean }).success).toBe(true)
      expect((result as { stats: unknown }).stats).toBeDefined()
      expect((result as { stats: { total: number } }).stats?.total).toBe(3)
      expect((result as { stats: { pending: number } }).stats?.pending).toBe(2)
      expect(
        (result as { stats: { important: number } }).stats?.important
      ).toBe(1)
      expect((result as { error?: string }).error).toBeUndefined()
    })

    it('複数のクエリを順次実行できる', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const todoId = '550e8400-e29b-41d4-a716-446655440001'

      const getTodosQuery = new GetTodosQuery(userId)
      const getTodoByIdQuery = new GetTodoByIdQuery(todoId, userId)
      const getStatsQuery = new GetTodoStatsQuery(userId)

      const mockTodos = [createMockTodoEntity()]
      const mockTodo = createMockTodoEntity({ id: TodoId.fromString(todoId) })

      // Mock設定
      vi.mocked(mockTodoRepository.findByUserId).mockResolvedValue(mockTodos)
      vi.mocked(mockTodoRepository.countByUserId).mockResolvedValue(1)
      vi.mocked(mockTodoRepository.findById).mockResolvedValue(mockTodo)
      vi.mocked(mockTodoRepository.findAllByUserId).mockResolvedValue(mockTodos)

      // Act
      const todosResult = await queryBus.execute(getTodosQuery)
      const todoResult = await queryBus.execute(getTodoByIdQuery)
      const statsResult = await queryBus.execute(getStatsQuery)

      // Assert
      expect((todosResult as { success: boolean }).success).toBe(true)
      expect((todoResult as { success: boolean }).success).toBe(true)
      expect((statsResult as { success: boolean }).success).toBe(true)

      expect(mockTodoRepository.findByUserId).toHaveBeenCalledTimes(1)
      expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockTodoRepository.findAllByUserId).toHaveBeenCalledTimes(1)
    })

    it('認可エラーを適切に処理する', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const requestingUserId = '550e8400-e29b-41d4-a716-446655440000'
      const todoOwnerUserId = '550e8400-e29b-41d4-a716-446655440002'
      const query = new GetTodoByIdQuery(todoId, requestingUserId)

      const mockTodo = createMockTodoEntity({
        id: TodoId.fromString(todoId),
        userId: todoOwnerUserId, // 異なるユーザーID
      })

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(mockTodo)

      // Act
      const result = await queryBus.execute(query)

      // Assert
      expect((result as { success: boolean }).success).toBe(false)
      expect((result as { todo?: unknown }).todo).toBeUndefined()
      expect((result as { error?: string }).error).toBe(
        'このTODOにアクセスする権限がありません'
      )
    })

    it('TODOが見つからない場合のエラーを適切に処理する', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodoByIdQuery(todoId, userId)

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(null)

      // Act
      const result = await queryBus.execute(query)

      // Assert
      expect((result as { success: boolean }).success).toBe(false)
      expect((result as { todo?: unknown }).todo).toBeUndefined()
      expect((result as { error?: string }).error).toBe('TODOが見つかりません')
    })

    it('リポジトリエラーを適切に処理する', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const query = new GetTodosQuery(userId)

      vi.mocked(mockTodoRepository.findByUserId).mockRejectedValue(
        new Error('データベースエラー')
      )

      // Act
      const result = await queryBus.execute(query)

      // Assert
      expect((result as { success: boolean }).success).toBe(false)
      expect((result as { todos?: unknown }).todos).toBeUndefined()
      expect((result as { error?: string }).error).toBe(
        'TODO一覧の取得に失敗しました: データベースエラー'
      )
    })
  })
})
