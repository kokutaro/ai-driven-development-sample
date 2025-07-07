/**
 * ユーザースキーマのテスト
 * @fileoverview Zodユーザースキーマのユニットテスト
 */
import { describe, expect, it } from 'vitest'

import {
  loginInputSchema,
  registerInputSchema,
  updateUserInputSchema,
  userSchema,
  userSessionSchema,
} from './user.schema'

describe('userSchema', () => {
  // 正常なユーザーオブジェクトのテスト
  it('validates a valid user object', () => {
    const validUser = {
      createdAt: new Date(),
      email: 'test@example.com',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test User',
      updatedAt: new Date(),
    }

    const result = userSchema.safeParse(validUser)
    expect(result.success).toBe(true)
  })

  // 必須フィールドのテスト
  it('requires id, email, createdAt, updatedAt', () => {
    const invalidUser = {
      name: 'Test User',
    }

    const result = userSchema.safeParse(invalidUser)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0])
      expect(missingFields).toContain('id')
      expect(missingFields).toContain('email')
      expect(missingFields).toContain('createdAt')
      expect(missingFields).toContain('updatedAt')
    }
  })

  // メールアドレスの形式テスト
  it('validates email format', () => {
    const invalidUser = {
      createdAt: new Date(),
      email: 'invalid-email',
      id: '550e8400-e29b-41d4-a716-446655440000',
      updatedAt: new Date(),
    }

    const result = userSchema.safeParse(invalidUser)
    expect(result.success).toBe(false)
  })

  // 名前の文字数制限テスト
  it('validates name length constraints', () => {
    const longName = 'a'.repeat(101) // 100文字超過
    const invalidUser = {
      createdAt: new Date(),
      email: 'test@example.com',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: longName,
      updatedAt: new Date(),
    }

    const result = userSchema.safeParse(invalidUser)
    expect(result.success).toBe(false)
  })

  // 名前がオプショナルであることのテスト
  it('allows user without name', () => {
    const validUser = {
      createdAt: new Date(),
      email: 'test@example.com',
      id: '550e8400-e29b-41d4-a716-446655440000',
      updatedAt: new Date(),
    }

    const result = userSchema.safeParse(validUser)
    expect(result.success).toBe(true)
  })

  // UUIDバリデーションテスト
  it('validates UUID format for id', () => {
    const invalidUser = {
      createdAt: new Date(),
      email: 'test@example.com',
      id: 'invalid-id',
      updatedAt: new Date(),
    }

    const result = userSchema.safeParse(invalidUser)
    expect(result.success).toBe(false)
  })
})

describe('loginInputSchema', () => {
  // 正常なログイン入力のテスト
  it('validates valid login input', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'password123',
    }

    const result = loginInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // 必須フィールドのテスト
  it('requires email and password', () => {
    const invalidInput = {}

    const result = loginInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0])
      expect(missingFields).toContain('email')
      expect(missingFields).toContain('password')
    }
  })

  // メールアドレス形式のテスト
  it('validates email format', () => {
    const invalidInput = {
      email: 'invalid-email',
      password: 'password123',
    }

    const result = loginInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  // パスワードの最小長制限テスト
  it('validates password minimum length', () => {
    const invalidInput = {
      email: 'test@example.com',
      password: '123', // 8文字未満
    }

    const result = loginInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  // パスワードの最大長制限テスト
  it('validates password maximum length', () => {
    const longPassword = 'a'.repeat(73) // 72文字超過
    const invalidInput = {
      email: 'test@example.com',
      password: longPassword,
    }

    const result = loginInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})

describe('registerInputSchema', () => {
  // 正常なユーザー登録入力のテスト
  it('validates valid register input', () => {
    const validInput = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    }

    const result = registerInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // 名前なしでの登録テスト
  it('validates register input without name', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'password123',
    }

    const result = registerInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // 必須フィールドのテスト
  it('requires email and password', () => {
    const invalidInput = {
      name: 'Test User',
    }

    const result = registerInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0])
      expect(missingFields).toContain('email')
      expect(missingFields).toContain('password')
    }
  })

  // パスワード確認のテスト（将来的な拡張のため）
  it('validates password strength requirements', () => {
    const invalidInput = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'weak', // 8文字未満
    }

    const result = registerInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})

describe('updateUserInputSchema', () => {
  // 一部フィールドの更新テスト
  it('validates partial update', () => {
    const validInput = {
      name: 'Updated Name',
    }

    const result = updateUserInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // 空のオブジェクトのテスト
  it('validates empty update object', () => {
    const validInput = {}

    const result = updateUserInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // メールアドレス更新のテスト
  it('validates email update', () => {
    const validInput = {
      email: 'updated@example.com',
    }

    const result = updateUserInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // パスワード更新のテスト
  it('validates password update', () => {
    const validInput = {
      password: 'newpassword123',
    }

    const result = updateUserInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // 無効なメールアドレスのテスト
  it('rejects invalid email format', () => {
    const invalidInput = {
      email: 'invalid-email',
    }

    const result = updateUserInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  // 弱いパスワードのテスト
  it('rejects weak password', () => {
    const invalidInput = {
      password: '123', // 8文字未満
    }

    const result = updateUserInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})

describe('userSessionSchema', () => {
  // 正常なユーザーセッションのテスト
  it('validates valid user session', () => {
    const validSession = {
      expiresAt: new Date(),
      token: 'jwt-token-string',
      user: {
        createdAt: new Date(),
        email: 'test@example.com',
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test User',
        updatedAt: new Date(),
      },
    }

    const result = userSessionSchema.safeParse(validSession)
    expect(result.success).toBe(true)
  })

  // 必須フィールドのテスト
  it('requires token, user, and expiresAt', () => {
    const invalidSession = {}

    const result = userSessionSchema.safeParse(invalidSession)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0])
      expect(missingFields).toContain('token')
      expect(missingFields).toContain('user')
      expect(missingFields).toContain('expiresAt')
    }
  })

  // トークンの最小長制限テスト
  it('validates token minimum length', () => {
    const invalidSession = {
      expiresAt: new Date(),
      token: 'abc', // 10文字未満
      user: {
        createdAt: new Date(),
        email: 'test@example.com',
        id: '550e8400-e29b-41d4-a716-446655440000',
        updatedAt: new Date(),
      },
    }

    const result = userSessionSchema.safeParse(invalidSession)
    expect(result.success).toBe(false)
  })

  // ユーザー情報のバリデーションテスト
  it('validates nested user object', () => {
    const invalidSession = {
      expiresAt: new Date(),
      token: 'valid-jwt-token-string',
      user: {
        createdAt: new Date(),
        email: 'invalid-email', // 無効なメールアドレス
        id: 'invalid-id', // 無効なUUID
        updatedAt: new Date(),
      },
    }

    const result = userSessionSchema.safeParse(invalidSession)
    expect(result.success).toBe(false)
  })
})
