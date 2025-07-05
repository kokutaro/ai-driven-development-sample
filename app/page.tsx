'use client'

import { useEffect } from 'react'

import { Container, Paper, Stack, Title } from '@mantine/core'

import { TodoAddForm } from '@/components/todo-add-form'
import { TodoList } from '@/components/todo-list'
import { useTodoStore } from '@/stores/todo-store'

/**
 * TODO アプリケーションのメインページ
 */
export default function HomePage() {
  const initializeTodos = useTodoStore((state) => state.initializeTodos)

  useEffect(() => {
    // アプリケーション起動時にデータベースからTODOを読み込む
    void initializeTodos()
  }, [initializeTodos])

  return (
    <Container py="xl" size="md">
      <Stack gap="xl">
        <Paper p="xl" withBorder>
          <Title mb="lg" order={1} ta="center">
            Think Harder TODO App
          </Title>
          <Stack gap="lg">
            <TodoAddForm />
            <TodoList />
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
