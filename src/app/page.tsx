import { Container, Stack, Text, Title } from '@mantine/core'

import { TodoList } from '@/components/features/todo/todo-list'

/**
 * ホームページコンポーネント
 *
 * @description Todoアプリのメインページ
 * Todoリストコンポーネントを含むシンプルなレイアウト
 */
export default function HomePage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* ヘッダー */}
        <Stack gap="md" align="center">
          <Title order={1} size="h1" ta="center">
            Todo App
          </Title>
          <Text size="lg" c="dimmed" ta="center">
            シンプルで使いやすいTodoアプリケーション
          </Text>
        </Stack>

        {/* メインコンテンツ */}
        <TodoList />
      </Stack>
    </Container>
  )
}
