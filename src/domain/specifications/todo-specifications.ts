import type { TodoEntity } from '@/domain/entities/todo-entity'

/**
 * Specification パターンの基底インターフェース
 */
export interface Specification<T> {
  /**
   * AND 演算で他の仕様と組み合わせます
   *
   * @param other - 組み合わせる仕様
   * @returns 組み合わせた仕様
   */
  and(other: Specification<T>): Specification<T>

  /**
   * 仕様の説明を取得します
   */
  description: string

  /**
   * 仕様に一致するアイテムのみをフィルタします
   *
   * @param items - フィルタ対象のアイテム一覧
   * @returns フィルタされたアイテム一覧
   */
  filterTodos(items: T[]): T[]

  /**
   * 仕様を満たすかを判定します
   *
   * @param candidate - 判定対象
   * @returns 仕様を満たす場合true
   */
  isSatisfiedBy(candidate: T): boolean

  /**
   * NOT 演算で仕様を反転します
   *
   * @returns 反転した仕様
   */
  not(): Specification<T>

  /**
   * OR 演算で他の仕様と組み合わせます
   *
   * @param other - 組み合わせる仕様
   * @returns 組み合わせた仕様
   */
  or(other: Specification<T>): Specification<T>
}

/**
 * Specification パターンの基底クラス
 */
abstract class BaseSpecification<T> implements Specification<T> {
  /**
   * 仕様の説明を取得します（サブクラスで実装）
   */
  abstract description: string

  /**
   * AND 演算で他の仕様と組み合わせます
   */
  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other)
  }

  /**
   * 仕様に一致するアイテムのみをフィルタします
   */
  filterTodos(items: T[]): T[] {
    return items.filter((item) => this.isSatisfiedBy(item))
  }

  /**
   * 仕様を満たすかを判定します（サブクラスで実装）
   */
  abstract isSatisfiedBy(candidate: T): boolean

  /**
   * NOT 演算で仕様を反転します
   */
  not(): Specification<T> {
    return new NotSpecification(this)
  }

  /**
   * OR 演算で他の仕様と組み合わせます
   */
  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other)
  }
}

/**
 * AND 演算を行う仕様
 */
class AndSpecification<T> extends BaseSpecification<T> {
  get description(): string {
    return `${this.left.description} かつ ${this.right.description}`
  }

  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate)
    )
  }
}

/**
 * NOT 演算を行う仕様
 */
class NotSpecification<T> extends BaseSpecification<T> {
  get description(): string {
    return `${this.spec.description} ではない`
  }

  constructor(private readonly spec: Specification<T>) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate)
  }
}

/**
 * OR 演算を行う仕様
 */
class OrSpecification<T> extends BaseSpecification<T> {
  get description(): string {
    return `${this.left.description} または ${this.right.description}`
  }

  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate)
    )
  }
}

/**
 * 完了済みTODOを識別する仕様
 */
export class CompletedTodoSpec extends BaseSpecification<TodoEntity> {
  readonly description = '完了済みのTODO'

  isSatisfiedBy(todo: TodoEntity): boolean {
    return todo.status.isCompleted()
  }
}

/**
 * 高優先度TODOを識別する仕様
 */
export class HighPriorityTodoSpec extends BaseSpecification<TodoEntity> {
  readonly description = '高優先度（HIGH以上）のTODO'

  isSatisfiedBy(todo: TodoEntity): boolean {
    return todo.priority.isHigh() || todo.priority.isUrgent()
  }
}

/**
 * 期限切れTODOを識別する仕様
 */
export class OverdueTodoSpec extends BaseSpecification<TodoEntity> {
  readonly description = '期限切れのTODO'

  isSatisfiedBy(todo: TodoEntity): boolean {
    // 完了済みは期限切れと見なさない
    if (todo.status.isCompleted()) {
      return false
    }

    return todo.isOverdue()
  }
}

/**
 * 未完了TODOを識別する仕様
 */
export class PendingTodoSpec extends BaseSpecification<TodoEntity> {
  readonly description = '未完了のTODO'

  isSatisfiedBy(todo: TodoEntity): boolean {
    return !todo.status.isCompleted()
  }
}

/**
 * 今日が期限のTODOを識別する仕様
 */
export class TodoDueTodaySpec extends BaseSpecification<TodoEntity> {
  readonly description = '今日が期限のTODO'

  isSatisfiedBy(todo: TodoEntity): boolean {
    return todo.isDueToday()
  }
}

/**
 * 指定日数以内に期限のTODOを識別する仕様
 */
export class TodoDueWithinDaysSpec extends BaseSpecification<TodoEntity> {
  get description(): string {
    return `${this.days}日以内に期限のTODO`
  }

  constructor(private readonly days: number) {
    super()
  }

  isSatisfiedBy(todo: TodoEntity): boolean {
    return todo.isDueWithinDays(this.days)
  }
}

/**
 * 特定ユーザーのTODOを識別する仕様
 */
export class UserTodoSpec extends BaseSpecification<TodoEntity> {
  get description(): string {
    return `ユーザーID: ${this.userId} のTODO`
  }

  constructor(private readonly userId: string) {
    super()
  }

  isSatisfiedBy(todo: TodoEntity): boolean {
    return todo.userId === this.userId
  }
}
