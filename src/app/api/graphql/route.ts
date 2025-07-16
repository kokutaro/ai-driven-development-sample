/**
 * GraphQL API エンドポイント (Complete Implementation)
 *
 * 完全なGraphQLスキーマとリゾルバーの統合
 */
import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'

import type { NextRequest } from 'next/server'

import { createGraphQLContext } from '@/graphql/context/graphql-context'
import { createGraphQLSchema } from '@/graphql/schema'

let apolloServer: ApolloServer | undefined = undefined

/**
 * Apollo Server 4.xのインスタンスを取得または作成します
 */
async function getApolloServer() {
  if (apolloServer) {
    return apolloServer
  }

  try {
    // 完全なGraphQLスキーマを生成
    const schema = await createGraphQLSchema()

    apolloServer = new ApolloServer({
      // フォーマッターを追加してエラーを整形
      formatError: (formattedError) => {
        // 本番環境では内部エラーの詳細を隠す
        if (process.env.NODE_ENV === 'production') {
          delete formattedError.extensions?.exception
        }
        return formattedError
      },
      introspection: process.env.NODE_ENV === 'development',
      schema,
    })

    return apolloServer
  } catch (error) {
    console.error('GraphQL Server initialization failed:', error)

    // フォールバック用の簡易スキーマ
    const fallbackTypeDefs = `#graphql
      type Query {
        hello: String
      }
    `

    const fallbackResolvers = {
      Query: {
        hello: () => 'GraphQL API (Fallback Mode) - Schema loading failed',
      },
    }

    apolloServer = new ApolloServer({
      introspection: process.env.NODE_ENV === 'development',
      resolvers: fallbackResolvers,
      typeDefs: fallbackTypeDefs,
    })

    return apolloServer
  }
}

/**
 * GraphQL API ハンドラー
 */
const handler = async (request: NextRequest) => {
  try {
    const server = await getApolloServer()

    const graphqlHandler = startServerAndCreateNextHandler(server, {
      context: createGraphQLContext,
    })

    return graphqlHandler(request)
  } catch (error) {
    console.error('GraphQL request handling failed:', error)

    // エラーレスポンスを返す
    return new Response(
      JSON.stringify({
        errors: [
          {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
            },
            message: 'GraphQL server error',
          },
        ],
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    )
  }
}

export const GET = handler
export const POST = handler
