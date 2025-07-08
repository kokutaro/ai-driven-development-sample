import type { ApiResponse } from '@/types/api'

/**
 * APIクライアントのリクエストオプション
 */
export interface APIClientOptions extends RequestInit {
  /** リクエストボディデータ */
  data?: unknown
  /** クエリパラメータ */
  params?: Record<string, boolean | number | string | undefined>
  /** APIエンドポイントのパス */
  path: string
}

/**
 * APIクライアントエラークラス
 *
 * APIリクエストで発生したエラーの詳細情報を保持します。
 * HTTPステータスコードやAPIレスポンスの詳細を含みます。
 */
export class APIClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response?: ApiResponse<unknown>
  ) {
    super(message)
    this.name = 'APIClientError'
  }
}

/**
 * クエリパラメータをURLSearchParamsに変換する
 *
 * @param params - クエリパラメータオブジェクト
 * @returns URLSearchParams インスタンス
 */
function buildSearchParams(
  params: Record<string, boolean | number | string | undefined>
): URLSearchParams {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  }

  return searchParams
}

/**
 * APIレスポンスを処理し、エラー時は適切な例外を投げる
 *
 * @param response - Fetchレスポンス
 * @returns 型安全なAPIデータ
 * @throws APIClientError - API呼び出しが失敗した場合
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  let result: ApiResponse<T>

  try {
    result = (await response.json()) as ApiResponse<T>
  } catch (parseError) {
    console.error('APIレスポンスのJSONパースに失敗しました:', parseError)
    throw new APIClientError(
      'サーバーレスポンスの解析に失敗しました',
      response.status
    )
  }

  // 401エラーの場合はサインインページにリダイレクト
  if (response.status === 401) {
    console.error('認証エラー (401):', result.error?.message ?? 'Unauthorized')
    redirectToSignIn()
    throw new APIClientError(
      '認証が必要です。サインインページにリダイレクトしています。',
      401,
      result
    )
  }

  // その他のHTTPエラーまたはAPIエラーレスポンス
  if (!response.ok || !result.success) {
    const errorMessage =
      result.error?.message ?? `HTTP Error: ${response.status}`

    console.error(`API Error (${response.status}):`, {
      details: result.error?.details,
      message: errorMessage,
      path: response.url,
    })

    throw new APIClientError(errorMessage, response.status, result)
  }

  return result.data
}

/**
 * 401エラー時にサインインページにリダイレクトする
 *
 * クライアントサイドでのみ実行され、ブラウザを `/auth/signin` ページに誘導します。
 * サーバーサイドレンダリング時は何も実行しません。
 */
function redirectToSignIn(): void {
  if (globalThis.window !== undefined) {
    console.warn('認証が必要です。サインインページにリダイレクトします。')
    globalThis.window.location.href = '/auth/signin'
  }
}

/**
 * 共通APIクライアント
 *
 * 全てのAPI呼び出しで使用する共通機能を提供します：
 * - 401エラー時の自動サインインページリダイレクト
 * - 統一されたエラーハンドリングとログ出力
 * - 型安全なリクエスト/レスポンス処理
 * - Content-Typeの自動設定
 */
export const apiClient = {
  /**
   * DELETE リクエストを実行
   *
   * @param path - APIエンドポイントのパス
   * @param options - 追加のリクエストオプション（オプション）
   * @returns 型安全なAPIレスポンスデータ
   */
  async delete<T>(
    path: string,
    options?: Omit<RequestInit, 'body' | 'method'>
  ): Promise<T> {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      method: 'DELETE',
    })

    return handleApiResponse<T>(response)
  },

  /**
   * GET リクエストを実行
   *
   * @param path - APIエンドポイントのパス
   * @param params - クエリパラメータ（オプション）
   * @param options - 追加のリクエストオプション（オプション）
   * @returns 型安全なAPIレスポンスデータ
   */
  async get<T>(
    path: string,
    params?: Record<string, boolean | number | string | undefined>,
    options?: Omit<RequestInit, 'body' | 'method'>
  ): Promise<T> {
    const searchParams = params ? buildSearchParams(params) : undefined
    const url = searchParams ? `${path}?${searchParams.toString()}` : path

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      method: 'GET',
    })

    return handleApiResponse<T>(response)
  },

  /**
   * PATCH リクエストを実行
   *
   * @param path - APIエンドポイントのパス
   * @param data - リクエストボディデータ（オプション）
   * @param options - 追加のリクエストオプション（オプション）
   * @returns 型安全なAPIレスポンスデータ
   */
  async patch<T>(
    path: string,
    data?: unknown,
    options?: Omit<RequestInit, 'body' | 'method'>
  ): Promise<T> {
    const response = await fetch(path, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      method: 'PATCH',
    })

    return handleApiResponse<T>(response)
  },

  /**
   * POST リクエストを実行
   *
   * @param path - APIエンドポイントのパス
   * @param data - リクエストボディデータ（オプション）
   * @param options - 追加のリクエストオプション（オプション）
   * @returns 型安全なAPIレスポンスデータ
   */
  async post<T>(
    path: string,
    data?: unknown,
    options?: Omit<RequestInit, 'body' | 'method'>
  ): Promise<T> {
    const response = await fetch(path, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      method: 'POST',
    })

    return handleApiResponse<T>(response)
  },

  /**
   * PUT リクエストを実行
   *
   * @param path - APIエンドポイントのパス
   * @param data - リクエストボディデータ（オプション）
   * @param options - 追加のリクエストオプション（オプション）
   * @returns 型安全なAPIレスポンスデータ
   */
  async put<T>(
    path: string,
    data?: unknown,
    options?: Omit<RequestInit, 'body' | 'method'>
  ): Promise<T> {
    const response = await fetch(path, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      method: 'PUT',
    })

    return handleApiResponse<T>(response)
  },
}
