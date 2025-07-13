import type { CommandRegistry } from './command-bus.interface'
import type { Command, CommandHandler } from '../commands/command.interface'

/**
 * Command Registry実装
 *
 * コマンドタイプとハンドラーのマッピングを管理します。
 */
export class CommandRegistryImpl implements CommandRegistry {
  private readonly handlers = new Map<
    new (...args: never[]) => Command,
    CommandHandler<Command, unknown>
  >()

  /**
   * 登録されているすべてのハンドラーを取得します
   *
   * @returns ハンドラーのコピー
   */
  getAllHandlers(): Map<
    new (...args: never[]) => Command,
    CommandHandler<Command, unknown>
  > {
    return new Map(this.handlers)
  }

  /**
   * コマンドタイプに対応するハンドラーを取得します
   *
   * @param commandType - コマンドのタイプ（コンストラクタ関数）
   * @returns ハンドラーまたはundefined
   */
  getHandler<TCommand extends Command, TResult>(
    commandType: new (...args: never[]) => TCommand
  ): CommandHandler<TCommand, TResult> | undefined {
    return this.handlers.get(commandType) as
      | CommandHandler<TCommand, TResult>
      | undefined
  }

  /**
   * ハンドラーを登録します
   *
   * @param commandType - コマンドのタイプ（コンストラクタ関数）
   * @param handler - コマンドハンドラー
   */
  registerHandler<TCommand extends Command, TResult>(
    commandType: new (...args: never[]) => TCommand,
    handler: CommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandType, handler)
  }
}
