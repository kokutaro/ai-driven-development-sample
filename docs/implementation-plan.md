# 📋 TODOシステム実装プラン - 詳細ドキュメント

## 📑 目次

- [📑 目次](#-目次)
- [📖 エグゼクティブサマリー](#-エグゼクティブサマリー)
  - [プロジェクト概要](#プロジェクト概要)
  - [主要目標](#主要目標)
  - [投資効果](#投資効果)
- [🔍 現状分析](#-現状分析)
  - [システム構成現状](#システム構成現状)
  - [強み分析](#強み分析)
  - [課題分析](#課題分析)
- [🏗️ 目標アーキテクチャ](#️-目標アーキテクチャ)
  - [アーキテクチャ原則](#アーキテクチャ原則)
  - [システム構成図](#システム構成図)
- [🛣️ 実装ロードマップ](#️-実装ロードマップ)
  - [Phase 1: 基盤アーキテクチャ (Week 1-4)](#phase-1-基盤アーキテクチャ-week-1-4)
    - [1.1 Domain Layer 実装](#11-domain-layer-実装)
    - [1.2 CQRS Implementation](#12-cqrs-implementation)
    - [1.3 Event System Setup](#13-event-system-setup)
  - [Phase 2: API Layer Enhancement (Week 5-8)](#phase-2-api-layer-enhancement-week-5-8)
    - [2.1 GraphQL API 実装](#21-graphql-api-実装)
    - [2.2 高性能キャッシュシステム](#22-高性能キャッシュシステム)
  - [Phase 3: Performance \& Scalability (Week 9-12)](#phase-3-performance--scalability-week-9-12)
    - [3.1 データベース最適化](#31-データベース最適化)
    - [3.2 リアルタイム同期システム](#32-リアルタイム同期システム)
  - [Phase 4: Security Architecture (Week 13-16)](#phase-4-security-architecture-week-13-16)
    - [4.1 多層防御セキュリティ](#41-多層防御セキュリティ)
    - [4.2 暗号化サービス](#42-暗号化サービス)
- [🔄 マイグレーション戦略](#-マイグレーション戦略)
  - [Strangler Fig Pattern Implementation](#strangler-fig-pattern-implementation)
  - [データマイグレーション](#データマイグレーション)
- [🧪 品質保証](#-品質保証)
  - [テスト戦略](#テスト戦略)
    - [Unit Tests](#unit-tests)
    - [Integration Tests](#integration-tests)
    - [Performance Tests](#performance-tests)
  - [CI/CD Pipeline](#cicd-pipeline)
- [📊 監視・運用](#-監視運用)
  - [Observability Stack](#observability-stack)
  - [Health Checks](#health-checks)
- [📈 成功指標](#-成功指標)
  - [Technical KPIs](#technical-kpis)
  - [Business KPIs](#business-kpis)
  - [Development KPIs](#development-kpis)
- [⚠️ リスク管理](#️-リスク管理)
  - [Technical Risks](#technical-risks)
    - [High Risk](#high-risk)
    - [Medium Risk](#medium-risk)
  - [Business Risks](#business-risks)
    - [High Risk](#high-risk-1)
  - [Monitoring \& Alerting](#monitoring--alerting)
- [📅 実装チェックリスト](#-実装チェックリスト)
  - [Phase 1: Foundation (Week 1-4)](#phase-1-foundation-week-1-4)
  - [Phase 2: API Enhancement (Week 5-8)](#phase-2-api-enhancement-week-5-8)
  - [Phase 3: Performance (Week 9-12)](#phase-3-performance-week-9-12)
  - [Phase 4: Security (Week 13-16)](#phase-4-security-week-13-16)
- [📋 まとめ](#-まとめ)
  - [主要成果物](#主要成果物)
  - [期待される投資効果](#期待される投資効果)

---

## 📖 エグゼクティブサマリー

### プロジェクト概要

TODOシステムの包括的アーキテクチャリファクタリングを通じて、エンタープライズグレードのスケーラビリティ、パフォーマンス、セキュリティを実現します。

### 主要目標

- **パフォーマンス**: レスポンス時間を50%改善 (現在300ms → 目標150ms)
- **スケーラビリティ**: 同時ユーザー数を10倍増加対応 (現在100 → 目標1,000)
- **保守性**: コードベースの複雑性を30%削減
- **セキュリティ**: SOC2 Type II準拠レベルのセキュリティ実装

### 投資効果

- **開発速度**: 新機能開発時間を40%短縮
- **運用コスト**: インフラコストを25%削減
- **障害対応**: MTTR (平均復旧時間) を60%短縮

---

## 🔍 現状分析

### システム構成現状

```text
現在のアーキテクチャ:
├── Frontend: Next.js 15 + Mantine + Zustand
├── Backend: Next.js API Routes + Prisma
├── Database: PostgreSQL
├── Authentication: NextAuth.js
└── Testing: Vitest + Testing Library
```

### 強み分析

- ✅ **堅牢な型安全性**: TypeScript + Zod統合
- ✅ **包括的テストカバレッジ**: 全レイヤーでの体系的テスト
- ✅ **モダンUI**: Mantine Component Library採用
- ✅ **拡張性実証**: Kanban、MCP、APIキー管理機能

### 課題分析

- 🔴 **モノリシック構造**: ビジネスロジックの散在
- 🔴 **パフォーマンス**: N+1問題、キャッシュ戦略不備
- 🔴 **スケーラビリティ**: 単一インスタンス依存
- 🔴 **複雑性**: 機能追加に伴う設計負債

---

## 🏗️ 目標アーキテクチャ

### アーキテクチャ原則

1. **Domain-First Design**: ビジネスロジック中心の設計
2. **Hexagonal Architecture**: ポート&アダプターパターン
3. **Event-Driven Architecture**: 非同期処理とスケーラビリティ
4. **CQRS Pattern**: 読み書き最適化の分離
5. **Microservices Ready**: 将来的な分散化対応

### システム構成図

```mermaid
graph TB
    UI[React/Next.js UI] --> GW[API Gateway]
    GW --> CMD[Command Handlers]
    GW --> QRY[Query Handlers]
    CMD --> DOM[Domain Layer]
    QRY --> READ[Read Models]
    DOM --> EVT[Event Store]
    EVT --> PROJ[Projections]
    PROJ --> READ
    DOM --> REPO[Repositories]
    REPO --> DB[(PostgreSQL)]
    EVT --> CACHE[(Redis)]
```

---

## 🛣️ 実装ロードマップ

### Phase 1: 基盤アーキテクチャ (Week 1-4)

#### 1.1 Domain Layer 実装

**目標**: ビジネスロジックの中央集権化

**実装ステップ**:

```typescript
// Step 1: Domain Entities
src/domain/
├── entities/
│   ├── todo.entity.ts
│   ├── user.entity.ts
│   └── category.entity.ts
├── value-objects/
│   ├── todo-id.ts
│   ├── user-id.ts
│   └── priority.ts
└── events/
    ├── todo-created.event.ts
    ├── todo-completed.event.ts
    └── todo-updated.event.ts
```

**実装例**:

```typescript
// src/domain/entities/todo.entity.ts
export class TodoEntity {
  private constructor(
    private readonly props: TodoProps,
    private readonly _id: TodoId,
    private _domainEvents: DomainEvent[] = []
  ) {}

  public static create(props: CreateTodoProps): TodoEntity {
    const todo = new TodoEntity(
      {
        ...props,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      TodoId.create()
    )

    todo.addDomainEvent(new TodoCreatedEvent(todo._id, props.userId))
    return todo
  }

  public complete(): void {
    if (this.props.isCompleted) {
      throw new DomainError('Todo is already completed')
    }

    this.props.isCompleted = true
    this.props.completedAt = new Date()
    this.props.updatedAt = new Date()

    this.addDomainEvent(new TodoCompletedEvent(this._id, this.props.userId))
  }

  public markAsImportant(): void {
    if (this.props.isCompleted) {
      throw new DomainError('Cannot mark completed todo as important')
    }

    this.props.isImportant = true
    this.props.updatedAt = new Date()

    this.addDomainEvent(new TodoMarkedImportantEvent(this._id))
  }

  // Getters
  public get id(): TodoId {
    return this._id
  }
  public get title(): string {
    return this.props.title
  }
  public get isCompleted(): boolean {
    return this.props.isCompleted
  }
  public get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents
  }
}
```

#### 1.2 CQRS Implementation

**目標**: コマンド・クエリ責任分離

**ディレクトリ構造**:

```typescript
src/application/
├── commands/
│   ├── create-todo/
│   │   ├── create-todo.command.ts
│   │   ├── create-todo.handler.ts
│   │   └── create-todo.handler.test.ts
│   ├── update-todo/
│   └── complete-todo/
├── queries/
│   ├── get-todos/
│   │   ├── get-todos.query.ts
│   │   ├── get-todos.handler.ts
│   │   └── get-todos.handler.test.ts
│   └── get-todo-stats/
└── services/
    ├── command-bus.ts
    ├── query-bus.ts
    └── event-bus.ts
```

**実装例**:

```typescript
// src/application/commands/create-todo/create-todo.command.ts
export class CreateTodoCommand {
  constructor(
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly dueDate: Date | undefined,
    public readonly categoryId: string | undefined,
    public readonly userId: string
  ) {}
}

// src/application/commands/create-todo/create-todo.handler.ts
@CommandHandler(CreateTodoCommand)
export class CreateTodoCommandHandler {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly eventBus: EventBus
  ) {}

  async handle(command: CreateTodoCommand): Promise<TodoId> {
    const todo = TodoEntity.create({
      title: command.title,
      description: command.description,
      dueDate: command.dueDate,
      categoryId: command.categoryId,
      userId: command.userId,
    })

    await this.todoRepository.save(todo)
    await this.eventBus.publishAll(todo.domainEvents)

    return todo.id
  }
}
```

#### 1.3 Event System Setup

**目標**: イベントドリブンアーキテクチャ基盤

**実装チェックリスト**:

- [ ] Event Store 実装
- [ ] Event Bus 実装
- [ ] Domain Event Base Class
- [ ] Event Handlers Registration
- [ ] Event Serialization/Deserialization

### Phase 2: API Layer Enhancement (Week 5-8)

#### 2.1 GraphQL API 実装

**目標**: 効率的なデータフェッチング

**設定ファイル**:

```typescript
// src/graphql/schema.ts
import { buildSchema } from 'graphql'

export const typeDefs = `
  type Todo {
    id: ID!
    title: String!
    description: String
    dueDate: DateTime
    isImportant: Boolean!
    isCompleted: Boolean!
    category: Category
    subTasks: [SubTask!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    todos(filter: TodoFilter, pagination: Pagination): TodoConnection!
    todo(id: ID!): Todo
    todoStats(period: StatsPeriod!): TodoStats!
  }

  type Mutation {
    createTodo(input: CreateTodoInput!): CreateTodoPayload!
    updateTodo(id: ID!, input: UpdateTodoInput!): UpdateTodoPayload!
    completeTodo(id: ID!): CompleteTodoPayload!
    deleteTodo(id: ID!): DeleteTodoPayload!
  }

  type Subscription {
    todoUpdated(userId: ID!): Todo!
    todoCompleted(userId: ID!): TodoCompletedNotification!
  }
`

// src/graphql/resolvers/todo.resolver.ts
export const todoResolvers = {
  Query: {
    todos: async (_, { filter, pagination }, { queryBus, userId }) => {
      const query = new GetTodosQuery(userId, filter, pagination)
      return await queryBus.execute(query)
    },
    todo: async (_, { id }, { queryBus, userId }) => {
      const query = new GetTodoQuery(id, userId)
      return await queryBus.execute(query)
    },
  },
  Mutation: {
    createTodo: async (_, { input }, { commandBus, userId }) => {
      const command = new CreateTodoCommand(
        input.title,
        input.description,
        input.dueDate,
        input.categoryId,
        userId
      )
      const todoId = await commandBus.execute(command)
      return { todo: await getTodoById(todoId) }
    },
  },
}
```

#### 2.2 高性能キャッシュシステム

**目標**: レスポンス時間50%改善

**実装戦略**:

```typescript
// src/lib/cache/cache-manager.ts
export class CacheManager {
  constructor(
    private readonly redisClient: Redis,
    private readonly memoryCache: MemoryCache
  ) {}

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.buildKey(key, options)

    // L1: Memory Cache (1-5ms)
    if (options.useMemoryCache) {
      const memoryResult = await this.memoryCache.get<T>(cacheKey)
      if (memoryResult) {
        this.recordCacheHit('memory', cacheKey)
        return memoryResult
      }
    }

    // L2: Redis Cache (5-20ms)
    const redisResult = await this.redisClient.get(cacheKey)
    if (redisResult) {
      const parsed = JSON.parse(redisResult) as T

      if (options.useMemoryCache) {
        await this.memoryCache.set(cacheKey, parsed, { ttl: 60 })
      }

      this.recordCacheHit('redis', cacheKey)
      return parsed
    }

    this.recordCacheMiss(cacheKey)
    return null
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheSetOptions = {}
  ): Promise<void> {
    const cacheKey = this.buildKey(key, options)
    const serialized = JSON.stringify(value)

    // Set in Redis with TTL
    await this.redisClient.setex(cacheKey, options.ttl || 3600, serialized)

    // Set in Memory Cache if enabled
    if (options.useMemoryCache) {
      await this.memoryCache.set(cacheKey, value, {
        ttl: Math.min(options.ttl || 3600, 300),
      })
    }

    // Tag for invalidation
    if (options.tags) {
      await this.addCacheTagMapping(cacheKey, options.tags)
    }
  }

  async invalidateTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      const keys = await this.getCacheKeysByTag(tag)
      if (keys.length > 0) {
        await this.redisClient.del(...keys)
        await this.memoryCache.deleteMany(keys)
      }
    }
  }
}

// Cache Strategy Example
export class TodoCacheStrategy {
  constructor(private readonly cacheManager: CacheManager) {}

  async getTodos(userId: string, filter: TodoFilter): Promise<Todo[]> {
    const cacheKey = `todos:${userId}:${this.hashFilter(filter)}`

    let todos = await this.cacheManager.get<Todo[]>(cacheKey, {
      useMemoryCache: true,
      ttl: 300, // 5 minutes
    })

    if (!todos) {
      todos = await this.loadTodosFromDatabase(userId, filter)
      await this.cacheManager.set(cacheKey, todos, {
        ttl: 300,
        useMemoryCache: true,
        tags: [`user:${userId}:todos`, 'todos:all'],
      })
    }

    return todos
  }

  async invalidateUserTodos(userId: string): Promise<void> {
    await this.cacheManager.invalidateTags([`user:${userId}:todos`])
  }
}
```

### Phase 3: Performance & Scalability (Week 9-12)

#### 3.1 データベース最適化

**目標**: クエリパフォーマンス向上

**インデックス戦略**:

```sql
-- High Performance Indexes
CREATE INDEX CONCURRENTLY idx_todo_user_status_priority
ON "Todo" (userId, isCompleted, isImportant)
WHERE isCompleted = false;

CREATE INDEX CONCURRENTLY idx_todo_user_due_date
ON "Todo" (userId, dueDate)
WHERE dueDate IS NOT NULL AND isCompleted = false;

CREATE INDEX CONCURRENTLY idx_todo_category_status
ON "Todo" (categoryId, isCompleted)
WHERE categoryId IS NOT NULL;

-- Partial Indexes for Common Queries
CREATE INDEX CONCURRENTLY idx_todo_important_pending
ON "Todo" (userId, createdAt DESC)
WHERE isImportant = true AND isCompleted = false;

CREATE INDEX CONCURRENTLY idx_todo_today_tasks
ON "Todo" (userId, dueDate)
WHERE dueDate >= CURRENT_DATE AND dueDate < CURRENT_DATE + INTERVAL '1 day';
```

**クエリ最適化**:

```typescript
// src/infrastructure/repositories/optimized-todo.repository.ts
export class OptimizedTodoRepository implements TodoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserWithFilter(
    userId: string,
    filter: TodoFilter,
    pagination: Pagination
  ): Promise<TodoListResult> {
    // Build optimized where clause
    const whereClause = this.buildOptimizedWhere(userId, filter)

    // Execute optimized query with proper includes
    const [todos, total] = await Promise.all([
      this.prisma.todo.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
          subTasks: {
            select: { id: true, title: true, isCompleted: true },
            orderBy: { order: 'asc' },
            take: 5, // Limit subtasks
          },
          _count: {
            select: { subTasks: true },
          },
        },
        orderBy: this.buildOptimizedOrderBy(filter.sort),
        skip: pagination.offset,
        take: pagination.limit,
      }),
      this.prisma.todo.count({ where: whereClause }),
    ])

    return {
      todos: todos.map(this.mapToEntity),
      total,
      hasNext: pagination.offset + pagination.limit < total,
    }
  }

  private buildOptimizedWhere(
    userId: string,
    filter: TodoFilter
  ): Prisma.TodoWhereInput {
    const base: Prisma.TodoWhereInput = { userId }

    // Use database-level filtering for better performance
    if (filter.status === 'completed') {
      base.isCompleted = true
    } else if (filter.status === 'pending') {
      base.isCompleted = false
    }

    if (filter.isImportant) {
      base.isImportant = true
    }

    if (filter.dueDate) {
      base.dueDate = {
        gte: filter.dueDate.start,
        lte: filter.dueDate.end,
      }
    }

    if (filter.categoryId) {
      base.categoryId = filter.categoryId
    }

    return base
  }
}
```

#### 3.2 リアルタイム同期システム

**目標**: 複数デバイス間でのリアルタイム同期

**WebSocket実装**:

```typescript
// src/lib/realtime/websocket-server.ts
export class WebSocketServer {
  private readonly connections = new Map<string, WebSocket>()
  private readonly userConnections = new Map<string, Set<string>>()

  constructor(
    private readonly eventBus: EventBus,
    private readonly authService: AuthService
  ) {
    this.setupEventHandlers()
  }

  async handleConnection(
    ws: WebSocket,
    request: IncomingMessage
  ): Promise<void> {
    const token = this.extractToken(request)
    const user = await this.authService.validateToken(token)

    if (!user) {
      ws.close(1008, 'Authentication failed')
      return
    }

    const connectionId = this.generateConnectionId()

    this.connections.set(connectionId, ws)
    this.addUserConnection(user.id, connectionId)

    ws.on('close', () => {
      this.connections.delete(connectionId)
      this.removeUserConnection(user.id, connectionId)
    })

    ws.on('message', (data) => {
      this.handleMessage(connectionId, user.id, data)
    })

    // Send initial connection success
    this.sendToConnection(connectionId, {
      type: 'connected',
      payload: { userId: user.id, connectionId },
    })
  }

  private setupEventHandlers(): void {
    this.eventBus.subscribe(TodoCreatedEvent, async (event) => {
      await this.broadcastToUser(event.userId, {
        type: 'todo_created',
        payload: event.todo,
      })
    })

    this.eventBus.subscribe(TodoUpdatedEvent, async (event) => {
      await this.broadcastToUser(event.userId, {
        type: 'todo_updated',
        payload: event.todo,
      })
    })

    this.eventBus.subscribe(TodoCompletedEvent, async (event) => {
      await this.broadcastToUser(event.userId, {
        type: 'todo_completed',
        payload: { todoId: event.todoId, completedAt: event.completedAt },
      })
    })
  }

  private async broadcastToUser(
    userId: string,
    message: WebSocketMessage
  ): Promise<void> {
    const connectionIds = this.userConnections.get(userId)
    if (!connectionIds) return

    const promises = Array.from(connectionIds).map((connectionId) =>
      this.sendToConnection(connectionId, message)
    )

    await Promise.allSettled(promises)
  }
}
```

### Phase 4: Security Architecture (Week 13-16)

#### 4.1 多層防御セキュリティ

**目標**: SOC2 Type II準拠

**セキュリティミドルウェア**:

```typescript
// src/lib/security/security.middleware.ts
export class SecurityMiddleware {
  constructor(
    private readonly rateLimiter: RateLimiter,
    private readonly inputValidator: InputValidator,
    private readonly auditLogger: AuditLogger,
    private readonly encryptionService: EncryptionService
  ) {}

  async validateRequest(
    request: ApiRequest
  ): Promise<SecurityValidationResult> {
    const startTime = Date.now()

    try {
      // 1. Rate Limiting
      await this.rateLimiter.checkLimit(request.clientId, request.endpoint)

      // 2. Input Validation & Sanitization
      const sanitizedInput = await this.inputValidator.sanitizeAndValidate(
        request.body,
        request.schema
      )

      // 3. Authentication & Authorization
      const authResult = await this.validateAuth(request)

      // 4. RBAC Permission Check
      await this.checkPermissions(
        authResult.user,
        request.resource,
        request.action
      )

      // 5. Data Encryption (if required)
      const processedData = await this.encryptSensitiveFields(sanitizedInput)

      // 6. Audit Logging
      await this.auditLogger.logRequest({
        userId: authResult.user.id,
        endpoint: request.endpoint,
        action: request.action,
        timestamp: new Date(),
        ip: request.ip,
        userAgent: request.userAgent,
        success: true,
        duration: Date.now() - startTime,
      })

      return {
        success: true,
        user: authResult.user,
        sanitizedData: processedData,
      }
    } catch (error) {
      await this.auditLogger.logSecurityEvent({
        type: 'security_violation',
        error: error.message,
        endpoint: request.endpoint,
        ip: request.ip,
        timestamp: new Date(),
      })

      throw error
    }
  }
}

// src/lib/security/rbac.service.ts
export class RBACService {
  private readonly permissions: Map<Role, Set<Permission>> = new Map()

  constructor() {
    this.initializePermissions()
  }

  async checkPermission(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId)

    for (const role of userRoles) {
      const rolePermissions = this.permissions.get(role)
      if (rolePermissions?.has(new Permission(resource, action))) {
        return true
      }
    }

    return false
  }

  private initializePermissions(): void {
    // Admin permissions
    this.permissions.set(
      Role.ADMIN,
      new Set([
        new Permission(Resource.TODO, Action.CREATE),
        new Permission(Resource.TODO, Action.READ),
        new Permission(Resource.TODO, Action.UPDATE),
        new Permission(Resource.TODO, Action.DELETE),
        new Permission(Resource.USER, Action.READ),
        new Permission(Resource.ANALYTICS, Action.READ),
      ])
    )

    // User permissions
    this.permissions.set(
      Role.USER,
      new Set([
        new Permission(Resource.TODO, Action.CREATE),
        new Permission(Resource.TODO, Action.READ),
        new Permission(Resource.TODO, Action.UPDATE),
        new Permission(Resource.TODO, Action.DELETE),
      ])
    )
  }
}
```

#### 4.2 暗号化サービス

**目標**: 機密データの保護

```typescript
// src/lib/security/encryption.service.ts
export class EncryptionService {
  constructor(
    private readonly keyManager: KeyManager,
    private readonly cipher: AESCipher
  ) {}

  async encryptField(
    value: string,
    fieldType: FieldType
  ): Promise<EncryptedField> {
    const key = await this.keyManager.getCurrentKey(fieldType)
    const encrypted = await this.cipher.encrypt(value, key)

    return {
      value: encrypted.ciphertext,
      keyId: key.id,
      algorithm: 'AES-256-GCM',
      iv: encrypted.iv,
    }
  }

  async decryptField(field: EncryptedField): Promise<string> {
    const key = await this.keyManager.getKey(field.keyId)
    return await this.cipher.decrypt(field.value, key, field.iv)
  }

  async rotateKeys(): Promise<void> {
    const newKey = await this.keyManager.generateNewKey()

    // Encrypt new data with new key
    await this.keyManager.setCurrentKey(newKey)

    // Background job to re-encrypt existing data
    await this.scheduleReencryption(newKey)
  }
}
```

---

## 🔄 マイグレーション戦略

### Strangler Fig Pattern Implementation

**段階的移行アプローチ**:

```typescript
// src/lib/migration/feature-toggle.service.ts
export class FeatureToggleService {
  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService
  ) {}

  async shouldUseNewImplementation(
    userId: string,
    feature: FeatureName
  ): Promise<boolean> {
    const config = await this.configService.getFeatureConfig(feature)

    if (config.enabled === false) return false
    if (config.enabled === true) return true

    // Gradual rollout based on user segment
    const userSegment = await this.getUserSegment(userId)
    const rolloutPercentage = config.rolloutPercentage[userSegment] || 0

    const userHash = this.hashUser(userId, feature)
    const shouldEnable = userHash < rolloutPercentage

    // Record metrics
    await this.metricsService.recordFeatureToggle(
      feature,
      shouldEnable,
      userSegment
    )

    return shouldEnable
  }
}

// Migration Router Example
export async function routeTodoRequest(
  request: ApiRequest
): Promise<ApiResponse> {
  const useNewAPI = await featureToggleService.shouldUseNewImplementation(
    request.userId,
    'cqrs_todo_api'
  )

  if (useNewAPI) {
    return await newTodoHandler.handle(request)
  } else {
    return await legacyTodoHandler.handle(request)
  }
}
```

### データマイグレーション

```typescript
// src/lib/migration/data-migrator.ts
export class DataMigrator {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventStore: EventStore,
    private readonly logger: Logger
  ) {}

  async migrateToEventSourcing(options: MigrationOptions = {}): Promise<void> {
    const batchSize = options.batchSize || 1000
    let offset = 0
    let totalMigrated = 0

    this.logger.info('Starting data migration to event sourcing')

    while (true) {
      const todos = await this.prisma.todo.findMany({
        skip: offset,
        take: batchSize,
        include: {
          subTasks: true,
          category: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      if (todos.length === 0) break

      await this.migrateBatch(todos)

      totalMigrated += todos.length
      offset += batchSize

      this.logger.info(`Migrated ${totalMigrated} todos`, {
        batch: Math.ceil(totalMigrated / batchSize),
        progress: `${offset} processed`,
      })

      // Rate limiting to avoid overwhelming the system
      await this.sleep(options.delayMs || 100)
    }

    this.logger.info(`Migration completed. Total migrated: ${totalMigrated}`)
  }

  private async migrateBatch(todos: Todo[]): Promise<void> {
    const events: DomainEvent[] = []

    for (const todo of todos) {
      // Create creation event
      events.push(
        new TodoCreatedEvent(
          todo.id,
          todo.userId,
          {
            title: todo.title,
            description: todo.description,
            dueDate: todo.dueDate,
            categoryId: todo.categoryId,
          },
          todo.createdAt
        )
      )

      // Create update events based on current state
      if (todo.isImportant) {
        events.push(new TodoMarkedImportantEvent(todo.id, todo.updatedAt))
      }

      if (todo.isCompleted) {
        events.push(
          new TodoCompletedEvent(todo.id, todo.userId, todo.updatedAt)
        )
      }

      // Create subtask events
      for (const subTask of todo.subTasks) {
        events.push(
          new SubTaskCreatedEvent(
            subTask.id,
            todo.id,
            subTask.title,
            subTask.createdAt
          )
        )

        if (subTask.isCompleted) {
          events.push(new SubTaskCompletedEvent(subTask.id, subTask.updatedAt))
        }
      }
    }

    await this.eventStore.saveEvents(events)
  }
}
```

---

## 🧪 品質保証

### テスト戦略

#### Unit Tests

```typescript
// src/domain/entities/todo.entity.test.ts
describe('TodoEntity', () => {
  describe('complete', () => {
    it('should complete todo and emit TodoCompletedEvent', () => {
      // Arrange
      const todo = TodoEntity.create({
        title: 'Test Todo',
        userId: 'user-1',
      })

      // Act
      todo.complete()

      // Assert
      expect(todo.isCompleted).toBe(true)
      expect(todo.completedAt).toBeDefined()
      expect(todo.domainEvents).toHaveLength(2) // Created + Completed
      expect(todo.domainEvents[1]).toBeInstanceOf(TodoCompletedEvent)
    })

    it('should throw error when trying to complete already completed todo', () => {
      // Arrange
      const todo = TodoEntity.create({
        title: 'Test Todo',
        userId: 'user-1',
      })
      todo.complete()

      // Act & Assert
      expect(() => todo.complete()).toThrow('Todo is already completed')
    })
  })
})
```

#### Integration Tests

```typescript
// src/application/commands/create-todo/create-todo.handler.integration.test.ts
describe('CreateTodoCommandHandler Integration', () => {
  let handler: CreateTodoCommandHandler
  let todoRepository: TodoRepository
  let eventBus: EventBus

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      providers: [
        CreateTodoCommandHandler,
        { provide: TodoRepository, useClass: InMemoryTodoRepository },
        { provide: EventBus, useClass: InMemoryEventBus },
      ],
    }).compile()

    handler = testModule.get(CreateTodoCommandHandler)
    todoRepository = testModule.get(TodoRepository)
    eventBus = testModule.get(EventBus)
  })

  it('should create todo and publish events', async () => {
    // Arrange
    const command = new CreateTodoCommand(
      'Integration Test Todo',
      'Description',
      new Date(),
      'category-1',
      'user-1'
    )

    // Act
    const todoId = await handler.handle(command)

    // Assert
    const savedTodo = await todoRepository.findById(todoId)
    expect(savedTodo).toBeDefined()
    expect(savedTodo!.title).toBe(command.title)

    // Verify event was published
    const publishedEvents = await eventBus.getPublishedEvents()
    expect(publishedEvents).toHaveLength(1)
    expect(publishedEvents[0]).toBeInstanceOf(TodoCreatedEvent)
  })
})
```

#### Performance Tests

```typescript
// src/performance/todo-api.performance.test.ts
describe('Todo API Performance', () => {
  it('should handle 1000 concurrent todo creations within 5 seconds', async () => {
    const startTime = Date.now()
    const promises: Promise<Response>[] = []

    for (let i = 0; i < 1000; i++) {
      promises.push(
        fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Performance Test Todo ${i}`,
            description: 'Performance test description',
          }),
        })
      )
    }

    const responses = await Promise.all(promises)
    const endTime = Date.now()

    // Assert all requests succeeded
    responses.forEach((response) => {
      expect(response.status).toBe(200)
    })

    // Assert completion time
    const duration = endTime - startTime
    expect(duration).toBeLessThan(5000) // 5 seconds

    console.log(`Performance test completed in ${duration}ms`)
  })
})
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: todo_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run type checking
        run: yarn typecheck

      - name: Run linting
        run: yarn lint

      - name: Run unit tests
        run: yarn test:unit --coverage

      - name: Run integration tests
        run: yarn test:integration
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/todo_test

      - name: Run performance tests
        run: yarn test:performance

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run security audit
        run: yarn audit

      - name: Run SAST scan
        uses: github/super-linter@v4
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          # Deployment script
          echo "Deploying to staging environment"

      - name: Run smoke tests
        run: yarn test:smoke --env=staging

      - name: Deploy to production
        if: success()
        run: |
          # Production deployment script
          echo "Deploying to production environment"
```

---

## 📊 監視・運用

### Observability Stack

```typescript
// src/lib/observability/metrics.service.ts
export class MetricsService {
  private readonly prometheus = new PrometheusRegistry()

  // Application Metrics
  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
  })

  private readonly todoOperations = new Counter({
    name: 'todo_operations_total',
    help: 'Total number of todo operations',
    labelNames: ['operation', 'status'],
  })

  private readonly cacheOperations = new Counter({
    name: 'cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'result'],
  })

  // Business Metrics
  private readonly activeTodos = new Gauge({
    name: 'active_todos_count',
    help: 'Number of active todos',
    labelNames: ['user_segment'],
  })

  async recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): Promise<void> {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration / 1000)
  }

  async recordTodoOperation(
    operation: string,
    success: boolean
  ): Promise<void> {
    this.todoOperations.labels(operation, success ? 'success' : 'error').inc()
  }

  async updateActiveTodos(userSegment: string, count: number): Promise<void> {
    this.activeTodos.labels(userSegment).set(count)
  }
}

// src/lib/observability/tracing.service.ts
export class TracingService {
  private readonly tracer = opentelemetry.trace.getTracer('todo-app')

  async traceOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string | number>
  ): Promise<T> {
    const span = this.tracer.startSpan(operationName, {
      attributes: {
        'service.name': 'todo-app',
        'service.version': process.env.APP_VERSION || 'unknown',
        ...attributes,
      },
    })

    try {
      const result = await operation()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      })
      span.recordException(error)
      throw error
    } finally {
      span.end()
    }
  }
}
```

### Health Checks

```typescript
// src/lib/health/health.service.ts
export class HealthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
    private readonly eventStore: EventStore
  ) {}

  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkEventStore(),
      this.checkExternalServices(),
    ])

    const results: HealthCheckResult[] = checks.map((check, index) => {
      const names = ['database', 'cache', 'eventstore', 'external']
      return {
        name: names[index],
        status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        details:
          check.status === 'fulfilled'
            ? check.value
            : { error: check.reason.message },
        timestamp: new Date(),
      }
    })

    const overallStatus = results.every((r) => r.status === 'healthy')
      ? 'healthy'
      : 'unhealthy'

    return {
      status: overallStatus,
      timestamp: new Date(),
      checks: results,
    }
  }

  private async checkDatabase(): Promise<DatabaseHealth> {
    const start = Date.now()
    await this.prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start

    return {
      connected: true,
      responseTime,
      version: await this.getDatabaseVersion(),
    }
  }

  private async checkCache(): Promise<CacheHealth> {
    const start = Date.now()
    await this.redis.ping()
    const responseTime = Date.now() - start

    const info = await this.redis.info()

    return {
      connected: true,
      responseTime,
      memory: this.parseCacheMemoryInfo(info),
    }
  }
}
```

---

## 📈 成功指標

### Technical KPIs

| メトリクス                | 現在値  | 目標値   | 測定方法            |
| ------------------------- | ------- | -------- | ------------------- |
| API Response Time (P95)   | 300ms   | 150ms    | Application Metrics |
| Throughput                | 100 RPS | 1000 RPS | Load Testing        |
| Error Rate                | 0.5%    | 0.1%     | Error Monitoring    |
| Cache Hit Rate            | 60%     | 85%      | Cache Metrics       |
| Database Query Time (P95) | 100ms   | 50ms     | Database Monitoring |
| Memory Usage              | 512MB   | 256MB    | System Metrics      |
| CPU Usage (Average)       | 60%     | 30%      | System Metrics      |

### Business KPIs

| メトリクス                | 現在値 | 目標値 | 測定方法      |
| ------------------------- | ------ | ------ | ------------- |
| User Task Completion Rate | 70%    | 85%    | Analytics     |
| Feature Adoption (New)    | -      | 60%    | User Tracking |
| User Retention (30-day)   | 65%    | 80%    | Analytics     |
| Time to First Value       | 5 min  | 2 min  | User Journey  |

### Development KPIs

| メトリクス           | 現在値  | 目標値  | 測定方法            |
| -------------------- | ------- | ------- | ------------------- |
| Deployment Frequency | Weekly  | Daily   | CI/CD Metrics       |
| Lead Time            | 5 days  | 2 days  | Project Tracking    |
| MTTR                 | 4 hours | 1 hour  | Incident Metrics    |
| Test Coverage        | 80%     | 90%     | Testing Tools       |
| Code Review Time     | 2 days  | 4 hours | Development Metrics |

---

## ⚠️ リスク管理

### Technical Risks

#### High Risk

1. **Performance Degradation During Migration**
   - _Mitigation_: Blue-Green Deployment + Feature Flags
   - _Contingency_: Immediate Rollback Procedures

2. **Data Loss During Event Store Migration**
   - _Mitigation_: Complete Backup + Incremental Migration
   - _Contingency_: Point-in-Time Recovery Process

#### Medium Risk

1. **Cache Dependencies Failure**
   - _Mitigation_: Graceful Degradation + Circuit Breakers
   - _Contingency_: Cache Bypass Mode

2. **Third-party Service Outages**
   - _Mitigation_: Service Redundancy + Fallback Mechanisms
   - _Contingency_: Manual Override Procedures

### Business Risks

#### High Risk

1. **User Experience Disruption**
   - _Mitigation_: Gradual Rollout + User Testing
   - _Contingency_: User Communication + Support Escalation

2. **Feature Delivery Delays**
   - _Mitigation_: Agile Planning + Buffer Time
   - _Contingency_: Priority Reassessment

### Monitoring & Alerting

```typescript
// src/lib/monitoring/alerts.service.ts
export class AlertsService {
  constructor(private readonly notificationService: NotificationService) {}

  setupCriticalAlerts(): void {
    // Performance Alerts
    this.createAlert({
      name: 'High Response Time',
      condition: 'http_request_duration_p95 > 500ms',
      severity: 'critical',
      notification: ['slack', 'email', 'sms'],
    })

    this.createAlert({
      name: 'High Error Rate',
      condition: 'error_rate > 1%',
      severity: 'critical',
      notification: ['slack', 'email', 'sms'],
    })

    // Business Alerts
    this.createAlert({
      name: 'Low Todo Completion Rate',
      condition: 'completion_rate < 50%',
      severity: 'warning',
      notification: ['slack'],
    })

    // Infrastructure Alerts
    this.createAlert({
      name: 'Database Connection Issues',
      condition: 'database_health != "healthy"',
      severity: 'critical',
      notification: ['slack', 'email', 'sms'],
    })
  }
}
```

---

## 📅 実装チェックリスト

### Phase 1: Foundation (Week 1-4)

- [ ] Domain Entity Classes Implementation
- [ ] Value Objects Creation
- [ ] Domain Events Setup
- [ ] CQRS Command Handlers
- [ ] CQRS Query Handlers
- [ ] Event Bus Implementation
- [ ] Repository Pattern Implementation
- [ ] Unit Tests for Domain Layer
- [ ] Integration Tests for Application Layer

### Phase 2: API Enhancement (Week 5-8)

- [ ] GraphQL Schema Definition
- [ ] GraphQL Resolvers Implementation
- [ ] Cache Manager Implementation
- [ ] Redis Integration
- [ ] Memory Cache Implementation
- [ ] Cache Invalidation Strategy
- [ ] API Gateway Setup
- [ ] Rate Limiting Implementation
- [ ] API Documentation Update

### Phase 3: Performance (Week 9-12)

- [ ] Database Index Optimization
- [ ] Query Performance Tuning
- [ ] WebSocket Server Implementation
- [ ] Real-time Synchronization
- [ ] Load Balancer Configuration
- [ ] CDN Setup
- [ ] Performance Testing Suite
- [ ] Monitoring Dashboard

### Phase 4: Security (Week 13-16)

- [ ] RBAC System Implementation
- [ ] Field-Level Encryption
- [ ] Security Middleware
- [ ] Audit Logging System
- [ ] Penetration Testing
- [ ] Security Documentation
- [ ] Compliance Verification
- [ ] Security Training

---

## 📋 まとめ

この実装プランは、現在のTODOシステムの堅牢な基盤を活用しながら、エンタープライズグレードのスケーラビリティ、パフォーマンス、セキュリティを段階的に実現するための包括的なロードマップです。

### 主要成果物

- **Domain-Driven Design**: ビジネスロジックの明確な構造化
- **CQRS + Event Sourcing**: 読み書き最適化と拡張性
- **高性能キャッシュ**: 50%のパフォーマンス改善
- **セキュリティ強化**: SOC2準拠レベルの実装
- **運用効率化**: 自動化された監視・デプロイメント

### 期待される投資効果

- 開発速度40%向上
- 運用コスト25%削減
- MTTR 60%短縮
- エンタープライズレディなセキュリティ

このプランに従うことで、TODOシステムは次世代のタスク管理プラットフォームとして、企業環境でも十分に活用できる高品質なアプリケーションへと進化します。
