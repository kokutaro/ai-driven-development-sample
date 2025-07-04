'use client'

import {
  Button,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
  Textarea,
  ActionIcon,
} from '@mantine/core'
import { IconTrash, IconEdit, IconCheck, IconX } from '@tabler/icons-react'
import { useState } from 'react'

import type { Todo } from '@/types/todo'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onUpdate: (id: string, data: { title: string; description?: string }) => void
  onDelete: (id: string) => void
}

/**
 * Todoアイテムコンポーネント
 *
 * @description 個別のTodoアイテムを表示・編集・削除するコンポーネント
 * - チェックボックスによる完了状態の切り替え
 * - インライン編集機能
 * - 削除機能
 *
 * @param {TodoItemProps} props - コンポーネントのプロパティ
 * @param {Todo} props.todo - Todoアイテムデータ
 * @param {Function} props.onToggle - 完了状態切り替えハンドラー
 * @param {Function} props.onUpdate - 更新ハンドラー
 * @param {Function} props.onDelete - 削除ハンドラー
 */
export function TodoItem({
  todo,
  onToggle,
  onUpdate,
  onDelete,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editDescription, setEditDescription] = useState(todo.description || '')

  /**
   * 編集の保存処理
   *
   * @description 編集内容を保存してTodoアイテムを更新
   */
  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate(todo.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      })
      setIsEditing(false)
    }
  }

  /**
   * 編集のキャンセル処理
   *
   * @description 編集をキャンセルして元の値に戻す
   */
  const handleCancel = () => {
    setEditTitle(todo.title)
    setEditDescription(todo.description || '')
    setIsEditing(false)
  }

  /**
   * 削除の確認処理
   *
   * @description 削除確認を行い、Todoアイテムを削除
   */
  const handleDelete = () => {
    if (window.confirm('このTodoを削除しますか？')) {
      onDelete(todo.id)
    }
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" align="flex-start">
        <Group align="flex-start" style={{ flex: 1 }}>
          <Checkbox
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            size="md"
            mt={2}
          />

          <Stack gap="xs" style={{ flex: 1 }}>
            {isEditing ? (
              <>
                <Textarea
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Todoのタイトルを入力"
                  minRows={1}
                  autosize
                  required
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="説明（オプション）"
                  minRows={2}
                  autosize
                />
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="filled"
                    leftSection={<IconCheck size={16} />}
                    onClick={handleSave}
                    disabled={!editTitle.trim()}
                  >
                    保存
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconX size={16} />}
                    onClick={handleCancel}
                  >
                    キャンセル
                  </Button>
                </Group>
              </>
            ) : (
              <>
                <Text
                  size="md"
                  fw={500}
                  style={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    opacity: todo.completed ? 0.6 : 1,
                  }}
                >
                  {todo.title}
                </Text>
                {todo.description && (
                  <Text
                    size="sm"
                    c="dimmed"
                    style={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      opacity: todo.completed ? 0.6 : 1,
                    }}
                  >
                    {todo.description}
                  </Text>
                )}
                <Text size="xs" c="dimmed">
                  作成日: {new Date(todo.createdAt).toLocaleDateString('ja-JP')}
                  {todo.updatedAt !== todo.createdAt && (
                    <>
                      {' '}
                      (更新日:{' '}
                      {new Date(todo.updatedAt).toLocaleDateString('ja-JP')})
                    </>
                  )}
                </Text>
              </>
            )}
          </Stack>
        </Group>

        {!isEditing && (
          <Group gap="xs">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => setIsEditing(true)}
              aria-label="編集"
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="red"
              onClick={handleDelete}
              aria-label="削除"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        )}
      </Group>
    </Card>
  )
}
