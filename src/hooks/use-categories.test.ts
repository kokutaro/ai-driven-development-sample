import { act, renderHook, waitFor } from '@testing-library/react'

import { useCategories } from './use-categories'

import type { Category } from '@/types/todo'

// カテゴリAPIクライアントのモック
vi.mock('@/lib/api/category-client', () => ({
  categoryClient: {
    createCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getCategories: vi.fn(),
    updateCategory: vi.fn(),
  },
}))

const { categoryClient } = await import('@/lib/api/category-client')
const getCategoriesSpy = vi.mocked(categoryClient.getCategories)
const createCategorySpy = vi.mocked(categoryClient.createCategory)
const updateCategorySpy = vi.mocked(categoryClient.updateCategory)
const deleteCategorySpy = vi.mocked(categoryClient.deleteCategory)

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
  {
    color: '#45B7D1',
    createdAt: fixedDate,
    id: 'category-3',
    name: '学習',
    updatedAt: fixedDate,
    userId: 'user-1',
  },
]

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('カテゴリを正常に取得できる', async () => {
    // Arrange
    getCategoriesSpy.mockResolvedValue({
      data: mockCategories,
      success: true,
      timestamp: new Date().toISOString(),
    })

    // Act
    const { result } = renderHook(() => useCategories())

    // Assert - 初期状態
    expect(result.current.isLoading).toBe(true)
    expect(result.current.categories).toEqual([])
    expect(result.current.error).toBe(undefined)

    // Assert - データ取得後
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.error).toBe(undefined)
    expect(getCategoriesSpy).toHaveBeenCalledTimes(1)
  })

  it('カテゴリ取得エラー時に適切にエラー状態を設定する', async () => {
    // Arrange
    getCategoriesSpy.mockRejectedValue(new Error('API Error'))

    // Act
    const { result } = renderHook(() => useCategories())

    // Assert - 初期状態
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(undefined)

    // Assert - エラー後
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual([])
    expect(result.current.error).toBe('カテゴリの取得に失敗しました')
    expect(getCategoriesSpy).toHaveBeenCalledTimes(1)
  })

  it('空のカテゴリリストを正常に処理する', async () => {
    // Arrange
    getCategoriesSpy.mockResolvedValue({
      data: [],
      success: true,
      timestamp: new Date().toISOString(),
    })

    // Act
    const { result } = renderHook(() => useCategories())

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual([])
    expect(result.current.error).toBe(undefined)
  })

  it('初回マウント時にのみAPIを呼び出す', async () => {
    // Act
    const { rerender } = renderHook(() => useCategories())

    // Assert
    await waitFor(() => {
      expect(getCategoriesSpy).toHaveBeenCalledTimes(1)
    })

    // Act - 再レンダリング
    rerender()

    // Assert - 追加のAPI呼び出しはない
    expect(getCategoriesSpy).toHaveBeenCalledTimes(1)
  })

  it('複数のコンポーネントで同時使用時に独立して動作する', async () => {
    // Arrange
    getCategoriesSpy.mockResolvedValue({
      data: mockCategories,
      success: true,
      timestamp: new Date().toISOString(),
    })

    // Act
    const { result: result1 } = renderHook(() => useCategories())
    const { result: result2 } = renderHook(() => useCategories())

    // Assert
    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false)
      expect(result2.current.isLoading).toBe(false)
    })

    expect(result1.current.categories).toEqual(mockCategories)
    expect(result2.current.categories).toEqual(mockCategories)
    expect(getCategoriesSpy).toHaveBeenCalledTimes(2)
  })

  it('コンポーネントアンマウント時にメモリリークが発生しない', async () => {
    // Arrange
    getCategoriesSpy.mockResolvedValue({
      data: mockCategories,
      success: true,
      timestamp: new Date().toISOString(),
    })

    // Act
    const { unmount } = renderHook(() => useCategories())

    // Assert - アンマウント時にエラーが発生しないことを確認
    expect(() => unmount()).not.toThrow()
  })

  it('ネットワークエラー時に適切にエラー処理する', async () => {
    // Arrange
    getCategoriesSpy.mockRejectedValue(new Error('Network Error'))

    // Act
    const { result } = renderHook(() => useCategories())

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('カテゴリの取得に失敗しました')
    expect(result.current.categories).toEqual([])
  })

  it('APIレスポンスが不正な形式の場合にエラー処理する', async () => {
    // Arrange
    getCategoriesSpy.mockResolvedValue({
      data: undefined as unknown as Category[],
      success: false,
      timestamp: new Date().toISOString(),
    })

    // Act
    const { result } = renderHook(() => useCategories())

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('カテゴリの取得に失敗しました')
  })

  it('カテゴリデータが正しい型で返される', async () => {
    // Arrange
    getCategoriesSpy.mockResolvedValue({
      data: mockCategories,
      success: true,
      timestamp: new Date().toISOString(),
    })

    // Act
    const { result } = renderHook(() => useCategories())

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const categories = result.current.categories
    expect(Array.isArray(categories)).toBe(true)

    for (const category of categories) {
      expect(category).toHaveProperty('id')
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('color')
      expect(category).toHaveProperty('userId')
      expect(category).toHaveProperty('createdAt')
      expect(category).toHaveProperty('updatedAt')
    }
  })

  it('長時間のAPI呼び出しでもタイムアウトしない', async () => {
    // Arrange
    getCategoriesSpy.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: mockCategories,
                success: true,
                timestamp: new Date().toISOString(),
              }),
            500
          )
        )
    )

    // Act
    const { result } = renderHook(() => useCategories())

    // Assert - 初期状態
    expect(result.current.isLoading).toBe(true)

    // Assert - データ取得後
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 1000 }
    )

    expect(result.current.categories).toEqual(mockCategories)
  })

  it('大量のカテゴリデータも正常に処理する', async () => {
    // Arrange
    const manyCategories = Array.from({ length: 100 }, (_, i) => ({
      color: `#${i.toString(16).padStart(6, '0')}`,
      createdAt: new Date(),
      id: `category-${i}`,
      name: `カテゴリ${i}`,
      updatedAt: new Date(),
      userId: 'user-1',
    }))

    getCategoriesSpy.mockResolvedValue({
      data: manyCategories,
      success: true,
      timestamp: new Date().toISOString(),
    })

    // Act
    const { result } = renderHook(() => useCategories())

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toHaveLength(100)
    expect(result.current.categories).toEqual(manyCategories)
  })

  describe('CRUD Operations', () => {
    it('新しいカテゴリを作成できる', async () => {
      // Arrange
      const initialCategories = [mockCategories[0]]
      const newCategoryData = { color: '#123456', name: '新しいカテゴリ' }
      const createdCategory = {
        ...newCategoryData,
        createdAt: fixedDate,
        id: 'new-category',
        updatedAt: fixedDate,
        userId: 'user-1',
      }

      getCategoriesSpy.mockResolvedValue({
        data: initialCategories,
        success: true,
        timestamp: new Date().toISOString(),
      })
      createCategorySpy.mockResolvedValue({
        data: createdCategory,
        success: true,
        timestamp: new Date().toISOString(),
      })

      const { result } = renderHook(() => useCategories())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Act
      await act(async () => {
        await result.current.createCategory(newCategoryData)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2)
      })
      expect(result.current.categories).toContainEqual(createdCategory)
      expect(createCategorySpy).toHaveBeenCalledWith(newCategoryData)
    })

    it('カテゴリを更新できる', async () => {
      // Arrange
      const updateData = { color: '#654321', name: '更新されたカテゴリ' }
      const updatedCategory = {
        ...mockCategories[0],
        ...updateData,
      }

      getCategoriesSpy.mockResolvedValue({
        data: mockCategories,
        success: true,
        timestamp: new Date().toISOString(),
      })
      updateCategorySpy.mockResolvedValue({
        data: updatedCategory,
        success: true,
        timestamp: new Date().toISOString(),
      })

      const { result } = renderHook(() => useCategories())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Act
      await act(async () => {
        await result.current.updateCategory('category-1', updateData)
      })

      // Assert
      await waitFor(() => {
        const updatedCategoryInList = result.current.categories.find(
          (c) => c.id === 'category-1'
        )
        expect(updatedCategoryInList?.name).toBe('更新されたカテゴリ')
      })
      expect(updateCategorySpy).toHaveBeenCalledWith('category-1', updateData)
    })

    it('カテゴリを削除できる', async () => {
      // Arrange
      getCategoriesSpy.mockResolvedValue({
        data: mockCategories,
        success: true,
        timestamp: new Date().toISOString(),
      })
      deleteCategorySpy.mockResolvedValue({
        data: { deleted: true, id: 'category-1' },
        success: true,
        timestamp: new Date().toISOString(),
      })

      const { result } = renderHook(() => useCategories())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Act
      await act(async () => {
        await result.current.deleteCategory('category-1')
      })

      // Assert
      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2)
      })
      expect(
        result.current.categories.find((c) => c.id === 'category-1')
      ).toBeUndefined()
      expect(deleteCategorySpy).toHaveBeenCalledWith('category-1')
    })

    it('作成エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      getCategoriesSpy.mockResolvedValue({
        data: mockCategories,
        success: true,
        timestamp: new Date().toISOString(),
      })
      createCategorySpy.mockRejectedValue(new Error('Create error'))

      const { result } = renderHook(() => useCategories())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Act
      await act(async () => {
        await result.current.createCategory({
          color: '#123456',
          name: 'テスト',
        })
      })

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('カテゴリの作成に失敗しました')
      })
    })

    it('更新エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      getCategoriesSpy.mockResolvedValue({
        data: mockCategories,
        success: true,
        timestamp: new Date().toISOString(),
      })
      updateCategorySpy.mockRejectedValue(new Error('Update error'))

      const { result } = renderHook(() => useCategories())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Act
      await act(async () => {
        await result.current.updateCategory('category-1', { name: 'テスト' })
      })

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('カテゴリの更新に失敗しました')
      })
    })

    it('削除エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      getCategoriesSpy.mockResolvedValue({
        data: mockCategories,
        success: true,
        timestamp: new Date().toISOString(),
      })
      deleteCategorySpy.mockRejectedValue(new Error('Delete error'))

      const { result } = renderHook(() => useCategories())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Act
      await act(async () => {
        await result.current.deleteCategory('category-1')
      })

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('カテゴリの削除に失敗しました')
      })
    })

    it('エラーをクリアできる', async () => {
      // Arrange
      getCategoriesSpy.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useCategories())

      await waitFor(() => {
        expect(result.current.error).toBe('カテゴリの取得に失敗しました')
      })

      // Act
      act(() => {
        result.current.clearError()
      })

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeUndefined()
      })
    })
  })
})
