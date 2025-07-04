import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sample App',
  description: 'A sample Next.js application with CI/CD pipeline',
}

/**
 * Root layout component for the application
 *
 * @param children - Child components to render
 * @returns Root layout JSX
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
