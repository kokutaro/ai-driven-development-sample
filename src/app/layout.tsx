import React from 'react'

import { ColorSchemeScript, MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './globals.css'

export const metadata = {
  description: 'Microsoft To Do風のタスク管理アプリケーション',
  title: 'To Do',
}

/**
 * ルートレイアウトコンポーネント
 * @param children - 子コンポーネント
 * @returns ルートレイアウト
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
        <MantineProvider
          theme={{
            defaultRadius: 'md',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            primaryColor: 'blue',
          }}
        >
          {children}
        </MantineProvider>
      </body>
    </html>
  )
}
