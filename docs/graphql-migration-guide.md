# REST API から GraphQL への移行ガイド

## 概要

Todo アプリケーションでは、REST API から GraphQL API への移行を推進しています。GraphQL は以下の利点を提供します：

- **型安全性**: TypeScript との完全な統合
- **効率的なデータ取得**: 必要なフィールドのみを取得
- **強力なクエリ機能**: 関連データを1回のリクエストで取得
- **リアルタイム機能**: サブスクリプション対応
- **RBAC統合**: ロールベースのアクセス制御

## GraphQL エンドポイント

```http
POST /api/graphql
```

## 認証

### セッション認証（推奨）

ブラウザでのCookie認証を使用

### APIキー認証

```http
Authorization: Bearer YOUR_API_KEY
```

## 主要な移行例

### 1. Todo 操作

#### Todo用REST API (非推奨)

```http
# タスク一覧取得
GET /api/todos?filter=today&limit=10

# タスク作成
POST /api/todos
{
  "title": "新しいタスク",
  "description": "タスクの説明",
  "isImportant": true
}

# タスク更新
PUT /api/todos/123
{
  "title": "更新されたタスク"
}

# タスク削除
DELETE /api/todos/123
```

#### Todo用GraphQL API (推奨)

```graphql
# タスク一覧取得
query GetTodos {
  todos {
    id
    title
    description
    isCompleted
    isImportant
    dueDate
    category {
      id
      name
      color
    }
    subTasks {
      id
      title
      completed
    }
  }
}

# タスク作成
mutation CreateTodo($title: String!) {
  createTodo(title: $title) {
    id
    title
    isCompleted
    createdAt
  }
}

# タスク更新
mutation UpdateTodo($id: String!, $title: String, $isCompleted: Boolean) {
  updateTodo(id: $id, title: $title, isCompleted: $isCompleted) {
    id
    title
    isCompleted
    updatedAt
  }
}

# タスク削除
mutation DeleteTodo($id: String!) {
  deleteTodo(id: $id)
}

# タスク完了切り替え
mutation ToggleTodo($id: String!) {
  toggleTodoCompletion(id: $id) {
    id
    isCompleted
    updatedAt
  }
}
```

### 2. カテゴリ操作

#### カテゴリ用REST API (非推奨)

```http
# カテゴリ一覧取得
GET /api/categories

# カテゴリ作成
POST /api/categories
{
  "name": "仕事",
  "color": "#FF6B6B"
}
```

#### カテゴリ用GraphQL API (推奨)

```graphql
# カテゴリ一覧取得
query GetCategories {
  categories {
    id
    name
    color
    userId
    createdAt
  }
}

# カテゴリ作成
mutation CreateCategory($input: Object!) {
  createCategory(input: $input) {
    id
    name
    color
    createdAt
  }
}

# カテゴリ更新
mutation UpdateCategory($id: String!, $input: Object!) {
  updateCategory(id: $id, input: $input) {
    id
    name
    color
    updatedAt
  }
}

# カテゴリ削除
mutation DeleteCategory($id: String!) {
  deleteCategory(id: $id)
}
```

### 3. 統計情報

#### 統計用REST API (非推奨)

```http
GET /api/stats/todos?period=month
```

#### 統計用GraphQL API (推奨)

```graphql
# ダッシュボード統計
query DashboardStats {
  dashboardStats {
    total
    completed
    pending
    overdue
    completionRate
    categories {
      id
      name
      color
      total
      completed
      completionRate
    }
    dailyStats {
      date
      completed
      created
      total
    }
  }
}

# 詳細統計
query TodoStats($filter: StatsFilter) {
  todoStats(filter: $filter) {
    period
    total
    completed
    pending
    overdue
    completionRate
    averageCompletionTime
    categories {
      id
      name
      color
      total
      completed
      pending
      completionRate
    }
    dailyStats {
      date
      completed
      created
      total
    }
    generatedAt
  }
}
```

## RBAC (Role-Based Access Control)

GraphQL API では強力なロールベースアクセス制御を提供しています。

### ロール管理 (管理者のみ)

```graphql
# 全ロール一覧
query GetRoles {
  roles {
    id
    name
    displayName
    description
    isSystem
    permissions {
      id
      name
      displayName
      resource
      action
    }
  }
}

# ロール作成
mutation CreateRole($input: CreateRoleInput!) {
  createRole(input: $input) {
    id
    name
    displayName
    description
  }
}

# ユーザーにロール割り当て
mutation AssignUserRole($input: AssignUserRoleInput!) {
  assignUserRole(input: $input)
}
```

### 権限チェック

```graphql
# ユーザーの権限情報取得
query UserPermissions($userId: String!) {
  userPermissions(userId: $userId) {
    user {
      id
      name
      email
    }
    roles {
      id
      name
      displayName
    }
    permissions {
      id
      name
      displayName
      resource
      action
    }
    roleNames
    permissionNames
  }
}

# 権限チェック
query CheckPermission($userId: String!, $permission: String!) {
  checkPermission(userId: $userId, permission: $permission) {
    hasPermission
    permission
    reason
  }
}

# ロールチェック
query CheckRole($userId: String!, $roleName: String!) {
  checkRole(userId: $userId, roleName: $roleName) {
    hasRole
    roleName
    reason
  }
}
```

## 移行戦略

### フェーズ 1: 並行運用

- REST API と GraphQL API を並行運用
- REST API に非推奨警告ヘッダーを追加
- 新機能は GraphQL のみで提供

### フェーズ 2: GraphQL優先

- クライアントアプリケーションを GraphQL に移行
- REST API の使用量を監視

### フェーズ 3: REST API 廃止

- REST API を完全に廃止
- GraphQL API のみで運用

## クライアント実装例

### JavaScript/TypeScript (Apollo Client)

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

const client = new ApolloClient({
  uri: '/api/graphql',
  cache: new InMemoryCache(),
  credentials: 'include', // セッション認証用
})

// タスク一覧取得
const GET_TODOS = gql`
  query GetTodos {
    todos {
      id
      title
      isCompleted
      category {
        name
        color
      }
    }
  }
`

const { data, loading, error } = useQuery(GET_TODOS)

// タスク作成
const CREATE_TODO = gql`
  mutation CreateTodo($title: String!) {
    createTodo(title: $title) {
      id
      title
      isCompleted
    }
  }
`

const [createTodo] = useMutation(CREATE_TODO)

await createTodo({
  variables: { title: '新しいタスク' },
  refetchQueries: [{ query: GET_TODOS }],
})
```

### React フック例

```typescript
// hooks/use-todos.ts
import { useQuery, useMutation } from '@apollo/client'

export function useTodos() {
  const { data, loading, error } = useQuery(GET_TODOS)
  const [createTodo] = useMutation(CREATE_TODO)
  const [updateTodo] = useMutation(UPDATE_TODO)
  const [deleteTodo] = useMutation(DELETE_TODO)

  return {
    todos: data?.todos ?? [],
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
  }
}
```

## パフォーマンス最適化

### DataLoader による N+1 問題解決

GraphQL API では DataLoader を使用して N+1 クエリ問題を自動的に解決します。

### フィールドレベルの最適化

必要なフィールドのみを取得することで、パフォーマンスを大幅に改善できます。

```graphql
# 最小限のフィールドのみ取得
query GetTodoTitles {
  todos {
    id
    title
  }
}

# 関連データも含めて取得
query GetTodosWithDetails {
  todos {
    id
    title
    description
    category {
      name
      color
    }
    subTasks {
      title
      completed
    }
  }
}
```

## エラーハンドリング

GraphQL API では構造化されたエラー情報を提供します：

```json
{
  "errors": [
    {
      "message": "必要な権限が不足しています: admin",
      "extensions": {
        "code": "FORBIDDEN",
        "field": "roles"
      }
    }
  ],
  "data": null
}
```

## まとめ

GraphQL API への移行により、以下の利点が得られます：

1. **型安全性の向上**: TypeScript との完全統合
2. **効率的なデータ取得**: 過不足ないデータ取得
3. **強力なセキュリティ**: RBAC による細かな権限制御
4. **優れた開発体験**: 強力な開発ツールとドキュメント
5. **将来の拡張性**: サブスクリプションやリアルタイム機能

REST API は段階的に非推奨となりますので、新しい開発では GraphQL API の使用を強く推奨します。
