'use client'

import { Button, Card, Group, Stack, Text, Textarea } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

import type { CreateTodo } from '@/types/todo'

interface TodoFormProps {
  onSubmit: (todo: CreateTodo) => void
  loading?: boolean
}

/**
 * Todo作成フォームコンポーネント
 *
 * @description 新しいTodoアイテムを作成するためのフォーム
 * - タイトル入力（必須）
 * - 説明入力（オプション）
 * - フォームバリデーション
 *
 * @param {TodoFormProps} props - コンポーネントのプロパティ
 * @param {Function} props.onSubmit - フォーム送信ハンドラー
 * @param {boolean} props.loading - ローディング状態
 */
export function TodoForm({ onSubmit, loading = false }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  /**
   * フォーム送信処理
   *
   * @description フォームの値を検証し、新しいTodoアイテムを作成
   */
  const handleSubmit = () => {
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        completed: false,
      })

      // フォームをリセット
      setTitle('')
      setDescription('')
    }
  }

  /**
   * Enterキーでの送信処理
   *
   * @description Shift+Enterで改行、Enterのみで送信
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Text size="lg" fw={600}>
          新しいTodoを追加
        </Text>

        <Textarea
          placeholder="Todoのタイトルを入力してください"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          minRows={1}
          autosize
          required
          error={
            title.trim() === '' && title !== '' ? 'タイトルは必須です' : null
          }
        />

        <Textarea
          placeholder="説明（オプション）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minRows={2}
          autosize
        />

        <Group justify="flex-end">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleSubmit}
            disabled={!title.trim() || loading}
            loading={loading}
          >
            追加
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}
