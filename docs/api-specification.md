# API 仕様書

## 概要

TODO システムの API 仕様書です。Next.js 15 の App Router を使用した RESTful API の設計を記載しています。

## 基本情報

### ベース URL

```text
http://localhost:3000/api
```

### 認証

```text
Authorization: Bearer <token>
```

### レスポンス形式

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### エラーレスポンス

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## エンドポイント一覧

### 1. ユーザー管理

#### 1.1 ユーザー情報取得

```http
GET /api/users/me
```

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "山田太郎",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 1.2 ユーザー情報更新

```http
PUT /api/users/me
```

- リクエストボディ

```json
{
  "name": "山田太郎",
  "email": "user@example.com"
}
```

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "山田太郎",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. TODO 管理

#### 2.1 TODO 一覧取得

```http
GET /api/todos
```

- クエリパラメータ

| パラメータ | 型     | 必須 | 説明                                                 |
| ---------- | ------ | ---- | ---------------------------------------------------- |
| filter     | string | No   | `today`, `important`, `upcoming`, `completed`, `all` |
| categoryId | string | No   | カテゴリでフィルタ                                   |
| page       | number | No   | ページ番号（デフォルト: 1）                          |
| limit      | number | No   | 1ページあたりの件数（デフォルト: 50）                |
| sortBy     | string | No   | ソートフィールド（`createdAt`, `dueDate`, `title`）  |
| sortOrder  | string | No   | ソート順（`asc`, `desc`）                            |

- レスポンス

```json
{
  "success": true,
  "data": {
    "todos": [
      {
        "id": "todo_123",
        "title": "プロジェクトの企画書作成",
        "description": "Q1のプロジェクト企画書を作成する",
        "dueDate": "2024-01-31T23:59:59.000Z",
        "isImportant": true,
        "isCompleted": false,
        "order": 0,
        "categoryId": "category_123",
        "category": {
          "id": "category_123",
          "name": "仕事",
          "color": "#FF6B6B"
        },
        "subTasks": [
          {
            "id": "subtask_123",
            "title": "マーケット調査",
            "isCompleted": false,
            "order": 1
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### 2.2 TODO 詳細取得

```http
GET /api/todos/{id}
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明    |
| ---------- | ------ | ---- | ------- |
| id         | string | Yes  | TODO ID |

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "todo_123",
    "title": "プロジェクトの企画書作成",
    "description": "Q1のプロジェクト企画書を作成する",
    "dueDate": "2024-01-31T23:59:59.000Z",
    "isImportant": true,
    "isCompleted": false,
    "order": 0,
    "categoryId": "category_123",
    "category": {
      "id": "category_123",
      "name": "仕事",
      "color": "#FF6B6B"
    },
    "subTasks": [
      {
        "id": "subtask_123",
        "title": "マーケット調査",
        "isCompleted": false,
        "order": 1
      }
    ],
    "reminders": [
      {
        "id": "reminder_123",
        "reminderAt": "2024-01-30T09:00:00.000Z",
        "isTriggered": false
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2.3 TODO 作成

```http
POST /api/todos
```

- リクエストボディ

```json
{
  "title": "新しいタスク",
  "description": "タスクの詳細説明",
  "dueDate": "2024-01-31T23:59:59.000Z",
  "isImportant": false,
  "categoryId": "category_123"
}
```

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "todo_456",
    "title": "新しいタスク",
    "description": "タスクの詳細説明",
    "dueDate": "2024-01-31T23:59:59.000Z",
    "isImportant": false,
    "isCompleted": false,
    "order": 0,
    "categoryId": "category_123",
    "userId": "user_123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2.4 TODO 更新

```http
PUT /api/todos/{id}
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明    |
| ---------- | ------ | ---- | ------- |
| id         | string | Yes  | TODO ID |

- リクエストボディ

```json
{
  "title": "更新されたタスク",
  "description": "更新された説明",
  "dueDate": "2024-02-01T23:59:59.000Z",
  "isImportant": true,
  "categoryId": "category_456"
}
```

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "todo_123",
    "title": "更新されたタスク",
    "description": "更新された説明",
    "dueDate": "2024-02-01T23:59:59.000Z",
    "isImportant": true,
    "isCompleted": false,
    "categoryId": "category_456",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2.5 TODO 完了切り替え

```http
PATCH /api/todos/{id}/toggle
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明    |
| ---------- | ------ | ---- | ------- |
| id         | string | Yes  | TODO ID |

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "todo_123",
    "isCompleted": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2.6 TODO 削除

```http
DELETE /api/todos/{id}
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明    |
| ---------- | ------ | ---- | ------- |
| id         | string | Yes  | TODO ID |

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "todo_123",
    "deleted": true
  }
}
```

#### 2.7 TODO 並び替え

```http
PATCH /api/todos/reorder
```

- リクエストボディ

```json
{
  "todoIds": ["todo_123", "todo_456", "todo_789"]
}
```

- レスポンス

```json
{
  "success": true,
  "data": {
    "updated": 3,
    "todos": [
      {
        "id": "todo_123",
        "order": 0
      },
      {
        "id": "todo_456",
        "order": 1
      },
      {
        "id": "todo_789",
        "order": 2
      }
    ]
  }
}
```

### 3. サブタスク管理

#### 3.1 サブタスク一覧取得

```http
GET /api/todos/{todoId}/subtasks
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明    |
| ---------- | ------ | ---- | ------- |
| todoId     | string | Yes  | TODO ID |

- レスポンス

```json
{
  "success": true,
  "data": [
    {
      "id": "subtask_123",
      "title": "マーケット調査",
      "isCompleted": false,
      "order": 1,
      "todoId": "todo_123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 3.2 サブタスク作成

```http
POST /api/todos/{todoId}/subtasks
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明    |
| ---------- | ------ | ---- | ------- |
| todoId     | string | Yes  | TODO ID |

- リクエストボディ

```json
{
  "title": "新しいサブタスク"
}
```

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "subtask_456",
    "title": "新しいサブタスク",
    "isCompleted": false,
    "order": 2,
    "todoId": "todo_123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 3.3 サブタスク更新

```http
PUT /api/todos/{todoId}/subtasks/{id}
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明          |
| ---------- | ------ | ---- | ------------- |
| todoId     | string | Yes  | TODO ID       |
| id         | string | Yes  | サブタスク ID |

- リクエストボディ

```json
{
  "title": "更新されたサブタスク",
  "isCompleted": true
}
```

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "subtask_123",
    "title": "更新されたサブタスク",
    "isCompleted": true,
    "order": 1,
    "todoId": "todo_123",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 3.4 サブタスク削除

```http
DELETE /api/todos/{todoId}/subtasks/{id}
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明          |
| ---------- | ------ | ---- | ------------- |
| todoId     | string | Yes  | TODO ID       |
| id         | string | Yes  | サブタスク ID |

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "subtask_123",
    "deleted": true
  }
}
```

### 4. カテゴリ管理

#### 4.1 カテゴリ一覧取得

```http
GET /api/categories
```

- レスポンス

```json
{
  "success": true,
  "data": [
    {
      "id": "category_123",
      "name": "仕事",
      "color": "#FF6B6B",
      "userId": "user_123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 4.2 カテゴリ作成

```http
POST /api/categories
```

- リクエストボディ

```json
{
  "name": "新しいカテゴリ",
  "color": "#4ECDC4"
}
```

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "category_456",
    "name": "新しいカテゴリ",
    "color": "#4ECDC4",
    "userId": "user_123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 4.3 カテゴリ更新

```http
PUT /api/categories/{id}
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明        |
| ---------- | ------ | ---- | ----------- |
| id         | string | Yes  | カテゴリ ID |

- リクエストボディ

```json
{
  "name": "更新されたカテゴリ",
  "color": "#45B7D1"
}
```

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "category_123",
    "name": "更新されたカテゴリ",
    "color": "#45B7D1",
    "userId": "user_123",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 4.4 カテゴリ削除

```http
DELETE /api/categories/{id}
```

- パスパラメータ

| パラメータ | 型     | 必須 | 説明        |
| ---------- | ------ | ---- | ----------- |
| id         | string | Yes  | カテゴリ ID |

- レスポンス

```json
{
  "success": true,
  "data": {
    "id": "category_123",
    "deleted": true
  }
}
```

### 5. 統計情報

#### 5.1 TODO 統計取得

```http
GET /api/stats/todos
```

- クエリパラメータ

| パラメータ | 型     | 必須 | 説明                                     |
| ---------- | ------ | ---- | ---------------------------------------- |
| period     | string | No   | 期間（`today`, `week`, `month`, `year`） |

- レスポンス

```json
{
  "success": true,
  "data": {
    "total": 100,
    "completed": 75,
    "pending": 25,
    "important": 10,
    "overdue": 5,
    "completionRate": 75.0,
    "categories": [
      {
        "id": "category_123",
        "name": "仕事",
        "color": "#FF6B6B",
        "total": 50,
        "completed": 40,
        "pending": 10
      }
    ],
    "dailyStats": [
      {
        "date": "2024-01-01",
        "completed": 5,
        "created": 3
      }
    ]
  }
}
```

## バリデーション

### 1. TODO 作成・更新

```typescript
import { z } from 'zod'

const todoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime().optional(),
  isImportant: z.boolean().default(false),
  categoryId: z.string().uuid().optional(),
})
```

### 2. カテゴリ作成・更新

```typescript
const categorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})
```

### 3. サブタスク作成・更新

```typescript
const subTaskSchema = z.object({
  title: z.string().min(1).max(200),
  isCompleted: z.boolean().default(false),
})
```

## エラーコード

| コード                | HTTP Status | 説明                   |
| --------------------- | ----------- | ---------------------- |
| VALIDATION_ERROR      | 400         | バリデーションエラー   |
| UNAUTHORIZED          | 401         | 認証エラー             |
| FORBIDDEN             | 403         | 権限エラー             |
| NOT_FOUND             | 404         | リソースが見つからない |
| CONFLICT              | 409         | リソースの競合         |
| RATE_LIMIT_EXCEEDED   | 429         | レート制限超過         |
| INTERNAL_SERVER_ERROR | 500         | サーバー内部エラー     |
| DATABASE_ERROR        | 500         | データベースエラー     |

## レート制限

```javascript
// 1分間に100リクエスト
const rateLimiter = {
  windowMs: 60 * 1000,
  maxRequests: 100,
}
```

## CORS設定

```javascript
const corsOptions = {
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  credentials: true,
}
```

## API実装例

### 1. TODO一覧取得 (app/api/todos/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const querySchema = z.object({
  filter: z
    .enum(['today', 'important', 'upcoming', 'completed', 'all'])
    .default('all'),
  categoryId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.enum(['createdAt', 'dueDate', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '認証が必要です' },
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const where = {
      userId: user.id,
      ...buildFilterConditions(query.filter),
      ...(query.categoryId && { categoryId: query.categoryId }),
    }

    const todos = await prisma.todo.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        subTasks: {
          select: {
            id: true,
            title: true,
            isCompleted: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })

    const total = await prisma.todo.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        todos,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
          hasNext: query.page * query.limit < total,
          hasPrev: query.page > 1,
        },
      },
    })
  } catch (error) {
    console.error('TODO取得エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    )
  }
}

function buildFilterConditions(filter: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  switch (filter) {
    case 'today':
      return {
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        isCompleted: false,
      }
    case 'important':
      return {
        isImportant: true,
        isCompleted: false,
      }
    case 'upcoming':
      return {
        dueDate: {
          gte: now,
        },
        isCompleted: false,
      }
    case 'completed':
      return {
        isCompleted: true,
      }
    default:
      return {}
  }
}
```

### 2. TODO作成 (app/api/todos/route.ts)

```typescript
const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime().optional(),
  isImportant: z.boolean().default(false),
  categoryId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '認証が必要です' },
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createTodoSchema.parse(body)

    const todo = await prisma.todo.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : undefined,
        userId: user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: todo,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バリデーションエラー',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    console.error('TODO作成エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    )
  }
}
```

## テスト

### 1. エンドポイントテスト例

```typescript
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/todos/route'

describe('/api/todos', () => {
  it('should return todos list', async () => {
    const request = new NextRequest('http://localhost:3000/api/todos')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('todos')
    expect(data.data).toHaveProperty('pagination')
  })

  it('should create a new todo', async () => {
    const request = new NextRequest('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: 'テストタスク',
        description: 'テスト用の説明',
        isImportant: false,
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.title).toBe('テストタスク')
  })
})
```

## 参考資料

- [Next.js App Router API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod バリデーション](https://zod.dev/)
- [Prisma Client](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [HTTP Status Codes](https://developer.mozilla.org/ja/docs/Web/HTTP/Status)
