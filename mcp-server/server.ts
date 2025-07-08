import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { pathToFileURL } from 'node:url'

import { createTodoInputSchema, listTodosInputSchema, completeTodoInputSchema, deleteTodoInputSchema } from './schemas/todo-mcp'
import { createTodo, listTodos, completeTodo, deleteTodo } from './tools'
import { initializeDatabase, closeDatabase } from './lib/db'

/**
 * TODO アプリケーション用 MCP サーバー
 *
 * LLMがTODOの作成・一覧取得・完了状態切り替え・削除を実行できるツールを提供します。
 */
export class TodoMcpServer {
  private server: McpServer

  constructor() {
    this.server = new McpServer({
      name: 'todo-mcp-server',
      version: '1.0.0',
    })

    this.setupTools()
  }

  /**
   * MCPツールをセットアップ
   */
  private setupTools(): void {
    // TODO一覧取得ツール
    this.server.registerTool(
      'list-todos',
      {
        description:
          'TODO一覧を取得します。フィルター、ページネーション、ソート機能をサポートしています。',
        inputSchema: {
          categoryId: listTodosInputSchema.shape.categoryId,
          filter: listTodosInputSchema.shape.filter,
          limit: listTodosInputSchema.shape.limit,
          page: listTodosInputSchema.shape.page,
          sortBy: listTodosInputSchema.shape.sortBy,
          sortOrder: listTodosInputSchema.shape.sortOrder,
        },
        title: 'TODO一覧取得',
      },
      async (params) => {
        const validatedParams = listTodosInputSchema.parse(params)
        return await listTodos(validatedParams)
      }
    )

    // TODO作成ツール
    this.server.registerTool(
      'create-todo',
      {
        description:
          '新しいTODOを作成します。タイトルは必須、説明・期限日・重要度・カテゴリは任意です。',
        inputSchema: {
          categoryId: createTodoInputSchema.shape.categoryId,
          description: createTodoInputSchema.shape.description,
          dueDate: createTodoInputSchema.shape.dueDate,
          isImportant: createTodoInputSchema.shape.isImportant,
          title: createTodoInputSchema.shape.title,
        },
        title: 'TODO作成',
      },
      async (params) => {
        const validatedParams = createTodoInputSchema.parse(params)
        return await createTodo(validatedParams)
      }
    )

    // TODO完了切り替えツール
    this.server.registerTool(
      'complete-todo',
      {
        description:
          'TODOの完了状態を切り替えます。未完了のTODOは完了に、完了済みのTODOは未完了に変更されます。',
        inputSchema: {
          id: completeTodoInputSchema.shape.id,
        },
        title: 'TODO完了切り替え',
      },
      async (params) => {
        const validatedParams = completeTodoInputSchema.parse(params)
        return await completeTodo(validatedParams)
      }
    )

    // TODO削除ツール
    this.server.registerTool(
      'delete-todo',
      {
        description:
          'TODOを削除します。削除されたTODOは復元できません。関連するサブタスクやリマインダーも同時に削除されます。',
        inputSchema: {
          id: deleteTodoInputSchema.shape.id,
        },
        title: 'TODO削除',
      },
      async (params) => {
        const validatedParams = deleteTodoInputSchema.parse(params)
        return await deleteTodo(validatedParams)
      }
    )
  }

  /**
   * サーバーを開始
   */
  async start(): Promise<void> {
    try {
      // データベース接続の初期化
      await initializeDatabase()
      
      const transport = new StdioServerTransport()
      await this.server.connect(transport)
      console.error('TODO MCP Server started on stdio')

      // プロセス終了時のクリーンアップ設定
      process.on('SIGINT', this.gracefulShutdown.bind(this))
      process.on('SIGTERM', this.gracefulShutdown.bind(this))
    } catch (error) {
      console.error('Failed to start MCP server:', error)
      throw error
    }
  }

  /**
   * サーバーの優雅な終了
   */
  private async gracefulShutdown(): Promise<void> {
    console.error('Shutting down MCP server...')
    try {
      await closeDatabase()
      console.error('MCP server shutdown complete')
    } catch (error) {
      console.error('Error during shutdown:', error)
    }
    process.exit(0)
  }

  /**
   * サーバーインスタンスを取得
   */
  getServer(): McpServer {
    return this.server
  }
}

/**
 * サーバーをスタンドアロンで実行
 * NOTE: この部分はスタンドアロン実行時のみ評価される
 * ESモジュール環境では import.meta.url を使用して実行判定を行う
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = new TodoMcpServer()
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error)
    process.exit(1)
  })
}
