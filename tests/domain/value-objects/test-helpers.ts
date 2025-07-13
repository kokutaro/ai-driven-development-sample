/**
 * ドメインレイヤーテスト用ヘルパー関数とユーティリティ
 */

/**
 * テスト用日付生成ヘルパー
 */
export const createTestDate = (offsetDays = 0): Date => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date
}

/**
 * テスト用ID生成ヘルパー
 */
export const createTestId = (prefix = 'test'): string => {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * バリデーションエラーのテストヘルパー
 */
export const expectValidationError = (
  fn: () => void,
  expectedMessage: string
): void => {
  expect(fn).toThrow(expectedMessage)
}

/**
 * ドメインイベントのテストヘルパー
 */
export const createDomainEventMatcher = (eventType: string) => ({
  aggregateId: expect.any(String),
  eventType: expect.stringContaining(eventType),
  timestamp: expect.any(Date),
})

/**
 * テスト用のランダムな文字列生成
 */
export const generateRandomString = (length = 10): string => {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
}

/**
 * テスト用のメールアドレス生成
 */
export const generateTestEmail = (): string => {
  return `test_${generateRandomString(8)}@example.com`
}

/**
 * テスト用のUUID生成（簡易版）
 */
export const generateTestUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * アサーションヘルパー
 */
export const assertNotNull = <T>(
  value: null | T | undefined
): asserts value is T => {
  expect(value).not.toBeNull()
  expect(value).not.toBeUndefined()
}

/**
 * 型安全なプロパティ検証ヘルパー
 */
export const assertHasProperty = <T, K extends keyof T>(
  obj: T,
  key: K
): asserts obj is Required<Pick<T, K>> & T => {
  expect(obj).toHaveProperty(key as never)
  // eslint-disable-next-line security/detect-object-injection
  expect(obj[key]).toBeDefined()
}
