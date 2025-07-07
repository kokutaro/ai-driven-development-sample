/**
 * タスクスキーマのテスト
 * @fileoverview Zodタスクスキーマのユニットテスト
 */
import { describe, expect, it } from 'vitest'

import {
  categorySchema,
  createTaskInputSchema,
  subtaskSchema,
  taskFilterSchema,
  taskSchema,
  taskSortOrderSchema,
  updateTaskInputSchema,
} from './task.schema'

describe('taskSchema', () => {
  // 正常なタスクオブジェクトのテスト
  it('validates a valid task object', () => {
    const validTask = {
      categoryId: '550e8400-e29b-41d4-a716-446655440002',
      completed: false,
      createdAt: new Date(),
      description: 'Test description',
      dueDate: new Date(),
      id: '550e8400-e29b-41d4-a716-446655440000',
      important: true,
      reminderDate: new Date(),
      repeatPattern: 'daily',
      subtasks: [],
      title: 'Test Task',
      updatedAt: new Date(),
      userId: '550e8400-e29b-41d4-a716-446655440001',
    }

    const result = taskSchema.safeParse(validTask)
    expect(result.success).toBe(true)
  })

  // 必須フィールドのテスト
  it('requires id, title, completed, important, userId, createdAt, updatedAt', () => {
    const invalidTask = {
      description: 'Test description',
    }

    const result = taskSchema.safeParse(invalidTask)
    expect(result.success).toBe(false)
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0])
      expect(missingFields).toContain('id')
      expect(missingFields).toContain('title')
      expect(missingFields).toContain('completed')
      expect(missingFields).toContain('important')
      expect(missingFields).toContain('userId')
      expect(missingFields).toContain('createdAt')
      expect(missingFields).toContain('updatedAt')
    }
  })

  // タイトルの文字数制限テスト
  it('validates title length constraints', () => {
    const longTitle = 'a'.repeat(201) // 200文字超過
    const invalidTask = {
      completed: false,
      createdAt: new Date(),
      id: 'task-123',
      important: false,
      subtasks: [],
      title: longTitle,
      updatedAt: new Date(),
      userId: 'user-123',
    }

    const result = taskSchema.safeParse(invalidTask)
    expect(result.success).toBe(false)
  })

  // 空文字列タイトルのテスト
  it('rejects empty title', () => {
    const invalidTask = {
      completed: false,
      createdAt: new Date(),
      id: 'task-123',
      important: false,
      subtasks: [],
      title: '',
      updatedAt: new Date(),
      userId: 'user-123',
    }

    const result = taskSchema.safeParse(invalidTask)
    expect(result.success).toBe(false)
  })

  // 説明の文字数制限テスト
  it('validates description length constraints', () => {
    const longDescription = 'a'.repeat(1001) // 1000文字超過
    const invalidTask = {
      completed: false,
      createdAt: new Date(),
      description: longDescription,
      id: 'task-123',
      important: false,
      subtasks: [],
      title: 'Test Task',
      updatedAt: new Date(),
      userId: 'user-123',
    }

    const result = taskSchema.safeParse(invalidTask)
    expect(result.success).toBe(false)
  })

  // UUIDバリデーションテスト
  it('validates UUID format for id and userId', () => {
    const invalidTask = {
      completed: false,
      createdAt: new Date(),
      id: 'invalid-id',
      important: false,
      subtasks: [],
      title: 'Test Task',
      updatedAt: new Date(),
      userId: 'invalid-user-id',
    }

    const result = taskSchema.safeParse(invalidTask)
    expect(result.success).toBe(false)
  })
})

describe('categorySchema', () => {
  // 正常なカテゴリオブジェクトのテスト
  it('validates a valid category object', () => {
    const validCategory = {
      color: '#ff0000',
      createdAt: new Date(),
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Work',
      updatedAt: new Date(),
    }

    const result = categorySchema.safeParse(validCategory)
    expect(result.success).toBe(true)
  })

  // カラーコードのバリデーションテスト
  it('validates color hex format', () => {
    const invalidCategory = {
      color: 'invalid-color',
      createdAt: new Date(),
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Work',
      updatedAt: new Date(),
    }

    const result = categorySchema.safeParse(invalidCategory)
    expect(result.success).toBe(false)
  })

  // カテゴリ名の文字数制限テスト
  it('validates category name length constraints', () => {
    const longName = 'a'.repeat(51) // 50文字超過
    const invalidCategory = {
      color: '#ff0000',
      createdAt: new Date(),
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: longName,
      updatedAt: new Date(),
    }

    const result = categorySchema.safeParse(invalidCategory)
    expect(result.success).toBe(false)
  })
})

describe('subtaskSchema', () => {
  // 正常なサブタスクオブジェクトのテスト
  it('validates a valid subtask object', () => {
    const validSubtask = {
      completed: false,
      createdAt: new Date(),
      id: '550e8400-e29b-41d4-a716-446655440000',
      order: 1,
      taskId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Subtask title',
      updatedAt: new Date(),
    }

    const result = subtaskSchema.safeParse(validSubtask)
    expect(result.success).toBe(true)
  })

  // 順序番号のバリデーションテスト
  it('validates order number constraints', () => {
    const invalidSubtask = {
      completed: false,
      createdAt: new Date(),
      id: '550e8400-e29b-41d4-a716-446655440000',
      order: -1, // 負の数は無効
      taskId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Subtask title',
      updatedAt: new Date(),
    }

    const result = subtaskSchema.safeParse(invalidSubtask)
    expect(result.success).toBe(false)
  })
})

describe('createTaskInputSchema', () => {
  // 最小限の有効な入力のテスト
  it('validates minimal valid input', () => {
    const validInput = {
      title: 'New Task',
    }

    const result = createTaskInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // 完全な有効な入力のテスト
  it('validates complete valid input', () => {
    const validInput = {
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Task description',
      dueDate: new Date(),
      important: true,
      reminderDate: new Date(),
      repeatPattern: 'weekly',
      title: 'New Task',
    }

    const result = createTaskInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // 必須フィールド（title）のテスト
  it('requires title field', () => {
    const invalidInput = {
      description: 'Task description',
    }

    const result = createTaskInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})

describe('updateTaskInputSchema', () => {
  // 一部フィールドの更新テスト
  it('validates partial update', () => {
    const validInput = {
      completed: true,
      title: 'Updated Task',
    }

    const result = updateTaskInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // 空のオブジェクトのテスト
  it('validates empty update object', () => {
    const validInput = {}

    const result = updateTaskInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // null値の許可テスト
  it('allows undefined values for optional fields', () => {
    const validInput = {
      categoryId: undefined,
      dueDate: undefined,
      reminderDate: undefined,
      repeatPattern: undefined,
    }

    const result = updateTaskInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('taskFilterSchema', () => {
  // 有効なフィルター値のテスト
  it('validates valid filter values', () => {
    const validFilters = [
      'all',
      'today',
      'important',
      'planned',
      'assigned-to-me',
      'flagged-email',
      'completed',
    ]

    for (const filter of validFilters) {
      const result = taskFilterSchema.safeParse(filter)
      expect(result.success).toBe(true)
    }
  })

  // 無効なフィルター値のテスト
  it('rejects invalid filter values', () => {
    const invalidFilter = 'invalid-filter'

    const result = taskFilterSchema.safeParse(invalidFilter)
    expect(result.success).toBe(false)
  })
})

describe('taskSortOrderSchema', () => {
  // 有効なソート順のテスト
  it('validates valid sort order values', () => {
    const validSortOrders = [
      'createdAt',
      'dueDate',
      'importance',
      'alphabetical',
    ]

    for (const sortOrder of validSortOrders) {
      const result = taskSortOrderSchema.safeParse(sortOrder)
      expect(result.success).toBe(true)
    }
  })

  // 無効なソート順のテスト
  it('rejects invalid sort order values', () => {
    const invalidSortOrder = 'invalid-sort'

    const result = taskSortOrderSchema.safeParse(invalidSortOrder)
    expect(result.success).toBe(false)
  })
})
