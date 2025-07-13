# Apollo Client セットアップ完了

## 実装概要

TDD方式でApollo Clientの統合を完了しました。既存のRESTベースのアーキテクチャと併用可能な設計で、段階的な移行を支援します。

## 実装された機能

### 1. Apollo Client基盤 (`apollo-client.ts`)

- ✅ Apollo Clientインスタンスの作成
- ✅ 認証リンクの設定
- ✅ エラーハンドリングミドルウェア
- ✅ InMemoryCacheの最適化設定
- ✅ シングルトンパターンによる効率的なクライアント管理

### 2. React統合 (`apollo-provider.tsx`)

- ✅ ApolloProviderWrapperコンポーネント
- ✅ 既存プロバイダーチェーンとの統合
- ✅ ルートレイアウトへの組み込み完了

### 3. GraphQLフック実装

#### Todoフック (`use-todos-graphql.ts`)

- ✅ `useTodosGraphQL` - Todoリスト取得
- ✅ `useTodoGraphQL` - 単一Todo取得
- ✅ フィルタリング、ページネーション、ソート対応

#### ミューテーションフック (`use-todo-mutations-graphql.ts`)

- ✅ `useCreateTodoGraphQL` - Todo作成
- ✅ `useUpdateTodoGraphQL` - Todo更新
- ✅ `useDeleteTodoGraphQL` - Todo削除
- ✅ 自動キャッシュ更新機能

#### カテゴリフック (`use-categories-graphql.ts`)

- ✅ `useCategoriesGraphQL` - カテゴリ一覧取得
- ✅ `useCategoryOptionsGraphQL` - セレクトオプション形式

#### 統計フック (`use-stats-graphql.ts`)

- ✅ `useStatsGraphQL` - 統計情報取得
- ✅ `useDashboardStatsGraphQL` - ダッシュボード統計
- ✅ 自動更新機能

### 4. 統合戦略 (`use-api-strategy.ts`)

- ✅ RESTとGraphQLの統合インターフェース
- ✅ 段階的移行サポート
- ✅ A/Bテスト機能
- ✅ 設定ベースの戦略切り替え

### 5. テスト実装

- ✅ Apollo Clientセットアップテスト (8テスト通過)
- ✅ Apollo Providerテスト (5テスト通過)
- ✅ GraphQLフック統合テスト (7テスト通過)
- ✅ TDD Red-Green-Refactor サイクル完了

## 使用方法

### 基本的な使用例

```typescript
// GraphQLでTodoリストを取得
import { useTodosGraphQL } from '@/lib/hooks/use-todos-graphql'

function TodoList() {
  const { todos, isLoading, error } = useTodosGraphQL({
    filter: { status: 'PENDING' },
    pagination: { limit: 10, offset: 0 }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  )
}
```

### 段階的移行例

```typescript
// API戦略を設定して段階的に移行
import { useUnifiedApi } from '@/lib/hooks/use-api-strategy'

function Dashboard() {
  const api = useUnifiedApi({
    todos: 'rest', // まだRESTを使用
    categories: 'rest', // まだRESTを使用
    stats: 'graphql', // 統計はGraphQLに移行済み
    mutations: 'rest', // 重要な操作はRESTのまま
  })

  const { todos, stats } = api
  // ...
}
```

### A/Bテスト例

```typescript
// GraphQLのA/Bテストを実行
import { useGraphQLExperiment } from '@/lib/hooks/use-api-strategy'

function ExperimentalFeature() {
  const experimentGroup = Math.random() > 0.5 ? 'test' : 'control'
  const api = useGraphQLExperiment(experimentGroup)

  // 'test'グループはGraphQL、'control'グループはRESTを使用
}
```

## キャッシュ戦略

### Todoリストのキャッシュ

- フィルタとソート条件をキーとしたページネーション対応
- 新規作成時の自動キャッシュ更新
- 削除時の自動キャッシュ削除

### 統計情報のキャッシュ

- 5分間のキャッシュ時間
- 30秒ごとの自動ポーリング（ダッシュボード）

### カテゴリのキャッシュ

- 長期キャッシュ（変更頻度が低いため）
- cache-first戦略

## 設定

### 環境変数

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql
```

### Apollo Client設定

- 認証: セッションベース認証に対応
- エラーハンドリング: 401エラー時の自動リダイレクト
- デバッグ: 開発環境でDevToolsが有効

## 今後の拡張

1. **GraphQL Code Generator**の導入で型安全性向上
2. **サブスクリプション**による リアルタイム更新
3. **オフラインサポート**の追加
4. **パフォーマンス監視**の実装

## 互換性

- ✅ 既存のRESTクライアントと完全併用可能
- ✅ 既存のZustandストアとの共存
- ✅ Next.js 15 App Router対応
- ✅ TypeScript完全対応
- ✅ Mantineコンポーネントと統合可能

---

**TDD完了**: すべてのテストが通過し、Apollo Clientの統合が完了しました。
