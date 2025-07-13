/**
 * GraphQLカスタムエラークラス体系
 *
 * プロダクション準備のための包括的なエラーハンドリングシステムを提供します。
 * Apollo Server 4.xのエラーシステムと統合し、型安全で構造化されたエラー処理を実現します。
 */
import { GraphQLError } from 'graphql'

import type { GraphQLErrorExtensions } from 'graphql'

/**
 * エラー分類の列挙型
 */
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  SYSTEM = 'SYSTEM',
  VALIDATION = 'VALIDATION',
}

/**
 * エラー重要度の列挙型
 */
export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
}

/**
 * エラーメトリクス用データの型定義
 */
export interface ErrorMetrics {
  category: ErrorCategory
  count: number
  errorCode: string
  requestId?: string
  severity: ErrorSeverity
  timestamp: string
  userId?: string
}

/**
 * ログ用エラーデータの型定義
 */
export interface LogErrorData {
  context: {
    graphqlPath?: readonly (number | string)[]
    positions?: readonly number[]
    source?: string
  }
  error: StructuredError
}

/**
 * 構造化エラー情報の型定義
 */
export interface StructuredError {
  category: ErrorCategory
  code: string
  isOperational: boolean
  message: string
  name: string
  requestId?: string
  severity: ErrorSeverity
  stack?: string
  timestamp: string
  userId?: string
}

/**
 * 基底カスタムエラークラス
 */
export abstract class BaseGraphQLError extends GraphQLError {
  public readonly category: ErrorCategory
  public readonly isOperational: boolean
  public readonly requestId?: string
  public readonly severity: ErrorSeverity
  public readonly timestamp: string
  public readonly userId?: string

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    extensions?: GraphQLErrorExtensions,
    isOperational = true
  ) {
    const enhancedExtensions: GraphQLErrorExtensions = {
      category,
      code,
      isOperational,
      severity,
      timestamp: new Date().toISOString(),
      ...extensions,
    }

    super(message, {
      extensions: enhancedExtensions,
    })

    this.category = category
    this.severity = severity
    this.isOperational = isOperational
    this.timestamp = enhancedExtensions.timestamp as string
    this.requestId = extensions?.requestId as string
    this.userId = extensions?.userId as string

    // エラー名を設定
    this.name = this.constructor.name

    // スタックトレースのキャプチャ
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * ログ用の情報を返す
   */
  public toLogData(): LogErrorData {
    return {
      context: {
        graphqlPath: this.path,
        positions: this.positions,
        source: this.source?.body,
      },
      error: this.toStructuredError(),
    }
  }

  /**
   * エラーの詳細情報を構造化された形式で返す
   */
  public toStructuredError(): StructuredError {
    return {
      category: this.category,
      code: this.extensions.code as string,
      isOperational: this.isOperational,
      message: this.message,
      name: this.name,
      requestId: this.requestId,
      severity: this.severity,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
      timestamp: this.timestamp,
      userId: this.userId,
    }
  }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends BaseGraphQLError {
  constructor(message = '認証が必要です', extensions?: GraphQLErrorExtensions) {
    super(
      message,
      'UNAUTHENTICATED',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      extensions
    )
  }
}

/**
 * 認可エラー
 */
export class AuthorizationError extends BaseGraphQLError {
  constructor(
    message = 'このリソースにアクセスする権限がありません',
    extensions?: GraphQLErrorExtensions
  ) {
    super(
      message,
      'FORBIDDEN',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      extensions
    )
  }
}

/**
 * ビジネスロジックエラー
 */
export class BusinessLogicError extends BaseGraphQLError {
  constructor(
    message: string,
    businessRule?: string,
    extensions?: GraphQLErrorExtensions
  ) {
    super(
      message,
      'BUSINESS_LOGIC_ERROR',
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.LOW,
      {
        businessRule,
        ...extensions,
      }
    )
  }
}

/**
 * データベースエラー
 */
export class DatabaseError extends BaseGraphQLError {
  constructor(
    message: string,
    operation?: string,
    originalError?: Error,
    extensions?: GraphQLErrorExtensions
  ) {
    super(
      message,
      'DATABASE_ERROR',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      {
        operation,
        originalErrorMessage: originalError?.message,
        originalErrorName: originalError?.name,
        ...extensions,
      }
    )
  }
}

/**
 * DataLoaderエラー
 */
export class DataLoaderError extends BaseGraphQLError {
  constructor(
    loaderName: string,
    operation: string,
    originalError?: Error,
    extensions?: GraphQLErrorExtensions
  ) {
    super(
      `DataLoader ${loaderName} の ${operation} 処理中にエラーが発生しました`,
      'DATALOADER_ERROR',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      {
        loaderName,
        operation,
        originalErrorMessage: originalError?.message,
        originalErrorName: originalError?.name,
        ...extensions,
      }
    )
  }
}

/**
 * 外部サービスエラー
 */
export class ExternalServiceError extends BaseGraphQLError {
  constructor(
    serviceName: string,
    message: string,
    statusCode?: number,
    extensions?: GraphQLErrorExtensions
  ) {
    super(
      `${serviceName}サービスエラー: ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.MEDIUM,
      {
        serviceName,
        statusCode,
        ...extensions,
      }
    )
  }
}

/**
 * システム内部エラー
 */
export class InternalSystemError extends BaseGraphQLError {
  constructor(
    message = 'システム内部エラーが発生しました',
    originalError?: Error,
    extensions?: GraphQLErrorExtensions
  ) {
    super(
      message,
      'INTERNAL_SERVER_ERROR',
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      {
        originalErrorMessage: originalError?.message,
        originalErrorName: originalError?.name,
        ...extensions,
      },
      false // システムエラーは非運用エラーとして扱う
    )
  }
}

/**
 * レート制限エラー
 */
export class RateLimitError extends BaseGraphQLError {
  constructor(
    limit: number,
    windowMs: number,
    extensions?: GraphQLErrorExtensions
  ) {
    super(
      `レート制限に達しました。${windowMs / 1000}秒間に${limit}回のリクエストが上限です`,
      'RATE_LIMIT_EXCEEDED',
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.MEDIUM,
      {
        limit,
        retryAfter: Math.ceil(windowMs / 1000),
        windowMs,
        ...extensions,
      }
    )
  }
}

/**
 * リソース未発見エラー
 */
export class ResourceNotFoundError extends BaseGraphQLError {
  constructor(
    resourceType: string,
    resourceId: string,
    extensions?: GraphQLErrorExtensions
  ) {
    super(
      `${resourceType} (ID: ${resourceId}) が見つかりません`,
      'RESOURCE_NOT_FOUND',
      ErrorCategory.RESOURCE_NOT_FOUND,
      ErrorSeverity.LOW,
      {
        resourceId,
        resourceType,
        ...extensions,
      }
    )
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends BaseGraphQLError {
  constructor(
    message: string,
    validationDetails?: Record<string, string[]>,
    extensions?: GraphQLErrorExtensions
  ) {
    super(
      message,
      'BAD_USER_INPUT',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      {
        validationDetails,
        ...extensions,
      }
    )
  }
}

/**
 * エラーファクトリー関数
 * 既存のErrorをBaseGraphQLErrorに変換
 */
export function createGraphQLErrorFromError(
  error: Error,
  _code = 'INTERNAL_SERVER_ERROR',
  _category = ErrorCategory.SYSTEM,
  _severity = ErrorSeverity.CRITICAL,
  extensions?: GraphQLErrorExtensions
): BaseGraphQLError {
  // 既にBaseGraphQLErrorの場合はそのまま返す
  if (error instanceof BaseGraphQLError) {
    return error
  }

  // Prismaエラーの場合は特別な処理
  if (isPrismaError(error)) {
    return createPrismaError(error, extensions)
  }

  // その他のエラーの場合はInternalSystemErrorとして扱う
  return new InternalSystemError(
    error.message || 'Unknown error occurred',
    error,
    extensions
  )
}

/**
 * エラーをユーザーフレンドリーなメッセージに変換
 */
export function createUserFriendlyMessage(error: BaseGraphQLError): string {
  switch (error.category) {
    case ErrorCategory.AUTHENTICATION: {
      return 'ログインが必要です。'
    }
    case ErrorCategory.AUTHORIZATION: {
      return 'このアクションを実行する権限がありません。'
    }
    case ErrorCategory.DATABASE:
    case ErrorCategory.EXTERNAL_SERVICE:
    case ErrorCategory.SYSTEM: {
      return 'システムエラーが発生しました。管理者にお問い合わせください。'
    }
    case ErrorCategory.RATE_LIMIT: {
      return 'リクエストが多すぎます。しばらく時間をおいてから再試行してください。'
    }
    case ErrorCategory.RESOURCE_NOT_FOUND: {
      return '指定されたデータが見つかりません。'
    }
    case ErrorCategory.VALIDATION: {
      return '入力内容に問題があります。'
    }
    default: {
      return 'エラーが発生しました。'
    }
  }
}

/**
 * エラーを安全にログ出力用にサニタイズ
 */
export function sanitizeErrorForLogging(error: BaseGraphQLError): LogErrorData {
  const logData = error.toLogData()

  // 本番環境では機密情報を除去
  if (process.env.NODE_ENV === 'production') {
    delete logData.error.stack

    // スタックトレースやソースコードを除去
    delete logData.context.source
  }

  return logData
}

/**
 * Prismaエラーを適切なGraphQLエラーに変換
 */
function createPrismaError(
  error: Error,
  extensions?: GraphQLErrorExtensions
): BaseGraphQLError {
  const prismaError = error as { code?: string; meta?: Record<string, unknown> }

  // Prismaエラーコードに基づく分類
  switch (prismaError.code) {
    case 'P1001': // Can't reach database server
    case 'P1002': {
      // Database server timeout
      return new DatabaseError(
        'データベース接続エラー',
        'connection',
        error,
        extensions
      )
    }
    case 'P2002': {
      // Unique constraint failed
      return new ValidationError(
        'データの重複エラー: 既に存在する値が指定されました',
        { uniqueConstraint: prismaError.meta?.target as string[] },
        extensions
      )
    }
    case 'P2003': {
      // Foreign key constraint failed
      return new ValidationError(
        '関連データの制約エラー: 参照先のデータが存在しません',
        { foreignKey: prismaError.meta?.field_name as string[] },
        extensions
      )
    }
    case 'P2025': {
      // Record not found
      return new ResourceNotFoundError(
        'レコード',
        (prismaError.meta?.cause as string) ?? 'unknown',
        extensions
      )
    }
    default: {
      return new DatabaseError(
        'データベース操作エラー',
        'unknown',
        error,
        extensions
      )
    }
  }
}

/**
 * Prismaエラーかどうかを判定
 */
function isPrismaError(error: Error): boolean {
  return (
    error.constructor.name.startsWith('Prisma') ||
    Boolean((error as { code?: string }).code?.startsWith('P'))
  )
}
