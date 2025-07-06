# コンポーネント設計書

## 概要

TODO システムのコンポーネント設計書です。Mantine を使用したコンポーネント構成と、React の機能的コンポーネントの設計を記載しています。

## コンポーネント構成

### アーキテクチャ原則

- **単一責任の原則**: 各コンポーネントは1つの明確な責任を持つ
- **コンポーネントの再利用性**: 汎用的なコンポーネントは共通化
- **状態管理の分離**: Zustand を使用した状態管理
- **型安全性**: TypeScript による厳密な型定義

### ディレクトリ構成

```text
src/
├── components/
│   ├── ui/                     # 基本UIコンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── index.ts
│   ├── layout/                 # レイアウト関連
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── main-layout.tsx
│   ├── todo/                   # TODO関連コンポーネント
│   │   ├── todo-sidebar.tsx
│   │   ├── todo-main-content.tsx
│   │   ├── todo-detail-panel.tsx
│   │   ├── todo-list.tsx
│   │   ├── todo-item.tsx
│   │   ├── todo-add-modal.tsx
│   │   └── todo-filters.tsx
│   ├── forms/                  # フォームコンポーネント
│   │   ├── todo-form.tsx
│   │   ├── category-form.tsx
│   │   └── subtask-form.tsx
│   └── dashboard/              # ダッシュボード関連
│       ├── stats-card.tsx
│       └── progress-chart.tsx
├── stores/                     # Zustand状態管理
│   ├── todo-store.ts
│   ├── ui-store.ts
│   └── user-store.ts
├── hooks/                      # カスタムフック
│   ├── use-todos.ts
│   ├── use-categories.ts
│   └── use-local-storage.ts
├── types/                      # 型定義
│   ├── todo.ts
│   └── user.ts
└── schemas/                    # Zod バリデーション
    ├── todo.ts
    └── category.ts
```

## 主要コンポーネント設計

### 1. レイアウトコンポーネント

#### 1.1 MainLayout (src/components/layout/main-layout.tsx)

```typescript
import { ReactNode } from 'react'
import { AppShell, Header, Navbar, Main } from '@mantine/core'
import { HeaderComponent } from './header'
import { TodoSidebar } from '../todo/todo-sidebar'

interface MainLayoutProps {
  children: ReactNode
}

/**
 * メインレイアウトコンポーネント
 *
 * アプリケーション全体のレイアウト構造を定義します。
 * 3カラムレイアウト（サイドバー、メインコンテンツ、詳細パネル）を実装します。
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: true } }}
      padding="md"
    >
      <Header height={60}>
        <HeaderComponent />
      </Header>
      <Navbar p="md">
        <TodoSidebar />
      </Navbar>
      <Main>{children}</Main>
    </AppShell>
  )
}
```

#### 1.2 Header (src/components/layout/header.tsx)

```typescript
import { Group, Title, TextInput, ActionIcon, Avatar } from '@mantine/core'
import { IconSearch, IconSettings, IconHelp } from '@tabler/icons-react'
import { useUserStore } from '@/stores/user-store'

/**
 * ヘッダーコンポーネント
 *
 * アプリケーションのヘッダー部分を表示します。
 * - アプリケーション名
 * - 検索バー
 * - ユーザー情報とメニュー
 */
export function HeaderComponent() {
  const { user } = useUserStore()

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Title order={3} c="blue">
          To Do
        </Title>
      </Group>

      <Group>
        <TextInput
          placeholder="タスクを検索..."
          leftSection={<IconSearch size={16} />}
          w={300}
        />
        <ActionIcon variant="subtle" size="lg">
          <IconSettings size={18} />
        </ActionIcon>
        <ActionIcon variant="subtle" size="lg">
          <IconHelp size={18} />
        </ActionIcon>
        <Avatar name={user?.name} size="sm" />
      </Group>
    </Group>
  )
}
```

### 2. TODO関連コンポーネント

#### 2.1 TodoSidebar (src/components/todo/todo-sidebar.tsx)

```typescript
import { Stack, NavLink, Badge, Text } from '@mantine/core'
import {
  IconSun,
  IconStar,
  IconCalendarEvent,
  IconUser,
  IconMail,
  IconListCheck,
  IconCheck
} from '@tabler/icons-react'
import { useUiStore } from '@/stores/ui-store'
import { useTodoStats } from '@/hooks/use-todo-stats'

/**
 * TODOサイドバーコンポーネント
 *
 * フィルタ機能を提供するサイドバーです。
 * - 各フィルタ項目の表示
 * - 選択状態の管理
 * - タスク数の表示
 */
export function TodoSidebar() {
  const { selectedFilter, setSelectedFilter } = useUiStore()
  const { stats } = useTodoStats()

  const filters = [
    {
      key: 'today',
      label: '今日の予定',
      icon: IconSun,
      count: stats.todayCount,
      color: 'yellow'
    },
    {
      key: 'important',
      label: '重要',
      icon: IconStar,
      count: stats.importantCount,
      color: 'red'
    },
    {
      key: 'upcoming',
      label: '今後の予定',
      icon: IconCalendarEvent,
      count: stats.upcomingCount,
      color: 'blue'
    },
    {
      key: 'assigned',
      label: '自分に割り当て',
      icon: IconUser,
      count: stats.assignedCount,
      color: 'grape'
    },
    {
      key: 'flagged',
      label: 'フラグを設定したメール',
      icon: IconMail,
      count: 0,
      color: 'orange'
    },
    {
      key: 'all',
      label: 'タスク',
      icon: IconListCheck,
      count: stats.totalCount,
      color: 'gray'
    },
    {
      key: 'completed',
      label: '完了済み',
      icon: IconCheck,
      count: stats.completedCount,
      color: 'green'
    },
  ]

  return (
    <Stack gap="xs">
      {filters.map((filter) => (
        <NavLink
          key={filter.key}
          label={filter.label}
          leftSection={<filter.icon size={16} />}
          rightSection={
            filter.count > 0 && (
              <Badge size="sm" color={filter.color}>
                {filter.count}
              </Badge>
            )
          }
          active={selectedFilter === filter.key}
          onClick={() => setSelectedFilter(filter.key)}
        />
      ))}
    </Stack>
  )
}
```

#### 2.2 TodoMainContent (src/components/todo/todo-main-content.tsx)

```typescript
import { Stack, Group, Title, Button, Select, Text } from '@mantine/core'
import { IconPlus, IconSortDescending } from '@tabler/icons-react'
import { TodoList } from './todo-list'
import { TodoAddModal } from './todo-add-modal'
import { useUiStore } from '@/stores/ui-store'
import { useTodos } from '@/hooks/use-todos'
import { useState } from 'react'

/**
 * TODOメインコンテンツコンポーネント
 *
 * 中央カラムのメインコンテンツを表示します。
 * - 動的タイトル
 * - タスク追加ボタン
 * - 並び替えオプション
 * - タスク一覧
 */
export function TodoMainContent() {
  const { selectedFilter } = useUiStore()
  const { todos, isLoading } = useTodos(selectedFilter)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')

  const getTitle = () => {
    switch (selectedFilter) {
      case 'today':
        return '今日の予定'
      case 'important':
        return '重要なタスク'
      case 'upcoming':
        return '今後の予定'
      case 'completed':
        return '完了済みタスク'
      default:
        return 'すべてのタスク'
    }
  }

  const getSubtitle = () => {
    const today = new Date()
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
    return formatter.format(today)
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap="xs">
          <Title order={2}>{getTitle()}</Title>
          <Text size="sm" c="dimmed">
            {getSubtitle()}
          </Text>
        </Stack>
        <Group>
          <Select
            placeholder="並び替え"
            data={[
              { value: 'createdAt', label: '作成日時' },
              { value: 'dueDate', label: '期限日' },
              { value: 'title', label: 'タイトル' },
              { value: 'importance', label: '重要度' },
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value || 'createdAt')}
            leftSection={<IconSortDescending size={16} />}
            w={150}
          />
        </Group>
      </Group>

      <Button
        leftSection={<IconPlus size={16} />}
        onClick={() => setIsAddModalOpen(true)}
        size="lg"
        variant="light"
      >
        タスクの追加
      </Button>

      <TodoList todos={todos} isLoading={isLoading} sortBy={sortBy} />

      <TodoAddModal
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </Stack>
  )
}
```

#### 2.3 TodoList (src/components/todo/todo-list.tsx)

```typescript
import { Stack, Skeleton } from '@mantine/core'
import { TodoItem } from './todo-item'
import { Todo } from '@/types/todo'
import { useMemo } from 'react'

interface TodoListProps {
  todos: Todo[]
  isLoading: boolean
  sortBy: string
}

/**
 * TODOリストコンポーネント
 *
 * タスクの一覧を表示します。
 * - ソート機能
 * - ローディング状態
 * - 空状態の表示
 */
export function TodoList({ todos, isLoading, sortBy }: TodoListProps) {
  const sortedTodos = useMemo(() => {
    if (!todos) return []

    return [...todos].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'importance':
          return b.isImportant ? 1 : -1
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  }, [todos, sortBy])

  if (isLoading) {
    return (
      <Stack gap="xs">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height={80} />
        ))}
      </Stack>
    )
  }

  if (!sortedTodos.length) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed">タスクが見つかりません</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="xs">
      {sortedTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </Stack>
  )
}
```

#### 2.4 TodoItem (src/components/todo/todo-item.tsx)

```typescript
import {
  Card,
  Group,
  Checkbox,
  Text,
  Badge,
  ActionIcon,
  Stack
} from '@mantine/core'
import { IconStar, IconTrash, IconCalendar } from '@tabler/icons-react'
import { Todo } from '@/types/todo'
import { useTodoStore } from '@/stores/todo-store'
import { useUiStore } from '@/stores/ui-store'
import { formatDate } from '@/lib/utils'

interface TodoItemProps {
  todo: Todo
}

/**
 * TODOアイテムコンポーネント
 *
 * 個々のタスクを表示します。
 * - チェックボックス
 * - タイトルと説明
 * - 期限日
 * - 重要フラグ
 * - 削除ボタン
 * - クリック時の詳細表示
 */
export function TodoItem({ todo }: TodoItemProps) {
  const { toggleTodo, deleteTodo } = useTodoStore()
  const { selectedTodo, setSelectedTodo } = useUiStore()

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    await toggleTodo(todo.id)
  }

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (window.confirm('このタスクを削除しますか？')) {
      await deleteTodo(todo.id)
    }
  }

  const handleClick = () => {
    setSelectedTodo(todo)
  }

  const isSelected = selectedTodo?.id === todo.id
  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.isCompleted

  return (
    <Card
      padding="md"
      radius="md"
      withBorder
      style={{
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
        borderColor: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
      }}
      onClick={handleClick}
    >
      <Group justify="space-between" align="flex-start">
        <Group align="flex-start" gap="sm">
          <Checkbox
            checked={todo.isCompleted}
            onChange={handleToggle}
            size="sm"
            mt={2}
          />
          <Stack gap="xs" flex={1}>
            <Group gap="xs">
              <Text
                size="sm"
                fw={500}
                style={{
                  textDecoration: todo.isCompleted ? 'line-through' : 'none',
                  color: todo.isCompleted ? 'var(--mantine-color-dimmed)' : undefined,
                }}
              >
                {todo.title}
              </Text>
              {todo.isImportant && (
                <IconStar size={16} color="var(--mantine-color-yellow-6)" />
              )}
            </Group>
            {todo.description && (
              <Text size="xs" c="dimmed" lineClamp={2}>
                {todo.description}
              </Text>
            )}
            {todo.dueDate && (
              <Group gap="xs">
                <IconCalendar size={14} />
                <Text
                  size="xs"
                  c={isOverdue ? 'red' : 'dimmed'}
                >
                  {formatDate(todo.dueDate)}
                </Text>
              </Group>
            )}
            {todo.category && (
              <Badge size="sm" color={todo.category.color}>
                {todo.category.name}
              </Badge>
            )}
          </Stack>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          onClick={handleDelete}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </Card>
  )
}
```

#### 2.5 TodoDetailPanel (src/components/todo/todo-detail-panel.tsx)

```typescript
import {
  Stack,
  TextInput,
  Textarea,
  DatePickerInput,
  Switch,
  Select,
  Button,
  Group,
  Title,
  Divider
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconCalendar, IconStar, IconPlus } from '@tabler/icons-react'
import { Todo } from '@/types/todo'
import { useTodoStore } from '@/stores/todo-store'
import { useCategories } from '@/hooks/use-categories'
import { todoSchema } from '@/schemas/todo'
import { zodResolver } from 'mantine-form-zod-resolver'
import { SubTaskList } from './subtask-list'
import { useEffect } from 'react'

interface TodoDetailPanelProps {
  todo: Todo
}

/**
 * TODO詳細パネルコンポーネント
 *
 * 選択されたタスクの詳細を表示・編集します。
 * - タイトル編集
 * - 説明編集
 * - 期限日設定
 * - 重要度設定
 * - カテゴリ選択
 * - サブタスク管理
 * - リアルタイム保存
 */
export function TodoDetailPanel({ todo }: TodoDetailPanelProps) {
  const { updateTodo } = useTodoStore()
  const { categories } = useCategories()

  const form = useForm({
    initialValues: {
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
      isImportant: todo.isImportant,
      categoryId: todo.categoryId || '',
    },
    validate: zodResolver(todoSchema),
  })

  useEffect(() => {
    form.setValues({
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
      isImportant: todo.isImportant,
      categoryId: todo.categoryId || '',
    })
  }, [todo])

  const handleFieldChange = async (field: string, value: any) => {
    form.setFieldValue(field, value)

    // リアルタイム保存（デバウンス処理）
    const updateData = {
      ...form.values,
      [field]: value,
    }

    await updateTodo(todo.id, updateData)
  }

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }))

  return (
    <Stack gap="md" p="md">
      <Title order={3}>タスクの詳細</Title>

      <TextInput
        label="タイトル"
        placeholder="タスクのタイトルを入力..."
        value={form.values.title}
        onChange={(event) => handleFieldChange('title', event.target.value)}
        error={form.errors.title}
        required
      />

      <Textarea
        label="説明"
        placeholder="タスクの詳細を入力..."
        value={form.values.description}
        onChange={(event) => handleFieldChange('description', event.target.value)}
        minRows={3}
        autosize
      />

      <DatePickerInput
        label="期限日"
        placeholder="期限日を選択..."
        value={form.values.dueDate}
        onChange={(date) => handleFieldChange('dueDate', date)}
        leftSection={<IconCalendar size={16} />}
        clearable
      />

      <Switch
        label="重要"
        description="重要なタスクとしてマークする"
        checked={form.values.isImportant}
        onChange={(event) => handleFieldChange('isImportant', event.currentTarget.checked)}
        thumbIcon={<IconStar size={12} />}
      />

      <Select
        label="カテゴリ"
        placeholder="カテゴリを選択..."
        data={categoryOptions}
        value={form.values.categoryId}
        onChange={(value) => handleFieldChange('categoryId', value)}
        clearable
      />

      <Divider />

      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>サブタスク</Title>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={14} />}
          >
            追加
          </Button>
        </Group>
        <SubTaskList todoId={todo.id} />
      </Stack>
    </Stack>
  )
}
```

#### 2.6 TodoAddModal (src/components/todo/todo-add-modal.tsx)

```typescript
import {
  Modal,
  TextInput,
  Textarea,
  DatePickerInput,
  Switch,
  Select,
  Button,
  Group,
  Stack
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconCalendar, IconStar } from '@tabler/icons-react'
import { useTodoStore } from '@/stores/todo-store'
import { useCategories } from '@/hooks/use-categories'
import { todoSchema } from '@/schemas/todo'
import { zodResolver } from 'mantine-form-zod-resolver'

interface TodoAddModalProps {
  opened: boolean
  onClose: () => void
}

/**
 * TODOアイテム追加モーダルコンポーネント
 *
 * 新しいタスクを作成するためのモーダルダイアログです。
 * - フォームバリデーション
 * - カテゴリ選択
 * - 期限日設定
 * - 重要度設定
 */
export function TodoAddModal({ opened, onClose }: TodoAddModalProps) {
  const { createTodo } = useTodoStore()
  const { categories } = useCategories()

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      dueDate: undefined,
      isImportant: false,
      categoryId: '',
    },
    validate: zodResolver(todoSchema),
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await createTodo(values)
      form.reset()
      onClose()
    } catch (error) {
      console.error('タスク作成エラー:', error)
    }
  }

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="新しいタスクを追加"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="タイトル"
            placeholder="タスクのタイトルを入力..."
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="説明"
            placeholder="タスクの詳細を入力..."
            minRows={3}
            autosize
            {...form.getInputProps('description')}
          />

          <DatePickerInput
            label="期限日"
            placeholder="期限日を選択..."
            leftSection={<IconCalendar size={16} />}
            clearable
            {...form.getInputProps('dueDate')}
          />

          <Switch
            label="重要"
            description="重要なタスクとしてマークする"
            thumbIcon={<IconStar size={12} />}
            {...form.getInputProps('isImportant')}
          />

          <Select
            label="カテゴリ"
            placeholder="カテゴリを選択..."
            data={categoryOptions}
            clearable
            {...form.getInputProps('categoryId')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">
              作成
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
```

### 3. 状態管理（Zustand）

#### 3.1 TodoStore (src/stores/todo-store.ts)

```typescript
import { create } from 'zustand'
import { Todo } from '@/types/todo'
import { todoClient } from '@/lib/api/todo-client'

interface TodoStore {
  todos: Todo[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchTodos: (filter?: string) => Promise<void>
  createTodo: (data: Partial<Todo>) => Promise<void>
  updateTodo: (id: string, data: Partial<Todo>) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  clearError: () => void
}

/**
 * TODO状態管理ストア
 *
 * TODOの状態とアクションを管理します。
 * - タスクの CRUD 操作
 * - フィルタリング
 * - エラー処理
 * - ローディング状態
 */
export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,

  fetchTodos: async (filter = 'all') => {
    set({ isLoading: true, error: null })
    try {
      const response = await todoClient.getTodos({ filter })
      set({ todos: response.data.todos, isLoading: false })
    } catch (error) {
      set({ error: 'タスクの取得に失敗しました', isLoading: false })
    }
  },

  createTodo: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await todoClient.createTodo(data)
      const newTodo = response.data
      set((state) => ({
        todos: [newTodo, ...state.todos],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: 'タスクの作成に失敗しました', isLoading: false })
    }
  },

  updateTodo: async (id, data) => {
    try {
      const response = await todoClient.updateTodo(id, data)
      const updatedTodo = response.data
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, ...updatedTodo } : todo
        ),
      }))
    } catch (error) {
      set({ error: 'タスクの更新に失敗しました' })
    }
  },

  deleteTodo: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await todoClient.deleteTodo(id)
      set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: 'タスクの削除に失敗しました', isLoading: false })
    }
  },

  toggleTodo: async (id) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo) return

    try {
      await todoClient.toggleTodo(id)
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
        ),
      }))
    } catch (error) {
      set({ error: 'タスクの状態更新に失敗しました' })
    }
  },

  clearError: () => set({ error: null }),
}))
```

#### 3.2 UIStore (src/stores/ui-store.ts)

```typescript
import { create } from 'zustand'
import { Todo } from '@/types/todo'

interface UIStore {
  selectedFilter: string
  selectedTodo: Todo | null
  sidebarCollapsed: boolean

  // Actions
  setSelectedFilter: (filter: string) => void
  setSelectedTodo: (todo: Todo | null) => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

/**
 * UI状態管理ストア
 *
 * UIの状態を管理します。
 * - フィルタ選択状態
 * - 選択されたタスク
 * - サイドバー表示状態
 */
export const useUiStore = create<UIStore>((set) => ({
  selectedFilter: 'all',
  selectedTodo: null,
  sidebarCollapsed: false,

  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  setSelectedTodo: (todo) => set({ selectedTodo: todo }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
```

### 4. カスタムフック

#### 4.1 useTodos (src/hooks/use-todos.ts)

```typescript
import { useEffect } from 'react'
import { useTodoStore } from '@/stores/todo-store'

/**
 * TODOデータを管理するカスタムフック
 *
 * @param filter - フィルタ条件
 * @returns TODOデータとローディング状態
 */
export function useTodos(filter: string = 'all') {
  const { todos, isLoading, error, fetchTodos } = useTodoStore()

  useEffect(() => {
    fetchTodos(filter)
  }, [filter, fetchTodos])

  return {
    todos,
    isLoading,
    error,
    refetch: () => fetchTodos(filter),
  }
}
```

#### 4.2 useCategories (src/hooks/use-categories.ts)

```typescript
import { useState, useEffect } from 'react'
import { Category } from '@/types/category'
import { categoryClient } from '@/lib/api/category-client'

/**
 * カテゴリデータを管理するカスタムフック
 *
 * @returns カテゴリデータとローディング状態
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryClient.getCategories()
        setCategories(response.data)
      } catch (err) {
        setError('カテゴリの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return {
    categories,
    isLoading,
    error,
  }
}
```

### 5. 型定義

#### 5.1 Todo Types (src/types/todo.ts)

```typescript
export interface Todo {
  id: string
  title: string
  description?: string
  dueDate?: Date
  isImportant: boolean
  isCompleted: boolean
  order: number
  categoryId?: string
  userId: string
  createdAt: Date
  updatedAt: Date

  // Relations
  category?: Category
  subTasks?: SubTask[]
  reminders?: Reminder[]
}

export interface SubTask {
  id: string
  title: string
  isCompleted: boolean
  order: number
  todoId: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  color: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Reminder {
  id: string
  reminderAt: Date
  isTriggered: boolean
  todoId: string
  createdAt: Date
  updatedAt: Date
}
```

### 6. バリデーションスキーマ

#### 6.1 Todo Schema (src/schemas/todo.ts)

```typescript
import { z } from 'zod'

/**
 * TODOバリデーションスキーマ
 */
export const todoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  dueDate: z.date().optional(),
  isImportant: z.boolean().default(false),
  categoryId: z.string().uuid().optional(),
})

export type TodoFormData = z.infer<typeof todoSchema>
```

## レスポンシブデザイン

### ブレークポイント戦略

```typescript
// src/styles/breakpoints.ts
export const breakpoints = {
  xs: '36em',    // 576px
  sm: '48em',    // 768px
  md: '62em',    // 992px
  lg: '75em',    // 1200px
  xl: '88em',    // 1408px
}

// レスポンシブ対応例
export function ResponsiveLayout() {
  const { matches, breakpoint } = useViewportSize()

  if (breakpoint === 'xs') {
    return <MobileLayout />
  }

  if (breakpoint === 'sm') {
    return <TabletLayout />
  }

  return <DesktopLayout />
}
```

## パフォーマンス最適化

### 1. メモ化

```typescript
// React.memo でコンポーネントメモ化
export const TodoItem = React.memo(({ todo }: TodoItemProps) => {
  // コンポーネント実装
})

// useMemo でデータメモ化
const sortedTodos = useMemo(() => {
  return todos.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}, [todos])

// useCallback で関数メモ化
const handleDelete = useCallback(
  (id: string) => {
    deleteTodo(id)
  },
  [deleteTodo]
)
```

### 2. 仮想化

```typescript
// 大量のタスクを効率的に表示
import { FixedSizeList as List } from 'react-window'

export function VirtualizedTodoList({ todos }: VirtualizedTodoListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TodoItem todo={todos[index]} />
    </div>
  )

  return (
    <List
      height={400}
      itemCount={todos.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### 3. 遅延読み込み

```typescript
// コンポーネントの遅延読み込み
const TodoDetailPanel = lazy(() => import('./todo-detail-panel'))

export function TodoLayout() {
  return (
    <Suspense fallback={<Skeleton height={400} />}>
      <TodoDetailPanel />
    </Suspense>
  )
}
```

## テスト戦略

### 1. コンポーネントテスト

```typescript
// src/components/todo/todo-item.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoItem } from './todo-item'

describe('TodoItem', () => {
  const mockTodo = {
    id: '1',
    title: 'テストタスク',
    isCompleted: false,
    isImportant: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user1',
    order: 0,
  }

  it('renders todo item correctly', () => {
    render(<TodoItem todo={mockTodo} />)

    expect(screen.getByText('テストタスク')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('toggles completion when checkbox is clicked', () => {
    const mockToggle = vi.fn()
    render(<TodoItem todo={mockTodo} onToggle={mockToggle} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(mockToggle).toHaveBeenCalledWith(mockTodo.id)
  })
})
```

### 2. フックテスト

```typescript
// src/hooks/use-todos.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useTodos } from './use-todos'

describe('useTodos', () => {
  it('fetches todos on mount', async () => {
    const { result } = renderHook(() => useTodos())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.todos).toHaveLength(0)
  })
})
```

## エラーハンドリング

### 1. エラーバウンダリ

```typescript
// src/components/error-boundary.tsx
import React, { Component, ReactNode } from 'react'
import { Alert, Button, Stack, Text } from '@mantine/core'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack align="center" justify="center" h="100vh">
          <Alert color="red" title="エラーが発生しました">
            <Text>申し訳ありませんが、予期しないエラーが発生しました。</Text>
            <Button
              mt="md"
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </Button>
          </Alert>
        </Stack>
      )
    }

    return this.props.children
  }
}
```

### 2. 通知システム

```typescript
// src/hooks/use-notifications.ts
import { notifications } from '@mantine/notifications'

export function useNotifications() {
  const showSuccess = (message: string) => {
    notifications.show({
      title: '成功',
      message,
      color: 'green',
    })
  }

  const showError = (message: string) => {
    notifications.show({
      title: 'エラー',
      message,
      color: 'red',
    })
  }

  const showInfo = (message: string) => {
    notifications.show({
      title: '情報',
      message,
      color: 'blue',
    })
  }

  return {
    showSuccess,
    showError,
    showInfo,
  }
}
```

## アクセシビリティ

### 1. ARIA ラベル

```typescript
// アクセシビリティ対応の例
export function TodoItem({ todo }: TodoItemProps) {
  return (
    <Card
      role="article"
      aria-label={`タスク: ${todo.title}`}
      tabIndex={0}
    >
      <Checkbox
        aria-label={`タスク「${todo.title}」を${todo.isCompleted ? '未完了' : '完了'}にする`}
        checked={todo.isCompleted}
        onChange={handleToggle}
      />
      <Text aria-live="polite">
        {todo.title}
      </Text>
    </Card>
  )
}
```

### 2. キーボードナビゲーション

```typescript
// キーボード操作対応
export function TodoList({ todos }: TodoListProps) {
  const handleKeyDown = (event: React.KeyboardEvent, todo: Todo) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        setSelectedTodo(todo)
        break
      case 'Delete':
        event.preventDefault()
        deleteTodo(todo.id)
        break
    }
  }

  return (
    <Stack>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onKeyDown={(e) => handleKeyDown(e, todo)}
        />
      ))}
    </Stack>
  )
}
```

## 国際化対応

### 1. 多言語対応

```typescript
// src/i18n/messages.ts
export const messages = {
  ja: {
    todo: {
      title: 'タスク',
      add: 'タスクを追加',
      complete: '完了',
      delete: '削除',
      edit: '編集',
    },
  },
  en: {
    todo: {
      title: 'Task',
      add: 'Add Task',
      complete: 'Complete',
      delete: 'Delete',
      edit: 'Edit',
    },
  },
}
```

## 今後の拡張計画

### 1. Progressive Web App (PWA)

```typescript
// src/components/install-prompt.tsx
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
  }

  return deferredPrompt ? (
    <Button onClick={handleInstall}>
      アプリをインストール
    </Button>
  ) : null
}
```

### 2. オフライン対応

```typescript
// src/hooks/use-offline.ts
export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOffline
}
```

## 参考資料

- [Mantine ドキュメント](https://mantine.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zustand ドキュメント](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript ベストプラクティス](https://typescript-lang.org/docs/)
