import type { Command, CommandHandler } from '../commands/command.interface'

/**
 * Command Busインターフェース
 *
 * コマンドの実行を抽象化し、適切なハンドラーに委譲します。
 */
export interface CommandBus {
  /**
   * コマンドを実行します
   *
   * @param command - 実行するコマンド
   * @returns 実行結果
   */
  execute<TCommand extends Command, TResult>(
    command: TCommand
  ): Promise<TResult>

  /**
   * コマンドハンドラーを登録します
   *
   * @param commandType - コマンドのタイプ（コンストラクタ関数）
   * @param handler - コマンドハンドラー
   */
  register<TCommand extends Command, TResult>(
    commandType: new (...args: never[]) => TCommand,
    handler: CommandHandler<TCommand, TResult>
  ): void
}

/**
 * Command Dispatcherインターフェース
 *
 * コマンドを受信し、適切なハンドラーに配信します。
 */
export interface CommandDispatcher {
  /**
   * コマンドを配信します
   *
   * @param command - 配信するコマンド
   * @returns 配信結果
   */
  dispatch<TCommand extends Command, TResult>(
    command: TCommand
  ): Promise<TResult>
}

/**
 * Command Registry
 *
 * コマンドタイプとハンドラーのマッピングを管理します。
 */
export interface CommandRegistry {
  /**
   * 登録されているすべてのハンドラーを取得します
   */
  getAllHandlers(): Map<
    new (...args: never[]) => Command,
    CommandHandler<Command, unknown>
  >

  /**
   * コマンドタイプに対応するハンドラーを取得します
   */
  getHandler<TCommand extends Command, TResult>(
    commandType: new (...args: never[]) => TCommand
  ): CommandHandler<TCommand, TResult> | undefined

  /**
   * ハンドラーを登録します
   */
  registerHandler<TCommand extends Command, TResult>(
    commandType: new (...args: never[]) => TCommand,
    handler: CommandHandler<TCommand, TResult>
  ): void
}
