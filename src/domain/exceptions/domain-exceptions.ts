/**
 * ドメイン例外の基底クラス
 */
export abstract class DomainException extends Error {
  /**
   * エラーコードを取得します
   */
  abstract readonly code: string

  /**
   * エラー詳細を取得します
   */
  readonly details?: Record<string, unknown>

  /**
   * DomainExceptionを作成します
   *
   * @param message - エラーメッセージ
   * @param details - エラー詳細
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.details = details

    // スタックトレースを正しく設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * エラー情報をJSON形式で取得します
   *
   * @returns エラー情報
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      details: this.details,
      message: this.message,
      name: this.name,
    }
  }
}

/**
 * 認可例外
 *
 * ユーザーがリソースにアクセスする権限がない場合に発生します。
 */
export class AuthorizationException extends DomainException {
  readonly code = 'AUTHORIZATION_ERROR'

  /**
   * AuthorizationExceptionを作成します
   *
   * @param userId - ユーザーID
   * @param resource - アクセスしようとしたリソース
   * @param action - 実行しようとしたアクション（任意）
   */
  constructor(userId: string, resource: string, action?: string) {
    const message = action
      ? `User '${userId}' is not authorized to '${action}' on '${resource}'`
      : `User '${userId}' is not authorized to access '${resource}'`

    super(message, { action, resource, userId })
  }
}

/**
 * ビジネスルール違反例外
 *
 * ドメインのビジネスルールに違反した場合に発生します。
 */
export class BusinessRuleViolationException extends DomainException {
  readonly code = 'BUSINESS_RULE_VIOLATION'

  /**
   * BusinessRuleViolationExceptionを作成します
   *
   * @param ruleName - 違反したビジネスルール名
   * @param message - エラーメッセージ
   * @param context - 違反時のコンテキスト情報（任意）
   */
  constructor(
    ruleName: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ruleName, ...context })
  }
}

/**
 * 同時実行例外
 *
 * 楽観的ロックやバージョン競合が発生した場合に発生します。
 */
export class ConcurrencyException extends DomainException {
  readonly code = 'CONCURRENCY_ERROR'

  /**
   * ConcurrencyExceptionを作成します
   *
   * @param entityType - エンティティの種類
   * @param id - エンティティのID
   * @param expectedVersion - 期待されたバージョン（任意）
   * @param actualVersion - 実際のバージョン（任意）
   */
  constructor(
    entityType: string,
    id: string,
    expectedVersion?: number,
    actualVersion?: number
  ) {
    const message =
      expectedVersion !== undefined && actualVersion !== undefined
        ? `Concurrency conflict detected for ${entityType} '${id}': expected version ${expectedVersion}, but was ${actualVersion}`
        : `Concurrency conflict detected for ${entityType} '${id}'`

    super(message, { actualVersion, entityType, expectedVersion, id })
  }
}

/**
 * 設定例外
 *
 * システム設定に問題がある場合に発生します。
 */
export class ConfigurationException extends DomainException {
  readonly code = 'CONFIGURATION_ERROR'

  /**
   * ConfigurationExceptionを作成します
   *
   * @param setting - 設定項目名
   * @param message - エラーメッセージ
   * @param expectedFormat - 期待される形式（任意）
   */
  constructor(setting: string, message: string, expectedFormat?: string) {
    super(message, { expectedFormat, setting })
  }
}

/**
 * 重複例外
 *
 * 一意性制約に違反した場合に発生します。
 */
export class DuplicateException extends DomainException {
  readonly code = 'DUPLICATE_ERROR'

  /**
   * DuplicateExceptionを作成します
   *
   * @param resource - リソースの種類
   * @param value - 重複した値
   * @param field - 重複したフィールド名（任意）
   */
  constructor(resource: string, value: string, field?: string) {
    const message = field
      ? `${resource} with ${field} '${value}' already exists`
      : `${resource} '${value}' already exists`

    super(message, { field, resource, value })
  }
}

/**
 * エンティティが見つからない例外
 *
 * 指定されたIDのエンティティが存在しない場合に発生します。
 */
export class EntityNotFoundException extends DomainException {
  readonly code = 'ENTITY_NOT_FOUND'

  /**
   * EntityNotFoundExceptionを作成します
   *
   * @param entityType - エンティティの種類
   * @param id - 見つからなかったID
   */
  constructor(entityType: string, id: string) {
    super(`${entityType} with ID '${id}' was not found`, { entityType, id })
  }
}

/**
 * 不正な状態遷移例外
 *
 * エンティティの状態遷移が不正な場合に発生します。
 */
export class InvalidStateTransitionException extends DomainException {
  readonly code = 'INVALID_STATE_TRANSITION'

  /**
   * InvalidStateTransitionExceptionを作成します
   *
   * @param fromState - 遷移元の状態
   * @param toState - 遷移先の状態
   * @param entityType - エンティティの種類（任意）
   */
  constructor(fromState: string, toState: string, entityType?: string) {
    const message = entityType
      ? `Cannot transition ${entityType} from '${fromState}' to '${toState}'`
      : `Cannot transition from '${fromState}' to '${toState}'`

    super(message, { entityType, fromState, toState })
  }
}

/**
 * リソース制限例外
 *
 * リソースの制限（最大件数など）に達した場合に発生します。
 */
export class ResourceLimitException extends DomainException {
  readonly code = 'RESOURCE_LIMIT_EXCEEDED'

  /**
   * ResourceLimitExceptionを作成します
   *
   * @param resource - リソースの種類
   * @param limit - 制限値
   * @param current - 現在値（任意）
   */
  constructor(resource: string, limit: number, current?: number) {
    const message =
      current === undefined
        ? `${resource} limit of ${limit} exceeded`
        : `${resource} limit of ${limit} exceeded (current: ${current})`

    super(message, { current, limit, resource })
  }
}

/**
 * バリデーション例外
 *
 * 値オブジェクトやエンティティのバリデーション失敗時に発生します。
 */
export class ValidationException extends DomainException {
  readonly code = 'VALIDATION_ERROR'

  /**
   * ValidationExceptionを作成します
   *
   * @param message - バリデーションエラーメッセージ
   * @param field - エラーが発生したフィールド名（任意）
   * @param value - エラーが発生した値（任意）
   */
  constructor(message: string, field?: string, value?: unknown) {
    super(message, { field, value })
  }
}

/**
 * TODO固有の例外
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TodoExceptions {
  /**
   * 期限日例外
   */
  export class DueDateException extends BusinessRuleViolationException {
    constructor(message: string, context?: Record<string, unknown>) {
      super('DUE_DATE_RULE', message, context)
    }
  }

  /**
   * 優先度例外
   */
  export class PriorityException extends BusinessRuleViolationException {
    constructor(message: string, context?: Record<string, unknown>) {
      super('PRIORITY_RULE', message, context)
    }
  }

  /**
   * サブタスク例外
   */
  export class SubTaskException extends BusinessRuleViolationException {
    constructor(message: string, context?: Record<string, unknown>) {
      super('SUBTASK_RULE', message, context)
    }
  }

  /**
   * TODO作成例外
   */
  export class TodoCreationException extends BusinessRuleViolationException {
    constructor(message: string, context?: Record<string, unknown>) {
      super('TODO_CREATION_RULE', message, context)
    }
  }

  /**
   * TODO更新例外
   */
  export class TodoUpdateException extends BusinessRuleViolationException {
    constructor(message: string, context?: Record<string, unknown>) {
      super('TODO_UPDATE_RULE', message, context)
    }
  }
}
