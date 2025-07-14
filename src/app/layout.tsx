import type { ReactNode } from 'react'

import { ColorSchemeScript, MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { ModalsProvider } from '@mantine/modals'

import type { Metadata } from 'next'

import { ApolloProviderWrapper } from '@/components/providers/apollo-provider'
import { AppProvider } from '@/components/providers/app-provider'
import { SessionProvider } from '@/components/providers/session-provider'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './globals.css'

export const metadata: Metadata = {
  description: '3カラムレイアウトで使いやすいTODO管理アプリケーション',
  title: 'To Do - タスク管理',
}

/**
 * ルートレイアウト
 *
 * アプリケーション全体のHTMLとプロバイダーを設定します。
 * - Mantineプロバイダーの設定
 * - カラースキームの設定
 * - グローバルスタイルの適用
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <ModalsProvider
            labels={{
              cancel: 'キャンセル',
              confirm: '削除',
            }}
          >
            <DatesProvider settings={{ firstDayOfWeek: 0, locale: 'ja' }}>
              <SessionProvider>
                <ApolloProviderWrapper>
                  <AppProvider>{children}</AppProvider>
                </ApolloProviderWrapper>
              </SessionProvider>
            </DatesProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
