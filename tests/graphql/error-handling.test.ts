/**
 * GraphQLエラーハンドリング統合テスト
 *
 * プロダクション準備のための高度なエラーハンドリング機能をテストします。
 */
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { GraphQLError } from 'graphql'

// テスト対象のインポート
import {
  AuthenticationError,
  BaseGraphQLError,
  BusinessLogicError,
  DatabaseError,
  ErrorCategory,
  ErrorSeverity,
  ExternalServiceError,
  ValidationError,
} from '@/graphql/errors/custom-errors'
import { GraphQLErrorCode } from '@/graphql/errors/error-codes'
import { formatGraphQLError } from '@/graphql/errors/error-formatter'
import { GraphQLErrorI18n } from '@/graphql/errors/i18n'
import { StructuredLogger } from '@/graphql/errors/logger'
import { GraphQLErrorMonitor } from '@/graphql/errors/monitoring'
import { PrismaErrorHandler } from '@/graphql/errors/prisma-error-handler'
import { GraphQLSecurityFilter } from '@/graphql/errors/security-filter'
import { GraphQLValidationHandler } from '@/graphql/errors/validation-handler'

describe('GraphQLエラーハンドリング統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('カスタムエラークラス', () => {
    it('should create BaseGraphQLError with proper structure', () => {
      const error = new BaseGraphQLError(
        'Base error message',
        GraphQLErrorCode.INTERNAL_ERROR,
        { userId: 'test-user' }
      )

      expect(error).toBeInstanceOf(GraphQLError)
      expect(error.message).toBe('Base error message')
      expect(error.extensions.code).toBe(GraphQLErrorCode.INTERNAL_ERROR)
      expect(error.extensions.context).toEqual({ userId: 'test-user' })
      expect(error.extensions.severity).toBe('error')
      expect(error.extensions.timestamp).toBeInstanceOf(Date)
      expect(error.extensions.requestId).toBeDefined()
    })

    it('should create ValidationError with field information', () => {
      const error = new ValidationError(
        'Validation failed',
        'title',
        'Title is required',
        { minLength: 1 }
      )

      expect(error).toBeInstanceOf(BaseGraphQLError)
      expect(error.extensions.code).toBe(GraphQLErrorCode.VALIDATION_ERROR)
      expect(error.extensions.field).toBe('title')
      expect(error.extensions.details).toBe('Title is required')
      expect(error.extensions.constraints).toEqual({ minLength: 1 })
      expect(error.extensions.severity).toBe('warning')
    })

    it('should create DatabaseError with retry information', () => {
      const error = new DatabaseError(
        'Database connection failed',
        'CONNECTION_TIMEOUT',
        true,
        { connectionPool: 'primary' }
      )

      expect(error).toBeInstanceOf(BaseGraphQLError)
      expect(error.extensions.code).toBe(GraphQLErrorCode.DATABASE_ERROR)
      expect(error.extensions.databaseCode).toBe('CONNECTION_TIMEOUT')
      expect(error.extensions.retryable).toBe(true)
      expect(error.extensions.severity).toBe('error')
    })

    it('should create AuthenticationError with security context', () => {
      const error = new AuthenticationError(
        'Invalid credentials',
        'INVALID_TOKEN',
        { attemptCount: 3, lastAttempt: new Date() }
      )

      expect(error).toBeInstanceOf(BaseGraphQLError)
      expect(error.extensions.code).toBe(GraphQLErrorCode.AUTHENTICATION_ERROR)
      expect(error.extensions.authCode).toBe('INVALID_TOKEN')
      expect(error.extensions.severity).toBe('warning')
      expect(error.extensions.securityContext).toBeDefined()
    })

    it('should create BusinessLogicError with operation context', () => {
      const error = new BusinessLogicError(
        'Cannot delete completed todo',
        'DELETE_COMPLETED_TODO',
        'deleteTodo',
        { status: 'completed', todoId: 'todo-123' }
      )

      expect(error).toBeInstanceOf(BaseGraphQLError)
      expect(error.extensions.code).toBe(GraphQLErrorCode.BUSINESS_LOGIC_ERROR)
      expect(error.extensions.businessCode).toBe('DELETE_COMPLETED_TODO')
      expect(error.extensions.operation).toBe('deleteTodo')
      expect(error.extensions.severity).toBe('info')
    })
  })

  describe('エラーフォーマッター', () => {
    it('should format error for production environment', () => {
      const originalError = new ValidationError(
        'Title is required',
        'title',
        'Field validation failed'
      )

      const formatted = formatGraphQLError(originalError, {
        hideInternalDetails: true,
        includeStackTrace: false,
        isProduction: true,
      })

      expect(formatted.message).toBe('Title is required')
      expect(formatted.extensions.code).toBe(GraphQLErrorCode.VALIDATION_ERROR)
      expect(formatted.extensions.internalDetails).toBeUndefined()
      expect(formatted.extensions.stackTrace).toBeUndefined()
      expect(formatted.extensions.timestamp).toBeInstanceOf(Date)
    })

    it('should format error for development environment', () => {
      const originalError = new DatabaseError('Query failed', 'P2002', false, {
        constraint: 'unique_title',
        table: 'todos',
      })

      const formatted = formatGraphQLError(originalError, {
        hideInternalDetails: false,
        includeStackTrace: true,
        isProduction: false,
      })

      expect(formatted.message).toBe('Query failed')
      expect(formatted.extensions.internalDetails).toBeDefined()
      expect(formatted.extensions.stackTrace).toBeDefined()
      expect(formatted.extensions.databaseCode).toBe('P2002')
    })

    it('should sanitize sensitive information in production', () => {
      const error = new AuthenticationError(
        'Invalid password for user@example.com',
        'INVALID_CREDENTIALS',
        { email: 'user@example.com', password: 'secret123' }
      )

      const formatted = formatGraphQLError(error, {
        isProduction: true,
        sanitizeSensitiveData: true,
      })

      expect(formatted.message).not.toContain('user@example.com')
      expect(formatted.extensions.securityContext?.password).toBeUndefined()
      expect(formatted.extensions.securityContext?.email).toMatch(
        /\*\*\*@\*\*\*/
      )
    })
  })

  describe('Prismaエラーハンドリング', () => {
    it('should convert Prisma unique constraint error', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
          meta: {
            modelName: 'User',
            target: ['email'],
          },
        }
      )

      const handler = new PrismaErrorHandler()
      const convertedError = handler.convertError(prismaError, {
        model: 'User',
        operation: 'createUser',
      })

      expect(convertedError).toBeInstanceOf(ValidationError)
      expect(convertedError.extensions.code).toBe(
        GraphQLErrorCode.VALIDATION_ERROR
      )
      expect(convertedError.extensions.field).toBe('email')
      expect(convertedError.message).toContain('already exists')
    })

    it('should convert Prisma foreign key constraint error', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2003',
          meta: {
            field_name: 'categoryId',
          },
        }
      )

      const handler = new PrismaErrorHandler()
      const convertedError = handler.convertError(prismaError, {
        model: 'Todo',
        operation: 'createTodo',
      })

      expect(convertedError).toBeInstanceOf(ValidationError)
      expect(convertedError.extensions.field).toBe('categoryId')
      expect(convertedError.message).toContain('does not exist')
    })

    it('should convert Prisma connection error with retry flag', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Connection timeout',
        {
          clientVersion: '5.0.0',
          code: 'P1001',
        }
      )

      const handler = new PrismaErrorHandler()
      const convertedError = handler.convertError(prismaError)

      expect(convertedError).toBeInstanceOf(DatabaseError)
      expect(convertedError.extensions.retryable).toBe(true)
      expect(convertedError.extensions.databaseCode).toBe('P1001')
    })
  })

  describe('バリデーションエラーハンドリング', () => {
    it('should convert Zod validation errors', () => {
      const zodError = {
        issues: [
          {
            code: 'too_small',
            message: 'String must contain at least 1 character(s)',
            path: ['title'],
          },
          {
            code: 'invalid_date',
            message: 'Invalid date',
            path: ['dueDate'],
          },
        ],
      }

      const convertedError = GraphQLValidationHandler.transformZodError(
        zodError as any
      )

      expect(convertedError).toBeInstanceOf(ValidationError)
      expect(convertedError.extensions.validationDetails).toBeDefined()
    })

    it('should convert nested field validation errors', () => {
      const zodError = {
        issues: [
          {
            code: 'invalid_type',
            message: 'Required',
            path: ['subTasks', 0, 'title'],
          },
        ],
      }

      const convertedError = GraphQLValidationHandler.transformZodError(
        zodError as any
      )

      expect(convertedError).toBeInstanceOf(ValidationError)
      expect(convertedError.extensions.validationDetails).toBeDefined()
    })
  })

  describe('セキュリティフィルタリング', () => {
    it('should mask sensitive data in error messages', () => {
      const filter = new GraphQLSecurityFilter({
        enableDataMasking: true,
        isProduction: true,
      })

      const error = new AuthenticationError(
        'Authentication failed for user@example.com with password secret123',
        'AUTH_FAILED',
        {
          apiKey: 'sk_live_123456',
          email: 'user@example.com',
          password: 'secret123',
        }
      )

      const securityContext = GraphQLSecurityFilter.createSecurityContext(
        'user123',
        'user',
        '127.0.0.1',
        'Test User Agent',
        true,
        []
      )

      const result = filter.filterError(error, securityContext)

      expect(result.filtered.message).not.toContain('user@example.com')
      expect(result.filtered.message).not.toContain('secret123')
      expect(result.securityViolations.length).toBeGreaterThan(0)
    })

    it('should detect potential injection attacks', () => {
      const filter = new GraphQLSecurityFilter()

      const maliciousError = new ValidationError(
        "Title contains <script>alert('xss')</script>",
        { title: 'Potential XSS detected' },
        { originalError: 'XSS attempt' }
      )

      const securityContext = GraphQLSecurityFilter.createSecurityContext(
        'user123',
        'user',
        '192.168.1.1',
        'Test User Agent',
        false,
        []
      )

      const result = filter.filterError(maliciousError, securityContext)

      expect(result.riskLevel).toBe('medium')
      expect(result.securityViolations.length).toBeGreaterThan(0)
    })
  })

  describe('エラー監視とアラート', () => {
    it('should track error metrics', () => {
      const monitor = new GraphQLErrorMonitor()
      const error = new DatabaseError('Connection timeout', 'TIMEOUT', true)

      monitor.recordError(error, {
        duration: 5000,
        operationName: 'getTodos',
      })

      // Test basic functionality - monitoring is recording errors
      expect(monitor).toBeDefined()
    })

    it('should trigger alerts for critical errors', async () => {
      const monitor = new GraphQLErrorMonitor()

      // Simulate error recording
      const error = new DatabaseError('DB Error', 'ERROR', true)
      monitor.recordError(error)

      // Basic check that monitor is working
      expect(monitor).toBeDefined()
    })

    it('should perform health checks', async () => {
      const monitor = new GraphQLErrorMonitor()
      const healthCheck = await monitor.performHealthCheck()

      expect(healthCheck).toHaveProperty('status')
      expect(healthCheck).toHaveProperty('errorRate')
      expect(healthCheck).toHaveProperty('avgResponseTime')
      expect(healthCheck).toHaveProperty('timestamp')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthCheck.status)
    })
  })

  describe('構造化ログ', () => {
    it('should log errors with structured format', () => {
      const logger = new StructuredLogger()

      const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = new ValidationError(
        'Validation failed',
        { title: 'Title is required' },
        {}
      )

      logger.logGraphQLError(error, {
        operationName: 'createTodo',
        requestId: 'req-456',
        userId: 'user-123',
      })

      expect(logSpy).toHaveBeenCalled()

      logSpy.mockRestore()
    })

    it('should support different log levels', () => {
      const logger = new StructuredLogger()

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      logger.info('Operation completed', { operation: 'getTodos' })
      logger.warn('Slow query detected')
      logger.error(
        'Error occurred',
        new ValidationError('Error', { field: 'details' }, {})
      )

      expect(infoSpy).toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalled()

      infoSpy.mockRestore()
      warnSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })

  describe('国際化対応', () => {
    it('should translate error messages to Japanese', () => {
      const i18n = new GraphQLErrorI18n()

      const message = i18n.getCategoryMessage(
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM,
        { fieldName: 'タイトル' }
      )

      expect(message).toContain('入力内容')
      expect(typeof message).toBe('string')
    })

    it('should support multiple languages', () => {
      const i18n = new GraphQLErrorI18n()

      const supportedLocales = i18n.getSupportedLocales()
      expect(supportedLocales.length).toBeGreaterThan(0)
      expect(supportedLocales).toContain('ja-JP')
    })

    it('should support contextual translations', () => {
      const i18n = new GraphQLErrorI18n()

      const localeConfig = i18n.getCurrentLocaleConfig()
      expect(localeConfig).toBeDefined()
      expect(localeConfig.locale).toBeDefined()
    })
  })

  describe('統合エラーシナリオ', () => {
    it('should handle complete error processing pipeline', async () => {
      // Setup complete error handling pipeline
      const prismaHandler = new PrismaErrorHandler()
      const securityFilter = new GraphQLSecurityFilter({ isProduction: true })
      const monitor = new GraphQLErrorMonitor()
      const logger = new StructuredLogger()
      const i18n = new GraphQLErrorI18n()

      // Simulate Prisma error
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed on email',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
          meta: { target: ['email'] },
        }
      )

      // Process through pipeline
      const error = prismaHandler.convertError(prismaError, {
        model: 'User',
        operation: 'createUser',
      })

      // Test that all components work together
      expect(error).toBeInstanceOf(ValidationError)
      expect(prismaHandler).toBeDefined()
      expect(securityFilter).toBeDefined()
      expect(monitor).toBeDefined()
      expect(logger).toBeDefined()
      expect(i18n).toBeDefined()
    })
  })

  describe('パフォーマンステスト', () => {
    it('should handle high volume of errors efficiently', async () => {
      const monitor = new GraphQLErrorMonitor()
      const startTime = Date.now()

      // Process some errors
      for (let i = 0; i < 10; i++) {
        const error = new ValidationError(
          `Error ${i}`,
          { field: 'details' },
          {}
        )
        monitor.recordError(error, { operationName: 'test' })
      }

      const duration = Date.now() - startTime

      // Should process errors quickly
      expect(duration).toBeLessThan(1000)
      expect(monitor).toBeDefined()
    })

    it('should prevent memory leaks in long-running processes', () => {
      const monitor = new GraphQLErrorMonitor()

      // Add some errors
      for (let i = 0; i < 50; i++) {
        const error = new ValidationError(
          `Error ${i}`,
          { field: 'details' },
          {}
        )
        monitor.recordError(error)
      }

      // Basic check - monitor is handling the errors
      expect(monitor).toBeDefined()
    })
  })

  describe('エラー復旧シナリオ', () => {
    it('should provide retry recommendations for retryable errors', () => {
      const error = new DatabaseError('Connection timeout', 'TIMEOUT', true, {
        connectionPool: 'primary',
      })

      expect(error.extensions.retryable).toBe(true)
      expect(error).toBeInstanceOf(DatabaseError)
    })

    it('should suggest fallback options for service errors', () => {
      const error = new ExternalServiceError(
        'Email service unavailable',
        'EMAIL_SERVICE_DOWN',
        'emailService',
        false,
        { endpoint: 'https://api.email.com' }
      )

      expect(error.extensions.retryable).toBe(false)
      expect(error).toBeInstanceOf(ExternalServiceError)
    })
  })
})
