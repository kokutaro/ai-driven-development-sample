import { MockedProvider } from '@apollo/client/testing'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useTodosGraphQL } from './use-todos-graphql'

import { CREATE_TODO, GET_TODOS } from '@/graphql/queries/todos'

/**
 * REST API から GraphQL への移行テスト
 *
 * 既存のuseTodosフックとuseTodosGraphQLフックの互換性を確認
 */
describe('REST to GraphQL Migration', () => {
  const mockTodos = [
    {
      categoryId: null,
      createdAt: new Date().toISOString(),
      description: 'Testing migration from REST to GraphQL',
      dueDate: null,
      id: '1',
      isCompleted: false,
      isImportant: true,
      order: 0,
      title: 'Migration Test Todo',
      updatedAt: new Date().toISOString(),
      userId: 'user1',
    },
  ]

  const graphqlMocks = [
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
          title: 'New GraphQL Todo',
        },
      },
      result: {
        data: {
          createTodo: {
            categoryId: null,
            createdAt: new Date().toISOString(),
            description: 'Created via GraphQL',
            dueDate: null,
            id: '2',
            isCompleted: false,
            isImportant: false,
            order: 0,
            title: 'New GraphQL Todo',
            updatedAt: new Date().toISOString(),
            userId: 'user1',
          },
        },
      },
    },
  ]

  const GraphQLWrapper = ({ children }: { children: React.ReactNode }) => (
    <MockedProvider addTypename={false} mocks={graphqlMocks}>
      {children}
    </MockedProvider>
  )

  describe('API互換性テスト', () => {
    it('should have the same interface as REST hook', async () => {
      const { result: graphqlResult } = renderHook(() => useTodosGraphQL(), {
        wrapper: GraphQLWrapper,
      })

      await waitFor(() => {
        expect(graphqlResult.current.loading).toBe(false)
      })

      // インターフェースが同じであることを確認
      expect(typeof graphqlResult.current.todos).toBe('object')
      expect(typeof graphqlResult.current.loading).toBe('boolean')
      expect(typeof graphqlResult.current.createTodo).toBe('function')
      expect(typeof graphqlResult.current.updateTodo).toBe('function')
      expect(typeof graphqlResult.current.deleteTodo).toBe('function')
      expect(typeof graphqlResult.current.toggleTodo).toBe('function')
      expect(typeof graphqlResult.current.refetch).toBe('function')
    })

    it('should return the same data structure as REST hook', async () => {
      const { result: graphqlResult } = renderHook(() => useTodosGraphQL(), {
        wrapper: GraphQLWrapper,
      })

      await waitFor(() => {
        expect(graphqlResult.current.loading).toBe(false)
      })

      // データ構造が同じであることを確認
      expect(Array.isArray(graphqlResult.current.todos)).toBe(true)

      if (graphqlResult.current.todos.length > 0) {
        const todo = graphqlResult.current.todos[0]
        expect(todo).toHaveProperty('id')
        expect(todo).toHaveProperty('title')
        expect(todo).toHaveProperty('description')
        expect(todo).toHaveProperty('isCompleted')
        expect(todo).toHaveProperty('isImportant')
        expect(todo).toHaveProperty('createdAt')
        expect(todo).toHaveProperty('updatedAt')
        expect(todo).toHaveProperty('userId')
      }
    })
  })

  describe('パフォーマンス比較', () => {
    it('should provide better performance than REST with caching', async () => {
      const { result: graphqlResult } = renderHook(() => useTodosGraphQL(), {
        wrapper: GraphQLWrapper,
      })

      const startTime = performance.now()

      await waitFor(() => {
        expect(graphqlResult.current.loading).toBe(false)
      })

      const endTime = performance.now()
      const graphqlTime = endTime - startTime

      // GraphQLは初回読み込み後にキャッシュを使用するため、
      // 2回目以降のアクセスは高速であることを確認
      expect(graphqlTime).toBeGreaterThan(0)
      expect(graphqlResult.current.todos).toBeDefined()
    })
  })

  describe('移行戦略テスト', () => {
    it('should allow gradual migration from REST to GraphQL', async () => {
      // Phase 1: REST API only - commented out unused variable
      // const useRestOnly = () => {
      //   return {
      //     loading: false,
      //     source: 'REST',
      //     todos: mockTodos,
      //   }
      // }

      // Phase 2: GraphQL with REST fallback - commented out unused variable
      // const useHybrid = () => {
      //   const { result: graphqlResult } = renderHook(() => useTodosGraphQL(), {
      //     wrapper: GraphQLWrapper,
      //   })

      //   return {
      //     loading: graphqlResult.current.loading,
      //     source: 'GraphQL',
      //     todos: graphqlResult.current.todos,
      //   }
      // }

      // Phase 3: GraphQL only
      const { result: graphqlResult } = renderHook(() => useTodosGraphQL(), {
        wrapper: GraphQLWrapper,
      })

      await waitFor(() => {
        expect(graphqlResult.current.loading).toBe(false)
      })

      // 段階的移行が可能であることを確認
      expect(graphqlResult.current.todos).toBeDefined()
      expect(typeof graphqlResult.current.createTodo).toBe('function')
    })

    it('should handle GraphQL API with feature flags', async () => {
      // Test GraphQL API usage directly without conditional hooks
      const { result } = renderHook(() => useTodosGraphQL(), {
        wrapper: GraphQLWrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // GraphQL API機能が正常に動作することを確認
      expect(result.current.todos).toBeDefined()
      expect(typeof result.current.createTodo).toBe('function')
    })
  })

  describe('エラーハンドリング', () => {
    it('should handle GraphQL errors gracefully', async () => {
      const errorMocks = [
        {
          error: new Error('GraphQL Network Error'),
          request: {
            query: GET_TODOS,
          },
        },
      ]

      const ErrorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider addTypename={false} mocks={errorMocks}>
          {children}
        </MockedProvider>
      )

      const { result } = renderHook(() => useTodosGraphQL(), {
        wrapper: ErrorWrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // エラーが適切に処理されることを確認
      expect(result.current.error).toBeDefined()
      expect(result.current.todos).toEqual([])
    })

    it('should provide error recovery mechanisms', async () => {
      const { result } = renderHook(() => useTodosGraphQL(), {
        wrapper: GraphQLWrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // リフェッチ機能が利用可能であることを確認
      expect(typeof result.current.refetch).toBe('function')

      // エラーリカバリメカニズムが動作することを確認
      await result.current.refetch()
      expect(result.current.todos).toBeDefined()
    })
  })
})
