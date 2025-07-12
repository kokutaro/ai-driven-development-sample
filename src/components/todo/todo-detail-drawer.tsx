'use client'

import { ActionIcon, Drawer, Group, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'

import { TodoDetailPanel } from './todo-detail-panel'

import type { Todo } from '@/types/todo'

interface TodoDetailDrawerProps {
  /** ドロワーを閉じる関数 */
  onClose: () => void
  /** ドロワーが開いているかどうか */
  opened: boolean
  /** 表示するTODOオブジェクト */
  todo: Todo | undefined
}

/**
 * TODO詳細ドロワーコンポーネント
 *
 * レスポンシブ対応のTODO詳細表示・編集画面です。
 * - デスクトップ: 右側からスライドイン
 * - モバイル/タブレット: フルスクリーンまたは下からスライドイン
 *
 * @param todo - 表示するTODOオブジェクト
 * @param opened - ドロワーの開閉状態
 * @param onClose - ドロワーを閉じる関数
 */
export function TodoDetailDrawer({
  onClose,
  opened,
  todo,
}: TodoDetailDrawerProps) {
  // モバイルサイズの判定 (768px未満をモバイルとして扱う)
  const isMobile = useMediaQuery('(max-width: 48em)')

  // TODOが存在しない場合は何も表示しない
  if (!todo) {
    return undefined
  }

  return (
    <Drawer
      onClose={onClose}
      opened={opened}
      overlayProps={{
        backgroundOpacity: 0.5,
        blur: 2,
      }}
      position={isMobile ? 'bottom' : 'right'}
      size={isMobile ? '90%' : 400}
      styles={{
        body: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: 0,
        },
        content: {
          height: isMobile ? 'auto' : '100vh',
          maxHeight: isMobile ? '90vh' : 'none',
        },
      }}
      title={
        <Group justify="space-between" w="100%">
          <Text fw={600} size="lg">
            タスクの詳細
          </Text>
          <ActionIcon
            aria-label="ドロワーを閉じる"
            color="gray"
            onClick={onClose}
            variant="subtle"
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      }
      transitionProps={{
        duration: 200,
        timingFunction: 'ease',
        transition: 'slide-left',
      }}
      withCloseButton={false}
    >
      <TodoDetailPanel todo={todo} />
    </Drawer>
  )
}
