'use client'

import type { ReactNode } from 'react'

import { SessionProvider } from 'next-auth/react'

import type { Session } from 'next-auth'

interface AuthProviderProps {
  children: ReactNode
  session?: null | Session
}

/**
 * 認証プロバイダーコンポーネント
 *
 * NextAuth.jsのSessionProviderをラップして、
 * アプリケーション全体でセッション管理を提供します。
 *
 * クライアントサイドでの認証状態管理を担当し、
 * useSessionフックを通じてセッション情報にアクセスできるようにします。
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
