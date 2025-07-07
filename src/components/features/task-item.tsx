/**
 * タスクアイテムコンポーネント
 * @fileoverview 個別のタスクアイテムを表示するコンポーネント
 */
'use client'

import type { Task } from '@/types/task'

import { Button } from '@/components/ui/button'

/**
 * タスクアイテムコンポーネントのProps
 */
interface TaskItemProps {
  /**
   * 削除のコールバック
   * @param taskId タスクID
   */
  onDelete: (taskId: string) => void

  /**
   * 選択のコールバック
   * @param taskId タスクID
   */
  onSelect: (taskId: string) => void

  /**
   * 完了状態切り替えのコールバック
   * @param taskId タスクID
   */
  onToggleCompletion: (taskId: string) => void

  /**
   * 重要度切り替えのコールバック
   * @param taskId タスクID
   */
  onToggleImportance: (taskId: string) => void

  /**
   * 表示するタスク
   */
  task: Task
}

/**
 * タスクアイテムコンポーネント
 * @param props プロパティ
 * @returns タスクアイテム
 */
export function TaskItem({
  onDelete,
  onSelect,
  onToggleCompletion,
  onToggleImportance,
  task,
}: TaskItemProps) {
  /**
   * キーボードイベントを処理する
   * @param e キーボードイベント
   */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(task.id)
    }
  }

  return (
    <li
      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
      data-completed={task.completed}
      data-important={task.important}
      data-testid="task-item"
    >
      <div className="flex items-center justify-between">
        {/* タスク情報 */}
        <div
          aria-label={`${task.title}を選択`}
          className="flex-1 cursor-pointer"
          onClick={() => onSelect(task.id)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center space-x-3">
            {/* 完了チェックボックス */}
            <input
              aria-label={`${task.title}を完了`}
              checked={task.completed}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              onChange={() => onToggleCompletion(task.id)}
              type="checkbox"
            />

            {/* タスクタイトルと説明 */}
            <div
              className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}
            >
              <div className="font-medium">{task.title}</div>
              {task.description && (
                <div className="text-sm text-gray-600 mt-1">
                  {task.description}
                </div>
              )}
            </div>

            {/* 重要度インジケーター */}
            {task.important && (
              <div aria-label="重要なタスク" className="text-yellow-500">
                ⭐
              </div>
            )}
          </div>

          {/* 期限表示 */}
          {task.dueDate && (
            <div className="text-xs text-gray-500 mt-2">
              期限: {new Date(task.dueDate).toLocaleDateString('ja-JP')}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center space-x-2 ml-4">
          {/* 重要度切り替えボタン */}
          <Button
            aria-label={`${task.title}の重要度を切り替え`}
            className={task.important ? 'bg-yellow-50 border-yellow-300' : ''}
            onClick={() => onToggleImportance(task.id)}
            size="sm"
            variant="outline"
          >
            {task.important ? '⭐' : '☆'}
          </Button>

          {/* 削除ボタン */}
          <Button
            aria-label={`${task.title}を削除`}
            className="text-red-600 hover:bg-red-50 hover:border-red-300"
            onClick={() => onDelete(task.id)}
            size="sm"
            variant="outline"
          >
            削除
          </Button>
        </div>
      </div>
    </li>
  )
}
