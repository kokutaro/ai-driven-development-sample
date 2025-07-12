import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// 認証モック
vi.mock('@/lib/auth', () => ({
  getUserIdFromRequestWithApiKey: vi.fn(),
}))

// モックを最初にインポート
import { GET, POST } from '@/app/api/kanban-columns/route'
import { getUserIdFromRequestWithApiKey } from '@/lib/auth'
import { mockPrisma } from '@/tests/__mocks__/prisma'

const mockGetUserIdFromRequestWithApiKey =
  getUserIdFromRequestWithApiKey as ReturnType<typeof vi.fn>

describe('/api/kanban-columns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトで認証済みユーザーとしてモック
    mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user-1')
  })

  describe('GET', () => {
    it('should return kanban columns successfully', async () => {
      const mockColumns = [
        {
          color: '#FF6B6B',
          createdAt: new Date(),
          id: 'column-1',
          name: 'To Do',
          order: 1,
          todos: [],
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#4ECDC4',
          createdAt: new Date(),
          id: 'column-2',
          name: 'In Progress',
          order: 2,
          todos: [],
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]

      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce(mockColumns)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject(
        mockColumns.map(
          ({ createdAt: _createdAt, updatedAt: _updatedAt, ...rest }) => rest
        )
      )
      expect(mockPrisma.kanbanColumn.findMany).toHaveBeenCalledWith({
        include: {
          todos: {
            include: {
              category: {
                select: {
                  color: true,
                  id: true,
                  name: true,
                },
              },
              subTasks: {
                orderBy: {
                  order: 'asc',
                },
                select: {
                  id: true,
                  isCompleted: true,
                  title: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
        where: {
          userId: 'user-1',
        },
      })
    })

    it('should return empty array when no columns exist', async () => {
      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce([])

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should handle database error', async () => {
      const mockError = new Error('Database connection failed')
      mockPrisma.kanbanColumn.findMany.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム取得エラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle authentication error', async () => {
      mockGetUserIdFromRequestWithApiKey.mockRejectedValueOnce(
        new Error('認証が必要です')
      )

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
    })
  })

  describe('POST', () => {
    const validRequestBody = {
      color: '#FF6B6B',
      name: 'New Column',
    }

    it('should create kanban column successfully without order', async () => {
      const mockLastColumn = { order: 5 }
      const mockCreatedColumn = {
        color: '#FF6B6B',
        createdAt: new Date(),
        id: 'new-column-id',
        name: 'New Column',
        order: 6,
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(mockLastColumn)
      mockPrisma.kanbanColumn.create.mockResolvedValueOnce(mockCreatedColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(validRequestBody),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        color: mockCreatedColumn.color,
        id: mockCreatedColumn.id,
        name: mockCreatedColumn.name,
        order: mockCreatedColumn.order,
        userId: mockCreatedColumn.userId,
      })
      expect(mockPrisma.kanbanColumn.findFirst).toHaveBeenCalledWith({
        orderBy: { order: 'desc' },
        select: { order: true },
        where: { userId: 'user-1' },
      })
      expect(mockPrisma.kanbanColumn.create).toHaveBeenCalledWith({
        data: {
          ...validRequestBody,
          order: 6,
          userId: 'user-1',
        },
      })
    })

    it('should create kanban column successfully with order specified', async () => {
      const requestBodyWithOrder = {
        ...validRequestBody,
        order: 3,
      }
      const mockCreatedColumn = {
        color: '#FF6B6B',
        createdAt: new Date(),
        id: 'new-column-id',
        name: 'New Column',
        order: 3,
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockPrisma.kanbanColumn.create.mockResolvedValueOnce(mockCreatedColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(requestBodyWithOrder),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        color: mockCreatedColumn.color,
        id: mockCreatedColumn.id,
        name: mockCreatedColumn.name,
        order: mockCreatedColumn.order,
        userId: mockCreatedColumn.userId,
      })
      expect(mockPrisma.kanbanColumn.findFirst).not.toHaveBeenCalled()
      expect(mockPrisma.kanbanColumn.create).toHaveBeenCalledWith({
        data: {
          ...requestBodyWithOrder,
          userId: 'user-1',
        },
      })
    })

    it('should handle case when no existing columns (order defaults to 1)', async () => {
      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(null)
      const mockCreatedColumn = {
        color: '#FF6B6B',
        createdAt: new Date(),
        id: 'new-column-id',
        name: 'New Column',
        order: 1,
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockPrisma.kanbanColumn.create.mockResolvedValueOnce(mockCreatedColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(validRequestBody),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        color: mockCreatedColumn.color,
        id: mockCreatedColumn.id,
        name: mockCreatedColumn.name,
        order: mockCreatedColumn.order,
        userId: mockCreatedColumn.userId,
      })
      expect(mockPrisma.kanbanColumn.create).toHaveBeenCalledWith({
        data: {
          ...validRequestBody,
          order: 1,
          userId: 'user-1',
        },
      })
    })

    it('should handle validation error - missing name', async () => {
      const invalidRequestBody = {
        color: '#FF6B6B',
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
      expect(data.error.details).toBeDefined()
    })

    it('should handle validation error - invalid color format', async () => {
      const invalidRequestBody = {
        color: 'invalid-color',
        name: 'Test Column',
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
      expect(data.error.details).toBeDefined()
      expect(
        data.error.details.some(
          (error: { message: string }) =>
            error.message === '色はHEX形式で入力してください'
        )
      ).toBe(true)
    })

    it('should handle validation error - name too long', async () => {
      const invalidRequestBody = {
        color: '#FF6B6B',
        name: 'a'.repeat(51), // 51文字
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
      expect(data.error.details).toBeDefined()
      expect(
        data.error.details.some(
          (error: { message: string }) =>
            error.message === 'カラム名は50文字以内で入力してください'
        )
      ).toBe(true)
    })

    it('should handle validation error - invalid order', async () => {
      const invalidRequestBody = {
        color: '#FF6B6B',
        name: 'Test Column',
        order: 0, // 0は無効（最小値は1）
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: 'invalid-json',
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
    })

    it('should handle database error during creation', async () => {
      const mockError = new Error('Database insert failed')
      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(null)
      mockPrisma.kanbanColumn.create.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(validRequestBody),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム作成エラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle database error during order calculation', async () => {
      const mockError = new Error('Database query failed')
      mockPrisma.kanbanColumn.findFirst.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(validRequestBody),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム作成エラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle authentication error', async () => {
      mockGetUserIdFromRequestWithApiKey.mockRejectedValueOnce(
        new Error('認証が必要です')
      )

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns',
        {
          body: JSON.stringify(validRequestBody),
          method: 'POST',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
    })
  })
})
