import type { TodoEntity } from '@/domain/entities/todo-entity'
import type { Specification } from '@/domain/specifications/todo-specifications'
import type { TodoId } from '@/domain/value-objects/todo-id'

/**
 * 検索オプションのインターフェース
 */
export interface FindOptions {
  pagination?: Pagination
  sort?: Sort[]
  specification?: Specification<TodoEntity>
}

/**
 * ページング結果のインターフェース
 */
export interface PaginatedResult<T> {
  hasNext: boolean
  hasPrevious: boolean
  items: T[]
  limit: number
  page: number
  totalCount: number
  totalPages: number
}

/**
 * ページング情報のインターフェース
 */
export interface Pagination {
  limit: number
  offset: number
  page: number
}

/**
 * ソート情報のインターフェース
 */
export interface Sort {
  direction: 'asc' | 'desc'
  field: string
}

/**
 * TodoRepository - TODOエンティティのリポジトリインターフェース
 *
 * TODOエンティティの永続化に関する操作を定義します。
 * このインターフェースはドメイン層に属し、
 * インフラストラクチャ層で具体的な実装を提供します。
 */
export interface TodoRepository {
  /**
   * 仕様に一致するTODO数を取得します
   *
   * @param specification - 条件仕様
   * @returns TODO数
   */
  countBySpecification(
    specification: Specification<TodoEntity>
  ): Promise<number>

  /**
   * 指定したユーザーのTODO数を取得します
   *
   * @param userId - ユーザーID
   * @param specification - 条件仕様（任意）
   * @returns TODO数
   */
  countByUserId(
    userId: string,
    specification?: Specification<TodoEntity>
  ): Promise<number>

  /**
   * TODOを削除します
   *
   * @param id - 削除するTODO ID
   * @returns 削除成功時はtrue
   */
  delete(id: TodoId): Promise<boolean>

  /**
   * ユーザーのすべてのTODOを削除します
   *
   * @param userId - ユーザーID
   * @returns 削除されたTODOの数
   */
  deleteAllByUserId(userId: string): Promise<number>

  /**
   * 複数のTODOを削除します
   *
   * @param ids - 削除するTODO IDの配列
   * @returns 削除されたTODOの数
   */
  deleteMany(ids: TodoId[]): Promise<number>

  /**
   * TODOが存在するかを確認します
   *
   * @param id - TODO ID
   * @returns 存在する場合はtrue
   */
  exists(id: TodoId): Promise<boolean>

  /**
   * 指定したユーザーのすべてのTODOを取得します
   *
   * @param userId - ユーザーID
   * @returns TODOエンティティの配列
   */
  findAllByUserId(userId: string): Promise<TodoEntity[]>

  /**
   * IDによってTODOを検索します
   *
   * @param id - TODO ID
   * @returns TODOエンティティ（見つからない場合はnull）
   */
  findById(id: TodoId): Promise<null | TodoEntity>

  /**
   * 仕様に基づいてTODOを検索します
   *
   * @param specification - 検索条件の仕様
   * @param options - 検索オプション
   * @returns TODOエンティティの配列
   */
  findBySpecification(
    specification: Specification<TodoEntity>,
    options?: FindOptions
  ): Promise<TodoEntity[]>

  /**
   * ユーザーIDによってTODOを検索します
   *
   * @param userId - ユーザーID
   * @param options - 検索オプション
   * @returns TODOエンティティの配列
   */
  findByUserId(userId: string, options?: FindOptions): Promise<TodoEntity[]>

  /**
   * ページングを伴ってTODOを検索します
   *
   * @param options - 検索オプション
   * @returns ページング結果
   */
  findWithPagination(options: FindOptions): Promise<PaginatedResult<TodoEntity>>

  /**
   * TODOを保存します
   *
   * @param todo - 保存するTODOエンティティ
   * @returns 保存されたTODOエンティティ
   */
  save(todo: TodoEntity): Promise<TodoEntity>
}

/**
 * TodoRepositoryFactory - TodoRepositoryのファクトリインターフェース
 *
 * 異なる実装のTodoRepositoryを作成するためのファクトリです。
 */
export interface TodoRepositoryFactory {
  /**
   * TodoRepositoryのインスタンスを作成します
   *
   * @returns TodoRepositoryインスタンス
   */
  create(): TodoRepository

  /**
   * 読み取り専用のTodoRepositoryインスタンスを作成します
   *
   * @returns 読み取り専用TodoRepositoryインスタンス
   */
  createReadOnly(): TodoRepository
}
