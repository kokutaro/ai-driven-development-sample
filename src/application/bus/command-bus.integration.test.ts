import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateTodoCommand } from '../commands/create-todo/create-todo.command'
import { CreateTodoCommandHandler } from '../commands/create-todo/create-todo.handler'
import { DeleteTodoCommand } from '../commands/delete-todo/delete-todo.command'
import { DeleteTodoCommandHandler } from '../commands/delete-todo/delete-todo.handler'
import { UpdateTodoCommand } from '../commands/update-todo/update-todo.command'
import { UpdateTodoCommandHandler } from '../commands/update-todo/update-todo.handler'

import { CommandBusImpl } from './command-bus'
import { CommandRegistryImpl } from './command-registry'

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

describe('CommandBus Integration Tests', () => {
  let commandBus: CommandBusImpl
  let commandRegistry: CommandRegistryImpl

  beforeEach(() => {
    commandRegistry = new CommandRegistryImpl()
    commandBus = new CommandBusImpl(commandRegistry)

    // 実際のCommand Handlerを登録
    const createHandler = new CreateTodoCommandHandler(mockTodoRepository)
    const updateHandler = new UpdateTodoCommandHandler(mockTodoRepository)
    const deleteHandler = new DeleteTodoCommandHandler(mockTodoRepository)

    commandBus.register(CreateTodoCommand, createHandler)
    commandBus.register(UpdateTodoCommand, updateHandler)
    commandBus.register(DeleteTodoCommand, deleteHandler)

    // Mock reset
    vi.clearAllMocks()
  })

  describe('CQRS Command Workflow', () => {
    it('CreateTodoCommandを正常に実行し、レスポンスを返す', async () => {
      // Arrange
      const command = new CreateTodoCommand(
        'タスク作成テスト',
        '550e8400-e29b-41d4-a716-446655440000',
        'テスト用の説明',
        undefined,
        Priority.HIGH(),
        'category-123'
      )

      const mockTodoEntity = {
        clearUncommittedEvents: vi.fn(),
        description: 'テスト用の説明',
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: { value: 'todo-789' },
        priority: Priority.HIGH(),
        status: TodoStatus.PENDING(),
        title: 'タスク作成テスト',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }

      vi.mocked(mockTodoRepository.save).mockResolvedValue(
        mockTodoEntity as unknown as TodoEntity
      )

      // Act
      const result = await commandBus.execute(command)

      // Assert
      expect((result as { success: boolean }).success).toBe(true)
      expect((result as { todoId: string }).todoId).toBe('todo-789')
      expect((result as { error?: string }).error).toBeUndefined()
      expect(mockTodoRepository.save).toHaveBeenCalledTimes(1)
    })

    it('UpdateTodoCommandを正常に実行し、レスポンスを返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const command = new UpdateTodoCommand(
        todoId,
        userId,
        'Updated Task Title',
        'Updated description',
        undefined,
        Priority.NORMAL()
      )

      const mockTodoEntity = {
        clearUncommittedEvents: vi.fn(),
        description: 'Updated description',
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: TodoId.fromString(todoId),
        priority: Priority.NORMAL(),
        status: TodoStatus.PENDING(),
        title: 'Updated Task Title',
        updateDescription: vi.fn(),
        updateDueDate: vi.fn(),
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
      const result = await commandBus.execute(command)

      // Assert
      expect((result as { success: boolean }).success).toBe(true)
      expect((result as { todoId: string }).todoId).toBe(todoId)
      expect((result as { error?: string }).error).toBeUndefined()
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(
        TodoId.fromString(todoId)
      )
      expect(mockTodoRepository.save).toHaveBeenCalledTimes(1)
    })

    it('DeleteTodoCommandを正常に実行し、レスポンスを返す', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const command = new DeleteTodoCommand(todoId, userId)

      const mockTodoEntity = {
        clearUncommittedEvents: vi.fn(),
        description: 'テスト説明',
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: TodoId.fromString(todoId),
        priority: Priority.NORMAL(),
        status: TodoStatus.PENDING(),
        title: 'テストタスク',
        userId,
      }

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(
        mockTodoEntity as unknown as TodoEntity
      )
      vi.mocked(mockTodoRepository.delete).mockResolvedValue(true)

      // Act
      const result = await commandBus.execute(command)

      // Assert
      expect((result as { success: boolean }).success).toBe(true)
      expect((result as { todoId: string }).todoId).toBe(todoId)
      expect((result as { error?: string }).error).toBeUndefined()
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(
        TodoId.fromString(todoId)
      )
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(
        TodoId.fromString(todoId)
      )
    })

    it('複数のコマンドを順次実行できる', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const createCommand = new CreateTodoCommand(
        'タスク1',
        userId,
        '説明1',
        undefined,
        Priority.NORMAL()
      )
      const todoId = '550e8400-e29b-41d4-a716-446655440003'
      const updateCommand = new UpdateTodoCommand(
        todoId,
        userId,
        'Updated タスク1',
        'Updated 説明1'
      )
      const deleteCommand = new DeleteTodoCommand(todoId, userId)

      // Create Mock
      const createdTodo = {
        clearUncommittedEvents: vi.fn(),
        description: '説明1',
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: { value: '550e8400-e29b-41d4-a716-446655440004' },
        priority: Priority.NORMAL(),
        status: TodoStatus.PENDING(),
        title: 'タスク1',
        userId,
      }

      // Update Mock
      const updatedTodo = {
        ...createdTodo,
        description: 'Updated 説明1',
        id: TodoId.fromString(todoId),
        title: 'Updated タスク1',
        updateDescription: vi.fn(),
        updateDueDate: vi.fn(),
        updatePriority: vi.fn(),
        updateTitle: vi.fn(),
      }

      vi.mocked(mockTodoRepository.save)
        .mockResolvedValueOnce(createdTodo as unknown as TodoEntity)
        .mockResolvedValueOnce(updatedTodo as unknown as TodoEntity)
      vi.mocked(mockTodoRepository.findById)
        .mockResolvedValueOnce(updatedTodo as unknown as TodoEntity) // for update command
        .mockResolvedValueOnce(updatedTodo as unknown as TodoEntity) // for delete command
      vi.mocked(mockTodoRepository.delete).mockResolvedValue(true)

      // Act
      const createResult = await commandBus.execute(createCommand)
      const updateResult = await commandBus.execute(updateCommand)
      const deleteResult = await commandBus.execute(deleteCommand)

      // Assert
      expect((createResult as { success: boolean }).success).toBe(true)
      expect((updateResult as { success: boolean }).success).toBe(true)
      expect((deleteResult as { success: boolean }).success).toBe(true)

      expect(mockTodoRepository.save).toHaveBeenCalledTimes(2)
      expect(mockTodoRepository.findById).toHaveBeenCalledTimes(2)
      expect(mockTodoRepository.delete).toHaveBeenCalledTimes(1)
    })

    it('認可エラーを適切に処理する', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440001'
      const requestingUserId = '550e8400-e29b-41d4-a716-446655440000'
      const todoOwnerUserId = '550e8400-e29b-41d4-a716-446655440002'
      const command = new UpdateTodoCommand(
        todoId,
        requestingUserId,
        'Unauthorized Update'
      )

      const mockTodoEntity = {
        clearUncommittedEvents: vi.fn(),
        description: 'テスト説明',
        getUncommittedEvents: vi.fn().mockReturnValue([]),
        id: TodoId.fromString(todoId),
        priority: Priority.NORMAL(),
        status: TodoStatus.PENDING(),
        title: 'テストタスク',
        updateDescription: vi.fn(),
        updateDueDate: vi.fn(),
        updatePriority: vi.fn(),
        updateTitle: vi.fn(),
        userId: todoOwnerUserId, // 異なるユーザーID
      }

      vi.mocked(mockTodoRepository.findById).mockResolvedValue(
        mockTodoEntity as unknown as TodoEntity
      )

      // Act
      const result = await commandBus.execute(command)

      // Assert
      expect((result as { success: boolean }).success).toBe(false)
      expect((result as { error?: string }).error).toBe(
        'このTODOを更新する権限がありません'
      )
      expect(mockTodoRepository.save).not.toHaveBeenCalled()
    })
  })
})
