import type { CommandBus, CommandRegistry } from './command-bus.interface'
import type { Command, CommandHandler } from '../commands/command.interface'

/**
 * Command Bus実装
 *
 * コマンドの実行を管理し、適切なハンドラーに委譲します。
 */
export class CommandBusImpl implements CommandBus {
  constructor(private readonly registry: CommandRegistry) {}

  /**
   * コマンドを実行します
   *
   * @param command - 実行するコマンド
   * @returns 実行結果
   */
  async execute<TCommand extends Command, TResult>(
    command: TCommand
  ): Promise<TResult> {
    // 入力値検証
    if (command === null || command === undefined) {
      throw new Error('Command cannot be null or undefined')
    }

    // コマンドタイプを取得
    const commandType = command.constructor as new (
      ...args: never[]
    ) => TCommand

    // ハンドラーを取得
    const handler = this.registry.getHandler<TCommand, TResult>(commandType)

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandType.name}`)
    }

    // ハンドラーを実行
    return await handler.handle(command)
  }

  /**
   * コマンドハンドラーを登録します
   *
   * @param commandType - コマンドのタイプ（コンストラクタ関数）
   * @param handler - コマンドハンドラー
   */
  register<TCommand extends Command, TResult>(
    commandType: new (...args: never[]) => TCommand,
    handler: CommandHandler<TCommand, TResult>
  ): void {
    // 入力値検証
    if (handler === null || handler === undefined) {
      throw new Error('Handler cannot be null or undefined')
    }

    this.registry.registerHandler(commandType, handler)
  }
}
