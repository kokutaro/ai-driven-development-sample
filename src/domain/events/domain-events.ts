/**
 * ドメインイベントの基底インターフェース
 */
export interface DomainEvent {
  aggregateId: string
  eventType: string
  occurredAt: Date
  payload: Record<string, unknown>
}

/**
 * ドメインイベントの基底クラス
 */
abstract class BaseDomainEvent implements DomainEvent {
  /**
   * アグリゲートIDを取得します
   */
  get aggregateId(): string {
    return this._aggregateId
  }

  /**
   * イベントタイプを取得します
   */
  get eventType(): string {
    return this._eventType
  }

  /**
   * 発生日時を取得します
   */
  get occurredAt(): Date {
    return this._occurredAt
  }

  /**
   * ペイロードを取得します
   */
  get payload(): Record<string, unknown> {
    return this._payload
  }

  private readonly _aggregateId: string

  private readonly _eventType: string

  private readonly _occurredAt: Date

  private readonly _payload: Record<string, unknown>

  /**
   * BaseDomainEventを作成します
   *
   * @param aggregateId - アグリゲートID
   * @param eventType - イベントタイプ
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  protected constructor(
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>,
    occurredAt?: Date
  ) {
    this._aggregateId = aggregateId
    this._eventType = eventType
    this._payload = payload
    this._occurredAt = occurredAt ?? new Date()
  }
}

/**
 * SubTaskAddedEvent - サブタスク追加イベント
 */
export class SubTaskAddedEvent extends BaseDomainEvent {
  /**
   * 順序を取得します
   */
  get order(): number {
    return this.payload.order as number
  }

  /**
   * サブタスクIDを取得します
   */
  get subTaskId(): string {
    return this.payload.subTaskId as string
  }

  /**
   * タイトルを取得します
   */
  get title(): string {
    return this.payload.title as string
  }

  /**
   * SubTaskAddedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      order: number
      subTaskId: string
      title: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'SubTaskAdded', payload, occurredAt)
  }
}

/**
 * SubTaskRemovedEvent - サブタスク削除イベント
 */
export class SubTaskRemovedEvent extends BaseDomainEvent {
  /**
   * サブタスクIDを取得します
   */
  get subTaskId(): string {
    return this.payload.subTaskId as string
  }

  /**
   * タイトルを取得します
   */
  get title(): string {
    return this.payload.title as string
  }

  /**
   * SubTaskRemovedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      subTaskId: string
      title: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'SubTaskRemoved', payload, occurredAt)
  }
}

/**
 * TodoCancelledEvent - TODOキャンセルイベント
 */
export class TodoCancelledEvent extends BaseDomainEvent {
  /**
   * キャンセル日時を取得します
   */
  get cancelledAt(): string {
    return this.payload.cancelledAt as string
  }

  /**
   * TodoCancelledEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      cancelledAt: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'TodoCancelled', payload, occurredAt)
  }
}

/**
 * TodoCompletedEvent - TODO完了イベント
 */
export class TodoCompletedEvent extends BaseDomainEvent {
  /**
   * 完了日時を取得します
   */
  get completedAt(): string {
    return this.payload.completedAt as string
  }

  /**
   * TodoCompletedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      completedAt: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'TodoCompleted', payload, occurredAt)
  }
}

/**
 * TODOCreatedEvent - TODO作成イベント
 */
export class TodoCreatedEvent extends BaseDomainEvent {
  /**
   * 優先度を取得します
   */
  get priority(): string {
    return this.payload.priority as string
  }

  /**
   * ステータスを取得します
   */
  get status(): string {
    return this.payload.status as string
  }

  /**
   * タイトルを取得します
   */
  get title(): string {
    return this.payload.title as string
  }

  /**
   * TodoCreatedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      priority: string
      status: string
      title: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'TodoCreated', payload, occurredAt)
  }
}

/**
 * TodoDescriptionUpdatedEvent - TODO説明更新イベント
 */
export class TodoDescriptionUpdatedEvent extends BaseDomainEvent {
  /**
   * 新しい説明を取得します
   */
  get newDescription(): string | undefined {
    return this.payload.newDescription as string | undefined
  }

  /**
   * 古い説明を取得します
   */
  get oldDescription(): string | undefined {
    return this.payload.oldDescription as string | undefined
  }

  /**
   * TodoDescriptionUpdatedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      newDescription?: string
      oldDescription?: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'TodoDescriptionUpdated', payload, occurredAt)
  }
}

/**
 * TodoDueDateUpdatedEvent - TODO期限日更新イベント
 */
export class TodoDueDateUpdatedEvent extends BaseDomainEvent {
  /**
   * 新しい期限日を取得します
   */
  get newDueDate(): string | undefined {
    return this.payload.newDueDate as string | undefined
  }

  /**
   * 古い期限日を取得します
   */
  get oldDueDate(): string | undefined {
    return this.payload.oldDueDate as string | undefined
  }

  /**
   * TodoDueDateUpdatedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      newDueDate?: string
      oldDueDate?: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'TodoDueDateUpdated', payload, occurredAt)
  }
}

/**
 * TodoPriorityChangedEvent - TODO優先度変更イベント
 */
export class TodoPriorityChangedEvent extends BaseDomainEvent {
  /**
   * 新しい優先度を取得します
   */
  get newPriority(): string {
    return this.payload.newPriority as string
  }

  /**
   * 古い優先度を取得します
   */
  get oldPriority(): string {
    return this.payload.oldPriority as string
  }

  /**
   * TodoPriorityChangedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      newPriority: string
      oldPriority: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'TodoPriorityChanged', payload, occurredAt)
  }
}

/**
 * TodoReopenedEvent - TODO再オープンイベント
 */
export class TodoReopenedEvent extends BaseDomainEvent {
  /**
   * 再オープン日時を取得します
   */
  get reopenedAt(): string {
    return this.payload.reopenedAt as string
  }

  /**
   * TodoReopenedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      reopenedAt: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'TodoReopened', payload, occurredAt)
  }
}

/**
 * TodoStartedEvent - TODO開始イベント
 */
export class TodoStartedEvent extends BaseDomainEvent {
  /**
   * 開始日時を取得します
   */
  get startedAt(): string {
    return this.payload.startedAt as string
  }

  /**
   * TodoStartedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      startedAt: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'TodoStarted', payload, occurredAt)
  }
}

/**
 * TodoTitleUpdatedEvent - TODOタイトル更新イベント
 */
export class TodoTitleUpdatedEvent extends BaseDomainEvent {
  /**
   * 新しいタイトルを取得します
   */
  get newTitle(): string {
    return this.payload.newTitle as string
  }

  /**
   * 古いタイトルを取得します
   */
  get oldTitle(): string {
    return this.payload.oldTitle as string
  }

  /**
   * TodoTitleUpdatedEventを作成します
   *
   * @param aggregateId - TODOのID
   * @param payload - イベントペイロード
   * @param occurredAt - 発生日時（省略時は現在時刻）
   */
  constructor(
    aggregateId: string,
    payload: {
      newTitle: string
      oldTitle: string
    },
    occurredAt?: Date
  ) {
    super(aggregateId, 'TodoTitleUpdated', payload, occurredAt)
  }
}
