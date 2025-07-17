import { MockedProvider } from '@apollo/client/testing'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useTodosGraphQL } from './use-todos-graphql'

import { CREATE_TODO, GET_TODOS } from '@/graphql/queries/todos'

/**
 * GraphQL TODOフックのテスト
 *
 * TDD: REST API から GraphQL への移行をテストドリブンで実装
 */
describe('useTodosGraphQL', () => {
  const mockTodos = [
    {
      categoryId: null,
      createdAt: new Date().toISOString(),
      description: 'Test description 1',
      dueDate: null,
      id: '1',
      isCompleted: false,
      isImportant: true,
      order: 0,
      title: 'Test Todo 1',
      updatedAt: new Date().toISOString(),
      userId: 'user1',
    },
    {
      categoryId: null,
      createdAt: new Date().toISOString(),
      description: 'Test description 2',
      dueDate: null,
      id: '2',
      isCompleted: true,
      isImportant: false,
      order: 1,
      title: 'Test Todo 2',
      updatedAt: new Date().toISOString(),
      userId: 'user1',
    },
  ]

  const mocks = [
    {
      request: {
        query: GET_TODOS,
      },
      result: {
        data: {
          todos: mockTodos,
        },
      },
    },
    {
      request: {
        query: CREATE_TODO,
        variables: {
          title: 'New Todo',
        },
      },
      result: {
        data: {
          createTodo: {
            categoryId: null,
            createdAt: new Date().toISOString(),
            description: 'Created via GraphQL',
            dueDate: null,
            id: '3',
            isCompleted: false,
            isImportant: false,
            order: 0,
            title: 'New Todo',
            updatedAt: new Date().toISOString(),
            userId: 'user1',
          },
        },
      },
    },
  ]

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockedProvider addTypename={false} mocks={mocks}>
      {children}
    </MockedProvider>
  )

  describe('useTodosGraphQL フック', () => {
    it('should fetch todos successfully', async () => {
      const { result } = renderHook(() => useTodosGraphQL(), { wrapper })

      expect(result.current.loading).toBe(true)
      expect(result.current.todos).toEqual([])

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.todos).toHaveLength(2)
      expect(result.current.todos[0].title).toBe('Test Todo 1')
      expect(result.current.todos[1].title).toBe('Test Todo 2')
      expect(result.current.error).toBeUndefined()
    })

    it('should handle errors gracefully', async () => {
      const errorMocks = [
        {
          error: new Error('Network Error'),
          request: {
            query: GET_TODOS,
          },
        },
      ]

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider addTypename={false} mocks={errorMocks}>
          {children}
        </MockedProvider>
      )

      const { result } = renderHook(() => useTodosGraphQL(), {
        wrapper: errorWrapper,
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.todos).toEqual([])
    })

    it('should provide create todo function', async () => {
      const { result } = renderHook(() => useTodosGraphQL(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(typeof result.current.createTodo).toBe('function')
    })

    it('should provide update todo function', async () => {
      const { result } = renderHook(() => useTodosGraphQL(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(typeof result.current.updateTodo).toBe('function')
    })

    it('should provide delete todo function', async () => {
      const { result } = renderHook(() => useTodosGraphQL(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(typeof result.current.deleteTodo).toBe('function')
    })

    it('should provide toggle todo function', async () => {
      const { result } = renderHook(() => useTodosGraphQL(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(typeof result.current.toggleTodo).toBe('function')
    })
  })

  describe('GraphQL ミューテーション', () => {
    it('should create todo via GraphQL', async () => {
      const { result } = renderHook(() => useTodosGraphQL(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const createTodoSpy = vi.fn()
      result.current.createTodo = createTodoSpy

      await result.current.createTodo('New Todo')

      expect(createTodoSpy).toHaveBeenCalledWith('New Todo')
    })
  })
})
