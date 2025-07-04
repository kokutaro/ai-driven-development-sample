# JSDoc記述ガイドライン

## 基本的な記述方法

### 関数の基本的なドキュメント

```javascript
/**
 * 二つの数値を加算する
 * @param {number} a - 最初の数値
 * @param {number} b - 二番目の数値
 * @returns {number} 加算結果
 */
function add(a, b) {
  return a + b
}
```

### 複雑な関数の例

```javascript
/**
 * ユーザーデータを取得し、フォーマットして返す
 * @param {string} userId - ユーザーID
 * @param {Object} options - オプション設定
 * @param {boolean} [options.includeProfile=true] - プロフィール情報を含むかどうか
 * @param {string} [options.format='json'] - レスポンス形式
 * @returns {Promise<Object>} フォーマットされたユーザーデータ
 * @throws {Error} ユーザーが見つからない場合
 * @example
 * // 基本的な使用例
 * const user = await getUserData('123');
 *
 * // オプション付きの使用例
 * const user = await getUserData('123', {
 *   includeProfile: false,
 *   format: 'xml'
 * });
 */
async function getUserData(userId, options = {}) {
  // 実装
}
```

## クラスのドキュメント

### 基本的なクラス

```javascript
/**
 * 計算器クラス
 */
class Calculator {
  /**
   * 計算器を初期化する
   * @param {number} [initialValue=0] - 初期値
   */
  constructor(initialValue = 0) {
    this.value = initialValue
  }

  /**
   * 値を加算する
   * @param {number} num - 加算する値
   * @returns {Calculator} チェーン可能なインスタンス
   */
  add(num) {
    this.value += num
    return this
  }

  /**
   * 現在の値を取得する
   * @returns {number} 現在の値
   */
  getValue() {
    return this.value
  }
}
```

## TypeScript用のJSDoc

### 型定義との併用

```typescript
/**
 * APIレスポンスの型定義
 */
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

/**
 * APIからデータを取得する
 * @template T - レスポンスデータの型
 * @param {string} endpoint - APIエンドポイント
 * @param {RequestInit} [options] - fetchオプション
 * @returns {Promise<ApiResponse<T>>} APIレスポンス
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  // 実装
}
```

## 推奨タグ一覧

### 必須タグ

- `@param` - パラメータの説明
- `@returns` - 戻り値の説明
- `@throws` - 例外の説明

### よく使用するタグ

- `@example` - 使用例
- `@deprecated` - 非推奨の説明
- `@since` - 追加されたバージョン
- `@author` - 作成者
- `@see` - 関連項目への参照

### 高度なタグ

- `@template` - ジェネリック型パラメータ
- `@namespace` - 名前空間の定義
- `@module` - モジュールの説明
- `@requires` - 依存関係の説明

## 記述のベストプラクティス

1. **簡潔で明確な説明** - 一行目は簡潔な要約
2. **型情報の正確性** - パラメータと戻り値の型を正確に記述
3. **例外の明記** - 発生する可能性のある例外を記述
4. **使用例の提供** - 複雑な関数には使用例を含める
5. **日本語での記述** - チーム内での可読性を重視

## 悪い例と良い例

### 悪い例

```javascript
/**
 * データを取得
 */
function getData(id) {
  // 実装
}
```

### 良い例

```javascript
/**
 * 指定されたIDのユーザーデータを取得する
 * @param {string} id - ユーザーID
 * @returns {Promise<User>} ユーザーオブジェクト
 * @throws {Error} ユーザーが存在しない場合
 */
function getData(id) {
  // 実装
}
```
