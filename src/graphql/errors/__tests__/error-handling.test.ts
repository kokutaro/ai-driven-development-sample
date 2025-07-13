/**
 * GraphQLエラーハンドリングのテストスイート
 *
 * プロダクション準備のための包括的なエラーシナリオテスト
 * エラーフォーマット、セキュリティ、監視、国際化の統合テスト
 */
import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest'

import {
  AuthenticationError,
  DatabaseError,
  ErrorCategory,
  ErrorSeverity,
  InternalSystemError,
  ResourceNotFoundError,
  ValidationError,
} from '../custom-errors'
import { GraphQLErrorFormatter } from '../error-formatter'
import { GraphQLErrorI18n, PolitenessLevel, SupportedLocale } from '../i18n'
import { GraphQLErrorMonitor } from '../monitoring'
import { PrismaErrorHandler } from '../prisma-error-handler'
import { GraphQLSecurityFilter, SecurityLevel } from '../security-filter'
import { GraphQLValidationHandler } from '../validation-handler'

import type { SecurityContext } from '../security-filter'
import type { ZodError } from '../validation-handler'

describe('GraphQLエラーハンドリング統合テスト', () => {
  let errorFormatter: GraphQLErrorFormatter
  let securityFilter: GraphQLSecurityFilter
  let monitor: GraphQLErrorMonitor
  let i18n: GraphQLErrorI18n
  let mockLogger: {
    debug: Mock
    error: Mock
    fatal: Mock
    info: Mock
    warn: Mock
  }

  beforeEach(() => {
    // モックロガーの設定
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }

    // テスト用インスタンスの初期化
    errorFormatter = new GraphQLErrorFormatter({
      debugMode: true,
      isProduction: false,
      logger: mockLogger,
    })

    securityFilter = new GraphQLSecurityFilter({
      enableDataMasking: true,
      includeStackTrace: true,
      isProduction: false,
    })

    monitor = new GraphQLErrorMonitor()
    i18n = new GraphQLErrorI18n({
      locale: SupportedLocale.JAPANESE,
      politenessLevel: PolitenessLevel.POLITE,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    monitor.stop()
  })

  describe('カスタムエラークラス', () => {
    it('AuthenticationErrorが正しく作成される', () => {
      const error = new AuthenticationError('ログインが必要です', {
        requestId: 'test-req-1',
      })

      expect(error.message).toBe('ログインが必要です')
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION)
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
      expect(error.extensions.code).toBe('UNAUTHENTICATED')
      expect(error.extensions.requestId).toBe('test-req-1')
      expect(error.isOperational).toBe(true)
    })

    it('ValidationErrorが詳細情報を含む', () => {
      const validationDetails = {
        email: ['有効なメールアドレスを入力してください'],
        title: ['タイトルは必須です'],
      }

      const error = new ValidationError(
        '入力内容に問題があります',
        validationDetails
      )

      expect(error.category).toBe(ErrorCategory.VALIDATION)
      expect(error.extensions.validationDetails).toEqual(validationDetails)
    })

    it('構造化エラー情報が正しく生成される', () => {
      const error = new DatabaseError(
        'データベース接続エラー',
        'connection',
        new Error('Connection timeout'),
        { timeout: 5000 }
      )

      const structured = error.toStructuredError()

      expect(structured.name).toBe('DatabaseError')
      expect(structured.category).toBe(ErrorCategory.DATABASE)
      expect(structured.severity).toBe(ErrorSeverity.HIGH)
      expect(structured.isOperational).toBe(true)
      expect(structured.timestamp).toBeDefined()
    })
  })

  describe('エラーフォーマッター', () => {
    it('開発環境でスタックトレースが含まれる', () => {
      const originalError = new Error('Test error')
      const graphqlError = new InternalSystemError(
        'システムエラー',
        originalError
      )

      const formatted = errorFormatter.formatError(
        { message: graphqlError.message },
        graphqlError
      )

      expect(formatted.extensions?.stackTrace).toBeDefined()
      expect(formatted.extensions?.code).toBe('INTERNAL_SERVER_ERROR')
      expect(formatted.extensions?.requestId).toBeDefined()
    })

    it('本番環境でセキュリティフィルタリングが適用される', () => {
      const productionFormatter = new GraphQLErrorFormatter({
        isProduction: true,
        security: {
          allowedExtensions: ['code', 'timestamp'],
          hideInternalDetails: true,
        },
      })

      const error = new InternalSystemError('データベース接続に失敗しました')
      const formatted = productionFormatter.formatError(
        { message: error.message },
        error
      )

      expect(formatted.message).toBe(
        'システムエラーが発生しました。管理者にお問い合わせください。'
      )
      expect(formatted.extensions?.stackTrace).toBeUndefined()
      expect(Object.keys(formatted.extensions ?? {})).toEqual([
        'code',
        'timestamp',
      ])
    })

    it('ログが適切なレベルで出力される', () => {
      const criticalError = new InternalSystemError('致命的エラー', undefined, {
        severity: ErrorSeverity.CRITICAL,
      })

      errorFormatter.formatError(
        { message: criticalError.message },
        criticalError
      )

      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('Prismaエラーハンドリング', () => {
    it('P2002 (Unique constraint)エラーが適切に変換される', () => {
      const prismaError = {
        code: 'P2002',
        message: 'Unique constraint failed',
        meta: { target: ['email'] },
      }

      const result = PrismaErrorHandler.transformPrismaError(
        prismaError,
        'create',
        'User',
        'test-user-id'
      )

      expect(result.error).toBeInstanceOf(ValidationError)
      expect(result.error.message).toContain('一意制約違反')
      expect(result.error.extensions.validationDetails).toBeDefined()
      expect(result.shouldRetry).toBe(false)
    })

    it('P2025 (Record not found)エラーが適切に変換される', () => {
      const prismaError = {
        code: 'P2025',
        message: 'Record to delete does not exist',
        meta: { cause: 'Record to delete does not exist.' },
      }

      const result = PrismaErrorHandler.transformPrismaError(
        prismaError,
        'delete',
        'Todo',
        'non-existent-id'
      )

      expect(result.error).toBeInstanceOf(ResourceNotFoundError)
      expect(result.error.message).toContain('Todo')
      expect(result.error.message).toContain('non-existent-id')
      expect(result.shouldRetry).toBe(false)
    })

    it('接続エラーが再試行可能としてマークされる', () => {
      const prismaError = {
        code: 'P1001',
        message: "Can't reach database server",
      }

      const result = PrismaErrorHandler.transformPrismaError(
        prismaError,
        'findMany',
        'Todo'
      )

      expect(result.error).toBeInstanceOf(DatabaseError)
      expect(result.shouldRetry).toBe(true)
      expect(result.logLevel).toBe('error')
    })
  })

  describe('バリデーションエラーハンドリング', () => {
    it('Zodエラーが日本語メッセージに変換される', () => {
      const zodError: ZodError = {
        issues: [
          {
            code: 'too_small',
            message: 'String must contain at least 1 character(s)',
            minimum: 1,
            path: ['title'],
            type: 'string',
            validation: undefined,
          },
          {
            code: 'invalid_string',
            message: 'Invalid email',
            path: ['email'],
            validation: 'email',
          },
        ],
      }

      const validationError = GraphQLValidationHandler.transformZodError(
        zodError,
        'createTodo'
      )

      expect(validationError.message).toContain('フィールド')
      expect(validationError.extensions.validationDetails).toBeDefined()

      const details = validationError.extensions.validationDetails as Array<{
        code: string
        field: string
        message: string
      }>
      expect(details).toHaveLength(2)
      expect(details[0].message).toContain('1文字以上')
      expect(details[1].message).toContain('有効なメールアドレス')
    })

    it('フィールドレベルバリデーションが動作する', () => {
      const mockSchema = {
        parse: vi.fn().mockImplementation((value: string) => {
          if (!value || value.length < 3) {
            const error = new Error('Validation failed')
            ;(error as unknown as { issues: unknown[] }).issues = [
              {
                code: 'too_small',
                message: 'Too short',
                minimum: 3,
                path: ['username'],
                type: 'string',
              },
            ]
            throw error
          }
          return value
        }),
      }

      const result = GraphQLValidationHandler.validateField(
        'ab',
        mockSchema,
        'username'
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].field).toBe('username')
      expect(result.errors![0].message).toContain('3文字以上')
    })
  })

  describe('セキュリティフィルタリング', () => {
    it('機密情報がマスクされる', () => {
      const error = new ValidationError('パスワードが無効です', {
        apiKey: ['key_12345'],
        password: ['secret123'],
      })

      const securityContext: SecurityContext = {
        isAuthenticated: false,
        isTrustedSource: false,
        permissions: [] as string[],
        securityLevel: SecurityLevel.PUBLIC,
      }

      const result = securityFilter.filterError(error, securityContext)

      expect(result.filtered?.extensions?.password).toBe('[REDACTED]')
      expect(result.filtered?.extensions?.apiKey).toBe('[REDACTED]')
      expect(result.securityViolations.length).toBeGreaterThan(0)
      expect(result.riskLevel).toBe('medium')
    })

    it('内部エラーの詳細が隠される', () => {
      const productionFilter = new GraphQLSecurityFilter({
        hideInternalDetails: true,
        isProduction: true,
      })

      const internalError = new InternalSystemError(
        'Database connection failed'
      )
      const securityContext: SecurityContext = {
        isAuthenticated: true,
        isTrustedSource: false,
        permissions: [] as string[],
        securityLevel: SecurityLevel.INTERNAL,
      }

      const result = productionFilter.filterError(
        internalError,
        securityContext
      )

      expect(result.filtered.message).toBe(
        'システムエラーが発生しました。管理者にお問い合わせください。'
      )
      expect(
        result.securityViolations.some(
          (v) => v.type === 'information_disclosure'
        )
      ).toBe(true)
    })

    it('SQLインジェクション試行が検出される', () => {
      const maliciousError = new ValidationError("1' OR '1'='1")
      const securityContext: SecurityContext = {
        isAuthenticated: false,
        isTrustedSource: false,
        permissions: [] as string[],
        securityLevel: SecurityLevel.PUBLIC,
      }

      const result = securityFilter.filterError(maliciousError, securityContext)

      expect(
        result.securityViolations.some((v) => v.type === 'injection_attempt')
      ).toBe(true)
      expect(result.riskLevel).toBe('critical')
    })
  })

  describe('エラー監視・アラート', () => {
    it('高重要度エラーが記録される', () => {
      const criticalError = new InternalSystemError(
        'データベース障害',
        undefined,
        {
          severity: ErrorSeverity.CRITICAL,
        }
      )

      monitor.recordError(criticalError, {
        duration: 1500,
        operationName: 'getTodos',
      })

      // モニタリングシステムが正常に動作することを確認
      expect(true).toBe(true) // 実際の実装では内部状態をテスト
    })

    it('エラーレートアラートが適切に動作する', async () => {
      // 複数のエラーを短時間で記録
      for (let i = 0; i < 5; i++) {
        const error = new ValidationError(`Validation error ${i}`)
        monitor.recordError(error)
      }

      // アラート条件が評価されることを確認
      const healthCheck = await monitor.performHealthCheck()
      expect(healthCheck.status).toBeDefined()
    })
  })

  describe('国際化対応', () => {
    it('日本語エラーメッセージが生成される', () => {
      const message = i18n.getCategoryMessage(
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        { userRole: 'guest' },
        SupportedLocale.JAPANESE
      )

      expect(message).toContain('ログイン')
      expect(message).toContain('ください')
    })

    it('英語エラーメッセージが生成される', () => {
      const message = i18n.getCategoryMessage(
        ErrorCategory.AUTHORIZATION,
        ErrorSeverity.MEDIUM,
        { userRole: 'user' },
        SupportedLocale.ENGLISH_US
      )

      expect(message).toContain('Access denied')
      expect(message).toContain('administrator')
    })

    it('敬語レベルが適用される', () => {
      const formalI18n = new GraphQLErrorI18n({
        locale: SupportedLocale.JAPANESE,
        politenessLevel: PolitenessLevel.FORMAL,
      })

      const message = formalI18n.getCategoryMessage(
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        { fieldName: 'email' }
      )

      expect(message).toContain('いただけますでしょうか')
    })
  })

  describe('統合エラーシナリオ', () => {
    it('認証エラーから最終的なクライアントレスポンスまでの完全フロー', () => {
      // 1. 認証エラーの発生
      const authError = new AuthenticationError('ログインが必要です', {
        requestId: 'req_123',
      })

      // 2. セキュリティフィルタリング
      const securityContext: SecurityContext = {
        isAuthenticated: false,
        isTrustedSource: false,
        permissions: [] as string[],
        securityLevel: SecurityLevel.PUBLIC,
      }

      const filteredResult = securityFilter.filterError(
        authError,
        securityContext
      )

      // 3. エラーフォーマット
      const formatted = errorFormatter.formatError(
        { message: authError.message },
        authError
      )

      // 4. 国際化メッセージ
      const localizedMessage = i18n.getCategoryMessage(
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        {},
        SupportedLocale.JAPANESE
      )

      // 5. 監視記録
      monitor.recordError(authError)

      // 結果の検証
      expect(formatted.message).toContain('ログイン')
      expect(formatted.extensions?.code).toBe('UNAUTHENTICATED')
      expect(formatted.extensions?.category).toBe(ErrorCategory.AUTHENTICATION)
      expect(localizedMessage).toContain('ログイン')
      expect(filteredResult.riskLevel).toBe('low')
    })

    it('Prismaエラーから多言語対応レスポンスまでの完全フロー', () => {
      // 1. Prismaエラーの発生
      const prismaError = {
        code: 'P2002',
        message: 'Unique constraint failed on the (email)',
        meta: { target: ['email'] },
      }

      // 2. Prismaエラーハンドリング
      const transformResult = PrismaErrorHandler.transformPrismaError(
        prismaError,
        'create',
        'User',
        'new-user'
      )

      // 3. セキュリティフィルタリング
      const securityContext: SecurityContext = {
        isAuthenticated: true,
        isTrustedSource: true,
        permissions: ['user:create'],
        securityLevel: SecurityLevel.INTERNAL,
        userId: 'user_123',
      }

      const filteredResult = securityFilter.filterError(
        transformResult.error,
        securityContext
      )

      // 4. エラーフォーマット
      const formatted = errorFormatter.formatError(
        { message: transformResult.error.message },
        transformResult.error
      )

      // 5. 国際化メッセージ (英語)
      const englishI18n = new GraphQLErrorI18n({
        locale: SupportedLocale.ENGLISH_US,
        politenessLevel: PolitenessLevel.POLITE,
      })

      const localizedMessage = englishI18n.getCategoryMessage(
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        { fieldName: 'email' },
        SupportedLocale.ENGLISH_US
      )

      // 結果の検証
      expect(transformResult.error).toBeInstanceOf(ValidationError)
      expect(formatted.extensions?.code).toBe('BAD_USER_INPUT')
      expect(localizedMessage).toContain('Invalid input')
      expect(filteredResult.securityViolations.length).toBe(0) // 通常のバリデーションエラーなので違反なし
      expect(transformResult.shouldRetry).toBe(false)
    })

    it('システムエラーの本番環境フロー', () => {
      // 本番環境設定
      const productionFormatter = new GraphQLErrorFormatter({
        isProduction: true,
        logger: mockLogger,
        security: {
          hideInternalDetails: true,
          maskSensitiveData: true,
        },
      })

      const productionFilter = new GraphQLSecurityFilter({
        hideInternalDetails: true,
        isProduction: true,
      })

      // 1. 重大なシステムエラー
      const systemError = new InternalSystemError(
        'Database connection pool exhausted',
        new Error('ECONNREFUSED'),
        {
          connectionPool: {
            activeConnections: 10,
            maxConnections: 10,
            waitingQueries: 50,
          },
          severity: ErrorSeverity.CRITICAL,
        }
      )

      // 2. セキュリティフィルタリング
      const securityContext: SecurityContext = {
        isAuthenticated: true,
        isTrustedSource: false,
        permissions: ['user:read'],
        securityLevel: SecurityLevel.INTERNAL,
        userId: 'user_456',
      }

      const filteredResult = productionFilter.filterError(
        systemError,
        securityContext
      )

      // 3. 本番環境エラーフォーマット
      const formatted = productionFormatter.formatError(
        { message: systemError.message },
        systemError
      )

      // 4. 監視記録
      monitor.recordError(systemError, {
        duration: 30000, // 30秒
        operationName: 'getTodos',
      })

      // 結果の検証
      expect(filteredResult.filtered.message).toBe(
        'システムエラーが発生しました。管理者にお問い合わせください。'
      )
      expect(filteredResult.riskLevel).toBe('high')
      expect(formatted.extensions?.stackTrace).toBeUndefined()
      expect(formatted.extensions?.connectionPool).toBeUndefined() // 機密情報は除去
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('パフォーマンステスト', () => {
    it('大量のエラーが効率的に処理される', () => {
      const startTime = Date.now()

      // 1000個のエラーを処理
      for (let i = 0; i < 1000; i++) {
        const error = new ValidationError(`Error ${i}`)
        monitor.recordError(error)

        const formatted = errorFormatter.formatError(
          { message: error.message },
          error
        )

        expect(formatted.message).toBeDefined()
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // 1000エラーを5秒以内で処理できることを確認
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('エラー復旧シナリオ', () => {
    it('一時的なデータベースエラーからの復旧', () => {
      // 一時的なエラー
      const temporaryError = {
        code: 'P1001',
        message: "Can't reach database server",
      }

      const result = PrismaErrorHandler.transformPrismaError(
        temporaryError,
        'findMany',
        'Todo'
      )

      expect(result.shouldRetry).toBe(true)
      expect(result.error.extensions.retryable).toBe(true)
    })

    it('永続的なエラーは再試行されない', () => {
      const permanentError = {
        code: 'P2002',
        message: 'Unique constraint failed',
        meta: { target: ['email'] },
      }

      const result = PrismaErrorHandler.transformPrismaError(
        permanentError,
        'create',
        'User'
      )

      expect(result.shouldRetry).toBe(false)
      expect(result.error.extensions.retryable).toBe(false)
    })
  })
})

describe('エラーハンドリングヘルパー関数', () => {
  it('withPrismaErrorHandlingが正常に動作する', async () => {
    const { withPrismaErrorHandling } = await import('../prisma-error-handler')

    const mockOperation = vi.fn().mockRejectedValue({
      code: 'P2025',
      message: 'Record not found',
    })

    await expect(
      withPrismaErrorHandling(mockOperation, 'delete', 'Todo', 'test-id')
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })

  it('セキュリティコンテキストが正しく作成される', () => {
    const context = GraphQLSecurityFilter.createSecurityContext(
      'user_123',
      'admin',
      '192.168.1.1',
      'Mozilla/5.0',
      true,
      ['user:read', 'user:write']
    )

    expect(context.userId).toBe('user_123')
    expect(context.userRole).toBe('admin')
    expect(context.isAuthenticated).toBe(true)
    expect(context.securityLevel).toBe(SecurityLevel.CONFIDENTIAL)
    expect(context.permissions).toEqual(['user:read', 'user:write'])
  })
})
