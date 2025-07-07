/**
 * APIスキーマのテスト
 * @fileoverview ZodAPIスキーマのユニットテスト
 */
import { describe, expect, it } from 'vitest'

import {
  apiErrorResponseSchema,
  apiRequestOptionsSchema,
  apiSuccessResponseSchema,
  httpMethodSchema,
  paginatedResponseSchema,
  paginationInfoSchema,
} from './api.schema'

describe('httpMethodSchema', () => {
  // 有効なHTTPメソッドのテスト
  it('validates valid HTTP methods', () => {
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

    for (const method of validMethods) {
      const result = httpMethodSchema.safeParse(method)
      expect(result.success).toBe(true)
    }
  })

  // 無効なHTTPメソッドのテスト
  it('rejects invalid HTTP methods', () => {
    const invalidMethod = 'INVALID'

    const result = httpMethodSchema.safeParse(invalidMethod)
    expect(result.success).toBe(false)
  })

  // 小文字のHTTPメソッドのテスト
  it('rejects lowercase HTTP methods', () => {
    const invalidMethod = 'get'

    const result = httpMethodSchema.safeParse(invalidMethod)
    expect(result.success).toBe(false)
  })
})

describe('apiRequestOptionsSchema', () => {
  // 空のオプションのテスト
  it('validates empty options object', () => {
    const validOptions = {}

    const result = apiRequestOptionsSchema.safeParse(validOptions)
    expect(result.success).toBe(true)
  })

  // 完全なオプションのテスト
  it('validates complete options object', () => {
    const validOptions = {
      body: { data: 'test' },
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      params: {
        active: true,
        limit: 10,
        page: 1,
        search: 'test query',
      },
    }

    const result = apiRequestOptionsSchema.safeParse(validOptions)
    expect(result.success).toBe(true)
  })

  // メソッドのみのテスト
  it('validates method only', () => {
    const validOptions = {
      method: 'GET',
    }

    const result = apiRequestOptionsSchema.safeParse(validOptions)
    expect(result.success).toBe(true)
  })

  // ヘッダーのみのテスト
  it('validates headers only', () => {
    const validOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const result = apiRequestOptionsSchema.safeParse(validOptions)
    expect(result.success).toBe(true)
  })

  // 無効なメソッドのテスト
  it('rejects invalid method', () => {
    const invalidOptions = {
      method: 'INVALID',
    }

    const result = apiRequestOptionsSchema.safeParse(invalidOptions)
    expect(result.success).toBe(false)
  })

  // パラメータの型チェックテスト
  it('validates parameter types', () => {
    const validOptions = {
      params: {
        booleanParam: true,
        numberParam: 123,
        stringParam: 'string',
      },
    }

    const result = apiRequestOptionsSchema.safeParse(validOptions)
    expect(result.success).toBe(true)
  })
})

describe('apiSuccessResponseSchema', () => {
  // 基本的な成功レスポンスのテスト
  it('validates basic success response', () => {
    const validResponse = {
      data: { id: 1, name: 'Test' },
      success: true,
    }

    const result = apiSuccessResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  // メッセージ付き成功レスポンスのテスト
  it('validates success response with message', () => {
    const validResponse = {
      data: { id: 1, name: 'Test' },
      message: 'Operation completed successfully',
      success: true,
    }

    const result = apiSuccessResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  // 配列データの成功レスポンスのテスト
  it('validates success response with array data', () => {
    const validResponse = {
      data: [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ],
      success: true,
    }

    const result = apiSuccessResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  // undefined データの成功レスポンスのテスト
  it('validates success response with undefined data', () => {
    const validResponse = {
      data: undefined,
      success: true,
    }

    const result = apiSuccessResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  // 必須フィールドのテスト
  it('requires success field', () => {
    const invalidResponse = {
      data: { test: 'data' },
      message: 'Missing success field',
    }

    const result = apiSuccessResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0])
      expect(missingFields).toContain('success')
    }
  })

  // 不正なsuccessフィールドのテスト
  it('requires success to be true', () => {
    const invalidResponse = {
      data: { id: 1, name: 'Test' },
      success: false,
    }

    const result = apiSuccessResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
  })
})

describe('apiErrorResponseSchema', () => {
  // 基本的なエラーレスポンスのテスト
  it('validates basic error response', () => {
    const validResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      },
      success: false,
    }

    const result = apiErrorResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  // 詳細情報付きエラーレスポンスのテスト
  it('validates error response with details', () => {
    const validResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        details: {
          field: 'email',
          reason: 'Invalid format',
        },
        message: 'Validation failed',
      },
      success: false,
    }

    const result = apiErrorResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  // 必須フィールドのテスト
  it('requires success and error fields', () => {
    const invalidResponse = {
      message: 'Missing required fields',
    }

    const result = apiErrorResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0])
      expect(missingFields).toContain('success')
      expect(missingFields).toContain('error')
    }
  })

  // エラーオブジェクトの必須フィールドテスト
  it('requires error code and message', () => {
    const invalidResponse = {
      error: {
        details: 'Missing code and message',
      },
      success: false,
    }

    const result = apiErrorResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues
        .filter((issue) => issue.path[0] === 'error')
        .map((issue) => issue.path[1])
      expect(missingFields).toContain('code')
      expect(missingFields).toContain('message')
    }
  })

  // 不正なsuccessフィールドのテスト
  it('requires success to be false', () => {
    const invalidResponse = {
      error: {
        code: 'ERROR',
        message: 'Error message',
      },
      success: true,
    }

    const result = apiErrorResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
  })
})

describe('paginationInfoSchema', () => {
  // 正常なページネーション情報のテスト
  it('validates valid pagination info', () => {
    const validPagination = {
      hasNext: true,
      hasPrevious: false,
      page: 1,
      pageSize: 10,
      totalCount: 100,
      totalPages: 10,
    }

    const result = paginationInfoSchema.safeParse(validPagination)
    expect(result.success).toBe(true)
  })

  // 必須フィールドのテスト
  it('requires all pagination fields', () => {
    const invalidPagination = {
      page: 1,
    }

    const result = paginationInfoSchema.safeParse(invalidPagination)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0])
      expect(missingFields).toContain('pageSize')
      expect(missingFields).toContain('totalCount')
      expect(missingFields).toContain('totalPages')
      expect(missingFields).toContain('hasNext')
      expect(missingFields).toContain('hasPrevious')
    }
  })

  // 正の数値バリデーションテスト
  it('validates positive number constraints', () => {
    const invalidPagination = {
      hasNext: true,
      hasPrevious: false,
      page: 0, // 1以上が必要
      pageSize: 0, // 1以上が必要
      totalCount: -1, // 0以上が必要
      totalPages: -1, // 0以上が必要
    }

    const result = paginationInfoSchema.safeParse(invalidPagination)
    expect(result.success).toBe(false)
  })

  // ページサイズの上限テスト
  it('validates page size upper limit', () => {
    const invalidPagination = {
      hasNext: false,
      hasPrevious: false,
      page: 1,
      pageSize: 1001, // 1000超過
      totalCount: 100,
      totalPages: 1,
    }

    const result = paginationInfoSchema.safeParse(invalidPagination)
    expect(result.success).toBe(false)
  })
})

describe('paginatedResponseSchema', () => {
  // 正常なページネーションレスポンスのテスト
  it('validates valid paginated response', () => {
    const validResponse = {
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
      pagination: {
        hasNext: false,
        hasPrevious: false,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        totalPages: 1,
      },
    }

    const result = paginatedResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  // 空の配列のテスト
  it('validates paginated response with empty items', () => {
    const validResponse = {
      items: [],
      pagination: {
        hasNext: false,
        hasPrevious: false,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
    }

    const result = paginatedResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  // 必須フィールドのテスト
  it('requires items and pagination fields', () => {
    const invalidResponse = {}

    const result = paginatedResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0])
      expect(missingFields).toContain('items')
      expect(missingFields).toContain('pagination')
    }
  })
})
