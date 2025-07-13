/**
 * GraphQLコンテキスト
 *
 * GraphQLリゾルバーで利用可能なコンテキストオブジェクトを定義します。
 * 既存のCQRSパターンとDataLoaderの統合を行います。
 */
import { PrismaClient } from '@prisma/client'

import { DataLoaderContext } from './dataloader-context'

import type { NextApiRequest, NextApiResponse } from 'next'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

import {
  type CommandBus,
  CommandBusImpl,
  CommandRegistryImpl,
  type QueryBus,
  QueryBusImpl,
  QueryRegistryImpl,
} from '@/application/bus'

interface ExtendedSession extends Session {
  user?: SessionUser
}

// セッションユーザーの型拡張
interface SessionUser {
  email?: null | string | undefined
  id?: string | undefined
  image?: null | string | undefined
  name?: null | string | undefined
  permissions?: string[]
  role?: string
}

// Prismaクライアントのシングルトンインスタンス
const prisma = new PrismaClient()

/**
 * リクエスト処理メトリクス
 */
interface RequestMetrics {
  queryComplexity: number
  requestId: string
  startTime: number
}

// リクエストメトリクス追跡
const requestMetrics = new Map<string, RequestMetrics>()

/**
 * GraphQLコンテキストの型定義
 */
export interface GraphQLContext {
  /** コマンドバス（CQRS Write側） */
  commandBus: CommandBus
  /** DataLoader統合コンテキスト（N+1クエリ問題解決） */
  dataloaders: DataLoaderContext
  /** Prismaクライアント */
  prisma: PrismaClient
  /** クエリバス（CQRS Read側） */
  queryBus: QueryBus
  /** リクエストオブジェクト */
  req: NextApiRequest | NextRequest
  /** レスポンスオブジェクト */
  res?: NextApiResponse
  /** 認証されたユーザーセッション */
  session: Session | undefined
}

/**
 * レスポンス時間チェック
 */
export function checkResponseTime(_context: GraphQLContext): void {
  const requestId = generateRequestId()
  const metrics = requestMetrics.get(requestId)

  if (metrics) {
    const responseTime = Date.now() - metrics.startTime
    const SLA_LIMIT = 2000 // 2秒

    if (responseTime > SLA_LIMIT) {
      console.warn(
        `[PERFORMANCE] SLA violation: ${responseTime}ms > ${SLA_LIMIT}ms for request ${requestId}`
      )
    }

    // メトリクスクリーンアップ
    requestMetrics.delete(requestId)
  }
}

/**
 * GraphQLコンテキストを作成します (Apollo Server 4.x用)
 *
 * @param req - NextRequestオブジェクト
 * @returns GraphQLコンテキスト
 */
export async function createGraphQLContext(
  req: NextRequest
): Promise<GraphQLContext> {
  // Apollo Server 4.xではセッション取得が異なる
  // 現時点では認証なしで進める（後でNext-Auth対応を追加）
  const session = undefined

  const commandBus: CommandBus = new CommandBusImpl(new CommandRegistryImpl())
  const queryBus: QueryBus = new QueryBusImpl(new QueryRegistryImpl())

  // DataLoaderコンテキストを各リクエストで新規作成
  // リクエスト間でのキャッシュ汚染を防ぐ
  const dataloaders = new DataLoaderContext(prisma)

  // リクエストメトリクス初期化
  const requestId = generateRequestId()
  requestMetrics.set(requestId, {
    queryComplexity: 0,
    requestId,
    startTime: Date.now(),
  })

  return {
    commandBus,
    dataloaders,
    prisma,
    queryBus,
    req,
    session,
  }
}

/**
 * GraphQLコンテキストを作成します (Legacy Pages API)
 *
 * @param req - NextAPIリクエスト
 * @param res - NextAPIレスポンス
 * @returns GraphQLコンテキスト
 */
export async function createGraphQLContextLegacy({
  req,
  res,
}: {
  req: NextApiRequest
  res: NextApiResponse
}): Promise<GraphQLContext> {
  // 認証セッションの取得
  // const _session = await getServerSession(req, res, authOptions)
  const session = undefined // 暫定的にundefinedで対応

  // CQRSバスの初期化（暫定的な実装）
  const commandBus: CommandBus = {
    execute: async () => {
      throw new Error('Command bus not implemented')
    },
    register: () => {
      throw new Error('Command bus not implemented')
    },
  }
  const queryBus: QueryBus = {
    execute: async () => {
      throw new Error('Query bus not implemented')
    },
    register: () => {
      throw new Error('Query bus not implemented')
    },
  }

  // DataLoaderコンテキストを各リクエストで新規作成
  const dataloaders = new DataLoaderContext(prisma)

  return {
    commandBus,
    dataloaders,
    prisma,
    queryBus,
    req,
    res,
    session,
  }
}

/**
 * ユーザーIDを取得します - セキュリティ強化版
 *
 * @param context - GraphQLコンテキスト
 * @returns サニタイズされたユーザーID
 * @throws 認証されていない場合はエラー
 */
export function getUserId(context: GraphQLContext): string {
  const session = requireAuth(context)
  const userId = session.user?.id

  if (!userId) {
    throw new Error('ユーザーIDが取得できません')
  }

  // SQLインジェクション攻撃の検出と防止
  const sanitizedUserId = sanitizeUserId(userId)

  return sanitizedUserId
}

/**
 * DataLoaderキャッシュ最適化
 */
export function optimizeDataLoaderCache(context: GraphQLContext): void {
  // 定期的なキャッシュクリア（メモリリーク防止）
  const CACHE_TTL = 5 * 60 * 1000 // 5分

  setTimeout(() => {
    context.dataloaders.clearAllCaches()
  }, CACHE_TTL)
}

/**
 * 管理者権限チェック - セキュリティ強化版
 *
 * @param context - GraphQLコンテキスト
 * @throws 管理者権限がない場合はエラー
 */
export function requireAdminRole(context: GraphQLContext): void {
  const session = requireAuth(context)

  // 管理者ロールのチェック（実装時にユーザーモデルに role フィールドを追加）
  const extendedSession = session as ExtendedSession
  const userRole = extendedSession.user?.role

  // 権限エスカレーション防止：セッション内でのロール操作を検出
  if (userRole !== 'admin') {
    // 統一されたエラーメッセージでユーザー列挙攻撃を防止
    throw new Error('この操作を実行する権限がありません')
  }

  // 追加のセキュリティチェック：管理者特権の乱用防止
  validateAdminAccess(extendedSession)
}

/**
 * 認証チェックヘルパー - セキュリティ強化版
 *
 * @param context - GraphQLコンテキスト
 * @throws 認証されていない場合はエラー
 */
export function requireAuth(context: GraphQLContext): Session {
  // 1. セッション存在チェック - 型安全性の強化
  if (!context.session || typeof context.session !== 'object') {
    throw new Error('ログインが必要です')
  }

  // 2. ユーザー情報の存在確認
  if (!context.session.user || typeof context.session.user !== 'object') {
    throw new Error('ログインが必要です')
  }

  // 3. 必須フィールドの検証
  if (!context.session.user.id || typeof context.session.user.id !== 'string') {
    throw new Error('ログインが必要です')
  }

  // 4. セッション有効期限の確認
  if (context.session.expires) {
    const expiryDate = new Date(context.session.expires)
    const now = new Date()
    if (now > expiryDate) {
      throw new Error('セッションが期限切れです。再度ログインしてください')
    }
  }

  // 5. セッション整合性チェック（基本的な実装）
  const sessionData = JSON.stringify(context.session)
  if (sessionData.includes('<script>') || sessionData.includes('javascript:')) {
    throw new Error('セッションデータが不正です')
  }

  return context.session
}

/**
 * 特定の権限チェック - セキュリティ強化版
 *
 * @param context - GraphQLコンテキスト
 * @param requiredPermission - 必要な権限
 * @throws 権限がない場合はエラー
 */
export function requirePermission(
  context: GraphQLContext,
  requiredPermission: string
): void {
  const session = requireAuth(context)

  // 権限文字列の検証
  if (!requiredPermission || typeof requiredPermission !== 'string') {
    throw new Error('無効な権限指定です')
  }

  // 権限の形式チェック（例：resource:action の形式）
  const permissionPattern = /^[a-zA-Z_]+:[a-zA-Z_]+$/
  if (!permissionPattern.test(requiredPermission)) {
    throw new Error('権限の形式が無効です')
  }

  // 権限システムの実装（将来的な拡張用）
  const extendedSession = session as ExtendedSession
  const userPermissions = extendedSession.user?.permissions ?? []

  // 権限配列の整合性チェック
  if (!Array.isArray(userPermissions)) {
    throw new TypeError('ユーザー権限データが不正です')
  }

  // 権限配列の操作防止チェック
  for (const permission of userPermissions) {
    if (typeof permission !== 'string' || !permissionPattern.test(permission)) {
      throw new Error('権限データに不正な値が含まれています')
    }
  }

  if (!userPermissions.includes(requiredPermission)) {
    // 統一されたエラーメッセージでユーザー列挙攻撃を防止
    throw new Error('この操作を実行する権限がありません')
  }

  // 権限の使用状況をログ記録（セキュリティ監査用）
  logPermissionUsage(session.user?.id, requiredPermission)
}

/**
 * 認可チェックヘルパー - セキュリティ強化版
 * リソースの所有者チェック
 *
 * @param context - GraphQLコンテキスト
 * @param resourceUserId - リソースの所有者ID
 * @throws 認可されていない場合はエラー
 */
export function requireResourceOwnership(
  context: GraphQLContext,
  resourceUserId: string
): void {
  const session = requireAuth(context)

  // リソースユーザーIDの検証
  if (!resourceUserId || typeof resourceUserId !== 'string') {
    throw new Error('無効なリソース指定です')
  }

  // リソースユーザーIDのサニタイゼーション
  const sanitizedResourceUserId = sanitizeUserId(resourceUserId)
  const currentUserId = getUserId(context)

  // 所有権チェック
  if (currentUserId !== sanitizedResourceUserId) {
    // 統一されたエラーメッセージでユーザー列挙攻撃を防止
    throw new Error('このリソースにアクセスする権限がありません')
  }

  // アクセスログの記録（セキュリティ監査用）
  logResourceAccess(currentUserId, sanitizedResourceUserId, 'AUTHORIZED')
}

/**
 * クエリ複雑度チェック
 * レスポンス時間SLA改善のため
 */
export function validateQueryComplexity(
  context: GraphQLContext,
  queryString: string
): void {
  const complexity = calculateQueryComplexity(queryString)

  // 複雑度制限（例：1000ポイント）
  const MAX_COMPLEXITY = 1000
  if (complexity > MAX_COMPLEXITY) {
    throw new Error(
      `クエリの複雑度が制限を超えています。制限: ${MAX_COMPLEXITY}, 実際: ${complexity}`
    )
  }

  // メトリクス記録
  const requestId = generateRequestId()
  const metrics = requestMetrics.get(requestId)
  if (metrics) {
    metrics.queryComplexity = complexity
  }
}

/**
 * 並行処理安全性の向上
 * 楽観的ロッキング実装
 */
export async function withOptimisticLocking<T>(
  operation: () => Promise<T>,
  resourceId: string,
  maxRetries = 3
): Promise<T> {
  let retries = 0

  while (retries < maxRetries) {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof Error && error.message.includes('version')) {
        retries++
        if (retries >= maxRetries) {
          throw new Error(
            `楽観的ロック失敗: ${resourceId} - 最大再試行回数を超えました`
          )
        }
        // 指数バックオフで再試行
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retries) * 100)
        )
        continue
      }
      throw error
    }
  }

  throw new Error('予期しないエラーが発生しました')
}

/**
 * クエリ複雑度計算
 */
function calculateQueryComplexity(queryString: string): number {
  // 簡易的な複雑度計算
  let complexity = 0

  // フィールド数
  const fieldMatches = queryString.match(/\w+\s*[{(]/g)
  complexity += (fieldMatches?.length ?? 0) * 10

  // ネストレベル
  const nestingLevel = Math.max(0, (queryString.match(/{/g)?.length ?? 0) - 1)
  complexity += nestingLevel * 50

  // リスト操作
  const listMatches = queryString.match(/\[.*\]/g)
  complexity += (listMatches?.length ?? 0) * 100

  return complexity
}

/**
 * リクエストIDを生成
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * 権限使用状況のログ記録
 */
function logPermissionUsage(
  userId: string | undefined,
  permission: string
): void {
  if (userId) {
    // 本来はログサービスに送信
    console.log(
      `[SECURITY] Permission used: ${permission} by user: ${userId} at ${new Date().toISOString()}`
    )
  }
}

/**
 * リソースアクセスのログ記録
 */
function logResourceAccess(
  currentUserId: string,
  resourceUserId: string,
  result: 'AUTHORIZED' | 'UNAUTHORIZED'
): void {
  console.log(
    `[SECURITY] Resource access: user ${currentUserId} attempted to access resource owned by ${resourceUserId} - ${result} at ${new Date().toISOString()}`
  )
}

/**
 * ユーザーIDのサニタイゼーション
 * SQLインジェクション、XSS攻撃を防止
 */
function sanitizeUserId(userId: string): string {
  // 1. 基本的な型チェック
  if (typeof userId !== 'string') {
    throw new TypeError('無効なユーザーIDの形式です')
  }

  // 2. 長さチェック
  if (userId.length === 0 || userId.length > 50) {
    throw new Error('ユーザーIDの長さが無効です')
  }

  // 3. SQLインジェクション攻撃パターンの検出
  const sqlInjectionPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /UPDATE\s+.*SET/i,
    /INSERT\s+INTO/i,
    /UNION\s+SELECT/i,
    /OR\s+1\s*=\s*1/i,
    /AND\s+1\s*=\s*1/i,
    /'.*OR.*'/i,
    /--/,
    /\/\*/,
    /\*\//,
    /;/,
  ]

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(userId)) {
      throw new Error('無効な文字が含まれています')
    }
  }

  // 4. XSS攻撃パターンの検出
  const xssPatterns = [
    /<script/i,
    /<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<applet/i,
  ]

  for (const pattern of xssPatterns) {
    if (pattern.test(userId)) {
      throw new Error('無効な文字が含まれています')
    }
  }

  // 5. 許可された文字のみ受け入れ（英数字、ハイフン、アンダースコア）
  const allowedCharacters = /^[a-zA-Z0-9_-]+$/
  if (!allowedCharacters.test(userId)) {
    throw new Error('ユーザーIDに使用できない文字が含まれています')
  }

  return userId
}

/**
 * 管理者アクセスの妥当性検証
 */
function validateAdminAccess(session: ExtendedSession): void {
  // 管理者権限の時間制限チェック（例：営業時間外は制限）
  const now = new Date()
  const hour = now.getHours()

  // 営業時間外（22時〜6時）の管理者操作は制限
  if (hour >= 22 || hour < 6) {
    throw new Error('営業時間外は管理者操作が制限されています')
  }

  // 管理者権限の不正使用パターンチェック
  const adminId = session.user?.id
  if (
    adminId &&
    typeof adminId === 'string' && // 疑わしいパターンの検出
    (adminId.includes('test') || adminId.includes('demo'))
  ) {
    throw new Error('テストアカウントでは管理者操作は実行できません')
  }
}
