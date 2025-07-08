'use client'

import { Button, type ButtonProps } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { signOut } from 'next-auth/react'

interface SignOutButtonProps extends Omit<ButtonProps, 'onClick'> {
  callbackUrl?: string
}

/**
 * サインアウトボタンコンポーネント
 *
 * NextAuth.jsのサインアウト機能を実行します。
 * ログアウト後のリダイレクト先を指定できます。
 */
export function SignOutButton({
  callbackUrl = '/auth/signin',
  children = 'サインアウト',
  ...props
}: SignOutButtonProps) {
  const handleSignOut = () => {
    void signOut({ callbackUrl })
  }

  return (
    <Button
      color="red"
      leftSection={<IconLogout size={16} />}
      onClick={handleSignOut}
      variant="light"
      {...props}
    >
      {children}
    </Button>
  )
}
