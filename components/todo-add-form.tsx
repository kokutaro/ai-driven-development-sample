'use client'

import { Button, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm, zodResolver } from '@mantine/form'

import type { CreateTodoInput } from '@/types/todo'

import { createTodoInputSchema } from '@/schemas/todo'
import { useTodoStore } from '@/stores/todo-store'

/**
 * TODO項目を追加するフォームコンポーネント
 *
 * @description
 * ユーザーが新しいTODO項目を追加するためのフォームを提供します。
 * タイトル（必須）と説明（任意）を入力できます。
 *
 * @example
 * ```tsx
 * <TodoAddForm />
 * ```
 */
export function TodoAddForm() {
  const addTodo = useTodoStore((state) => state.addTodo)

  const form = useForm<CreateTodoInput>({
    initialValues: {
      description: '',
      title: '',
    },
    validate: zodResolver(createTodoInputSchema),
  })

  /**
   * フォーム送信時の処理
   *
   * @param values - フォームの値
   */
  async function handleSubmit(values: CreateTodoInput) {
    try {
      await addTodo(values)
      form.reset()
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  }

  /**
   * Enterキー押下時の処理
   *
   * @param event - キーボードイベント
   */
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      form.onSubmit(handleSubmit)()
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="タイトル"
          placeholder="TODO のタイトルを入力してください"
          required
          {...form.getInputProps('title')}
          onKeyDown={handleKeyDown}
        />
        <Textarea
          label="説明"
          placeholder="TODO の説明を入力してください（任意）"
          {...form.getInputProps('description')}
        />
        <Button type="submit">TODO を追加</Button>
      </Stack>
    </form>
  )
}
