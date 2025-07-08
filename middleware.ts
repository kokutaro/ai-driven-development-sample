import { auth } from '@/auth'

/**
 * NextAuth.js Middleware
 *
 * 認証が必要なページへのアクセス制御を行います。
 * - 未認証ユーザーはサインインページにリダイレクト
 * - 認証済みユーザーはメインアプリにアクセス可能
 * - 公開ページ（サインインページ等）は制限なし
 */
export default auth((request) => {
  const { pathname } = request.nextUrl
  const isAuthenticated = !!request.auth

  // 公開ページのパス
  const publicPaths = ['/auth/signin', '/api/auth']

  // 公開ページかどうかをチェック
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // 認証が必要なページで未認証の場合、サインインページにリダイレクト
  if (!isAuthenticated && !isPublicPath) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(signInUrl)
  }

  // 認証済みユーザーがサインインページにアクセスした場合、ホームページにリダイレクト
  if (isAuthenticated && pathname === '/auth/signin') {
    return Response.redirect(new URL('/', request.url))
  }

  return undefined
})

/**
 * ミドルウェアが実行されるパスを設定
 *
 * - API routesとstatic assetsを除く全てのページで実行
 * - Next.jsの内部ページ（_next等）は除外
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
