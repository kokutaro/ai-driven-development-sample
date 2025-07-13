/**
 * CategoryのGraphQLリゾルバー
 *
 * カテゴリ管理のGraphQL APIを提供します。
 */
import { Ctx, Query, Resolver } from 'type-graphql'

import { Category } from '../types/todo.types'

import type { GraphQLContext } from '../context/graphql-context'

@Resolver(() => Category)
export class CategoryResolver {
  /**
   * ユーザーのカテゴリ一覧を取得します
   *
   * @param context - GraphQLコンテキスト
   * @returns カテゴリリスト
   */
  @Query(() => [Category])
  async categories(@Ctx() context?: GraphQLContext): Promise<Category[]> {
    // 暫定的な実装 - 認証チェックを簡略化
    return [
      {
        color: '#FF6B6B',
        createdAt: new Date(),
        id: 'cat-1',
        name: 'Work',
        updatedAt: new Date(),
        userId: '1',
      },
      {
        color: '#4ECDC4',
        createdAt: new Date(),
        id: 'cat-2',
        name: 'Personal',
        updatedAt: new Date(),
        userId: '1',
      },
    ]
  }
}
