/**
 * TodoId 値オブジェクト
 *
 * TODOの一意識別子を表現する値オブジェクトです。
 * UUIDフォーマットを強制し、型安全性を提供します。
 */
export class TodoId {
  /**
   * 値を取得します
   */
  get value(): string {
    return this._value
  }

  private readonly _value: string

  /**
   * TodoIdを作成します
   *
   * @param value - UUID形式の識別子
   * @throws Error - 無効な値が提供された場合
   */
  constructor(value: string) {
    this.validateValue(value)
    this._value = value.trim()
  }

  /**
   * 文字列からTodoIdを作成します（createエイリアス）
   *
   * @param value - UUID形式の文字列
   * @returns TodoIdインスタンス
   */
  static create(value: string): TodoId {
    return new TodoId(value)
  }

  /**
   * 文字列からTodoIdを作成します
   *
   * @param value - UUID形式の文字列
   * @returns TodoIdインスタンス
   */
  static fromString(value: string): TodoId {
    return new TodoId(value)
  }

  /**
   * 新しいTodoIdを生成します
   *
   * @returns 新しいTodoIdインスタンス
   */
  static generate(): TodoId {
    return new TodoId(crypto.randomUUID())
  }

  /**
   * 他のTodoIdとの等価性を判定します
   *
   * @param other - 比較対象のTodoId
   * @returns 等価性の結果
   */
  equals(other: TodoId): boolean {
    if (!other || !(other instanceof TodoId)) {
      return false
    }
    return this._value === other._value
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
    if (!value || value.trim() === '') {
      throw new Error('TodoId は空文字列にできません')
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value.trim())) {
      throw new Error('TodoId は有効なUUID形式である必要があります')
    }
  }
}
