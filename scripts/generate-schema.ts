/**
 * GraphQLスキーマファイル生成スクリプト
 *
 * TypeGraphQLからschema.graphqlファイルを生成します。
 */
import 'reflect-metadata'
import { buildGraphQLSchema } from '../src/graphql/schema/schema.builder'

async function generateSchema() {
  try {
    console.log('🔄 GraphQLスキーマファイルを生成中...')

    const schema = await buildGraphQLSchema()

    console.log(
      '✅ GraphQLスキーマファイルの生成が完了しました: schema.graphql'
    )

    // スキーマの基本情報を表示
    const typeMap = schema.getTypeMap()
    const queryType = schema.getQueryType()
    const mutationType = schema.getMutationType()

    console.log(`📊 生成された型: ${Object.keys(typeMap).length}個`)
    console.log(`📝 クエリ: ${queryType ? queryType.name : 'なし'}`)
    console.log(
      `🔧 ミューテーション: ${mutationType ? mutationType.name : 'なし'}`
    )
  } catch (error) {
    console.error('❌ スキーマ生成エラー:', error)
    throw new Error('スキーマ生成に失敗しました')
  }
}

await generateSchema()
