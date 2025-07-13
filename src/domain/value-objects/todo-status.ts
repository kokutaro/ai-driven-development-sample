/**
 * TodoStatus 値オブジェクト
 *
 * TODOのステータスを表現する値オブジェクトです。
 * 4つのステータス（PENDING, IN_PROGRESS, COMPLETED, CANCELLED）を提供し、
 * 状態遷移のバリデーションや表示機能を含みます。
 */
export class TodoStatus {
  private static readonly STATUS_DEFINITIONS = {
    CANCELLED: {
      colorCode: '#EF4444',
      displayName: 'キャンセル',
      icon: '×',
      value: 'CANCELLED',
    },
    COMPLETED: {
      colorCode: '#10B981',
      displayName: '完了',
      icon: '●',
      value: 'COMPLETED',
    },
    IN_PROGRESS: {
      colorCode: '#3B82F6',
      displayName: '作業中',
      icon: '◐',
      value: 'IN_PROGRESS',
    },
    PENDING: {
      colorCode: '#6B7280',
      displayName: '未着手',
      icon: '○',
      value: 'PENDING',
    },
  } as const

  // 状態遷移ルール
  private static readonly TRANSITION_RULES = {
    CANCELLED: new Set<string>([]),
    COMPLETED: new Set<string>([]),
    IN_PROGRESS: new Set<string>(['CANCELLED', 'COMPLETED', 'PENDING']),
    PENDING: new Set<string>(['CANCELLED', 'COMPLETED', 'IN_PROGRESS']),
  } as const

  /**
   * ステータスのカラーコードを取得します
   */
  get colorCode(): string {
    return this._colorCode
  }

  /**
   * ステータスの表示名を取得します
   */
  get displayName(): string {
    return this._displayName
  }

  /**
   * ステータスのアイコンを取得します
   */
  get icon(): string {
    return this._icon
  }

  /**
   * ステータスの文字列値を取得します
   */
  get value(): string {
    return this._value
  }

  private readonly _colorCode: string

  private readonly _displayName: string

  private readonly _icon: string

  private readonly _value: string

  /**
   * ステータス定義定数への参照を取得します
   */
  private get STATUS_DEFINITIONS() {
    return TodoStatus.STATUS_DEFINITIONS
  }

  /**
   * 状態遷移ルール定数への参照を取得します
   */
  private get TRANSITION_RULES() {
    return TodoStatus.TRANSITION_RULES
  }

  /**
   * TodoStatusを作成します
   *
   * @param value - ステータスの文字列値
   * @throws Error - 無効なステータスが提供された場合
   */
  private constructor(value: string) {
    this.validateValue(value)

    const status =
      this.STATUS_DEFINITIONS[value as keyof typeof this.STATUS_DEFINITIONS]
    this._value = status.value
    this._displayName = status.displayName
    this._colorCode = status.colorCode
    this._icon = status.icon
  }

  /**
   * キャンセルステータスのインスタンスを作成します
   */
  static CANCELLED(): TodoStatus {
    return new TodoStatus('CANCELLED')
  }

  /**
   * 完了ステータスのインスタンスを作成します
   */
  static COMPLETED(): TodoStatus {
    return new TodoStatus('COMPLETED')
  }

  /**
   * 文字列からステータスを作成します
   *
   * @param value - ステータスの文字列
   * @returns TodoStatusインスタンス
   */
  static fromString(value: string): TodoStatus {
    return new TodoStatus(value)
  }

  /**
   * アクティブなステータス（未完了）を取得します
   *
   * @returns アクティブステータスの配列
   */
  static getActiveStatuses(): TodoStatus[] {
    return [TodoStatus.PENDING(), TodoStatus.IN_PROGRESS()]
  }

  /**
   * すべてのステータスを取得します
   *
   * @returns 全ステータスの配列
   */
  static getAllStatuses(): TodoStatus[] {
    return [
      TodoStatus.PENDING(),
      TodoStatus.IN_PROGRESS(),
      TodoStatus.COMPLETED(),
      TodoStatus.CANCELLED(),
    ]
  }

  /**
   * 完了済みステータスを取得します
   *
   * @returns 完了済みステータスの配列
   */
  static getFinishedStatuses(): TodoStatus[] {
    return [TodoStatus.COMPLETED(), TodoStatus.CANCELLED()]
  }

  /**
   * 進行中ステータスのインスタンスを作成します
   */
  static IN_PROGRESS(): TodoStatus {
    return new TodoStatus('IN_PROGRESS')
  }

  /**
   * 未着手ステータスのインスタンスを作成します
   */
  static PENDING(): TodoStatus {
    return new TodoStatus('PENDING')
  }

  /**
   * 指定されたステータスに遷移可能かを判定します
   *
   * @param to - 遷移先のステータス
   * @returns 遷移可能な場合true
   */
  canTransitionTo(to: TodoStatus): boolean {
    // 同じステータスへの遷移は常に許可
    if (this.equals(to)) {
      return true
    }

    const allowedTransitions =
      this.TRANSITION_RULES[this._value as keyof typeof this.TRANSITION_RULES]
    return allowedTransitions.has(to._value)
  }

  /**
   * 他のステータスとの等価性を判定します
   *
   * @param other - 比較対象のステータス
   * @returns 等価性の結果
   */
  equals(other: TodoStatus): boolean {
    if (!other || !(other instanceof TodoStatus)) {
      return false
    }
    return this._value === other._value
  }

  /**
   * アクティブ（未完了）ステータスかを判定します
   *
   * @returns アクティブステータスの場合true
   */
  isActive(): boolean {
    return this._value === 'PENDING' || this._value === 'IN_PROGRESS'
  }

  /**
   * キャンセルステータスかを判定します
   *
   * @returns キャンセルステータスの場合true
   */
  isCancelled(): boolean {
    return this._value === 'CANCELLED'
  }

  /**
   * 完了ステータスかを判定します
   *
   * @returns 完了ステータスの場合true
   */
  isCompleted(): boolean {
    return this._value === 'COMPLETED'
  }

  /**
   * 完了済み（完了またはキャンセル）ステータスかを判定します
   *
   * @returns 完了済みステータスの場合true
   */
  isFinished(): boolean {
    return this._value === 'COMPLETED' || this._value === 'CANCELLED'
  }

  /**
   * 進行中ステータスかを判定します
   *
   * @returns 進行中ステータスの場合true
   */
  isInProgress(): boolean {
    return this._value === 'IN_PROGRESS'
  }

  /**
   * 未着手ステータスかを判定します
   *
   * @returns 未着手ステータスの場合true
   */
  isPending(): boolean {
    return this._value === 'PENDING'
  }

  /**
   * 文字列表現を返します
   *
   * @returns 文字列表現
   */
  toString(): string {
    return this._value
  }

  /**
   * 値のバリデーションを実行します
   *
   * @param value - 検証する値
   * @throws Error - バリデーションエラー
   */
  private validateValue(value: string): void {
    if (!value || !(value in this.STATUS_DEFINITIONS)) {
      throw new Error(`無効なステータスです: ${value}`)
    }
  }
}
