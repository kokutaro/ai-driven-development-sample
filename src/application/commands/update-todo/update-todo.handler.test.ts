import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UpdateTodoCommand } from './update-todo.command'
import { UpdateTodoCommandHandler } from './update-todo.handler'

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

describe('UpdateTodoCommandHandler', () => {
  let handler: UpdateTodoCommandHandler

  beforeEach(() => {
    handler = new UpdateTodoCommandHandler(mockTodoRepository)
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('既存TODOを更新し、成功結果を返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const command = new UpdateTodoCommand(
        todoId,
        userId,
        '更新されたタスク',
        '更新された説明',
        undefined,
        Priority.HIGH()
      )

      const mockTodoEntity = {
        clearUncommittedEvents: vi.fn(),
        description: '元の説明',
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: { value: todoId },
        priority: Priority.NORMAL(),
        status: TodoStatus.PENDING(),
        title: '元のタスク',
        updateDescription: vi.fn(),
        updatePriority: vi.fn(),
        updateTitle: vi.fn(),
        userId,
      }

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(
        mockTodoEntity as unknown as TodoEntity
      )
      vi.mocked(mockTodoRepository.save).mockResolvedValue(
        mockTodoEntity as unknown as TodoEntity
      )

      // Act
      const result = await handler.handle(command)

      // Assert
      expect(result.success).toBe(true)
      expect(result.todoId).toBe(todoId)
      expect(result.error).toBeUndefined()
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(
        expect.any(Object)
      )
      expect(mockTodoEntity.updateTitle).toHaveBeenCalledWith(
        '更新されたタスク'
      )
      expect(mockTodoEntity.updateDescription).toHaveBeenCalledWith(
        '更新された説明'
      )
      expect(mockTodoEntity.updatePriority).toHaveBeenCalledWith(
        Priority.HIGH()
      )
      expect(mockTodoRepository.save).toHaveBeenCalledWith(mockTodoEntity)
    })

    it('TODOが見つからない場合に失敗結果を返す', async () => {
      // Arrange
      const command = new UpdateTodoCommand(
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
      const command = new UpdateTodoCommand(
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
      expect(result.error).toBe('このTODOを更新する権限がありません')
    })

    it('無効なTODO IDで失敗結果を返す', async () => {
      // Arrange
      const command = new UpdateTodoCommand(
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
  })
})
