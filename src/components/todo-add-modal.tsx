'use client'

import { useEffect, useState } from 'react'

import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'

/**
 * TODO追加フォームのデータ
 */
interface TodoAddFormData {
  /** 説明 */
  description: string
  /** 期限 */
  dueDate: Date | undefined
  /** タイトル */
  title: string
}

/**
 * TodoAddModalコンポーネントのProps
 */
interface TodoAddModalProps {
  /** モーダルを閉じる関数 */
  onClose: () => void
  /** フォーム送信時のコールバック */
  onSubmit: (data: TodoAddFormData) => void
  /** モーダルの開閉状態 */
  opened: boolean
}

/**
 * 期限選択肢のデータ
 */
const dueDateOptions = [
  { label: '期限なし', value: '' },
  { label: '今日', value: 'today' },
  { label: '明日', value: 'tomorrow' },
  { label: '来週', value: 'next-week' },
  { label: 'カレンダーから指定', value: 'calendar' },
]

/**
 * TODO追加モーダルコンポーネント
 *
 * @description
 * Microsoft To-Do風のTODO追加モーダルです。
 * 以下の機能を提供します：
 * - タイトル入力（必須）
 * - 説明入力（任意）
 * - 期限選択（任意）
 * - バリデーション
 * - フォーカス管理
 *
 * @example
 * ```tsx
 * <TodoAddModal
 *   opened={opened}
 *   onClose={handlers.close}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function TodoAddModal({ onClose, onSubmit, opened }: TodoAddModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<string | undefined>('')
  const [titleError, setTitleError] = useState('')

  /**
   * フォームをリセットする
   */
  function resetForm() {
    setTitle('')
    setDescription('')
    setDueDate('')
    setTitleError('')
  }

  /**
   * モーダルが閉じられた時の処理
   */
  function handleClose() {
    resetForm()
    onClose()
  }

  /**
   * フォーム送信処理
   */
  function handleSubmit() {
    // バリデーション
    if (!title.trim()) {
      setTitleError('タイトルは必須です')
      return
    }

    setTitleError('')

    // 期限を実際の日付に変換
    const convertedDueDate = convertDueDateToDate(dueDate)

    // フォームデータを送信
    onSubmit({
      description: description.trim(),
      dueDate: convertedDueDate,
      title: title.trim(),
    })

    // フォームをリセット
    resetForm()
  }

  /**
   * タイトル入力変更時の処理
   */
  function handleTitleChange(value: string) {
    setTitle(value)
    if (titleError && value.trim()) {
      setTitleError('')
    }
  }

  // モーダルが閉じられた時にフォームをリセット
  useEffect(() => {
    if (!opened) {
      resetForm()
    }
  }, [opened])

  return (
    <Modal
      centered
      onClose={handleClose}
      opened={opened}
      size="md"
      title="新しいタスクを追加"
    >
      <Stack gap="md">
        <TextInput
          data-autofocus
          error={titleError}
          label="タイトル"
          onChange={(event) => handleTitleChange(event.currentTarget.value)}
          placeholder="タスクのタイトルを入力してください"
          required
          value={title}
        />

        <Textarea
          label="説明"
          onChange={(event) => setDescription(event.currentTarget.value)}
          placeholder="タスクの説明を入力してください（任意）"
          rows={3}
          value={description}
        />

        <div>
          <Text fw={500} mb={5} size="sm">
            期限
          </Text>
          <Select
            clearable
            data={dueDateOptions}
            onChange={(value) => setDueDate(value ?? undefined)}
            placeholder="期限を選択してください"
            value={dueDate}
          />
        </div>

        <Group justify="flex-end" mt="md">
          <Button onClick={handleClose} variant="subtle">
            キャンセル
          </Button>
          <Button onClick={handleSubmit}>作成</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

/**
 * 期限選択値を実際の日付に変換する
 *
 * @param dueDateValue 期限選択値
 * @returns 変換された日付またはundefined
 */
function convertDueDateToDate(
  dueDateValue: string | undefined
): Date | undefined {
  if (!dueDateValue) return undefined

  const today = new Date()
  today.setHours(23, 59, 59, 999) // 当日の終了時刻に設定

  switch (dueDateValue) {
    case 'calendar': {
      // カレンダーから指定の場合は現在は未実装のためundefinedを返す
      return undefined
    }
    case 'next-week': {
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek
    }
    case 'today': {
      return today
    }
    case 'tomorrow': {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    }
    default: {
      return undefined
    }
  }
}
