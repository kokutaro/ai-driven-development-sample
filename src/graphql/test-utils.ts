/**
 * GraphQLテスト用ユーティリティ
 *
 * テスト環境での GraphQL スキーマとモックデータを提供します。
 */
import type { GraphQLSchema } from 'graphql'
import 'reflect-metadata'

/**
 * テスト用GraphQLスキーマを作成します
 *
 * @returns GraphQLスキーマ
 */
export async function createTestSchema(): Promise<GraphQLSchema> {
  // 実際の実装では createGraphQLSchema を使用
  const { createGraphQLSchema } = await import('./schema')
  return createGraphQLSchema()
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
