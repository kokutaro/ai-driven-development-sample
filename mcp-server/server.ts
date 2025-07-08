import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { createTodoInputSchema, listTodosInputSchema } from './schemas/todo-mcp'
import { createTodo, listTodos } from './tools'

/**
 * TODO アプリケーション用 MCP サーバー
 *
 * LLMがTODOの作成・一覧取得を実行できるツールを提供します。
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
  }

  /**
   * サーバーを開始
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('TODO MCP Server started on stdio')
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
 */
if (typeof require !== 'undefined' && require.main === module) {
  const server = new TodoMcpServer()
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error)
    process.exit(1)
  })
}
