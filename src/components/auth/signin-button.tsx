'use client'

import { Button } from '@mantine/core'
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandOffice,
} from '@tabler/icons-react'
import { signIn } from 'next-auth/react'

interface SignInButtonProps {
  provider: 'github' | 'google' | 'microsoft-entra-id'
  size?: 'lg' | 'md' | 'sm' | 'xl' | 'xs'
  variant?: 'default' | 'filled' | 'light' | 'outline'
}

/**
 * サインインボタンコンポーネント
 *
 * 指定されたOAuthプロバイダーでサインインを実行します。
 * - Google OAuth
 * - GitHub OAuth
 * - Microsoft OAuth
 */
export function SignInButton({
  provider,
  size = 'md',
  variant = 'filled',
}: SignInButtonProps) {
  const handleSignIn = () => {
    void signIn(provider, { callbackUrl: '/' })
  }

  const getProviderConfig = () => {
    switch (provider) {
      case 'github': {
        return {
          color: '#333',
          icon: IconBrandGithub,
          label: 'GitHubでサインイン',
        }
      }
      case 'google': {
        return {
          color: '#4285F4',
          icon: IconBrandGoogle,
          label: 'Googleでサインイン',
        }
      }
      case 'microsoft-entra-id': {
        return {
          color: '#0078D4',
          icon: IconBrandOffice,
          label: 'Microsoftでサインイン',
        }
      }
      default: {
        return {
          color: 'blue',
          icon: IconBrandGoogle,
          label: 'サインイン',
        }
      }
    }
  }

  const config = getProviderConfig()
  const IconComponent = config.icon

  return (
    <Button
      leftSection={<IconComponent size={18} />}
      onClick={handleSignIn}
      size={size}
      style={{
        backgroundColor: variant === 'filled' ? config.color : undefined,
        borderColor: variant === 'outline' ? config.color : undefined,
        color: variant === 'outline' ? config.color : undefined,
      }}
      variant={variant}
    >
      {config.label}
    </Button>
  )
}
