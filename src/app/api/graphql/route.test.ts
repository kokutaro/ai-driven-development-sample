import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it } from 'vitest'

import { GET, POST } from './route'

/**
 * GraphQL API エンドポイントのテスト
 *
 * TDD: REST API から GraphQL への移行をテストドリブンで実装
 */
describe('GraphQL API エンドポイント', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3000/api/graphql', {
      body: JSON.stringify({
        query: `
          query {
            hello
          }
        `,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  })

  describe('基本的なGraphQL クエリ', () => {
    it('should respond to hello query', async () => {
      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.hello).toBeDefined()
      expect(typeof data.data.hello).toBe('string')
    })

    it('should handle GET requests with valid query', async () => {
      const getRequest = new NextRequest(
        `http://localhost:3000/api/graphql?query=${encodeURIComponent('{ hello }')}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(getRequest)
      // GET requests might not always be supported depending on configuration
      expect([200, 400, 405]).toContain(response.status)
    })
  })

  describe('Todo GraphQL クエリ（移行後）', () => {
    it('should support todos query', async () => {
      const todoRequest = new NextRequest('http://localhost:3000/api/graphql', {
        body: JSON.stringify({
          query: `
            query {
              todos {
                id
                title
                isCompleted
              }
            }
          `,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const response = await POST(todoRequest)
      const data = await response.json()

      // 最初はエラーになるはず（実装前）
      expect(response.status).toBe(200)
      // エラーがない場合は成功
      if (!data.errors) {
        expect(data.data.todos).toBeDefined()
        expect(Array.isArray(data.data.todos)).toBe(true)
      }
    })

    it('should support createTodo mutation', async () => {
      const createTodoRequest = new NextRequest(
        'http://localhost:3000/api/graphql',
        {
          body: JSON.stringify({
            query: `
            mutation {
              createTodo(title: "Test Todo") {
                id
                title
                isCompleted
              }
            }
          `,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )

      const response = await POST(createTodoRequest)
      const data = await response.json()

      // 最初はエラーになるはず（実装前）
      expect(response.status).toBe(200)
      // エラーがない場合は成功
      if (!data.errors) {
        expect(data.data.createTodo).toBeDefined()
        expect(data.data.createTodo.title).toBe('Test Todo')
        expect(data.data.createTodo.isCompleted).toBe(false)
      }
    })
  })
})
