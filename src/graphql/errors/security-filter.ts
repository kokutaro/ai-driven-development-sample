/**
 * GraphQLセキュリティフィルター
 *
 * プロダクション環境での情報漏洩防止、機密データの保護、
 * セキュリティ脆弱性の軽減を行うセキュリティレイヤーです。
 */
import { ErrorCategory, ErrorSeverity } from './custom-errors'
import { getLogger } from './logger'

import type { BaseGraphQLError } from './custom-errors'

/**
 * セキュリティレベルの定義
 */
export enum SecurityLevel {
  CONFIDENTIAL = 'confidential', // 機密情報
  INTERNAL = 'internal', // 内部情報
  PUBLIC = 'public', // 公開情報
  RESTRICTED = 'restricted', // 制限情報
}

/**
 * 拡張フィールドの型定義
 */
export type ExtensionFields = Record<string, unknown>

/**
 * フィルタリングされたデータの型定義
 */
export interface FilteredData {
  [key: string]: unknown
  extensions?: Record<string, unknown>
  locations?: ReadonlyArray<{ column: number; line: number }>
  message?: string
  path?: ReadonlyArray<number | string>
}

/**
 * フィルタリング結果の型定義
 */
export interface FilterResult {
  filtered: FilteredData
  riskLevel: 'critical' | 'high' | 'low' | 'medium'
  securityViolations: SecurityViolation[]
}

/**
 * セキュリティ設定の型定義
 */
export interface SecurityConfig {
  /** 許可されたエラー拡張フィールド */
  allowedExtensions: string[]
  /** 機密情報のマスキングを有効にするか */
  enableDataMasking: boolean
  /** 内部エラーの詳細を隠すか */
  hideInternalDetails: boolean
  /** デバッグ情報を含めるか */
  includeDebugInfo: boolean
  /** スタックトレースを出力するか */
  includeStackTrace: boolean
  /** 本番環境フラグ */
  isProduction: boolean
  /** 機密フィールドのパターン */
  sensitiveFieldPatterns: RegExp[]
  /** 信頼されたIPアドレス範囲 */
  trustedIpRanges: string[]
}

/**
 * セキュリティコンテキストの型定義
 */
export interface SecurityContext {
  ipAddress?: string
  isAuthenticated: boolean
  isTrustedSource: boolean
  permissions: string[]
  securityLevel: SecurityLevel
  userAgent?: string
  userId?: string
  userRole?: string
}

/** デフォルトのセキュリティ設定 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  allowedExtensions: ['code', 'timestamp', 'category', 'severity', 'retryable'],
  enableDataMasking: true,
  hideInternalDetails: process.env.NODE_ENV === 'production',
  includeDebugInfo: process.env.NODE_ENV === 'development',
  includeStackTrace: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  sensitiveFieldPatterns: [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /credential/i,
    /auth/i,
    /session/i,
    /cookie/i,
    /private/i,
    /confidential/i,
    /internal/i,
  ],
  trustedIpRanges: ['127.0.0.1', '::1'],
}

/**
 * セキュリティ違反の型定義
 */
export interface SecurityViolation {
  action: 'blocked' | 'masked' | 'removed'
  description: string
  field?: string
  severity: 'critical' | 'high' | 'low' | 'medium'
  type:
    | 'data_exposure'
    | 'information_disclosure'
    | 'injection_attempt'
    | 'privilege_escalation'
  value?: unknown
}

/**
 * GraphQLセキュリティフィルター
 */
export class GraphQLSecurityFilter {
  private readonly config: SecurityConfig
  private readonly logger = getLogger()

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config }
  }

  /**
   * セキュリティコンテキストを作成
   */
  static createSecurityContext(
    userId?: string,
    userRole?: string,
    ipAddress?: string,
    userAgent?: string,
    isAuthenticated = false,
    permissions: string[] = []
  ): SecurityContext {
    const isTrustedSource = ipAddress
      ? DEFAULT_SECURITY_CONFIG.trustedIpRanges.includes(ipAddress)
      : false

    let securityLevel = SecurityLevel.PUBLIC
    if (isAuthenticated) {
      if (userRole === 'admin') {
        securityLevel = SecurityLevel.RESTRICTED
      } else if (isTrustedSource) {
        securityLevel = SecurityLevel.CONFIDENTIAL
      } else {
        securityLevel = SecurityLevel.INTERNAL
      }
    }

    return {
      ipAddress,
      isAuthenticated,
      isTrustedSource,
      permissions,
      securityLevel,
      userAgent,
      userId,
      userRole,
    }
  }

  /**
   * エラーオブジェクトをセキュリティフィルタリング
   */
  filterError(
    error: BaseGraphQLError,
    securityContext: SecurityContext
  ): FilterResult {
    const violations: SecurityViolation[] = []
    let riskLevel: FilterResult['riskLevel'] = 'low'

    // 基本的なエラーオブジェクト構造
    const filtered = {
      extensions: this.filterExtensions(
        error.extensions,
        securityContext,
        violations
      ),
      message: this.filterErrorMessage(error, securityContext, violations),
    }

    // セキュリティレベルに基づく追加フィルタリング
    if (securityContext.securityLevel === SecurityLevel.PUBLIC) {
      filtered.message = this.createGenericErrorMessage(error.category)
      filtered.extensions = this.getMinimalExtensions(error.extensions)

      violations.push({
        action: 'masked',
        description: 'Error details hidden for public access',
        severity: 'medium',
        type: 'information_disclosure',
      })
    }

    // 内部エラーの詳細を隠す
    if (this.config.hideInternalDetails && this.isInternalError(error)) {
      filtered.message =
        'システムエラーが発生しました。管理者にお問い合わせください。'
      filtered.extensions = {
        code: error.extensions.code,
        timestamp: error.extensions.timestamp,
      }

      violations.push({
        action: 'masked',
        description: 'Internal error details masked',
        severity: 'high',
        type: 'information_disclosure',
      })
      riskLevel = 'high'
    }

    // 機密情報のマスキング
    if (this.config.enableDataMasking) {
      this.maskSensitiveData(filtered, violations)
    }

    // スタックトレースの処理
    if (!this.config.includeStackTrace && error.stack) {
      delete filtered.extensions?.stack
      delete filtered.extensions?.stackTrace

      violations.push({
        action: 'removed',
        description: 'Stack trace removed',
        severity: 'medium',
        type: 'information_disclosure',
      })
    }

    // セキュリティ違反の記録
    if (violations.length > 0) {
      this.logSecurityViolations(error, securityContext, violations)
    }

    return {
      filtered,
      riskLevel,
      securityViolations: violations,
    }
  }

  /**
   * セキュリティ監査ログを生成
   */
  generateSecurityAudit(): {
    config: SecurityConfig
    lastUpdated: string
    securityLevel: string
  } {
    return {
      config: { ...this.config },
      lastUpdated: new Date().toISOString(),
      securityLevel: this.config.isProduction ? 'production' : 'development',
    }
  }

  /**
   * セキュリティ設定を更新
   */
  updateConfig(updates: Partial<SecurityConfig>): void {
    Object.assign(this.config, updates)
  }

  /**
   * 汎用エラーメッセージを作成
   */
  private createGenericErrorMessage(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION: {
        return 'ログインが必要です'
      }
      case ErrorCategory.AUTHORIZATION: {
        return 'アクセス権限がありません'
      }
      case ErrorCategory.RESOURCE_NOT_FOUND: {
        return 'リソースが見つかりません'
      }
      case ErrorCategory.VALIDATION: {
        return '入力内容に問題があります'
      }
      default: {
        return 'エラーが発生しました'
      }
    }
  }

  /**
   * 公開用エラーメッセージを作成
   */
  private createPublicErrorMessage(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION: {
        return 'ログインしてください'
      }
      case ErrorCategory.AUTHORIZATION: {
        return 'アクセスできません'
      }
      default: {
        return '操作を完了できませんでした'
      }
    }
  }

  /**
   * SQLインジェクション試行を検出
   */
  private detectSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\'|\\\'|;|--|#|\|\||\/\*)/i,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
      /\b(or|and)\b.*(=|<|>|!|like).*\b(or|and)\b/i,
    ]

    return sqlPatterns.some((pattern) => pattern.test(input))
  }

  /**
   * エラーメッセージをフィルタリング
   */
  private filterErrorMessage(
    error: BaseGraphQLError,
    securityContext: SecurityContext,
    violations: SecurityViolation[]
  ): string {
    let message = error.message

    // 機密情報のパターンチェック
    for (const pattern of this.config.sensitiveFieldPatterns) {
      if (pattern.test(message)) {
        message = message.replace(pattern, '[REDACTED]')

        violations.push({
          action: 'masked',
          description: `Sensitive information detected in error message: ${pattern.source}`,
          severity: 'high',
          type: 'data_exposure',
        })
      }
    }

    // SQLインジェクション試行の検出
    if (this.detectSqlInjection(message)) {
      violations.push({
        action: 'blocked',
        description:
          'Potential SQL injection attempt detected in error message',
        severity: 'critical',
        type: 'injection_attempt',
      })

      return 'セキュリティエラーが検出されました'
    }

    // パス情報の除去
    message = this.removePaths(message)

    // 認証されていないユーザーには限定された情報のみ
    if (!securityContext.isAuthenticated) {
      return this.createPublicErrorMessage(error.category)
    }

    return message
  }

  /**
   * エラー拡張フィールドをフィルタリング
   */
  private filterExtensions(
    extensions: ExtensionFields,
    securityContext: SecurityContext,
    violations: SecurityViolation[]
  ): ExtensionFields {
    const filtered: ExtensionFields = {}

    // 許可されたフィールドのみを含める
    for (const field of this.config.allowedExtensions) {
      // eslint-disable-next-line security/detect-object-injection
      if (extensions[field] !== undefined) {
        // eslint-disable-next-line security/detect-object-injection
        filtered[field] = extensions[field]
      }
    }

    // デバッグ情報の処理
    if (this.config.includeDebugInfo && securityContext.isTrustedSource) {
      filtered.debug = {
        originalMessage: extensions.originalMessage,
        requestId: extensions.requestId,
        userId: extensions.userId,
      }
    }

    // 機密フィールドの検出と除去
    for (const [key, _value] of Object.entries(extensions)) {
      if (this.isSensitiveField(key)) {
        violations.push({
          action: 'removed',
          description: `Sensitive field detected: ${key}`,
          field: key,
          severity: 'medium',
          type: 'data_exposure',
        })
      }
    }

    return filtered
  }

  /**
   * 最小限の拡張フィールドを取得
   */
  private getMinimalExtensions(extensions: ExtensionFields): ExtensionFields {
    return {
      code: extensions.code ?? 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 内部エラーかどうかを判定
   */
  private isInternalError(error: BaseGraphQLError): boolean {
    return (
      error.category === ErrorCategory.SYSTEM ||
      error.category === ErrorCategory.DATABASE ||
      error.category === ErrorCategory.EXTERNAL_SERVICE ||
      error.severity === ErrorSeverity.CRITICAL
    )
  }

  /**
   * 機密フィールドかどうかを判定
   */
  private isSensitiveField(fieldName: string): boolean {
    return this.config.sensitiveFieldPatterns.some((pattern) =>
      pattern.test(fieldName)
    )
  }

  /**
   * セキュリティ違反をログに記録
   */
  private logSecurityViolations(
    error: BaseGraphQLError,
    securityContext: SecurityContext,
    violations: SecurityViolation[]
  ): void {
    const logData = {
      errorCategory: error.category,
      errorCode: error.extensions.code,
      securityContext: {
        ipAddress: securityContext.ipAddress,
        isAuthenticated: securityContext.isAuthenticated,
        securityLevel: securityContext.securityLevel,
        userAgent: securityContext.userAgent,
        userId: securityContext.userId,
      },
      violations: violations.map((v) => ({
        action: v.action,
        description: v.description,
        severity: v.severity,
        type: v.type,
      })),
    }

    const criticalViolations = violations.filter(
      (v) => v.severity === 'critical'
    )
    if (criticalViolations.length > 0) {
      this.logger.error(
        'Critical security violation detected',
        error instanceof Error ? error : new Error(String(error)),
        logData
      )
    } else {
      this.logger.warn('Security violations detected', undefined, logData)
    }
  }

  /**
   * 機密データをマスキング
   */
  private maskSensitiveData(
    obj: Record<string, unknown>,
    violations: SecurityViolation[]
  ): void {
    if (typeof obj !== 'object' || obj === null) return

    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveField(key)) {
        // eslint-disable-next-line security/detect-object-injection
        obj[key] = '[REDACTED]'

        violations.push({
          action: 'masked',
          description: `Sensitive data masked: ${key}`,
          field: key,
          severity: 'medium',
          type: 'data_exposure',
          value:
            typeof value === 'string' ? `${value.slice(0, 10)}...` : '[OBJECT]',
        })
      } else if (typeof value === 'object' && value !== null) {
        this.maskSensitiveData(value as Record<string, unknown>, violations)
      }
    }
  }

  /**
   * パス情報を除去
   */
  private removePaths(message: string): string {
    // ファイルパスの除去
    message = message.replaceAll(/[A-Z]:\\[^\\]*\\[\w\\.]+/gi, '[PATH]')
    message = message.replaceAll(/\/[\w\/\-\.]+\/[\w\-\.]+/g, '[PATH]')

    // 一時的なIDやハッシュの除去
    message = message.replaceAll(/[a-f0-9]{32,}/gi, '[HASH]')
    message = message.replaceAll(/\b[A-Z0-9]{20,}\b/g, '[ID]')

    return message
  }
}

/**
 * デフォルトセキュリティフィルターインスタンス
 */
let defaultSecurityFilter: GraphQLSecurityFilter | undefined = undefined

/**
 * デフォルトセキュリティフィルターを取得
 */
export function getSecurityFilter(): GraphQLSecurityFilter {
  defaultSecurityFilter ??= new GraphQLSecurityFilter()
  return defaultSecurityFilter
}

/**
 * セキュリティフィルターを初期化
 */
export function initializeSecurityFilter(
  config?: Partial<SecurityConfig>
): GraphQLSecurityFilter {
  defaultSecurityFilter = new GraphQLSecurityFilter(config)
  return defaultSecurityFilter
}

/**
 * エラーをセキュリティフィルタリングするヘルパー関数
 */
export function secureError(
  error: BaseGraphQLError,
  securityContext: SecurityContext
): FilteredData {
  const filter = getSecurityFilter()
  const result = filter.filterError(error, securityContext)

  // 高リスクの場合は追加ログ
  if (result.riskLevel === 'critical' || result.riskLevel === 'high') {
    const logger = getLogger()
    logger.warn('High risk security filtering applied', undefined, {
      errorCode: error.extensions.code,
      riskLevel: result.riskLevel,
      violationCount: result.securityViolations.length,
    })
  }

  return result.filtered
}
