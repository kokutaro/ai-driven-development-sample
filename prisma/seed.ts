import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * データベースシーディング
 *
 * 開発環境用のサンプルデータを投入します。
 * - デフォルトユーザー
 * - カテゴリー
 * - サンプルタスク
 * - サブタスク
 */
async function main() {
  console.log('シーディング開始...')

  // 既存データを削除
  await prisma.reminder.deleteMany()
  await prisma.subTask.deleteMany()
  await prisma.todo.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // デフォルトユーザー作成
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      id: 'user-1',
      name: 'デモユーザー',
    },
  })

  console.log('ユーザー作成完了:', user.email)

  // デフォルトカテゴリ作成
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        color: '#FF6B6B',
        name: '仕事',
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        color: '#4ECDC4',
        name: '個人',
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        color: '#45B7D1',
        name: '学習',
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        color: '#FFD93D',
        name: '買い物',
        userId: user.id,
      },
    }),
  ])

  console.log('カテゴリ作成完了:', categories.length, '件')

  // 今日の日付
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 明日の日付
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 1週間後
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  // 昨日
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // サンプルタスク作成
  const todos = await Promise.all([
    // 今日のタスク
    prisma.todo.create({
      data: {
        categoryId: categories[0].id,
        description:
          'Q1のプロジェクト企画書を作成する。市場調査と競合分析を含める。',
        dueDate: today,
        isImportant: true,
        order: 1,
        title: 'プロジェクトの企画書作成',
        userId: user.id,
      },
    }),
    // 重要なタスク
    prisma.todo.create({
      data: {
        categoryId: categories[0].id,
        description:
          'クライアントとの重要な商談に向けて、プレゼン資料を準備する。',
        dueDate: tomorrow,
        isImportant: true,
        order: 2,
        title: 'クライアントミーティングの準備',
        userId: user.id,
      },
    }),
    // 学習タスク
    prisma.todo.create({
      data: {
        categoryId: categories[2].id,
        description:
          'Next.js App Router について学習する。公式ドキュメントを読む。',
        dueDate: nextWeek,
        order: 3,
        title: 'Next.js の学習',
        userId: user.id,
      },
    }),
    // 個人タスク
    prisma.todo.create({
      data: {
        categoryId: categories[1].id,
        description: '定期的な運動を習慣化する。週3回のジョギングから始める。',
        order: 4,
        title: '運動習慣をつける',
        userId: user.id,
      },
    }),
    // 買い物タスク
    prisma.todo.create({
      data: {
        categoryId: categories[3].id,
        dueDate: today,
        order: 5,
        title: '食材の買い出し',
        userId: user.id,
      },
    }),
    // 完了済みタスク
    prisma.todo.create({
      data: {
        categoryId: categories[0].id,
        description: '月次レポートの作成と提出を完了した。',
        dueDate: yesterday,
        isCompleted: true,
        order: 6,
        title: '月次レポート提出',
        userId: user.id,
      },
    }),
    // 期限切れタスク
    prisma.todo.create({
      data: {
        categoryId: categories[1].id,
        description: '歯科検診の予約を入れる。',
        dueDate: yesterday,
        isImportant: true,
        order: 7,
        title: '歯医者の予約',
        userId: user.id,
      },
    }),
  ])

  console.log('タスク作成完了:', todos.length, '件')

  // サブタスク作成
  await Promise.all([
    prisma.subTask.create({
      data: {
        order: 1,
        title: 'マーケット調査',
        todoId: todos[0].id,
      },
    }),
    prisma.subTask.create({
      data: {
        order: 2,
        title: '競合分析',
        todoId: todos[0].id,
      },
    }),
    prisma.subTask.create({
      data: {
        isCompleted: true,
        order: 3,
        title: '企画書テンプレートの準備',
        todoId: todos[0].id,
      },
    }),
    prisma.subTask.create({
      data: {
        order: 1,
        title: 'プレゼン資料の作成',
        todoId: todos[1].id,
      },
    }),
    prisma.subTask.create({
      data: {
        order: 2,
        title: 'デモの準備',
        todoId: todos[1].id,
      },
    }),
    prisma.subTask.create({
      data: {
        order: 1,
        title: '公式チュートリアルを完了',
        todoId: todos[2].id,
      },
    }),
    prisma.subTask.create({
      data: {
        order: 2,
        title: 'サンプルアプリを作成',
        todoId: todos[2].id,
      },
    }),
  ])

  console.log('サブタスク作成完了')

  // リマインダー作成
  await Promise.all([
    prisma.reminder.create({
      data: {
        reminderAt: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 今日の9時
        todoId: todos[0].id,
      },
    }),
    prisma.reminder.create({
      data: {
        reminderAt: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000), // 明日の8時
        todoId: todos[1].id,
      },
    }),
  ])

  console.log('リマインダー作成完了')
  console.log('シーディング完了！')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  })
