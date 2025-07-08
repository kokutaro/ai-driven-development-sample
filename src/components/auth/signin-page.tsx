'use client'

import { Center, Container, Paper, Stack, Text, Title } from '@mantine/core'

import { SignInButton } from './signin-button'

/**
 * サインインページコンポーネント
 *
 * 複数のOAuthプロバイダーによるサインインオプションを表示します。
 * - Google OAuth
 * - GitHub OAuth
 * - Microsoft OAuth
 */
export function SignInPage() {
  return (
    <Container h="100vh" size="xs">
      <Center h="100%">
        <Paper p="xl" radius="md" w="100%" withBorder>
          <Stack gap="lg">
            <Stack gap="xs" ta="center">
              <Title order={2}>To Do</Title>
              <Text c="dimmed" size="sm">
                アカウントでサインインしてタスク管理を始めましょう
              </Text>
            </Stack>

            <Stack gap="md">
              <SignInButton provider="google" size="lg" />
              <SignInButton provider="github" size="lg" />
              <SignInButton provider="microsoft-entra-id" size="lg" />
            </Stack>

            <Text c="dimmed" size="xs" ta="center">
              サインインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
            </Text>
          </Stack>
        </Paper>
      </Center>
    </Container>
  )
}
