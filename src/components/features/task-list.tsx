/**
 * タスクリストコンポーネント
 * @fileoverview タスク一覧を表示するコンポーネント
 */
'use client'

import { useState } from 'react'

import { v4 as uuidv4 } from 'uuid'

import { TaskCreateModal } from './task-create-modal'

import type { CreateTaskInput, Task } from '@/types/task'

import { Button } from '@/components/ui/button'
import { useTaskStore } from '@/stores'

/**
 * タスクリストコンポーネント
 * @returns タスクリスト
 */
export function TaskList() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const {
    addTask,
    error,
    filter,
    getFilteredTasks,
    isLoading,
    removeTask,
    setSelectedTaskId,
    toggleTaskCompletion,
    toggleTaskImportance,
  } = useTaskStore()

  const tasks = getFilteredTasks()

  /**
   * タスク作成処理
   * @param taskData 作成するタスクデータ
   */
  async function handleTaskCreate(taskData: CreateTaskInput) {
    try {
      // TODO: 実際のAPIコールに置き換える
      // 現在は仮実装としてローカル状態に追加
      const now = new Date()
      const newTask: Task = {
        categoryId: taskData.categoryId,
        completed: false,
        createdAt: now,
        description: taskData.description,
        dueDate: taskData.dueDate,
        id: uuidv4(),
        important: taskData.important ?? false,
        reminderDate: taskData.reminderDate,
        repeatPattern: taskData.repeatPattern,
        subtasks: [],
        title: taskData.title,
        updatedAt: now,
        userId: 'mock-user-id', // TODO: 実際のユーザーIDに置き換える
      }

      addTask(newTask)
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('タスク作成エラー:', error)
      // TODO: エラー通知をユーザーに表示
    }
  }

  // ローディング状態
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-600">タスクを読み込み中...</div>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div>
      {/* フィルター情報とタスク数 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {getFilterDisplayName(filter)}
        </h2>
        <div className="text-sm text-gray-600">{tasks.length}件のタスク</div>
      </div>

      {/* タスクの追加ボタン */}
      <div className="mb-4">
        <Button
          className="w-full"
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
        >
          ＋ タスクの追加
        </Button>
      </div>

      {/* 空の状態 */}
      {tasks.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-gray-600">
            <div className="text-lg font-medium mb-2">タスクがありません</div>
            <div className="text-sm">新しいタスクを作成してください</div>
          </div>
        </div>
      )}

      {/* タスクリスト */}
      <ul aria-label="タスクリスト" className="space-y-2" role="list">
        {tasks.map((task) => (
          <li
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            data-completed={task.completed}
            data-important={task.important}
            data-testid="task-item"
            key={task.id}
          >
            <div className="flex items-center justify-between">
              {/* タスク情報 */}
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setSelectedTaskId(task.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedTaskId(task.id)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center space-x-3">
                  {/* 完了チェックボックス */}
                  <input
                    aria-label={`${task.title}を完了`}
                    checked={task.completed}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    onChange={() => toggleTaskCompletion(task.id)}
                    type="checkbox"
                  />

                  {/* タスクタイトル */}
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
                  className={
                    task.important ? 'bg-yellow-50 border-yellow-300' : ''
                  }
                  onClick={() => toggleTaskImportance(task.id)}
                  size="sm"
                  variant="outline"
                >
                  {task.important ? '⭐' : '☆'}
                </Button>

                {/* 削除ボタン */}
                <Button
                  aria-label={`${task.title}を削除`}
                  className="text-red-600 hover:bg-red-50 hover:border-red-300"
                  onClick={() => removeTask(task.id)}
                  size="sm"
                  variant="outline"
                >
                  削除
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* タスク作成モーダル */}
      <TaskCreateModal
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreate={handleTaskCreate}
        opened={isCreateModalOpen}
      />
    </div>
  )
}

/**
 * フィルター名を日本語に変換
 * @param filter フィルター
 * @returns 日本語フィルター名
 */
function getFilterDisplayName(filter: string): string {
  switch (filter) {
    case 'all': {
      return 'すべてのタスク'
    }
    case 'assigned-to-me': {
      return '自分に割り当てられたタスク'
    }
    case 'completed': {
      return '完了したタスク'
    }
    case 'flagged-email': {
      return 'フラグ付きメール'
    }
    case 'important': {
      return '重要なタスク'
    }
    case 'planned': {
      return '予定されたタスク'
    }
    case 'today': {
      return '今日のタスク'
    }
    default: {
      return 'タスク'
    }
  }
}
