/**
 * メインページ
 * @fileoverview TODOアプリのメインページ
 */
export default function HomePage() {
  return (
    <main
      aria-label="TODOアプリメインコンテンツ"
      className="container mx-auto p-4"
    >
      <h1>TODOアプリ</h1>

      {/* フィルターコントロールセクション */}
      <section data-testid="task-controls-section">
        {/* 将来的にTaskControlsコンポーネントが入る */}
      </section>

      {/* タスク作成フォームセクション */}
      <section data-testid="task-form-section">
        {/* 将来的にTaskFormコンポーネントが入る */}
      </section>

      {/* タスクリストセクション */}
      <section data-testid="task-list-section">
        {/* 将来的にTaskListコンポーネントが入る */}
      </section>
    </main>
  )
}
