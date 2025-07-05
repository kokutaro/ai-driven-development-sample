'use client'

import { useEffect } from 'react'

import { Container, Paper, Stack, Title } from '@mantine/core'

import type { Todo } from '@/types/todo'

import { TodoList } from '@/components/todo-list'
import { useTodoStore } from '@/stores/todo-store'

/**
 * サンプルのTODO項目データ
 */
const sampleTodos: Todo[] = [
  {
    createdAt: new Date('2023-01-01'),
    description: 'プロジェクトの企画書を作成し、チームに共有する',
    id: '1',
    status: 'pending',
    title: 'プロジェクト企画書を作成',
    updatedAt: new Date('2023-01-01'),
  },
  {
    createdAt: new Date('2023-01-02'),
    id: '2',
    status: 'completed',
    title: 'デザインシステムの導入',
    updatedAt: new Date('2023-01-02'),
  },
  {
    createdAt: new Date('2023-01-03'),
    description: 'ユーザーインターフェースの改善を行う',
    id: '3',
    status: 'pending',
    title: 'UI/UXの改善',
    updatedAt: new Date('2023-01-03'),
  },
]

/**
 * TODO アプリケーションのメインページ
 */
export default function HomePage() {
  const initializeTodos = useTodoStore((state) => state.initializeTodos)

  useEffect(() => {
    // アプリケーション起動時にサンプルデータを初期化
    initializeTodos(sampleTodos)
  }, [initializeTodos])

  return (
    <Container py="xl" size="md">
      <Stack gap="xl">
        <Paper p="xl" withBorder>
          <Title mb="lg" order={1} ta="center">
            Think Harder TODO App
          </Title>
          <TodoList />
        </Paper>
      </Stack>
    </Container>
  )
}
