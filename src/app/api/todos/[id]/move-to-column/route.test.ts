import { NextRequest } from 'next/server'

import { PATCH } from './route'

import type { KanbanColumn, Todo } from '@prisma/client'

// テスト用の拡張型定義
interface TodoWithRelations extends Todo {
  category?: null | {
    color: string
    id: string
    name: string
  }
  kanbanColumn?: null | {
    color: string
    id: string
    name: string
    order: number
  }
  subTasks?: Array<{
    id: string
    isCompleted: boolean
    title: string
  }>
}

// Prismaクライアントのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    kanbanColumn: {
      findFirst: vi.fn(),
    },
    todo: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// モックされたモジュールのインポート
const { prisma } = await import('@/lib/db')

// モック関数の型付け
const mockTodoFindFirst = vi.mocked(prisma.todo.findFirst)
const mockTodoUpdate = vi.mocked(prisma.todo.update)
const mockKanbanColumnFindFirst = vi.mocked(prisma.kanbanColumn.findFirst)

/**
 * /api/todos/[id]/move-to-column APIのテスト
 *
 * TODOをKanbanカラムに移動するAPIのテストケース
 * 正常系、エラー系、エッジケースを網羅し100%カバレッジを目指す
 */
describe('/api/todos/[id]/move-to-column', () => {
  const mockTodo: Todo = {
    categoryId: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    description: 'テスト説明',
    dueDate: null,
    id: 'todo-1',
    isCompleted: false,
    isImportant: false,
    kanbanColumnId: null,
    order: 0,
    title: 'テストタスク',
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    userId: 'user-1',
  }

  const mockKanbanColumn: KanbanColumn = {
    color: '#FF6B6B',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    id: 'column-1',
    name: 'テストカラム',
    order: 0,
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    userId: 'user-1',
  }

  const mockUpdatedTodo: TodoWithRelations = {
    ...mockTodo,
    category: null,
    kanbanColumn: {
      color: '#FF6B6B',
      id: 'column-1',
      name: 'テストカラム',
      order: 0,
    },
    kanbanColumnId: 'column-1',
    order: 1,
    subTasks: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PATCH /api/todos/[id]/move-to-column', () => {
    describe('正常系', () => {
      it('TODOをKanbanカラムに移動成功（orderなし）', async () => {
        // Arrange
        mockTodoFindFirst.mockResolvedValueOnce(mockTodo)
        mockKanbanColumnFindFirst.mockResolvedValue(mockKanbanColumn)
        mockTodoFindFirst.mockResolvedValueOnce({ order: 2 } as Todo)
        mockTodoUpdate.mockResolvedValue(mockUpdatedTodo as Todo)

        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'column-1',
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toMatchObject({
          id: mockUpdatedTodo.id,
          kanbanColumnId: mockUpdatedTodo.kanbanColumnId,
          order: mockUpdatedTodo.order,
        })
        expect(mockTodoUpdate).toHaveBeenCalledWith({
          data: {
            kanbanColumnId: 'column-1',
            order: 3,
          },
          include: {
            category: {
              select: {
                color: true,
                id: true,
                name: true,
              },
            },
            kanbanColumn: {
              select: {
                color: true,
                id: true,
                name: true,
                order: true,
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
          where: { id: 'todo-1' },
        })
      })

      it('TODOをKanbanカラムに移動成功（order指定）', async () => {
        // Arrange
        mockTodoFindFirst.mockResolvedValueOnce(mockTodo)
        mockKanbanColumnFindFirst.mockResolvedValue(mockKanbanColumn)
        const updatedTodoWithOrder5: TodoWithRelations = {
          ...mockUpdatedTodo,
          order: 5,
        }
        mockTodoUpdate.mockResolvedValue(updatedTodoWithOrder5 as Todo)

        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'column-1',
              order: 5,
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.order).toBe(5)
        expect(mockTodoUpdate).toHaveBeenCalledWith({
          data: {
            kanbanColumnId: 'column-1',
            order: 5,
          },
          include: {
            category: {
              select: {
                color: true,
                id: true,
                name: true,
              },
            },
            kanbanColumn: {
              select: {
                color: true,
                id: true,
                name: true,
                order: true,
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
          where: { id: 'todo-1' },
        })
      })

      it('TODOをnullカラムに移動（カラムから削除）', async () => {
        // Arrange
        mockTodoFindFirst.mockResolvedValue(mockTodo)
        const todoWithNullColumn: TodoWithRelations = {
          ...mockTodo,
          category: null,
          kanbanColumn: null,
          kanbanColumnId: null,
          subTasks: [],
        }
        mockTodoUpdate.mockResolvedValue(todoWithNullColumn as Todo)

        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: null,
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.kanbanColumnId).toBeNull()
        expect(mockKanbanColumnFindFirst).not.toHaveBeenCalled()
        expect(mockTodoUpdate).toHaveBeenCalledWith({
          data: {
            kanbanColumnId: null,
          },
          include: {
            category: {
              select: {
                color: true,
                id: true,
                name: true,
              },
            },
            kanbanColumn: {
              select: {
                color: true,
                id: true,
                name: true,
                order: true,
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
          where: { id: 'todo-1' },
        })
      })

      it('カラム内にTODOがない場合、order=1が設定される', async () => {
        // Arrange
        mockTodoFindFirst.mockResolvedValueOnce(mockTodo)
        mockKanbanColumnFindFirst.mockResolvedValue(mockKanbanColumn)
        mockTodoFindFirst.mockResolvedValueOnce(null) // カラム内にTODOがない
        const todoWithOrder1: TodoWithRelations = {
          ...mockUpdatedTodo,
          order: 1,
        }
        mockTodoUpdate.mockResolvedValue(todoWithOrder1 as Todo)

        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'column-1',
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.order).toBe(1)
        expect(mockTodoUpdate).toHaveBeenCalledWith({
          data: {
            kanbanColumnId: 'column-1',
            order: 1,
          },
          include: {
            category: {
              select: {
                color: true,
                id: true,
                name: true,
              },
            },
            kanbanColumn: {
              select: {
                color: true,
                id: true,
                name: true,
                order: true,
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
          where: { id: 'todo-1' },
        })
      })
    })

    describe('エラー系', () => {
      it('存在しないTODOの場合404を返す', async () => {
        // Arrange
        mockTodoFindFirst.mockResolvedValue(null)

        const request = new NextRequest(
          'http://localhost:3000/api/todos/nonexistent/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'column-1',
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'nonexistent' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('NOT_FOUND')
        expect(data.error.message).toBe('タスクが見つかりません')
      })

      it('存在しないKanbanカラムの場合404を返す', async () => {
        // Arrange
        mockTodoFindFirst.mockResolvedValue(mockTodo)
        mockKanbanColumnFindFirst.mockResolvedValue(null)

        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'nonexistent-column',
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('NOT_FOUND')
        expect(data.error.message).toBe('Kanbanカラムが見つかりません')
      })

      it('バリデーションエラー（不正なkanbanColumnId）', async () => {
        // Arrange
        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 123, // 数値は不正
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('VALIDATION_ERROR')
        expect(data.error.message).toBe('バリデーションエラー')
        expect(data.error.details).toBeDefined()
      })

      it('バリデーションエラー（負のorder）', async () => {
        // Arrange
        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'column-1',
              order: -1, // 負の数は不正
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('VALIDATION_ERROR')
        expect(data.error.message).toBe('バリデーションエラー')
        expect(data.error.details).toBeDefined()
      })

      it('バリデーションエラー（整数以外のorder）', async () => {
        // Arrange
        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'column-1',
              order: 1.5, // 整数以外は不正
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('VALIDATION_ERROR')
        expect(data.error.message).toBe('バリデーションエラー')
        expect(data.error.details).toBeDefined()
      })

      it('JSONパースエラーの場合500を返す', async () => {
        // Arrange - エラーログを抑制
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // テスト中のエラーログを抑制
        })

        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: 'invalid json', // 不正なJSON
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
        expect(data.error.message).toBe('サーバーエラーが発生しました')

        // Cleanup
        consoleSpy.mockRestore()
      })

      it('データベースエラーの場合500を返す', async () => {
        // Arrange - エラーログを抑制
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // テスト中のエラーログを抑制
        })
        mockTodoFindFirst.mockRejectedValue(new Error('Database error'))

        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'column-1',
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
        expect(data.error.message).toBe('サーバーエラーが発生しました')

        // Cleanup
        consoleSpy.mockRestore()
      })

      it('Prisma updateエラーの場合500を返す', async () => {
        // Arrange - エラーログを抑制
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // テスト中のエラーログを抑制
        })
        mockTodoFindFirst.mockResolvedValueOnce(mockTodo)
        mockKanbanColumnFindFirst.mockResolvedValue(mockKanbanColumn)
        mockTodoFindFirst.mockResolvedValueOnce(null)
        mockTodoUpdate.mockRejectedValue(new Error('Update failed'))

        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'column-1',
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
        expect(data.error.message).toBe('サーバーエラーが発生しました')

        // Cleanup
        consoleSpy.mockRestore()
      })
    })

    describe('エッジケース', () => {
      it('空のリクエストボディでバリデーションエラー', async () => {
        // Arrange
        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({}), // 空のオブジェクト
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('VALIDATION_ERROR')
        expect(data.error.message).toBe('バリデーションエラー')
      })

      it('orderが0の場合は有効', async () => {
        // Arrange
        mockTodoFindFirst.mockResolvedValue(mockTodo)
        mockKanbanColumnFindFirst.mockResolvedValue(mockKanbanColumn)
        const todoWithOrder0: TodoWithRelations = {
          ...mockUpdatedTodo,
          order: 0,
        }
        mockTodoUpdate.mockResolvedValue(todoWithOrder0 as Todo)

        const request = new NextRequest(
          'http://localhost:3000/api/todos/todo-1/move-to-column',
          {
            body: JSON.stringify({
              kanbanColumnId: 'column-1',
              order: 0, // 0は有効
            }),
            method: 'PATCH',
          }
        )

        // Act
        const response = await PATCH(request, {
          params: { id: 'todo-1' },
        })
        const data = await response.json()

        // Assert
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.order).toBe(0)
      })
    })
  })
})
