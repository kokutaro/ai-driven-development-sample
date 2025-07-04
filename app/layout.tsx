import { ColorSchemeScript, MantineProvider } from '@mantine/core'
import type { Metadata } from 'next'
import '@mantine/core/styles.css'

export const metadata: Metadata = {
  title: 'TODO App',
  description: 'Simple TODO application',
}

/**
 * ルートレイアウトコンポーネント
 *
 * @param children - 子コンポーネント
 * @returns レイアウトJSX要素
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
