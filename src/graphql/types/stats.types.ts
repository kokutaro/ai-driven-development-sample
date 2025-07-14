/**
 * 統計情報関連のGraphQL型定義
 *
 * Todo統計やダッシュボード用のメトリクスを定義します。
 */
import { Field, InputType, ObjectType, registerEnumType } from 'type-graphql'

/**
 * 統計期間の列挙型
 */
export enum StatsPeriod {
  ALL_TIME = 'ALL_TIME',
  MONTH = 'MONTH',
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  YEAR = 'YEAR',
}

registerEnumType(StatsPeriod, {
  description: '統計期間の指定',
  name: 'StatsPeriod',
})

/**
 * カテゴリ別統計
 */
@ObjectType()
export class CategoryStats {
  @Field(() => String)
  color!: string

  @Field(() => Number)
  completed!: number

  @Field(() => Number)
  completionRate!: number

  @Field(() => String)
  id!: string

  @Field(() => String)
  name!: string

  @Field(() => Number)
  pending!: number

  @Field(() => Number)
  total!: number
}

/**
 * 日別統計
 */
@ObjectType()
export class DailyStats {
  @Field(() => Number)
  completed!: number

  @Field(() => Number)
  created!: number

  @Field(() => String)
  date!: string

  @Field(() => Number)
  total!: number
}

/**
 * Todo統計情報
 */
@ObjectType()
export class TodoStats {
  @Field(() => Number)
  averageCompletionTime!: number

  @Field(() => Number)
  cancelled!: number

  @Field(() => [CategoryStats])
  categories!: CategoryStats[]

  @Field(() => Number)
  completed!: number

  @Field(() => Number)
  completionRate!: number

  @Field(() => [DailyStats])
  dailyStats!: DailyStats[]

  @Field(() => Date)
  generatedAt!: Date

  @Field(() => Number)
  inProgress!: number

  @Field(() => Number)
  overdue!: number

  @Field(() => Number)
  pending!: number

  @Field(() => StatsPeriod)
  period!: StatsPeriod

  @Field(() => Number)
  total!: number
}

/**
 * 統計フィルター
 */
@InputType()
export class StatsFilter {
  @Field(() => String, { nullable: true })
  categoryId?: string

  @Field(() => Date, { nullable: true })
  endDate?: Date

  @Field(() => StatsPeriod, { defaultValue: StatsPeriod.MONTH })
  period!: StatsPeriod

  @Field(() => Date, { nullable: true })
  startDate?: Date
}
