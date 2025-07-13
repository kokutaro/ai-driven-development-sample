/**
 * Apollo Client セットアップ
 *
 * GraphQL APIとの通信を管理するApollo Clientを設定します。
 * 既存のRESTクライアントと併用可能な構成です。
 */
import {
  ApolloClient,
  createHttpLink,
  from,
  InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

import type { NormalizedCacheObject } from '@apollo/client'

/**
 * GraphQLエンドポイントのURL
 */
const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '/api/graphql'

/**
 * Apollo Clientインスタンスを作成します
 *
 * @returns Apollo Clientインスタンス
 */
export function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  // HTTPリンクの作成
  const httpLink = createHttpLink({
    credentials: 'same-origin', // セッション情報を含める
    uri: GRAPHQL_ENDPOINT,
  })

  // 認証リンクの作成
  const authLink = setContext(async (_, { headers }) => {
    // NextAuthのセッション情報を取得
    // 必要に応じてトークンを設定
    return {
      headers: {
        ...headers,
        // authorization: token ? `Bearer ${token}` : '',
        'content-type': 'application/json',
      },
    }
  })

  // エラーハンドリングリンクの作成
  const errorLink = onError(
    ({ forward, graphQLErrors, networkError, operation }) => {
      if (graphQLErrors) {
        for (const { locations, message, path } of graphQLErrors) {
          console.error(
            `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        }
      }

      if (networkError) {
        console.error(`Network error: ${networkError}`)

        // 401エラーの場合は認証ページにリダイレクト
        if (
          'statusCode' in networkError &&
          networkError.statusCode === 401 && // 既存のauth.tsと同様の処理
          globalThis.window !== undefined
        ) {
          globalThis.location.href = '/auth/signin'
        }
      }
    }
  )

  // リンクチェーンの作成
  const link = from([errorLink, authLink, httpLink])

  // キャッシュの設定
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          todos: {
            // Todoリストのページネーション対応
            keyArgs: ['filter', 'sort'],
            merge(existing, incoming, { args }) {
              const offset = args?.pagination?.offset || 0
              const merged = existing ? [...existing.todos] : []

              if (incoming) {
                for (let i = 0; i < incoming.todos.length; i++) {
                  merged[offset + i] = incoming.todos[i]
                }
              }

              return {
                ...incoming,
                todos: merged,
              }
            },
          },
          todoStats: {
            // 統計情報のキャッシュ戦略
            keyArgs: ['filter'],
          },
        },
      },
      Todo: {
        fields: {
          subTasks: {
            // サブタスクの並び順を維持
            merge(existing, incoming) {
              return incoming
            },
          },
        },
      },
    },
  })

  // Apollo Clientインスタンスの作成
  const client = new ApolloClient({
    cache,
    // 開発環境でのデバッグ設定
    connectToDevTools: process.env.NODE_ENV === 'development',
    defaultOptions: {
      mutate: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
      watchQuery: {
        errorPolicy: 'all', // エラーとデータの両方を返す
      },
    },
    link,
  })

  return client
}

/**
 * グローバルなApollo Clientインスタンス
 */
let apolloClient: ApolloClient<NormalizedCacheObject> | null = null

/**
 * Apollo Clientのシングルトンインスタンスを取得します
 *
 * @returns Apollo Clientインスタンス
 */
export function getApolloClient(): ApolloClient<NormalizedCacheObject> {
  if (!apolloClient) {
    apolloClient = createApolloClient()
  }
  return apolloClient
}

/**
 * Apollo Clientインスタンスをリセットします（テスト用）
 */
export function resetApolloClient(): void {
  apolloClient = null
}
