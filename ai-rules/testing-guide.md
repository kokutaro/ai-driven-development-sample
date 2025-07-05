# Testing Guide

- [1. 概要](#1-概要)
- [2. テストの基本原則](#2-テストの基本原則)
  - [2.1. TDD（Test-Driven Development）の流れ](#21-tddtest-driven-developmentの流れ)
  - [2.2. テストの品質原則](#22-テストの品質原則)
- [3. コンポーネントのテスト](#3-コンポーネントのテスト)
  - [3.1. 基本的なテスト構造](#31-基本的なテスト構造)
  - [3.2. コンポーネントテストの例](#32-コンポーネントテストの例)
  - [3.3. コンポーネントテストのベストプラクティス](#33-コンポーネントテストのベストプラクティス)
- [4. ビジネスロジックのテスト](#4-ビジネスロジックのテスト)
  - [4.1. 基本的なテスト構造](#41-基本的なテスト構造)
  - [4.2. ビジネスロジックテストの例](#42-ビジネスロジックテストの例)
  - [4.3. ビジネスロジックテストのベストプラクティス](#43-ビジネスロジックテストのベストプラクティス)
- [5. テストファイルの命名規則](#5-テストファイルの命名規則)
- [6. 必須テストケース](#6-必須テストケース)
  - [6.1. コンポーネントのテスト](#61-コンポーネントのテスト)
  - [6.2. ビジネスロジックのテスト](#62-ビジネスロジックのテスト)

## 1. 概要

このプロジェクトでは、**Vitest**を使用してテストを実行します。テストは**TDD(Test-Driven Development)**の原則に従って実装し、以下の2つのカテゴリでテストを書きます：

1. **コンポーネントのテスト** - React Testing Libraryを使用したUIコンポーネントのテスト
2. **ビジネスロジックのテスト** - ユーティリティ関数やビジネスロジックのユニットテスト

## 2. テストの基本原則

### 2.1. TDD（Test-Driven Development）の流れ

1. **Red**: テストを書く（失敗する）
2. **Green**: テストを通す最小限のコードを書く
3. **Refactor**: コードをリファクタリングする

### 2.2. テストの品質原則

- **Given-When-Then**: テストの構造を明確にする
- **AAA（Arrange-Act-Assert）**: テストの3つの段階を明確にする
- **1つのテストで1つのことをテストする**
- **テストは読みやすく、保守しやすくする**

## 3. コンポーネントのテスト

### 3.1. 基本的なテスト構造

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders button with children', () => {
    // Arrange
    render(<Button>Click me</Button>)

    // Act & Assert
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
})
```

### 3.2. コンポーネントテストの例

以下は`Button`コンポーネントのテストの完全な例です：

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  // 基本的なレンダリングテスト
  it('renders button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  // デフォルト値のテスト
  it('applies primary variant classes by default', () => {
    render(<Button>Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'text-white')
  })

  // プロパティのテスト
  it('applies secondary variant classes when variant is secondary', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-200', 'text-gray-900')
  })

  // 複数のクラスのテスト
  it('applies outline variant classes when variant is outline', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass(
      'border',
      'border-gray-300',
      'bg-white',
      'text-gray-700'
    )
  })

  // サイズのテスト
  it('applies size classes correctly', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-2', 'text-sm')
  })

  // 状態のテスト
  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('disabled')
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  // 無効状態のテスト
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  // カスタムクラスのテスト
  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})
```

### 3.3. コンポーネントテストのベストプラクティス

1. **`screen.getByRole`を使用する**: アクセシビリティを意識したセレクター
2. **`toBeInTheDocument`でDOM存在確認**: 要素がレンダリングされているかの確認
3. **`toHaveClass`でスタイルテスト**: CSSクラスの適用確認
4. **`toBeDisabled`で状態テスト**: 無効状態の確認
5. **複数のバリアントをテスト**: 異なるプロパティの組み合わせをテスト

## 4. ビジネスロジックのテスト

### 4.1. 基本的なテスト構造

```typescript
import { functionName } from '@/lib/utils'

describe('functionName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test input'
    const expected = 'expected output'

    // Act
    const result = functionName(input)

    // Assert
    expect(result).toBe(expected)
  })
})
```

### 4.2. ビジネスロジックテストの例

以下は`utils.ts`の関数テストの完全な例です：

```typescript
import { capitalize, cn, formatDate, isValidEmail } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('combines class names correctly', () => {
      // Arrange & Act
      const result = cn('class1', 'class2', 'class3')

      // Assert
      expect(result).toBe('class1 class2 class3')
    })

    it('filters out falsy values', () => {
      // Arrange & Act
      const result = cn(
        'class1',
        undefined,
        'class2',
        undefined,
        false,
        'class3'
      )

      // Assert
      expect(result).toBe('class1 class2 class3')
    })

    it('returns empty string for no valid classes', () => {
      // Arrange & Act
      const result = cn(undefined, undefined, false)

      // Assert
      expect(result).toBe('')
    })
  })

  describe('formatDate', () => {
    it('formats date in Japanese locale', () => {
      // Arrange
      const date = new Date('2023-12-25')

      // Act
      const formatted = formatDate(date)

      // Assert
      expect(formatted).toContain('2023')
      expect(formatted).toContain('12')
      expect(formatted).toContain('25')
    })
  })

  describe('isValidEmail', () => {
    it('returns true for valid email addresses', () => {
      // Arrange & Act & Assert
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.jp')).toBe(true)
      expect(isValidEmail('user+tag@domain.org')).toBe(true)
    })

    it('returns false for invalid email addresses', () => {
      // Arrange & Act & Assert
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('test@domain')).toBe(false)
      expect(isValidEmail('test @domain.com')).toBe(false)
    })
  })

  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      // Arrange & Act & Assert
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('World')
      expect(capitalize('test string')).toBe('Test string')
    })

    it('handles empty string', () => {
      // Arrange & Act & Assert
      expect(capitalize('')).toBe('')
    })

    it('handles single character', () => {
      // Arrange & Act & Assert
      expect(capitalize('a')).toBe('A')
      expect(capitalize('A')).toBe('A')
    })
  })
})
```

### 4.3. ビジネスロジックテストのベストプラクティス

1. **境界値をテストする**: 空文字列、null、undefined、最小値、最大値
2. **正常系と異常系の両方をテストする**: 成功ケースと失敗ケース
3. **エッジケースをテストする**: 特殊な入力値や状況
4. **`describe`でグループ化**: 関連するテストをまとめる
5. **明確なテスト名**: 何をテストしているかが分かりやすい名前

## 5. テストファイルの命名規則

- **コンポーネントテスト**: `component-name.test.tsx`
- **ユーティリティテスト**: `utils.test.ts`
- **フックテスト**: `use-hook-name.test.ts`
- **APIテスト**: `api-endpoint.test.ts`

## 6. 必須テストケース

### 6.1. コンポーネントのテスト

1. **基本レンダリング**: コンポーネントが正しくレンダリングされるか
2. **プロパティ**: 異なるプロパティの組み合わせが正しく動作するか
3. **状態**: 状態変化が正しく反映されるか
4. **イベント**: ユーザーの操作が正しく処理されるか
5. **エラー処理**: エラー状態が正しく表示されるか

### 6.2. ビジネスロジックのテスト

1. **正常系**: 期待される入力に対して正しい出力が返されるか
2. **異常系**: 不正な入力に対して適切に処理されるか
3. **境界値**: 最小値、最大値、空値などの境界値が正しく処理されるか
4. **エッジケース**: 特殊な状況での動作が正しいか

このguideに従って、品質の高いテストコードを書いてください。
