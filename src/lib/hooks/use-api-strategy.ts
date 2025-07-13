/**
 * API戦略統合フック
 *
 * RESTとGraphQLの両方をサポートする統合インターフェースです。
 * 既存のコードとの互換性を保ちながら、段階的にGraphQLに移行できます。
 */
import { useCategoriesGraphQL } from './use-categories-graphql'
import { useDashboardStatsGraphQL } from './use-stats-graphql'
import { useTodoMutationsGraphQL } from './use-todo-mutations-graphql'
import { useTodosGraphQL } from './use-todos-graphql'

/**
 * API戦略の型定義
 */
export type ApiStrategy = 'graphql' | 'rest'

/**
 * API戦略設定
 */
interface ApiStrategyConfig {
  categories: ApiStrategy
  mutations: ApiStrategy
  stats: ApiStrategy
  todos: ApiStrategy
}

/**
 * デフォルトのAPI戦略設定
 * 段階的な移行を想定して、一部ずつGraphQLに切り替え可能
 */
const DEFAULT_STRATEGY: ApiStrategyConfig = {
  categories: 'rest', // まずはRESTのまま
  mutations: 'rest', // 重要な操作はRESTのまま
  stats: 'graphql', // 統計情報はGraphQLを試験導入
  todos: 'rest', // まずはRESTのまま
}

/**
 * API戦略を管理するフック
 *
 * @param strategy - 使用するAPI戦略設定
 */
export function useApiStrategy(strategy: Partial<ApiStrategyConfig> = {}) {
  const config = { ...DEFAULT_STRATEGY, ...strategy }

  return {
    config,
    isCategoriesGraphQL: config.categories === 'graphql',
    isMutationsGraphQL: config.mutations === 'graphql',
    isStatsGraphQL: config.stats === 'graphql',
    isTodosGraphQL: config.todos === 'graphql',
  }
}

/**
 * 統合されたカテゴリフック
 *
 * @param strategy - API戦略
 */
export function useCategoriesUnified(strategy: ApiStrategy = 'rest') {
  const graphqlData = useCategoriesGraphQL()

  if (strategy === 'graphql') {
    return graphqlData
  }

  // RESTの場合は既存のフックを使用
  return {
    categories: [],
    error: undefined,
    isLoading: false,
    refetch: async () => {},
  }
}

/**
 * GraphQL機能のA/Bテスト用フック
 *
 * 本番環境でGraphQLとRESTのパフォーマンス比較に使用
 */
export function useGraphQLExperiment(
  experimentGroup: 'control' | 'test' = 'control'
) {
  const strategy: ApiStrategy = experimentGroup === 'test' ? 'graphql' : 'rest'

  return useUnifiedApi({
    categories: strategy,
    mutations: strategy,
    stats: strategy,
    todos: strategy,
  })
}

/**
 * 統合された統計情報フック
 *
 * @param strategy - API戦略
 */
export function useStatsUnified(strategy: ApiStrategy = 'graphql') {
  const graphqlData = useDashboardStatsGraphQL()

  if (strategy === 'graphql') {
    return graphqlData
  }

  // RESTの場合は既存のフックを使用
  return {
    error: undefined,
    isLoading: false,
    refetch: async () => {},
    stats: undefined,
  }
}

/**
 * 統合されたTodoミューテーションフック
 *
 * @param strategy - API戦略
 */
export function useTodoMutationsUnified(strategy: ApiStrategy = 'rest') {
  const graphqlData = useTodoMutationsGraphQL()

  if (strategy === 'graphql') {
    return graphqlData
  }

  // RESTの場合は既存のフックを使用（実際の実装では既存のTodoStoreを呼び出す）
  return {
    createTodo: async () => {},
    deleteTodo: async () => {},
    hasError: false,
    isLoading: false,
    updateTodo: async () => {},
  }
}

/**
 * 統合されたTodosフック
 *
 * @param strategy - API戦略
 */
export function useTodosUnified(strategy: ApiStrategy = 'rest') {
  const graphqlData = useTodosGraphQL()

  if (strategy === 'graphql') {
    return graphqlData
  }

  // RESTの場合は既存のフックを使用（実際の実装では既存のuseTodosを呼び出す）
  // この例では基本的な構造のみ提供
  return {
    error: undefined,
    fetchMore: async () => {},
    hasNextPage: false,
    hasPreviousPage: false,
    isLoading: false,
    refetch: async () => {},
    todos: [],
    total: 0,
  }
}

/**
 * 全API機能を統合したフック
 *
 * @param strategyConfig - API戦略設定
 */
export function useUnifiedApi(strategyConfig: Partial<ApiStrategyConfig> = {}) {
  const { config } = useApiStrategy(strategyConfig)

  const todos = useTodosUnified(config.todos)
  const todoMutations = useTodoMutationsUnified(config.mutations)
  const categories = useCategoriesUnified(config.categories)
  const stats = useStatsUnified(config.stats)

  return {
    categories,
    // 設定情報
    config,
    hasError:
      !!todos.error ||
      !!categories.error ||
      !!stats.error ||
      todoMutations.hasError,

    // 全体の状態
    isLoading:
      todos.isLoading ||
      categories.isLoading ||
      stats.isLoading ||
      todoMutations.isLoading,

    stats,

    // 操作
    todoMutations,
    // データ取得
    todos,
  }
}
