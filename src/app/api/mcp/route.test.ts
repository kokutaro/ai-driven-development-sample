import { describe, expect, it, vi } from 'vitest'

const toolMock = vi.fn()

vi.mock('@vercel/mcp-adapter', () => ({
  createMcpHandler: vi.fn((setup: (srv: { tool: typeof toolMock }) => void) => {
    setup({ tool: toolMock })
    return 'handler'
  }),
}))

vi.mock('@/lib/mcp/tools', () => ({
  completeTodo: vi.fn(async (p) => `complete-${JSON.stringify(p)}`),
  createTodo: vi.fn(async (p) => `create-${JSON.stringify(p)}`),
  deleteTodo: vi.fn(async (p) => `delete-${JSON.stringify(p)}`),
  listTodos: vi.fn(async (p) => `list-${JSON.stringify(p)}`),
}))

const tools = await import('@/lib/mcp/tools')
const { GET, POST } = await import('./route')

const { completeTodo, createTodo, deleteTodo, listTodos } = tools

describe('mcp route', () => {
  it('createMcpHandlerが正しく呼び出される', async () => {
    expect(GET).toBe('handler')
    expect(POST).toBe('handler')

    expect(toolMock).toHaveBeenCalledTimes(4)
    expect(toolMock.mock.calls[0][0]).toBe('list-todos')
    expect(toolMock.mock.calls[1][0]).toBe('create-todo')
    expect(toolMock.mock.calls[2][0]).toBe('complete-todo')
    expect(toolMock.mock.calls[3][0]).toBe('delete-todo')
  })

  it('登録されたツールが各関数を呼び出す', async () => {
    const cbList = toolMock.mock.calls[0][3]
    const cbCreate = toolMock.mock.calls[1][3]
    const cbComplete = toolMock.mock.calls[2][3]
    const cbDelete = toolMock.mock.calls[3][3]

    await cbList({ a: 1 })
    await cbCreate({ b: 2 })
    await cbComplete({ c: 3 })
    await cbDelete({ d: 4 })

    expect(listTodos).toHaveBeenCalledWith({ a: 1 })
    expect(createTodo).toHaveBeenCalledWith({ b: 2 })
    expect(completeTodo).toHaveBeenCalledWith({ c: 3 })
    expect(deleteTodo).toHaveBeenCalledWith({ d: 4 })
  })
})
