import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// 認証モック
vi.mock('@/lib/auth', () => ({
  getUserIdFromRequestWithApiKey: vi.fn(),
}))

// モックを最初にインポート
import { PATCH } from '@/app/api/kanban-columns/reorder/route'
import { getUserIdFromRequestWithApiKey } from '@/lib/auth'
import { mockPrisma } from '@/tests/__mocks__/prisma'

const mockGetUserIdFromRequestWithApiKeyWithApiKey =
  getUserIdFromRequestWithApiKey as ReturnType<typeof vi.fn>

describe('/api/kanban-columns/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトで認証済みユーザーとしてモック
    mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user-1')
  })

  describe('PATCH', () => {
    const validRequestBody = {
      columnIds: ['column-2', 'column-1', 'column-3'],
    }

    it('should reorder kanban columns successfully', async () => {
      const mockExistingColumns = [
        { id: 'column-1', name: 'To Do', userId: 'user-1' },
        { id: 'column-2', name: 'In Progress', userId: 'user-1' },
        { id: 'column-3', name: 'Done', userId: 'user-1' },
      ]

      const mockUpdatedColumns = [
        { id: 'column-2', order: 1 },
        { id: 'column-1', order: 2 },
        { id: 'column-3', order: 3 },
      ]

      const mockReorderedColumns = [
        {
          color: '#4ECDC4',
          createdAt: new Date(),
          id: 'column-2',
          name: 'In Progress',
          order: 1,
          todos: [],
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#FF6B6B',
          createdAt: new Date(),
          id: 'column-1',
          name: 'To Do',
          order: 2,
          todos: [],
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#45B7D1',
          createdAt: new Date(),
          id: 'column-3',
          name: 'Done',
          order: 3,
          todos: [],
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]

      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce(
        mockExistingColumns
      )
      mockPrisma.$transaction.mockResolvedValueOnce(mockUpdatedColumns)
      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce(
        mockReorderedColumns
      )

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.kanbanColumns).toMatchObject(
        mockReorderedColumns.map(
          ({ createdAt: _createdAt, updatedAt: _updatedAt, ...rest }) => rest
        )
      )
      expect(data.data.updated).toBe(3)

      expect(mockPrisma.kanbanColumn.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: validRequestBody.columnIds,
          },
          userId: 'user-1',
        },
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockPrisma.$transaction.mock.calls[0][0]).toHaveLength(3)

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

    it('should reorder single column successfully', async () => {
      const singleColumnRequest = {
        columnIds: ['column-1'],
      }

      const mockExistingColumns = [
        { id: 'column-1', name: 'To Do', userId: 'user-1' },
      ]

      const mockUpdatedColumns = [{ id: 'column-1', order: 1 }]

      const mockReorderedColumns = [
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
      ]

      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce(
        mockExistingColumns
      )
      mockPrisma.$transaction.mockResolvedValueOnce(mockUpdatedColumns)
      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce(
        mockReorderedColumns
      )

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(singleColumnRequest),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.kanbanColumns).toMatchObject(
        mockReorderedColumns.map(
          ({ createdAt: _createdAt, updatedAt: _updatedAt, ...rest }) => rest
        )
      )
      expect(data.data.updated).toBe(1)
    })

    it('should return 404 when some columns not found', async () => {
      const invalidRequestBody = {
        columnIds: ['column-1', 'nonexistent-column', 'column-3'],
      }

      // 2つのカラムしか見つからない（3つ要求されているが）
      const mockExistingColumns = [
        { id: 'column-1', name: 'To Do', userId: 'user-1' },
        { id: 'column-3', name: 'Done', userId: 'user-1' },
      ]

      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce(
        mockExistingColumns
      )

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe(
        '指定されたKanbanカラムの一部が見つかりません'
      )
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('should return 404 when no columns found', async () => {
      const invalidRequestBody = {
        columnIds: ['nonexistent-1', 'nonexistent-2'],
      }

      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce([])

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe(
        '指定されたKanbanカラムの一部が見つかりません'
      )
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('should handle validation error - empty columnIds array', async () => {
      const invalidRequestBody = {
        columnIds: [],
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
      expect(data.error.details).toBeDefined()
    })

    it('should handle validation error - missing columnIds', async () => {
      const invalidRequestBody = {}

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
      expect(data.error.details).toBeDefined()
    })

    it('should handle validation error - invalid columnId format', async () => {
      const invalidRequestBody = {
        columnIds: ['valid-id', '', 'another-valid-id'],
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
      expect(data.error.details).toBeDefined()
      expect(
        data.error.details.some(
          (error: { message: string }) => error.message === 'カラムIDは必須です'
        )
      ).toBe(true)
    })

    it('should handle validation error - non-array columnIds', async () => {
      const invalidRequestBody = {
        columnIds: 'not-an-array',
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: 'invalid-json',
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
    })

    it('should handle database error during column existence check', async () => {
      const mockError = new Error('Database query failed')
      mockPrisma.kanbanColumn.findMany.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム並び替えエラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle database error during transaction', async () => {
      const mockExistingColumns = [
        { id: 'column-1', name: 'To Do', userId: 'user-1' },
        { id: 'column-2', name: 'In Progress', userId: 'user-1' },
        { id: 'column-3', name: 'Done', userId: 'user-1' },
      ]
      const mockError = new Error('Transaction failed')

      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce(
        mockExistingColumns
      )
      mockPrisma.$transaction.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム並び替えエラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle database error during final fetch', async () => {
      const mockExistingColumns = [
        { id: 'column-1', name: 'To Do', userId: 'user-1' },
        { id: 'column-2', name: 'In Progress', userId: 'user-1' },
        { id: 'column-3', name: 'Done', userId: 'user-1' },
      ]

      const mockUpdatedColumns = [
        { id: 'column-2', order: 1 },
        { id: 'column-1', order: 2 },
        { id: 'column-3', order: 3 },
      ]

      const mockError = new Error('Final fetch failed')

      mockPrisma.kanbanColumn.findMany
        .mockResolvedValueOnce(mockExistingColumns) // 最初の存在確認
        .mockRejectedValueOnce(mockError) // 最終的な取得

      mockPrisma.$transaction.mockResolvedValueOnce(mockUpdatedColumns)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム並び替えエラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle duplicate column IDs in request', async () => {
      const duplicateIdsRequestBody = {
        columnIds: ['column-1', 'column-2', 'column-1'], // 重複したID
      }

      // 重複があっても実際には2つのカラムしか見つからない
      const mockExistingColumns = [
        { id: 'column-1', name: 'To Do', userId: 'user-1' },
        { id: 'column-2', name: 'In Progress', userId: 'user-1' },
      ]

      mockPrisma.kanbanColumn.findMany.mockResolvedValueOnce(
        mockExistingColumns
      )

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(duplicateIdsRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe(
        '指定されたKanbanカラムの一部が見つかりません'
      )
    })

    it('should handle completely malformed JSON in request body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: '{columnIds: [column-1, column-2]}', // 不正なJSON（クォートなし）
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
    })

    it('PATCH: should return 401 when user authentication fails', async () => {
      const validRequestBody = {
        columnIds: ['column-2', 'column-1', 'column-3'],
      }
      const authError = new Error('認証が必要です')
      mockGetUserIdFromRequestWithApiKey.mockRejectedValueOnce(authError)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/reorder',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PATCH',
        }
      )

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
      expect(mockPrisma.kanbanColumn.findMany).not.toHaveBeenCalled()
    })
  })
})
