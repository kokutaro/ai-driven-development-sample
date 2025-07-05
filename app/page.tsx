'use client'

import { useEffect } from 'react'

import { Container, Paper, Stack, Title } from '@mantine/core'

import { TodoStatsDashboard } from '@/components/dashboard/todo-stats-dashboard'
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
        <Title order={1} ta="center">
          Think Harder TODO App
        </Title>
        <TodoStatsDashboard />
        <Paper p="xl" withBorder>
          <Stack gap="lg">
            <TodoAddForm />
            <TodoList />
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
