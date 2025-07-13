/**
 * GraphQLバリデーションエラーハンドラー
 *
 * Zodバリデーションエラーや入力値検証エラーを
 * 適切なGraphQLエラーに変換します。
 */
import { ValidationError } from './custom-errors'

export interface FieldValidationError {
  code: string
  field: string
  message: string
  value?: unknown
}

/**
 * バリデーション結果の型定義
 */
export interface ValidationResult {
  errors?: FieldValidationError[]
  isValid: boolean
}

/**
 * Zodエラーの型定義
 */
export interface ZodError {
  issues: ZodIssue[]
}

export interface ZodIssue {
  code: string
  maximum?: number
  message: string
  minimum?: number
  path: (number | string)[]
  type?: string
  validation?: string
}

/**
 * GraphQLバリデーションハンドラー
 */
export class GraphQLValidationHandler {
  /**
   * バリデーションエラーの詳細を取得
   */
  static getValidationDetails(error: ValidationError): {
    errorCount: number
    fieldCount: number
    fields: string[]
    summary: string
  } {
    const validationDetails =
      (error.extensions.validationDetails as Record<string, string[]>) || {}
    const fields = Object.keys(validationDetails)
    const errorCount = Object.values(validationDetails).reduce(
      (sum, errors) => sum + errors.length,
      0
    )

    return {
      errorCount,
      fieldCount: fields.length,
      fields,
      summary: this.createSummaryMessage(errorCount),
    }
  }

  /**
   * フィールド名を日本語化
   */
  static localizeFieldName(fieldName: string): string {
    const fieldNameMap: Record<string, string> = {
      category: 'カテゴリ',
      color: '色',
      description: '説明',
      dueDate: '期限日',
      email: 'メールアドレス',
      isCompleted: '完了状態',
      isImportant: '重要度',
      name: '名前',
      order: '順序',
      password: 'パスワード',
      subTasks: 'サブタスク',
      title: 'タイトル',
    }

    // eslint-disable-next-line security/detect-object-injection
    return fieldNameMap[fieldName] || fieldName
  }

  /**
   * ZodエラーをValidationErrorに変換
   */
  static transformZodError(
    zodError: ZodError,
    operation?: string
  ): ValidationError {
    const validationDetails: Record<string, string[]> = {}
    const fieldErrors: FieldValidationError[] = []

    for (const issue of zodError.issues) {
      const fieldPath = issue.path.join('.')
      const localizedMessage = this.getJapaneseErrorMessage(issue)

      // eslint-disable-next-line security/detect-object-injection
      if (!validationDetails[fieldPath]) {
        // eslint-disable-next-line security/detect-object-injection
        validationDetails[fieldPath] = []
      }
      // eslint-disable-next-line security/detect-object-injection
      validationDetails[fieldPath].push(localizedMessage)

      fieldErrors.push({
        code: issue.code,
        field: fieldPath,
        message: localizedMessage,
      })
    }

    const message = this.createSummaryMessage(fieldErrors.length)

    return new ValidationError(message, validationDetails, {
      fieldErrors,
      operation,
      originalError: zodError,
    })
  }

  /**
   * 単一フィールドのバリデーション
   */
  static validateField(
    value: unknown,
    schema: { parse: (value: unknown) => unknown },
    fieldName: string
  ): ValidationResult {
    try {
      schema.parse(value)
      return { isValid: true }
    } catch (error: unknown) {
      if (this.isZodError(error)) {
        const fieldErrors = error.issues.map((issue) => ({
          code: issue.code,
          field: fieldName,
          message: this.getJapaneseErrorMessage(issue),
          value,
        }))

        return {
          errors: fieldErrors,
          isValid: false,
        }
      }

      return {
        errors: [
          {
            code: 'unknown',
            field: fieldName,
            message: 'バリデーションエラーが発生しました',
            value,
          },
        ],
        isValid: false,
      }
    }
  }

  /**
   * サマリーメッセージを作成
   */
  private static createSummaryMessage(errorCount: number): string {
    if (errorCount === 1) {
      return '入力内容に問題があります'
    }
    return `${errorCount}個のフィールドに問題があります`
  }

  /**
   * 文字列形式エラーメッセージ
   */
  private static getInvalidStringMessage(issue: ZodIssue): string {
    switch (issue.validation) {
      case 'cuid': {
        return '有効なCUIDを入力してください'
      }
      case 'datetime': {
        return '有効な日時形式で入力してください'
      }
      case 'email': {
        return '有効なメールアドレスを入力してください'
      }
      case 'regex': {
        return '指定された形式で入力してください'
      }
      case 'url': {
        return '有効なURLを入力してください'
      }
      case 'uuid': {
        return '有効なUUIDを入力してください'
      }
      default: {
        return '文字列の形式が正しくありません'
      }
    }
  }

  /**
   * 型エラーメッセージ
   */
  private static getInvalidTypeMessage(issue: ZodIssue): string {
    const expectedType = issue.type ?? 'unknown'

    switch (expectedType) {
      case 'array': {
        return '配列形式で入力してください'
      }
      case 'boolean': {
        return '真偽値を選択してください'
      }
      case 'date': {
        return '日付を入力してください'
      }
      case 'number': {
        return '数値を入力してください'
      }
      case 'object': {
        return 'オブジェクト形式で入力してください'
      }
      case 'string': {
        return '文字列を入力してください'
      }
      default: {
        return `${expectedType}型の値を入力してください`
      }
    }
  }

  /**
   * Zodエラーを日本語メッセージに変換
   */
  private static getJapaneseErrorMessage(issue: ZodIssue): string {
    switch (issue.code) {
      case 'custom': {
        return issue.message || 'カスタムバリデーションエラー'
      }
      case 'invalid_date': {
        return '有効な日付を入力してください'
      }
      case 'invalid_email': {
        return '有効なメールアドレスを入力してください'
      }
      case 'invalid_string': {
        return this.getInvalidStringMessage(issue)
      }
      case 'invalid_type': {
        return this.getInvalidTypeMessage(issue)
      }
      case 'invalid_url': {
        return '有効なURLを入力してください'
      }
      case 'too_big': {
        return this.getTooBigMessage(issue)
      }
      case 'too_small': {
        return this.getTooSmallMessage(issue)
      }
      default: {
        return issue.message || 'バリデーションエラー'
      }
    }
  }

  /**
   * 最大値エラーメッセージ
   */
  private static getTooBigMessage(issue: ZodIssue): string {
    const maximum = issue.maximum ?? 0

    switch (issue.type) {
      case 'array': {
        return `${maximum}個以下の項目を選択してください`
      }
      case 'date': {
        return `${new Date(maximum).toLocaleDateString()}以前の日付を選択してください`
      }
      case 'number': {
        return `${maximum}以下の値を入力してください`
      }
      case 'string': {
        return `${maximum}文字以下で入力してください`
      }
      default: {
        return `最大値 ${maximum} を超えています`
      }
    }
  }

  /**
   * 最小値エラーメッセージ
   */
  private static getTooSmallMessage(issue: ZodIssue): string {
    const minimum = issue.minimum ?? 0

    switch (issue.type) {
      case 'array': {
        return `${minimum}個以上の項目を選択してください`
      }
      case 'date': {
        return `${new Date(minimum).toLocaleDateString()}以降の日付を選択してください`
      }
      case 'number': {
        return `${minimum}以上の値を入力してください`
      }
      case 'string': {
        return `${minimum}文字以上で入力してください`
      }
      default: {
        return `最小値 ${minimum} を満たしてください`
      }
    }
  }

  /**
   * エラーがZodErrorかどうかをチェック
   */
  private static isZodError(error: unknown): error is ZodError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'issues' in error &&
      Array.isArray((error as { issues: unknown }).issues)
    )
  }
}
