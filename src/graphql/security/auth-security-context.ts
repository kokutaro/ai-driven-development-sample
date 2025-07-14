/**
 * 認証セキュリティコンテキスト
 *
 * 認証関連のセキュリティ機能を提供します。
 * 不正アクセス試行の検出、アカウントロック、セッション管理等を実装します。
 */
import {
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
} from '../errors/custom-errors'

import type { GraphQLErrorExtensions } from 'graphql'

import { logError } from '@/lib/mcp/utils/logger'

/**
 * 認証イベントの種類
 */
export enum AuthEventType {
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PRIVILEGE_ESCALATION_ATTEMPT = 'PRIVILEGE_ESCALATION_ATTEMPT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
}

/**
 * アカウントセキュリティ状態
 */
export interface AccountSecurityState {
  failedLoginAttempts: number
  isLocked: boolean
  lastFailedLogin?: Date
  lastPasswordChange?: Date
  lastSuccessfulLogin?: Date
  lockoutUntil?: Date
  loginAttemptHistory: LoginAttempt[]
  suspiciousActivityScore: number
  userId: string
}

/**
 * セキュリティ設定
 */
export interface AuthSecurityConfig {
  enableDeviceFingerprintCheck: boolean
  enableGeoLocationCheck: boolean
  enableSuspiciousActivityDetection: boolean
  lockoutDurationMs: number
  maxFailedAttempts: number
  passwordMaxAge: number
  passwordMinLength: number
  riskThresholds: {
    high: number
    low: number
    medium: number
  }
  sessionTimeout: number
}

/**
 * ログイン試行記録
 */
export interface LoginAttempt {
  clientIp: string
  failureReason?: string
  success: boolean
  timestamp: Date
  userAgent: string
}

/**
 * セキュリティイベント
 */
export interface SecurityEvent {
  clientIp: string
  metadata?: Record<string, unknown>
  riskScore: number // 0-100のリスクスコア
  timestamp: Date
  type: AuthEventType
  userAgent: string
  userId?: string
}

/**
 * 認証セキュリティコンテキストクラス
 */
export class AuthSecurityContext {
  private readonly accountStates = new Map<string, AccountSecurityState>()
  private readonly config: AuthSecurityConfig
  private readonly ipAttempts = new Map<string, LoginAttempt[]>()

  constructor(config: Partial<AuthSecurityConfig> = {}) {
    this.config = {
      enableDeviceFingerprintCheck: config.enableDeviceFingerprintCheck ?? true,
      enableGeoLocationCheck: config.enableGeoLocationCheck ?? true,
      enableSuspiciousActivityDetection:
        config.enableSuspiciousActivityDetection ?? true,
      lockoutDurationMs: config.lockoutDurationMs ?? 30 * 60 * 1000, // 30分
      maxFailedAttempts: config.maxFailedAttempts ?? 5,
      passwordMaxAge: config.passwordMaxAge ?? 90 * 24 * 60 * 60 * 1000, // 90日
      passwordMinLength: config.passwordMinLength ?? 8,
      riskThresholds: {
        high: config.riskThresholds?.high ?? 80,
        low: config.riskThresholds?.low ?? 30,
        medium: config.riskThresholds?.medium ?? 60,
      },
      sessionTimeout: config.sessionTimeout ?? 24 * 60 * 60 * 1000, // 24時間
    }
  }

  /**
   * 権限チェック
   */
  public async checkPermission(
    userId: string,
    requiredRole: string,
    resource?: string,
    clientIp?: string,
    userAgent?: string,
    extensions?: GraphQLErrorExtensions
  ): Promise<void> {
    // ここでは実際の権限チェックロジックの代わりに、
    // セキュリティイベントのログ記録のみを実装

    // 権限昇格の試行を検出
    if (requiredRole === 'admin' || requiredRole === 'super_admin') {
      this.logSecurityEvent({
        clientIp: clientIp ?? 'unknown',
        metadata: {
          requiredRole,
          resource,
        },
        riskScore: 70,
        timestamp: new Date(),
        type: AuthEventType.PRIVILEGE_ESCALATION_ATTEMPT,
        userAgent: userAgent ?? 'unknown',
        userId,
      })
    }

    // 実際の権限チェックは他のモジュールで実装されることを想定
    // ここでは例外を投げるサンプル
    if (Math.random() > 0.9) {
      // 10%の確率で権限エラー（デモ用）
      throw new AuthorizationError(
        `リソース '${resource}' に対する '${requiredRole}' 権限がありません`,
        {
          ...extensions,
          requiredRole,
          resource,
          userId,
        }
      )
    }
  }

  /**
   * セキュリティ統計の取得
   */
  public getSecurityStats(userId: string): {
    failedLoginAttempts: number
    isLocked: boolean
    lastFailedLogin?: Date
    lastSuccessfulLogin?: Date
    recentLoginIps: string[]
  } {
    const accountState = this.getAccountState(userId)
    const recentLogins = accountState.loginAttemptHistory
      .filter((attempt) => attempt.success)
      .slice(-10)

    return {
      failedLoginAttempts: accountState.failedLoginAttempts,
      isLocked: accountState.isLocked,
      lastFailedLogin: accountState.lastFailedLogin,
      lastSuccessfulLogin: accountState.lastSuccessfulLogin,
      recentLoginIps: [...new Set(recentLogins.map((login) => login.clientIp))],
    }
  }

  /**
   * ログイン失敗時の処理
   */
  public async onLoginFailure(
    identifier: string,
    clientIp: string,
    userAgent: string,
    failureReason: string,
    extensions?: GraphQLErrorExtensions
  ): Promise<void> {
    const accountState = this.getAccountState(identifier)

    // 失敗回数をインクリメント
    accountState.failedLoginAttempts++
    accountState.lastFailedLogin = new Date()

    // ログイン履歴に追加
    accountState.loginAttemptHistory.push({
      clientIp,
      failureReason,
      success: false,
      timestamp: new Date(),
      userAgent,
    })

    // IPアドレス別の試行履歴に追加
    const ipAttempts = this.ipAttempts.get(clientIp) ?? []
    ipAttempts.push({
      clientIp,
      failureReason,
      success: false,
      timestamp: new Date(),
      userAgent,
    })
    this.ipAttempts.set(clientIp, ipAttempts)

    // セキュリティイベントログ
    this.logSecurityEvent({
      clientIp,
      metadata: {
        failedAttempts: accountState.failedLoginAttempts,
        failureReason,
      },
      riskScore: this.calculateRiskScore(identifier, clientIp, userAgent),
      timestamp: new Date(),
      type: AuthEventType.LOGIN_FAILURE,
      userAgent,
      userId: identifier,
    })

    // アカウントロックの判定
    if (accountState.failedLoginAttempts >= this.config.maxFailedAttempts) {
      this.lockAccount(identifier, clientIp, userAgent)

      throw new AuthenticationError(
        `ログインに連続で失敗したため、アカウントをロックしました。${Math.ceil(this.config.lockoutDurationMs / 60_000)}分後に再試行してください`,
        {
          ...extensions,
          accountLocked: true,
          failedAttempts: accountState.failedLoginAttempts,
          lockoutDuration: this.config.lockoutDurationMs,
        }
      )
    }

    // 失敗メッセージの返却
    const remainingAttempts =
      this.config.maxFailedAttempts - accountState.failedLoginAttempts
    throw new AuthenticationError(
      `ログインに失敗しました。あと${remainingAttempts}回失敗するとアカウントがロックされます`,
      {
        ...extensions,
        failedAttempts: accountState.failedLoginAttempts,
        remainingAttempts,
      }
    )
  }

  /**
   * ログイン成功時の処理
   */
  public async onLoginSuccess(
    userId: string,
    clientIp: string,
    userAgent: string,
    extensions?: GraphQLErrorExtensions
  ): Promise<void> {
    const accountState = this.getAccountState(userId)

    // 成功ログイン記録
    accountState.lastSuccessfulLogin = new Date()
    accountState.failedLoginAttempts = 0
    accountState.isLocked = false
    accountState.lockoutUntil = undefined

    // ログイン履歴に追加
    accountState.loginAttemptHistory.push({
      clientIp,
      success: true,
      timestamp: new Date(),
      userAgent,
    })

    // 履歴の古いデータを削除（過去30日分のみ保持）
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    accountState.loginAttemptHistory = accountState.loginAttemptHistory.filter(
      (attempt) => attempt.timestamp > thirtyDaysAgo
    )

    // セキュリティイベントログ
    this.logSecurityEvent({
      clientIp,
      metadata: {
        lastLogin: accountState.lastSuccessfulLogin,
        previousFailedAttempts: accountState.failedLoginAttempts,
      },
      riskScore: this.calculateRiskScore(userId, clientIp, userAgent),
      timestamp: new Date(),
      type: AuthEventType.LOGIN_SUCCESS,
      userAgent,
      userId,
    })

    // 新しい場所からのログインチェック
    this.checkNewLocationLogin(userId, clientIp, userAgent, extensions)
  }

  /**
   * ログイン試行の前処理チェック
   */
  public async preLoginCheck(
    identifier: string, // email or username
    clientIp: string,
    userAgent: string,
    extensions?: GraphQLErrorExtensions
  ): Promise<void> {
    // アカウントロック状態のチェック
    const accountState = this.getAccountState(identifier)
    if (accountState.isLocked) {
      const remainingLockTime = accountState.lockoutUntil
        ? Math.max(0, accountState.lockoutUntil.getTime() - Date.now())
        : 0

      if (remainingLockTime > 0) {
        this.logSecurityEvent({
          clientIp,
          metadata: { remainingLockTime },
          riskScore: 100,
          timestamp: new Date(),
          type: AuthEventType.ACCOUNT_LOCKED,
          userAgent,
          userId: identifier,
        })

        throw new AuthenticationError(
          `アカウントがロックされています。${Math.ceil(remainingLockTime / 60_000)}分後に再試行してください`,
          {
            ...extensions,
            accountLocked: true,
            lockoutUntil: accountState.lockoutUntil,
            remainingLockTime,
          }
        )
      } else {
        // ロック期間が過ぎている場合は解除
        this.unlockAccount(identifier)
      }
    }

    // IPベースのレート制限チェック
    this.checkIpRateLimit(clientIp, extensions)

    // 疑わしい活動の検出
    const riskScore = this.calculateRiskScore(identifier, clientIp, userAgent)
    if (riskScore >= this.config.riskThresholds.high) {
      this.logSecurityEvent({
        clientIp,
        metadata: { riskScore },
        riskScore,
        timestamp: new Date(),
        type: AuthEventType.SUSPICIOUS_ACTIVITY,
        userAgent,
        userId: identifier,
      })

      throw new AuthenticationError(
        '疑わしい活動が検出されました。セキュリティのためアクセスを制限しています',
        {
          ...extensions,
          riskScore,
          suspiciousActivity: true,
        }
      )
    }
  }

  /**
   * リスクスコア計算
   */
  private calculateRiskScore(
    userId: string,
    clientIp: string,
    userAgent: string
  ): number {
    let score = 0

    const accountState = this.getAccountState(userId)

    // 失敗ログイン回数に基づくスコア
    score += Math.min(accountState.failedLoginAttempts * 15, 60)

    // IP別試行回数
    const ipAttempts = this.ipAttempts.get(clientIp) ?? []
    const recentIpAttempts = ipAttempts.filter(
      (attempt) => Date.now() - attempt.timestamp.getTime() < 60_000 // 1分以内
    )
    score += Math.min(recentIpAttempts.length * 5, 30)

    // 新しいIP/UAの組み合わせ
    const isNewDeviceSignature = !accountState.loginAttemptHistory.some(
      (attempt) =>
        attempt.clientIp === clientIp && attempt.userAgent === userAgent
    )
    if (isNewDeviceSignature) {
      score += 20
    }

    // 異常な時間帯のアクセス（深夜など）
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) {
      score += 10
    }

    return Math.min(score, 100)
  }

  /**
   * IPレート制限チェック
   */
  private checkIpRateLimit(
    clientIp: string,
    extensions?: GraphQLErrorExtensions
  ): void {
    const ipAttempts = this.ipAttempts.get(clientIp) ?? []
    const recentAttempts = ipAttempts.filter(
      (attempt) => Date.now() - attempt.timestamp.getTime() < 60_000 // 1分以内
    )

    if (recentAttempts.length >= 10) {
      // 1分間に10回まで
      throw new RateLimitError(10, 60_000, {
        ...extensions,
        clientIp,
        recentAttempts: recentAttempts.length,
      })
    }
  }

  /**
   * 新しい場所からのログインチェック
   */
  private checkNewLocationLogin(
    userId: string,
    clientIp: string,
    userAgent: string,
    extensions?: GraphQLErrorExtensions
  ): void {
    if (!this.config.enableGeoLocationCheck) {
      return
    }

    const accountState = this.getAccountState(userId)
    const recentLogins = accountState.loginAttemptHistory.filter(
      (attempt) =>
        attempt.success &&
        Date.now() - attempt.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // 30日以内
    )

    const isNewLocation = !recentLogins.some(
      (login) => login.clientIp === clientIp
    )

    if (isNewLocation && recentLogins.length > 0) {
      // 新しい場所からのログインを検出
      this.logSecurityEvent({
        clientIp,
        metadata: {
          previousIps: recentLogins.map((login) => login.clientIp).slice(0, 5),
          reason: 'new_location_login',
        },
        riskScore: 50,
        timestamp: new Date(),
        type: AuthEventType.SUSPICIOUS_ACTIVITY,
        userAgent,
        userId,
      })

      // 実際のアプリケーションでは、ここでメール通知などを送信
      logError('新しい場所からのログインが検出されました', {
        clientIp,
        extensions,
        userAgent,
        userId,
      })
    }
  }

  /**
   * アカウント状態の取得
   */
  private getAccountState(userId: string): AccountSecurityState {
    if (!this.accountStates.has(userId)) {
      this.accountStates.set(userId, {
        failedLoginAttempts: 0,
        isLocked: false,
        loginAttemptHistory: [],
        suspiciousActivityScore: 0,
        userId,
      })
    }
    return this.accountStates.get(userId)!
  }

  /**
   * アカウントロック
   */
  private lockAccount(
    userId: string,
    clientIp: string,
    userAgent: string
  ): void {
    const accountState = this.getAccountState(userId)
    accountState.isLocked = true
    accountState.lockoutUntil = new Date(
      Date.now() + this.config.lockoutDurationMs
    )

    this.logSecurityEvent({
      clientIp,
      metadata: {
        failedAttempts: accountState.failedLoginAttempts,
        lockoutUntil: accountState.lockoutUntil,
      },
      riskScore: 90,
      timestamp: new Date(),
      type: AuthEventType.ACCOUNT_LOCKED,
      userAgent,
      userId,
    })
  }

  /**
   * セキュリティイベントのログ記録
   */
  private logSecurityEvent(event: SecurityEvent): void {
    logError('セキュリティイベント', {
      clientIp: event.clientIp,
      eventType: event.type,
      metadata: event.metadata,
      riskScore: event.riskScore,
      timestamp: event.timestamp,
      userAgent: event.userAgent,
      userId: event.userId,
    })
  }

  /**
   * アカウントロック解除
   */
  private unlockAccount(userId: string): void {
    const accountState = this.getAccountState(userId)
    accountState.isLocked = false
    accountState.lockoutUntil = undefined
    accountState.failedLoginAttempts = 0

    this.logSecurityEvent({
      clientIp: 'system',
      metadata: {},
      riskScore: 0,
      timestamp: new Date(),
      type: AuthEventType.ACCOUNT_UNLOCKED,
      userAgent: 'system',
      userId,
    })
  }
}

/**
 * グローバル認証セキュリティコンテキスト
 */
export const authSecurityContext = new AuthSecurityContext()

/**
 * 開発環境用の認証セキュリティコンテキスト
 */
export function createDevelopmentAuthSecurityContext(): AuthSecurityContext {
  return new AuthSecurityContext({
    enableDeviceFingerprintCheck: false,
    enableGeoLocationCheck: false,
    enableSuspiciousActivityDetection: false,
    lockoutDurationMs: 5 * 60 * 1000, // 5分
    maxFailedAttempts: 10, // 開発時は緩く
    riskThresholds: {
      high: 90,
      low: 50,
      medium: 70,
    },
  })
}

/**
 * 本番環境用の認証セキュリティコンテキスト
 */
export function createProductionAuthSecurityContext(): AuthSecurityContext {
  return new AuthSecurityContext({
    enableDeviceFingerprintCheck: true,
    enableGeoLocationCheck: true,
    enableSuspiciousActivityDetection: true,
    lockoutDurationMs: 30 * 60 * 1000, // 30分
    maxFailedAttempts: 5,
    riskThresholds: {
      high: 80,
      low: 30,
      medium: 60,
    },
  })
}
