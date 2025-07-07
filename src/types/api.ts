/**
 * API関連の型定義
 * @fileoverview APIレスポンスやエラーに関する型定義
 */

/**
 * APIエラーコードの定義
 */
export enum ApiErrorCode {
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * APIエラーレスポンスの型定義
 */
export interface ApiErrorResponse {
  error: {
    code: string
    details?: unknown
    message: string
  }
  success: false
}

/**
 * APIリクエストオプションの型定義
 */
export interface ApiRequestOptions {
  body?: unknown
  headers?: Record<string, string>
  method?: HttpMethod
  params?: Record<string, boolean | number | string>
}

/**
 * APIレスポンスの統合型
 */
export type ApiResponse<T> = ApiErrorResponse | ApiSuccessResponse<T>

/**
 * API成功レスポンスの型定義
 */
export interface ApiSuccessResponse<T> {
  data: T
  message?: string
  success: true
}

/**
 * HTTPメソッドの型定義
 */
export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

/**
 * ページネーション付きレスポンスの型定義
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

/**
 * ページネーション情報の型定義
 */
export interface PaginationInfo {
  hasNext: boolean
  hasPrevious: boolean
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
