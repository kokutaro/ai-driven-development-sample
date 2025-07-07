import { NextRequest } from 'next/server'

import { DELETE, PUT } from './route'

// Prismaクライアントのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    category: {
      delete: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Auth utilsのモック
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

// モックされたモジュールのインポート
const { prisma } = await import('@/lib/db')
const { getCurrentUser } = await import('@/lib/auth')

// モック関数の型付け
const mockFindUnique = vi.mocked(prisma.category.findUnique)
const mockUpdate = vi.mocked(prisma.category.update)
const mockDelete = vi.mocked(prisma.category.delete)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

describe('/api/categories/[id]', () => {
  const fixedDate = new Date('2024-01-01T00:00:00.000Z')
  const mockCategory = {
    color: '#FF6B6B',
    createdAt: fixedDate,
    id: 'category-1',
    name: '仕事',
    updatedAt: fixedDate,
    userId: 'user-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトのモック設定
    mockGetCurrentUser.mockResolvedValue({
      createdAt: fixedDate,
      email: 'test@example.com',
      id: 'user-1',
      name: 'Test User',
      updatedAt: fixedDate,
    })
  })

  describe('PUT /api/categories/[id]', () => {
    it('カテゴリを正常に更新できる', async () => {
      // Arrange
      const updateData = {
        color: '#4ECDC4',
        name: '更新された仕事',
      }

      const updatedCategory = {
        ...mockCategory,
        color: '#4ECDC4',
        name: '更新された仕事',
        updatedAt: fixedDate,
      }

      const updatedCategoryResponse = {
        ...updatedCategory,
        createdAt: updatedCategory.createdAt.toISOString(),
        updatedAt: updatedCategory.updatedAt.toISOString(),
      }

      mockFindUnique.mockResolvedValue(mockCategory)
      mockUpdate.mockResolvedValue(updatedCategory)

      const request = new NextRequest(
        'http://localhost:3000/api/categories/category-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'category-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedCategoryResponse)
      const updateSpy = mockUpdate
      expect(updateSpy).toHaveBeenCalledWith({
        data: updateData,
        where: { id: 'category-1' },
      })
    })

    it('バリデーションエラーの場合400を返す', async () => {
      // Arrange
      const invalidData = {
        color: 'invalid-color',
        name: '',
      }

      mockFindUnique.mockResolvedValue(mockCategory)

      const request = new NextRequest(
        'http://localhost:3000/api/categories/category-1',
        {
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'category-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('存在しないカテゴリの場合404を返す', async () => {
      // Arrange
      const updateData = {
        color: '#4ECDC4',
        name: '更新された仕事',
      }
      mockFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/categories/nonexistent',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('他のユーザーのカテゴリの場合403を返す', async () => {
      // Arrange
      const updateData = {
        color: '#4ECDC4',
        name: '更新された仕事',
      }
      const otherUserCategory = { ...mockCategory, userId: 'other-user' }
      mockFindUnique.mockResolvedValue(otherUserCategory)

      const request = new NextRequest(
        'http://localhost:3000/api/categories/category-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'category-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('認証エラーの場合401を返す', async () => {
      // Arrange
      const updateData = {
        color: '#4ECDC4',
        name: '更新された仕事',
      }
      mockGetCurrentUser.mockResolvedValue(undefined)

      const request = new NextRequest(
        'http://localhost:3000/api/categories/category-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'category-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('DELETE /api/categories/[id]', () => {
    it('カテゴリを正常に削除できる', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(mockCategory)
      mockDelete.mockResolvedValue(mockCategory)

      const request = new NextRequest(
        'http://localhost:3000/api/categories/category-1',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'category-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('category-1')
      expect(data.data.deleted).toBe(true)
      const deleteSpy = mockDelete
      expect(deleteSpy).toHaveBeenCalledWith({
        where: { id: 'category-1' },
      })
    })

    it('存在しないカテゴリの場合404を返す', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/categories/nonexistent',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('他のユーザーのカテゴリの場合403を返す', async () => {
      // Arrange
      const otherUserCategory = { ...mockCategory, userId: 'other-user' }
      mockFindUnique.mockResolvedValue(otherUserCategory)

      const request = new NextRequest(
        'http://localhost:3000/api/categories/category-1',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'category-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('認証エラーの場合401を返す', async () => {
      // Arrange
      mockGetCurrentUser.mockResolvedValue(undefined)

      const request = new NextRequest(
        'http://localhost:3000/api/categories/category-1',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'category-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })
})
