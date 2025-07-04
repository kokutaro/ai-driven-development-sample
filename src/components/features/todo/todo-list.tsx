'use client'

import { Alert, Button, Group, Loader, Stack, Text } from '@mantine/core'
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import { useEffect } from 'react'

import { useTodoStore } from '@/stores/todo-store'
import type { CreateTodo, UpdateTodo } from '@/types/todo'

import { TodoForm } from './todo-form'
import { TodoItem } from './todo-item'

/**
 * Todoリストコンポーネント
 *
 * @description Todoアイテムの一覧表示とCRUD操作を行うメインコンポーネント
 * - Todoアイテムの一覧表示
 * - 新しいTodoアイテムの作成
 * - 既存のTodoアイテムの更新・削除
 * - ローディング状態とエラー処理
 */
export function TodoList() {
  const {
    todos,
    loading,
    error,
    fetchTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    setError,
  } = useTodoStore()

  // コンポーネントマウント時にTodoアイテムを取得
  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  /**
   * 新しいTodoアイテムの作成処理
   *
   * @param {CreateTodo} todo - 作成するTodoアイテムのデータ
   */
  const handleAddTodo = async (todo: CreateTodo) => {
    await addTodo(todo)
  }

  /**
   * Todoアイテムの更新処理
   *
   * @param {string} id - 更新対象のTodoアイテムのID
   * @param {UpdateTodo} data - 更新データ
   */
  const handleUpdateTodo = async (id: string, data: UpdateTodo) => {
    await updateTodo(id, data)
  }

  /**
   * Todoアイテムの削除処理
   *
   * @param {string} id - 削除対象のTodoアイテムのID
   */
  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id)
  }

  /**
   * Todoアイテムの完了状態切り替え処理
   *
   * @param {string} id - 切り替え対象のTodoアイテムのID
   */
  const handleToggleTodo = async (id: string) => {
    await toggleTodo(id)
  }

  /**
   * データ再取得処理
   *
   * @description エラー時などに手動でデータを再取得
   */
  const handleRefresh = () => {
    setError(null)
    fetchTodos()
  }

  // エラー状態の表示
  if (error) {
    return (
      <Stack gap="md">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="エラーが発生しました"
          color="red"
          variant="light"
        >
          {error}
        </Alert>
        <Group justify="center">
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            variant="light"
          >
            再読み込み
          </Button>
        </Group>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      {/* Todo作成フォーム */}
      <TodoForm onSubmit={handleAddTodo} loading={loading} />

      {/* Todoアイテム一覧 */}
      <Stack gap="md">
        {/* ヘッダー */}
        <Group justify="space-between" align="center">
          <Text size="xl" fw={700}>
            Todoリスト ({todos.length}件)
          </Text>
          <Button
            variant="light"
            size="sm"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={loading}
          >
            更新
          </Button>
        </Group>

        {/* ローディング状態 */}
        {loading && todos.length === 0 && (
          <Group justify="center" py="xl">
            <Loader size="md" />
            <Text c="dimmed">読み込み中...</Text>
          </Group>
        )}

        {/* Todoアイテムがない場合 */}
        {!loading && todos.length === 0 && (
          <Group justify="center" py="xl">
            <Text c="dimmed" size="lg">
              まだTodoがありません。上のフォームから新しいTodoを追加してください。
            </Text>
          </Group>
        )}

        {/* Todoアイテムリスト */}
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={handleToggleTodo}
            onUpdate={handleUpdateTodo}
            onDelete={handleDeleteTodo}
          />
        ))}
      </Stack>
    </Stack>
  )
}
