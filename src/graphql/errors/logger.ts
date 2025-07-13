/**
 * GraphQL構造化ログシステム
 *
 * プロダクション環境での包括的なログ機能を提供します。
 * セキュリティ、パフォーマンス、デバッグのための構造化ログ出力。
 */
import { BaseGraphQLError, ErrorSeverity } from './custom-errors'

/**
 * ログフォーマットの定義
 */
export enum LogFormat {
  JSON = 'json',
  STRUCTURED = 'structured',
  TEXT = 'text',
}

/**
 * ログレベルの定義
 */
export enum LogLevel {
  DEBUG = 'debug',
  ERROR = 'error',
  FATAL = 'fatal',
  INFO = 'info',
  WARN = 'warn',
}

/**
 * ログ出力先の定義
 */
export enum LogOutput {
  CLOUDWATCH = 'cloudwatch',
  CONSOLE = 'console',
  DATADOG = 'datadog',
  ELASTIC = 'elastic',
  FILE = 'file',
}

/**
 * ログエントリの型定義
 */
export interface LogEntry {
  category?: string
  duration?: number
  environment: string
  errorCode?: string
  extra?: Record<string, any>
  level: LogLevel
  message: string
  metadata?: Record<string, any>
  operationName?: string
  requestId?: string
  service: string
  severity?: string
  stack?: string
  timestamp: string
  userId?: string
  version: string
}

/**
 * ログ設定の型定義
 */
export interface LoggerConfig {
  cloudwatchOutput?: {
    logGroupName: string
    logStreamName: string
    region: string
  }
  datadogOutput?: {
    apiKey: string
    service: string
    source: string
  }
  elasticOutput?: {
    apiKey?: string
    endpoint: string
    index: string
  }
  enableConsoleColors: boolean
  enablePerformanceLogging: boolean
  environment: string
  fileOutput?: {
    maxFiles: number
    maxSize: string
    path: string
    rotationInterval: string
  }
  format: LogFormat
  includeStackTrace: boolean
  level: LogLevel
  maskSensitiveData: boolean
  outputs: LogOutput[]
  serviceName: string
  version: string
}

/**
 * パフォーマンスメトリクスの型定義
 */
export interface PerformanceMetrics {
  cacheHits?: number
  cacheMisses?: number
  complexity?: number
  databaseQueries?: number
  duration: number
  fieldCount?: number
  memoryUsage?: {
    after: number
    before: number
    peak: number
  }
  operationName: string
  queryDepth?: number
  resolverCount?: number
}

/**
 * セキュリティイベントの型定義
 */
export interface SecurityEvent {
  details: Record<string, any>
  ipAddress?: string
  requestId?: string
  severity: 'critical' | 'high' | 'low' | 'medium'
  type:
    | 'authentication_failure'
    | 'authorization_violation'
    | 'data_breach_attempt'
    | 'rate_limit_exceeded'
    | 'suspicious_activity'
  userAgent?: string
  userId?: string
}

/**
 * 構造化ログクラス
 */
export class StructuredLogger {
  private readonly config: LoggerConfig
  private readonly sensitiveFieldPatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /credential/i,
    /authorization/i,
    /authentication/i,
  ]

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      cloudwatchOutput: config.cloudwatchOutput,
      datadogOutput: config.datadogOutput,
      elasticOutput: config.elasticOutput,
      enableConsoleColors:
        config.enableConsoleColors ?? process.env.NODE_ENV === 'development',
      enablePerformanceLogging: config.enablePerformanceLogging ?? true,
      environment: config.environment ?? process.env.NODE_ENV ?? 'development',
      fileOutput: config.fileOutput,
      format: config.format ?? LogFormat.JSON,
      includeStackTrace:
        config.includeStackTrace ?? process.env.NODE_ENV === 'development',
      level: config.level ?? LogLevel.INFO,
      maskSensitiveData: config.maskSensitiveData ?? true,
      outputs: config.outputs ?? [LogOutput.CONSOLE],
      serviceName: config.serviceName ?? 'graphql-api',
      version: config.version ?? process.env.npm_package_version ?? '1.0.0',
    }
  }

  /**
   * デバッグログを出力
   */
  debug(
    message: string,
    error?: BaseGraphQLError | Error,
    extra?: Record<string, any>
  ): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, error, extra)
    }
  }

  /**
   * エラーログを出力
   */
  error(
    message: string,
    error?: BaseGraphQLError | Error,
    extra?: Record<string, any>
  ): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(LogLevel.ERROR, message, error, extra)
    }
  }

  /**
   * 致命的エラーログを出力
   */
  fatal(
    message: string,
    error?: BaseGraphQLError | Error,
    extra?: Record<string, any>
  ): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.log(LogLevel.FATAL, message, error, extra)
    }
  }

  /**
   * 情報ログを出力
   */
  info(message: string, extra?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, undefined, extra)
    }
  }

  /**
   * ビジネスイベントをログ
   */
  logBusinessEvent(
    eventType: string,
    message: string,
    context: {
      action?: string
      entityId?: string
      entityType?: string
      metadata?: Record<string, any>
      userId?: string
    }
  ): void {
    const entry: LogEntry = {
      category: 'business',
      environment: this.config.environment,
      level: LogLevel.INFO,
      message: `Business event: ${message}`,
      metadata: {
        action: context.action,
        businessData: this.maskSensitiveData(context.metadata || {}),
        entityId: context.entityId,
        entityType: context.entityType,
        eventType,
      },
      service: this.config.serviceName,
      timestamp: new Date().toISOString(),
      userId: context.userId,
      version: this.config.version,
    }

    this.outputLog(entry)
  }

  /**
   * GraphQLエラーを専用ログ
   */
  logGraphQLError(
    error: BaseGraphQLError,
    context?: {
      duration?: number
      operationName?: string
      requestId?: string
      userId?: string
    }
  ): void {
    const logEntry = this.createGraphQLErrorEntry(error, context)
    this.outputLog(logEntry)
  }

  /**
   * ヘルスチェック結果をログ
   */
  logHealthCheck(
    component: string,
    status: 'degraded' | 'healthy' | 'unhealthy',
    details: Record<string, any>
  ): void {
    const entry: LogEntry = {
      category: 'health_check',
      environment: this.config.environment,
      level:
        status === 'healthy'
          ? LogLevel.INFO
          : status === 'degraded'
            ? LogLevel.WARN
            : LogLevel.ERROR,
      message: `Health check: ${component} is ${status}`,
      metadata: {
        component,
        details: this.maskSensitiveData(details),
        status,
      },
      service: this.config.serviceName,
      timestamp: new Date().toISOString(),
      version: this.config.version,
    }

    this.outputLog(entry)
  }

  /**
   * メトリクス集計をログ
   */
  logMetricsSummary(
    timeWindow: string,
    metrics: {
      avgResponseTime: number
      errorRate: number
      p95ResponseTime: number
      p99ResponseTime: number
      topErrors: Array<{ code: string; count: number }>
      topOperations: Array<{ avgDuration: number; count: number; name: string }>
      totalErrors: number
      totalRequests: number
    }
  ): void {
    const entry: LogEntry = {
      category: 'metrics_summary',
      environment: this.config.environment,
      level: LogLevel.INFO,
      message: `Metrics summary for ${timeWindow}`,
      metadata: metrics,
      service: this.config.serviceName,
      timestamp: new Date().toISOString(),
      version: this.config.version,
    }

    this.outputLog(entry)
  }

  /**
   * パフォーマンスメトリクスをログ
   */
  logPerformance(metrics: PerformanceMetrics): void {
    if (!this.config.enablePerformanceLogging) return

    const entry: LogEntry = {
      category: 'performance',
      duration: metrics.duration,
      environment: this.config.environment,
      level: LogLevel.INFO,
      message: `GraphQL operation performance: ${metrics.operationName}`,
      metadata: {
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        complexity: metrics.complexity,
        databaseQueries: metrics.databaseQueries,
        fieldCount: metrics.fieldCount,
        memoryUsage: metrics.memoryUsage,
        queryDepth: metrics.queryDepth,
        resolverCount: metrics.resolverCount,
      },
      operationName: metrics.operationName,
      service: this.config.serviceName,
      timestamp: new Date().toISOString(),
      version: this.config.version,
    }

    // パフォーマンス閾値チェック
    if (metrics.duration > 5000) {
      entry.level = LogLevel.WARN
      entry.message = `Slow GraphQL operation detected: ${metrics.operationName}`
    } else if (metrics.duration > 10_000) {
      entry.level = LogLevel.ERROR
      entry.message = `Very slow GraphQL operation detected: ${metrics.operationName}`
    }

    this.outputLog(entry)
  }

  /**
   * リクエストトレースをログ
   */
  logRequestTrace(
    operationName: string,
    query: string,
    variables: any,
    context: {
      duration: number
      errorCount: number
      requestId: string
      userId?: string
    }
  ): void {
    const entry: LogEntry = {
      category: 'request_trace',
      duration: context.duration,
      environment: this.config.environment,
      level: context.errorCount > 0 ? LogLevel.WARN : LogLevel.INFO,
      message: `GraphQL request trace: ${operationName}`,
      metadata: {
        errorCount: context.errorCount,
        query: this.truncateQuery(query),
        variables: this.maskSensitiveData(variables),
      },
      operationName,
      requestId: context.requestId,
      service: this.config.serviceName,
      timestamp: new Date().toISOString(),
      userId: context.userId,
      version: this.config.version,
    }

    this.outputLog(entry)
  }

  /**
   * セキュリティイベントをログ
   */
  logSecurityEvent(event: SecurityEvent): void {
    const entry: LogEntry = {
      category: 'security',
      environment: this.config.environment,
      level: this.securitySeverityToLogLevel(event.severity),
      message: `Security event: ${event.type}`,
      metadata: {
        details: this.maskSensitiveData(event.details),
        ipAddress: event.ipAddress,
        securityEventType: event.type,
        userAgent: event.userAgent,
      },
      requestId: event.requestId,
      service: this.config.serviceName,
      severity: event.severity,
      timestamp: new Date().toISOString(),
      userId: event.userId,
      version: this.config.version,
    }

    // 重大なセキュリティイベントは即座にアラート
    if (event.severity === 'critical' || event.severity === 'high') {
      entry.extra = {
        alertRequired: true,
        escalationLevel: event.severity,
      }
    }

    this.outputLog(entry)
  }

  /**
   * 警告ログを出力
   */
  warn(
    message: string,
    error?: BaseGraphQLError | Error,
    extra?: Record<string, any>
  ): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, error, extra)
    }
  }

  /**
   * GraphQLエラー専用エントリを作成
   */
  private createGraphQLErrorEntry(
    error: BaseGraphQLError,
    context?: {
      duration?: number
      operationName?: string
      requestId?: string
      userId?: string
    }
  ): LogEntry {
    const entry: LogEntry = {
      category: error.category,
      duration: context?.duration,
      environment: this.config.environment,
      errorCode: error.extensions.code as string,
      level: this.severityToLogLevel(error.severity),
      message: `GraphQL Error: ${error.message}`,
      operationName:
        context?.operationName || (error.extensions.operationName as string),
      requestId: context?.requestId || (error.extensions.requestId as string),
      service: this.config.serviceName,
      severity: error.severity,
      timestamp: new Date().toISOString(),
      userId: context?.userId || (error.extensions.userId as string),
      version: this.config.version,
    }

    if (this.config.includeStackTrace) {
      entry.stack = error.stack
    }

    entry.metadata = {
      errorExtensions: this.maskSensitiveData(error.extensions),
      errorLocations: error.locations,
      errorPath: error.path,
    }

    return entry
  }

  /**
   * ログエントリを作成
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: BaseGraphQLError | Error,
    extra?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      environment: this.config.environment,
      level,
      message,
      service: this.config.serviceName,
      timestamp: new Date().toISOString(),
      version: this.config.version,
    }

    // エラー情報の追加
    if (error) {
      if (error instanceof BaseGraphQLError) {
        entry.errorCode = error.extensions.code as string
        entry.category = error.category
        entry.severity = error.severity
        entry.requestId = error.extensions.requestId as string
        entry.userId = error.extensions.userId as string
        entry.operationName = error.extensions.operationName as string

        if (this.config.includeStackTrace) {
          entry.stack = error.stack
        }

        entry.metadata = {
          errorExtensions: this.maskSensitiveData(error.extensions),
        }
      } else {
        entry.errorCode = error.name
        entry.metadata = {
          errorMessage: error.message,
        }

        if (this.config.includeStackTrace) {
          entry.stack = error.stack
        }
      }
    }

    // 追加情報の追加
    if (extra) {
      entry.extra = this.maskSensitiveData(extra)
    }

    return entry
  }

  /**
   * ログエントリをフォーマット
   */
  private formatLogEntry(entry: LogEntry): string {
    switch (this.config.format) {
      case LogFormat.JSON: {
        return JSON.stringify(entry)
      }
      case LogFormat.STRUCTURED: {
        return this.formatStructured(entry)
      }
      case LogFormat.TEXT: {
        return this.formatText(entry)
      }
      default: {
        return JSON.stringify(entry)
      }
    }
  }

  /**
   * 構造化フォーマット
   */
  private formatStructured(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      `[${entry.service}]`,
      entry.message,
    ]

    if (entry.requestId) {
      parts.push(`requestId=${entry.requestId}`)
    }

    if (entry.userId) {
      parts.push(`userId=${entry.userId}`)
    }

    if (entry.operationName) {
      parts.push(`operation=${entry.operationName}`)
    }

    if (entry.duration) {
      parts.push(`duration=${entry.duration}ms`)
    }

    if (entry.metadata) {
      parts.push(`metadata=${JSON.stringify(entry.metadata)}`)
    }

    return parts.join(' ')
  }

  /**
   * テキストフォーマット
   */
  private formatText(entry: LogEntry): string {
    let formatted = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}`

    if (entry.errorCode) {
      formatted += ` (${entry.errorCode})`
    }

    if (entry.stack && this.config.includeStackTrace) {
      formatted += `\n${entry.stack}`
    }

    return formatted
  }

  /**
   * 機密フィールドかどうかを判定
   */
  private isSensitiveField(fieldName: string): boolean {
    return this.sensitiveFieldPatterns.some((pattern) =>
      pattern.test(fieldName)
    )
  }

  /**
   * 基本ログメソッド
   */
  private log(
    level: LogLevel,
    message: string,
    error?: BaseGraphQLError | Error,
    extra?: Record<string, any>
  ): void {
    const entry = this.createLogEntry(level, message, error, extra)
    this.outputLog(entry)
  }

  /**
   * 機密データをマスク
   */
  private maskSensitiveData(data: any): any {
    if (!this.config.maskSensitiveData) return data
    if (!data || typeof data !== 'object') return data

    const masked = { ...data }

    for (const [key, value] of Object.entries(masked)) {
      if (this.isSensitiveField(key)) {
        masked[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value)
      }
    }

    return masked
  }

  /**
   * ログを出力
   */
  private outputLog(entry: LogEntry): void {
    for (const output of this.config.outputs) {
      try {
        switch (output) {
          case LogOutput.CLOUDWATCH: {
            this.outputToCloudWatch(entry)
            break
          }
          case LogOutput.CONSOLE: {
            this.outputToConsole(entry)
            break
          }
          case LogOutput.DATADOG: {
            this.outputToDatadog(entry)
            break
          }
          case LogOutput.ELASTIC: {
            this.outputToElastic(entry)
            break
          }
          case LogOutput.FILE: {
            this.outputToFile(entry)
            break
          }
        }
      } catch (error) {
        // ログ出力エラーは標準エラー出力に記録
        console.error('Log output failed:', output, error)
      }
    }
  }

  /**
   * CloudWatchに出力（プレースホルダー）
   */
  private outputToCloudWatch(entry: LogEntry): void {
    // 実際の実装では AWS CloudWatch Logs API を使用
    const logEvent = {
      message: this.formatLogEntry(entry),
      timestamp: new Date(entry.timestamp).getTime(),
    }
    // cloudwatchLogs.putLogEvents({ logGroupName, logStreamName, logEvents: [logEvent] })
  }

  /**
   * コンソールに出力
   */
  private outputToConsole(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry)

    switch (entry.level) {
      case LogLevel.DEBUG: {
        console.debug(formatted)
        break
      }
      case LogLevel.ERROR:
      case LogLevel.FATAL: {
        console.error(formatted)
        break
      }
      case LogLevel.INFO: {
        console.info(formatted)
        break
      }
      case LogLevel.WARN: {
        console.warn(formatted)
        break
      }
    }
  }

  /**
   * Datadogに出力（プレースホルダー）
   */
  private outputToDatadog(entry: LogEntry): void {
    // 実際の実装では Datadog ログ API を使用
    const datadogLog = {
      level: entry.level,
      message: entry.message,
      service: entry.service,
      source: this.config.datadogOutput?.source || 'nodejs',
      tags: [
        `env:${entry.environment}`,
        `version:${entry.version}`,
        `service:${entry.service}`,
      ],
      timestamp: entry.timestamp,
      ...entry.metadata,
    }
    // datadogClient.log(datadogLog)
  }

  /**
   * Elasticsearchに出力（プレースホルダー）
   */
  private outputToElastic(entry: LogEntry): void {
    // 実際の実装では Elasticsearch クライアントを使用
    // バッチ処理、再試行ロジック、エラーハンドリングも含める
    const elasticDoc = {
      '@timestamp': entry.timestamp,
      level: entry.level,
      message: entry.message,
      service: entry.service,
      ...entry.metadata,
    }
    // elasticClient.index({ index: this.config.elasticOutput?.index, body: elasticDoc })
  }

  /**
   * ファイルに出力（プレースホルダー）
   */
  private outputToFile(entry: LogEntry): void {
    // 実際の実装では fs モジュールまたはログライブラリを使用
    // ログローテーション、圧縮、バックアップなどの機能も含める
    const formatted = this.formatLogEntry(entry)
    // fs.appendFileSync(this.config.fileOutput?.path || 'app.log', formatted + '\n')
  }

  /**
   * セキュリティ重要度をログレベルに変換
   */
  private securitySeverityToLogLevel(severity: string): LogLevel {
    switch (severity) {
      case 'critical': {
        return LogLevel.FATAL
      }
      case 'high': {
        return LogLevel.ERROR
      }
      case 'low': {
        return LogLevel.INFO
      }
      case 'medium': {
        return LogLevel.WARN
      }
      default: {
        return LogLevel.WARN
      }
    }
  }

  /**
   * 重要度をログレベルに変換
   */
  private severityToLogLevel(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.CRITICAL: {
        return LogLevel.FATAL
      }
      case ErrorSeverity.HIGH: {
        return LogLevel.ERROR
      }
      case ErrorSeverity.LOW: {
        return LogLevel.INFO
      }
      case ErrorSeverity.MEDIUM: {
        return LogLevel.WARN
      }
      default: {
        return LogLevel.ERROR
      }
    }
  }

  /**
   * ログレベルをチェック
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ]
    const currentLevelIndex = levels.indexOf(this.config.level)
    const targetLevelIndex = levels.indexOf(level)
    return targetLevelIndex >= currentLevelIndex
  }

  /**
   * クエリを切り詰め
   */
  private truncateQuery(query: string): string {
    const maxLength = 500
    if (query.length <= maxLength) return query
    return `${query.slice(0, Math.max(0, maxLength))}...`
  }
}

/**
 * デフォルトロガーインスタンス
 */
let defaultLogger: null | StructuredLogger = null

/**
 * デフォルトロガーを取得
 */
export function getLogger(): StructuredLogger {
  if (!defaultLogger) {
    defaultLogger = new StructuredLogger()
  }
  return defaultLogger
}

/**
 * ロガーを初期化
 */
export function initializeLogger(
  config?: Partial<LoggerConfig>
): StructuredLogger {
  defaultLogger = new StructuredLogger(config)
  return defaultLogger
}

/**
 * エラーをログするヘルパー関数
 */
export function logError(
  message: string,
  error?: BaseGraphQLError | Error,
  extra?: Record<string, any>
): void {
  const logger = getLogger()
  logger.error(message, error, extra)
}

/**
 * 情報をログするヘルパー関数
 */
export function logInfo(message: string, extra?: Record<string, any>): void {
  const logger = getLogger()
  logger.info(message, extra)
}

/**
 * 警告をログするヘルパー関数
 */
export function logWarning(
  message: string,
  error?: BaseGraphQLError | Error,
  extra?: Record<string, any>
): void {
  const logger = getLogger()
  logger.warn(message, error, extra)
}
