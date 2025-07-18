import { NextResponse } from 'next/server'

import type { ApiResponse } from '@/types/api'

/**
 * エラーレスポンスを作成する
 */
export function createErrorResponse(
  code: string,
  message: string,
  status = 500,
  details?: unknown
): NextResponse {
  const response: ApiResponse<undefined> = {
    data: undefined,
    error: {
      code,
      details,
      message,
    },
    success: false,
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(response, { status })
}

/**
 * 成功レスポンスを作成する
 */
export function createSuccessResponse<T>(
  data: T,
  statusOrMetadata: number | Record<string, unknown> = 200
): NextResponse {
  const status = typeof statusOrMetadata === 'number' ? statusOrMetadata : 200
  const metadata = typeof statusOrMetadata === 'object' ? statusOrMetadata : {}

  const response: ApiResponse<T> = {
    data,
    success: true,
    timestamp: new Date().toISOString(),
    ...metadata,
  }
  return NextResponse.json(response, { status })
}

/**
 * バリデーションエラーレスポンスを作成する
 */
export function createValidationErrorResponse(details: unknown): NextResponse {
  return createErrorResponse(
    'VALIDATION_ERROR',
    'バリデーションエラー',
    400,
    details
  )
}
