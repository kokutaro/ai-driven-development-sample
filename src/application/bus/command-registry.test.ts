import { beforeEach, describe, expect, it } from 'vitest'

import { CommandRegistryImpl } from './command-registry'

import type { Command, CommandHandler } from '../commands/command.interface'

class AnotherTestCommand implements Command {
  readonly timestamp: Date = new Date()

  constructor(public readonly value: number) {}
}

class AnotherTestCommandHandler
  implements CommandHandler<AnotherTestCommand, number>
{
  async handle(command: AnotherTestCommand): Promise<number> {
    return command.value * 2
  }
}

// Test Command Classes
class TestCommand implements Command {
  readonly timestamp: Date = new Date()

  constructor(public readonly message: string) {}
}

// Test Command Handler Classes
class TestCommandHandler implements CommandHandler<TestCommand, string> {
  async handle(command: TestCommand): Promise<string> {
    return `Handled: ${command.message}`
  }
}

describe('CommandRegistry', () => {
  let registry: CommandRegistryImpl

  beforeEach(() => {
    registry = new CommandRegistryImpl()
  })

  describe('registerHandler', () => {
    it('ハンドラーを正常に登録する', () => {
      // Arrange
      const handler = new TestCommandHandler()

      // Act
      registry.registerHandler(TestCommand, handler)

      // Assert
      expect(registry.getHandler(TestCommand)).toBe(handler)
    })

    it('複数の異なるコマンドタイプにハンドラーを登録する', () => {
      // Arrange
      const handler1 = new TestCommandHandler()
      const handler2 = new AnotherTestCommandHandler()

      // Act
      registry.registerHandler(TestCommand, handler1)
      registry.registerHandler(AnotherTestCommand, handler2)

      // Assert
      expect(registry.getHandler(TestCommand)).toBe(handler1)
      expect(registry.getHandler(AnotherTestCommand)).toBe(handler2)
    })

    it('同じコマンドタイプに複数回登録すると最後のハンドラーで上書きする', () => {
      // Arrange
      const handler1 = new TestCommandHandler()
      const handler2 = new TestCommandHandler()

      // Act
      registry.registerHandler(TestCommand, handler1)
      registry.registerHandler(TestCommand, handler2)

      // Assert
      expect(registry.getHandler(TestCommand)).toBe(handler2)
      expect(registry.getHandler(TestCommand)).not.toBe(handler1)
    })
  })

  describe('getHandler', () => {
    it('登録されたハンドラーを正常に取得する', () => {
      // Arrange
      const handler = new TestCommandHandler()
      registry.registerHandler(TestCommand, handler)

      // Act
      const retrievedHandler = registry.getHandler(TestCommand)

      // Assert
      expect(retrievedHandler).toBe(handler)
    })

    it('未登録のコマンドタイプでundefinedを返す', () => {
      // Act
      const retrievedHandler = registry.getHandler(TestCommand)

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
      const handler1 = new TestCommandHandler()
      const handler2 = new AnotherTestCommandHandler()
      registry.registerHandler(TestCommand, handler1)
      registry.registerHandler(AnotherTestCommand, handler2)

      // Act
      const allHandlers = registry.getAllHandlers()

      // Assert
      expect(allHandlers.size).toBe(2)
      expect(allHandlers.get(TestCommand)).toBe(handler1)
      expect(allHandlers.get(AnotherTestCommand)).toBe(handler2)
    })

    it('返されたMapの変更が元のレジストリに影響しない', () => {
      // Arrange
      const handler = new TestCommandHandler()
      registry.registerHandler(TestCommand, handler)

      // Act
      const allHandlers = registry.getAllHandlers()
      allHandlers.clear()

      // Assert
      expect(registry.getHandler(TestCommand)).toBe(handler)
    })
  })
})
