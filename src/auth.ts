import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

import { prisma } from '@/lib/db'

/**
 * NextAuth.js v5設定
 *
 * OAuth認証を提供します：
 * - Google OAuth
 * - Microsoft OAuth
 * - GitHub OAuth
 *
 * 初回サインアップ時は、ユーザー名のみ追加入力が必要で、
 * 他の情報（メアド、アバター等）は各OAuthプロバイダーから取得します。
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async signIn({ account, profile, user }) {
      // 初回サインアップ時の処理
      if (
        account &&
        profile && // ユーザー名が設定されていない場合は、プロバイダーから取得
        !user.name
      ) {
        if (account.provider === 'google' && profile.name) {
          user.name = profile.name
        } else if (account.provider === 'github' && profile.login) {
          user.name = profile.login as string
        } else if (account.provider === 'microsoft-entra-id' && profile.name) {
          user.name = profile.name
        }
      }
      return true
    },
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: 'database',
  },
})
