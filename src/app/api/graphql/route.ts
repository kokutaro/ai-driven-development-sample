/**
 * GraphQL API エンドポイント (Apollo Server 4.x)
 *
 * Next.js App RouterでGraphQL APIを提供します。
 * Apollo Server 4.xの新しいAPIを使用しています。
 */
import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'

import type { NextRequest } from 'next/server'

import { createGraphQLContext } from '@/graphql/context/graphql-context'
import {
  createDevelopmentErrorFormatter,
  createProductionErrorFormatter,
} from '@/graphql/errors/error-formatter'
import { createGraphQLSchema } from '@/graphql/schema'
import 'reflect-metadata'

let apolloServer: ApolloServer | undefined = undefined

/**
 * Apollo Server 4.xのインスタンスを取得または作成します
 */
async function getApolloServer() {
  if (apolloServer) {
    return apolloServer
  }

  const schema = await createGraphQLSchema()

  const errorFormatter =
    process.env.NODE_ENV === 'production'
      ? createProductionErrorFormatter()
      : createDevelopmentErrorFormatter()

  apolloServer = new ApolloServer({
    formatError: (formattedError, error) =>
      errorFormatter.formatError(formattedError, error),
    introspection: process.env.NODE_ENV === 'development',
    schema,
  })

  return apolloServer
}

/**
 * ハンドラーをキャッシュするための変数
 */
let handler: ((request: NextRequest) => Promise<Response>) | undefined =
  undefined

/**
 * GraphQL GET リクエストハンドラー
 */
export async function GET(request: NextRequest) {
  const apolloHandler = await getHandler()
  if (!apolloHandler) {
    throw new Error('Failed to initialize GraphQL handler')
  }
  return apolloHandler(request)
}

/**
 * GraphQL POST リクエストハンドラー
 */
export async function POST(request: NextRequest) {
  const apolloHandler = await getHandler()
  if (!apolloHandler) {
    throw new Error('Failed to initialize GraphQL handler')
  }
  return apolloHandler(request)
}

/**
 * Apollo Server 4.x ハンドラーを取得または作成
 */
async function getHandler() {
  if (handler) {
    return handler
  }

  const server = await getApolloServer()

  handler = startServerAndCreateNextHandler(server, {
    context: async (req: NextRequest) => {
      return createGraphQLContext(req)
    },
  })

  return handler
}
