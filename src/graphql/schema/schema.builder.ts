/**
 * GraphQLスキーマビルダー
 *
 * TypeGraphQLを使用してGraphQLスキーマを構築します。
 * 全てのリゾルバーを統合し、統一されたスキーマを提供します。
 */
import 'reflect-metadata'
// TypeGraphQLモジュールの統一インポート（schema realm問題回避）
import * as TypeGraphQLModule from 'type-graphql'

// TypeGraphQL関数を統一モジュールから取得
const { buildSchema } = TypeGraphQLModule

import { CategoryResolver } from '../resolvers/category.resolver'
import { StatsResolver } from '../resolvers/stats.resolver'
import { TodoResolver } from '../resolvers/todo.resolver'

/**
 * GraphQLスキーマを構築します
 *
 * @returns GraphQLスキーマ
 */
export async function buildGraphQLSchema() {
  try {
    const schema = await buildSchema({
      emitSchemaFile: './schema.graphql', // スキーマファイルを出力
      resolvers: [TodoResolver, CategoryResolver, StatsResolver],
      validate: false, // バリデーションを無効化（必要に応じて有効化）
    })

    return schema
  } catch (error) {
    console.error('GraphQLスキーマの構築に失敗しました:', error)
    throw error
  }
}
