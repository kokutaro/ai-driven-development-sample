import { Container, Title, Text, Button, Stack } from '@mantine/core'
import Link from 'next/link'

/**
 * ホームページコンポーネント
 *
 * @returns ホームページのJSX要素
 */
export default function HomePage() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xl">
        <Title order={1} ta="center">
          TODOアプリ
        </Title>

        <Text size="lg" ta="center" c="dimmed">
          シンプルなTODO管理アプリケーションです
        </Text>

        <Button component={Link} href="/todos" size="lg">
          TODO一覧を見る
        </Button>
      </Stack>
    </Container>
  )
}
