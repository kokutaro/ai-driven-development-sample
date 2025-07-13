/**
 * CompletionRate 値オブジェクト
 *
 * 完了率を表現する値オブジェクトです。
 * 0%から100%の範囲で完了率を管理し、
 * 算術演算や比較機能を提供します。
 */
export class CompletionRate {
  /**
   * 完了率の値を取得します
   */
  get value(): number {
    return this._value
  }

  private readonly _value: number

  /**
   * CompletionRateを作成します
   *
   * @param value - 完了率（0-100）
   * @throws Error - 無効な値が提供された場合
   */
  constructor(value: number) {
    this.validateValue(value)
    this._value = Math.round(value * 100) / 100 // 小数点第2位で丸める
  }

  /**
   * 完了率リストの平均を計算します
   *
   * @param rates - 完了率のリスト
   * @returns 平均完了率
   */
  static average(rates: CompletionRate[]): CompletionRate {
    if (rates.length === 0) {
      return CompletionRate.zero()
    }

    const sum = rates.reduce((acc, rate) => acc + rate._value, 0)
    const average = sum / rates.length

    return new CompletionRate(average)
  }

  /**
   * 完了数と総数から完了率を作成します
   *
   * @param completed - 完了数
   * @param total - 総数
   * @returns CompletionRateインスタンス
   */
  static fromCounts(completed: number, total: number): CompletionRate {
    this.validateCounts(completed, total)

    if (total === 0) {
      return new CompletionRate(0)
    }

    const percentage = (completed / total) * 100
    return new CompletionRate(percentage)
  }

  /**
   * 文字列から完了率を作成します
   *
   * @param value - 完了率の文字列表現
   * @returns CompletionRateインスタンス
   */
  static fromString(value: string): CompletionRate {
    const numericValue = Number.parseFloat(value)

    if (Number.isNaN(numericValue)) {
      throw new TypeError('無効な完了率の文字列です')
    }

    return new CompletionRate(numericValue)
  }

  /**
   * 100%の完了率を作成します
   *
   * @returns 100%のCompletionRateインスタンス
   */
  static full(): CompletionRate {
    return new CompletionRate(100)
  }

  /**
   * 0%の完了率を作成します
   *
   * @returns 0%のCompletionRateインスタンス
   */
  static zero(): CompletionRate {
    return new CompletionRate(0)
  }

  /**
   * 完了数と総数のバリデーションを実行します
   *
   * @param completed - 完了数
   * @param total - 総数
   * @throws Error - バリデーションエラー
   */
  private static validateCounts(completed: number, total: number): void {
    if (
      typeof completed !== 'number' ||
      typeof total !== 'number' ||
      !Number.isInteger(completed) ||
      !Number.isInteger(total) ||
      completed < 0 ||
      total < 0
    ) {
      throw new Error('完了数と総数は0以上の整数である必要があります')
    }

    if (completed > total) {
      throw new Error('完了数は総数を超えることはできません')
    }
  }

  /**
   * 値のバリデーションを実行します
   *
   * @param value - 検証する値
   * @throws Error - バリデーションエラー
   */
  private static validateValue(value: number): void {
    if (
      typeof value !== 'number' ||
      Number.isNaN(value) ||
      !Number.isFinite(value)
    ) {
      throw new TypeError('完了率は有効な数値である必要があります')
    }

    if (value < 0 || value > 100) {
      throw new Error('完了率は0%以上100%以下である必要があります')
    }
  }

  /**
   * 完了率を加算します
   *
   * @param other - 加算する完了率
   * @returns 加算結果（最大100%）
   */
  add(other: CompletionRate): CompletionRate {
    const result = this._value + other._value
    return new CompletionRate(Math.min(result, 100))
  }

  /**
   * 他の完了率との等価性を判定します
   *
   * @param other - 比較対象の完了率
   * @returns 等価性の結果
   */
  equals(other: CompletionRate): boolean {
    if (!other || !(other instanceof CompletionRate)) {
      return false
    }
    return Math.abs(this._value - other._value) < 0.01 // 小数点誤差を考慮
  }

  /**
   * 進捗の説明を返します
   *
   * @returns 進捗の説明文字列
   */
  getProgressDescription(): string {
    if (this._value === 0) {
      return '未着手'
    } else if (this._value <= 25) {
      return '開始済み'
    } else if (this._value < 80) {
      return '進行中'
    } else if (this._value < 100) {
      return 'もうすぐ完了'
    } else {
      return '完了'
    }
  }

  /**
   * 100%（完了）かを判定します
   *
   * @returns 100%の場合true
   */
  isComplete(): boolean {
    return this._value === 100
  }

  /**
   * 高い完了率（80%以上）かを判定します
   *
   * @returns 高完了率の場合true
   */
  isHigh(): boolean {
    return this._value >= 80
  }

  /**
   * 他の完了率より高いかを判定します
   *
   * @param other - 比較対象の完了率
   * @returns 高い場合true
   */
  isHigherThan(other: CompletionRate): boolean {
    return this._value > other._value
  }

  /**
   * 低い完了率（25%以下）かを判定します
   *
   * @returns 低完了率の場合true
   */
  isLow(): boolean {
    return this._value <= 25
  }

  /**
   * 他の完了率より低いかを判定します
   *
   * @param other - 比較対象の完了率
   * @returns 低い場合true
   */
  isLowerThan(other: CompletionRate): boolean {
    return this._value < other._value
  }

  /**
   * 部分的完了（0%より大きく100%より小さい）かを判定します
   *
   * @returns 部分完了の場合true
   */
  isPartial(): boolean {
    return this._value > 0 && this._value < 100
  }

  /**
   * 0%かを判定します
   *
   * @returns 0%の場合true
   */
  isZero(): boolean {
    return this._value === 0
  }

  /**
   * 完了率を減算します
   *
   * @param other - 減算する完了率
   * @returns 減算結果（最小0%）
   */
  subtract(other: CompletionRate): CompletionRate {
    const result = this._value - other._value
    return new CompletionRate(Math.max(result, 0))
  }

  /**
   * 分数形式の文字列を返します
   *
   * @param completed - 完了数
   * @param total - 総数
   * @returns 分数文字列
   */
  toFractionString(completed: number, total: number): string {
    return `${completed}/${total}`
  }

  /**
   * パーセント形式の文字列を返します
   *
   * @param decimalPlaces - 小数点以下の桁数（デフォルト：1）
   * @returns パーセント文字列
   */
  toPercentageString(decimalPlaces = 1): string {
    return `${this._value.toFixed(decimalPlaces)}%`
  }

  /**
   * 文字列表現を返します
   *
   * @returns パーセント形式の文字列表現
   */
  toString(): string {
    return this.toPercentageString()
  }

  /**
   * 値のバリデーションを実行します
   *
   * @param value - 検証する値
   * @throws Error - バリデーションエラー
   */
  private validateValue(value: number): void {
    CompletionRate.validateValue(value)
  }
}
