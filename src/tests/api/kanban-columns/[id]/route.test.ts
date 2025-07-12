import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// 認証モック
vi.mock('@/lib/auth', () => ({
  getUserIdFromRequest: vi.fn(),
}))

// モックを最初にインポート
import { DELETE, GET, PUT } from '@/app/api/kanban-columns/[id]/route'
import { getUserIdFromRequest } from '@/lib/auth'
import { mockPrisma } from '@/tests/__mocks__/prisma'

const mockGetUserIdFromRequest = getUserIdFromRequest as ReturnType<
  typeof vi.fn
>

describe('/api/kanban-columns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトで認証済みユーザーとしてモック
    mockGetUserIdFromRequest.mockResolvedValue('user-1')
  })

  describe('GET', () => {
    const mockParams = { id: 'column-1' }

    it('should return kanban column successfully', async () => {
      const mockColumn = {
        color: '#FF6B6B',
        createdAt: new Date(),
        id: 'column-1',
        name: 'To Do',
        order: 1,
        todos: [
          {
            category: null,
            id: 'todo-1',
            subTasks: [],
            title: 'Test Task',
          },
        ],
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(mockColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1'
      )
      const response = await GET(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        color: mockColumn.color,
        id: mockColumn.id,
        name: mockColumn.name,
        order: mockColumn.order,
        todos: mockColumn.todos,
        userId: mockColumn.userId,
      })
      expect(mockPrisma.kanbanColumn.findFirst).toHaveBeenCalledWith({
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
        where: {
          id: 'column-1',
          userId: 'user-1',
        },
      })
    })

    it('should return 404 when column not found', async () => {
      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(null)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/nonexistent'
      )
      const response = await GET(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Kanbanカラムが見つかりません')
    })

    it('should handle database error', async () => {
      const mockError = new Error('Database connection failed')
      mockPrisma.kanbanColumn.findFirst.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1'
      )
      const response = await GET(request, { params: mockParams })
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
  })

  describe('PUT', () => {
    const mockParams = { id: 'column-1' }
    const validRequestBody = {
      color: '#4ECDC4',
      name: 'Updated Column',
    }

    it('should update kanban column successfully', async () => {
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }
      const mockUpdatedColumn = {
        color: '#4ECDC4',
        createdAt: new Date(),
        id: 'column-1',
        name: 'Updated Column',
        order: 1,
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.kanbanColumn.update.mockResolvedValueOnce(mockUpdatedColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        color: mockUpdatedColumn.color,
        id: mockUpdatedColumn.id,
        name: mockUpdatedColumn.name,
        order: mockUpdatedColumn.order,
        userId: mockUpdatedColumn.userId,
      })
      expect(mockPrisma.kanbanColumn.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'column-1',
          userId: 'user-1',
        },
      })
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledWith({
        data: validRequestBody,
        where: {
          id: 'column-1',
        },
      })
    })

    it('should update kanban column with partial data', async () => {
      const partialRequestBody = {
        name: 'Partially Updated Column',
      }
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }
      const mockUpdatedColumn = {
        color: '#FF6B6B',
        createdAt: new Date(),
        id: 'column-1',
        name: 'Partially Updated Column',
        order: 1,
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.kanbanColumn.update.mockResolvedValueOnce(mockUpdatedColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(partialRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        color: mockUpdatedColumn.color,
        id: mockUpdatedColumn.id,
        name: mockUpdatedColumn.name,
        order: mockUpdatedColumn.order,
        userId: mockUpdatedColumn.userId,
      })
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledWith({
        data: partialRequestBody,
        where: {
          id: 'column-1',
        },
      })
    })

    it('should return 404 when column not found', async () => {
      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(null)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/nonexistent',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Kanbanカラムが見つかりません')
      expect(mockPrisma.kanbanColumn.update).not.toHaveBeenCalled()
    })

    it('should handle validation error - invalid color format', async () => {
      const invalidRequestBody = {
        color: 'invalid-color',
        name: 'Updated Column',
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
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
        name: 'a'.repeat(51), // 51文字
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
      expect(
        data.error.details.some(
          (error: { message: string }) =>
            error.message === 'カラム名は50文字以内で入力してください'
        )
      ).toBe(true)
    })

    it('should handle validation error - empty name', async () => {
      const invalidRequestBody = {
        name: '',
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
      expect(
        data.error.details.some(
          (error: { message: string }) => error.message === 'カラム名は必須です'
        )
      ).toBe(true)
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: 'invalid-json',
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
    })

    it('should handle database error during existence check', async () => {
      const mockError = new Error('Database query failed')
      mockPrisma.kanbanColumn.findFirst.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム更新エラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle database error during update', async () => {
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }
      const mockError = new Error('Database update failed')

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.kanbanColumn.update.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム更新エラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle validation error - invalid order (negative value)', async () => {
      const invalidRequestBody = {
        order: -1,
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
    })

    it('should handle validation error - invalid order (zero value)', async () => {
      const invalidRequestBody = {
        order: 0,
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(invalidRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
    })

    it('should update only color field', async () => {
      const colorOnlyRequestBody = {
        color: '#45B7D1',
      }
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }
      const mockUpdatedColumn = {
        ...mockExistingColumn,
        color: '#45B7D1',
        updatedAt: new Date(),
      }

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.kanbanColumn.update.mockResolvedValueOnce(mockUpdatedColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(colorOnlyRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.color).toBe('#45B7D1')
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledWith({
        data: colorOnlyRequestBody,
        where: {
          id: 'column-1',
        },
      })
    })

    it('should update only name field', async () => {
      const nameOnlyRequestBody = {
        name: 'In Progress',
      }
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }
      const mockUpdatedColumn = {
        ...mockExistingColumn,
        name: 'In Progress',
        updatedAt: new Date(),
      }

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.kanbanColumn.update.mockResolvedValueOnce(mockUpdatedColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(nameOnlyRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('In Progress')
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledWith({
        data: nameOnlyRequestBody,
        where: {
          id: 'column-1',
        },
      })
    })

    it('should update only order field', async () => {
      const orderOnlyRequestBody = {
        order: 2,
      }
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }
      const mockUpdatedColumn = {
        ...mockExistingColumn,
        order: 2,
        updatedAt: new Date(),
      }

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.kanbanColumn.update.mockResolvedValueOnce(mockUpdatedColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(orderOnlyRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.order).toBe(2)
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledWith({
        data: orderOnlyRequestBody,
        where: {
          id: 'column-1',
        },
      })
    })

    it('should handle 50-character name (boundary test)', async () => {
      const fiftyCharName = 'a'.repeat(50)
      const boundaryRequestBody = {
        name: fiftyCharName,
      }
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }
      const mockUpdatedColumn = {
        ...mockExistingColumn,
        name: fiftyCharName,
        updatedAt: new Date(),
      }

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.kanbanColumn.update.mockResolvedValueOnce(mockUpdatedColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(boundaryRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(fiftyCharName)
      expect(data.data.name).toHaveLength(50)
    })
  })

  describe('DELETE', () => {
    const mockParams = { id: 'column-1' }

    it('should delete kanban column successfully', async () => {
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.todo.updateMany.mockResolvedValueOnce({ count: 2 })
      mockPrisma.kanbanColumn.delete.mockResolvedValueOnce(mockExistingColumn)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          method: 'DELETE',
        }
      )

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.deleted).toBe(true)
      expect(data.data.id).toBe('column-1')

      expect(mockPrisma.kanbanColumn.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'column-1',
          userId: 'user-1',
        },
      })
      expect(mockPrisma.todo.updateMany).toHaveBeenCalledWith({
        data: {
          kanbanColumnId: undefined,
        },
        where: {
          kanbanColumnId: 'column-1',
        },
      })
      expect(mockPrisma.kanbanColumn.delete).toHaveBeenCalledWith({
        where: {
          id: 'column-1',
        },
      })
    })

    it('should return 404 when column not found', async () => {
      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(null)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/nonexistent',
        {
          method: 'DELETE',
        }
      )

      const response = await DELETE(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Kanbanカラムが見つかりません')
      expect(mockPrisma.todo.updateMany).not.toHaveBeenCalled()
      expect(mockPrisma.kanbanColumn.delete).not.toHaveBeenCalled()
    })

    it('should handle database error during existence check', async () => {
      const mockError = new Error('Database query failed')
      mockPrisma.kanbanColumn.findFirst.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          method: 'DELETE',
        }
      )

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム削除エラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle database error during todo update', async () => {
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }
      const mockError = new Error('Todo update failed')

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.todo.updateMany.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          method: 'DELETE',
        }
      )

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム削除エラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle database error during column deletion', async () => {
      const mockExistingColumn = {
        color: '#FF6B6B',
        id: 'column-1',
        name: 'To Do',
        order: 1,
        userId: 'user-1',
      }
      const mockError = new Error('Column deletion failed')

      mockPrisma.kanbanColumn.findFirst.mockResolvedValueOnce(
        mockExistingColumn
      )
      mockPrisma.todo.updateMany.mockResolvedValueOnce({ count: 0 })
      mockPrisma.kanbanColumn.delete.mockRejectedValueOnce(mockError)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Intentionally empty for testing
        })

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          method: 'DELETE',
        }
      )

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム削除エラー:',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Authentication Errors', () => {
    it('GET: should return 401 when user authentication fails', async () => {
      const mockParams = { id: 'column-1' }
      const authError = new Error('認証が必要です')
      mockGetUserIdFromRequest.mockRejectedValueOnce(authError)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1'
      )
      const response = await GET(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
      expect(mockPrisma.kanbanColumn.findFirst).not.toHaveBeenCalled()
    })

    it('PUT: should return 401 when user authentication fails', async () => {
      const mockParams = { id: 'column-1' }
      const authError = new Error('認証が必要です')
      mockGetUserIdFromRequest.mockRejectedValueOnce(authError)

      const validRequestBody = {
        color: '#4ECDC4',
        name: 'Updated Column',
      }

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          body: JSON.stringify(validRequestBody),
          method: 'PUT',
        }
      )

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
      expect(mockPrisma.kanbanColumn.findFirst).not.toHaveBeenCalled()
    })

    it('DELETE: should return 401 when user authentication fails', async () => {
      const mockParams = { id: 'column-1' }
      const authError = new Error('認証が必要です')
      mockGetUserIdFromRequest.mockRejectedValueOnce(authError)

      const request = new NextRequest(
        'http://localhost:3000/api/kanban-columns/column-1',
        {
          method: 'DELETE',
        }
      )

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
      expect(mockPrisma.kanbanColumn.findFirst).not.toHaveBeenCalled()
    })
  })
})
