/**
 * Prismaエラーハンドリング
 *
 * Prismaエラーを適切なGraphQLエラーに変換し、
 * プロダクション準備のための包括的なエラー処理を提供します。
 */
import { Prisma } from '@prisma/client'

import {
  BusinessLogicError,
  DatabaseError,
  InternalSystemError,
  ResourceNotFoundError,
  ValidationError,
} from './custom-errors'

import type { BaseGraphQLError } from './custom-errors'

/**
 * Prismaエラー情報の型定義
 */
export interface PrismaErrorInfo {
  clientVersion?: string
  code: string
  message: string
  meta?: Record<string, unknown>
}

/**
 * Prismaエラーオブジェクトの型定義
 */
export interface PrismaErrorObject {
  clientVersion?: string
  code: string
  message: string
  meta?: unknown
  stack?: string
}

/**
 * Prismaエラー変換結果の型定義
 */
export interface PrismaErrorTransformResult {
  error: BaseGraphQLError
  logLevel: 'debug' | 'error' | 'fatal' | 'info' | 'warn'
  shouldRetry: boolean
}

/**
 * Prismaエラーハンドラー
 */
export class PrismaErrorHandler {
  /**
   * 操作タイプに基づくエラーメッセージの生成
   */
  public static generateOperationSpecificMessage(
    operation: string,
    resource = 'リソース'
  ): string {
    switch (operation.toLowerCase()) {
      case 'count': {
        return `${resource}の件数取得に失敗しました`
      }
      case 'create': {
        return `${resource}の作成に失敗しました`
      }
      case 'delete': {
        return `${resource}の削除に失敗しました`
      }
      case 'find':
      case 'findFirst':
      case 'findMany': {
        return `${resource}の取得に失敗しました`
      }
      case 'update': {
        return `${resource}の更新に失敗しました`
      }
      case 'upsert': {
        return `${resource}の作成または更新に失敗しました`
      }
      default: {
        return `${resource}の操作に失敗しました`
      }
    }
  }

  /**
   * エラーがPrismaエラーかどうかを判定
   */
  public static isPrismaError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false
    }

    const errorObj = error as Record<string, unknown>

    // PrismaClientKnownRequestError
    if (errorObj instanceof Prisma.PrismaClientKnownRequestError) {
      return true
    }

    // PrismaClientUnknownRequestError
    if (errorObj instanceof Prisma.PrismaClientUnknownRequestError) {
      return true
    }

    // PrismaClientRustPanicError
    if (errorObj instanceof Prisma.PrismaClientRustPanicError) {
      return true
    }

    // PrismaClientInitializationError
    if (errorObj instanceof Prisma.PrismaClientInitializationError) {
      return true
    }

    // PrismaClientValidationError
    if (errorObj instanceof Prisma.PrismaClientValidationError) {
      return true
    }

    // エラーコードでの判定（上記以外の場合）
    return (
      'code' in errorObj &&
      typeof errorObj.code === 'string' &&
      errorObj.code.startsWith('P')
    )
  }

  /**
   * Prismaエラーをログ用にサニタイズ
   */
  public static sanitizePrismaErrorForLogging(error: unknown): unknown {
    if (!this.isPrismaError(error)) {
      return error
    }

    const prismaError = error as PrismaErrorObject

    return {
      clientVersion: prismaError.clientVersion,
      code: prismaError.code,
      message: prismaError.message,
      meta: this.sanitizeMetadata(prismaError.meta),
      // スタックトレースは開発環境のみ
      ...(process.env.NODE_ENV === 'development' && {
        stack: prismaError.stack,
      }),
    }
  }

  /**
   * PrismaエラーをGraphQLエラーに変換
   */
  public static transformPrismaError(
    error: unknown,
    operation?: string,
    resourceType?: string,
    resourceId?: string
  ): PrismaErrorTransformResult {
    // Prismaエラーかどうかをチェック
    if (!this.isPrismaError(error)) {
      return {
        error: new InternalSystemError(
          'Unknown database error',
          error instanceof Error ? error : new Error(String(error))
        ),
        logLevel: 'error',
        shouldRetry: false,
      }
    }

    const prismaError = error as PrismaErrorInfo

    // Prismaエラーコードに基づく変換
    switch (prismaError.code) {
      // === 接続・ネットワーク関連エラー ===
      case 'P1000': {
        // Authentication failed
        return {
          error: new DatabaseError(
            'データベース認証エラー',
            'authentication',
            error as Error
          ),
          logLevel: 'fatal',
          shouldRetry: false,
        }
      }

      case 'P1001': // Can't reach database server
      case 'P1002': // Database server timeout
      case 'P1008': // Operations timed out
      case 'P1009': // Database already exists
      case 'P1010': // User denied access
      case 'P1011': // Error opening a TLS connection
      case 'P1017': {
        // Server has closed the connection
        return {
          error: new DatabaseError(
            'データベース接続エラー',
            'connection',
            error as Error,
            {
              clientVersion: prismaError.clientVersion,
              prismaCode: prismaError.code,
              retryable: true,
            }
          ),
          logLevel: 'error',
          shouldRetry: true,
        }
      }

      case 'P1003': // Database does not exist
      case 'P1013': {
        // The provided database string is invalid
        return {
          error: new InternalSystemError(
            'データベース設定エラー',
            error as Error,
            {
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'fatal',
          shouldRetry: false,
        }
      }

      // === データ関連エラー ===
      case 'P2000': {
        // Value out of range
        return {
          error: new ValidationError(
            '値が有効範囲外です',
            { valueOutOfRange: toStringArray(prismaError.meta) },
            {
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'warn',
          shouldRetry: false,
        }
      }

      case 'P2001': {
        // Record not found
        return {
          error: new ResourceNotFoundError(
            resourceType ?? 'リソース',
            resourceId ?? 'unknown',
            {
              cause: prismaError.meta?.cause,
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'info',
          shouldRetry: false,
        }
      }

      case 'P2002': {
        // Unique constraint failed
        return {
          error: new ValidationError(
            '一意制約違反: 既に存在する値が指定されました',
            {
              modelName: toStringArray(prismaError.meta?.modelName),
              uniqueConstraint: toStringArray(prismaError.meta?.target),
            },
            {
              code: 'BAD_USER_INPUT',
              operation,
              prismaCode: prismaError.code,
              retryable: false,
            }
          ),
          logLevel: 'info',
          shouldRetry: false,
        }
      }

      case 'P2003': {
        // Foreign key constraint failed
        return {
          error: new ValidationError(
            '関連データの制約エラー: 参照先のデータが存在しません',
            {
              foreignKey: toSafeStringArray(prismaError.meta?.field_name),
              modelName: toStringArray(prismaError.meta?.modelName),
            },
            {
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'warn',
          shouldRetry: false,
        }
      }

      case 'P2004': {
        // Constraint failed
        return {
          error: new ValidationError(
            'データ制約違反が発生しました',
            {
              constraint: toSafeStringArray(prismaError.meta?.constraint),
              modelName: toStringArray(prismaError.meta?.modelName),
            },
            {
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'warn',
          shouldRetry: false,
        }
      }

      case 'P2005': // Invalid value for field
      case 'P2006': // Provided value is not valid
      case 'P2007': {
        // Data validation error
        return {
          error: new ValidationError(
            'データ形式エラー: 無効な値が指定されました',
            {
              field: toSafeStringArray(prismaError.meta?.field_name),
              modelName: toStringArray(prismaError.meta?.modelName),
              value: toStringArray(prismaError.meta?.field_value),
            },
            {
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'info',
          shouldRetry: false,
        }
      }

      case 'P2008': // Failed to parse query
      case 'P2009': // Failed to validate query
      case 'P2012': // Missing required value
      case 'P2013': {
        // Missing required argument
        return {
          error: new InternalSystemError('クエリ処理エラー', error as Error, {
            details: prismaError.meta,
            operation,
            prismaCode: prismaError.code,
          }),
          logLevel: 'error',
          shouldRetry: false,
        }
      }

      case 'P2014': // Required relation violates constraint
      case 'P2015': // Related record not found
      case 'P2016': // Query interpretation error
      case 'P2017': {
        // Records not connected
        return {
          error: new BusinessLogicError(
            'データ関係エラー: 関連データの整合性に問題があります',
            'data_relationship',
            {
              modelName: prismaError.meta?.model_name,
              operation,
              prismaCode: prismaError.code,
              relationName: prismaError.meta?.relation_name,
            }
          ),
          logLevel: 'warn',
          shouldRetry: false,
        }
      }

      case 'P2018': // Required connected records not found
      case 'P2019': // Input error
      case 'P2020': // Value out of range
      case 'P2021': // Table not found
      case 'P2022': {
        // Column not found
        return {
          error: new InternalSystemError(
            'データベーススキーマエラー',
            error as Error,
            {
              details: prismaError.meta,
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'error',
          shouldRetry: false,
        }
      }

      case 'P2023': {
        // Inconsistent column data
        return {
          error: new DatabaseError(
            'データ不整合エラー',
            'data_inconsistency',
            error as Error,
            {
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'error',
          shouldRetry: false,
        }
      }

      case 'P2024': {
        // Timed out acquiring a connection
        return {
          error: new DatabaseError(
            'データベース接続タイムアウト',
            'connection_timeout',
            error as Error,
            {
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'warn',
          shouldRetry: true,
        }
      }

      case 'P2025': {
        // Record not found in delete/update operation
        return {
          error: new ResourceNotFoundError(
            resourceType ?? 'レコード',
            resourceId ?? 'unknown',
            {
              cause: prismaError.meta?.cause,
              operation: operation ?? 'delete/update',
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'info',
          shouldRetry: false,
        }
      }

      case 'P2026': {
        // Unsupported feature
        return {
          error: new InternalSystemError(
            'サポートされていない機能です',
            error as Error,
            {
              feature: prismaError.meta?.feature,
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'error',
          shouldRetry: false,
        }
      }

      case 'P2027': {
        // Multiple errors during execution
        return {
          error: new DatabaseError(
            '複数のデータベースエラーが発生しました',
            'multiple_errors',
            error as Error,
            {
              errors: prismaError.meta?.errors,
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'error',
          shouldRetry: false,
        }
      }

      case 'P2028': {
        // Transaction API error
        return {
          error: new DatabaseError(
            'トランザクション処理エラー',
            'transaction',
            error as Error,
            {
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'error',
          shouldRetry: true,
        }
      }

      case 'P2030': // Cannot find fulltext index
      case 'P2031': // MongoDB needs replica set
      case 'P2033': // Number out of range
      case 'P2034': {
        // Transaction conflict
        return {
          error: new DatabaseError(
            'データベース操作エラー',
            'database_operation',
            error as Error,
            {
              details: prismaError.meta,
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'error',
          shouldRetry: prismaError.code === 'P2034', // 競合エラーの場合は再試行可能
        }
      }

      // === Migration関連エラー ===
      case 'P3000': // Failed to create database
      case 'P3001': // Migration possible with data loss
      case 'P3002': // Migration was rolled back
      case 'P3003': // Format of migration file invalid
      case 'P3004': // System database is not supported
      case 'P3005': {
        // Database schema is not empty
        return {
          error: new InternalSystemError(
            'データベースマイグレーションエラー',
            error as Error,
            {
              details: prismaError.meta,
              operation: 'migration',
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'fatal',
          shouldRetry: false,
        }
      }

      // === その他・未知のエラー ===
      default: {
        return {
          error: new DatabaseError(
            `未知のPrismaエラー: ${prismaError.message}`,
            'unknown',
            error as Error,
            {
              clientVersion: prismaError.clientVersion,
              operation,
              prismaCode: prismaError.code,
            }
          ),
          logLevel: 'error',
          shouldRetry: false,
        }
      }
    }
  }

  /**
   * Prismaエラーのメタデータをサニタイズ
   */
  private static sanitizeMetadata(meta: unknown): unknown {
    if (!meta || typeof meta !== 'object') {
      return meta
    }

    // 機密情報を除去
    const sanitized = { ...meta }

    // パスワードやトークンなどの機密情報を除去
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential']

    for (const field of sensitiveFields) {
      if (Object.prototype.hasOwnProperty.call(sanitized, field)) {
        // eslint-disable-next-line security/detect-object-injection
        ;(sanitized as Record<string, unknown>)[field] = '[REDACTED]'
      }
    }

    return sanitized
  }
}

/**
 * Prismaエラーを捕捉してGraphQLエラーに変換するデコレーター
 */
export function HandlePrismaError(operation?: string, resourceType?: string) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    target: unknown,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } catch (error) {
        const transformResult = PrismaErrorHandler.transformPrismaError(
          error,
          operation ?? propertyName,
          resourceType
        )

        throw transformResult.error
      }
    } as T

    return descriptor
  }
}

/**
 * Prismaエラーハンドリング用のヘルパー関数
 */
export async function withPrismaErrorHandling<T>(
  operation: () => Promise<T>,
  operationName?: string,
  resourceType?: string,
  resourceId?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const transformResult = PrismaErrorHandler.transformPrismaError(
      error,
      operationName,
      resourceType,
      resourceId
    )

    throw transformResult.error
  }
}

/**
 * unknown型をstring[]に安全に変換するヘルパー関数（単一値用）
 */
function toSafeStringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}

/**
 * unknown型をstring[]に安全に変換するヘルパー関数
 */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}
