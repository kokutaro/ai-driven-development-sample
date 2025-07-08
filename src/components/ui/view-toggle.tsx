import { SegmentedControl } from '@mantine/core'

import { useUiStore, type ViewMode } from '@/stores/ui-store'

/**
 * ビュー切り替えコンポーネント
 *
 * リストビューとKanbanビューを切り替えるセグメント化されたコントロールです。
 * - リストビューとKanbanビューの切り替え
 * - 現在のビューモードの表示
 * - UIStoreとの連携
 */
export function ViewToggle() {
  const { setViewMode, viewMode } = useUiStore()

  const handleViewChange = (value: string) => {
    setViewMode(value as ViewMode)
  }

  return (
    <SegmentedControl
      data={[
        {
          label: 'リスト',
          value: 'list',
        },
        {
          label: 'Kanban',
          value: 'kanban',
        },
      ]}
      onChange={handleViewChange}
      size="sm"
      value={viewMode}
    />
  )
}
