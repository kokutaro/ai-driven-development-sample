import crypto from 'node:crypto'

import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/db'

/**
 * APIキー管理ユーティリティ
 *
 * APIキーの生成、ハッシュ化、検証を行います。
 * セキュリティのため、APIキーはハッシュ化してデータベースに保存します。
 */

/**
 * APIキーを作成する
 *
 * @param userId - ユーザーID
 * @param name - APIキー名
 * @param expiresAt - 有効期限（オプション）
 * @returns 作成されたAPIキーとプレーンテキストキー
 */
export async function createApiKey(
  userId: string,
  name: string,
  expiresAt?: Date
): Promise<{ apiKey: any; plainKey: string }> {
  const plainKey = generateApiKey()
  const keyHash = await hashApiKey(plainKey)

  const apiKey = await prisma.apiKey.create({
    data: {
      expiresAt,
      keyHash,
      name,
      userId,
    },
    select: {
      createdAt: true,
      expiresAt: true,
      id: true,
      lastUsedAt: true,
      name: true,
      updatedAt: true,
    },
  })

  return { apiKey, plainKey }
}

/**
 * APIキーを削除する
 *
 * @param userId - ユーザーID
 * @param apiKeyId - APIキーID
 * @returns 削除されたAPIキー
 */
export async function deleteApiKey(userId: string, apiKeyId: string) {
  return prisma.apiKey.delete({
    where: {
      id: apiKeyId,
      userId, // ユーザーのキーのみ削除可能
    },
  })
}

/**
 * ランダムなAPIキーを生成する
 *
 * @returns 生成されたAPIキー（プレフィックス付き）
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32)
  const apiKey = randomBytes.toString('hex')
  return `todo_${apiKey}`
}

/**
 * ユーザーのAPIキー一覧を取得する
 *
 * @param userId - ユーザーID
 * @returns APIキー一覧（ハッシュは含まない）
 */
export async function getUserApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      expiresAt: true,
      id: true,
      lastUsedAt: true,
      name: true,
      updatedAt: true,
    },
    where: { userId },
  })
}

/**
 * APIキーからユーザーIDを取得する
 *
 * @param apiKey - APIキー
 * @returns ユーザーID（見つからない場合はnull）
 */
export async function getUserIdFromApiKey(
  apiKey: string
): Promise<null | string> {
  if (!apiKey?.startsWith('todo_')) {
    return null
  }

  // すべてのAPIキーを取得してハッシュを比較
  const apiKeys = await prisma.apiKey.findMany({
    select: {
      expiresAt: true,
      id: true,
      keyHash: true,
      userId: true,
    },
  })

  for (const key of apiKeys) {
    if (await verifyApiKey(apiKey, key.keyHash)) {
      // 有効期限をチェック
      if (key.expiresAt && key.expiresAt < new Date()) {
        return null
      }

      // 最終使用日時を更新
      await prisma.apiKey.update({
        data: { lastUsedAt: new Date() },
        where: { id: key.id },
      })

      return key.userId
    }
  }

  return null
}

/**
 * APIキーをハッシュ化する
 *
 * @param apiKey - ハッシュ化するAPIキー
 * @returns ハッシュ化されたAPIキー
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(apiKey, saltRounds)
}

/**
 * APIキーの有効性をチェックする
 *
 * @param apiKey - チェックするAPIキー
 * @returns 有効かどうか
 */
export async function isValidApiKey(apiKey: string): Promise<boolean> {
  const userId = await getUserIdFromApiKey(apiKey)
  return userId !== null
}

/**
 * APIキーを検証する
 *
 * @param apiKey - 検証するAPIキー
 * @param hashedKey - データベースに保存されたハッシュ化キー
 * @returns 検証結果
 */
export async function verifyApiKey(
  apiKey: string,
  hashedKey: string
): Promise<boolean> {
  return bcrypt.compare(apiKey, hashedKey)
}
