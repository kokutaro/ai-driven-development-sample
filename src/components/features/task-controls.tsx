/**
 * タスクコントロールコンポーネント
 * @fileoverview タスクのフィルター・ソート制御コンポーネント
 */
'use client'

import { useState } from 'react'

import type { TaskFilter, TaskSortOrder } from '@/types/task'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTaskStore } from '@/stores'

/**
 * フィルターオプション
 */
const filterOptions: Array<{ label: string; value: TaskFilter }> = [
  { label: 'すべて', value: 'all' },
  { label: '重要', value: 'important' },
  { label: '今日', value: 'today' },
  { label: '予定済み', value: 'planned' },
  { label: '完了済み', value: 'completed' },
]

/**
 * ソートオプション
 */
const sortOptions: Array<{ label: string; value: TaskSortOrder }> = [
  { label: '作成日順', value: 'createdAt' },
  { label: '期限順', value: 'dueDate' },
  { label: '重要度順', value: 'importance' },
  { label: 'アルファベット順', value: 'alphabetical' },
]

/**
 * タスクコントロールコンポーネント
 * @returns タスクコントロール
 */
export function TaskControls() {
  const { filter, getFilteredTaskCount, setFilter, setSortOrder, sortOrder } =
    useTaskStore()

  const [searchQuery, setSearchQuery] = useState('')

  const taskCount = getFilteredTaskCount()

  /**
   * フィルター変更を処理
   * @param newFilter 新しいフィルター
   */
  function handleFilterChange(newFilter: TaskFilter) {
    setFilter(newFilter)
  }

  /**
   * ソート順変更を処理
   * @param newSortOrder 新しいソート順
   */
  function handleSortChange(newSortOrder: TaskSortOrder) {
    setSortOrder(newSortOrder)
  }

  /**
   * フィルタークリアを処理
   */
  function handleClearFilter() {
    setFilter('all')
    setSearchQuery('')
  }

  /**
   * クイックフィルターを処理
   * @param quickFilter クイックフィルター
   */
  function handleQuickFilter(quickFilter: TaskFilter) {
    setFilter(quickFilter)
  }

  return (
    <div
      className="space-y-4 p-4 border rounded-lg"
      data-testid="task-controls"
    >
      {/* タスク数と統計 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{taskCount}件のタスク</div>
        <div className="text-xs text-gray-500">
          現在のフィルター: {getFilterDisplayName(filter)} | ソート順:{' '}
          {getSortDisplayName(sortOrder)}
        </div>
      </div>

      {/* 検索 */}
      <div>
        <Input
          aria-label="タスクを検索"
          className="w-full"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="タスクを検索..."
          type="text"
          value={searchQuery}
        />
      </div>

      {/* クイックフィルターボタン */}
      <div className="flex flex-wrap gap-2">
        <Button
          className={filter === 'today' ? 'bg-blue-50 border-blue-300' : ''}
          onClick={() => handleQuickFilter('today')}
          size="sm"
          variant="outline"
        >
          今日のタスク
        </Button>
        <Button
          className={
            filter === 'important' ? 'bg-yellow-50 border-yellow-300' : ''
          }
          onClick={() => handleQuickFilter('important')}
          size="sm"
          variant="outline"
        >
          重要なタスク
        </Button>
        <Button
          className={filter === 'planned' ? 'bg-green-50 border-green-300' : ''}
          onClick={() => handleQuickFilter('planned')}
          size="sm"
          variant="outline"
        >
          期限切れ
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* フィルターセクション */}
        <fieldset>
          <legend className="text-sm font-medium mb-2">フィルター</legend>
          <div aria-label="フィルター" className="space-y-2" role="group">
            {filterOptions.map((option) => (
              <label className="flex items-center space-x-2" key={option.value}>
                <input
                  aria-label={option.label}
                  checked={filter === option.value}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  name="filter"
                  onChange={() => handleFilterChange(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* ソートセクション */}
        <fieldset>
          <legend className="text-sm font-medium mb-2">ソート順</legend>
          <div aria-label="ソート順" className="space-y-2" role="group">
            {sortOptions.map((option) => (
              <label className="flex items-center space-x-2" key={option.value}>
                <input
                  aria-label={option.label}
                  checked={sortOrder === option.value}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  name="sort"
                  onChange={() => handleSortChange(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end">
        <Button
          className="text-gray-600"
          onClick={handleClearFilter}
          size="sm"
          variant="outline"
        >
          クリア
        </Button>
      </div>
    </div>
  )
}

/**
 * フィルター名を日本語に変換
 * @param filter フィルター
 * @returns 日本語フィルター名
 */
function getFilterDisplayName(filter: TaskFilter): string {
  const option = filterOptions.find((opt) => opt.value === filter)
  return option?.label ?? 'すべて'
}

/**
 * ソート名を日本語に変換
 * @param sortOrder ソート順
 * @returns 日本語ソート名
 */
function getSortDisplayName(sortOrder: TaskSortOrder): string {
  const option = sortOptions.find((opt) => opt.value === sortOrder)
  return option?.label ?? '作成日順'
}
