# コーディングガイドライン

このドキュメントは、プロジェクトのESLintとPrettierの設定に基づいた包括的なコーディングガイドラインです。各ルールの目的、設定内容、良い例・悪い例を含む実践的なリファレンスとして活用してください。

## 1. 目次

- [1. 目次](#1-目次)
- [2. Prettier設定](#2-prettier設定)
  - [2.1. 設定内容](#21-設定内容)
  - [2.2. 各オプションの詳細](#22-各オプションの詳細)
    - [2.2.1. `semi: false` - セミコロンなし](#221-semi-false---セミコロンなし)
    - [2.2.2. `trailingComma: "es5"` - ES5準拠の末尾カンマ](#222-trailingcomma-es5---es5準拠の末尾カンマ)
    - [2.2.3. `singleQuote: true` - シングルクォート優先](#223-singlequote-true---シングルクォート優先)
    - [2.2.4. `printWidth: 80` - 行幅80文字](#224-printwidth-80---行幅80文字)
    - [2.2.5. `tabWidth: 2` \& `useTabs: false` - スペース2文字インデント](#225-tabwidth-2--usetabs-false---スペース2文字インデント)
- [3. TypeScript ESLint ルール](#3-typescript-eslint-ルール)
  - [3.1. @typescript-eslint/no-explicit-any ⭐ 特に重要](#31-typescript-eslintno-explicit-any--特に重要)
    - [3.1.1. 設定内容](#311-設定内容)
    - [3.1.2. なぜ`any`は危険なのか](#312-なぜanyは危険なのか)
    - [3.1.3. よくあるパターンと対処法](#313-よくあるパターンと対処法)
  - [3.2. @typescript-eslint/consistent-type-definitions](#32-typescript-eslintconsistent-type-definitions)
  - [3.3. @typescript-eslint/consistent-type-imports](#33-typescript-eslintconsistent-type-imports)
  - [3.4. @typescript-eslint/no-unused-vars](#34-typescript-eslintno-unused-vars)
- [4. Unicorn プラグインルール](#4-unicorn-プラグインルール)
  - [4.1. 有効化されているルール（recommended設定）](#41-有効化されているルールrecommended設定)
    - [4.1.1. unicorn/prefer-modern-dom-apis](#411-unicornprefer-modern-dom-apis)
    - [4.1.2. unicorn/prefer-query-selector](#412-unicornprefer-query-selector)
    - [4.1.3. unicorn/prefer-node-protocol](#413-unicornprefer-node-protocol)
    - [4.1.4. unicorn/prefer-module](#414-unicornprefer-module)
    - [4.1.5. unicorn/no-instanceof-builtins](#415-unicornno-instanceof-builtins)
    - [4.1.6. unicorn/prefer-math-trunc](#416-unicornprefer-math-trunc)
  - [4.2. 無効化されているルール](#42-無効化されているルール)
    - [4.2.1. unicorn/no-useless-undefined](#421-unicornno-useless-undefined)
    - [4.2.2. unicorn/prevent-abbreviations](#422-unicornprevent-abbreviations)
  - [4.3. よく引っかかるルールと対処法](#43-よく引っかかるルールと対処法)
    - [4.3.1. unicorn/filename-case](#431-unicornfilename-case)
    - [4.3.2. unicorn/no-array-reduce](#432-unicornno-array-reduce)
- [5. Perfectionist プラグインルール](#5-perfectionist-プラグインルール)
  - [5.1. sort-imports - インポートの並び替え](#51-sort-imports---インポートの並び替え)
  - [5.2. その他のソートルール](#52-その他のソートルール)
    - [5.2.1. sort-objects - オブジェクトプロパティの並び替え](#521-sort-objects---オブジェクトプロパティの並び替え)
    - [5.2.2. sort-interfaces - インターフェースプロパティの並び替え](#522-sort-interfaces---インターフェースプロパティの並び替え)
- [6. その他の重要ルール](#6-その他の重要ルール)
  - [6.1. unused-imports](#61-unused-imports)
  - [6.2. security](#62-security)
  - [6.3. 関数スタイルルール](#63-関数スタイルルール)
    - [6.3.1. func-style \& prefer-arrow-callback](#631-func-style--prefer-arrow-callback)
    - [6.3.2. prefer-template](#632-prefer-template)
- [7. プロジェクト固有の設定](#7-プロジェクト固有の設定)
  - [7.1. Next.js固有のルール](#71-nextjs固有のルール)
  - [7.2. テストファイルでの例外設定](#72-テストファイルでの例外設定)
  - [7.3. 除外パターン](#73-除外パターン)
- [8. 実践的なTips](#8-実践的なtips)
  - [8.1. よく遭遇するエラーパターンと解決法](#81-よく遭遇するエラーパターンと解決法)
    - [8.1.1. `@typescript-eslint/no-explicit-any`エラー](#811-typescript-eslintno-explicit-anyエラー)
    - [8.1.2. `unicorn/prefer-node-protocol`エラー](#812-unicornprefer-node-protocolエラー)
    - [8.1.3. `unused-imports/no-unused-imports`エラー](#813-unused-importsno-unused-importsエラー)
  - [8.2. 自動修正の活用](#82-自動修正の活用)
  - [8.3. VSCodeとの連携](#83-vscodeとの連携)
  - [8.4. エラーメッセージの読み方](#84-エラーメッセージの読み方)
  - [8.5. パフォーマンス向上のコツ](#85-パフォーマンス向上のコツ)

## 2. Prettier設定

`.prettierrc`の設定内容と、各オプションの意図を説明します。

### 2.1. 設定内容

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 2.2. 各オプションの詳細

#### 2.2.1. `semi: false` - セミコロンなし

セミコロンを自動で除去し、コードをよりクリーンに保ちます。

```typescript
// ✅ 良い例
const message = 'Hello, World!'
const numbers = [1, 2, 3]

// ❌ 悪い例（Prettierが自動修正）
const message = 'Hello, World!'
const numbers = [1, 2, 3]
```

#### 2.2.2. `trailingComma: "es5"` - ES5準拠の末尾カンマ

オブジェクトや配列の最後の要素に末尾カンマを追加し、差分をクリーンに保ちます。

```typescript
// ✅ 良い例
const config = {
  name: 'project',
  version: '1.0.0',
  dependencies: ['react', 'next'], // 末尾カンマあり
}

// ❌ 悪い例
const config = {
  name: 'project',
  version: '1.0.0',
  dependencies: ['react', 'next'], // 末尾カンマなし
}
```

#### 2.2.3. `singleQuote: true` - シングルクォート優先

文字列にはシングルクォートを使用し、一貫性を保ちます。

```typescript
// ✅ 良い例
const message = 'Hello, World!'
const template = `Hello, ${name}!`

// ❌ 悪い例
const message = 'Hello, World!'
```

#### 2.2.4. `printWidth: 80` - 行幅80文字

可読性を保つため、1行あたり80文字に制限します。

```typescript
// ✅ 良い例（自動的に折り返し）
const longFunction = (
  parameterOne: string,
  parameterTwo: number,
  parameterThree: boolean
) => {
  return `${parameterOne}-${parameterTwo}-${parameterThree}`
}

// ❌ 悪い例（長すぎる行）
const longFunction = (
  parameterOne: string,
  parameterTwo: number,
  parameterThree: boolean
) => {
  return `${parameterOne}-${parameterTwo}-${parameterThree}`
}
```

#### 2.2.5. `tabWidth: 2` & `useTabs: false` - スペース2文字インデント

一貫性のためスペース2文字でインデントします。

```typescript
// ✅ 良い例
if (condition) {
  console.log('message')
  if (nestedCondition) {
    console.log('nested')
  }
}
```

## 3. TypeScript ESLint ルール

TypeScriptの型安全性とコード品質を保つための重要なルールを解説します。

### 3.1. @typescript-eslint/no-explicit-any ⭐ 特に重要

**目的**: `any`型の使用を禁止し、型安全性を保つ

`any`型は TypeScript の型チェックを無効化するため、バグの温床となります。このルールは最も頻繁に遭遇し、重要なルールの一つです。

#### 3.1.1. 設定内容

現在の設定では無効化されていませんが、推奨される設定：

```json
{
  "@typescript-eslint/no-explicit-any": ["error", { "ignoreRestArgs": true }]
}
```

#### 3.1.2. なぜ`any`は危険なのか

```typescript
// ❌ 危険な例 - anyは型チェックを無効化
function greet(friend: any) {
  console.log(`Hello, ${friend.toUpperCase()}!`)
}

greet('Alice') // 正常動作
greet({ name: 'Bob' }) // 実行時エラー！friend.toUpperCase is not a function

// ✅ 安全な例 - 適切な型定義
function greet(friend: string) {
  console.log(`Hello, ${friend.toUpperCase()}!`)
}

// または、型が不明な場合はunknownを使用
function processData(data: unknown) {
  if (typeof data === 'string') {
    console.log(data.toUpperCase()) // 型ガードで安全
  }
}
```

#### 3.1.3. よくあるパターンと対処法

- **1. JSON.parseの結果**

```typescript
// ❌ 悪い例
const data: any = JSON.parse(jsonString)

// ✅ 良い例 - zodでバリデーション
import { z } from 'zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
})

const data = userSchema.parse(JSON.parse(jsonString))
```

- **2. 外部ライブラリの型定義がない場合**

```typescript
// ❌ 悪い例
const result: any = externalLibraryFunction()

// ✅ 良い例 - 型定義を作成
interface ExternalLibraryResult {
  id: string
  value: number
}

const result = externalLibraryFunction() as ExternalLibraryResult
```

- **3. Rest引数の場合**

```typescript
// ✅ 許可される例（ignoreRestArgs: trueの場合）
function logAll(...args: any[]) {
  console.log(args)
}

// ✅ より良い例 - 適切な型を定義
function logStrings(...args: string[]) {
  console.log(args)
}
```

### 3.2. @typescript-eslint/consistent-type-definitions

**目的**: `interface`と`type`の使い分けを統一

```typescript
// 現在の設定: interfaceを優先
// ✅ 良い例
interface User {
  name: string
  age: number
}

// ❌ 悪い例
type User = {
  name: string
  age: number
}
```

### 3.3. @typescript-eslint/consistent-type-imports

**目的**: 型インポートを明示的に分離

```typescript
// ✅ 良い例
import { useState } from 'react'
import type { FC } from 'react'

// ❌ 悪い例
import { useState, FC } from 'react'
```

### 3.4. @typescript-eslint/no-unused-vars

**目的**: 未使用変数の検出

```typescript
// ✅ 良い例 - アンダースコアプレフィックスで意図的な未使用を示す
const handleClick = (_event: MouseEvent, data: string) => {
  console.log(data)
}

// ❌ 悪い例
const handleClick = (event: MouseEvent, data: string) => {
  console.log(data) // eventが未使用
}
```

## 4. Unicorn プラグインルール

モダンなJavaScript/TypeScriptのベストプラクティスを強制する100以上のルールを含みます。

### 4.1. 有効化されているルール（recommended設定）

#### 4.1.1. unicorn/prefer-modern-dom-apis

古いDOM APIの使用を禁止

```typescript
// ❌ 悪い例
element.setAttribute('class', 'active')

// ✅ 良い例
element.className = 'active'
// または
element.classList.add('active')
```

#### 4.1.2. unicorn/prefer-query-selector

古いDOM選択メソッドの使用を禁止

```typescript
// ❌ 悪い例
document.getElementById('myId')
document.getElementsByClassName('myClass')

// ✅ 良い例
document.querySelector('#myId')
document.querySelectorAll('.myClass')
```

#### 4.1.3. unicorn/prefer-node-protocol

Node.js組み込みモジュールにはプロトコルを使用

```typescript
// ❌ 悪い例
import fs from 'fs'
import path from 'path'

// ✅ 良い例
import fs from 'node:fs'
import path from 'node:path'
```

#### 4.1.4. unicorn/prefer-module

CommonJSよりもES Modulesを優先

```typescript
// ❌ 悪い例
const fs = require('fs')
module.exports = { ... }

// ✅ 良い例
import fs from 'node:fs'
export const config = { ... }
```

#### 4.1.5. unicorn/no-instanceof-builtins

`instanceof`の代わりにより安全な型チェックを使用

```typescript
// ❌ 悪い例
if (value instanceof Array) {
  // ...
}

// ✅ 良い例
if (Array.isArray(value)) {
  // ...
}
```

#### 4.1.6. unicorn/prefer-math-trunc

`Math.trunc()`を使用して意図を明確化

```typescript
// ❌ 悪い例
const truncated = ~~floatNumber
const truncated2 = parseInt(floatNumber, 10)

// ✅ 良い例
const truncated = Math.trunc(floatNumber)
```

### 4.2. 無効化されているルール

#### 4.2.1. unicorn/no-useless-undefined

**無効化理由**: このプロジェクトでは`undefined`を明示的に使用する場合があるため

```typescript
// このプロジェクトでは許可
const value = undefined
const config = {
  setting: undefined, // 明示的に未設定を示す
}
```

#### 4.2.2. unicorn/prevent-abbreviations

**無効化理由**: 一般的な略語（props, refなど）の使用を許可するため

```typescript
// このプロジェクトでは許可
const props = getProps()
const ref = useRef()
const params = getParams()
```

### 4.3. よく引っかかるルールと対処法

#### 4.3.1. unicorn/filename-case

ファイル名のケースを統一

```text
❌ 悪い例
MyComponent.tsx
myUtils.ts

✅ 良い例
my-component.tsx
my-utils.ts
```

#### 4.3.2. unicorn/no-array-reduce

複雑な`reduce`の使用を制限

```typescript
// ❌ 複雑すぎる例
const result = array.reduce(
  (acc, item) => {
    if (item.condition) {
      acc.valid.push(item)
    } else {
      acc.invalid.push(item)
    }
    return acc
  },
  { valid: [], invalid: [] }
)

// ✅ より読みやすい例
const valid = array.filter((item) => item.condition)
const invalid = array.filter((item) => !item.condition)
```

## 5. Perfectionist プラグインルール

コードの整理と一貫性を保つためのソートルール（`recommended-natural`設定使用）。

### 5.1. sort-imports - インポートの並び替え

現在は無効化されていますが、重要なルールです。

```typescript
// ✅ 推奨されるインポート順序
// 1. Node.js組み込みモジュール
import fs from 'node:fs'
import path from 'node:path'

// 2. 外部ライブラリ
import React from 'react'
import { NextPage } from 'next'

// 3. 内部モジュール（絶対パス）
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/user-store'

// 4. 相対パス
import './styles.css'
import { helper } from '../utils/helper'

// 5. 型インポート（最後）
import type { User } from '@/types/user'
```

### 5.2. その他のソートルール

#### 5.2.1. sort-objects - オブジェクトプロパティの並び替え

```typescript
// ✅ アルファベット順
const config = {
  apiUrl: 'https://api.example.com',
  debug: true,
  timeout: 5000,
  version: '1.0.0',
}
```

#### 5.2.2. sort-interfaces - インターフェースプロパティの並び替え

```typescript
// ✅ アルファベット順
interface User {
  email: string
  id: string
  name: string
  role: 'admin' | 'user'
}
```

## 6. その他の重要ルール

### 6.1. unused-imports

未使用インポートの自動検出と削除

```typescript
// ❌ 悪い例（未使用インポートがある）
import React, { useState, useEffect } from 'react' // useEffectが未使用
import { Button } from '@/components/ui/button' // 未使用

const MyComponent = () => {
  const [count, setCount] = useState(0)
  return <div>{count}</div>
}

// ✅ 良い例（自動修正後）
import { useState } from 'react'

const MyComponent = () => {
  const [count, setCount] = useState(0)
  return <div>{count}</div>
}
```

### 6.2. security

セキュリティのベストプラクティスを強制

```typescript
// ❌ 危険な例
eval(userInput) // 任意のコード実行の危険性

// ✅ 安全な例
// evalの代わりに適切なパーシングを使用
JSON.parse(userInput) // JSONデータの場合
```

### 6.3. 関数スタイルルール

#### 6.3.1. func-style & prefer-arrow-callback

関数宣言とアロー関数の使い分けを統一

```typescript
// ✅ 良い例 - 関数宣言
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ 良い例 - アロー関数（コールバック）
const processedItems = items.map((item) => ({
  ...item,
  total: item.price * item.quantity,
}))

// ✅ 良い例 - 名前付き関数宣言（ホイスティング対応）
function handleSubmit() {
  // ...
}

// ❌ 悪い例 - function式
const handleSubmit = function () {
  // ...
}
```

#### 6.3.2. prefer-template

文字列結合よりもテンプレートリテラルを優先

```typescript
// ❌ 悪い例
const message = 'Hello, ' + name + '!'
const url = baseUrl + '/api/' + endpoint

// ✅ 良い例
const message = `Hello, ${name}!`
const url = `${baseUrl}/api/${endpoint}`
```

## 7. プロジェクト固有の設定

### 7.1. Next.js固有のルール

`next/core-web-vitals`設定により、Next.jsのベストプラクティスが適用されています。

### 7.2. テストファイルでの例外設定

```javascript
{
  files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
  rules: {
    '@typescript-eslint/unbound-method': 'off',
  },
}
```

テストファイルでは一部のルールが緩和されています。

### 7.3. 除外パターン

以下のディレクトリはリントの対象外です：

- `.next/`
- `node_modules/`
- `dist/`
- `build/`
- `out/`
- `public/`
- `coverage/`
- `mcp-server/`

## 8. 実践的なTips

### 8.1. よく遭遇するエラーパターンと解決法

#### 8.1.1. `@typescript-eslint/no-explicit-any`エラー

```typescript
// エラー: Unexpected any. Specify a different type.
function process(data: any) { ... }

// 解決法1: 適切な型を定義
interface ProcessData {
  id: string
  value: number
}
function process(data: ProcessData) { ... }

// 解決法2: unknownを使用して型ガード
function process(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // 型ガードで安全に使用
  }
}
```

#### 8.1.2. `unicorn/prefer-node-protocol`エラー

```typescript
// エラー: Prefer `node:` protocol when importing Node.js builtin modules.
import fs from 'fs'

// 解決法
import fs from 'node:fs'
```

#### 8.1.3. `unused-imports/no-unused-imports`エラー

```typescript
// エラー: 'React' is defined but never used.
import React, { useState } from 'react'

// 解決法: 自動修正またはESLintの実行
// yarn lint --fix
```

### 8.2. 自動修正の活用

多くのルールは自動修正に対応しています：

```bash
# リントエラーの確認
yarn lint

# 自動修正可能なエラーを修正
yarn lint --fix

# フォーマットの実行
yarn format
```

### 8.3. VSCodeとの連携

VSCodeの設定例（`.vscode/settings.json`）：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### 8.4. エラーメッセージの読み方

ESLintエラーメッセージの構造：

```text
/path/to/file.ts
  10:5  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

- `10:5`: 行番号:列番号
- `error`: 重要度（error/warning）
- メッセージ: 問題の説明
- ルール名: 該当するESLintルール

### 8.5. パフォーマンス向上のコツ

1. **プリコミットフック**: Huskyを使用してコミット前に自動チェック
2. **IDE統合**: リアルタイムでエラーを確認
3. **段階的導入**: 新しいルールは段階的に導入
4. **チーム共有**: ガイドラインをチーム全体で共有

---

このガイドラインを参考に、一貫性があり、保守しやすく、型安全なコードを書いてください。わからないことがあれば、具体的なエラーメッセージと共にチームメンバーに相談してください。
