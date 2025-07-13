import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommandBusImpl } from './command-bus'
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

// Failing Command Handler
class FailingCommandHandler implements CommandHandler<TestCommand, string> {
  async handle(_command: TestCommand): Promise<string> {
    throw new Error('Handler failed')
  }
}

// Test Command
class TestCommand implements Command {
  readonly timestamp: Date = new Date()

  constructor(public readonly message: string) {}
}

// Test Command Handler
class TestCommandHandler implements CommandHandler<TestCommand, string> {
  async handle(command: TestCommand): Promise<string> {
    return `Handled: ${command.message}`
  }
}

describe('CommandBus', () => {
  let commandBus: CommandBusImpl
  let commandRegistry: CommandRegistryImpl

  beforeEach(() => {
    commandRegistry = new CommandRegistryImpl()
    commandBus = new CommandBusImpl(commandRegistry)
  })

  describe('execute', () => {
    it('登録されたハンドラーでコマンドを正常に実行する', async () => {
      // Arrange
      const handler = new TestCommandHandler()
      commandBus.register(TestCommand, handler)
      const command = new TestCommand('test message')

      // Act
      const result = await commandBus.execute<TestCommand, string>(command)

      // Assert
      expect(result).toBe('Handled: test message')
    })

    it('複数のコマンドタイプを正常に処理する', async () => {
      // Arrange
      const handler1 = new TestCommandHandler()
      const handler2 = new AnotherTestCommandHandler()
      commandBus.register(TestCommand, handler1)
      commandBus.register(AnotherTestCommand, handler2)

      const command1 = new TestCommand('first command')
      const command2 = new AnotherTestCommand(5)

      // Act
      const result1 = await commandBus.execute<TestCommand, string>(command1)
      const result2 = await commandBus.execute<AnotherTestCommand, number>(
        command2
      )

      // Assert
      expect(result1).toBe('Handled: first command')
      expect(result2).toBe(10)
    })

    it('未登録のコマンドタイプでエラーを投げる', async () => {
      // Arrange
      const command = new TestCommand('unregistered command')

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        'No handler registered for command: TestCommand'
      )
    })

    it('ハンドラーエラーを適切に伝播する', async () => {
      // Arrange
      const handler = new FailingCommandHandler()
      commandBus.register(TestCommand, handler)
      const command = new TestCommand('failing command')

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        'Handler failed'
      )
    })

    it('同じコマンドタイプに複数回登録すると最後のハンドラーを使用する', async () => {
      // Arrange
      const handler1 = new TestCommandHandler()
      const mockHandler: CommandHandler<TestCommand, string> = {
        handle: vi
          .fn()
          .mockImplementation(
            async (command: TestCommand) => `Override: ${command.message}`
          ),
      }

      commandBus.register(TestCommand, handler1)
      commandBus.register(TestCommand, mockHandler)

      const command = new TestCommand('test message')

      // Act
      const result = await commandBus.execute<TestCommand, string>(command)

      // Assert
      expect(result).toBe('Override: test message')
      expect(mockHandler.handle).toHaveBeenCalledWith(command)
    })

    it('nullまたはundefinedコマンドでエラーを投げる', async () => {
      // Act & Assert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(commandBus.execute(null as any)).rejects.toThrow(
        'Command cannot be null or undefined'
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(commandBus.execute(undefined as any)).rejects.toThrow(
        'Command cannot be null or undefined'
      )
    })
  })

  describe('register', () => {
    it('ハンドラーを正常に登録する', () => {
      // Arrange
      const handler = new TestCommandHandler()

      // Act
      commandBus.register(TestCommand, handler)

      // Assert
      expect(commandRegistry.getHandler(TestCommand)).toBe(handler)
    })

    it('nullまたはundefinedハンドラーでエラーを投げる', () => {
      // Act & Assert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(() => commandBus.register(TestCommand, null as any)).toThrow(
        'Handler cannot be null or undefined'
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(() => commandBus.register(TestCommand, undefined as any)).toThrow(
        'Handler cannot be null or undefined'
      )
    })
  })
})
