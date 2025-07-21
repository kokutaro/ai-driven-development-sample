/**
 * GraphQLスキーマの生成
 *
 * TypeGraphQLを使用してGraphQLスキーマを生成します。
 */
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'

import { CategoryResolver } from '../resolvers/category.resolver'
import { RBACResolver } from '../resolvers/rbac.resolver'
import { StatsResolver } from '../resolvers/stats.resolver'
import { TodoResolver } from '../resolvers/todo.resolver'

/**
 * GraphQLスキーマを生成します
 *
 * @returns GraphQLスキーマ
 */
export async function createGraphQLSchema() {
  return buildSchema({
    emitSchemaFile:
      process.env.NODE_ENV === 'development' ? 'schema.graphql' : false,
    resolvers: [TodoResolver, CategoryResolver, StatsResolver, RBACResolver],
    validate: false, // 型安全性はTypeScriptで保証
  })
}
