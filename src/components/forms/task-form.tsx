/**
 * タスク作成フォームコンポーネント
 * @fileoverview タスクを作成するためのフォームコンポーネント
 */
'use client'

import { useState } from 'react'

import { Alert, Checkbox, Textarea } from '@mantine/core'

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
    // eslint-disable-next-line security/detect-object-injection
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        // eslint-disable-next-line security/detect-object-injection
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
        // eslint-disable-next-line security/detect-object-injection
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
        <Alert color="red" title="エラー">
          {error}
        </Alert>
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
      <Textarea
        aria-label="説明"
        error={validationErrors.description}
        id="task-description"
        label="説明"
        onChange={(e) =>
          updateField('description', e.target.value || undefined)
        }
        placeholder="タスクの説明（任意）"
        rows={3}
        value={formData.description ?? ''}
      />

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
      <Checkbox
        aria-label="重要"
        checked={formData.important}
        id="task-important"
        label="重要"
        onChange={(e) => updateField('important', e.target.checked)}
      />

      {/* 送信ボタン */}
      <Button className="w-full" disabled={isLoading} type="submit">
        {isLoading ? 'タスクを作成中...' : 'タスクを作成'}
      </Button>
    </form>
  )
}
