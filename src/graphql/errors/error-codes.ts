/**
 * GraphQLエラーコード体系
 *
 * プロダクション環境での一貫したエラーハンドリングのための
 * 体系化されたエラーコード定義と分類システムです。
 */

/**
 * 認証関連エラーコード
 */
export const AuthErrorCodes = {
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  LOGIN_REQUIRED: 'LOGIN_REQUIRED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_MISSING: 'TOKEN_MISSING',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
} as const

/**
 * 認可関連エラーコード
 */
export const AuthzErrorCodes = {
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  OWNER_ONLY: 'OWNER_ONLY',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',
  ROLE_REQUIRED: 'ROLE_REQUIRED',
} as const

/**
 * バリデーション関連エラーコード
 */
export const ValidationErrorCodes = {
  BAD_USER_INPUT: 'BAD_USER_INPUT',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  DUPLICATE_VALUE: 'DUPLICATE_VALUE',
  FIELD_TOO_LONG: 'FIELD_TOO_LONG',
  FIELD_TOO_SHORT: 'FIELD_TOO_SHORT',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_ENUM_VALUE: 'INVALID_ENUM_VALUE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_RELATIONSHIP: 'INVALID_RELATIONSHIP',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
} as const

/**
 * ビジネスロジック関連エラーコード
 */
export const BusinessLogicErrorCodes = {
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  CATEGORY_HAS_TODOS: 'CATEGORY_HAS_TODOS',
  CONFLICT: 'CONFLICT',
  DEPENDENCY_EXISTS: 'DEPENDENCY_EXISTS',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  MAX_SUBTASKS_EXCEEDED: 'MAX_SUBTASKS_EXCEEDED',
  OPERATION_NOT_PERMITTED: 'OPERATION_NOT_PERMITTED',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
  TODO_ALREADY_COMPLETED: 'TODO_ALREADY_COMPLETED',
  TODO_CANNOT_DELETE_WITH_SUBTASKS: 'TODO_CANNOT_DELETE_WITH_SUBTASKS',
} as const

/**
 * リソース関連エラーコード
 */
export const ResourceErrorCodes = {
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  SUBTASK_NOT_FOUND: 'SUBTASK_NOT_FOUND',
  TODO_NOT_FOUND: 'TODO_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
} as const

/**
 * データベース関連エラーコード
 */
export const DatabaseErrorCodes = {
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  DATABASE_ERROR: 'DATABASE_ERROR',
  DEADLOCK_DETECTED: 'DEADLOCK_DETECTED',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  QUERY_TIMEOUT: 'QUERY_TIMEOUT',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  UNIQUE_CONSTRAINT_VIOLATION: 'UNIQUE_CONSTRAINT_VIOLATION',
} as const

/**
 * 外部サービス関連エラーコード
 */
export const ExternalServiceErrorCodes = {
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_TIMEOUT: 'SERVICE_TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  STORAGE_SERVICE_ERROR: 'STORAGE_SERVICE_ERROR',
  THIRD_PARTY_ERROR: 'THIRD_PARTY_ERROR',
} as const

/**
 * システム関連エラーコード
 */
export const SystemErrorCodes = {
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  CPU_LIMIT_EXCEEDED: 'CPU_LIMIT_EXCEEDED',
  DISK_SPACE_FULL: 'DISK_SPACE_FULL',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
  MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

/**
 * ネットワーク・レート制限関連エラーコード
 */
export const NetworkErrorCodes = {
  BANDWIDTH_EXCEEDED: 'BANDWIDTH_EXCEEDED',
  CONNECTION_LOST: 'CONNECTION_LOST',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
} as const

/**
 * DataLoader関連エラーコード
 */
export const DataLoaderErrorCodes = {
  BATCH_LOAD_FAILED: 'BATCH_LOAD_FAILED',
  CACHE_ERROR: 'CACHE_ERROR',
  DATALOADER_ERROR: 'DATALOADER_ERROR',
  DATALOADER_TIMEOUT: 'DATALOADER_TIMEOUT',
} as const

/**
 * 全エラーコードの統合
 */
export const AllErrorCodes = {
  ...AuthErrorCodes,
  ...AuthzErrorCodes,
  ...ValidationErrorCodes,
  ...BusinessLogicErrorCodes,
  ...ResourceErrorCodes,
  ...DatabaseErrorCodes,
  ...ExternalServiceErrorCodes,
  ...SystemErrorCodes,
  ...NetworkErrorCodes,
  ...DataLoaderErrorCodes,
} as const

/**
 * エラーコード型定義
 */
export type ErrorCode = (typeof AllErrorCodes)[keyof typeof AllErrorCodes]

/**
 * エラーコード情報の型定義
 */
export interface ErrorCodeInfo {
  category: string
  code: ErrorCode
  description: string
  httpStatus: number
  logLevel: 'debug' | 'error' | 'fatal' | 'info' | 'warn'
  retryable: boolean
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM'
  userMessage: string
}

/**
 * エラーコード情報マッピング
 */
export const ErrorCodeInfoMap: Record<ErrorCode, ErrorCodeInfo> = {
  [`database_${DatabaseErrorCodes.CONSTRAINT_VIOLATION}`]: {
    category: 'DATABASE',
    code: DatabaseErrorCodes.CONSTRAINT_VIOLATION,
    description: 'Database constraint violation',
    httpStatus: 400,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'データ制約違反',
  },
  [`external_${ExternalServiceErrorCodes.SERVICE_UNAVAILABLE}`]: {
    category: 'EXTERNAL_SERVICE',
    code: ExternalServiceErrorCodes.SERVICE_UNAVAILABLE,
    description: 'External service unavailable',
    httpStatus: 503,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'サービスが利用できません',
  },
  [`system_${SystemErrorCodes.SERVICE_UNAVAILABLE}`]: {
    category: 'SYSTEM',
    code: SystemErrorCodes.SERVICE_UNAVAILABLE,
    description: 'Service temporarily unavailable',
    httpStatus: 503,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'サービスが一時的に利用できません',
  },
  [`validation_${ValidationErrorCodes.CONSTRAINT_VIOLATION}`]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.CONSTRAINT_VIOLATION,
    description: 'Data constraint violation',
    httpStatus: 400,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'データの制約に違反しています',
  },
  [AuthErrorCodes.ACCOUNT_LOCKED]: {
    category: 'AUTHENTICATION',
    code: AuthErrorCodes.ACCOUNT_LOCKED,
    description: 'User account is locked',
    httpStatus: 423,
    logLevel: 'warn',
    retryable: false,
    severity: 'HIGH',
    userMessage: 'アカウントがロックされています',
  },
  [AuthErrorCodes.INVALID_CREDENTIALS]: {
    category: 'AUTHENTICATION',
    code: AuthErrorCodes.INVALID_CREDENTIALS,
    description: 'Invalid username or password',
    httpStatus: 401,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'ユーザー名またはパスワードが正しくありません',
  },
  [AuthErrorCodes.LOGIN_REQUIRED]: {
    category: 'AUTHENTICATION',
    code: AuthErrorCodes.LOGIN_REQUIRED,
    description: 'Login is required for this operation',
    httpStatus: 401,
    logLevel: 'info',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'この操作にはログインが必要です',
  },
  [AuthErrorCodes.MFA_REQUIRED]: {
    category: 'AUTHENTICATION',
    code: AuthErrorCodes.MFA_REQUIRED,
    description: 'Multi-factor authentication is required',
    httpStatus: 401,
    logLevel: 'info',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '多要素認証が必要です',
  },
  [AuthErrorCodes.SESSION_EXPIRED]: {
    category: 'AUTHENTICATION',
    code: AuthErrorCodes.SESSION_EXPIRED,
    description: 'User session has expired',
    httpStatus: 401,
    logLevel: 'info',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'セッションが期限切れです',
  },

  [AuthErrorCodes.TOKEN_EXPIRED]: {
    category: 'AUTHENTICATION',
    code: AuthErrorCodes.TOKEN_EXPIRED,
    description: 'Authentication token has expired',
    httpStatus: 401,
    logLevel: 'info',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'セッションが期限切れです。再ログインしてください',
  },
  [AuthErrorCodes.TOKEN_INVALID]: {
    category: 'AUTHENTICATION',
    code: AuthErrorCodes.TOKEN_INVALID,
    description: 'Authentication token is invalid',
    httpStatus: 401,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '認証情報が無効です',
  },
  [AuthErrorCodes.TOKEN_MISSING]: {
    category: 'AUTHENTICATION',
    code: AuthErrorCodes.TOKEN_MISSING,
    description: 'Authentication token is missing',
    httpStatus: 401,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '認証情報が見つかりません',
  },
  // 認証エラー
  [AuthErrorCodes.UNAUTHENTICATED]: {
    category: 'AUTHENTICATION',
    code: AuthErrorCodes.UNAUTHENTICATED,
    description: 'User is not authenticated',
    httpStatus: 401,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'ログインが必要です',
  },
  [AuthzErrorCodes.ADMIN_REQUIRED]: {
    category: 'AUTHORIZATION',
    code: AuthzErrorCodes.ADMIN_REQUIRED,
    description: 'Administrator privileges required',
    httpStatus: 403,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '管理者権限が必要です',
  },
  // 認可エラー
  [AuthzErrorCodes.FORBIDDEN]: {
    category: 'AUTHORIZATION',
    code: AuthzErrorCodes.FORBIDDEN,
    description: 'Access to resource is forbidden',
    httpStatus: 403,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'このリソースにアクセスする権限がありません',
  },
  [AuthzErrorCodes.INSUFFICIENT_PERMISSIONS]: {
    category: 'AUTHORIZATION',
    code: AuthzErrorCodes.INSUFFICIENT_PERMISSIONS,
    description: 'User has insufficient permissions',
    httpStatus: 403,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '権限が不足しています',
  },

  [AuthzErrorCodes.OPERATION_NOT_ALLOWED]: {
    category: 'AUTHORIZATION',
    code: AuthzErrorCodes.OPERATION_NOT_ALLOWED,
    description: 'Operation is not allowed for current user',
    httpStatus: 403,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'この操作は許可されていません',
  },
  [AuthzErrorCodes.OWNER_ONLY]: {
    category: 'AUTHORIZATION',
    code: AuthzErrorCodes.OWNER_ONLY,
    description: 'Only resource owner can perform this operation',
    httpStatus: 403,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'リソースの所有者のみが実行できます',
  },
  [AuthzErrorCodes.RESOURCE_ACCESS_DENIED]: {
    category: 'AUTHORIZATION',
    code: AuthzErrorCodes.RESOURCE_ACCESS_DENIED,
    description: 'Access to specific resource is denied',
    httpStatus: 403,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'このリソースへのアクセスが拒否されました',
  },
  [AuthzErrorCodes.ROLE_REQUIRED]: {
    category: 'AUTHORIZATION',
    code: AuthzErrorCodes.ROLE_REQUIRED,
    description: 'Specific role is required for this operation',
    httpStatus: 403,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '特定の役割が必要です',
  },
  // ビジネスロジックエラー
  [BusinessLogicErrorCodes.BUSINESS_LOGIC_ERROR]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.BUSINESS_LOGIC_ERROR,
    description: 'Business logic validation failed',
    httpStatus: 422,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'ビジネスルールに違反しています',
  },
  [BusinessLogicErrorCodes.CATEGORY_HAS_TODOS]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.CATEGORY_HAS_TODOS,
    description: 'Cannot delete category with existing todos',
    httpStatus: 422,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'タスクが存在するカテゴリは削除できません',
  },
  [BusinessLogicErrorCodes.CONFLICT]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.CONFLICT,
    description: 'Resource conflict detected',
    httpStatus: 409,
    logLevel: 'warn',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'リソースの競合が発生しました',
  },
  [BusinessLogicErrorCodes.DEPENDENCY_EXISTS]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.DEPENDENCY_EXISTS,
    description: 'Cannot delete resource with dependencies',
    httpStatus: 422,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '依存関係があるため削除できません',
  },
  [BusinessLogicErrorCodes.INVALID_STATE_TRANSITION]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.INVALID_STATE_TRANSITION,
    description: 'Invalid state transition',
    httpStatus: 422,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '無効な状態遷移です',
  },
  [BusinessLogicErrorCodes.MAX_SUBTASKS_EXCEEDED]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.MAX_SUBTASKS_EXCEEDED,
    description: 'Maximum number of subtasks exceeded',
    httpStatus: 422,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'サブタスクの上限数を超えています',
  },
  [BusinessLogicErrorCodes.OPERATION_NOT_PERMITTED]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.OPERATION_NOT_PERMITTED,
    description: 'Operation is not permitted in current state',
    httpStatus: 422,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '現在の状態では実行できません',
  },

  [BusinessLogicErrorCodes.PRECONDITION_FAILED]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.PRECONDITION_FAILED,
    description: 'Precondition for operation not met',
    httpStatus: 412,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '操作の前提条件が満たされていません',
  },
  [BusinessLogicErrorCodes.TODO_ALREADY_COMPLETED]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.TODO_ALREADY_COMPLETED,
    description: 'Todo is already completed',
    httpStatus: 422,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: 'このタスクは既に完了しています',
  },
  [BusinessLogicErrorCodes.TODO_CANNOT_DELETE_WITH_SUBTASKS]: {
    category: 'BUSINESS_LOGIC',
    code: BusinessLogicErrorCodes.TODO_CANNOT_DELETE_WITH_SUBTASKS,
    description: 'Cannot delete todo with existing subtasks',
    httpStatus: 422,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'サブタスクがあるため削除できません',
  },
  [DatabaseErrorCodes.CONNECTION_ERROR]: {
    category: 'DATABASE',
    code: DatabaseErrorCodes.CONNECTION_ERROR,
    description: 'Database connection failed',
    httpStatus: 503,
    logLevel: 'error',
    retryable: true,
    severity: 'CRITICAL',
    userMessage: 'データベース接続エラー',
  },
  // データベースエラー
  [DatabaseErrorCodes.DATABASE_ERROR]: {
    category: 'DATABASE',
    code: DatabaseErrorCodes.DATABASE_ERROR,
    description: 'Database operation failed',
    httpStatus: 500,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'データベースエラーが発生しました',
  },
  [DatabaseErrorCodes.DEADLOCK_DETECTED]: {
    category: 'DATABASE',
    code: DatabaseErrorCodes.DEADLOCK_DETECTED,
    description: 'Database deadlock detected',
    httpStatus: 500,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'データベースデッドロック',
  },
  [DatabaseErrorCodes.FOREIGN_KEY_VIOLATION]: {
    category: 'DATABASE',
    code: DatabaseErrorCodes.FOREIGN_KEY_VIOLATION,
    description: 'Foreign key constraint violation',
    httpStatus: 400,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '関連データの制約違反',
  },
  [DatabaseErrorCodes.QUERY_TIMEOUT]: {
    category: 'DATABASE',
    code: DatabaseErrorCodes.QUERY_TIMEOUT,
    description: 'Database query timeout',
    httpStatus: 504,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'データベースクエリがタイムアウトしました',
  },
  [DatabaseErrorCodes.TRANSACTION_FAILED]: {
    category: 'DATABASE',
    code: DatabaseErrorCodes.TRANSACTION_FAILED,
    description: 'Database transaction failed',
    httpStatus: 500,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'データベーストランザクションエラー',
  },
  [DatabaseErrorCodes.UNIQUE_CONSTRAINT_VIOLATION]: {
    category: 'DATABASE',
    code: DatabaseErrorCodes.UNIQUE_CONSTRAINT_VIOLATION,
    description: 'Unique constraint violation',
    httpStatus: 409,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '重複データエラー',
  },

  [DataLoaderErrorCodes.BATCH_LOAD_FAILED]: {
    category: 'DATABASE',
    code: DataLoaderErrorCodes.BATCH_LOAD_FAILED,
    description: 'Batch load operation failed',
    httpStatus: 500,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'バッチ処理エラー',
  },
  [DataLoaderErrorCodes.CACHE_ERROR]: {
    category: 'SYSTEM',
    code: DataLoaderErrorCodes.CACHE_ERROR,
    description: 'Cache operation error',
    httpStatus: 500,
    logLevel: 'warn',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'キャッシュエラー',
  },
  // DataLoaderエラー
  [DataLoaderErrorCodes.DATALOADER_ERROR]: {
    category: 'DATABASE',
    code: DataLoaderErrorCodes.DATALOADER_ERROR,
    description: 'DataLoader error',
    httpStatus: 500,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'データ読み込みエラー',
  },
  [DataLoaderErrorCodes.DATALOADER_TIMEOUT]: {
    category: 'DATABASE',
    code: DataLoaderErrorCodes.DATALOADER_TIMEOUT,
    description: 'DataLoader operation timeout',
    httpStatus: 504,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'データ読み込みタイムアウト',
  },
  [ExternalServiceErrorCodes.API_QUOTA_EXCEEDED]: {
    category: 'EXTERNAL_SERVICE',
    code: ExternalServiceErrorCodes.API_QUOTA_EXCEEDED,
    description: 'API quota exceeded',
    httpStatus: 429,
    logLevel: 'warn',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'API使用量の上限に達しました',
  },
  [ExternalServiceErrorCodes.EMAIL_SERVICE_ERROR]: {
    category: 'EXTERNAL_SERVICE',
    code: ExternalServiceErrorCodes.EMAIL_SERVICE_ERROR,
    description: 'Email service error',
    httpStatus: 502,
    logLevel: 'error',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'メール送信エラー',
  },
  // 外部サービスエラー
  [ExternalServiceErrorCodes.EXTERNAL_SERVICE_ERROR]: {
    category: 'EXTERNAL_SERVICE',
    code: ExternalServiceErrorCodes.EXTERNAL_SERVICE_ERROR,
    description: 'External service error',
    httpStatus: 502,
    logLevel: 'error',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: '外部サービスエラー',
  },

  [ExternalServiceErrorCodes.SERVICE_TIMEOUT]: {
    category: 'EXTERNAL_SERVICE',
    code: ExternalServiceErrorCodes.SERVICE_TIMEOUT,
    description: 'External service timeout',
    httpStatus: 504,
    logLevel: 'error',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'サービスがタイムアウトしました',
  },
  [ExternalServiceErrorCodes.SERVICE_UNAVAILABLE]: {
    category: 'EXTERNAL_SERVICE',
    code: ExternalServiceErrorCodes.SERVICE_UNAVAILABLE,
    description: 'Service unavailable',
    httpStatus: 503,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'サービスが利用できません',
  },
  [ExternalServiceErrorCodes.STORAGE_SERVICE_ERROR]: {
    category: 'EXTERNAL_SERVICE',
    code: ExternalServiceErrorCodes.STORAGE_SERVICE_ERROR,
    description: 'Storage service error',
    httpStatus: 502,
    logLevel: 'error',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'ストレージサービスエラー',
  },
  [ExternalServiceErrorCodes.THIRD_PARTY_ERROR]: {
    category: 'EXTERNAL_SERVICE',
    code: ExternalServiceErrorCodes.THIRD_PARTY_ERROR,
    description: 'Third party service error',
    httpStatus: 502,
    logLevel: 'error',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'サードパーティサービスエラー',
  },
  [NetworkErrorCodes.BANDWIDTH_EXCEEDED]: {
    category: 'NETWORK',
    code: NetworkErrorCodes.BANDWIDTH_EXCEEDED,
    description: 'Bandwidth limit exceeded',
    httpStatus: 509,
    logLevel: 'warn',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: '帯域幅制限に達しました',
  },
  [NetworkErrorCodes.CONNECTION_LOST]: {
    category: 'NETWORK',
    code: NetworkErrorCodes.CONNECTION_LOST,
    description: 'Network connection lost',
    httpStatus: 500,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'ネットワーク接続が切断されました',
  },
  [NetworkErrorCodes.NETWORK_ERROR]: {
    category: 'NETWORK',
    code: NetworkErrorCodes.NETWORK_ERROR,
    description: 'Network error',
    httpStatus: 500,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'ネットワークエラー',
  },
  // ネットワーク・レート制限エラー
  [NetworkErrorCodes.RATE_LIMIT_EXCEEDED]: {
    category: 'RATE_LIMIT',
    code: NetworkErrorCodes.RATE_LIMIT_EXCEEDED,
    description: 'Rate limit exceeded',
    httpStatus: 429,
    logLevel: 'warn',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'リクエスト制限に達しました',
  },

  [NetworkErrorCodes.REQUEST_TIMEOUT]: {
    category: 'NETWORK',
    code: NetworkErrorCodes.REQUEST_TIMEOUT,
    description: 'Request timeout',
    httpStatus: 408,
    logLevel: 'warn',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'リクエストがタイムアウトしました',
  },
  [NetworkErrorCodes.TOO_MANY_REQUESTS]: {
    category: 'RATE_LIMIT',
    code: NetworkErrorCodes.TOO_MANY_REQUESTS,
    description: 'Too many requests',
    httpStatus: 429,
    logLevel: 'warn',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'リクエストが多すぎます',
  },
  [ResourceErrorCodes.CATEGORY_NOT_FOUND]: {
    category: 'RESOURCE_NOT_FOUND',
    code: ResourceErrorCodes.CATEGORY_NOT_FOUND,
    description: 'Category not found',
    httpStatus: 404,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: 'カテゴリが見つかりません',
  },
  [ResourceErrorCodes.FILE_NOT_FOUND]: {
    category: 'RESOURCE_NOT_FOUND',
    code: ResourceErrorCodes.FILE_NOT_FOUND,
    description: 'File not found',
    httpStatus: 404,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: 'ファイルが見つかりません',
  },
  [ResourceErrorCodes.RESOURCE_ALREADY_EXISTS]: {
    category: 'RESOURCE_NOT_FOUND',
    code: ResourceErrorCodes.RESOURCE_ALREADY_EXISTS,
    description: 'Resource already exists',
    httpStatus: 409,
    logLevel: 'info',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'リソースは既に存在しています',
  },
  // リソースエラー
  [ResourceErrorCodes.RESOURCE_NOT_FOUND]: {
    category: 'RESOURCE_NOT_FOUND',
    code: ResourceErrorCodes.RESOURCE_NOT_FOUND,
    description: 'Requested resource not found',
    httpStatus: 404,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: 'リソースが見つかりません',
  },
  [ResourceErrorCodes.SUBTASK_NOT_FOUND]: {
    category: 'RESOURCE_NOT_FOUND',
    code: ResourceErrorCodes.SUBTASK_NOT_FOUND,
    description: 'Subtask not found',
    httpStatus: 404,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: 'サブタスクが見つかりません',
  },

  [ResourceErrorCodes.TODO_NOT_FOUND]: {
    category: 'RESOURCE_NOT_FOUND',
    code: ResourceErrorCodes.TODO_NOT_FOUND,
    description: 'Todo not found',
    httpStatus: 404,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: 'タスクが見つかりません',
  },
  [ResourceErrorCodes.USER_NOT_FOUND]: {
    category: 'RESOURCE_NOT_FOUND',
    code: ResourceErrorCodes.USER_NOT_FOUND,
    description: 'User not found',
    httpStatus: 404,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: 'ユーザーが見つかりません',
  },
  [SystemErrorCodes.CONFIGURATION_ERROR]: {
    category: 'SYSTEM',
    code: SystemErrorCodes.CONFIGURATION_ERROR,
    description: 'System configuration error',
    httpStatus: 500,
    logLevel: 'error',
    retryable: false,
    severity: 'CRITICAL',
    userMessage: 'システム設定エラー',
  },
  [SystemErrorCodes.CPU_LIMIT_EXCEEDED]: {
    category: 'SYSTEM',
    code: SystemErrorCodes.CPU_LIMIT_EXCEEDED,
    description: 'CPU limit exceeded',
    httpStatus: 507,
    logLevel: 'error',
    retryable: true,
    severity: 'HIGH',
    userMessage: 'CPU使用量の上限に達しました',
  },
  [SystemErrorCodes.DISK_SPACE_FULL]: {
    category: 'SYSTEM',
    code: SystemErrorCodes.DISK_SPACE_FULL,
    description: 'Disk space full',
    httpStatus: 507,
    logLevel: 'error',
    retryable: false,
    severity: 'CRITICAL',
    userMessage: 'ディスク容量不足',
  },
  // システムエラー
  [SystemErrorCodes.INTERNAL_SERVER_ERROR]: {
    category: 'SYSTEM',
    code: SystemErrorCodes.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    httpStatus: 500,
    logLevel: 'error',
    retryable: false,
    severity: 'CRITICAL',
    userMessage: 'サーバー内部エラー',
  },
  [SystemErrorCodes.MAINTENANCE_MODE]: {
    category: 'SYSTEM',
    code: SystemErrorCodes.MAINTENANCE_MODE,
    description: 'System is in maintenance mode',
    httpStatus: 503,
    logLevel: 'info',
    retryable: true,
    severity: 'MEDIUM',
    userMessage: 'システムメンテナンス中です',
  },

  [SystemErrorCodes.MEMORY_LIMIT_EXCEEDED]: {
    category: 'SYSTEM',
    code: SystemErrorCodes.MEMORY_LIMIT_EXCEEDED,
    description: 'Memory limit exceeded',
    httpStatus: 507,
    logLevel: 'error',
    retryable: false,
    severity: 'CRITICAL',
    userMessage: 'メモリ不足エラー',
  },
  // バリデーションエラー
  [ValidationErrorCodes.BAD_USER_INPUT]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.BAD_USER_INPUT,
    description: 'User input validation failed',
    httpStatus: 400,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: '入力内容に問題があります',
  },
  // 不足していたエラーコードマッピングを追加
  [ValidationErrorCodes.CONSTRAINT_VIOLATION]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.CONSTRAINT_VIOLATION,
    description: 'Constraint violation',
    httpStatus: 400,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: '制約違反エラー',
  },
  [ValidationErrorCodes.DUPLICATE_VALUE]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.DUPLICATE_VALUE,
    description: 'Value already exists',
    httpStatus: 409,
    logLevel: 'info',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'この値は既に存在しています',
  },
  [ValidationErrorCodes.FIELD_TOO_LONG]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.FIELD_TOO_LONG,
    description: 'Field value exceeds maximum length',
    httpStatus: 400,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: '入力値が長すぎます',
  },
  [ValidationErrorCodes.FIELD_TOO_SHORT]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.FIELD_TOO_SHORT,
    description: 'Field value is below minimum length',
    httpStatus: 400,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: '入力値が短すぎます',
  },

  [ValidationErrorCodes.INVALID_DATE]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.INVALID_DATE,
    description: 'Date format is invalid',
    httpStatus: 400,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: '日付の形式が正しくありません',
  },
  [ValidationErrorCodes.INVALID_EMAIL]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.INVALID_EMAIL,
    description: 'Email format is invalid',
    httpStatus: 400,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: 'メールアドレスの形式が正しくありません',
  },
  [ValidationErrorCodes.INVALID_ENUM_VALUE]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.INVALID_ENUM_VALUE,
    description: 'Enum value is not valid',
    httpStatus: 400,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: '選択値が無効です',
  },
  [ValidationErrorCodes.INVALID_FORMAT]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.INVALID_FORMAT,
    description: 'Input format is invalid',
    httpStatus: 400,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: '入力形式が正しくありません',
  },
  [ValidationErrorCodes.INVALID_RELATIONSHIP]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.INVALID_RELATIONSHIP,
    description: 'Invalid relationship between entities',
    httpStatus: 400,
    logLevel: 'warn',
    retryable: false,
    severity: 'MEDIUM',
    userMessage: 'データ間の関係が無効です',
  },
  [ValidationErrorCodes.REQUIRED_FIELD_MISSING]: {
    category: 'VALIDATION',
    code: ValidationErrorCodes.REQUIRED_FIELD_MISSING,
    description: 'Required field is missing',
    httpStatus: 400,
    logLevel: 'info',
    retryable: false,
    severity: 'LOW',
    userMessage: '必須項目が入力されていません',
  },
}

/**
 * エラーコード情報を取得する関数
 */
export function getErrorCodeInfo(code: ErrorCode): ErrorCodeInfo {
  if (Object.prototype.hasOwnProperty.call(ErrorCodeInfoMap, code)) {
    // eslint-disable-next-line security/detect-object-injection
    return ErrorCodeInfoMap[code]
  }
  return ErrorCodeInfoMap[SystemErrorCodes.INTERNAL_SERVER_ERROR]
}

/**
 * エラーコードからログレベルを取得
 */
export function getLogLevel(code: ErrorCode): ErrorCodeInfo['logLevel'] {
  return getErrorCodeInfo(code).logLevel
}

/**
 * HTTPステータスコードからエラー重要度を判定
 */
export function getSeverityFromHttpStatus(
  status: number
): ErrorCodeInfo['severity'] {
  if (status >= 500) return 'CRITICAL'
  if (status >= 400) return 'MEDIUM'
  return 'LOW'
}

/**
 * エラーが再試行可能かどうかを判定
 */
export function isRetryableError(code: ErrorCode): boolean {
  return getErrorCodeInfo(code).retryable
}
