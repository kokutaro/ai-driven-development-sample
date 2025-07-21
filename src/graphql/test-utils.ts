/**
 * GraphQLテスト用ユーティリティ
 *
 * テスト環境での GraphQL スキーマとモックデータを提供します。
 * schema realmの問題を回避し、一貫性のあるテスト環境を提供します。
 */
// GraphQLモジュールの統一インポート（schema realm問題回避）
import * as GraphQLModule from 'graphql'
import 'reflect-metadata'

import { createGraphQLSchema } from './schema'

import type { DocumentNode, ExecutionResult, GraphQLSchema } from 'graphql'

// GraphQL関数を統一モジュールから取得
const { execute, parse } = GraphQLModule

/**
 * テスト用GraphQLスキーマのシングルトンインスタンス
 */
let testSchema: GraphQLSchema | undefined = undefined

/**
 * テスト用スキーマキャッシュをクリアします
 * テスト間でスキーマの状態をリセットする必要がある場合に使用します
 */
export function clearTestSchemaCache(): void {
  testSchema = undefined
}

/**
 * テスト用GraphQLスキーマを作成します
 * レガシー関数 - getTestGraphQLSchemaを使用してください
 *
 * @returns GraphQLスキーマ
 */
export async function createTestSchema(): Promise<GraphQLSchema> {
  return getTestGraphQLSchema()
}

/**
 * GraphQLクエリを実行します
 * スキーマの一貫性を保証するため、統一されたexecute関数を使用します
 */
export async function executeGraphQLQuery(
  query: string,
  contextValue?: unknown,
  variableValues?: Record<string, unknown>
): Promise<ExecutionResult> {
  const schema = await getTestGraphQLSchema()
  const document = parse(query)

  return execute({
    contextValue,
    document,
    schema,
    variableValues,
  })
}

/**
 * テスト用GraphQLスキーマを取得します
 * 初回呼び出し時にスキーマを構築し、以降はキャッシュされたインスタンスを返します
 *
 * @returns GraphQLスキーマ
 */
export async function getTestGraphQLSchema(): Promise<GraphQLSchema> {
  testSchema ??= await createGraphQLSchema()
  return testSchema
}

/**
 * GraphQLクエリをパースします
 * 統一されたparse関数を使用します
 */
export function parseGraphQLQuery(query: string): DocumentNode {
  return parse(query)
}

/**
 * テスト用のモックTodoデータ
 */
export const mockTodos = [
  {
    createdAt: new Date('2024-01-01'),
    description: 'Test Description 1',
    dueDate: new Date('2024-12-31'),
    id: 'test-todo-1',
    priority: 'HIGH',
    status: 'PENDING',
    title: 'Test Todo 1',
    updatedAt: new Date('2024-01-01'),
    userId: 'test-user-1',
  },
  {
    createdAt: new Date('2024-01-02'),
    description: 'Test Description 2',
    dueDate: new Date('2024-11-30'),
    id: 'test-todo-2',
    priority: 'LOW',
    status: 'COMPLETED',
    title: 'Test Todo 2',
    updatedAt: new Date('2024-01-10'),
    userId: 'test-user-1',
  },
]

/**
 * テスト用のモックCategoryデータ
 */
export const mockCategories = [
  {
    color: '#FF6B6B',
    id: 'test-category-1',
    name: 'Work',
    userId: 'test-user-1',
  },
  {
    color: '#4ECDC4',
    id: 'test-category-2',
    name: 'Personal',
    userId: 'test-user-1',
  },
]

/**
 * テスト用のモック統計データ
 */
export const mockStats = {
  categories: [
    { count: 6, name: 'Work' },
    { count: 4, name: 'Personal' },
  ],
  completed: 7,
  completionRate: 0.7,
  pending: 3,
  total: 10,
}
