/**
 * Todo関連のGraphQL型定義
 *
 * TypeGraphQLを使用してTodoエンティティのGraphQL型を定義します。
 * 既存のドメインエンティティと整合性を保ちます。
 */
import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from 'type-graphql'

/**
 * Todo優先度の列挙型
 */
export enum TodoPriority {
  HIGH = 'HIGH',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  URGENT = 'URGENT',
}

/**
 * Todoステータスの列挙型
 */
export enum TodoStatus {
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
}

// GraphQLスキーマに列挙型を登録
registerEnumType(TodoPriority, {
  description: 'Todoの優先度',
  name: 'TodoPriority',
})

registerEnumType(TodoStatus, {
  description: 'Todoのステータス',
  name: 'TodoStatus',
})

/**
 * SubTaskのGraphQL型
 */
@ObjectType()
export class SubTask {
  @Field(() => Boolean)
  completed!: boolean

  @Field(() => Date)
  createdAt!: Date

  @Field(() => ID)
  id!: string

  @Field(() => Number)
  order!: number

  @Field(() => String)
  title!: string

  @Field(() => String)
  todoId!: string

  @Field(() => Date)
  updatedAt!: Date
}

/**
 * CategoryのGraphQL型
 */
@ObjectType()
export class Category {
  @Field(() => String)
  color!: string

  @Field(() => Date)
  createdAt!: Date

  @Field(() => ID)
  id!: string

  @Field(() => String)
  name!: string

  @Field(() => Date)
  updatedAt!: Date

  @Field(() => String)
  userId!: string
}

/**
 * TodoのGraphQL型
 */
@ObjectType()
export class Todo {
  @Field(() => Category, { nullable: true })
  category?: Category

  @Field(() => String, { nullable: true })
  categoryId?: string

  @Field(() => Date, { nullable: true })
  completedAt?: Date

  @Field(() => Number)
  completionRate!: number

  @Field(() => Date)
  createdAt!: Date

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => Date, { nullable: true })
  dueDate?: Date

  @Field(() => ID)
  id!: string

  // 互換性のためのフィールド
  @Field(() => Boolean)
  isCompleted!: boolean

  @Field(() => Boolean)
  isImportant!: boolean

  // 計算フィールド
  @Field(() => Boolean)
  isOverdue!: boolean

  @Field(() => Number)
  order!: number

  @Field(() => TodoPriority)
  priority!: TodoPriority

  @Field(() => TodoStatus)
  status!: TodoStatus

  @Field(() => [SubTask])
  subTasks!: SubTask[]

  @Field(() => String)
  title!: string

  @Field(() => Date)
  updatedAt!: Date

  @Field(() => String)
  userId!: string
}

/**
 * Todo作成用の入力型
 */
@InputType()
export class CreateTodoInput {
  @Field(() => String, { nullable: true })
  categoryId?: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => Date, { nullable: true })
  dueDate?: Date

  @Field(() => TodoPriority, { defaultValue: TodoPriority.MEDIUM })
  priority!: TodoPriority

  @Field(() => String)
  title!: string
}

/**
 * Todo更新用の入力型
 */
@InputType()
export class UpdateTodoInput {
  @Field(() => String, { nullable: true })
  categoryId?: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => Date, { nullable: true })
  dueDate?: Date

  @Field(() => TodoPriority, { nullable: true })
  priority?: TodoPriority

  @Field(() => TodoStatus, { nullable: true })
  status?: TodoStatus

  @Field(() => String, { nullable: true })
  title?: string
}

/**
 * Todoフィルター用の入力型
 */
@InputType()
export class TodoFilter {
  @Field(() => String, { nullable: true })
  categoryId?: string

  @Field(() => Date, { nullable: true })
  dueAfterDate?: Date

  @Field(() => Date, { nullable: true })
  dueBeforeDate?: Date

  @Field(() => Boolean, { nullable: true })
  isOverdue?: boolean

  @Field(() => TodoPriority, { nullable: true })
  priority?: TodoPriority

  @Field(() => String, { nullable: true })
  search?: string

  @Field(() => TodoStatus, { nullable: true })
  status?: TodoStatus
}

/**
 * ページネーション用の入力型
 */
@InputType()
export class PaginationInput {
  @Field(() => Number, { defaultValue: 50 })
  limit!: number

  @Field(() => Number, { defaultValue: 0 })
  offset!: number
}

/**
 * ソート用の入力型
 */
@InputType()
export class TodoSort {
  @Field(() => String, { defaultValue: 'DESC' })
  direction!: string

  @Field(() => String, { defaultValue: 'createdAt' })
  field!: string
}

/**
 * Todo操作の結果型
 */
@ObjectType()
export class TodoMutationResult {
  @Field(() => String, { nullable: true })
  message?: string

  @Field(() => Boolean)
  success!: boolean

  @Field(() => Todo, { nullable: true })
  todo?: Todo
}

/**
 * Todoリストの結果型（ページネーション対応）
 */
@ObjectType()
export class TodoConnection {
  @Field(() => Boolean)
  hasNextPage!: boolean

  @Field(() => Boolean)
  hasPreviousPage!: boolean

  @Field(() => [Todo])
  todos!: Todo[]

  @Field(() => Number)
  total!: number
}
