import { handlers } from '@/auth'

/**
 * NextAuth.js API Route Handler
 *
 * Next.js App Routerで認証リクエストを処理します。
 * - GET: 認証状態の取得、認証フローの開始
 * - POST: サインイン/サインアウト処理
 */
export const { GET, POST } = handlers
