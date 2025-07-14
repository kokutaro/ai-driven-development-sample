import type {
  TodoReadModel,
  TodoReadModelRepository,
  TodoStatsReadModel,
} from './todo-read-model.interface'
import type { TodoEntity } from '@/domain/entities/todo-entity'

import { TodoStatus } from '@/domain/value-objects/todo-status'

/**
 * TODO Read Model Service
 *
 * ドメインエンティティとRead Model間の変換・操作を管理します。
 * CQRSアーキテクチャにおけるRead側の中心的なサービスです。
 */
export class TodoReadModelService {
  constructor(private readonly readModelRepository: TodoReadModelRepository) {}

  /**
   * TodoEntityをTodoReadModelに変換します
   *
   * @param todoEntity - ドメインエンティティ
   * @returns Read Model
   */
  convertToReadModel(todoEntity: TodoEntity): TodoReadModel {
    // CategoryはTodoEntityには直接含まれていないため、undefinedに設定
    // 実際の実装では、別途categoryIdからCategoryを取得する必要がある
    return {
      category: undefined,
      completedSubTaskCount:
        todoEntity.subTasks?.filter((st) => st.isCompleted).length ?? 0,
      createdAt: todoEntity.createdAt,
      description: todoEntity.description,
      dueDate: todoEntity.dueDate?.value,
      id: todoEntity.id.value,
      isCompleted: todoEntity.status.equals(TodoStatus.COMPLETED()),
      isImportant: todoEntity.priority?.isHigh() ?? false,
      isOverdue:
        typeof todoEntity.isOverdue === 'function'
          ? todoEntity.isOverdue()
          : false,
      priority: this.getPriorityString(todoEntity.priority),
      status: todoEntity.status.value,
      subTaskCount: todoEntity.subTasks?.length ?? 0,
      title: todoEntity.title,
      updatedAt: todoEntity.updatedAt,
      userId: todoEntity.userId,
    }
  }

  /**
   * TODO Read Modelを削除します
   *
   * @param id - TODO ID
   */
  async deleteById(id: string): Promise<void> {
    await this.readModelRepository.delete(id)
  }

  /**
   * IDでTODO Read Modelを取得します
   *
   * @param id - TODO ID
   * @returns TODO Read Model
   */
  async findById(id: string): Promise<TodoReadModel | undefined> {
    return await this.readModelRepository.findById(id)
  }

  /**
   * ユーザーのTODO Read Model一覧を取得します
   *
   * @param userId - ユーザーID
   * @param options - クエリオプション
   * @returns TODO Read Model一覧
   */
  async findByUserId(
    userId: string,
    options?: Parameters<TodoReadModelRepository['findByUserId']>[1]
  ): Promise<TodoReadModel[]> {
    return await this.readModelRepository.findByUserId(userId, options)
  }

  /**
   * ユーザーのTODO統計を取得します
   *
   * @param userId - ユーザーID
   * @returns TODO統計
   */
  async getStats(userId: string): Promise<TodoStatsReadModel> {
    return await this.readModelRepository.getStats(userId)
  }

  /**
   * ユーザーの統計情報を再計算します
   *
   * @param userId - ユーザーID
   */
  async refreshUserStats(userId: string): Promise<void> {
    await this.readModelRepository.refreshStats(userId)
  }

  /**
   * ドメインエンティティからRead Modelを更新します
   *
   * @param todoEntity - ドメインエンティティ
   */
  async updateFromDomainEntity(todoEntity: TodoEntity): Promise<void> {
    const readModel = this.convertToReadModel(todoEntity)
    await this.readModelRepository.save(readModel)
  }

  /**
   * 優先度を文字列に変換します
   *
   * @param priority - 優先度Value Object
   * @returns 優先度文字列
   */
  private getPriorityString(
    priority: undefined | { isHigh(): boolean; isLow(): boolean }
  ): string {
    if (!priority) return 'NORMAL'

    if (priority.isHigh()) return 'HIGH'
    if (priority.isLow()) return 'LOW'
    return 'NORMAL'
  }
}
