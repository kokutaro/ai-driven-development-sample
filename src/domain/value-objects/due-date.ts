/**
 * DueDate 値オブジェクト
 *
 * TODOの期限日を表現する値オブジェクトです。
 * 日付バリデーション、期限判定、相対時間フォーマットなどの
 * 機能を提供します。
 */
export class DueDate {
  /**
   * 期限日の値を取得します
   */
  get value(): Date {
    return new Date(this._value) // コピーを返す
  }

  private readonly _value: Date

  /**
   * DueDateを作成します
   *
   * @param value - 期限日のDateオブジェクト
   * @param allowPast - 過去の日付を許可するか（テスト用）
   * @throws Error - 無効な日付が提供された場合
   */
  constructor(value: Date, allowPast = false) {
    this.validateValue(value, allowPast)
    this._value = new Date(value) // コピーを作成
  }

  /**
   * 年月日から期限日を作成します
   *
   * @param year - 年
   * @param month - 月 (1-12)
   * @param day - 日
   * @returns DueDateインスタンス
   */
  static fromComponents(year: number, month: number, day: number): DueDate {
    const date = new Date(year, month - 1, day) // monthは0-indexed

    // 入力値が有効かチェック
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error('無効な日付コンポーネントです')
    }

    return new DueDate(date)
  }

  /**
   * Dateオブジェクトから期限日を作成します
   *
   * @param date - Dateオブジェクト
   * @returns DueDateインスタンス
   */
  static fromDate(date: Date): DueDate {
    return new DueDate(date)
  }

  /**
   * 文字列から期限日を作成します
   *
   * @param dateString - ISO形式の日付文字列
   * @returns DueDateインスタンス
   */
  static fromString(dateString: string): DueDate {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      throw new TypeError('無効な日付文字列です')
    }
    return new DueDate(date)
  }

  /**
   * 期限日までの日数を計算します
   *
   * @returns 期限日までの日数（負の値は遅れ）
   */
  daysUntilDue(): number {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDay = new Date(
      this._value.getFullYear(),
      this._value.getMonth(),
      this._value.getDate()
    )

    const diffTime = dueDay.getTime() - today.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * 他の期限日との等価性を判定します
   *
   * @param other - 比較対象の期限日
   * @returns 等価性の結果
   */
  equals(other: DueDate): boolean {
    if (!other || !(other instanceof DueDate)) {
      return false
    }
    return this._value.getTime() === other._value.getTime()
  }

  /**
   * 日本語形式でフォーマットします
   *
   * @returns 日本語形式の日付文字列
   */
  formatJapanese(): string {
    return this._value.toLocaleDateString('ja-JP', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      year: 'numeric',
    })
  }

  /**
   * 相対時間でフォーマットします
   *
   * @returns 相対時間の文字列
   */
  formatRelative(): string {
    const daysUntil = this.daysUntilDue()

    if (daysUntil === 0) {
      return '今日'
    } else if (daysUntil === 1) {
      return '明日'
    } else if (daysUntil > 1) {
      return `${daysUntil}日後`
    } else {
      return `${Math.abs(daysUntil)}日遅れ`
    }
  }

  /**
   * 他の期限日より後かを判定します
   *
   * @param other - 比較対象の期限日
   * @returns 後の場合true
   */
  isAfter(other: DueDate): boolean {
    return this._value > other._value
  }

  /**
   * 他の期限日より前かを判定します
   *
   * @param other - 比較対象の期限日
   * @returns 前の場合true
   */
  isBefore(other: DueDate): boolean {
    return this._value < other._value
  }

  /**
   * 来週かを判定します
   *
   * @returns 来週の場合true
   */
  isNextWeek(): boolean {
    const now = new Date()
    const startOfNextWeek = new Date(now)
    startOfNextWeek.setDate(now.getDate() - now.getDay() + 7)
    startOfNextWeek.setHours(0, 0, 0, 0)

    const endOfNextWeek = new Date(startOfNextWeek)
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6)
    endOfNextWeek.setHours(23, 59, 59, 999)

    return this._value >= startOfNextWeek && this._value <= endOfNextWeek
  }

  /**
   * 期限が過ぎているかを判定します
   *
   * @returns 期限切れの場合true
   */
  isOverdue(): boolean {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDay = new Date(
      this._value.getFullYear(),
      this._value.getMonth(),
      this._value.getDate()
    )

    return dueDay < today
  }

  /**
   * 他の期限日と同じ日かを判定します
   *
   * @param other - 比較対象の期限日
   * @returns 同じ日の場合true
   */
  isSameDay(other: DueDate): boolean {
    return this.isSameDayAs(other._value)
  }

  /**
   * 今週中かを判定します
   *
   * @returns 今週中の場合true
   */
  isThisWeek(): boolean {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return this._value >= startOfWeek && this._value <= endOfWeek
  }

  /**
   * 今日が期限日かを判定します
   *
   * @returns 今日が期限日の場合true
   */
  isToday(): boolean {
    const now = new Date()
    return this.isSameDayAs(now)
  }

  /**
   * 明日が期限日かを判定します
   *
   * @returns 明日が期限日の場合true
   */
  isTomorrow(): boolean {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return this.isSameDayAs(tomorrow)
  }

  /**
   * 指定日数以内かを判定します
   *
   * @param days - 日数
   * @returns 指定日数以内の場合true
   */
  isWithinDays(days: number): boolean {
    const daysUntil = this.daysUntilDue()
    return daysUntil >= 0 && daysUntil <= days
  }

  /**
   * Dateオブジェクトに変換します
   *
   * @returns Dateオブジェクト
   */
  toDate(): Date {
    return new Date(this._value)
  }

  /**
   * ISO文字列でフォーマットします
   *
   * @returns ISO形式の日付文字列
   */
  toISOString(): string {
    return this._value.toISOString()
  }

  /**
   * 文字列表現を返します
   *
   * @returns ISO形式の文字列表現
   */
  toString(): string {
    return this._value.toISOString()
  }

  /**
   * 指定された日付と同じ日かを判定します
   *
   * @param date - 比較対象の日付
   * @returns 同じ日の場合true
   */
  private isSameDayAs(date: Date): boolean {
    return (
      this._value.getFullYear() === date.getFullYear() &&
      this._value.getMonth() === date.getMonth() &&
      this._value.getDate() === date.getDate()
    )
  }

  /**
   * 値のバリデーションを実行します
   *
   * @param value - 検証する値
   * @param allowPast - 過去の日付を許可するか
   * @throws Error - バリデーションエラー
   */
  private validateValue(value: Date, allowPast = false): void {
    if (!value || !(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error('無効な日付です')
    }

    if (!allowPast) {
      // 過去の日付チェック（1日前まで許可）
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      if (value < oneDayAgo) {
        throw new Error('期限日は過去の日付にできません')
      }
    }
  }
}
