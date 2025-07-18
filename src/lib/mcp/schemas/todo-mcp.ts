import { z } from 'zod'

/**
 * MCP用のTODOスキーマ定義
 */

/**
 * TODO一覧取得ツールの入力スキーマ
 */
export const listTodosInputSchema = z.object({
  categoryId: z.string().optional().describe('特定のカテゴリでフィルタリング'),
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
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(20)
    .describe('1ページあたりの取得件数'),
  page: z.number().min(1).default(1).describe('ページ番号'),
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
  categoryId: z.string().optional().describe('カテゴリID'),
  description: z.string().max(1000).optional().describe('TODOの詳細説明'),
  dueDate: z.string().datetime().optional().describe('期限日（ISO8601形式）'),
  isImportant: z.boolean().default(false).describe('重要フラグ'),
  title: z.string().min(1).max(200).describe('TODOのタイトル（必須）'),
})

/**
 * TODO完了切り替えツールの入力スキーマ
 */
export const completeTodoInputSchema = z.object({
  id: z.string().min(1).describe('完了状態を切り替えるTODOのID（必須）'),
})

/**
 * TODO削除ツールの入力スキーマ
 */
export const deleteTodoInputSchema = z.object({
  id: z.string().min(1).describe('削除するTODOのID（必須）'),
})

export type CompleteTodoInput = z.infer<typeof completeTodoInputSchema>
export type CreateTodoInput = z.infer<typeof createTodoInputSchema>
export type DeleteTodoInput = z.infer<typeof deleteTodoInputSchema>
/**
 * 型エクスポート
 */
export type ListTodosInput = z.infer<typeof listTodosInputSchema>
