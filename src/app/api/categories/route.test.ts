import { NextRequest } from 'next/server'

import { GET, POST } from './route'

// Prismaクライアントのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    category: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// Auth utilsのモック
vi.mock('@/lib/auth', () => ({
  getCurrentUserFromRequest: vi.fn(),
  getUserIdFromRequest: vi.fn(),
  getUserIdFromRequestWithApiKey: vi.fn(),
}))

// モックされたモジュールのインポート
const { prisma } = await import('@/lib/db')
const {
  getCurrentUserFromRequest,
  getUserIdFromRequest,
  getUserIdFromRequestWithApiKey,
} = await import('@/lib/auth')

// モック関数の型付け
const mockFindMany = vi.mocked(prisma.category.findMany)
const mockCreate = vi.mocked(prisma.category.create)
const mockGetCurrentUserFromRequest = vi.mocked(getCurrentUserFromRequest)
const mockGetUserIdFromRequest = vi.mocked(getUserIdFromRequest)
const mockGetUserIdFromRequestWithApiKey = vi.mocked(
  getUserIdFromRequestWithApiKey
)

describe('/api/categories', () => {
  const fixedDate = new Date('2024-01-01T00:00:00.000Z')
  const mockCategories = [
    {
      color: '#FF6B6B',
      createdAt: fixedDate,
      id: 'category-1',
      name: '仕事',
      updatedAt: fixedDate,
      userId: 'user-1',
    },
    {
      color: '#4ECDC4',
      createdAt: fixedDate,
      id: 'category-2',
      name: '個人',
      updatedAt: fixedDate,
      userId: 'user-1',
    },
  ]

  // APIレスポンス用のモックデータ（文字列化されたDate）
  const mockCategoriesResponse = mockCategories.map((cat) => ({
    ...cat,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }))

  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトのモック設定
    mockGetCurrentUserFromRequest.mockResolvedValue({
      createdAt: fixedDate,
      email: 'test@example.com',
      id: 'user-1',
      name: 'Test User',
      updatedAt: fixedDate,
    })
    mockGetUserIdFromRequest.mockResolvedValue('user-1')
    mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user-1')
  })

  describe('GET /api/categories', () => {
    it('カテゴリ一覧を正常に取得できる', async () => {
      // Arrange
      mockFindMany.mockResolvedValue(mockCategories)

      const request = new NextRequest('http://localhost:3000/api/categories')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCategoriesResponse)
      const findManySpy = mockFindMany
      expect(findManySpy).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'asc',
        },
        where: {
          userId: 'user-1',
        },
      })
    })

    it('認証エラーの場合401を返す', async () => {
      // Arrange
      mockGetCurrentUserFromRequest.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/categories')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('データベースエラーの場合500を返す', async () => {
      // Arrange
      mockFindMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
    })
  })

  describe('POST /api/categories', () => {
    it('新しいカテゴリを正常に作成できる', async () => {
      // Arrange
      const newCategoryData = {
        color: '#45B7D1',
        name: '学習',
      }

      const createdCategory = {
        ...newCategoryData,
        createdAt: fixedDate,
        id: 'category-3',
        updatedAt: fixedDate,
        userId: 'user-1',
      }

      const createdCategoryResponse = {
        ...createdCategory,
        createdAt: createdCategory.createdAt.toISOString(),
        updatedAt: createdCategory.updatedAt.toISOString(),
      }

      mockCreate.mockResolvedValue(createdCategory)

      const request = new NextRequest('http://localhost:3000/api/categories', {
        body: JSON.stringify(newCategoryData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdCategoryResponse)
      const createSpy = mockCreate
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          ...newCategoryData,
          userId: 'user-1',
        },
      })
    })

    it('バリデーションエラーの場合400を返す', async () => {
      // Arrange
      const invalidData = {
        color: 'invalid-color', // 無効なカラー形式
        name: '',
      }

      const request = new NextRequest('http://localhost:3000/api/categories', {
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('認証エラーの場合401を返す', async () => {
      // Arrange
      const newCategoryData = {
        color: '#45B7D1',
        name: '学習',
      }
      mockGetCurrentUserFromRequest.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/categories', {
        body: JSON.stringify(newCategoryData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('データベースエラーの場合500を返す', async () => {
      // Arrange
      const newCategoryData = {
        color: '#45B7D1',
        name: '学習',
      }
      mockCreate.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories', {
        body: JSON.stringify(newCategoryData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
    })
  })
})
