import { beforeEach, describe, expect, it } from 'vitest'

import { buildFilterConditions } from './todo-filters'

describe('buildFilterConditions', () => {
  let fixedDate: Date

  beforeEach(() => {
    // テスト用の固定日時を設定
    fixedDate = new Date('2024-01-15T10:30:00.000Z')
    vi.setSystemTime(fixedDate)
  })

  it('今日フィルタの条件を正しく構築する', () => {
    const result = buildFilterConditions('today')

    const today = new Date(
      fixedDate.getFullYear(),
      fixedDate.getMonth(),
      fixedDate.getDate()
    )
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    expect(result).toEqual({
      dueDate: {
        gte: today,
        lt: tomorrow,
      },
      isCompleted: false,
    })
  })

  it('重要フィルタの条件を正しく構築する', () => {
    const result = buildFilterConditions('important')

    expect(result).toEqual({
      isCompleted: false,
      isImportant: true,
    })
  })

  it('今後の予定フィルタの条件を正しく構築する', () => {
    const result = buildFilterConditions('upcoming')

    expect(result).toEqual({
      dueDate: {
        gte: fixedDate,
      },
      isCompleted: false,
    })
  })

  it('完了済みフィルタの条件を正しく構築する', () => {
    const result = buildFilterConditions('completed')

    expect(result).toEqual({
      isCompleted: true,
    })
  })

  it('自分に割り当てフィルタの条件を正しく構築する', () => {
    const result = buildFilterConditions('assigned')

    expect(result).toEqual({
      isCompleted: false,
    })
  })

  it('フラグを設定したメールフィルタの条件を正しく構築する', () => {
    const result = buildFilterConditions('flagged')

    expect(result).toEqual({
      // 将来の実装用：メール連携機能
      isCompleted: false,
    })
  })

  it('全タスクフィルタ（allまたはデフォルト）の条件を正しく構築する', () => {
    const resultAll = buildFilterConditions('all')
    const resultDefault = buildFilterConditions('unknown')

    expect(resultAll).toEqual({})
    expect(resultDefault).toEqual({})
  })

  it('不明なフィルタの場合は空のオブジェクトを返す', () => {
    const result = buildFilterConditions('unknown-filter')

    expect(result).toEqual({})
  })
})
