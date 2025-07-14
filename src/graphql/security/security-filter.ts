/**
 * GraphQLセキュリティフィルター
 *
 * SQLインジェクション、XSS、その他のセキュリティ脅威を検出・防御します。
 * プロダクション環境での包括的なセキュリティ対策を提供します。
 */
import { AuthenticationError, ValidationError } from '../errors/custom-errors'

import type { GraphQLErrorExtensions } from 'graphql'

import { logError } from '@/lib/mcp/utils/logger'

/**
 * セキュリティ脅威の種類
 */
export enum ThreatType {
  COMMAND_INJECTION = 'COMMAND_INJECTION',
  LDAP_INJECTION = 'LDAP_INJECTION',
  MALFORMED_INPUT = 'MALFORMED_INPUT',
  NOSQL_INJECTION = 'NOSQL_INJECTION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SQL_INJECTION = 'SQL_INJECTION',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
  XSS = 'XSS',
}

/**
 * セキュリティフィルター設定
 */
export interface SecurityFilterConfig {
  enableCommandInjectionDetection: boolean
  enableInputSanitization: boolean
  enableLdapInjectionDetection: boolean
  enableLogging: boolean
  enableNoSqlInjectionDetection: boolean
  enableSqlInjectionDetection: boolean
  enableSuspiciousPatternDetection: boolean
  enableXssDetection: boolean
  maxInputLength: number
  rateLimitConfig: {
    enableRateLimit: boolean
    maxRequests: number
    windowMs: number
  }
}

/**
 * セキュリティ検出結果
 */
export interface SecurityThreat {
  confidence: number // 0-100の信頼度
  field?: string
  matchedPattern: string
  message: string
  payload: string
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM'
  type: ThreatType
}

/**
 * セキュリティフィルタークラス
 */
export class SecurityFilter {
  private readonly config: SecurityFilterConfig
  private readonly requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >()

  constructor(config: Partial<SecurityFilterConfig> = {}) {
    this.config = {
      enableCommandInjectionDetection:
        config.enableCommandInjectionDetection ?? true,
      enableInputSanitization: config.enableInputSanitization ?? true,
      enableLdapInjectionDetection: config.enableLdapInjectionDetection ?? true,
      enableLogging: config.enableLogging ?? true,
      enableNoSqlInjectionDetection:
        config.enableNoSqlInjectionDetection ?? true,
      enableSqlInjectionDetection: config.enableSqlInjectionDetection ?? true,
      enableSuspiciousPatternDetection:
        config.enableSuspiciousPatternDetection ?? true,
      enableXssDetection: config.enableXssDetection ?? true,
      maxInputLength: config.maxInputLength ?? 10_000,
      rateLimitConfig: {
        enableRateLimit: config.rateLimitConfig?.enableRateLimit ?? true,
        maxRequests: config.rateLimitConfig?.maxRequests ?? 100,
        windowMs: config.rateLimitConfig?.windowMs ?? 60_000, // 1分
      },
    }
  }

  /**
   * 入力サニタイゼーションが有効かどうかをチェック
   */
  public isInputSanitizationEnabled(): boolean {
    return this.config.enableInputSanitization
  }

  /**
   * 入力値のサニタイゼーション
   */
  public sanitizeInput(input: string): string {
    if (!this.config.enableInputSanitization) {
      return input
    }

    let sanitized = input

    // HTMLエンティティエンコード
    sanitized = sanitized
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#x27;')

    // NUL文字除去
    sanitized = sanitized.replaceAll('\0', '')

    // 制御文字除去
    sanitized = sanitized.replaceAll(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ''
    )

    return sanitized
  }

  /**
   * 脅威レベルに基づく例外スロー
   */
  public throwIfCritical(
    threats: SecurityThreat[],
    extensions?: GraphQLErrorExtensions
  ): void {
    const criticalThreats = threats.filter(
      (threat) => threat.severity === 'CRITICAL'
    )
    const highThreats = threats.filter((threat) => threat.severity === 'HIGH')

    if (criticalThreats.length > 0) {
      const messages = criticalThreats
        .map((threat) => threat.message)
        .join(', ')
      throw new AuthenticationError(
        `重大なセキュリティ脅威が検出されました: ${messages}`,
        {
          ...extensions,
          securityThreats: criticalThreats.map((t) => ({
            confidence: t.confidence,
            message: t.message,
            type: t.type,
          })),
        }
      )
    }

    if (highThreats.length > 0) {
      const messages = highThreats.map((threat) => threat.message).join(', ')
      throw new ValidationError(
        `セキュリティ脅威が検出されました: ${messages}`,
        {
          securityThreats: highThreats.map((t) => t.message),
        },
        {
          ...extensions,
          threats: highThreats.map((t) => ({
            field: t.field,
            message: t.message,
            type: t.type,
          })),
        }
      )
    }
  }

  /**
   * 入力値の包括的セキュリティ検証
   */
  public validateInput(
    input: unknown,
    field?: string,
    clientIp?: string
  ): SecurityThreat[] {
    const threats: SecurityThreat[] = []

    // レート制限チェック
    if (clientIp && this.config.rateLimitConfig.enableRateLimit) {
      const rateLimitThreat = this.checkRateLimit(clientIp)
      if (rateLimitThreat) {
        threats.push(rateLimitThreat)
      }
    }

    // 入力値がstringでない場合は処理をスキップ
    if (typeof input !== 'string') {
      return threats
    }

    // 入力長チェック
    if (input.length > this.config.maxInputLength) {
      threats.push({
        confidence: 100,
        field,
        matchedPattern: 'length_exceeded',
        message: `入力値が制限長を超えています（${input.length}/${this.config.maxInputLength}文字）`,
        payload: `${input.slice(0, 100)}...`,
        severity: 'MEDIUM',
        type: ThreatType.MALFORMED_INPUT,
      })
    }

    // 各種インジェクション検出
    threats.push(
      ...this.detectSqlInjection(input, field),
      ...this.detectXss(input, field),
      ...this.detectCommandInjection(input, field),
      ...this.detectNoSqlInjection(input, field),
      ...this.detectLdapInjection(input, field),
      ...this.detectSuspiciousPatterns(input, field)
    )

    // 脅威が検出された場合のログ出力
    if (threats.length > 0 && this.config.enableLogging) {
      this.logSecurityThreats(threats, input, field, clientIp)
    }

    return threats
  }

  /**
   * レート制限チェック
   */
  private checkRateLimit(clientIp: string): SecurityThreat | undefined {
    const now = Date.now()
    const clientData = this.requestCounts.get(clientIp)

    if (!clientData || now > clientData.resetTime) {
      // 新しいウィンドウまたは期限切れの場合
      this.requestCounts.set(clientIp, {
        count: 1,
        resetTime: now + this.config.rateLimitConfig.windowMs,
      })
      return undefined
    }

    clientData.count++

    if (clientData.count > this.config.rateLimitConfig.maxRequests) {
      return {
        confidence: 100,
        matchedPattern: 'rate_limit',
        message: `レート制限を超過しました（${clientData.count}/${this.config.rateLimitConfig.maxRequests}リクエスト）`,
        payload: clientIp,
        severity: 'HIGH',
        type: ThreatType.RATE_LIMIT_EXCEEDED,
      }
    }

    return undefined
  }

  /**
   * コマンドインジェクション検出
   */
  private detectCommandInjection(
    input: string,
    field?: string
  ): SecurityThreat[] {
    if (!this.config.enableCommandInjectionDetection) {
      return []
    }

    const threats: SecurityThreat[] = []
    const commandPatterns = [
      // 基本的なシステムコマンド
      {
        confidence: 85,
        message: 'システムコマンドが検出されました',
        pattern:
          /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|wget|curl|nc|ncat|telnet)\b/gi,
        severity: 'HIGH' as const,
      },
      // パイプやリダイレクト
      {
        confidence: 70,
        message: 'コマンド制御文字が検出されました',
        pattern: /[|;&`$(){}[\]]/g,
        severity: 'MEDIUM' as const,
      },
      // バックティック（コマンド置換）
      {
        confidence: 90,
        message: 'コマンド置換（バックティック）が検出されました',
        pattern: /`[^`]*`/g,
        severity: 'HIGH' as const,
      },
      // $() コマンド置換
      {
        confidence: 90,
        message: 'コマンド置換が検出されました',
        pattern: /\$\([^)]*\)/g,
        severity: 'HIGH' as const,
      },
    ]

    for (const { confidence, message, pattern, severity } of commandPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        threats.push({
          confidence,
          field,
          matchedPattern: matches[0],
          message,
          payload: input,
          severity,
          type: ThreatType.COMMAND_INJECTION,
        })
      }
    }

    return threats
  }

  /**
   * LDAPインジェクション検出
   */
  private detectLdapInjection(input: string, field?: string): SecurityThreat[] {
    if (!this.config.enableLdapInjectionDetection) {
      return []
    }

    const threats: SecurityThreat[] = []
    const ldapPatterns = [
      // LDAP特殊文字
      {
        confidence: 80,
        message: 'LDAP 特殊文字が検出されました',
        pattern: /[()\\*\u0000]/g,
        severity: 'HIGH' as const,
      },
      // LDAP演算子
      {
        confidence: 70,
        message: 'LDAP 演算子が検出されました',
        pattern: /[&|!]=?/g,
        severity: 'MEDIUM' as const,
      },
    ]

    for (const { confidence, message, pattern, severity } of ldapPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        threats.push({
          confidence,
          field,
          matchedPattern: matches[0],
          message,
          payload: input,
          severity,
          type: ThreatType.LDAP_INJECTION,
        })
      }
    }

    return threats
  }

  /**
   * NoSQLインジェクション検出
   */
  private detectNoSqlInjection(
    input: string,
    field?: string
  ): SecurityThreat[] {
    if (!this.config.enableNoSqlInjectionDetection) {
      return []
    }

    const threats: SecurityThreat[] = []
    const nosqlPatterns = [
      // MongoDB操作子
      {
        confidence: 85,
        message: 'MongoDB 操作子が検出されました',
        pattern: /\$\w+\s*:/g,
        severity: 'HIGH' as const,
      },
      // JavaScript関数（MongoDB）
      {
        confidence: 60,
        message: 'JavaScript コードが検出されました',
        pattern: /\b(this|function|return|var|let|const)\b/gi,
        severity: 'MEDIUM' as const,
      },
      // 正規表現操作
      {
        confidence: 70,
        message: '正規表現パターンが検出されました',
        pattern: /\/.*\/[gimuy]*/g,
        severity: 'MEDIUM' as const,
      },
    ]

    for (const { confidence, message, pattern, severity } of nosqlPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        threats.push({
          confidence,
          field,
          matchedPattern: matches[0],
          message,
          payload: input,
          severity,
          type: ThreatType.NOSQL_INJECTION,
        })
      }
    }

    return threats
  }

  /**
   * SQLインジェクション検出
   */
  private detectSqlInjection(input: string, field?: string): SecurityThreat[] {
    if (!this.config.enableSqlInjectionDetection) {
      return []
    }

    const threats: SecurityThreat[] = []
    const sqlPatterns = [
      // 基本的なSQLインジェクションパターン
      {
        confidence: 85,
        message: 'SQL キーワードが検出されました',
        pattern:
          /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
        severity: 'HIGH' as const,
      },
      // SQLコメント
      {
        confidence: 70,
        message: 'SQL コメント文字が検出されました',
        pattern: /(--|\/\*|\*\/|#)/g,
        severity: 'MEDIUM' as const,
      },
      // クオート関連
      {
        confidence: 60,
        message: 'SQL クオートエスケープが検出されました',
        pattern: /('|('')|(\\")|(\\\'))/g,
        severity: 'MEDIUM' as const,
      },
      // Boolean-based blind SQL injection
      {
        confidence: 90,
        message: 'Boolean-based SQL インジェクションパターンが検出されました',
        pattern: /\b(and|or)\s+\d+\s*[=<>]\s*\d+/gi,
        severity: 'HIGH' as const,
      },
      // Time-based blind SQL injection
      {
        confidence: 95,
        message: 'Time-based SQL インジェクションパターンが検出されました',
        pattern: /\b(sleep|benchmark|pg_sleep|waitfor)\s*\(/gi,
        severity: 'CRITICAL' as const,
      },
      // UNION-based SQL injection
      {
        confidence: 95,
        message: 'UNION-based SQL インジェクションが検出されました',
        pattern: /\bunion\s+(all\s+)?select/gi,
        severity: 'CRITICAL' as const,
      },
      // 情報スキーマアクセス
      {
        confidence: 88,
        message: 'データベーススキーマアクセスパターンが検出されました',
        pattern: /\b(information_schema|sysobjects|syscolumns|pg_catalog)\b/gi,
        severity: 'HIGH' as const,
      },
    ]

    for (const { confidence, message, pattern, severity } of sqlPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        threats.push({
          confidence,
          field,
          matchedPattern: matches[0],
          message,
          payload: input,
          severity,
          type: ThreatType.SQL_INJECTION,
        })
      }
    }

    return threats
  }

  /**
   * 疑わしいパターン検出
   */
  private detectSuspiciousPatterns(
    input: string,
    field?: string
  ): SecurityThreat[] {
    if (!this.config.enableSuspiciousPatternDetection) {
      return []
    }

    const threats: SecurityThreat[] = []
    const suspiciousPatterns = [
      // Base64エンコード
      {
        confidence: 50,
        message: 'Base64 エンコードされた文字列が検出されました',
        pattern: /[A-Za-z0-9+/]{40,}={0,2}/g,
        severity: 'LOW' as const,
      },
      // 異常に長い文字列
      {
        confidence: 60,
        message: '異常に長い文字列が検出されました',
        pattern: /.{500,}/g,
        severity: 'MEDIUM' as const,
      },
      // バイナリデータ
      {
        confidence: 70,
        message: 'バイナリデータが検出されました',
        pattern: /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
        severity: 'MEDIUM' as const,
      },
      // 疑わしいファイルパス
      {
        confidence: 85,
        message: 'パストラバーサルパターンが検出されました',
        pattern: /\.\.[/\\]|[/\\]\.\./g,
        severity: 'HIGH' as const,
      },
      // 環境変数アクセス
      {
        confidence: 75,
        message: '環境変数アクセスパターンが検出されました',
        pattern: /\$\{[^}]*\}|\$[A-Z_]+/g,
        severity: 'MEDIUM' as const,
      },
    ]

    for (const {
      confidence,
      message,
      pattern,
      severity,
    } of suspiciousPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        threats.push({
          confidence,
          field,
          matchedPattern: matches[0],
          message,
          payload: input,
          severity,
          type: ThreatType.SUSPICIOUS_PATTERN,
        })
      }
    }

    return threats
  }

  /**
   * XSS検出
   */
  private detectXss(input: string, field?: string): SecurityThreat[] {
    if (!this.config.enableXssDetection) {
      return []
    }

    const threats: SecurityThreat[] = []
    const xssPatterns = [
      // スクリプトタグ
      {
        confidence: 95,
        message: 'script タグが検出されました',
        pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        severity: 'CRITICAL' as const,
      },
      // インラインイベントハンドラー
      {
        confidence: 85,
        message: 'インライン JavaScript イベントハンドラーが検出されました',
        pattern: /\bon\w+\s*=\s*["\'][^"\']*["\']|on\w+\s*=\s*\w+/gi,
        severity: 'HIGH' as const,
      },
      // JavaScript: プロトコル
      {
        confidence: 90,
        message: 'JavaScript プロトコルが検出されました',
        pattern: /javascript\s*:/gi,
        severity: 'HIGH' as const,
      },
      // vbscript: プロトコル
      {
        confidence: 90,
        message: 'VBScript プロトコルが検出されました',
        pattern: /vbscript\s*:/gi,
        severity: 'HIGH' as const,
      },
      // データURL with base64
      {
        confidence: 70,
        message: 'Base64 データ URL が検出されました',
        pattern: /data\s*:\s*[^;]*;base64/gi,
        severity: 'MEDIUM' as const,
      },
      // 式評価関数
      {
        confidence: 80,
        message: 'JavaScript 式評価関数が検出されました',
        pattern: /\b(eval|setTimeout|setInterval|Function)\s*\(/gi,
        severity: 'HIGH' as const,
      },
      // 危険なHTMLタグ
      {
        confidence: 75,
        message: '潜在的に危険な HTML タグが検出されました',
        pattern: /<(iframe|object|embed|form|input|meta|link)\b[^>]*>/gi,
        severity: 'MEDIUM' as const,
      },
    ]

    for (const { confidence, message, pattern, severity } of xssPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        threats.push({
          confidence,
          field,
          matchedPattern: matches[0],
          message,
          payload: input,
          severity,
          type: ThreatType.XSS,
        })
      }
    }

    return threats
  }

  /**
   * セキュリティ脅威のログ出力
   */
  private logSecurityThreats(
    threats: SecurityThreat[],
    originalInput: string,
    field?: string,
    clientIp?: string
  ): void {
    const logData = {
      clientIp,
      field,
      inputLength: originalInput.length,
      threats: threats.map((threat) => ({
        confidence: threat.confidence,
        field: threat.field,
        matchedPattern: threat.matchedPattern,
        message: threat.message,
        severity: threat.severity,
        type: threat.type,
      })),
      timestamp: new Date().toISOString(),
    }

    logError('セキュリティ脅威が検出されました', logData)
  }
}

/**
 * グローバルセキュリティフィルターインスタンス
 */
export const securityFilter = new SecurityFilter()

/**
 * 開発環境用のセキュリティフィルター
 */
export function createDevelopmentSecurityFilter(): SecurityFilter {
  return new SecurityFilter({
    enableCommandInjectionDetection: true,
    enableInputSanitization: false, // 開発時は無効
    enableLdapInjectionDetection: true,
    enableLogging: true,
    enableNoSqlInjectionDetection: true,
    enableSqlInjectionDetection: true,
    enableSuspiciousPatternDetection: false, // 開発時は無効
    enableXssDetection: true,
    maxInputLength: 50_000, // 開発時は長めに設定
    rateLimitConfig: {
      enableRateLimit: false, // 開発時は無効
      maxRequests: 1000, // 開発時は緩め
      windowMs: 60_000,
    },
  })
}

/**
 * 本番環境用のセキュリティフィルター
 */
export function createProductionSecurityFilter(): SecurityFilter {
  return new SecurityFilter({
    enableCommandInjectionDetection: true,
    enableInputSanitization: true,
    enableLdapInjectionDetection: true,
    enableLogging: true,
    enableNoSqlInjectionDetection: true,
    enableSqlInjectionDetection: true,
    enableSuspiciousPatternDetection: true,
    enableXssDetection: true,
    maxInputLength: 10_000,
    rateLimitConfig: {
      enableRateLimit: true,
      maxRequests: 100,
      windowMs: 60_000,
    },
  })
}

/**
 * セキュリティフィルターミドルウェア
 */
export function withSecurityFilter<T extends Record<string, unknown>>(
  input: T,
  clientIp?: string
): T {
  const filter =
    process.env.NODE_ENV === 'production'
      ? createProductionSecurityFilter()
      : createDevelopmentSecurityFilter()

  const sanitized = { ...input }

  // 各フィールドをチェック・サニタイズ
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      const threats = filter.validateInput(value, key, clientIp)
      filter.throwIfCritical(threats)

      if (filter.isInputSanitizationEnabled()) {
        ;(sanitized as Record<string, unknown>)[key] =
          filter.sanitizeInput(value)
      }
    }
  }

  return sanitized
}
