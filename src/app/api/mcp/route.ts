import { createMcpHandler } from '@vercel/mcp-adapter'

import {
  completeTodo,
  createTodo,
  deleteTodo,
  listTodos,
} from '@/lib/mcp/tools'

/**
 * TODO アプリケーション用 MCP ハンドラー
 *
 * @vercel/mcp-adapterを使用してMCPサーバーを実装します。
 * LLMがTODOの作成・一覧取得・完了状態切り替え・削除を実行できるツールを提供します。
 */
const handler = createMcpHandler(
  (server) => {
    // TODO一覧取得ツール
    server.tool(
      'list-todos',
      'TODO一覧を取得します。フィルター、ページネーション、ソート機能をサポートしています。',
      {},
      async (params) => {
        return await listTodos(params)
      }
    )

    // TODO作成ツール
    server.tool(
      'create-todo',
      '新しいTODOを作成します。タイトルは必須、説明・期限日・重要度・カテゴリは任意です。',
      {},
      async (params) => {
        return await createTodo(params)
      }
    )

    // TODO完了切り替えツール
    server.tool(
      'complete-todo',
      'TODOの完了状態を切り替えます。未完了のTODOは完了に、完了済みのTODOは未完了に変更されます。',
      {},
      async (params) => {
        return await completeTodo(params)
      }
    )

    // TODO削除ツール
    server.tool(
      'delete-todo',
      'TODOを削除します。削除されたTODOは復元できません。関連するサブタスクやリマインダーも同時に削除されます。',
      {},
      async (params) => {
        return await deleteTodo(params)
      }
    )
  },
  {},
  { basePath: '/api' }
)

export { handler as GET, handler as POST }
