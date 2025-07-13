/**
 * Apollo Server 4.x エラーフォーマッター
 *
 * プロダクション準備のための包括的なエラーフォーマット機能を提供します。
 * セキュリティ、ログ、監視、国際化を統合したエラーハンドリングシステムです。
 */
import { GraphQLError } from 'graphql'

import {
  BaseGraphQLError,
  createGraphQLErrorFromError,
  createUserFriendlyMessage,
  sanitizeErrorForLogging,
} from './custom-errors'
import { AllErrorCodes, getErrorCodeInfo } from './error-codes'

import type { ErrorMetrics } from './custom-errors'
import type { ErrorCode } from './error-codes'
import type { GraphQLFormattedError } from 'graphql'

/**
 * エラーフォーマッター設定
 */
export interface ErrorFormatterConfig {
  /** デバッグモード */
  debugMode?: boolean
  /** エラー詳細の出力 */
  includeErrorDetails?: boolean
  /** スタックトレース出力 */
  includeStackTrace?: boolean
  /** 本番環境フラグ */
  isProduction?: boolean
  /** 国際化ロケール */
  locale?: string
  /** ログ出力インスタンス */
  logger?: Logger
  /** メトリクス収集インスタンス */
  metricsCollector?: MetricsCollector
  /** セキュリティ設定 */
  security?: {
    /** 許可された拡張フィールド */
    allowedExtensions?: string[]
    /** 内部エラーの詳細を隠すか */
    hideInternalDetails?: boolean
    /** 機密情報をマスクするか */
    maskSensitiveData?: boolean
  }
}

/**
 * 構造化ログ出力用のロガー
 */
interface Logger {
  debug(message: string, data?: unknown): void
  error(message: string, data?: unknown): void
  fatal(message: string, data?: unknown): void
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
}

/**
 * メトリクス収集用のインターフェース
 */
interface MetricsCollector {
  incrementCounter(name: string, tags?: Record<string, string>): void
  recordError(metrics: ErrorMetrics): void
  recordHistogram(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void
}

/**
 * Apollo Server 4.x用のエラーフォーマッター
 */
export class GraphQLErrorFormatter {
  private readonly config: Required<ErrorFormatterConfig>
  private readonly requestId: string

  constructor(config: ErrorFormatterConfig = {}, requestId?: string) {
    const isProduction =
      config.isProduction ?? process.env.NODE_ENV === 'production'

    this.config = {
      debugMode: config.debugMode ?? process.env.NODE_ENV === 'development',
      includeErrorDetails:
        config.includeErrorDetails ?? process.env.NODE_ENV === 'development',
      includeStackTrace:
        config.includeStackTrace ?? process.env.NODE_ENV === 'development',
      isProduction,
      locale: config.locale ?? 'ja',
      logger: config.logger ?? this.createDefaultLogger(),
      metricsCollector:
        config.metricsCollector ?? this.createDefaultMetricsCollector(),
      security: {
        allowedExtensions: config.security?.allowedExtensions ?? [
          'code',
          'category',
          'severity',
          'timestamp',
          'retryable',
        ],
        hideInternalDetails:
          config.security?.hideInternalDetails ?? isProduction,
        maskSensitiveData: config.security?.maskSensitiveData ?? true,
      },
    }
    this.requestId = requestId ?? this.generateRequestId()
  }

  /**
   * GraphQLエラーをフォーマットする
   * Apollo Server 4.xのformatError関数で使用
   */
  public formatError = (
    formattedError: GraphQLFormattedError,
    error: unknown
  ): GraphQLFormattedError => {
    try {
      // BaseGraphQLErrorに変換
      const graphqlError = this.convertToBaseGraphQLError(error, formattedError)

      // ログ出力
      this.logError(graphqlError)

      // メトリクス収集
      this.collectMetrics(graphqlError)

      // クライアント向けのエラーレスポンス生成
      return this.createClientResponse(graphqlError, formattedError)
    } catch (formatterError) {
      // フォーマッター自体でエラーが発生した場合の安全な処理
      this.config.logger.error('Error formatter failed', {
        formatterError,
        originalError: error,
        requestId: this.requestId,
      })

      return this.createFallbackResponse(formattedError)
    }
  }

  /**
   * エラーメトリクスを収集
   */
  private collectMetrics(error: BaseGraphQLError): void {
    const errorInfo = getErrorCodeInfo(error.extensions.code as ErrorCode)

    // エラーメトリクス記録
    const metrics: ErrorMetrics = {
      category: error.category,
      count: 1,
      errorCode: error.extensions.code as string,
      requestId: this.requestId,
      severity: error.severity,
      timestamp: error.timestamp,
      userId: error.userId,
    }

    this.config.metricsCollector.recordError(metrics)

    // カウンター増加
    this.config.metricsCollector.incrementCounter('graphql_errors_total', {
      category: error.category,
      code: error.extensions.code as string,
      severity: error.severity,
    })

    // HTTPステータス別カウンター
    this.config.metricsCollector.incrementCounter('graphql_errors_by_status', {
      status: errorInfo.httpStatus.toString(),
    })
  }

  /**
   * エラーをBaseGraphQLErrorに変換
   */
  private convertToBaseGraphQLError(
    error: unknown,
    formattedError: GraphQLFormattedError
  ): BaseGraphQLError {
    // 既にBaseGraphQLErrorの場合
    if (error instanceof BaseGraphQLError) {
      return error
    }

    // GraphQLErrorの場合
    if (error instanceof GraphQLError) {
      return createGraphQLErrorFromError(
        error,
        formattedError.extensions?.code as ErrorCode,
        undefined,
        undefined,
        {
          requestId: this.requestId,
          ...formattedError.extensions,
        }
      )
    }

    // 一般的なErrorの場合
    if (error instanceof Error) {
      return createGraphQLErrorFromError(
        error,
        undefined,
        undefined,
        undefined,
        {
          requestId: this.requestId,
        }
      )
    }

    // その他の場合
    return createGraphQLErrorFromError(
      new Error(formattedError.message || 'Unknown error'),
      AllErrorCodes.INTERNAL_SERVER_ERROR,
      undefined,
      undefined,
      {
        originalError: error,
        requestId: this.requestId,
      }
    )
  }

  /**
   * クライアント向けのエラーレスポンス生成
   */
  private createClientResponse(
    error: BaseGraphQLError,
    originalFormatted: GraphQLFormattedError
  ): GraphQLFormattedError {
    const errorInfo = getErrorCodeInfo(error.extensions.code as ErrorCode)

    // ユーザーフレンドリーなメッセージを生成
    const userMessage = this.config.isProduction
      ? createUserFriendlyMessage(error)
      : error.message

    // 基本的なレスポンス構造
    const response: GraphQLFormattedError = {
      extensions: {
        category: error.category,
        code: error.extensions.code,
        requestId: this.requestId,
        retryable: errorInfo.retryable,
        severity: error.severity,
        timestamp: error.timestamp,
      },
      locations: originalFormatted.locations,
      message: userMessage,
      path: originalFormatted.path,
    }

    // 拡張フィールドを組み立て
    let extensions = { ...response.extensions }

    // 開発環境または非本番環境での追加情報
    if (this.config.includeErrorDetails) {
      extensions = {
        ...extensions,
        httpStatus: errorInfo.httpStatus,
        originalMessage: error.message,
        userMessage: errorInfo.userMessage,
      }
    }

    // デバッグモードでの詳細情報
    if (this.config.debugMode) {
      extensions = {
        ...extensions,
        errorId: error.requestId,
        isOperational: error.isOperational,
        userId: error.userId,
      }
    }

    // スタックトレースの追加
    if (this.config.includeStackTrace && error.stack) {
      extensions = {
        ...extensions,
        stackTrace: error.stack,
      }
    }

    // セキュリティフィルタリング
    let finalMessage = response.message
    if (
      this.config.security.hideInternalDetails &&
      (error.severity as string) === 'CRITICAL'
    ) {
      finalMessage = '内部エラーが発生しました。管理者にお問い合わせください。'
      extensions = {
        code: error.extensions.code,
        requestId: this.requestId,
        timestamp: error.timestamp,
      }
    }

    // 許可された拡張フィールドのみを残す
    const filteredExtensions = this.filterAllowedExtensions(extensions)

    // 新しいレスポンスオブジェクトを作成
    return {
      ...response,
      extensions: filteredExtensions,
      message: finalMessage,
    }
  }

  /**
   * デフォルトロガーを作成
   */
  private createDefaultLogger(): Logger {
    return {
      debug: (message: string, data?: unknown) => console.debug(message, data),
      error: (message: string, data?: unknown) => console.error(message, data),
      fatal: (message: string, data?: unknown) =>
        console.error('[FATAL]', message, data),
      info: (message: string, data?: unknown) => console.info(message, data),
      warn: (message: string, data?: unknown) => console.warn(message, data),
    }
  }

  /**
   * デフォルトメトリクス収集器を作成
   */
  private createDefaultMetricsCollector(): MetricsCollector {
    return {
      incrementCounter: (_name: string, _tags?: Record<string, string>) => {
        // デフォルトは何もしない
      },
      recordError: (_metrics: ErrorMetrics) => {
        // デフォルトは何もしない（実際の実装では外部メトリクスサービスに送信）
      },
      recordHistogram: (
        _name: string,
        _value: number,
        _tags?: Record<string, string>
      ) => {
        // デフォルトは何もしない
      },
    }
  }

  /**
   * フォーマッター自体でエラーが発生した場合のフォールバック
   */
  private createFallbackResponse(
    originalFormatted: GraphQLFormattedError
  ): GraphQLFormattedError {
    return {
      extensions: {
        code: AllErrorCodes.INTERNAL_SERVER_ERROR,
        requestId: this.requestId,
        timestamp: new Date().toISOString(),
      },
      locations: originalFormatted.locations,
      message: this.config.isProduction
        ? 'システムエラーが発生しました'
        : originalFormatted.message || 'Internal Server Error',
      path: originalFormatted.path,
    }
  }

  /**
   * 許可された拡張フィールドのみをフィルタリング
   */
  private filterAllowedExtensions(extensions: Record<string, unknown>): Record<string, unknown> {
    if (!this.config.security.maskSensitiveData || !extensions) {
      return extensions
    }

    const filtered: Record<string, unknown> = {}
    const allowed = this.config.security.allowedExtensions

    if (allowed && Array.isArray(allowed)) {
      for (const key of allowed) {
        if (Object.hasOwnProperty.call(extensions, key)) {
          filtered[key] = extensions[key]
        }
      }
    }

    return filtered
  }

  /**
   * リクエストIDを生成
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  /**
   * クライアントIPを取得（コンテキストから）
   */
  private getClientIp(): string | undefined {
    // TODO: GraphQLコンテキストからIPアドレスを取得
    return undefined
  }

  /**
   * ユーザーエージェントを取得（コンテキストから）
   */
  private getUserAgent(): string | undefined {
    // TODO: GraphQLコンテキストからUser-Agentを取得
    return undefined
  }

  /**
   * エラーログを出力
   */
  private logError(error: BaseGraphQLError): void {
    const logData = sanitizeErrorForLogging(error)
    const errorInfo = getErrorCodeInfo(error.extensions.code as ErrorCode)

    const logContext = {
      ...logData,
      ip: this.getClientIp(),
      requestId: this.requestId,
      userAgent: this.getUserAgent(),
    }

    // ログレベルに応じて出力
    switch (errorInfo.logLevel) {
      case 'debug': {
        this.config.logger.debug(`GraphQL Error: ${error.message}`, logContext)
        break
      }
      case 'error': {
        this.config.logger.error(`GraphQL Error: ${error.message}`, logContext)
        break
      }
      case 'fatal': {
        this.config.logger.fatal(`GraphQL Error: ${error.message}`, logContext)
        break
      }
      case 'info': {
        this.config.logger.info(`GraphQL Error: ${error.message}`, logContext)
        break
      }
      case 'warn': {
        this.config.logger.warn(`GraphQL Error: ${error.message}`, logContext)
        break
      }
    }
  }
}

/**
 * 開発用の設定済みエラーフォーマッター
 */
export function createDevelopmentErrorFormatter(
  logger?: Logger
): (
  formattedError: GraphQLFormattedError,
  error: unknown
) => GraphQLFormattedError {
  return createGraphQLErrorFormatter({
    debugMode: true,
    includeErrorDetails: true,
    includeStackTrace: true,
    isProduction: false,
    logger,
    security: {
      hideInternalDetails: false,
      maskSensitiveData: false,
    },
  })
}

/**
 * Apollo Server 4.x設定用のファクトリー関数
 */
export function createGraphQLErrorFormatter(
  config?: ErrorFormatterConfig
): (
  formattedError: GraphQLFormattedError,
  error: unknown
) => GraphQLFormattedError {
  return (formattedError: GraphQLFormattedError, error: unknown) => {
    const formatter = new GraphQLErrorFormatter(config)
    return formatter.formatError(formattedError, error)
  }
}

/**
 * プロダクション用の設定済みエラーフォーマッター
 */
export function createProductionErrorFormatter(
  logger?: Logger,
  metricsCollector?: MetricsCollector
): (
  formattedError: GraphQLFormattedError,
  error: unknown
) => GraphQLFormattedError {
  return createGraphQLErrorFormatter({
    debugMode: false,
    includeErrorDetails: false,
    includeStackTrace: false,
    isProduction: true,
    logger,
    metricsCollector,
    security: {
      allowedExtensions: ['code', 'timestamp', 'requestId', 'retryable'],
      hideInternalDetails: true,
      maskSensitiveData: true,
    },
  })
}
