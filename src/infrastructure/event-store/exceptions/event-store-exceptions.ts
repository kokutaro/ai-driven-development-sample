/**
 * EventStore関連の例外クラス
 */

/**
 * アグリゲートが見つからない例外
 *
 * 指定されたアグリゲートIDのイベントが存在しない場合に発生します。
 */
export class AggregateNotFoundException extends Error {
  public readonly aggregateId: string

  constructor(aggregateId: string) {
    super(`Aggregate not found: ${aggregateId}`)

    this.name = 'AggregateNotFoundException'
    this.aggregateId = aggregateId

    // スタックトレースを正しく設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AggregateNotFoundException)
    }
  }
}

/**
 * 楽観的同時実行制御例外
 *
 * アグリゲートのバージョンが期待値と異なる場合に発生します。
 */
export class ConcurrencyException extends Error {
  public readonly actualVersion: number
  public readonly aggregateId: string
  public readonly expectedVersion: number

  constructor(
    aggregateId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    const message = `Concurrency conflict for aggregate ${aggregateId}. Expected version: ${expectedVersion}, Actual version: ${actualVersion}`
    super(message)

    this.name = 'ConcurrencyException'
    this.aggregateId = aggregateId
    this.expectedVersion = expectedVersion
    this.actualVersion = actualVersion

    // スタックトレースを正しく設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConcurrencyException)
    }
  }

  /**
   * エラーの詳細情報を取得します
   */
  getDetails(): {
    actualVersion: number
    aggregateId: string
    expectedVersion: number
    versionDifference: number
  } {
    return {
      actualVersion: this.actualVersion,
      aggregateId: this.aggregateId,
      expectedVersion: this.expectedVersion,
      versionDifference: this.actualVersion - this.expectedVersion,
    }
  }

  /**
   * リトライ可能かどうかを判断します
   */
  isRetryable(): boolean {
    // バージョンの差が小さい場合はリトライ可能と判断
    return Math.abs(this.actualVersion - this.expectedVersion) <= 3
  }
}

/**
 * イベントシリアライゼーション例外
 *
 * イベントのシリアライズ・デシリアライズで発生するエラーです。
 */
export class EventSerializationException extends Error {
  public readonly aggregateId?: string
  public readonly cause?: Error
  public readonly eventType?: string

  constructor(
    message: string,
    eventType?: string,
    aggregateId?: string,
    cause?: Error
  ) {
    super(message)

    this.name = 'EventSerializationException'
    this.eventType = eventType
    this.aggregateId = aggregateId
    this.cause = cause

    // スタックトレースを正しく設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EventSerializationException)
    }
  }

  /**
   * エラーの詳細情報を取得します
   */
  getDetails(): {
    aggregateId?: string
    causeMessage?: string
    eventType?: string
    message: string
  } {
    return {
      aggregateId: this.aggregateId,
      causeMessage: this.cause?.message,
      eventType: this.eventType,
      message: this.message,
    }
  }
}

/**
 * EventStore設定例外
 *
 * EventStoreの設定に問題がある場合に発生します。
 */
export class EventStoreConfigurationException extends Error {
  public readonly configKey?: string
  public readonly configValue?: boolean | number | string

  constructor(
    message: string,
    configKey?: string,
    configValue?: boolean | number | string
  ) {
    super(message)

    this.name = 'EventStoreConfigurationException'
    this.configKey = configKey
    this.configValue = configValue

    // スタックトレースを正しく設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EventStoreConfigurationException)
    }
  }
}

/**
 * EventStore一般例外
 *
 * EventStore操作で発生する一般的なエラーです。
 */
export class EventStoreException extends Error {
  public readonly aggregateId?: string
  public readonly cause?: Error
  public readonly operation?: string

  constructor(
    message: string,
    cause?: Error,
    operation?: string,
    aggregateId?: string
  ) {
    super(message)

    this.name = 'EventStoreException'
    this.cause = cause
    this.operation = operation
    this.aggregateId = aggregateId

    // スタックトレースを正しく設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EventStoreException)
    }
  }

  /**
   * エラーの詳細情報を取得します
   */
  getDetails(): {
    aggregateId?: string
    causeMessage?: string
    message: string
    operation?: string
    timestamp: Date
  } {
    return {
      aggregateId: this.aggregateId,
      causeMessage: this.cause?.message,
      message: this.message,
      operation: this.operation,
      timestamp: new Date(),
    }
  }

  /**
   * データベース関連のエラーかどうかを判断します
   */
  isDatabaseError(): boolean {
    if (!this.cause) return false

    const causeMessage = this.cause.message.toLowerCase()
    return (
      causeMessage.includes('connection') ||
      causeMessage.includes('timeout') ||
      causeMessage.includes('database') ||
      causeMessage.includes('sql')
    )
  }

  /**
   * リトライ可能かどうかを判断します
   */
  isRetryable(): boolean {
    if (!this.cause) return false

    const causeMessage = this.cause.message.toLowerCase()

    // 一時的なエラーはリトライ可能
    return (
      causeMessage.includes('timeout') ||
      causeMessage.includes('connection reset') ||
      causeMessage.includes('connection refused') ||
      causeMessage.includes('temporary failure')
    )
  }
}
