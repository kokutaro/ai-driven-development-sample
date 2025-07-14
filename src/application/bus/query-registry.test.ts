import { beforeEach, describe, expect, it } from 'vitest'

import { QueryRegistryImpl } from './query-registry'

import type { Query, QueryHandler } from '../queries/query.interface'

class AnotherTestQuery implements Query {
  readonly timestamp: Date = new Date()

  constructor(public readonly id: string) {}
}

class AnotherTestQueryHandler
  implements QueryHandler<AnotherTestQuery, object>
{
  async handle(query: AnotherTestQuery): Promise<object> {
    return { id: query.id }
  }
}

// Test Query Classes
class TestQuery implements Query {
  readonly timestamp: Date = new Date()

  constructor(public readonly filter: string) {}
}

// Test Query Handler Classes
class TestQueryHandler implements QueryHandler<TestQuery, string[]> {
  async handle(query: TestQuery): Promise<string[]> {
    return [`Result for: ${query.filter}`]
  }
}

describe('QueryRegistry', () => {
  let registry: QueryRegistryImpl

  beforeEach(() => {
    registry = new QueryRegistryImpl()
  })

  describe('registerHandler', () => {
    it('ハンドラーを正常に登録する', () => {
      // Arrange
      const handler = new TestQueryHandler()

      // Act
      registry.registerHandler(TestQuery, handler)

      // Assert
      expect(registry.getHandler(TestQuery)).toBe(handler)
    })

    it('複数の異なるクエリタイプにハンドラーを登録する', () => {
      // Arrange
      const handler1 = new TestQueryHandler()
      const handler2 = new AnotherTestQueryHandler()

      // Act
      registry.registerHandler(TestQuery, handler1)
      registry.registerHandler(AnotherTestQuery, handler2)

      // Assert
      expect(registry.getHandler(TestQuery)).toBe(handler1)
      expect(registry.getHandler(AnotherTestQuery)).toBe(handler2)
    })

    it('同じクエリタイプに複数回登録すると最後のハンドラーで上書きする', () => {
      // Arrange
      const handler1 = new TestQueryHandler()
      const handler2 = new TestQueryHandler()

      // Act
      registry.registerHandler(TestQuery, handler1)
      registry.registerHandler(TestQuery, handler2)

      // Assert
      expect(registry.getHandler(TestQuery)).toBe(handler2)
      expect(registry.getHandler(TestQuery)).not.toBe(handler1)
    })
  })

  describe('getHandler', () => {
    it('登録されたハンドラーを正常に取得する', () => {
      // Arrange
      const handler = new TestQueryHandler()
      registry.registerHandler(TestQuery, handler)

      // Act
      const retrievedHandler = registry.getHandler(TestQuery)

      // Assert
      expect(retrievedHandler).toBe(handler)
    })

    it('未登録のクエリタイプでundefinedを返す', () => {
      // Act
      const retrievedHandler = registry.getHandler(TestQuery)

      // Assert
      expect(retrievedHandler).toBeUndefined()
    })
  })

  describe('getAllHandlers', () => {
    it('空のレジストリで空のMapを返す', () => {
      // Act
      const allHandlers = registry.getAllHandlers()

      // Assert
      expect(allHandlers).toBeInstanceOf(Map)
      expect(allHandlers.size).toBe(0)
    })

    it('登録されたすべてのハンドラーを返す', () => {
      // Arrange
      const handler1 = new TestQueryHandler()
      const handler2 = new AnotherTestQueryHandler()
      registry.registerHandler(TestQuery, handler1)
      registry.registerHandler(AnotherTestQuery, handler2)

      // Act
      const allHandlers = registry.getAllHandlers()

      // Assert
      expect(allHandlers.size).toBe(2)
      expect(allHandlers.get(TestQuery)).toBe(handler1)
      expect(allHandlers.get(AnotherTestQuery)).toBe(handler2)
    })

    it('返されたMapの変更が元のレジストリに影響しない', () => {
      // Arrange
      const handler = new TestQueryHandler()
      registry.registerHandler(TestQuery, handler)

      // Act
      const allHandlers = registry.getAllHandlers()
      allHandlers.clear()

      // Assert
      expect(registry.getHandler(TestQuery)).toBe(handler)
    })
  })
})
