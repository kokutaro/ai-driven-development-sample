import { z } from 'zod'

/**
 * MCP用のTODOスキーマ定義
 */

/**
 * TODO一覧取得ツールの入力スキーマ
 */
export const listTodosInputSchema = z.object({
  filter: z
    .enum([
      'all',
      'today',
      'important',
      'upcoming',
      'completed',
      'assigned',
      'flagged',
    ])
    .default('all')
    .describe('取得するTODOのフィルター'),
  categoryId: z.string().optional().describe('特定のカテゴリでフィルタリング'),
  page: z.number().min(1).default(1).describe('ページ番号'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(20)
    .describe('1ページあたりの取得件数'),
  sortBy: z
    .enum(['createdAt', 'dueDate', 'title', 'importance'])
    .default('createdAt')
    .describe('ソート項目'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('ソート順'),
})

/**
 * TODO作成ツールの入力スキーマ
 */
export const createTodoInputSchema = z.object({
  title: z.string().min(1).max(200).describe('TODOのタイトル（必須）'),
  description: z.string().max(1000).optional().describe('TODOの詳細説明'),
  dueDate: z.string().datetime().optional().describe('期限日（ISO8601形式）'),
  isImportant: z.boolean().default(false).describe('重要フラグ'),
  categoryId: z.string().optional().describe('カテゴリID'),
})

/**
 * 型エクスポート
 */
export type ListTodosInput = z.infer<typeof listTodosInputSchema>
export type CreateTodoInput = z.infer<typeof createTodoInputSchema>
