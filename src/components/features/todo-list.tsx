import { Paper, Text, Stack, Group, Badge, Container } from '@mantine/core'

import { Todo } from '@/schemas/todo'
import { useTodoStore } from '@/stores/todo-store'

/**
 * TODO項目の表示コンポーネント
 *
 * @param todo - 表示するTODO項目
 * @returns TODO項目のJSX要素
 */
const TodoItem = ({ todo }: { todo: Todo }) => {
  return (
    <Paper
      p="md"
      shadow="sm"
      radius="md"
      data-testid="todo-item"
      data-status={todo.status}
    >
      <Group justify="space-between" mb="sm">
        <Text size="lg" fw={500}>
          {todo.title}
        </Text>
        <Badge color={todo.status === 'completed' ? 'green' : 'blue'}>
          {todo.status === 'completed' ? '完了' : '未完了'}
        </Badge>
      </Group>
      {todo.description && (
        <Text size="sm" c="dimmed">
          {todo.description}
        </Text>
      )}
    </Paper>
  )
}

/**
 * TODO一覧表示コンポーネント
 *
 * @returns TODO一覧のJSX要素
 */
export const TodoList = () => {
  const todos = useTodoStore((state) => state.todos)

  if (todos.length === 0) {
    return (
      <Container size="sm">
        <Text ta="center" c="dimmed" size="lg">
          TODO項目がありません
        </Text>
      </Container>
    )
  }

  return (
    <Container size="sm">
      <Stack gap="md">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </Stack>
    </Container>
  )
}
