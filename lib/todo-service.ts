import { prisma } from './db'

import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'

/**
 * 新しいTODOを作成する
 * @param input - TODO作成のための入力データ
 * @returns 作成されたTODO
 * @throws タイトルが空の場合エラーをスロー
 */
export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  if (!input.title.trim()) {
    throw new Error('Todo title cannot be empty')
  }

  const todo = await prisma.todo.create({
    data: {
      description: input.description?.trim(),
      status: 'pending',
      title: input.title.trim(),
    },
  })

  return toAppTodo(todo)
}

/**
 * TODOを削除する
 * @param id - TODOのID
 * @throws TODOが見つからない場合エラーをスロー
 */
export async function deleteTodo(id: string) {
  try {
    await prisma.todo.delete({
      where: { id },
    })
  } catch {
    throw new Error('Todo not found')
  }
}

/**
 * すべてのTODOを取得する
 * @returns 最新順にソートされたTODOの配列
 */
export async function getTodos(): Promise<Todo[]> {
  const todos = await prisma.todo.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return todos.map((todo) => toAppTodo(todo))
}

/**
 * TODOの完了状態を切り替える
 * @param id - TODOのID
 * @returns 更新されたTODO
 * @throws TODOが見つからない場合エラーをスロー
 */
export async function toggleTodo(id: string): Promise<Todo> {
  try {
    const todo = await prisma.todo.findUnique({
      where: { id },
    })

    if (!todo) {
      throw new Error('Todo not found')
    }

    const updatedTodo = await prisma.todo.update({
      data: { status: todo.status === 'completed' ? 'pending' : 'completed' },
      where: { id },
    })

    return toAppTodo(updatedTodo)
  } catch {
    throw new Error('Todo not found')
  }
}

/**
 * TODOを更新する
 * @param id - TODOのID
 * @param input - 更新データ
 * @returns 更新されたTODO
 * @throws TODOが見つからない場合エラーをスロー
 */
export async function updateTodo(
  id: string,
  input: UpdateTodoInput
): Promise<Todo> {
  try {
    const updateData: {
      description?: string
      status?: string
      title?: string
    } = {}
    if (input.title !== undefined) updateData.title = input.title.trim()
    if (input.description !== undefined)
      updateData.description = input.description.trim()
    if (input.status !== undefined) updateData.status = input.status

    const todo = await prisma.todo.update({
      data: updateData,
      where: { id },
    })

    return toAppTodo(todo)
  } catch {
    throw new Error('Todo not found')
  }
}

/**
 * PrismaのTodoをアプリケーションのTodo型に変換
 */
function toAppTodo(prismaTodo: {
  createdAt: Date
  description: null | string
  id: string
  status: string
  title: string
  updatedAt: Date
}): Todo {
  return {
    createdAt: prismaTodo.createdAt,
    description: prismaTodo.description ?? undefined,
    id: prismaTodo.id,
    status: prismaTodo.status as 'completed' | 'pending',
    title: prismaTodo.title,
    updatedAt: prismaTodo.updatedAt,
  }
}
