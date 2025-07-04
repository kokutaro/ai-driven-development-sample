import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'

import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'

import * as todoClient from '@/lib/api/todo-client'
import { useTodoStats, useTodoStore } from '@/stores/todo-store'

// Test constants
const mockDate = new Date('2023-12-25T10:00:00Z')
const mockId = 'test-id-123'

// Mock todo-client module
vi.mock('@/lib/api/todo-client', () => {
  const mockDate = new Date('2023-12-25T10:00:00Z')

  // In-memory todos storage for testing
  let todosDB: Todo[] = []
  let idCounter = 0

  return {
    // Helper function to reset the mock DB
    __resetDB: () => {
      todosDB = []
      idCounter = 0
    },

    createTodo: vi.fn(async (input: CreateTodoInput): Promise<Todo> => {
      const id = idCounter === 0 ? 'test-id-123' : `test-id-${idCounter}`
      idCounter++
      const newTodo: Todo = {
        createdAt: mockDate,
        description: input.description,
        id,
        status: 'pending',
        title: input.title,
        updatedAt: mockDate,
      }
      todosDB.push(newTodo)
      return newTodo
    }),

    deleteTodo: vi.fn(async (id: string) => {
      const todoIndex = todosDB.findIndex((todo) => todo.id === id)
      if (todoIndex === -1) {
        throw new Error('Todo not found')
      }
      todosDB.splice(todoIndex, 1)
    }),

    getTodos: vi.fn(async (): Promise<Todo[]> => {
      return [...todosDB]
    }),

    toggleTodo: vi.fn(async (id: string): Promise<Todo> => {
      const todo = todosDB.find((t) => t.id === id)
      if (!todo) {
        throw new Error('Todo not found')
      }
      todo.status = todo.status === 'completed' ? 'pending' : 'completed'
      todo.updatedAt = mockDate
      return { ...todo }
    }),

    updateTodo: vi.fn(
      async (id: string, input: UpdateTodoInput): Promise<Todo> => {
        const todo = todosDB.find((t) => t.id === id)
        if (!todo) {
          throw new Error('Todo not found')
        }
        if (input.title !== undefined) todo.title = input.title
        if (input.description !== undefined)
          todo.description = input.description
        if (input.status !== undefined) todo.status = input.status
        todo.updatedAt = mockDate
        return { ...todo }
      }
    ),
  }
})

// Access mock service for testing
interface MockTodoClient {
  __resetDB: () => void
}
const mockClient = todoClient as unknown as MockTodoClient

describe('useTodoStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTodoStore.setState({
      isLoading: false,
      todos: [],
    })
    // Reset mock database
    mockClient.__resetDB()
    // Clear all mock call history
    vi.clearAllMocks()
  })

  describe('addTodo', () => {
    it('adds a new todo with pending status', async () => {
      // Arrange
      const input: CreateTodoInput = {
        description: 'Test Description',
        title: 'Test Todo',
      }
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.addTodo(input)
      })

      // Assert
      const todos = result.current.todos
      expect(todos).toHaveLength(1)
      expect(todos[0]).toEqual({
        createdAt: mockDate,
        description: 'Test Description',
        id: mockId,
        status: 'pending',
        title: 'Test Todo',
        updatedAt: mockDate,
      })
    })

    it('resets loading state after successful add operation', async () => {
      // Arrange
      const input: CreateTodoInput = { title: 'Test Todo' }
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.addTodo(input)
      })

      // Assert loading state is false after completion
      expect(result.current.isLoading).toBe(false)
    })

    it('resets loading state on error', async () => {
      // Arrange
      const input: CreateTodoInput = { title: 'Test Todo' }
      const { result } = renderHook(() => useTodoStore())

      // Mock API to throw error
      vi.mocked(todoClient.createTodo).mockRejectedValueOnce(
        new Error('API Error')
      )

      // Act & Assert
      try {
        await act(async () => {
          await result.current.addTodo(input)
        })
      } catch (error) {
        expect((error as Error).message).toBe('API Error')
      }

      // Assert loading state is false after error
      expect(result.current.isLoading).toBe(false)
    })

    it('adds a new todo without description', async () => {
      // Arrange
      const input: CreateTodoInput = {
        title: 'Test Todo',
      }
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.addTodo(input)
      })

      // Assert
      const todos = result.current.todos
      expect(todos).toHaveLength(1)
      expect(todos[0]).toEqual({
        createdAt: mockDate,
        description: undefined,
        id: mockId,
        status: 'pending',
        title: 'Test Todo',
        updatedAt: mockDate,
      })
    })

    it('adds multiple todos', async () => {
      // Arrange
      const input1: CreateTodoInput = { title: 'Todo 1' }
      const input2: CreateTodoInput = { title: 'Todo 2' }
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.addTodo(input1)
        await result.current.addTodo(input2)
      })

      // Assert
      const todos = result.current.todos
      expect(todos).toHaveLength(2)
      expect(todos[0].title).toBe('Todo 1')
      expect(todos[1].title).toBe('Todo 2')
    })
  })

  describe('deleteTodo', () => {
    it('deletes a todo by id', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      // Act
      await act(async () => {
        await result.current.deleteTodo(mockId)
      })

      // Assert
      expect(result.current.todos).toHaveLength(0)
    })

    it('does not delete anything when id does not exist', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      // Act & Assert
      await expect(
        act(async () => {
          await result.current.deleteTodo('non-existent-id')
        })
      ).rejects.toThrow('Todo not found')

      expect(result.current.todos).toHaveLength(1)
    })

    it('resets loading state after successful delete operation', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      // Act
      await act(async () => {
        await result.current.deleteTodo(mockId)
      })

      // Assert loading state is false after completion
      expect(result.current.isLoading).toBe(false)
    })

    it('resets loading state on delete error', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      // Mock API to throw error
      vi.mocked(todoClient.deleteTodo).mockRejectedValueOnce(
        new Error('Delete failed')
      )

      // Act & Assert
      try {
        await act(async () => {
          await result.current.deleteTodo(mockId)
        })
      } catch (error) {
        expect((error as Error).message).toBe('Delete failed')
      }

      // Assert loading state is false after error
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('getAllTodos', () => {
    it('returns all todos', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input1: CreateTodoInput = { title: 'Todo 1' }
      const input2: CreateTodoInput = { title: 'Todo 2' }

      await act(async () => {
        await result.current.addTodo(input1)
        await result.current.addTodo(input2)
      })

      // Act
      const allTodos = result.current.getAllTodos()

      // Assert
      expect(allTodos).toHaveLength(2)
      expect(allTodos[0].title).toBe('Todo 1')
      expect(allTodos[1].title).toBe('Todo 2')
    })

    it('returns empty array when no todos exist', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())

      // Act
      const allTodos = result.current.getAllTodos()

      // Assert
      expect(allTodos).toHaveLength(0)
    })
  })

  describe('getCompletedTodos', () => {
    it('returns only completed todos', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todos: Todo[] = [
        {
          createdAt: mockDate,
          id: '1',
          status: 'completed',
          title: 'Completed Todo',
          updatedAt: mockDate,
        },
        {
          createdAt: mockDate,
          id: '2',
          status: 'pending',
          title: 'Pending Todo',
          updatedAt: mockDate,
        },
      ]

      await act(async () => {
        await result.current.initializeTodos(todos)
      })

      // Act
      const completedTodos = result.current.getCompletedTodos()

      // Assert
      expect(completedTodos).toHaveLength(1)
      expect(completedTodos[0].title).toBe('Completed Todo')
      expect(completedTodos[0].status).toBe('completed')
    })

    it('returns empty array when no completed todos exist', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todos: Todo[] = [
        {
          createdAt: mockDate,
          id: '1',
          status: 'pending',
          title: 'Pending Todo',
          updatedAt: mockDate,
        },
      ]

      await act(async () => {
        await result.current.initializeTodos(todos)
      })

      // Act
      const completedTodos = result.current.getCompletedTodos()

      // Assert
      expect(completedTodos).toHaveLength(0)
    })
  })

  describe('getPendingTodos', () => {
    it('returns only pending todos', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todos: Todo[] = [
        {
          createdAt: mockDate,
          id: '1',
          status: 'completed',
          title: 'Completed Todo',
          updatedAt: mockDate,
        },
        {
          createdAt: mockDate,
          id: '2',
          status: 'pending',
          title: 'Pending Todo',
          updatedAt: mockDate,
        },
      ]

      await act(async () => {
        await result.current.initializeTodos(todos)
      })

      // Act
      const pendingTodos = result.current.getPendingTodos()

      // Assert
      expect(pendingTodos).toHaveLength(1)
      expect(pendingTodos[0].title).toBe('Pending Todo')
      expect(pendingTodos[0].status).toBe('pending')
    })

    it('returns empty array when no pending todos exist', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todos: Todo[] = [
        {
          createdAt: mockDate,
          id: '1',
          status: 'completed',
          title: 'Completed Todo',
          updatedAt: mockDate,
        },
      ]

      await act(async () => {
        await result.current.initializeTodos(todos)
      })

      // Act
      const pendingTodos = result.current.getPendingTodos()

      // Assert
      expect(pendingTodos).toHaveLength(0)
    })
  })

  describe('getTodoById', () => {
    it('returns todo by id', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todo: Todo = {
        createdAt: mockDate,
        id: 'test-id',
        status: 'pending',
        title: 'Test Todo',
        updatedAt: mockDate,
      }

      await act(async () => {
        await result.current.initializeTodos([todo])
      })

      // Act
      const foundTodo = result.current.getTodoById('test-id')

      // Assert
      expect(foundTodo).toEqual(todo)
    })

    it('returns undefined when todo does not exist', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())

      // Act
      const foundTodo = result.current.getTodoById('non-existent-id')

      // Assert
      expect(foundTodo).toBeUndefined()
    })
  })

  describe('initializeTodos', () => {
    it('initializes todos with provided array', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todos: Todo[] = [
        {
          createdAt: mockDate,
          id: '1',
          status: 'pending',
          title: 'Todo 1',
          updatedAt: mockDate,
        },
        {
          createdAt: mockDate,
          id: '2',
          status: 'completed',
          title: 'Todo 2',
          updatedAt: mockDate,
        },
      ]

      // Act
      await act(async () => {
        await result.current.initializeTodos(todos)
      })

      // Assert
      expect(result.current.todos).toEqual(todos)
    })

    it('replaces existing todos with new ones', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const existingTodos: Todo[] = [
        {
          createdAt: mockDate,
          id: '1',
          status: 'pending',
          title: 'Existing Todo',
          updatedAt: mockDate,
        },
      ]
      const newTodos: Todo[] = [
        {
          createdAt: mockDate,
          id: '2',
          status: 'completed',
          title: 'New Todo',
          updatedAt: mockDate,
        },
      ]

      await act(async () => {
        await result.current.initializeTodos(existingTodos)
      })

      // Act
      await act(async () => {
        await result.current.initializeTodos(newTodos)
      })

      // Assert
      expect(result.current.todos).toEqual(newTodos)
      expect(result.current.todos).toHaveLength(1)
    })

    it('fetches todos from API when no todos provided', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const apiTodos: Todo[] = [
        {
          createdAt: mockDate,
          id: '1',
          status: 'pending',
          title: 'API Todo 1',
          updatedAt: mockDate,
        },
        {
          createdAt: mockDate,
          id: '2',
          status: 'completed',
          title: 'API Todo 2',
          updatedAt: mockDate,
        },
      ]

      // Set up getTodos mock to return the API todos
      vi.mocked(todoClient.getTodos).mockResolvedValueOnce(apiTodos)

      // Act
      await act(async () => {
        await result.current.initializeTodos()
      })

      // Assert
      expect(todoClient.getTodos).toHaveBeenCalled()
      expect(result.current.todos).toEqual(apiTodos)
    })

    it('resets loading state after successful API fetch', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const apiTodos: Todo[] = [
        {
          createdAt: mockDate,
          id: '1',
          status: 'pending',
          title: 'API Todo 1',
          updatedAt: mockDate,
        },
      ]

      // Set up getTodos mock to return the API todos
      vi.mocked(todoClient.getTodos).mockResolvedValueOnce(apiTodos)

      // Act
      await act(async () => {
        await result.current.initializeTodos()
      })

      // Assert loading state is false after completion
      expect(result.current.isLoading).toBe(false)
      expect(result.current.todos).toEqual(apiTodos)
    })

    it('resets loading state on API fetch error', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())

      // Mock API to throw error
      vi.mocked(todoClient.getTodos).mockRejectedValueOnce(
        new Error('API Error')
      )

      // Act & Assert
      try {
        await act(async () => {
          await result.current.initializeTodos()
        })
      } catch (error) {
        expect((error as Error).message).toBe('API Error')
      }

      // Assert loading state is false after error
      expect(result.current.isLoading).toBe(false)
    })

    it('does not set loading state when todos are provided', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todos: Todo[] = [
        {
          createdAt: mockDate,
          id: '1',
          status: 'pending',
          title: 'Todo 1',
          updatedAt: mockDate,
        },
      ]

      // Act
      await act(async () => {
        await result.current.initializeTodos(todos)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.todos).toEqual(todos)
    })
  })

  describe('toggleTodoStatus', () => {
    it('toggles todo status from pending to completed', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      // Act
      await act(async () => {
        await result.current.toggleTodoStatus(mockId)
      })

      // Assert
      const updatedTodo = result.current.getTodoById(mockId)
      expect(updatedTodo?.status).toBe('completed')
      expect(updatedTodo?.updatedAt).toEqual(mockDate)
    })

    it('toggles todo status from completed to pending', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
        // First toggle to make it completed
        await result.current.toggleTodoStatus(mockId)
      })

      // Act
      await act(async () => {
        await result.current.toggleTodoStatus(mockId)
      })

      // Assert
      const updatedTodo = result.current.getTodoById(mockId)
      expect(updatedTodo?.status).toBe('pending')
      expect(updatedTodo?.updatedAt).toEqual(mockDate)
    })

    it('does not change anything when todo does not exist', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      // Act & Assert
      await expect(
        act(async () => {
          await result.current.toggleTodoStatus('non-existent-id')
        })
      ).rejects.toThrow('Todo not found')

      const existingTodo = result.current.getTodoById(mockId)
      expect(existingTodo?.status).toBe('pending')
    })

    it('resets loading state after successful toggle operation', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      // Act
      await act(async () => {
        await result.current.toggleTodoStatus(mockId)
      })

      // Assert loading state is false after completion
      expect(result.current.isLoading).toBe(false)
      const updatedTodo = result.current.getTodoById(mockId)
      expect(updatedTodo?.status).toBe('completed')
    })

    it('resets loading state on toggle error', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      // Mock API to throw error
      vi.mocked(todoClient.toggleTodo).mockRejectedValueOnce(
        new Error('Toggle failed')
      )

      // Act & Assert
      try {
        await act(async () => {
          await result.current.toggleTodoStatus(mockId)
        })
      } catch (error) {
        expect((error as Error).message).toBe('Toggle failed')
      }

      // Assert loading state is false after error
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('updateTodo', () => {
    it('updates todo with new values', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = {
        description: 'Original Description',
        title: 'Original Title',
      }

      await act(async () => {
        await result.current.addTodo(input)
      })

      const updateInput: UpdateTodoInput = {
        description: 'Updated Description',
        status: 'completed',
        title: 'Updated Title',
      }

      // Act
      await act(async () => {
        await result.current.updateTodo(mockId, updateInput)
      })

      // Assert
      const updatedTodo = result.current.getTodoById(mockId)
      expect(updatedTodo?.title).toBe('Updated Title')
      expect(updatedTodo?.description).toBe('Updated Description')
      expect(updatedTodo?.status).toBe('completed')
      expect(updatedTodo?.updatedAt).toEqual(mockDate)
    })

    it('updates only provided fields', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = {
        description: 'Original Description',
        title: 'Original Title',
      }

      await act(async () => {
        await result.current.addTodo(input)
      })

      const updateInput: UpdateTodoInput = {
        title: 'Updated Title',
      }

      // Act
      await act(async () => {
        await result.current.updateTodo(mockId, updateInput)
      })

      // Assert
      const updatedTodo = result.current.getTodoById(mockId)
      expect(updatedTodo?.title).toBe('Updated Title')
      expect(updatedTodo?.description).toBe('Original Description')
      expect(updatedTodo?.status).toBe('pending')
      expect(updatedTodo?.updatedAt).toEqual(mockDate)
    })

    it('does not update anything when todo does not exist', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      const updateInput: UpdateTodoInput = {
        title: 'Updated Title',
      }

      // Act & Assert
      await expect(
        act(async () => {
          await result.current.updateTodo('non-existent-id', updateInput)
        })
      ).rejects.toThrow('Todo not found')

      const existingTodo = result.current.getTodoById(mockId)
      expect(existingTodo?.title).toBe('Test Todo')
    })

    it('resets loading state after successful update operation', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      const updateInput: UpdateTodoInput = {
        title: 'Updated Title',
      }

      // Act
      await act(async () => {
        await result.current.updateTodo(mockId, updateInput)
      })

      // Assert loading state is false after completion
      expect(result.current.isLoading).toBe(false)
      const updatedTodo = result.current.getTodoById(mockId)
      expect(updatedTodo?.title).toBe('Updated Title')
    })

    it('resets loading state on update error', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      await act(async () => {
        await result.current.addTodo(input)
      })

      const updateInput: UpdateTodoInput = {
        title: 'Updated Title',
      }

      // Mock API to throw error
      vi.mocked(todoClient.updateTodo).mockRejectedValueOnce(
        new Error('Update failed')
      )

      // Act & Assert
      try {
        await act(async () => {
          await result.current.updateTodo(mockId, updateInput)
        })
      } catch (error) {
        expect((error as Error).message).toBe('Update failed')
      }

      // Assert loading state is false after error
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('isLoading', () => {
    it('has default loading state as false', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())

      // Assert
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('todos', () => {
    it('has default todos as empty array', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())

      // Assert
      expect(result.current.todos).toEqual([])
    })
  })
})

describe('useTodoStats', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTodoStore.setState({
      isLoading: false,
      todos: [],
    })
  })

  it('returns correct stats for empty todos', () => {
    // Arrange
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current).toEqual({
      completed: 0,
      completionRate: 0,
      pending: 0,
      total: 0,
    })
  })

  it('returns correct stats for todos with mixed statuses', async () => {
    // Arrange
    const todos: Todo[] = [
      {
        createdAt: mockDate,
        id: '1',
        status: 'completed',
        title: 'Todo 1',
        updatedAt: mockDate,
      },
      {
        createdAt: mockDate,
        id: '2',
        status: 'completed',
        title: 'Todo 2',
        updatedAt: mockDate,
      },
      {
        createdAt: mockDate,
        id: '3',
        status: 'pending',
        title: 'Todo 3',
        updatedAt: mockDate,
      },
    ]

    await act(async () => {
      await useTodoStore.getState().initializeTodos(todos)
    })

    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current).toEqual({
      completed: 2,
      completionRate: 67, // 2/3 * 100 = 66.67, rounded to 67
      pending: 1,
      total: 3,
    })
  })

  it('returns correct stats for all completed todos', async () => {
    // Arrange
    const todos: Todo[] = [
      {
        createdAt: mockDate,
        id: '1',
        status: 'completed',
        title: 'Todo 1',
        updatedAt: mockDate,
      },
      {
        createdAt: mockDate,
        id: '2',
        status: 'completed',
        title: 'Todo 2',
        updatedAt: mockDate,
      },
    ]

    await act(async () => {
      await useTodoStore.getState().initializeTodos(todos)
    })

    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current).toEqual({
      completed: 2,
      completionRate: 100,
      pending: 0,
      total: 2,
    })
  })

  it('returns correct stats for all pending todos', async () => {
    // Arrange
    const todos: Todo[] = [
      {
        createdAt: mockDate,
        id: '1',
        status: 'pending',
        title: 'Todo 1',
        updatedAt: mockDate,
      },
      {
        createdAt: mockDate,
        id: '2',
        status: 'pending',
        title: 'Todo 2',
        updatedAt: mockDate,
      },
    ]

    await act(async () => {
      await useTodoStore.getState().initializeTodos(todos)
    })

    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current).toEqual({
      completed: 0,
      completionRate: 0,
      pending: 2,
      total: 2,
    })
  })

  it('calculates completion rate correctly with fractional results', async () => {
    // Arrange
    const todos: Todo[] = [
      {
        createdAt: mockDate,
        id: '1',
        status: 'completed',
        title: 'Todo 1',
        updatedAt: mockDate,
      },
      {
        createdAt: mockDate,
        id: '2',
        status: 'pending',
        title: 'Todo 2',
        updatedAt: mockDate,
      },
      {
        createdAt: mockDate,
        id: '3',
        status: 'pending',
        title: 'Todo 3',
        updatedAt: mockDate,
      },
    ]

    await act(async () => {
      await useTodoStore.getState().initializeTodos(todos)
    })

    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current).toEqual({
      completed: 1,
      completionRate: 33, // 1/3 * 100 = 33.33, rounded to 33
      pending: 2,
      total: 3,
    })
  })

  it('handles edge case with single todo', async () => {
    // Arrange
    const todos: Todo[] = [
      {
        createdAt: mockDate,
        id: '1',
        status: 'completed',
        title: 'Single Todo',
        updatedAt: mockDate,
      },
    ]

    await act(async () => {
      await useTodoStore.getState().initializeTodos(todos)
    })

    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current).toEqual({
      completed: 1,
      completionRate: 100,
      pending: 0,
      total: 1,
    })
  })

  it('handles edge case with large number of todos', async () => {
    // Arrange
    const todos: Todo[] = Array.from({ length: 1000 }, (_, i) => ({
      createdAt: mockDate,
      id: `${i + 1}`,
      status: i < 333 ? 'completed' : ('pending' as const),
      title: `Todo ${i + 1}`,
      updatedAt: mockDate,
    }))

    await act(async () => {
      await useTodoStore.getState().initializeTodos(todos)
    })

    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current).toEqual({
      completed: 333,
      completionRate: 33, // 333/1000 * 100 = 33.3, rounded to 33
      pending: 667,
      total: 1000,
    })
  })
})
