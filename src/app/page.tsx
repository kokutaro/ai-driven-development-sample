/**
 * メインページ
 * @fileoverview TODOアプリのメインページ
 */
'use client'

import { TaskControls } from '@/components/features/task-controls'
import { TaskList } from '@/components/features/task-list'
import { TaskForm } from '@/components/forms/task-form'

/**
 * メインページコンポーネント
 * @returns TODOアプリのメインページ
 */
export default function HomePage() {
  return (
    <main
      aria-label="TODOアプリメインコンテンツ"
      className="container mx-auto p-4"
    >
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        TODOアプリ
      </h1>

      {/* フィルターコントロールセクション */}
      <section className="mb-6" data-testid="task-controls-section">
        <TaskControls />
      </section>

      {/* タスク作成フォームセクション */}
      <section className="mb-6" data-testid="task-form-section">
        <TaskForm />
      </section>

      {/* タスクリストセクション */}
      <section data-testid="task-list-section">
        <TaskList />
      </section>
    </main>
  )
}
