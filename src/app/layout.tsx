import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'シンプルなTodoアプリケーション',
}

interface RootLayoutProps {
  children: React.ReactNode
}

/**
 * ルートレイアウトコンポーネント
 *
 * @description アプリケーション全体の基本レイアウトとプロバイダーの設定
 * - Mantineプロバイダーの設定
 * - 通知システムの設定
 * - フォントの設定
 *
 * @param {RootLayoutProps} props - レイアウトのプロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <MantineProvider>
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  )
}
