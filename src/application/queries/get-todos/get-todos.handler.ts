import type { QueryHandler } from '../query.interface'
import type {
  GetTodosQuery,
  GetTodosQueryResult,
  TodoFilter,
} from './get-todos.query'
import type {
  Pagination,
  Sort,
  TodoRepository,
} from '@/domain/repositories/todo-repository'

/**
 * TODO一覧取得クエリハンドラー
 *
 * GetTodosQueryを処理してTODO一覧データを取得します。
 * フィルタリング、ページング、ソート機能を提供します。
 */
export class GetTodosQueryHandler
  implements QueryHandler<GetTodosQuery, GetTodosQueryResult>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * TODO一覧取得クエリを実行します
   *
   * @param query - TODO一覧取得クエリ
   * @returns 一覧取得結果
   */
  async handle(query: GetTodosQuery): Promise<GetTodosQueryResult> {
    try {
      // 入力値の基本検証
      if (!query.userId || query.userId.trim() === '') {
        return {
          error: 'ユーザーIDは必須です',
          success: false,
        }
      }

      // デフォルト値の設定
      const defaultLimit = 50
      const defaultPage = 1
      const limit = query.pagination?.limit ?? defaultLimit
      const page = query.pagination?.page ?? defaultPage

      const pagination: Pagination = {
        limit,
        offset: (page - 1) * limit,
        page,
      }

      const sort: Sort[] = [
        {
          direction: query.sort?.direction ?? 'desc',
          field: query.sort?.field ?? 'createdAt',
        },
      ]

      // Specification パターンでフィルター条件を構築
      const specification = this.buildSpecification(query.filter)

      // リポジトリクエリオプションを構築
      const queryOptions = {
        pagination,
        sort,
        specification: specification as unknown,
      }

      // TODO一覧とカウントを並行取得
      const [todos, totalCount] = await Promise.all([
        this.todoRepository.findByUserId(query.userId, queryOptions as never),
        this.todoRepository.countByUserId(query.userId, specification as never),
      ])

      // ページング情報を計算
      const totalPages = Math.ceil(totalCount / pagination.limit)
      const paginationResult = {
        hasNext: pagination.page < totalPages,
        hasPrevious: pagination.page > 1,
        limit: pagination.limit,
        page: pagination.page,
        total: totalCount,
        totalPages,
      }

      return {
        pagination: paginationResult,
        success: true,
        todos,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラー'

      return {
        error: `TODO一覧の取得に失敗しました: ${errorMessage}`,
        success: false,
      }
    }
  }

  /**
   * フィルター条件からSpecificationオブジェクトを構築します
   *
   * @param filter - フィルター条件
   * @returns Specificationオブジェクト
   */
  private buildSpecification(filter?: TodoFilter): Record<string, unknown> {
    const specification: Record<string, unknown> = {}

    if (!filter) {
      return specification
    }

    // 完了状態フィルター
    if (filter.isCompleted !== undefined) {
      specification.isCompleted = filter.isCompleted
    }

    // 重要フラグフィルター
    if (filter.isImportant !== undefined) {
      specification.isImportant = filter.isImportant
    }

    // 検索キーワードフィルター
    if (filter.searchTerm && filter.searchTerm.trim() !== '') {
      specification.searchTerm = filter.searchTerm.trim()
    }

    // カテゴリIDフィルター
    if (filter.categoryId && filter.categoryId.trim() !== '') {
      specification.categoryId = filter.categoryId.trim()
    }

    // 期限日範囲フィルター
    if (filter.dueDateRange) {
      specification.dueDateRange = filter.dueDateRange
    }

    return specification
  }
}
