/**
 * フィルタのラベル情報
 */
export interface FilterOption {
  /** アイコン（オプション） */
  icon?: string
  /** 表示用ラベル */
  label: string
  /** フィルタの値 */
  value: TodoFilter
}

/**
 * TODOフィルタリングの種類を表すタイプ
 */
export type TodoFilter =
  | 'all' // 全てのTODO
  | 'completed' // 完了済みTODO
  | 'thisMonth' // 今月作成されたTODO
  | 'thisWeek' // 今週作成されたTODO
  | 'today' // 今日作成されたTODO

/**
 * 利用可能なフィルタオプション
 */
export const FILTER_OPTIONS: FilterOption[] = [
  { label: '今日', value: 'today' },
  { label: '今週', value: 'thisWeek' },
  { label: '今月', value: 'thisMonth' },
  { label: '全て', value: 'all' },
  { label: '完了済み', value: 'completed' },
]
