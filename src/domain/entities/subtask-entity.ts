import { TodoId } from '@/domain/value-objects/todo-id'

/**
 * SubTaskEntity作成データのインターフェース
 */
export interface CreateSubTaskData {
  id?: TodoId
  order: number
  title: string
  todoId: TodoId
}

/**
 * SubTaskEntity復元データのインターフェース
 */
export interface SubTaskEntityData extends CreateSubTaskData {
  createdAt: Date
  id: TodoId
  isCompleted: boolean
  updatedAt: Date
}

/**
 * SubTaskEntity - サブタスクのドメインエンティティ
 *
 * TODOタスクのサブタスクを表現するエンティティです。
 * 完了状態の管理、順序管理、タイトル更新などの
 * ビジネスロジックを実装します。
 */
export class SubTaskEntity {
  /**
   * 作成日時を取得します
   */
  get createdAt(): Date {
    return this._createdAt
  }

  /**
   * IDを取得します
   */
  get id(): TodoId {
    return this._id
  }

  /**
   * 完了状態を取得します
   */
  get isCompleted(): boolean {
    return this._isCompleted
  }

  /**
   * 順序を取得します
   */
  get order(): number {
    return this._order
  }

  /**
   * タイトルを取得します
   */
  get title(): string {
    return this._title
  }

  /**
   * TODO IDを取得します
   */
  get todoId(): TodoId {
    return this._todoId
  }

  /**
   * 更新日時を取得します
   */
  get updatedAt(): Date {
    return this._updatedAt
  }

  private readonly _createdAt: Date

  private readonly _id: TodoId

  private _isCompleted: boolean

  private _order: number

  private _title: string

  private readonly _todoId: TodoId

  private _updatedAt: Date

  /**
   * SubTaskEntityを作成します
   *
   * @param data - サブタスク復元データ
   * @throws Error - バリデーションエラー
   */
  private constructor(data: SubTaskEntityData) {
    this.validateData(data)

    this._id = data.id
    this._title = data.title
    this._order = data.order
    this._todoId = data.todoId
    this._isCompleted = data.isCompleted
    this._createdAt = data.createdAt
    this._updatedAt = data.updatedAt
  }

  /**
   * 新しいSubTaskEntityを作成します
   *
   * @param data - サブタスク作成データ
   * @returns SubTaskEntityインスタンス
   */
  static create(data: CreateSubTaskData): SubTaskEntity {
    const now = new Date()
    const entityData: SubTaskEntityData = {
      ...data,
      createdAt: now,
      id: data.id ?? TodoId.generate(),
      isCompleted: false,
      updatedAt: now,
    }

    return new SubTaskEntity(entityData)
  }

  /**
   * 既存データからSubTaskEntityを復元します
   *
   * @param data - サブタスク復元データ
   * @returns SubTaskEntityインスタンス
   */
  static fromData(data: SubTaskEntityData): SubTaskEntity {
    return new SubTaskEntity(data)
  }

  /**
   * 他のSubTaskEntityとの等価性を判定します
   *
   * @param other - 比較対象のSubTaskEntity
   * @returns 等価性の結果
   */
  equals(other: SubTaskEntity): boolean {
    if (!other || !(other instanceof SubTaskEntity)) {
      return false
    }
    return this._id.equals(other._id)
  }

  /**
   * ステータスアイコンを取得します
   *
   * @returns ステータスアイコン
   */
  getStatusIcon(): string {
    return this._isCompleted ? '●' : '○'
  }

  /**
   * ステータステキストを取得します
   *
   * @returns ステータステキスト
   */
  getStatusText(): string {
    return this._isCompleted ? '完了' : '未完了'
  }

  /**
   * 完了状態にマークします
   */
  markAsCompleted(): void {
    this._isCompleted = true
    this.updateTimestamp()
  }

  /**
   * 未完了状態にマークします
   */
  markAsNotCompleted(): void {
    this._isCompleted = false
    this.updateTimestamp()
  }

  /**
   * 検索語に一致するかを判定します
   *
   * @param searchTerm - 検索語
   * @returns 一致する場合true
   */
  matchesSearchTerm(searchTerm: string): boolean {
    if (!searchTerm || searchTerm.trim() === '') {
      return false
    }

    const term = searchTerm.toLowerCase()
    return this._title.toLowerCase().includes(term)
  }

  /**
   * 完了状態を切り替えます
   */
  toggleCompletion(): void {
    this._isCompleted = !this._isCompleted
    this.updateTimestamp()
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
   * 順序を更新します
   *
   * @param order - 新しい順序
   */
  updateOrder(order: number): void {
    this.validateOrder(order)

    this._order = order
    this.updateTimestamp()
  }

  /**
   * タイトルを更新します
   *
   * @param title - 新しいタイトル
   */
  updateTitle(title: string): void {
    this.validateTitle(title)

    this._title = title
    this.updateTimestamp()
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
  private validateData(data: SubTaskEntityData): void {
    this.validateTitle(data.title)
    this.validateOrder(data.order)
  }

  /**
   * 順序のバリデーションを実行します
   *
   * @param order - 検証する順序
   * @throws Error - バリデーションエラー
   */
  private validateOrder(order: number): void {
    if (typeof order !== 'number' || !Number.isInteger(order)) {
      throw new TypeError('サブタスクの順序は整数である必要があります')
    }

    if (order < 0) {
      throw new Error('サブタスクの順序は0以上である必要があります')
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
      throw new Error('サブタスクのタイトルは必須です')
    }

    if (title.length > 200) {
      throw new Error('サブタスクのタイトルは200文字以内である必要があります')
    }
  }
}
