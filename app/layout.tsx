import '@mantine/core/styles.css'
import { ColorSchemeScript, MantineProvider } from '@mantine/core'

import type { Metadata } from 'next'

/**
 * アプリケーションのメタデータ
 */
export const metadata: Metadata = {
  description: 'Todo application built with Next.js and Mantine',
  title: 'Think Harder TODO App',
}

/**
 * ルートレイアウトコンポーネント
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  )
}
