/**
 * GraphQL版カテゴリフック
 *
 * Apollo Clientを使用してカテゴリを管理します。
 * 既存のRESTベースのuseCategoriesと同様のAPIを提供します。
 */
import { gql, useQuery } from '@apollo/client'

import type { Category } from '@/graphql/types/todo.types'

/**
 * カテゴリ一覧のGraphQLクエリ
 */
const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      color
      userId
      createdAt
      updatedAt
    }
  }
`

/**
 * GraphQLを使用してカテゴリ一覧を取得するフック
 *
 * @returns カテゴリリストと関連する状態
 */
export function useCategoriesGraphQL() {
  const { data, error, loading, refetch } = useQuery(GET_CATEGORIES, {
    errorPolicy: 'all',
    // カテゴリは変更頻度が低いため長めのキャッシュ
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  })

  return {
    categories: data?.categories ?? [],
    error: error?.message,
    isLoading: loading,
    refetch,
  }
}

/**
 * GraphQLとRESTの両方をサポートする統合カテゴリフック
 *
 * @param strategy - 使用する戦略（'graphql' | 'rest'）
 */
export function useCategoriesUnified(strategy: 'graphql' | 'rest' = 'rest') {
  // GraphQL戦略の場合
  if (strategy === 'graphql') {
    return useCategoriesGraphQL()
  }

  // REST戦略の場合（将来の統合用）
  // 既存のuseCategoriesフックにフォールバック
  throw new Error(
    'REST strategy not implemented in this hook. Use existing useCategories.'
  )
}

/**
 * カテゴリ選択用のオプション形式フック
 *
 * @returns セレクトボックス用のオプション配列
 */
export function useCategoryOptionsGraphQL() {
  const { categories, error, isLoading } = useCategoriesGraphQL()

  const options = categories.map((category: Category) => ({
    color: category.color,
    label: category.name,
    value: category.id,
  }))

  return {
    error,
    isLoading,
    options,
  }
}
