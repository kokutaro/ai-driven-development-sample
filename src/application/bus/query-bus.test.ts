import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryBusImpl } from './query-bus'
import { QueryRegistryImpl } from './query-registry'

import type { Query, QueryHandler } from '../queries/query.interface'

class AnotherTestQuery implements Query {
  readonly timestamp: Date = new Date()

  constructor(public readonly id: string) {}
}

class AnotherTestQueryHandler
  implements QueryHandler<AnotherTestQuery, { id: string; name: string }>
{
  async handle(query: AnotherTestQuery): Promise<{ id: string; name: string }> {
    return { id: query.id, name: `Name for ${query.id}` }
  }
}

// Failing Query Handler
class FailingQueryHandler implements QueryHandler<TestQuery, string[]> {
  async handle(_query: TestQuery): Promise<string[]> {
    throw new Error('Query handler failed')
  }
}

// Test Query
class TestQuery implements Query {
  readonly timestamp: Date = new Date()

  constructor(public readonly filter: string) {}
}

// Test Query Handler
class TestQueryHandler implements QueryHandler<TestQuery, string[]> {
  async handle(query: TestQuery): Promise<string[]> {
    return [`Result for: ${query.filter}`]
  }
}

describe('QueryBus', () => {
  let queryBus: QueryBusImpl
  let queryRegistry: QueryRegistryImpl

  beforeEach(() => {
    queryRegistry = new QueryRegistryImpl()
    queryBus = new QueryBusImpl(queryRegistry)
  })

  describe('execute', () => {
    it('登録されたハンドラーでクエリを正常に実行する', async () => {
      // Arrange
      const handler = new TestQueryHandler()
      queryBus.register(TestQuery, handler)
      const query = new TestQuery('active')

      // Act
      const result = await queryBus.execute<TestQuery, string[]>(query)

      // Assert
      expect(result).toEqual(['Result for: active'])
    })

    it('複数のクエリタイプを正常に処理する', async () => {
      // Arrange
      const handler1 = new TestQueryHandler()
      const handler2 = new AnotherTestQueryHandler()
      queryBus.register(TestQuery, handler1)
      queryBus.register(AnotherTestQuery, handler2)

      const query1 = new TestQuery('completed')
      const query2 = new AnotherTestQuery('123')

      // Act
      const result1 = await queryBus.execute<TestQuery, string[]>(query1)
      const result2 = await queryBus.execute<
        AnotherTestQuery,
        { id: string; name: string }
      >(query2)

      // Assert
      expect(result1).toEqual(['Result for: completed'])
      expect(result2).toEqual({ id: '123', name: 'Name for 123' })
    })

    it('未登録のクエリタイプでエラーを投げる', async () => {
      // Arrange
      const query = new TestQuery('unregistered')

      // Act & Assert
      await expect(queryBus.execute(query)).rejects.toThrow(
        'No handler registered for query: TestQuery'
      )
    })

    it('ハンドラーエラーを適切に伝播する', async () => {
      // Arrange
      const handler = new FailingQueryHandler()
      queryBus.register(TestQuery, handler)
      const query = new TestQuery('failing')

      // Act & Assert
      await expect(queryBus.execute(query)).rejects.toThrow(
        'Query handler failed'
      )
    })

    it('同じクエリタイプに複数回登録すると最後のハンドラーを使用する', async () => {
      // Arrange
      const handler1 = new TestQueryHandler()
      const mockHandler: QueryHandler<TestQuery, string[]> = {
        handle: vi
          .fn()
          .mockImplementation(async (query: TestQuery) => [
            `Override result for: ${query.filter}`,
          ]),
      }

      queryBus.register(TestQuery, handler1)
      queryBus.register(TestQuery, mockHandler)

      const query = new TestQuery('test')

      // Act
      const result = await queryBus.execute<TestQuery, string[]>(query)

      // Assert
      expect(result).toEqual(['Override result for: test'])
      expect(mockHandler.handle).toHaveBeenCalledWith(query)
    })

    it('nullまたはundefinedクエリでエラーを投げる', async () => {
      // Act & Assert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(queryBus.execute(null as any)).rejects.toThrow(
        'Query cannot be null or undefined'
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(queryBus.execute(undefined as any)).rejects.toThrow(
        'Query cannot be null or undefined'
      )
    })
  })

  describe('register', () => {
    it('ハンドラーを正常に登録する', () => {
      // Arrange
      const handler = new TestQueryHandler()

      // Act
      queryBus.register(TestQuery, handler)

      // Assert
      expect(queryRegistry.getHandler(TestQuery)).toBe(handler)
    })

    it('nullまたはundefinedハンドラーでエラーを投げる', () => {
      // Act & Assert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(() => queryBus.register(TestQuery, null as any)).toThrow(
        'Handler cannot be null or undefined'
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(() => queryBus.register(TestQuery, undefined as any)).toThrow(
        'Handler cannot be null or undefined'
      )
    })
  })
})
