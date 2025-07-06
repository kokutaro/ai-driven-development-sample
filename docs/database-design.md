# データベース設計書

## 概要

TODO システムのデータベース設計書です。PostgreSQL を使用し、Prisma ORM を通じてデータアクセスを行います。

## データベース構成

### 技術スタック

- **データベース**: PostgreSQL 15+
- **ORM**: Prisma 6.11.1
- **マイグレーション**: Prisma Migrate

### 接続設定

```env
DATABASE_URL="postgresql://username:password@localhost:5432/todo_db?schema=public"
```

## テーブル設計

### 1. User テーブル

ユーザー情報を管理するテーブル

```sql
CREATE TABLE "User" (
  "id"        TEXT PRIMARY KEY,
  "email"     TEXT UNIQUE NOT NULL,
  "name"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Category テーブル

タスクのカテゴリを管理するテーブル

```sql
CREATE TABLE "Category" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "color"     TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

### 3. Todo テーブル

メインのタスク情報を管理するテーブル

```sql
CREATE TABLE "Todo" (
  "id"          TEXT PRIMARY KEY,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "dueDate"     TIMESTAMP(3),
  "isImportant" BOOLEAN DEFAULT false,
  "isCompleted" BOOLEAN DEFAULT false,
  "order"       INTEGER DEFAULT 0,
  "categoryId"  TEXT,
  "userId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

### 4. SubTask テーブル

タスクのサブタスクを管理するテーブル

```sql
CREATE TABLE "SubTask" (
  "id"          TEXT PRIMARY KEY,
  "title"       TEXT NOT NULL,
  "isCompleted" BOOLEAN DEFAULT false,
  "order"       INTEGER DEFAULT 0,
  "todoId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE
);
```

### 5. Reminder テーブル

タスクのリマインダーを管理するテーブル

```sql
CREATE TABLE "Reminder" (
  "id"          TEXT PRIMARY KEY,
  "reminderAt"  TIMESTAMP(3) NOT NULL,
  "isTriggered" BOOLEAN DEFAULT false,
  "todoId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE
);
```

## Prisma スキーマ

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  todos      Todo[]
  categories Category[]

  @@map("User")
}

model Category {
  id        String   @id @default(cuid())
  name      String
  color     String   // HEX color code
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  todos Todo[]

  @@map("Category")
}

model Todo {
  id          String    @id @default(cuid())
  title       String
  description String?
  dueDate     DateTime?
  isImportant Boolean   @default(false)
  isCompleted Boolean   @default(false)
  order       Int       @default(0)
  categoryId  String?
  userId      String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  category  Category?  @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  subTasks  SubTask[]
  reminders Reminder[]

  @@map("Todo")
}

model SubTask {
  id          String   @id @default(cuid())
  title       String
  isCompleted Boolean  @default(false)
  order       Int      @default(0)
  todoId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  todo Todo @relation(fields: [todoId], references: [id], onDelete: Cascade)

  @@map("SubTask")
}

model Reminder {
  id          String   @id @default(cuid())
  reminderAt  DateTime
  isTriggered Boolean  @default(false)
  todoId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  todo Todo @relation(fields: [todoId], references: [id], onDelete: Cascade)

  @@map("Reminder")
}
```

## インデックス設計

### 1. パフォーマンス最適化インデックス

```sql
-- Todo テーブルのインデックス
CREATE INDEX idx_todo_user_id ON "Todo"("userId");
CREATE INDEX idx_todo_category_id ON "Todo"("categoryId");
CREATE INDEX idx_todo_due_date ON "Todo"("dueDate");
CREATE INDEX idx_todo_is_completed ON "Todo"("isCompleted");
CREATE INDEX idx_todo_is_important ON "Todo"("isImportant");
CREATE INDEX idx_todo_created_at ON "Todo"("createdAt");
CREATE INDEX idx_todo_user_completed ON "Todo"("userId", "isCompleted");
CREATE INDEX idx_todo_user_important ON "Todo"("userId", "isImportant");

-- SubTask テーブルのインデックス
CREATE INDEX idx_subtask_todo_id ON "SubTask"("todoId");
CREATE INDEX idx_subtask_order ON "SubTask"("todoId", "order");

-- Category テーブルのインデックス
CREATE INDEX idx_category_user_id ON "Category"("userId");

-- Reminder テーブルのインデックス
CREATE INDEX idx_reminder_todo_id ON "Reminder"("todoId");
CREATE INDEX idx_reminder_at ON "Reminder"("reminderAt");
CREATE INDEX idx_reminder_triggered ON "Reminder"("isTriggered");
```

### 2. 複合インデックス

```sql
-- よく使用されるクエリパターン用
CREATE INDEX idx_todo_user_status_date ON "Todo"("userId", "isCompleted", "dueDate");
CREATE INDEX idx_todo_user_important_date ON "Todo"("userId", "isImportant", "dueDate");
CREATE INDEX idx_todo_user_category_status ON "Todo"("userId", "categoryId", "isCompleted");
```

## データ制約

### 1. 必須制約

- `User.email`: 必須、一意制約
- `User.name`: 必須
- `Todo.title`: 必須
- `Todo.userId`: 必須（外部キー）
- `SubTask.title`: 必須
- `SubTask.todoId`: 必須（外部キー）
- `Category.name`: 必須
- `Category.color`: 必須（HEX形式）
- `Category.userId`: 必須（外部キー）

### 2. 参照整合性制約

- `Todo.userId` → `User.id` (CASCADE DELETE)
- `Todo.categoryId` → `Category.id` (SET NULL)
- `SubTask.todoId` → `Todo.id` (CASCADE DELETE)
- `Category.userId` → `User.id` (CASCADE DELETE)
- `Reminder.todoId` → `Todo.id` (CASCADE DELETE)

### 3. チェック制約

```sql
-- カテゴリの色は HEX 形式
ALTER TABLE "Category" ADD CONSTRAINT check_color_format
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- order は非負整数
ALTER TABLE "Todo" ADD CONSTRAINT check_order_positive
  CHECK (order >= 0);

ALTER TABLE "SubTask" ADD CONSTRAINT check_order_positive
  CHECK (order >= 0);
```

## マイグレーション戦略

### 1. 初期マイグレーション

```bash
# Prisma の初期設定
npx prisma init

# マイグレーションファイル作成
npx prisma migrate dev --name init

# クライアント生成
npx prisma generate
```

### 2. 開発環境でのマイグレーション

```bash
# 開発環境でのスキーマ変更
npx prisma migrate dev --name <変更内容>

# データベースリセット（開発時のみ）
npx prisma migrate reset
```

### 3. 本番環境でのマイグレーション

```bash
# 本番環境でのマイグレーション実行
npx prisma migrate deploy

# クライアント生成
npx prisma generate
```

## シーディング

### 1. 基本データ投入

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // デフォルトユーザー作成
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  })

  // デフォルトカテゴリ作成
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: '仕事',
        color: '#FF6B6B',
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        name: '個人',
        color: '#4ECDC4',
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        name: '学習',
        color: '#45B7D1',
        userId: user.id,
      },
    }),
  ])

  // サンプルタスク作成
  const todos = await Promise.all([
    prisma.todo.create({
      data: {
        title: 'プロジェクトの企画書作成',
        description: 'Q1のプロジェクト企画書を作成する',
        dueDate: new Date('2024-01-31'),
        isImportant: true,
        categoryId: categories[0].id,
        userId: user.id,
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Next.js の学習',
        description: 'App Router について学習する',
        dueDate: new Date('2024-02-15'),
        categoryId: categories[2].id,
        userId: user.id,
      },
    }),
  ])

  // サブタスク作成
  await prisma.subTask.create({
    data: {
      title: 'マーケット調査',
      todoId: todos[0].id,
      order: 1,
    },
  })

  await prisma.subTask.create({
    data: {
      title: '競合分析',
      todoId: todos[0].id,
      order: 2,
    },
  })

  console.log('Seeding completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### 2. シーディングスクリプト設定

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## パフォーマンス最適化

### 1. クエリ最適化

```typescript
// 効率的なクエリ例
const todos = await prisma.todo.findMany({
  where: {
    userId: user.id,
    isCompleted: false,
  },
  include: {
    category: {
      select: {
        name: true,
        color: true,
      },
    },
    subTasks: {
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
      orderBy: {
        order: 'asc',
      },
    },
  },
  orderBy: [{ isImportant: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
})
```

### 2. 接続プール設定

```env
# 接続プール設定
DATABASE_URL="postgresql://username:password@localhost:5432/todo_db?schema=public&connection_limit=10&pool_timeout=20"
```

### 3. バッチ処理

```typescript
// 複数のタスクを効率的に更新
await prisma.todo.updateMany({
  where: {
    userId: user.id,
    isCompleted: false,
    dueDate: {
      lt: new Date(),
    },
  },
  data: {
    isImportant: true,
  },
})
```

## セキュリティ

### 1. Row Level Security (RLS)

```sql
-- PostgreSQL RLS の設定例
ALTER TABLE "Todo" ENABLE ROW LEVEL SECURITY;

CREATE POLICY todo_user_isolation ON "Todo"
  USING (auth.uid() = "userId");
```

### 2. 環境変数管理

```env
# .env.local
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## 監視・ログ

### 1. クエリログ

```typescript
// Prisma クエリログ設定
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### 2. メトリクス収集

```typescript
// パフォーマンス監視
const startTime = Date.now()
const result = await prisma.todo.findMany(...)
const endTime = Date.now()

console.log(`Query took ${endTime - startTime}ms`)
```

## バックアップ戦略

### 1. 定期バックアップ

```bash
# PostgreSQL ダンプ
pg_dump -h localhost -U username -d todo_db > backup_$(date +%Y%m%d).sql

# 復元
psql -h localhost -U username -d todo_db < backup_20240101.sql
```

### 2. データ移行

```typescript
// データエクスポート
const exportData = async () => {
  const users = await prisma.user.findMany({
    include: {
      todos: {
        include: {
          subTasks: true,
          category: true,
        },
      },
      categories: true,
    },
  })

  return users
}
```

## 将来の拡張計画

### 1. フェーズ2: チーム機能

```prisma
model Team {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members TeamMember[]
  todos   Todo[]
}

model TeamMember {
  id     String @id @default(cuid())
  role   Role   @default(MEMBER)
  teamId String
  userId String

  team Team @relation(fields: [teamId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@unique([teamId, userId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}
```

### 2. フェーズ3: 添付ファイル機能

```prisma
model Attachment {
  id       String @id @default(cuid())
  fileName String
  fileUrl  String
  fileSize Int
  todoId   String

  todo Todo @relation(fields: [todoId], references: [id])
}
```

## トラブルシューティング

### 1. よくある問題

```bash
# マイグレーションエラーの解決
npx prisma migrate resolve --rolled-back <migration_name>

# スキーマ同期
npx prisma db push

# データベースリセット
npx prisma migrate reset --force
```

### 2. パフォーマンス問題

```typescript
// N+1 問題の解決
const todos = await prisma.todo.findMany({
  include: {
    subTasks: true, // 事前読み込み
    category: true, // 事前読み込み
  },
})
```

## 参考資料

- [Prisma ドキュメント](https://www.prisma.io/docs)
- [PostgreSQL ドキュメント](https://www.postgresql.org/docs/)
- [Next.js と Prisma の統合](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
