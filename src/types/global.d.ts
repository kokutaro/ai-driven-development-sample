/**
 * グローバル型定義
 * @fileoverview プロジェクト全体で使用されるグローバルな型定義
 */

declare global {
  /**
   * 環境変数の型定義
   */
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string
      JWT_SECRET?: string
      NEXT_PUBLIC_APP_URL: string
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }

  /**
   * Windowオブジェクトの拡張
   */
  interface Window {
    __APP_BUILD_TIME__?: string
    __APP_VERSION__?: string
  }
}

/**
 * ユーティリティ型
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
export type Maybe<T> = null | T | undefined
/**
 * 共通の型定義
 */
export type Nullable<T> = null | T

export type Optional<T> = T | undefined

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Partial<Pick<T, Exclude<Keys, K>>> & Required<Pick<T, K>>
  }[Keys]

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Partial<Record<Exclude<Keys, K>, undefined>> &
      Required<Pick<T, K>>
  }[Keys]

export {}
