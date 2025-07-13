/**
 * Priority 値オブジェクト
 *
 * TODOの優先度を表現する値オブジェクトです。
 * 4段階の優先度（LOW, NORMAL, HIGH, URGENT）を提供し、
 * 比較機能やソート機能を含みます。
 */
export class Priority {
  private static readonly PRIORITY_LEVELS = {
    HIGH: { color: '#F59E0B', displayName: '高', numeric: 3, value: 'HIGH' },
    LOW: { color: '#6B7280', displayName: '低', numeric: 1, value: 'LOW' },
    NORMAL: {
      color: '#3B82F6',
      displayName: '通常',
      numeric: 2,
      value: 'NORMAL',
    },
    URGENT: {
      color: '#EF4444',
      displayName: '緊急',
      numeric: 4,
      value: 'URGENT',
    },
  } as const

  /**
   * 優先度のカラーコードを取得します
   */
  get colorCode(): string {
    return this._colorCode
  }
  /**
   * 優先度の表示名を取得します
   */
  get displayName(): string {
    return this._displayName
  }
  /**
   * 優先度の数値を取得します
   */
  get numericValue(): number {
    return this._numericValue
  }
  /**
   * 優先度の文字列値を取得します
   */
  get value(): string {
    return this._value
  }

  private readonly _colorCode: string

  private readonly _displayName: string

  private readonly _numericValue: number

  private readonly _value: string

  /**
   * 優先度レベル定数への参照を取得します
   */
  private get PRIORITY_LEVELS() {
    return Priority.PRIORITY_LEVELS
  }

  /**
   * Priorityを作成します
   *
   * @param value - 優先度の文字列値
   * @throws Error - 無効な優先度が提供された場合
   */
  private constructor(value: string) {
    this.validateValue(value)

    const level =
      this.PRIORITY_LEVELS[value as keyof typeof this.PRIORITY_LEVELS]
    this._value = level.value
    this._numericValue = level.numeric
    this._displayName = level.displayName
    this._colorCode = level.color
  }

  /**
   * 数値から優先度を作成します
   *
   * @param numericValue - 優先度の数値 (1-4)
   * @returns Priorityインスタンス
   */
  static fromNumeric(numericValue: number): Priority {
    const entry = Object.values(this.PRIORITY_LEVELS).find(
      (level) => level.numeric === numericValue
    )

    if (!entry) {
      throw new Error(`無効な優先度の数値です: ${numericValue}`)
    }

    return new Priority(entry.value)
  }

  /**
   * 文字列から優先度を作成します
   *
   * @param value - 優先度の文字列
   * @returns Priorityインスタンス
   */
  static fromString(value: string): Priority {
    return new Priority(value)
  }

  /**
   * 高優先度のインスタンスを作成します
   */
  static HIGH(): Priority {
    return new Priority('HIGH')
  }

  /**
   * 低優先度のインスタンスを作成します
   */
  static LOW(): Priority {
    return new Priority('LOW')
  }

  /**
   * 通常優先度のインスタンスを作成します
   */
  static NORMAL(): Priority {
    return new Priority('NORMAL')
  }

  /**
   * 優先度リストを昇順でソートします
   *
   * @param priorities - ソート対象の優先度リスト
   * @returns ソートされた優先度リスト
   */
  static sortByPriorityAscending(priorities: Priority[]): Priority[] {
    return [...priorities].sort((a, b) => a._numericValue - b._numericValue)
  }

  /**
   * 優先度リストを降順でソートします
   *
   * @param priorities - ソート対象の優先度リスト
   * @returns ソートされた優先度リスト
   */
  static sortByPriorityDescending(priorities: Priority[]): Priority[] {
    return [...priorities].sort((a, b) => b._numericValue - a._numericValue)
  }

  /**
   * 緊急優先度のインスタンスを作成します
   */
  static URGENT(): Priority {
    return new Priority('URGENT')
  }

  /**
   * 他の優先度と比較します
   *
   * @param other - 比較対象の優先度
   * @returns 比較結果（0: 等しい, >0: より高い, <0: より低い）
   */
  compareTo(other: Priority): number {
    return this._numericValue - other._numericValue
  }

  /**
   * 他の優先度との等価性を判定します
   *
   * @param other - 比較対象の優先度
   * @returns 等価性の結果
   */
  equals(other: Priority): boolean {
    if (!other || !(other instanceof Priority)) {
      return false
    }
    return this._value === other._value
  }

  /**
   * 高優先度（HIGH以上）かを判定します
   *
   * @returns 高優先度の場合true
   */
  isHigh(): boolean {
    return this._numericValue >= this.PRIORITY_LEVELS.HIGH.numeric
  }

  /**
   * 他の優先度より高いかを判定します
   *
   * @param other - 比較対象の優先度
   * @returns 高い場合true
   */
  isHigherThan(other: Priority): boolean {
    return this._numericValue > other._numericValue
  }

  /**
   * 低優先度（LOW）かを判定します
   *
   * @returns 低優先度の場合true
   */
  isLow(): boolean {
    return this._value === 'LOW'
  }

  /**
   * 他の優先度より低いかを判定します
   *
   * @param other - 比較対象の優先度
   * @returns 低い場合true
   */
  isLowerThan(other: Priority): boolean {
    return this._numericValue < other._numericValue
  }

  /**
   * 緊急優先度（URGENT）かを判定します
   *
   * @returns 緊急優先度の場合true
   */
  isUrgent(): boolean {
    return this._value === 'URGENT'
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
    if (!value || !(value in this.PRIORITY_LEVELS)) {
      throw new Error(`無効な優先度です: ${value}`)
    }
  }
}
