import { useEffect, useState } from 'react'

/**
 * クライアントサイドでのみ true を返すフック
 *
 * ハイドレーションエラーを防ぐために使用します。
 * サーバーサイドレンダリング時は false、
 * クライアントサイドマウント後は true を返します。
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
