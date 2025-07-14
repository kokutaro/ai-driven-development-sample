import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DeleteTodoCommand } from './delete-todo.command'
import { DeleteTodoCommandHandler } from './delete-todo.handler'

import type { TodoEntity } from '@/domain/entities/todo-entity'
import type { TodoRepository } from '@/domain/repositories/todo-repository'

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

describe('DeleteTodoCommandHandler', () => {
  let handler: DeleteTodoCommandHandler

  beforeEach(() => {
    handler = new DeleteTodoCommandHandler(mockTodoRepository)
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('既存TODOを削除し、成功結果を返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const command = new DeleteTodoCommand(todoId, userId)

      const mockTodoEntity = {
        clearUncommittedEvents: vi.fn(),
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: { value: todoId },
        status: TodoStatus.PENDING(),
        title: 'テストタスク',
        userId,
      }

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(
        mockTodoEntity as unknown as TodoEntity
      )
      vi.mocked(mockTodoRepository.delete).mockResolvedValue(true)

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(true)
      expect(result.todoId).toBe(todoId)
      expect(result.error).toBeUndefined()
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(
        expect.any(Object)
      )
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(expect.any(Object))
    })

    it('TODOが見つからない場合に失敗結果を返す', async () => {
      // Arrange
      const command = new DeleteTodoCommand(
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000'
      )

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(null)

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todoId).toBeUndefined()
      expect(result.error).toBe('TODOが見つかりません')
    })

    it('権限がない場合に失敗結果を返す', async () => {
      // Arrange
      const command = new DeleteTodoCommand(
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000'
      )

      const mockTodoEntity = {
        clearUncommittedEvents: vi.fn(),
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: { value: '550e8400-e29b-41d4-a716-446655440001' },
        userId: '550e8400-e29b-41d4-a716-446655440999', // 異なるユーザーID
      }

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(
        mockTodoEntity as unknown as TodoEntity
      )

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todoId).toBeUndefined()
      expect(result.error).toBe('このTODOを削除する権限がありません')
    })

    it('無効なTODO IDで失敗結果を返す', async () => {
      // Arrange
      const command = new DeleteTodoCommand(
        'invalid-id',
        '550e8400-e29b-41d4-a716-446655440000'
      )

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todoId).toBeUndefined()
      expect(result.error).toBeDefined()
    })

    it('削除操作が失敗した場合にエラーを返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const command = new DeleteTodoCommand(todoId, userId)

      const mockTodoEntity = {
        clearUncommittedEvents: vi.fn(),
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: { value: todoId },
        userId,
      }

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(
        mockTodoEntity as unknown as TodoEntity
      )
      vi.mocked(mockTodoRepository.delete).mockResolvedValue(false) // 削除失敗

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(false)
      expect(result.todoId).toBeUndefined()
      expect(result.error).toBe('TODOの削除に失敗しました')
    })
  })
})
