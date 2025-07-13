/**
 * GraphQLエラーメッセージの国際化対応
 *
 * 多言語対応、地域固有のエラーメッセージ、
 * 文化的に適切なエラー表現を提供します。
 */
import { ErrorCategory, ErrorSeverity } from './custom-errors'

import type { ErrorCode } from './error-codes'

/**
 * エラーメッセージの敬語レベル
 */
export enum PolitenessLevel {
  BUSINESS = 'business', // ビジネス文体
  CASUAL = 'casual', // カジュアル
  FORMAL = 'formal', // 敬語
  POLITE = 'polite', // 丁寧語
}

/**
 * サポートする言語・地域
 */
export enum SupportedLocale {
  CHINESE_SIMPLIFIED = 'zh-CN',
  CHINESE_TRADITIONAL = 'zh-TW',
  ENGLISH_UK = 'en-GB',
  ENGLISH_US = 'en-US',
  JAPANESE = 'ja-JP',
  KOREAN = 'ko-KR',
}

/**
 * エラーメッセージテンプレートの型定義
 */
export interface ErrorMessageTemplate {
  description: string
  examples?: string[]
  message: string
  suggestions?: string[]
  userMessage: string
}

/**
 * 地域固有設定の型定義
 */
export interface LocaleConfig {
  culturalPreferences: {
    directness: 'direct' | 'indirect'
    emoticons: boolean
    formalityDefault: PolitenessLevel
  }
  currencyCode?: string
  dateFormat: string
  locale: SupportedLocale
  numberFormat: string
  politenessLevel: PolitenessLevel
  timeFormat: string
}

/**
 * 文脈情報の型定義
 */
export interface MessageContext {
  constraint?: boolean | number | string
  fieldName?: string
  operation?: string
  resourceType?: string
  timeOfDay?: 'afternoon' | 'evening' | 'morning' | 'night'
  userRole?: string
  value?: boolean | number | string
}

/**
 * エラーメッセージの国際化クラス
 */
export class GraphQLErrorI18n {
  private readonly localeConfig: LocaleConfig
  private readonly messageTemplates: Map<
    string,
    Map<ErrorCode, ErrorMessageTemplate>
  >

  constructor(localeConfig: Partial<LocaleConfig> = {}) {
    this.localeConfig = {
      culturalPreferences: {
        directness: 'indirect',
        emoticons: false,
        formalityDefault: PolitenessLevel.POLITE,
        ...localeConfig.culturalPreferences,
      },
      currencyCode: localeConfig.currencyCode,
      dateFormat: localeConfig.dateFormat ?? 'YYYY年MM月DD日',
      locale: localeConfig.locale ?? SupportedLocale.JAPANESE,
      numberFormat: localeConfig.numberFormat ?? '#,##0',
      politenessLevel: localeConfig.politenessLevel ?? PolitenessLevel.POLITE,
      timeFormat: localeConfig.timeFormat ?? 'HH:mm:ss',
    }

    this.messageTemplates = new Map()
    this.initializeMessageTemplates()
  }

  /**
   * カテゴリ固有のエラーメッセージを取得
   */
  getCategoryMessage(
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: MessageContext = {},
    locale?: SupportedLocale
  ): string {
    const targetLocale = locale ?? this.localeConfig.locale

    switch (targetLocale) {
      case SupportedLocale.CHINESE_SIMPLIFIED:
      case SupportedLocale.CHINESE_TRADITIONAL: {
        return this.getChineseCategoryMessage(category, severity, context)
      }
      case SupportedLocale.ENGLISH_UK:
      case SupportedLocale.ENGLISH_US: {
        return this.getEnglishCategoryMessage(category, severity, context)
      }
      case SupportedLocale.JAPANESE: {
        return this.getJapaneseCategoryMessage(category, severity, context)
      }
      case SupportedLocale.KOREAN: {
        return this.getKoreanCategoryMessage(category, severity, context)
      }
      default: {
        return this.getJapaneseCategoryMessage(category, severity, context)
      }
    }
  }

  /**
   * 現在のロケール設定を取得
   */
  getCurrentLocaleConfig(): LocaleConfig {
    return { ...this.localeConfig }
  }

  /**
   * エラーコードとコンテキストからローカライズされたメッセージを取得
   */
  getLocalizedMessage(
    errorCode: ErrorCode,
    context: MessageContext = {},
    locale?: SupportedLocale,
    politenessLevel?: PolitenessLevel
  ): ErrorMessageTemplate {
    const targetLocale = locale ?? this.localeConfig.locale
    const targetPoliteness =
      politenessLevel ?? this.localeConfig.politenessLevel

    const localeTemplates = this.messageTemplates.get(targetLocale)
    if (!localeTemplates) {
      // フォールバック: 日本語
      return this.getLocalizedMessage(
        errorCode,
        context,
        SupportedLocale.JAPANESE,
        targetPoliteness
      )
    }

    let template = localeTemplates.get(errorCode)
    // フォールバック: 汎用エラーメッセージ
    template ??= this.getGenericErrorMessage(targetLocale, targetPoliteness)

    // テンプレートにコンテキストを適用
    return this.applyContext(template, context, targetLocale, targetPoliteness)
  }

  /**
   * サポートされている言語一覧を取得
   */
  getSupportedLocales(): SupportedLocale[] {
    return Object.values(SupportedLocale)
  }

  /**
   * ロケール設定を更新
   */
  updateLocaleConfig(updates: Partial<LocaleConfig>): void {
    Object.assign(this.localeConfig, updates)
  }

  /**
   * コンテキストをテンプレートに適用
   */
  private applyContext(
    template: ErrorMessageTemplate,
    context: MessageContext,
    locale: SupportedLocale,
    _politeness: PolitenessLevel
  ): ErrorMessageTemplate {
    let message = template.message
    let userMessage = template.userMessage

    // コンテキスト変数の置換
    if (context.fieldName) {
      message = message.replaceAll('{fieldName}', context.fieldName)
      userMessage = userMessage.replaceAll('{fieldName}', context.fieldName)
    }

    if (context.value !== undefined) {
      const formattedValue = this.formatValue(context.value, locale)
      message = message.replaceAll('{value}', formattedValue)
      userMessage = userMessage.replaceAll('{value}', formattedValue)
    }

    if (context.resourceType) {
      message = message.replaceAll('{resourceType}', context.resourceType)
      userMessage = userMessage.replaceAll(
        '{resourceType}',
        context.resourceType
      )
    }

    return {
      ...template,
      message,
      userMessage,
    }
  }

  /**
   * 値を地域設定に基づいてフォーマット
   */
  private formatValue(value: unknown, locale: SupportedLocale): string {
    if (typeof value === 'number') {
      return new Intl.NumberFormat(locale).format(value)
    }

    if (value instanceof Date) {
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(value)
    }

    if (typeof value === 'string' && value.length > 50) {
      return `${value.slice(0, 47)}...`
    }

    return String(value)
  }

  /**
   * 中国語のカテゴリメッセージ
   */
  private getChineseCategoryMessage(
    category: ErrorCategory,
    _severity: ErrorSeverity,
    _context: MessageContext
  ): string {
    const isTraditional =
      this.localeConfig.locale === SupportedLocale.CHINESE_TRADITIONAL

    if (isTraditional) {
      switch (category) {
        case ErrorCategory.AUTHENTICATION: {
          return '需要登入。請進行身份驗證。'
        }
        case ErrorCategory.AUTHORIZATION: {
          return '沒有存取權限。請聯絡管理員。'
        }
        case ErrorCategory.RESOURCE_NOT_FOUND: {
          return '找不到資源。請確認URL或搜尋條件。'
        }
        case ErrorCategory.SYSTEM: {
          return '系統發生錯誤。請稍後再試。'
        }
        case ErrorCategory.VALIDATION: {
          return '輸入內容有問題。請重新確認。'
        }
        default: {
          return '發生錯誤。'
        }
      }
    } else {
      switch (category) {
        case ErrorCategory.AUTHENTICATION: {
          return '需要登录。请进行身份验证。'
        }
        case ErrorCategory.AUTHORIZATION: {
          return '没有访问权限。请联系管理员。'
        }
        case ErrorCategory.RESOURCE_NOT_FOUND: {
          return '找不到资源。请确认URL或搜索条件。'
        }
        case ErrorCategory.SYSTEM: {
          return '系统发生错误。请稍后再试。'
        }
        case ErrorCategory.VALIDATION: {
          return '输入内容有问题。请重新确认。'
        }
        default: {
          return '发生错误。'
        }
      }
    }
  }

  /**
   * 英語の基本メッセージ
   */
  private getEnglishBaseMessage(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION: {
        return 'Authentication required'
      }
      case ErrorCategory.AUTHORIZATION: {
        return 'Access denied'
      }
      case ErrorCategory.RESOURCE_NOT_FOUND: {
        return 'Resource not found'
      }
      case ErrorCategory.SYSTEM: {
        return 'System error occurred'
      }
      case ErrorCategory.VALIDATION: {
        return 'Invalid input'
      }
      default: {
        return 'An error occurred'
      }
    }
  }

  /**
   * 英語のカテゴリメッセージ
   */
  private getEnglishCategoryMessage(
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: MessageContext
  ): string {
    const base = this.getEnglishBaseMessage(category)
    const suggestion = this.getEnglishSuggestion(category, context)

    return `${base}${suggestion}`
  }

  /**
   * 英語の提案メッセージ
   */
  private getEnglishSuggestion(
    category: ErrorCategory,
    context: MessageContext
  ): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION: {
        return '. Please log in to continue.'
      }
      case ErrorCategory.AUTHORIZATION: {
        return '. Contact your administrator for access.'
      }
      case ErrorCategory.RESOURCE_NOT_FOUND: {
        return '. Please verify the URL or search criteria.'
      }
      case ErrorCategory.SYSTEM: {
        return '. Please try again later.'
      }
      case ErrorCategory.VALIDATION: {
        return context.fieldName
          ? `. Please check the ${context.fieldName} field.`
          : '. Please check your input.'
      }
      default: {
        return '.'
      }
    }
  }

  /**
   * 汎用エラーメッセージを取得
   */
  private getGenericErrorMessage(
    locale: SupportedLocale,
    politeness: PolitenessLevel
  ): ErrorMessageTemplate {
    switch (locale) {
      case SupportedLocale.ENGLISH_UK:
      case SupportedLocale.ENGLISH_US: {
        return {
          description: 'An unexpected system error occurred',
          message: 'An error occurred',
          suggestions: [
            'Please try again later',
            'Contact support if the problem persists',
          ],
          userMessage: 'We encountered an error while processing your request',
        }
      }
      case SupportedLocale.JAPANESE: {
        return {
          description: 'システムで予期しないエラーが発生しました',
          message: 'エラーが発生しました',
          suggestions: [
            'しばらく時間をおいてから再度お試しください',
            '問題が続く場合は管理者にお問い合わせください',
          ],
          userMessage:
            politeness === PolitenessLevel.FORMAL
              ? '申し訳ございませんが、エラーが発生いたしました'
              : 'エラーが発生しました',
        }
      }
      default: {
        return {
          description: 'システムエラー',
          message: 'エラーが発生しました',
          suggestions: ['再度お試しください'],
          userMessage: 'エラーが発生しました',
        }
      }
    }
  }

  /**
   * 日本語の基本メッセージ
   */
  private getJapaneseBaseMessage(
    category: ErrorCategory,
    politeness: PolitenessLevel
  ): string {
    const messages = {
      [ErrorCategory.AUTHENTICATION]: {
        [PolitenessLevel.BUSINESS]: 'ログイン認証が必要です',
        [PolitenessLevel.CASUAL]: 'ログインして',
        [PolitenessLevel.FORMAL]: 'ログインしていただく必要があります',
        [PolitenessLevel.POLITE]: 'ログインしてください',
      },
      [ErrorCategory.AUTHORIZATION]: {
        [PolitenessLevel.BUSINESS]: 'アクセス権限が不足しています',
        [PolitenessLevel.CASUAL]: 'アクセスできない',
        [PolitenessLevel.FORMAL]: 'アクセス権限がございません',
        [PolitenessLevel.POLITE]: 'アクセスできません',
      },
      [ErrorCategory.BUSINESS_LOGIC]: {
        [PolitenessLevel.BUSINESS]: 'ビジネスルール違反',
        [PolitenessLevel.CASUAL]: 'ルール違反',
        [PolitenessLevel.FORMAL]: 'ビジネスルールに反しております',
        [PolitenessLevel.POLITE]: 'ビジネスルールに違反しています',
      },
      [ErrorCategory.DATABASE]: {
        [PolitenessLevel.BUSINESS]: 'データベースエラー',
        [PolitenessLevel.CASUAL]: 'データエラー',
        [PolitenessLevel.FORMAL]: 'データベースで問題が発生いたしました',
        [PolitenessLevel.POLITE]: 'データベースエラーが発生しました',
      },
      [ErrorCategory.EXTERNAL_SERVICE]: {
        [PolitenessLevel.BUSINESS]: '外部サービスエラー',
        [PolitenessLevel.CASUAL]: 'サービスエラー',
        [PolitenessLevel.FORMAL]: '外部サービスで問題が発生いたしました',
        [PolitenessLevel.POLITE]: '外部サービスエラーが発生しました',
      },
      [ErrorCategory.NETWORK]: {
        [PolitenessLevel.BUSINESS]: 'ネットワーク接続エラーが発生しています',
        [PolitenessLevel.CASUAL]: 'ネットワークエラー',
        [PolitenessLevel.FORMAL]: 'ネットワーク接続に問題が発生いたしました',
        [PolitenessLevel.POLITE]: 'ネットワークエラーが発生しました',
      },
      [ErrorCategory.RATE_LIMIT]: {
        [PolitenessLevel.BUSINESS]: 'レート制限に達しています',
        [PolitenessLevel.CASUAL]: 'アクセス制限中',
        [PolitenessLevel.FORMAL]: 'アクセス回数の制限に達しております',
        [PolitenessLevel.POLITE]: 'アクセス制限に達しています',
      },
      [ErrorCategory.RESOURCE_NOT_FOUND]: {
        [PolitenessLevel.BUSINESS]: 'リソースが存在しません',
        [PolitenessLevel.FORMAL]: '見つけることができませんでした',
        [PolitenessLevel.POLITE]: '見つかりません',
      },
      [ErrorCategory.SYSTEM]: {
        [PolitenessLevel.BUSINESS]: 'システム障害が発生しています',
        [PolitenessLevel.CASUAL]: 'システムエラー',
        [PolitenessLevel.FORMAL]: 'システムで問題が発生いたしました',
        [PolitenessLevel.POLITE]: 'システムエラーが発生しました',
      },
      [ErrorCategory.VALIDATION]: {
        [PolitenessLevel.BUSINESS]: '入力データが要件を満たしていません',
        [PolitenessLevel.CASUAL]: '入力に問題がある',
        [PolitenessLevel.FORMAL]: '入力内容を確認していただけますでしょうか',
        [PolitenessLevel.POLITE]: '入力内容に問題があります',
      },
    }

    // 型安全なメッセージ取得
    // eslint-disable-next-line security/detect-object-injection
    const categoryMessages = messages[category]
    const systemMessages = messages[ErrorCategory.SYSTEM]

    if (categoryMessages && politeness in categoryMessages) {
      return categoryMessages[politeness as keyof typeof categoryMessages]
    }

    if (systemMessages && politeness in systemMessages) {
      return systemMessages[politeness as keyof typeof systemMessages]
    }

    return 'エラーが発生しました'
  }

  /**
   * 日本語のカテゴリメッセージ
   */
  private getJapaneseCategoryMessage(
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: MessageContext
  ): string {
    const politeness = this.localeConfig.politenessLevel
    const _timeGreeting = this.getTimeBasedGreeting(SupportedLocale.JAPANESE)

    const base = this.getJapaneseBaseMessage(category, politeness)
    const severityModifier = this.getJapaneseSeverityModifier(severity)
    const suggestion = this.getJapaneseSuggestion(category, context)

    let message = base
    if (severityModifier) {
      message = `${severityModifier}${message}`
    }
    if (suggestion) {
      message = `${message}${suggestion}`
    }

    return message
  }

  /**
   * 日本語の重要度修飾語
   */
  private getJapaneseSeverityModifier(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL: {
        return '緊急: '
      }
      case ErrorSeverity.HIGH: {
        return '重要: '
      }
      case ErrorSeverity.LOW: {
        return ''
      }
      case ErrorSeverity.MEDIUM: {
        return ''
      }
      default: {
        return ''
      }
    }
  }

  /**
   * 日本語の提案メッセージ
   */
  private getJapaneseSuggestion(
    category: ErrorCategory,
    context: MessageContext
  ): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION: {
        return '。ログイン画面から認証を行ってください。'
      }
      case ErrorCategory.AUTHORIZATION: {
        return '。管理者にお問い合わせください。'
      }
      case ErrorCategory.RESOURCE_NOT_FOUND: {
        return '。URLまたは検索条件をご確認ください。'
      }
      case ErrorCategory.SYSTEM: {
        return '。しばらく時間をおいてから再度お試しください。'
      }
      case ErrorCategory.VALIDATION: {
        return context.fieldName
          ? `。${context.fieldName}の入力内容をご確認ください。`
          : '。入力内容をご確認ください。'
      }
      default: {
        return '。'
      }
    }
  }

  /**
   * 韓国語のカテゴリメッセージ
   */
  private getKoreanCategoryMessage(
    category: ErrorCategory,
    _severity: ErrorSeverity,
    _context: MessageContext
  ): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION: {
        return '로그인이 필요합니다. 인증을 진행해 주세요.'
      }
      case ErrorCategory.AUTHORIZATION: {
        return '접근 권한이 없습니다. 관리자에게 문의하세요.'
      }
      case ErrorCategory.RESOURCE_NOT_FOUND: {
        return '리소스를 찾을 수 없습니다. URL이나 검색 조건을 확인해 주세요.'
      }
      case ErrorCategory.SYSTEM: {
        return '시스템 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      }
      case ErrorCategory.VALIDATION: {
        return '입력 내용에 문제가 있습니다. 다시 확인해 주세요.'
      }
      default: {
        return '오류가 발생했습니다.'
      }
    }
  }

  /**
   * 時間帯に基づく挨拶を取得
   */
  private getTimeBasedGreeting(locale: SupportedLocale): string {
    const hour = new Date().getHours()
    let timeOfDay: MessageContext['timeOfDay']

    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning'
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon'
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening'
    } else {
      timeOfDay = 'night'
    }

    switch (locale) {
      case SupportedLocale.ENGLISH_UK:
      case SupportedLocale.ENGLISH_US: {
        switch (timeOfDay) {
          case 'afternoon': {
            return 'Good afternoon. '
          }
          case 'evening': {
            return 'Good evening. '
          }
          case 'morning': {
            return 'Good morning. '
          }
          case 'night': {
            return 'Hello. '
          }
        }
      }
      case SupportedLocale.JAPANESE: {
        switch (timeOfDay) {
          case 'afternoon': {
            return 'こんにちは。'
          }
          case 'evening': {
            return 'こんばんは。'
          }
          case 'morning': {
            return 'おはようございます。'
          }
          case 'night': {
            return 'お疲れ様です。'
          }
        }
      }
    }

    return ''
  }

  /**
   * メッセージテンプレートを初期化
   */
  private initializeMessageTemplates(): void {
    // 実際の実装では、外部ファイルまたはデータベースから読み込み
    // ここでは簡略化した例を示す
    this.messageTemplates.set(SupportedLocale.JAPANESE, new Map())
    this.messageTemplates.set(SupportedLocale.ENGLISH_US, new Map())
    this.messageTemplates.set(SupportedLocale.KOREAN, new Map())
    this.messageTemplates.set(SupportedLocale.CHINESE_SIMPLIFIED, new Map())
    this.messageTemplates.set(SupportedLocale.CHINESE_TRADITIONAL, new Map())
  }
}

/**
 * グローバルI18nインスタンス
 */
let globalI18n: GraphQLErrorI18n | undefined

/**
 * グローバルI18nインスタンスを取得
 */
export function getErrorI18n(): GraphQLErrorI18n {
  globalI18n ??= new GraphQLErrorI18n()
  return globalI18n
}

/**
 * I18nシステムを初期化
 */
export function initializeErrorI18n(
  config?: Partial<LocaleConfig>
): GraphQLErrorI18n {
  globalI18n = new GraphQLErrorI18n(config)
  return globalI18n
}

/**
 * エラーメッセージをローカライズするヘルパー関数
 */
export function localizeErrorMessage(
  errorCode: ErrorCode,
  context?: MessageContext,
  locale?: SupportedLocale,
  politeness?: PolitenessLevel
): string {
  const i18n = getErrorI18n()
  const template = i18n.getLocalizedMessage(
    errorCode,
    context,
    locale,
    politeness
  )
  return template.userMessage
}

/**
 * Accept-Languageヘッダーからロケールを解析
 */
export function parseAcceptLanguage(acceptLanguage: string): SupportedLocale {
  if (!acceptLanguage) return SupportedLocale.JAPANESE

  const languages = acceptLanguage
    .split(',')
    .map((lang) => lang.split(';')[0].trim())

  for (const lang of languages) {
    switch (lang.toLowerCase()) {
      case 'en':
      case 'en-us': {
        return SupportedLocale.ENGLISH_US
      }
      case 'en-gb': {
        return SupportedLocale.ENGLISH_UK
      }
      case 'ja':
      case 'ja-jp': {
        return SupportedLocale.JAPANESE
      }
      case 'ko':
      case 'ko-kr': {
        return SupportedLocale.KOREAN
      }
      case 'zh':
      case 'zh-cn': {
        return SupportedLocale.CHINESE_SIMPLIFIED
      }
      case 'zh-tw': {
        return SupportedLocale.CHINESE_TRADITIONAL
      }
    }
  }

  return SupportedLocale.JAPANESE
}
