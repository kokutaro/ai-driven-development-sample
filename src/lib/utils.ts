import { type ClassValue, clsx } from 'clsx'

/**
 * 文字列の最初の文字を大文字にする関数
 *
 * @param str - 変換する文字列
 * @returns 最初の文字が大文字の文字列
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * CSS クラス名を結合するユーティリティ関数
 *
 * @param inputs - 結合するクラス値の配列
 * @returns 結合されたクラス名文字列
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * 日付を日本語形式でフォーマットする関数
 *
 * @param date - フォーマットする日付
 * @returns 日本語形式の日付文字列
 */
export function formatDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    // 不正な日付の場合は空文字列を返す
    return ''
  }
}

/**
 * メールアドレスの有効性を検証する関数
 *
 * @param email - 検証するメールアドレス
 * @returns 有効な場合はtrue、無効な場合はfalse
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
