/**
 * MCP ツール用のロガーユーティリティ
 *
 * テスト環境では console.error を無効化し、
 * 本番環境では通常通りログを出力します。
 */

/**
 * エラーログを出力する
 *
 * @param message - ログメッセージ
 * @param error - エラーオブジェクト
 */
export function logError(message: string, error: unknown): void {
  // テスト環境では console.error を出力しない
  if (process.env.NODE_ENV === 'test') {
    return
  }

  console.error(message, error)
}
