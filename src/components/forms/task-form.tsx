/**
 * タスク作成フォームコンポーネント
 * @fileoverview タスクを作成するためのフォームコンポーネント
 */
'use client'

import { useState } from 'react'

import type { CreateTaskInput } from '@/types/task'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTaskInputSchema } from '@/schemas/task.schema'
import { useTaskStore } from '@/stores'

/**
 * タスク作成フォームコンポーネント
 * @returns タスク作成フォーム
 */
export function TaskForm() {
  const { addTask, clearError, error, isLoading, setError } = useTaskStore()

  // フォームの状態
  const [formData, setFormData] = useState<CreateTaskInput>({
    description: undefined,
    dueDate: undefined,
    important: false,
    title: '',
  })

  // バリデーションエラーの状態
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})

  /**
   * 入力値を更新する
   * @param field フィールド名
   * @param value 新しい値
   */
  function updateField(
    field: keyof CreateTaskInput,
    value: boolean | Date | string | undefined
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // 入力時にエラーをクリア
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    if (error) {
      clearError()
    }
  }

  /**
   * フォームをリセットする
   */
  function resetForm() {
    setFormData({
      description: undefined,
      dueDate: undefined,
      important: false,
      title: '',
    })
    setValidationErrors({})
    clearError()
  }

  /**
   * フォーム送信を処理する
   * @param e フォームイベント
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // バリデーション
    const result = createTaskInputSchema.safeParse(formData)

    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string
        errors[path] = issue.message
      }
      setValidationErrors(errors)
      return
    }

    try {
      // 新しいタスクを作成
      const newTask = {
        categoryId: result.data.categoryId,
        completed: false,
        createdAt: new Date(),
        description: result.data.description,
        dueDate: result.data.dueDate,
        id: crypto.randomUUID(),
        important: result.data.important ?? false,
        reminderDate: result.data.reminderDate,
        repeatPattern: result.data.repeatPattern,
        subtasks: [],
        title: result.data.title,
        updatedAt: new Date(),
        userId: 'current-user-id', // 実際のアプリでは認証されたユーザーIDを使用
      }

      addTask(newTask)
      resetForm()
    } catch {
      setError('タスクの作成に失敗しました')
    }
  }

  return (
    <form
      aria-label="タスク作成フォーム"
      className="space-y-4 p-4 border rounded-lg"
      onSubmit={handleSubmit}
      role="form"
    >
      {/* エラーメッセージの表示 */}
      {error && (
        <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {/* タイトル入力フィールド */}
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="task-title">
          タスクタイトル
        </label>
        <Input
          aria-label="タスクタイトル"
          id="task-title"
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="タスクのタイトルを入力してください"
          required
          type="text"
          value={formData.title}
        />
        {validationErrors.title && (
          <div className="text-red-600 text-sm" data-testid="validation-error">
            {validationErrors.title}
          </div>
        )}
      </div>

      {/* 説明入力フィールド */}
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="task-description">
          説明
        </label>
        <textarea
          aria-label="説明"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="task-description"
          onChange={(e) =>
            updateField('description', e.target.value || undefined)
          }
          placeholder="タスクの説明（任意）"
          rows={3}
          value={formData.description ?? ''}
        />
        {validationErrors.description && (
          <div className="text-red-600 text-sm">
            {validationErrors.description}
          </div>
        )}
      </div>

      {/* 期限設定フィールド */}
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="task-due-date">
          期限
        </label>
        <Input
          aria-label="期限"
          id="task-due-date"
          onChange={(e) =>
            updateField(
              'dueDate',
              e.target.value ? new Date(e.target.value) : undefined
            )
          }
          type="date"
          value={
            formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''
          }
        />
        {validationErrors.dueDate && (
          <div className="text-red-600 text-sm">{validationErrors.dueDate}</div>
        )}
      </div>

      {/* 重要度チェックボックス */}
      <div className="flex items-center space-x-2">
        <input
          aria-label="重要"
          checked={formData.important}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          id="task-important"
          onChange={(e) => updateField('important', e.target.checked)}
          type="checkbox"
        />
        <label className="text-sm font-medium" htmlFor="task-important">
          重要
        </label>
      </div>

      {/* 送信ボタン */}
      <Button className="w-full" disabled={isLoading} type="submit">
        {isLoading ? 'タスクを作成中...' : 'タスクを作成'}
      </Button>
    </form>
  )
}
