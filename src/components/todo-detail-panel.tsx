'use client'

import { useEffect, useState } from 'react'

import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm, zodResolver } from '@mantine/form'
import { IconX } from '@tabler/icons-react'

import type { UpdateTodoInput } from '@/types/todo'

import { updateTodoInputSchema } from '@/schemas/todo'
import { useTodoStore } from '@/stores/todo-store'
import { useTodoUIStore } from '@/stores/todo-ui-store'

/**
 * 選択されたTODO項目の詳細を表示・編集するパネルコンポーネント
 *
 * @description
 * 右側に表示される詳細パネルで、選択されたTODO項目の詳細情報を表示し、
 * タイトルや説明の編集機能を提供します。
 *
 * @example
 * ```tsx
 * <TodoDetailPanel />
 * ```
 */
export function TodoDetailPanel() {
  const { getTodoById, updateTodo } = useTodoStore()
  const { selectedTodoId, setSelectedTodoId } = useTodoUIStore()

  // 選択されたTODO項目を取得
  const selectedTodo = selectedTodoId ? getTodoById(selectedTodoId) : undefined

  const form = useForm<UpdateTodoInput>({
    initialValues: {
      description: '',
      title: '',
    },
    validate: zodResolver(updateTodoInputSchema),
  })

  const [originalValues, setOriginalValues] = useState<UpdateTodoInput>({
    description: '',
    title: '',
  })

  // 選択されたTODOが変更されたときにフォームの初期値を設定
  useEffect(() => {
    if (selectedTodo) {
      const values = {
        description: selectedTodo.description ?? '',
        title: selectedTodo.title,
      }
      form.setValues(values)
      setOriginalValues(values)
    } else {
      form.reset()
      setOriginalValues({ description: '', title: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTodo])

  /**
   * フォーム送信時の処理
   *
   * @param values - フォームの値
   */
  async function handleSubmit(values: UpdateTodoInput) {
    if (!selectedTodoId) return

    try {
      await updateTodo(selectedTodoId, values)
      setOriginalValues(values)
    } catch (error) {
      console.error('Failed to update todo:', error)
    }
  }

  /**
   * 詳細パネルを閉じる処理
   */
  function handleClose() {
    setSelectedTodoId(undefined)
  }

  /**
   * 変更されているかどうかを判定
   */
  function hasChanges(): boolean {
    return (
      form.values.title !== originalValues.title ||
      form.values.description !== originalValues.description
    )
  }

  // TODO項目が選択されていない場合
  if (!selectedTodoId) {
    return (
      <Card h="100%" p="xl">
        <Stack align="center" h="100%" justify="center">
          <Title c="dimmed" order={3}>
            TODO項目を選択してください
          </Title>
          <Text c="dimmed" ta="center">
            左側のリストからTODO項目を選択すると、詳細を表示・編集できます。
          </Text>
        </Stack>
      </Card>
    )
  }

  // 選択されたTODO項目が見つからない場合
  if (!selectedTodo) {
    return (
      <Card h="100%" p="xl">
        <Stack align="center" h="100%" justify="center">
          <Title c="red" order={3}>
            TODO項目が見つかりません
          </Title>
          <Button onClick={handleClose} variant="light">
            戻る
          </Button>
        </Stack>
      </Card>
    )
  }

  return (
    <Card h="100%" p="md">
      <Stack gap="md" h="100%">
        {/* ヘッダー */}
        <Group align="center" justify="space-between">
          <Title order={3}>TODO詳細</Title>
          <Button
            aria-label="閉じる"
            leftSection={<IconX size={16} />}
            onClick={handleClose}
            size="sm"
            variant="subtle"
          >
            閉じる
          </Button>
        </Group>

        {/* 編集フォーム */}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="タイトル"
              placeholder="TODOのタイトルを入力してください"
              required
              {...form.getInputProps('title')}
            />

            <Textarea
              label="説明"
              placeholder="TODOの説明を入力してください（任意）"
              rows={4}
              {...form.getInputProps('description')}
            />

            <Button disabled={!hasChanges()} fullWidth type="submit">
              変更を保存
            </Button>
          </Stack>
        </form>

        {/* メタデータ */}
        <Stack gap="xs" mt="auto">
          <Text c="dimmed" size="sm">
            <strong>作成日時:</strong>{' '}
            {selectedTodo.createdAt.toLocaleString('ja-JP')}
          </Text>
          <Text c="dimmed" size="sm">
            <strong>更新日時:</strong>{' '}
            {selectedTodo.updatedAt.toLocaleString('ja-JP')}
          </Text>
          <Text c="dimmed" size="sm">
            <strong>状態:</strong>{' '}
            {selectedTodo.status === 'completed' ? '完了' : '未完了'}
          </Text>
        </Stack>
      </Stack>
    </Card>
  )
}
