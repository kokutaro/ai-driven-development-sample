import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateTodoCommand } from './create-todo.command'
import { CreateTodoCommandHandler } from './create-todo.handler'

import type { TodoEntity } from '@/domain/entities/todo-entity'
import type { TodoRepository } from '@/domain/repositories/todo-repository'

import { Priority } from '@/domain/value-objects/priority'
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

describe('CreateTodoCommandHandler', () => {
  let handler: CreateTodoCommandHandler

  beforeEach(() => {
    handler = new CreateTodoCommandHandler(mockTodoRepository)
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('新しいTODOを作成し、成功結果を返す', async () => {
      // Arrange
      const command = new CreateTodoCommand(
        'テストタスク',
        '550e8400-e29b-41d4-a716-446655440000', // 有効なUUID
        'テスト用の説明',
        undefined,
        Priority.HIGH(),
        'category-456'
      )

      // TodoEntity.createが成功することを前提とする
      const mockTodoEntity = {
        clearUncommittedEvents: vi.fn(),
        description: 'テスト用の説明',
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: { value: 'todo-789' },
        priority: Priority.HIGH(),
        status: TodoStatus.PENDING(),
        title: 'テストタスク',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }

      vi.mocked(mockTodoRepository.save).mockResolvedValue(
        mockTodoEntity as unknown as TodoEntity
      )

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(true)
      expect(result.todoId).toBe('todo-789')
      expect(result.error).toBeUndefined()
      expect(mockTodoRepository.save).toHaveBeenCalledTimes(1)
    })

    it('リポジトリエラー時に失敗結果を返す', async () => {
      // Arrange
      const command = new CreateTodoCommand(
        'エラーテスト',
        '550e8400-e29b-41d4-a716-446655440000' // 有効なUUID
      )

      vi.mocked(mockTodoRepository.save).mockRejectedValue(
        new Error('リポジトリエラー')
      )

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todoId).toBeUndefined()
      expect(result.error).toBe('TODO作成に失敗しました: リポジトリエラー')
    })

    it('無効なタイトルで失敗結果を返す', async () => {
      // Arrange
      const command = new CreateTodoCommand(
        '', // 空のタイトル
        'user-123'
      )

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todoId).toBeUndefined()
      expect(result.error).toBeDefined()
    })

    it('無効なユーザーIDで失敗結果を返す', async () => {
      // Arrange
      const command = new CreateTodoCommand(
        'テストタスク',
        '' // 空のユーザーID
      )

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todoId).toBeUndefined()
      expect(result.error).toBeDefined()
    })
  })
})
