'use client'

import type { ReactNode } from 'react'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: ReactNode
}

/**
 * NextAuth.js SessionProvider
 *
 * NextAuth.jsのセッション情報をクライアントサイドで使用可能にします。
 * - useSessionフックの有効化
 * - セッション状態の管理
 * - 認証状態の自動更新
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
