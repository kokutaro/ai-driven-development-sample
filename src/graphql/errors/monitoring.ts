/**
 * GraphQLエラー監視・アラートシステム
 *
 * プロダクション環境でのリアルタイムエラー監視、
 * メトリクス収集、アラート機能を提供します。
 */
import { ErrorSeverity } from './custom-errors'
import { getLogger } from './logger'

import type { BaseGraphQLError, ErrorCategory } from './custom-errors'
import type { StructuredLogger } from './logger'

/**
 * アラートアクションの型定義
 */
export interface AlertAction {
  config: Record<string, any>
  type: 'email' | 'slack' | 'sms' | 'webhook'
}

/**
 * アラート条件の型定義
 */
export interface AlertCondition {
  actions: AlertAction[]
  condition: AlertRule
  cooldownPeriod: number // 秒
  description: string
  enabled: boolean
  id: string
  lastTriggered?: Date
  name: string
}

/**
 * アラートルールの型定義
 */
export interface AlertRule {
  groupBy?: string[]
  metric: string
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte'
  timeWindow: number // 秒
  type: 'pattern' | 'rate' | 'threshold'
  value: number
}

/**
 * エラーメトリクスの型定義
 */
export interface ErrorMetrics {
  category: ErrorCategory
  count: number
  duration?: number
  errorCode: string
  fieldPath?: string
  operationName?: string
  requestId?: string
  severity: ErrorSeverity
  timestamp: string
  userId?: string
}

/**
 * ヘルスチェック結果の型定義
 */
export interface HealthCheckResult {
  checks: Record<
    string,
    {
      duration?: number
      message?: string
      status: 'fail' | 'pass' | 'warn'
    }
  >
  metrics: {
    averageResponseTime: number
    errorRate: number
    throughput: number
  }
  service: string
  status: 'degraded' | 'healthy' | 'unhealthy'
  timestamp: string
}

/**
 * エラー監視システム
 */
export class GraphQLErrorMonitor {
  private readonly alertConditions = new Map<string, AlertCondition>()
  private healthCheckInterval?: NodeJS.Timeout
  private readonly healthChecks = new Map<string, Function>()
  private readonly logger: StructuredLogger
  private readonly metricsBuffer: ErrorMetrics[] = []

  private metricsFlushInterval?: NodeJS.Timeout
  private readonly metricsStore = new Map<string, ErrorMetrics[]>()

  constructor() {
    this.logger = getLogger()
    this.setupDefaultAlerts()
    this.startMetricsFlush()
    this.startHealthChecks()
  }

  /**
   * アラート条件を追加
   */
  addAlertCondition(condition: AlertCondition): void {
    this.alertConditions.set(condition.id, condition)
  }

  /**
   * ヘルスチェックを実行
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      checks: {},
      metrics: {
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0,
      },
      service: 'graphql-api',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    }

    // ヘルスチェック実行
    for (const [name, checkFn] of this.healthChecks) {
      try {
        const startTime = Date.now()
        const checkResult = await checkFn()
        const duration = Date.now() - startTime

        result.checks[name] = {
          duration,
          status: checkResult ? 'pass' : 'fail',
        }
      } catch (error) {
        result.checks[name] = {
          message: error instanceof Error ? error.message : String(error),
          status: 'fail',
        }
      }
    }

    // 全体ステータスを決定
    const statuses = new Set(Object.values(result.checks).map((c) => c.status))
    if (statuses.has('fail')) {
      result.status = 'unhealthy'
    } else if (statuses.has('warn')) {
      result.status = 'degraded'
    }

    // メトリクス計算
    result.metrics = this.calculateHealthMetrics()

    return result
  }

  /**
   * エラーメトリクスを記録
   */
  recordError(
    error: BaseGraphQLError,
    context?: {
      duration?: number
      fieldPath?: string
      operationName?: string
    }
  ): void {
    const metrics: ErrorMetrics = {
      category: error.category,
      count: 1,
      duration: context?.duration,
      errorCode: error.extensions.code as string,
      fieldPath: context?.fieldPath,
      operationName: context?.operationName,
      requestId: error.requestId,
      severity: error.severity,
      timestamp: new Date().toISOString(),
      userId: error.userId,
    }

    this.metricsBuffer.push(metrics)
    this.checkAlertConditions(metrics)

    // 高重要度エラーは即座にログ出力
    if (
      error.severity === ErrorSeverity.CRITICAL ||
      error.severity === ErrorSeverity.HIGH
    ) {
      this.logger.error(
        'High severity GraphQL error detected',
        error.toLogData()
      )
    }
  }

  /**
   * パフォーマンスメトリクスを記録
   */
  recordPerformance(
    operationName: string,
    duration: number,
    complexity?: number
  ): void {
    const metrics = {
      complexity,
      duration,
      operationName,
      timestamp: new Date().toISOString(),
      type: 'performance',
    }

    // パフォーマンス閾値チェック
    if (duration > 5000) {
      // 5秒以上
      this.logger.warn('Slow GraphQL operation detected', metrics)
    }

    this.updateTimeSeriesMetrics('performance', metrics)
  }

  /**
   * アラート条件を削除
   */
  removeAlertCondition(id: string): void {
    this.alertConditions.delete(id)
  }

  /**
   * 監視を停止
   */
  stop(): void {
    if (this.metricsFlushInterval) {
      clearInterval(this.metricsFlushInterval)
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
  }

  /**
   * ヘルスメトリクスを計算
   */
  private calculateHealthMetrics(): HealthCheckResult['metrics'] {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    // 過去1時間のメトリクス
    const recentMetrics = this.metricsBuffer.filter(
      (m) => new Date(m.timestamp).getTime() > oneHourAgo
    )

    const totalRequests = recentMetrics.length || 1 // ゼロ除算を防ぐ
    const errorCount = recentMetrics.filter(
      (m) =>
        m.severity === ErrorSeverity.HIGH ||
        m.severity === ErrorSeverity.CRITICAL
    ).length

    const averageResponseTime =
      recentMetrics
        .filter((m) => m.duration)
        .reduce((sum, m) => sum + (m.duration || 0), 0) / totalRequests

    return {
      averageResponseTime,
      errorRate: errorCount / totalRequests,
      throughput: totalRequests / 3600, // 1時間あたりのリクエスト数
    }
  }

  /**
   * アラート条件をチェック
   */
  private checkAlertConditions(metrics: ErrorMetrics): void {
    for (const [id, condition] of this.alertConditions) {
      if (!condition.enabled) continue

      // クールダウン期間チェック
      if (this.isInCooldown(condition)) continue

      if (this.evaluateAlertRule(condition.condition, metrics)) {
        this.triggerAlert(condition, metrics)
      }
    }
  }

  /**
   * 値の比較
   */
  private compareValues(
    actual: number,
    operator: string,
    expected: number
  ): boolean {
    switch (operator) {
      case 'eq': {
        return actual === expected
      }
      case 'gt': {
        return actual > expected
      }
      case 'gte': {
        return actual >= expected
      }
      case 'lt': {
        return actual < expected
      }
      case 'lte': {
        return actual <= expected
      }
      default: {
        return false
      }
    }
  }

  /**
   * エラースパイクを検出
   */
  private detectErrorSpike(metrics: ErrorMetrics[]): boolean {
    const recent = metrics.slice(-10) // 最新10件
    const previous = metrics.slice(-20, -10) // その前の10件

    if (previous.length === 0) return false

    const recentRate = recent.length / 10
    const previousRate = previous.length / 10

    // 最近のエラー率が以前の2倍以上の場合をスパイクとみなす
    return recentRate > previousRate * 2 && recentRate > 0.5
  }

  /**
   * アラートルールを評価
   */
  private evaluateAlertRule(rule: AlertRule, metrics: ErrorMetrics): boolean {
    const timeWindow = rule.timeWindow * 1000 // ミリ秒に変換
    const now = Date.now()
    const windowStart = now - timeWindow

    // 時間窓内のメトリクスを取得
    const relevantMetrics = this.metricsBuffer.filter((m) => {
      const timestamp = new Date(m.timestamp).getTime()
      return timestamp >= windowStart && timestamp <= now
    })

    switch (rule.type) {
      case 'pattern': {
        return this.evaluatePatternRule(rule, relevantMetrics)
      }
      case 'rate': {
        return this.evaluateRateRule(rule, relevantMetrics, timeWindow)
      }
      case 'threshold': {
        return this.evaluateThresholdRule(rule, relevantMetrics)
      }
      default: {
        return false
      }
    }
  }

  /**
   * パターンルールを評価
   */
  private evaluatePatternRule(
    rule: AlertRule,
    metrics: ErrorMetrics[]
  ): boolean {
    // 特定のパターンを検出（例：連続したエラー、エラーの急増など）
    if (rule.metric === 'consecutive_errors') {
      const consecutiveCount = this.getConsecutiveErrorCount(metrics)
      return this.compareValues(consecutiveCount, rule.operator, rule.value)
    }

    if (rule.metric === 'error_spike') {
      const isSpike = this.detectErrorSpike(metrics)
      return isSpike
    }

    return false
  }

  /**
   * レートルールを評価
   */
  private evaluateRateRule(
    rule: AlertRule,
    metrics: ErrorMetrics[],
    timeWindow: number
  ): boolean {
    const rate = (metrics.length / timeWindow) * 1000 // 1秒あたりのレート
    return this.compareValues(rate, rule.operator, rule.value)
  }

  /**
   * 閾値ルールを評価
   */
  private evaluateThresholdRule(
    rule: AlertRule,
    metrics: ErrorMetrics[]
  ): boolean {
    let value: number

    switch (rule.metric) {
      case 'critical_errors': {
        value = metrics.filter(
          (m) => m.severity === ErrorSeverity.CRITICAL
        ).length
        break
      }
      case 'error_count': {
        value = metrics.length
        break
      }
      case 'high_errors': {
        value = metrics.filter((m) => m.severity === ErrorSeverity.HIGH).length
        break
      }
      default: {
        return false
      }
    }

    return this.compareValues(value, rule.operator, rule.value)
  }

  /**
   * アラートアクションを実行
   */
  private async executeAlertAction(
    action: AlertAction,
    condition: AlertCondition,
    metrics: ErrorMetrics
  ): Promise<void> {
    switch (action.type) {
      case 'email': {
        await this.sendEmailAlert(action.config, condition, metrics)
        break
      }
      case 'slack': {
        await this.sendSlackAlert(action.config, condition, metrics)
        break
      }
      case 'sms': {
        await this.sendSmsAlert(action.config, condition, metrics)
        break
      }
      case 'webhook': {
        await this.sendWebhookAlert(action.config, condition, metrics)
        break
      }
    }
  }

  /**
   * アラートの色を取得
   */
  private getAlertColor(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL: {
        return '#ff0000'
      }
      case ErrorSeverity.HIGH: {
        return '#ff8800'
      }
      case ErrorSeverity.LOW: {
        return '#00aa00'
      }
      case ErrorSeverity.MEDIUM: {
        return '#ffaa00'
      }
      default: {
        return '#888888'
      }
    }
  }

  /**
   * 連続エラー数を取得
   */
  private getConsecutiveErrorCount(metrics: ErrorMetrics[]): number {
    let consecutiveCount = 0
    for (let i = metrics.length - 1; i >= 0; i--) {
      if (
        metrics[i].severity === ErrorSeverity.CRITICAL ||
        metrics[i].severity === ErrorSeverity.HIGH
      ) {
        consecutiveCount++
      } else {
        break
      }
    }
    return consecutiveCount
  }

  /**
   * クールダウン期間中かチェック
   */
  private isInCooldown(condition: AlertCondition): boolean {
    if (!condition.lastTriggered) return false

    const now = Date.now()
    const lastTriggered = condition.lastTriggered.getTime()
    const cooldownMs = condition.cooldownPeriod * 1000

    return now - lastTriggered < cooldownMs
  }

  /**
   * メールアラートを送信（プレースホルダー）
   */
  private async sendEmailAlert(
    config: any,
    condition: AlertCondition,
    metrics: ErrorMetrics
  ): Promise<void> {
    // 実際の実装では外部メールサービス（SendGrid、SESなど）を使用
    this.logger.info('Email alert would be sent', {
      metrics,
      subject: `GraphQL Alert: ${condition.name}`,
      to: config.recipients,
    })
  }

  /**
   * Slackアラートを送信
   */
  private async sendSlackAlert(
    config: any,
    condition: AlertCondition,
    metrics: ErrorMetrics
  ): Promise<void> {
    const message = {
      attachments: [
        {
          color: this.getAlertColor(metrics.severity),
          fields: [
            { short: true, title: 'Error Code', value: metrics.errorCode },
            { short: true, title: 'Category', value: metrics.category },
            { short: true, title: 'Severity', value: metrics.severity },
            {
              short: true,
              title: 'Operation',
              value: metrics.operationName || 'Unknown',
            },
            {
              short: true,
              title: 'Request ID',
              value: metrics.requestId || 'Unknown',
            },
            {
              short: true,
              title: 'User ID',
              value: metrics.userId || 'Unknown',
            },
          ],
          timestamp: Math.floor(new Date(metrics.timestamp).getTime() / 1000),
        },
      ],
      text: `🚨 GraphQL Alert: ${condition.name}`,
    }

    await fetch(config.webhookUrl, {
      body: JSON.stringify(message),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
  }

  /**
   * SMSアラートを送信（プレースホルダー）
   */
  private async sendSmsAlert(
    config: any,
    condition: AlertCondition,
    metrics: ErrorMetrics
  ): Promise<void> {
    // 実際の実装では外部SMSサービス（Twilio、SNSなど）を使用
    this.logger.info('SMS alert would be sent', {
      message: `GraphQL Alert: ${condition.name} - ${metrics.errorCode}`,
      metrics,
      to: config.phoneNumber,
    })
  }

  /**
   * Webhookアラートを送信
   */
  private async sendWebhookAlert(
    config: any,
    condition: AlertCondition,
    metrics: ErrorMetrics
  ): Promise<void> {
    const payload = {
      alertId: condition.id,
      alertName: condition.name,
      metrics,
      severity: metrics.severity,
      timestamp: metrics.timestamp,
    }

    await fetch(config.url, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      method: 'POST',
    })
  }

  /**
   * デフォルトアラート設定
   */
  private setupDefaultAlerts(): void {
    // 高重要度エラーアラート
    this.addAlertCondition({
      actions: [
        {
          config: {
            webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
          },
          type: 'slack',
        },
      ],
      condition: {
        metric: 'critical_errors',
        operator: 'gte',
        timeWindow: 300, // 5分
        type: 'threshold',
        value: 1,
      },
      cooldownPeriod: 900, // 15分
      description: 'Critical severity errors detected',
      enabled: true,
      id: 'critical-errors',
      name: 'Critical Errors',
    })

    // エラー率アラート
    this.addAlertCondition({
      actions: [
        {
          config: {
            url: process.env.MONITORING_WEBHOOK_URL || '',
          },
          type: 'webhook',
        },
      ],
      condition: {
        metric: 'error_count',
        operator: 'gt',
        timeWindow: 300,
        type: 'rate',
        value: 0.1, // 1秒あたり0.1エラー
      },
      cooldownPeriod: 600, // 10分
      description: 'Error rate exceeds threshold',
      enabled: true,
      id: 'error-rate',
      name: 'High Error Rate',
    })
  }

  /**
   * ヘルスチェックを開始
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.performHealthCheck()

      if (health.status !== 'healthy') {
        this.logger.warn('Health check failed', health)
      }
    }, 30_000) // 30秒ごと
  }

  /**
   * メトリクスのフラッシュを開始
   */
  private startMetricsFlush(): void {
    this.metricsFlushInterval = setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.logger.info('Flushing metrics buffer', {
          metricsCount: this.metricsBuffer.length,
        })

        // 古いメトリクスをクリア（メモリ使用量を制限）
        const oneHourAgo = Date.now() - 60 * 60 * 1000
        const filtered = this.metricsBuffer.filter(
          (m) => new Date(m.timestamp).getTime() > oneHourAgo
        )
        this.metricsBuffer.length = 0
        this.metricsBuffer.push(...filtered)
      }
    }, 60_000) // 1分ごと
  }

  /**
   * アラートをトリガー
   */
  private async triggerAlert(
    condition: AlertCondition,
    metrics: ErrorMetrics
  ): Promise<void> {
    this.logger.warn('Alert triggered', {
      alertId: condition.id,
      alertName: condition.name,
      metrics,
    })

    condition.lastTriggered = new Date()

    // アラートアクションを実行
    for (const action of condition.actions) {
      try {
        await this.executeAlertAction(action, condition, metrics)
      } catch (error) {
        this.logger.error('Failed to execute alert action', error, {
          actionType: action.type,
          alertId: condition.id,
        })
      }
    }
  }

  /**
   * 時系列メトリクスを更新
   */
  private updateTimeSeriesMetrics(key: string, data: any): void {
    if (!this.metricsStore.has(key)) {
      this.metricsStore.set(key, [])
    }

    const metrics = this.metricsStore.get(key)!
    metrics.push(data)

    // 古いメトリクスを削除（24時間以上古い）
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const filtered = metrics.filter(
      (m) => new Date(m.timestamp).getTime() > oneDayAgo
    )
    this.metricsStore.set(key, filtered)
  }
}

/**
 * グローバル監視インスタンス
 */
let globalMonitor: GraphQLErrorMonitor | null = null

/**
 * グローバル監視システムを取得
 */
export function getErrorMonitor(): GraphQLErrorMonitor {
  if (!globalMonitor) {
    globalMonitor = initializeErrorMonitoring()
  }
  return globalMonitor
}

/**
 * 監視システムを初期化
 */
export function initializeErrorMonitoring(): GraphQLErrorMonitor {
  if (!globalMonitor) {
    globalMonitor = new GraphQLErrorMonitor()
  }
  return globalMonitor
}
