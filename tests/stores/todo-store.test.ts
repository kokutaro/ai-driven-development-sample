import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'

import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'

import { useTodoStats, useTodoStore } from '@/stores/todo-store'

// Mock crypto.randomUUID for consistent testing
const mockId = 'test-id-123'
const mockRandomUUID = vi.fn(() => mockId)
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
  },
})

// Mock Date for consistent testing
const mockDate = new Date('2023-12-25T10:00:00Z')
const mockDateNow = vi.fn(() => mockDate.getTime())
Object.defineProperty(globalThis, 'Date', {
  value: class extends Date {
    constructor() {
      super()
      return mockDate
    }
    static now() {
      return mockDateNow()
    }
  },
})

describe('useTodoStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTodoStore.setState({
      isLoading: false,
      todos: [],
    })
    mockRandomUUID.mockReturnValue(mockId)
    mockDateNow.mockReturnValue(mockDate.getTime())
  })

  afterEach(() => {
    mockRandomUUID.mockClear()
    mockDateNow.mockClear()
  })

  describe('addTodo', () => {
    it('adds a new todo with pending status', () => {
      // Arrange
      const input: CreateTodoInput = {
        description: 'Test Description',
        title: 'Test Todo',
      }
      const { result } = renderHook(() => useTodoStore())

      // Act
      act(() => {
        result.current.addTodo(input)
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

    it('adds a new todo without description', () => {
      // Arrange
      const input: CreateTodoInput = {
        title: 'Test Todo',
      }
      const { result } = renderHook(() => useTodoStore())

      // Act
      act(() => {
        result.current.addTodo(input)
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

    it('adds multiple todos', () => {
      // Arrange
      const input1: CreateTodoInput = { title: 'Todo 1' }
      const input2: CreateTodoInput = { title: 'Todo 2' }
      const { result } = renderHook(() => useTodoStore())

      // Act
      act(() => {
        result.current.addTodo(input1)
        result.current.addTodo(input2)
      })

      // Assert
      const todos = result.current.todos
      expect(todos).toHaveLength(2)
      expect(todos[0].title).toBe('Todo 1')
      expect(todos[1].title).toBe('Todo 2')
    })
  })

  describe('deleteTodo', () => {
    it('deletes a todo by id', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      act(() => {
        result.current.addTodo(input)
      })

      // Act
      act(() => {
        result.current.deleteTodo(mockId)
      })

      // Assert
      expect(result.current.todos).toHaveLength(0)
    })

    it('does not delete anything when id does not exist', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input: CreateTodoInput = { title: 'Test Todo' }

      act(() => {
        result.current.addTodo(input)
      })

      // Act
      act(() => {
        result.current.deleteTodo('non-existent-id')
      })

      // Assert
      expect(result.current.todos).toHaveLength(1)
    })
  })

  describe('getAllTodos', () => {
    it('returns all todos', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const input1: CreateTodoInput = { title: 'Todo 1' }
      const input2: CreateTodoInput = { title: 'Todo 2' }

      act(() => {
        result.current.addTodo(input1)
        result.current.addTodo(input2)
      })

      // Act
      const allTodos = result.current.getAllTodos()

      // Assert
      expect(allTodos).toHaveLength(2)
      expect(allTodos[0].title).toBe('Todo 1')
      expect(allTodos[1].title).toBe('Todo 2')
    })

    it('returns empty array when no todos exist', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())

      // Act
      const allTodos = result.current.getAllTodos()

      // Assert
      expect(allTodos).toHaveLength(0)
    })
  })

  describe('getCompletedTodos', () => {
    it('returns only completed todos', () => {
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

      act(() => {
        result.current.initializeTodos(todos)
      })

      // Act
      const completedTodos = result.current.getCompletedTodos()

      // Assert
      expect(completedTodos).toHaveLength(1)
      expect(completedTodos[0].title).toBe('Completed Todo')
      expect(completedTodos[0].status).toBe('completed')
    })

    it('returns empty array when no completed todos exist', () => {
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

      act(() => {
        result.current.initializeTodos(todos)
      })

      // Act
      const completedTodos = result.current.getCompletedTodos()

      // Assert
      expect(completedTodos).toHaveLength(0)
    })
  })

  describe('getPendingTodos', () => {
    it('returns only pending todos', () => {
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

      act(() => {
        result.current.initializeTodos(todos)
      })

      // Act
      const pendingTodos = result.current.getPendingTodos()

      // Assert
      expect(pendingTodos).toHaveLength(1)
      expect(pendingTodos[0].title).toBe('Pending Todo')
      expect(pendingTodos[0].status).toBe('pending')
    })

    it('returns empty array when no pending todos exist', () => {
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

      act(() => {
        result.current.initializeTodos(todos)
      })

      // Act
      const pendingTodos = result.current.getPendingTodos()

      // Assert
      expect(pendingTodos).toHaveLength(0)
    })
  })

  describe('getTodoById', () => {
    it('returns todo by id', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todo: Todo = {
        createdAt: mockDate,
        id: 'test-id',
        status: 'pending',
        title: 'Test Todo',
        updatedAt: mockDate,
      }

      act(() => {
        result.current.initializeTodos([todo])
      })

      // Act
      const foundTodo = result.current.getTodoById('test-id')

      // Assert
      expect(foundTodo).toEqual(todo)
    })

    it('returns undefined when todo does not exist', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())

      // Act
      const foundTodo = result.current.getTodoById('non-existent-id')

      // Assert
      expect(foundTodo).toBeUndefined()
    })
  })

  describe('initializeTodos', () => {
    it('initializes todos with provided array', () => {
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
      act(() => {
        result.current.initializeTodos(todos)
      })

      // Assert
      expect(result.current.todos).toEqual(todos)
    })

    it('replaces existing todos with new ones', () => {
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

      act(() => {
        result.current.initializeTodos(existingTodos)
      })

      // Act
      act(() => {
        result.current.initializeTodos(newTodos)
      })

      // Assert
      expect(result.current.todos).toEqual(newTodos)
      expect(result.current.todos).toHaveLength(1)
    })
  })

  describe('toggleTodoStatus', () => {
    it('toggles todo status from pending to completed', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todo: Todo = {
        createdAt: mockDate,
        id: 'test-id',
        status: 'pending',
        title: 'Test Todo',
        updatedAt: mockDate,
      }

      act(() => {
        result.current.initializeTodos([todo])
      })

      // Act
      act(() => {
        result.current.toggleTodoStatus('test-id')
      })

      // Assert
      const updatedTodo = result.current.getTodoById('test-id')
      expect(updatedTodo?.status).toBe('completed')
      expect(updatedTodo?.updatedAt).toEqual(mockDate)
    })

    it('toggles todo status from completed to pending', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todo: Todo = {
        createdAt: mockDate,
        id: 'test-id',
        status: 'completed',
        title: 'Test Todo',
        updatedAt: mockDate,
      }

      act(() => {
        result.current.initializeTodos([todo])
      })

      // Act
      act(() => {
        result.current.toggleTodoStatus('test-id')
      })

      // Assert
      const updatedTodo = result.current.getTodoById('test-id')
      expect(updatedTodo?.status).toBe('pending')
      expect(updatedTodo?.updatedAt).toEqual(mockDate)
    })

    it('does not change anything when todo does not exist', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todo: Todo = {
        createdAt: mockDate,
        id: 'test-id',
        status: 'pending',
        title: 'Test Todo',
        updatedAt: mockDate,
      }

      act(() => {
        result.current.initializeTodos([todo])
      })

      // Act
      act(() => {
        result.current.toggleTodoStatus('non-existent-id')
      })

      // Assert
      const existingTodo = result.current.getTodoById('test-id')
      expect(existingTodo?.status).toBe('pending')
    })
  })

  describe('updateTodo', () => {
    it('updates todo with new values', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todo: Todo = {
        createdAt: mockDate,
        description: 'Original Description',
        id: 'test-id',
        status: 'pending',
        title: 'Original Title',
        updatedAt: mockDate,
      }

      act(() => {
        result.current.initializeTodos([todo])
      })

      const updateInput: UpdateTodoInput = {
        description: 'Updated Description',
        status: 'completed',
        title: 'Updated Title',
      }

      // Act
      act(() => {
        result.current.updateTodo('test-id', updateInput)
      })

      // Assert
      const updatedTodo = result.current.getTodoById('test-id')
      expect(updatedTodo?.title).toBe('Updated Title')
      expect(updatedTodo?.description).toBe('Updated Description')
      expect(updatedTodo?.status).toBe('completed')
      expect(updatedTodo?.updatedAt).toEqual(mockDate)
    })

    it('updates only provided fields', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todo: Todo = {
        createdAt: mockDate,
        description: 'Original Description',
        id: 'test-id',
        status: 'pending',
        title: 'Original Title',
        updatedAt: mockDate,
      }

      act(() => {
        result.current.initializeTodos([todo])
      })

      const updateInput: UpdateTodoInput = {
        title: 'Updated Title',
      }

      // Act
      act(() => {
        result.current.updateTodo('test-id', updateInput)
      })

      // Assert
      const updatedTodo = result.current.getTodoById('test-id')
      expect(updatedTodo?.title).toBe('Updated Title')
      expect(updatedTodo?.description).toBe('Original Description')
      expect(updatedTodo?.status).toBe('pending')
      expect(updatedTodo?.updatedAt).toEqual(mockDate)
    })

    it('does not update anything when todo does not exist', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      const todo: Todo = {
        createdAt: mockDate,
        id: 'test-id',
        status: 'pending',
        title: 'Test Todo',
        updatedAt: mockDate,
      }

      act(() => {
        result.current.initializeTodos([todo])
      })

      const updateInput: UpdateTodoInput = {
        title: 'Updated Title',
      }

      // Act
      act(() => {
        result.current.updateTodo('non-existent-id', updateInput)
      })

      // Assert
      const existingTodo = result.current.getTodoById('test-id')
      expect(existingTodo?.title).toBe('Test Todo')
    })
  })

  describe('isLoading', () => {
    it('has default loading state as false', () => {
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

  it('returns correct stats for todos with mixed statuses', () => {
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

    act(() => {
      useTodoStore.getState().initializeTodos(todos)
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

  it('returns correct stats for all completed todos', () => {
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

    act(() => {
      useTodoStore.getState().initializeTodos(todos)
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

  it('returns correct stats for all pending todos', () => {
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

    act(() => {
      useTodoStore.getState().initializeTodos(todos)
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

  it('calculates completion rate correctly with fractional results', () => {
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

    act(() => {
      useTodoStore.getState().initializeTodos(todos)
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
})
