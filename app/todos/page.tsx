'use client'

import { Container, Title, Space, Button, Group } from '@mantine/core'
import { useEffect } from 'react'

import { TodoList } from '@/components/features/todo-list'
import { useTodoStore } from '@/stores/todo-store'

/**
 * TODO一覧ページ
 *
 * @returns TODO一覧ページのJSX要素
 */
export default function TodosPage() {
  const addTodo = useTodoStore((state) => state.addTodo)

  // デモ用のサンプルデータを追加
  useEffect(() => {
    addTodo('サンプルTODO1', 'これは最初のサンプルTODOです')
    addTodo('サンプルTODO2', 'これは2番目のサンプルTODOです')
    addTodo('サンプルTODO3')
  }, [addTodo])

  return (
    <Container size="md" py="xl">
      <Title order={1} ta="center" mb="xl">
        TODO一覧
      </Title>

      <Group justify="center" mb="xl">
        <Button
          onClick={() => addTodo('新しいTODO', 'ボタンから追加されたTODOです')}
          size="md"
        >
          TODO追加
        </Button>
      </Group>

      <Space h="md" />

      <TodoList />
    </Container>
  )
}
