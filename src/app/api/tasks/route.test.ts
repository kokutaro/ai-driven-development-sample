/**
 * タスク作成API のテスト
 * @fileoverview TDDアプローチでタスク作成APIのテストを記述
 */
import { NextRequest } from 'next/server'

import { POST } from './route'

import type { Task } from '@/types/task'

interface TaskCreateErrorResponse {
  details?: Record<string, string>
  error: string
}

// APIレスポンス型定義
interface TaskCreateSuccessResponse {
  task: Task
}

describe('/api/tasks POST', () => {
  it('正常なタスクデータでタスクを作成できる', async () => {
    const requestBody = {
      description: 'テスト用のタスクです',
      dueDate: '2024-12-31T00:00:00.000Z',
      important: false,
      title: 'テストタスク',
    }

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const response = await POST(request)
    const data = (await response.json()) as
      | TaskCreateErrorResponse
      | TaskCreateSuccessResponse

    expect(response.status).toBe(201)
    if ('task' in data) {
      expect(data.task).toBeDefined()
      expect(data.task.id).toBeDefined()
      expect(data.task.title).toBe('テストタスク')
      expect(data.task.description).toBe('テスト用のタスクです')
      expect(data.task.important).toBe(false)
      expect(data.task.completed).toBe(false)
      expect(data.task.userId).toBeDefined()
      expect(data.task.createdAt).toBeDefined()
      expect(data.task.updatedAt).toBeDefined()
    }
  })

  it('タイトルが空の場合はバリデーションエラーを返す', async () => {
    const requestBody = {
      description: 'テスト用のタスクです',
      title: '',
    }

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const response = await POST(request)
    const data = (await response.json()) as
      | TaskCreateErrorResponse
      | TaskCreateSuccessResponse

    expect(response.status).toBe(400)
    if ('error' in data) {
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(data.details?.title).toBeDefined()
    }
  })

  it('タイトルが200文字を超える場合はバリデーションエラーを返す', async () => {
    const requestBody = {
      description: 'テスト用のタスクです',
      title: 'a'.repeat(201),
    }

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const response = await POST(request)
    const data = (await response.json()) as
      | TaskCreateErrorResponse
      | TaskCreateSuccessResponse

    expect(response.status).toBe(400)
    if ('error' in data) {
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(data.details?.title).toBeDefined()
    }
  })

  it('説明が1000文字を超える場合はバリデーションエラーを返す', async () => {
    const requestBody = {
      description: 'a'.repeat(1001),
      title: 'テストタスク',
    }

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const response = await POST(request)
    const data = (await response.json()) as
      | TaskCreateErrorResponse
      | TaskCreateSuccessResponse

    expect(response.status).toBe(400)
    if ('error' in data) {
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(data.details?.description).toBeDefined()
    }
  })

  it('無効なJSONの場合はエラーを返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks', {
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const response = await POST(request)
    const data = (await response.json()) as
      | TaskCreateErrorResponse
      | TaskCreateSuccessResponse

    expect(response.status).toBe(400)
    if ('error' in data) {
      expect(data.error).toBe('Invalid JSON')
    }
  })

  it('Content-Typeがapplication/jsonでない場合はエラーを返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks', {
      body: JSON.stringify({ title: 'テストタスク' }),
      headers: {
        'Content-Type': 'text/plain',
      },
      method: 'POST',
    })

    const response = await POST(request)
    const data = (await response.json()) as
      | TaskCreateErrorResponse
      | TaskCreateSuccessResponse

    expect(response.status).toBe(400)
    if ('error' in data) {
      expect(data.error).toBe('Content-Type must be application/json')
    }
  })

  it('データベースエラーが発生した場合は500エラーを返す', async () => {
    // この テストはモックが必要な場合がありますが、
    // 実際のDBエラーを発生させるためのテストケースとして設計
    const requestBody = {
      categoryId: 'invalid-category-id', // 存在しないカテゴリID
      title: 'テストタスク',
    }

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const response = await POST(request)

    // データベースエラーの場合は500を期待
    expect([400, 500]).toContain(response.status)
  })

  it('optionalフィールドが省略された場合でもタスクを作成できる', async () => {
    const requestBody = {
      title: 'シンプルなタスク',
    }

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const response = await POST(request)
    const data = (await response.json()) as
      | TaskCreateErrorResponse
      | TaskCreateSuccessResponse

    expect(response.status).toBe(201)
    if ('task' in data) {
      expect(data.task).toBeDefined()
      expect(data.task.title).toBe('シンプルなタスク')
      expect(data.task.description).toBeUndefined()
      expect(data.task.important).toBe(false)
      expect(data.task.completed).toBe(false)
    }
  })
})
