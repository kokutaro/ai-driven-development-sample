import { SubTaskEntity } from './subtask-entity'

import type { DueDate } from '@/domain/value-objects/due-date'
import type { Priority } from '@/domain/value-objects/priority'
import type { TodoId } from '@/domain/value-objects/todo-id'

import { CompletionRate } from '@/domain/value-objects/completion-rate'
import { TodoStatus } from '@/domain/value-objects/todo-status'

/**
 * TodoEntity作成データのインターフェース
 */
export interface CreateTodoData {
  description?: string
  dueDate?: DueDate
  id: TodoId
  priority: Priority
  status: TodoStatus
  title: string
  userId: string
}

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
 * TodoEntity復元データのインターフェース
 */
export interface TodoEntityData extends CreateTodoData {
  completedAt?: Date
  createdAt: Date
  subTasks?: SubTaskEntity[]
  updatedAt: Date
}

/**
 * TodoEntity - TODOタスクのドメインエンティティ
 *
 * TODOタスクのビジネスロジックを管理するエンティティです。
 * タスクの状態遷移、サブタスク管理、期限判定などの
 * ドメインルールを実装します。
 */
export class TodoEntity {
  /**
   * 完了日時を取得します
   */
  get completedAt(): Date | undefined {
    return this._completedAt
  }

  /**
   * 作成日時を取得します
   */
  get createdAt(): Date {
    return this._createdAt
  }

  /**
   * 説明を取得します
   */
  get description(): string | undefined {
    return this._description
  }

  /**
   * 期限日を取得します
   */
  get dueDate(): DueDate | undefined {
    return this._dueDate
  }

  /**
   * IDを取得します
   */
  get id(): TodoId {
    return this._id
  }

  /**
   * 優先度を取得します
   */
  get priority(): Priority {
    return this._priority
  }

  /**
   * ステータスを取得します
   */
  get status(): TodoStatus {
    return this._status
  }

  /**
   * サブタスクリストを取得します
   */
  get subTasks(): SubTaskEntity[] {
    return [...this._subTasks] // コピーを返す
  }

  /**
   * タイトルを取得します
   */
  get title(): string {
    return this._title
  }

  /**
   * 更新日時を取得します
   */
  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * ユーザーIDを取得します
   */
  get userId(): string {
    return this._userId
  }

  private _completedAt?: Date

  private readonly _createdAt: Date

  private _description?: string

  private readonly _domainEvents: DomainEvent[] = []

  private _dueDate?: DueDate

  private readonly _id: TodoId

  private _priority: Priority

  private _status: TodoStatus

  private _subTasks: SubTaskEntity[]

  private _title: string

  private _updatedAt: Date

  private readonly _userId: string

  /**
   * TodoEntityを作成します
   *
   * @param data - TODO作成データ
   * @throws Error - バリデーションエラー
   */
  private constructor(data: TodoEntityData) {
    this.validateData(data)

    this._id = data.id
    this._title = data.title
    this._description = data.description
    this._priority = data.priority
    this._status = data.status
    this._dueDate = data.dueDate
    this._userId = data.userId
    this._completedAt = data.completedAt
    this._createdAt = data.createdAt
    this._updatedAt = data.updatedAt
    this._subTasks = data.subTasks ?? []
  }

  /**
   * 新しいTodoEntityを作成します
   *
   * @param data - TODO作成データ
   * @returns TodoEntityインスタンス
   */
  static create(data: CreateTodoData): TodoEntity {
    const now = new Date()
    const entityData: TodoEntityData = {
      ...data,
      createdAt: now,
      subTasks: [],
      updatedAt: now,
    }

    const todo = new TodoEntity(entityData)
    todo.recordEvent('TodoCreated', {
      priority: data.priority.value,
      status: data.status.value,
      title: data.title,
    })

    return todo
  }

  /**
   * 既存データからTodoEntityを復元します
   *
   * @param data - TODO復元データ
   * @returns TodoEntityインスタンス
   */
  static fromData(data: TodoEntityData): TodoEntity {
    return new TodoEntity(data)
  }

  /**
   * サブタスクを追加します
   *
   * @param title - サブタスクのタイトル
   * @returns 追加されたサブタスク
   */
  addSubTask(title: string): SubTaskEntity {
    this.validateSubTaskTitle(title)

    const order = this._subTasks.length
    const subTask = SubTaskEntity.create({
      order,
      title,
      todoId: this._id,
    })

    this._subTasks.push(subTask)
    this.updateTimestamp()

    this.recordEvent('SubTaskAdded', {
      order,
      subTaskId: subTask.id.value,
      title,
    })

    return subTask
  }

  /**
   * 未コミットのドメインイベントをクリアします
   */
  clearUncommittedEvents(): void {
    this._domainEvents.length = 0
  }

  /**
   * 他のTodoEntityとの等価性を判定します
   *
   * @param other - 比較対象のTodoEntity
   * @returns 等価性の結果
   */
  equals(other: TodoEntity): boolean {
    if (!other || !(other instanceof TodoEntity)) {
      return false
    }
    return this._id.equals(other._id)
  }

  /**
   * 完了率を計算します
   *
   * @returns 完了率
   */
  getCompletionRate(): CompletionRate {
    if (this._status.isCompleted()) {
      return CompletionRate.full()
    }

    if (this._subTasks.length === 0) {
      return this._status.isCompleted()
        ? CompletionRate.full()
        : CompletionRate.zero()
    }

    const completedCount = this._subTasks.filter((st) => st.isCompleted).length
    return CompletionRate.fromCounts(completedCount, this._subTasks.length)
  }

  /**
   * 未コミットのドメインイベントを取得します
   *
   * @returns ドメインイベントの配列
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents]
  }

  /**
   * 今日が期限かを判定します
   *
   * @returns 今日が期限の場合true
   */
  isDueToday(): boolean {
    if (!this._dueDate) {
      return false
    }
    return this._dueDate.isToday()
  }

  /**
   * 期限内（指定日数以内）かを判定します
   *
   * @param days - 日数
   * @returns 期限内の場合true
   */
  isDueWithinDays(days: number): boolean {
    if (!this._dueDate) {
      return false
    }
    return this._dueDate.isWithinDays(days)
  }

  /**
   * 期限切れかを判定します
   *
   * @returns 期限切れの場合true
   */
  isOverdue(): boolean {
    if (!this._dueDate || this._status.isFinished()) {
      return false
    }
    return this._dueDate.isOverdue()
  }

  /**
   * キャンセル済みにマークします
   *
   * @throws Error - 無効な状態遷移の場合
   */
  markAsCancelled(): void {
    const newStatus = TodoStatus.CANCELLED()
    this.validateStatusTransition(newStatus)

    this._status = newStatus
    this._completedAt = undefined
    this.updateTimestamp()

    this.recordEvent('TodoCancelled', {
      cancelledAt: this._updatedAt.toISOString(),
    })
  }

  /**
   * 完了済みにマークします
   *
   * @throws Error - 無効な状態遷移の場合
   */
  markAsCompleted(): void {
    const newStatus = TodoStatus.COMPLETED()
    this.validateStatusTransition(newStatus)

    this._status = newStatus
    this._completedAt = new Date()
    this.updateTimestamp()

    this.recordEvent('TodoCompleted', {
      completedAt: this._completedAt.toISOString(),
    })
  }

  /**
   * 進行中にマークします
   *
   * @throws Error - 無効な状態遷移の場合
   */
  markAsInProgress(): void {
    const newStatus = TodoStatus.IN_PROGRESS()
    this.validateStatusTransition(newStatus)

    this._status = newStatus
    this._completedAt = undefined
    this.updateTimestamp()

    this.recordEvent('TodoStarted', {
      startedAt: this._updatedAt.toISOString(),
    })
  }

  /**
   * 検索語に一致するかを判定します
   *
   * @param searchTerm - 検索語
   * @returns 一致する場合true
   */
  matchesSearchTerm(searchTerm: string): boolean {
    const term = searchTerm.toLowerCase()
    const titleMatch = this._title.toLowerCase().includes(term)
    const descriptionMatch =
      this._description?.toLowerCase().includes(term) ?? false

    return titleMatch || descriptionMatch
  }

  /**
   * サブタスクを削除します
   *
   * @param subTaskId - 削除するサブタスクのID
   */
  removeSubTask(subTaskId: TodoId): void {
    const index = this._subTasks.findIndex((st) => st.id.equals(subTaskId))
    if (index === -1) {
      throw new Error('指定されたサブタスクが見つかりません')
    }

    const removedSubTask = this._subTasks.splice(index, 1)[0]

    // 残りのサブタスクの順序を調整
    for (const [i, st] of this._subTasks.entries()) {
      st.updateOrder(i)
    }

    this.updateTimestamp()

    this.recordEvent('SubTaskRemoved', {
      subTaskId: removedSubTask.id.value,
      title: removedSubTask.title,
    })
  }

  /**
   * 再オープンします（完了状態を未着手に戻す）
   *
   * @throws Error - 無効な状態遷移の場合
   */
  reopen(): void {
    if (!this._status.isFinished()) {
      throw new Error('完了またはキャンセル済みのタスクのみ再オープンできます')
    }

    this._status = TodoStatus.PENDING()
    this._completedAt = undefined
    this.updateTimestamp()

    this.recordEvent('TodoReopened', {
      reopenedAt: this._updatedAt.toISOString(),
    })
  }

  /**
   * 文字列表現を返します
   *
   * @returns タイトルの文字列表現
   */
  toString(): string {
    return this._title
  }

  /**
   * 説明を更新します
   *
   * @param description - 新しい説明
   */
  updateDescription(description?: string): void {
    if (description) {
      this.validateDescription(description)
    }

    const oldDescription = this._description
    this._description = description
    this.updateTimestamp()

    this.recordEvent('TodoDescriptionUpdated', {
      newDescription: description,
      oldDescription,
    })
  }

  /**
   * 期限日を更新します
   *
   * @param dueDate - 新しい期限日
   */
  updateDueDate(dueDate?: DueDate): void {
    const oldDueDate = this._dueDate
    this._dueDate = dueDate
    this.updateTimestamp()

    this.recordEvent('TodoDueDateUpdated', {
      newDueDate: dueDate?.toISOString(),
      oldDueDate: oldDueDate?.toISOString(),
    })
  }

  /**
   * 優先度を更新します
   *
   * @param priority - 新しい優先度
   */
  updatePriority(priority: Priority): void {
    const oldPriority = this._priority
    this._priority = priority
    this.updateTimestamp()

    this.recordEvent('TodoPriorityChanged', {
      newPriority: priority.value,
      oldPriority: oldPriority.value,
    })
  }

  /**
   * タイトルを更新します
   *
   * @param title - 新しいタイトル
   */
  updateTitle(title: string): void {
    this.validateTitle(title)

    const oldTitle = this._title
    this._title = title
    this.updateTimestamp()

    this.recordEvent('TodoTitleUpdated', {
      newTitle: title,
      oldTitle,
    })
  }

  /**
   * ドメインイベントを記録します
   *
   * @param eventType - イベントタイプ
   * @param payload - イベントペイロード
   */
  private recordEvent(
    eventType: string,
    payload: Record<string, unknown>
  ): void {
    this._domainEvents.push({
      aggregateId: this._id.value,
      eventType,
      occurredAt: new Date(),
      payload,
    })
  }

  /**
   * 更新タイムスタンプを更新します
   */
  private updateTimestamp(): void {
    this._updatedAt = new Date()
  }

  /**
   * データのバリデーションを実行します
   *
   * @param data - 検証するデータ
   * @throws Error - バリデーションエラー
   */
  private validateData(data: TodoEntityData): void {
    this.validateTitle(data.title)

    if (data.description) {
      this.validateDescription(data.description)
    }

    this.validateUserId(data.userId)
  }

  /**
   * 説明のバリデーションを実行します
   *
   * @param description - 検証する説明
   * @throws Error - バリデーションエラー
   */
  private validateDescription(description: string): void {
    if (description.length > 2000) {
      throw new Error('説明は2000文字以内である必要があります')
    }
  }

  /**
   * 状態遷移のバリデーションを実行します
   *
   * @param newStatus - 新しいステータス
   * @throws Error - バリデーションエラー
   */
  private validateStatusTransition(newStatus: TodoStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      if (this._status.isCompleted() && newStatus.isCancelled()) {
        throw new Error('完了済みタスクをキャンセルに変更することはできません')
      }
      if (this._status.isCancelled() && !newStatus.isCancelled()) {
        throw new Error('キャンセル済みタスクの状態は変更できません')
      }
      throw new Error(
        `${this._status.displayName}から${newStatus.displayName}への遷移は許可されていません`
      )
    }
  }

  /**
   * サブタスクタイトルのバリデーションを実行します
   *
   * @param title - 検証するタイトル
   * @throws Error - バリデーションエラー
   */
  private validateSubTaskTitle(title: string): void {
    if (!title || title.trim() === '') {
      throw new Error('サブタスクのタイトルは必須です')
    }
    if (title.length > 200) {
      throw new Error('サブタスクのタイトルは200文字以内である必要があります')
    }
  }

  /**
   * タイトルのバリデーションを実行します
   *
   * @param title - 検証するタイトル
   * @throws Error - バリデーションエラー
   */
  private validateTitle(title: string): void {
    if (!title || title.trim() === '') {
      throw new Error('タイトルは必須です')
    }
    if (title.length > 200) {
      throw new Error('タイトルは200文字以内である必要があります')
    }
  }

  /**
   * ユーザーIDのバリデーションを実行します
   *
   * @param userId - 検証するユーザーID
   * @throws Error - バリデーションエラー
   */
  private validateUserId(userId: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      throw new Error('ユーザーIDは有効なUUID形式である必要があります')
    }
  }
}
