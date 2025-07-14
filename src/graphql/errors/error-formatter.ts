/**
 * GraphQLエラーフォーマッター
 *
 * クライアントに返すエラーレスポンスを適切にフォーマットします。
 * セキュリティ、国際化、開発環境でのデバッグ支援を考慮します。
 */
import { GraphQLError } from 'graphql'

import {
  BaseGraphQLError,
  createGraphQLErrorFromError,
  createUserFriendlyMessage,
  ErrorCategory,
  ErrorSeverity,
  sanitizeErrorForLogging,
} from './custom-errors'
import { getLogger } from './logger'

import type { StructuredLogger } from './logger'
import type { GraphQLFormattedError } from 'graphql'

/**
 * フォーマッター設定の型定義
 */
export interface ErrorFormatterConfig {
  /** デバッグモード */
  debugMode?: boolean
  /** 本番環境フラグ */
  isProduction?: boolean
  /** ロガーインスタンス */
  logger?: StructuredLogger
  /** セキュリティ設定 */
  security?: SecurityConfig
}

/**
 * フォーマット済みエラーの型定義
 */
export interface FormattedError {
  extensions?: Record<string, unknown>
  locations?: ReadonlyArray<{ column: number; line: number }>
  message: string
  path?: ReadonlyArray<number | string>
}

/**
 * セキュリティ設定の型定義
 */
export interface SecurityConfig {
  /** 許可されたエラー拡張フィールド */
  allowedExtensions?: string[]
  /** 内部エラーの詳細を隠すか */
  hideInternalDetails?: boolean
  /** 機密データのマスキングを有効にするか */
  maskSensitiveData?: boolean
}

/**
 * GraphQLエラーフォーマッター
 */
export class GraphQLErrorFormatter {
  private readonly config: Required<Omit<ErrorFormatterConfig, 'security'>> & {
    security?: SecurityConfig
  }
  private readonly logger: StructuredLogger

  constructor(config: ErrorFormatterConfig = {}) {
    this.config = {
      debugMode: config.debugMode ?? process.env.NODE_ENV === 'development',
      isProduction:
        config.isProduction ?? process.env.NODE_ENV === 'production',
      logger: config.logger ?? getLogger(),
      security: config.security,
    }

    this.logger = this.config.logger
  }

  /**
   * エラーをクライアント向けにフォーマット
   *
   * テスト用シンプルインターフェース: formatError({ message }, error)
   * Apollo Server用インターフェース: formatError(formattedError, error)
   */
  formatError(
    formattedError: GraphQLFormattedError | { message: string },
    error: unknown
  ): FormattedError | GraphQLFormattedError {
    try {
      // BaseGraphQLErrorかどうか確認
      const graphqlError =
        error instanceof BaseGraphQLError
          ? error
          : this.convertToBaseGraphQLError(
              error,
              formattedError as GraphQLFormattedError
            )

      // ログ出力
      this.logError(graphqlError)

      // クライアント向けのエラーレスポンス生成
      return this.createClientResponse(graphqlError, formattedError)
    } catch (formatterError) {
      // フォーマッター自体でエラーが発生した場合の安全な処理
      this.logger.error(
        'Error formatter failed',
        formatterError instanceof Error
          ? formatterError
          : new Error(String(formatterError)),
        {
          originalError: error,
        }
      )

      return this.createFallbackResponse(formattedError)
    }
  }

  /**
   * エラーをBaseGraphQLErrorに変換
   */
  private convertToBaseGraphQLError(
    error: unknown,
    formattedError: GraphQLFormattedError | { message: string }
  ): BaseGraphQLError {
    // 既にBaseGraphQLErrorの場合
    if (error instanceof BaseGraphQLError) {
      return error
    }

    // GraphQLErrorの場合
    if (error instanceof GraphQLError) {
      return createGraphQLErrorFromError(error)
    }

    // 一般的なErrorの場合
    if (error instanceof Error) {
      return createGraphQLErrorFromError(error)
    }

    // その他の場合
    return createGraphQLErrorFromError(
      new Error(formattedError.message || 'Unknown error')
    )
  }

  /**
   * クライアント向けのエラーレスポンス生成
   */
  private createClientResponse(
    error: BaseGraphQLError,
    originalFormatted: GraphQLFormattedError | { message: string }
  ): FormattedError {
    // ユーザーフレンドリーなメッセージを生成
    const userMessage = this.config.isProduction
      ? createUserFriendlyMessage(error)
      : error.message

    // 基本的なレスポンス構造
    const response: FormattedError = {
      extensions: {
        code: error.extensions.code,
        requestId: error.extensions.requestId,
        severity: error.severity,
        timestamp: error.timestamp,
      },
      message: userMessage,
    }

    // GraphQLFormattedErrorの場合はlocationやpathも含める
    if ('locations' in originalFormatted || 'path' in originalFormatted) {
      const gqlFormatted = originalFormatted
      if (gqlFormatted.locations) {
        response.locations = gqlFormatted.locations
      }
      if (gqlFormatted.path) {
        response.path = gqlFormatted.path
      }
    }

    // デバッグモードでの詳細情報
    if (this.config.debugMode) {
      response.extensions = {
        ...response.extensions,
        category: error.category,
        isOperational: error.isOperational,
        userId: error.userId,
      }
    }

    // スタックトレースの追加（開発環境）
    if (this.config.debugMode && error.stack) {
      response.extensions = {
        ...response.extensions,
        stackTrace: error.stack,
      }
    }

    // セキュリティフィルタリング（内部エラーの詳細を隠す）
    if (
      this.config.isProduction &&
      (error.severity === ErrorSeverity.CRITICAL ||
        error.category === ErrorCategory.SYSTEM)
    ) {
      response.message =
        'システムエラーが発生しました。管理者にお問い合わせください。'
      response.extensions = {
        code: error.extensions.code,
        requestId: error.extensions.requestId,
        timestamp: error.timestamp,
      }
    }

    // セキュリティ設定に基づく拡張フィールドのフィルタリング
    if (this.config.security?.allowedExtensions) {
      const filteredExtensions: Record<string, unknown> = {}
      for (const allowedField of this.config.security.allowedExtensions) {
        if (response.extensions && allowedField in response.extensions) {
          // eslint-disable-next-line security/detect-object-injection
          filteredExtensions[allowedField] = response.extensions[allowedField]
        }
      }
      response.extensions = filteredExtensions
    }

    return response
  }

  /**
   * フォーマッター自体でエラーが発生した場合のフォールバック
   */
  private createFallbackResponse(
    originalFormatted: GraphQLFormattedError | { message: string }
  ): FormattedError {
    return {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
      },
      message: this.config.isProduction
        ? 'システムエラーが発生しました'
        : originalFormatted.message || 'Internal Server Error',
    }
  }

  /**
   * エラーログを出力
   */
  private logError(error: BaseGraphQLError): void {
    const logData = sanitizeErrorForLogging(error)

    const logContext = {
      ...logData,
      environment: process.env.NODE_ENV,
      requestId: error.requestId,
      severity: error.severity,
    }

    // 本番環境では機密情報をさらにフィルタリング
    if (this.config.isProduction) {
      delete logContext.error.stack
      // 本番環境ではユーザーIDも部分的にマスク
      if (logContext.error.userId) {
        logContext.error.userId = this.maskUserId(logContext.error.userId)
      }
    }

    // ログレベルに応じて出力
    switch (error.severity) {
      case ErrorSeverity.CRITICAL: {
        this.logger.error(`GraphQL Error: ${error.message}`, error, logContext)
        break
      }
      case ErrorSeverity.HIGH: {
        this.logger.error(`GraphQL Error: ${error.message}`, error, logContext)
        break
      }
      case ErrorSeverity.LOW: {
        this.logger.info(`GraphQL Error: ${error.message}`, logContext)
        break
      }
      case ErrorSeverity.MEDIUM: {
        this.logger.warn(
          `GraphQL Error: ${error.message}`,
          undefined,
          logContext
        )
        break
      }
      default: {
        this.logger.warn(
          `GraphQL Error: ${error.message}`,
          undefined,
          logContext
        )
      }
    }
  }

  /**
   * ユーザーIDをマスク（本番環境用）
   */
  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '****'
    }
    return `${userId.slice(0, 2)}****${userId.slice(-2)}`
  }
}

/**
 * デフォルトエラーフォーマッターインスタンス
 */
let defaultFormatter: GraphQLErrorFormatter | undefined = undefined

/**
 * 開発用の設定済みエラーフォーマッター
 */
export function createDevelopmentErrorFormatter(
  logger?: StructuredLogger
): GraphQLErrorFormatter {
  return new GraphQLErrorFormatter({
    debugMode: true,
    isProduction: false,
    logger,
  })
}

/**
 * プロダクション用の設定済みエラーフォーマッター
 */
export function createProductionErrorFormatter(
  logger?: StructuredLogger
): GraphQLErrorFormatter {
  return new GraphQLErrorFormatter({
    debugMode: false,
    isProduction: true,
    logger,
  })
}

/**
 * デフォルトエラーフォーマッターを取得
 */
export function getErrorFormatter(): GraphQLErrorFormatter {
  defaultFormatter ??= new GraphQLErrorFormatter()
  return defaultFormatter
}

/**
 * エラーフォーマッターを初期化
 */
export function initializeErrorFormatter(
  config?: ErrorFormatterConfig
): GraphQLErrorFormatter {
  defaultFormatter = new GraphQLErrorFormatter(config)
  return defaultFormatter
}
