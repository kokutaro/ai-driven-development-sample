/**
 * ユーティリティ関数
 * @fileoverview アプリケーション全体で使用される共通ユーティリティ関数
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 文字列の最初の文字を大文字に変換する
 * @param str - 変換する文字列
 * @returns 最初の文字が大文字になった文字列
 */
export function capitalize(str: string): string {
  if (!str) return ''

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * クラス名を結合してTailwind CSSのクラス名の重複を解決する
 * @param inputs - 結合するクラス名の配列
 * @returns 結合されたクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 日付を指定されたフォーマットで文字列に変換する
 * @param date - フォーマットする日付
 * @param locale - ロケール（デフォルト: ja-JP）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: Date, locale = 'ja-JP'): string {
  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * メールアドレスの形式が有効かどうかを検証する
 * @param email - 検証するメールアドレス
 * @returns 有効な場合はtrue、無効な場合はfalse
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
