# API テストファイル

このディレクトリには、プロジェクトの全APIエンドポイントをテストするためのHTTPファイルが含まれています。

## 利用可能なAPIエンドポイント

### 認証 (auth.http)

- `GET /api/auth/providers` - 利用可能な認証プロバイダ一覧
- `GET /api/auth/session` - 現在のセッション情報
- `GET /api/auth/csrf` - CSRFトークン取得

### タスク管理 (todos.http)

- `GET /api/todos` - タスク一覧取得（フィルタリング、ページネーション対応）
- `POST /api/todos` - タスク作成
- `GET /api/todos/{id}` - タスク詳細取得
- `PUT /api/todos/{id}` - タスク更新
- `PATCH /api/todos/{id}/toggle` - タスク完了状態切り替え
- `DELETE /api/todos/{id}` - タスク削除
- `PATCH /api/todos/{id}/move-to-column` - タスクをKanbanカラムに移動

### サブタスク管理 (subtasks.http)

- `GET /api/todos/{id}/subtasks` - サブタスク一覧取得
- `POST /api/todos/{id}/subtasks` - サブタスク作成
- `PUT /api/todos/{id}/subtasks/{subId}` - サブタスク更新
- `PATCH /api/todos/{id}/subtasks/{subId}` - サブタスク完了状態切り替え
- `DELETE /api/todos/{id}/subtasks/{subId}` - サブタスク削除

### カテゴリ管理 (categories.http)

- `GET /api/categories` - カテゴリ一覧取得
- `POST /api/categories` - カテゴリ作成
- `PUT /api/categories/{id}` - カテゴリ更新
- `DELETE /api/categories/{id}` - カテゴリ削除

### APIキー管理 (api-keys.http)

- `GET /api/api-keys` - APIキー一覧取得
- `POST /api/api-keys` - APIキー作成
- `DELETE /api/api-keys/{id}` - APIキー削除

### Kanbanボード管理 (kanban-columns.http)

- `GET /api/kanban-columns` - Kanbanカラム一覧取得
- `POST /api/kanban-columns` - Kanbanカラム作成
- `GET /api/kanban-columns/{id}` - Kanbanカラム詳細取得
- `PUT /api/kanban-columns/{id}` - Kanbanカラム更新
- `DELETE /api/kanban-columns/{id}` - Kanbanカラム削除
- `PATCH /api/kanban-columns/reorder` - Kanbanカラム並び替え
- `POST /api/kanban-columns/seed` - Kanbanカラム初期データ作成

### 統計情報 (stats.http)

- `GET /api/stats/todos` - TODO統計情報取得

### MCP (mcp.http)

- `GET /api/mcp` - MCP endpoint
- `POST /api/mcp` - MCP endpoint

## 使用方法

### 1. 認証トークンの設定

各HTTPファイルの先頭にある `@authToken` 変数に、有効な認証トークンを設定してください：

```http
@authToken = YOUR_ACTUAL_AUTH_TOKEN
```

### 2. 変数の設定

各HTTPファイルには、テストに必要な変数が定義されています。実際の値に置き換えてください：

```http
@todoId = REPLACE_WITH_ACTUAL_TODO_ID
@categoryId = REPLACE_WITH_ACTUAL_CATEGORY_ID
@subTaskId = REPLACE_WITH_ACTUAL_SUBTASK_ID
```

### 3. Visual Studio Code での使用

REST Client拡張機能をインストールして、HTTPファイルを直接実行できます：

1. REST Client拡張機能をインストール
2. `.http` ファイルを開く
3. リクエストの上にある「Send Request」をクリック

### 4. その他のHTTPクライアント

- **Postman**: HTTPファイルをインポートして使用
- **Insomnia**: HTTPファイルを参考にリクエストを作成
- **curl**: HTTPファイルの内容をcurlコマンドに変換

## 認証について

このAPIは Bearer Token による認証を使用しています。NextAuth.js による認証後に取得できるJWTトークンを使用してください。

### 認証フロー

1. ブラウザでアプリケーションにログイン
2. 開発者ツールでアクセストークンを取得
3. HTTPファイルの `@authToken` 変数に設定

## APIレスポンス形式

すべてのAPIは以下の統一されたレスポンス形式を使用しています：

### 成功レスポンス

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## エラーコード

| コード                | 説明                   |
| --------------------- | ---------------------- |
| VALIDATION_ERROR      | バリデーションエラー   |
| UNAUTHORIZED          | 認証エラー             |
| FORBIDDEN             | 権限エラー             |
| NOT_FOUND             | リソースが見つからない |
| INTERNAL_SERVER_ERROR | サーバー内部エラー     |

## 注意事項

- 本番環境では適切な認証トークンを使用してください
- レート制限があるため、過度なリクエストは避けてください
- APIキーの管理には十分注意してください
- テスト用のデータは定期的にクリーンアップしてください
