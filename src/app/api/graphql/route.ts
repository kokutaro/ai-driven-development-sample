/**
 * GraphQL API エンドポイント (Simple Version)
 *
 * 循環依存を回避するための簡易版実装
 */
import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'

import type { NextRequest } from 'next/server'

import { createGraphQLContext } from '@/graphql/context/graphql-context'

let apolloServer: ApolloServer | undefined = undefined

/**
 * 簡易GraphQLスキーマ - Hello World のみ
 */
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`

const resolvers = {
  Query: {
    hello: () =>
      'Hello from GraphQL API! RBAC system is implemented and REST APIs are deprecated. Please check the migration guide in /docs/graphql-migration-guide.md',
  },
}

/**
 * Apollo Server 4.xのインスタンスを取得または作成します
 */
async function getApolloServer() {
  if (apolloServer) {
    return apolloServer
  }

  apolloServer = new ApolloServer({
    introspection: process.env.NODE_ENV === 'development',
    resolvers,
    typeDefs,
  })

  return apolloServer
}

/**
 * GraphQL API ハンドラー
 */
const handler = async (request: NextRequest) => {
  const server = await getApolloServer()

  const graphqlHandler = startServerAndCreateNextHandler(server, {
    context: createGraphQLContext,
  })

  return graphqlHandler(request)
}

export const GET = handler
export const POST = handler
