# AI Code Configuration

## YOU MUST

- 回答は日本語で行ってください
- TODOには必ずブランチ作成・実装内容のテスト・コミット・push・PR作成（まだ作成されていない場合）が含まれるべきです
- **型チェックが省略されるようなコードは書かない**
  - **DON'T** `as any`, `as unknown`, `{foo: any}`など、型チェックが省略されることは行わない。
- **必ずコードはドキュメント化する**
  - **必ず**JSDoc形式で、関数、クラスに分かり易い説明を記述
  - @ai-rules/doc-guide.mdにガイドラインを記述しています
- **必ずコードはテストを行う**
  - 必ず@ai-rules/tdd-guide.mdに従い、TDDで実装し、テストより先にコードを書かない
  - 必ず@ai-rules/testing-guide.mdを参考にテストコード記述する

## 技術的ガイドライン

- **コーディング規約**: コードベースでは常に 'undefined' を 'null' の代わりに使用する
- **リント対応**: このコードベースでは、自動的に修正可能なリント問題(例えばメソッドやimportなどのOrder等)を手動で修正する必要はありません
- **コミットフック**: 絶対に pre-commit hook を '--no-verify' フラグでスキップしないこと

## TDDのガイドラインに従って実装

必ず@ai-rules/tdd-guide.mdに従い、TDDで実装し、テストより先にコードを書かないでください。
テストコードを記述する際は、必ず@ai-rules/testing-guide.mdを参考に記述して下さい。

### **以下の操作は作業開始時に必ず行ってください**

- **作業開始時**: 必ず専用ブランチを作成する（feat/<機能名>,fix/<修正内容>, docs/<ドキュメントの作成内容>等）
- **mainブランチでの直接作業は絶対禁止**: いかなる変更もmainブランチに直接コミットしない
- **実際にコードを修正する際は事前に以下の作業を行う**
  - 探索(対象となるコードを注意深く探索する)
  - 計画(コードの修正計画を綿密に立てる。フォルダ構成は、必ず @ai-rules/directory-guide.md を参照し、適切な場所、ファイル名でコードを作成する。)
  - 必要に応じて、依存パッケージのインストールを行ってください。(`yarn add <依存パッケージ>`)
  - 実施(計画に沿ってコードを変更、追加、削除する)
    - **必ずTDDで開発を行ってください**
      1. 最初のテストケースを書く(記述方法は @ai-rules/testing-guide.md を参考)
      2. テストを実行し、失敗を確認
      3. テストを通す最小限の実装を書く
      4. テストが通ることを確認
      5. 必要に応じてリファクタリング
    - 具体的なガイドラインは@ai-rules/doc-guide.mdに従ってください
  - ドキュメント(**必ず**JSDoc形式で、関数、クラスに分かり易い説明を記述)
    - @ai-rules/doc-guide.mdにガイドラインを記述しています。上記の作業時には必ず確認して必ず内容に従って作業を行ってください。

### **以下を必ず作業終了前に実行してください。**

1. フォーマット(`yarn format`)
2. 型チェック(`yarn typecheck`)
3. リント(`yarn lint`)
4. テスト(`yarn test`)
5. ビルド(`yarn build`)
6. 作業内容をコミット(huskyによって自動lint,typecheck,formatが走るので、エラー発生した場合は必ず修正し、再度コミットすること。**絶対にpre-commit hookをオミットするコマンドを実行しないこと**)
7. リモートブランチにpush (`git push -u origin <ブランチ名>`)
8. PR作成 (gh CLIでPR作成)
   - @ai-rules/pr-guide.mdにガイドラインを記述しています。上記の作業時には必ず確認して必ず内容に従って作業を行ってください。

## 技術スタック

- **パッケージマネージャ**: Yarn
- **フレームワーク**: Next.js
- **スタイリング**: Mantine
- **状態管理**: Zustand
- **バリデーション**: Zod
- **ORM**: Prisma

## 基本原則

### コード品質の原則

- **DRY原則**: Don't Repeat Yourself - 同じコードを繰り返さない
- **KISS原則**: Keep It Simple, Stupid - シンプルに保つ
- **YAGNI原則**: You Aren't Gonna Need It - 必要になるまで実装しない
- **単一責任の原則**: 各関数・コンポーネントは1つの責任のみを持つ

### 開発プロセスの原則

1. **タスクの分解**: 改修や機能追加は最小限の単位に分解する
2. **事前調査**: 実装前に必ず既存コードと関連ドキュメントを確認する
3. **計画立案**: 実装前に詳細な実装プランを作成する
4. **品質保証**: format、lint、type-checkを必ず実行する
5. **テスト駆動**: 単体テストを作成・実行する
6. **動作確認**: Web系機能はMCP経由でPlaywrightを使用して確認する

## 参考ドキュメント

- See @docs/todo-specs.md for whole specification for this application
- See @docs/database-design.md for database desigining
- See @docs/component-design.md when designing the UI
- See @docs/api-specification.md to design the API
