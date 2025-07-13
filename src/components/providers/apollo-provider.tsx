/**
 * Apollo Provider コンポーネント
 *
 * Apollo ClientをReactアプリケーションに統合します。
 * 既存のプロバイダーチェーンに組み込み可能な設計です。
 */
'use client'

import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { ApolloProvider } from '@apollo/client'

import { getApolloClient } from '@/lib/apollo/apollo-client'

interface ApolloProviderWrapperProps {
  children: ReactNode
}

/**
 * Apollo Provider ラッパーコンポーネント
 *
 * Apollo Clientを提供し、GraphQLクエリを可能にします。
 * 既存のプロバイダーと併用できるよう設計されています。
 *
 * @param children - 子コンポーネント
 */
export function ApolloProviderWrapper({
  children,
}: ApolloProviderWrapperProps) {
  // Apollo Clientインスタンスをメモ化
  const apolloClient = useMemo(() => {
    return getApolloClient()
  }, [])

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
}

/**
 * Apollo Client設定のコンテキスト用フック
 *
 * 現在のApollo Client設定を取得します。
 * デバッグや設定確認に使用できます。
 */
export function useApolloClientConfig() {
  const client = getApolloClient()

  return {
    cache: client.cache,
    client,
    link: client.link,
    version: client.version,
  }
}
