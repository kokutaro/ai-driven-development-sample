/**
 * タスク作成モーダルコンポーネント
 * @fileoverview Mantineベースのタスク作成フォームモーダル
 */
'use client'

import { useEffect, useState } from 'react'

import {
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm, zodResolver } from '@mantine/form'

import type { CreateTaskInput } from '@/types/task'

import { createTaskInputSchema } from '@/schemas/task.schema'

/**
 * TaskCreateModalコンポーネントのプロパティ
 */
export interface TaskCreateModalProps {
  /**
   * モーダルを閉じる時のコールバック
   */
  onClose: () => void

  /**
   * タスク作成時のコールバック
   * @param taskData 作成するタスクデータ
   */
  onTaskCreate: (taskData: CreateTaskInput) => Promise<void> | void

  /**
   * モーダルの表示状態
   */
  opened: boolean
}

/**
 * タスク作成モーダルコンポーネント
 * @param props プロパティ
 * @returns タスク作成モーダル
 */
export function TaskCreateModal({
  onClose,
  onTaskCreate,
  opened,
}: TaskCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateTaskInput>({
    initialValues: {
      description: '',
      important: false,
      title: '',
    },
    mode: 'uncontrolled',
    validate: zodResolver(createTaskInputSchema),
  })

  /**
   * フォームの送信処理
   * @param values フォームの値
   */
  async function handleSubmit(values: CreateTaskInput) {
    try {
      setIsLoading(true)

      // 空文字列は undefined に変換
      const submitData: CreateTaskInput = {
        categoryId: values.categoryId,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        description: values.description || undefined,
        dueDate: values.dueDate,
        important: values.important,
        reminderDate: values.reminderDate,
        repeatPattern: values.repeatPattern,
        title: values.title,
      }

      await onTaskCreate(submitData)
      form.reset()
      onClose()
    } catch (error) {
      console.error('タスク作成エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * モーダルが閉じられた時の処理
   */
  function handleClose() {
    form.reset()
    onClose()
  }

  // モーダルが開かれた時にフォームをリセット
  useEffect(() => {
    if (opened) {
      form.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  return (
    <Modal
      closeButtonProps={{ 'aria-label': 'モーダルを閉じる' }}
      onClose={handleClose}
      opened={opened}
      size="md"
      title="新しいタスクを作成"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* タスクタイトル */}
          <TextInput
            data-autofocus
            disabled={isLoading}
            key={form.key('title')}
            label="タスクタイトル"
            placeholder="タスクのタイトルを入力してください"
            required
            {...form.getInputProps('title')}
          />

          {/* 説明 */}
          <Textarea
            disabled={isLoading}
            key={form.key('description')}
            label="説明（任意）"
            placeholder="タスクの詳細を入力してください"
            rows={3}
            {...form.getInputProps('description')}
          />

          {/* 期限日 */}
          <DateInput
            disabled={isLoading}
            key={form.key('dueDate')}
            label="期限日（任意）"
            placeholder="期限日を選択してください"
            valueFormat="YYYY/MM/DD"
            {...form.getInputProps('dueDate')}
          />

          {/* 重要フラグ */}
          <Checkbox
            disabled={isLoading}
            key={form.key('important')}
            label="重要なタスクとして設定"
            {...form.getInputProps('important', { type: 'checkbox' })}
          />

          {/* アクションボタン */}
          <Group justify="flex-end" mt="md">
            <Button disabled={isLoading} onClick={handleClose} variant="subtle">
              キャンセル
            </Button>
            <Button disabled={isLoading} loading={isLoading} type="submit">
              作成
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
