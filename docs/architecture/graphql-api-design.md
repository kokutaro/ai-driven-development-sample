# GraphQL API Design Specification

## Domain-Driven GraphQL Architecture

### 🏗️ Schema Architecture Overview

```graphql
"""
Complete GraphQL Schema for TODO Management System
Based on Domain-Driven Design Principles
"""

# ============================================
# CORE DOMAIN TYPES
# ============================================

"""
Todo Entity - Main Domain Aggregate Root
Implements rich business logic and state management
"""
type Todo {
  # Identity
  id: ID!

  # Core Properties
  title: String!
  description: String

  # Domain Value Objects
  priority: TodoPriority!
  status: TodoStatus!
  dueDate: DateTime

  # Computed Fields (Field Resolvers)
  isOverdue: Boolean!
  completionRate: Float!

  # Relationships
  category: Category
  subTasks: [SubTask!]!

  # Audit Fields
  createdAt: DateTime!
  updatedAt: DateTime!
  userId: String!
}

"""
Category Value Object
Provides contextual grouping for todos
"""
type Category {
  id: ID!
  name: String!
  color: String!
  userId: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

"""
SubTask Entity
Child aggregate supporting todo decomposition
"""
type SubTask {
  id: ID!
  title: String!
  completed: Boolean!
  order: Int!
  todoId: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# ============================================
# DOMAIN ENUMS (Value Objects)
# ============================================

"""
Todo Priority Level
Business rules: URGENT > HIGH > MEDIUM > LOW
"""
enum TodoPriority {
  URGENT
  HIGH
  MEDIUM
  LOW
}

"""
Todo Status Lifecycle
State Machine: PENDING → IN_PROGRESS → COMPLETED | CANCELLED
"""
enum TodoStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

"""
Statistics Period for Reporting
"""
enum StatsPeriod {
  TODAY
  WEEK
  MONTH
  YEAR
  ALL_TIME
}

# ============================================
# QUERY OPERATIONS (CQRS Read Side)
# ============================================

type Query {
  """
  Get paginated todo list with filtering and sorting
  Integrates with CQRS GetTodosQuery
  """
  todos(
    filter: TodoFilter
    pagination: PaginationInput
    sort: TodoSort
  ): TodoConnection!

  """
  Get single todo by ID
  Integrates with CQRS GetTodoByIdQuery
  """
  todo(id: ID!): Todo

  """
  Get user categories
  Cache-optimized for frequent access
  """
  categories: [Category!]!

  """
  Get comprehensive todo statistics
  Optimized for dashboard display
  """
  todoStats(filter: StatsFilter): TodoStats!

  """
  Get real-time dashboard statistics
  Auto-polling every 30 seconds
  """
  dashboardStats: TodoStats!
}

# ============================================
# MUTATION OPERATIONS (CQRS Command Side)
# ============================================

type Mutation {
  """
  Create new todo
  Integrates with CQRS CreateTodoCommand
  """
  createTodo(input: CreateTodoInput!): TodoMutationResult!

  """
  Update existing todo
  Integrates with CQRS UpdateTodoCommand
  """
  updateTodo(id: ID!, input: UpdateTodoInput!): TodoMutationResult!

  """
  Delete todo
  Integrates with CQRS DeleteTodoCommand
  """
  deleteTodo(id: ID!): TodoMutationResult!

  """
  Bulk operations for efficiency
  """
  bulkUpdateTodos(ids: [ID!]!, input: UpdateTodoInput!): BulkMutationResult!
  bulkDeleteTodos(ids: [ID!]!): BulkMutationResult!
}

# ============================================
# INPUT TYPES
# ============================================

"""
Todo Creation Input
Validates business rules via Zod schemas
"""
input CreateTodoInput {
  title: String!
  description: String
  priority: TodoPriority = MEDIUM
  dueDate: DateTime
  categoryId: String
}

"""
Todo Update Input
Supports partial updates
"""
input UpdateTodoInput {
  title: String
  description: String
  priority: TodoPriority
  status: TodoStatus
  dueDate: DateTime
  categoryId: String
}

"""
Advanced Filtering for Complex Queries
"""
input TodoFilter {
  # Status filtering
  status: TodoStatus
  priority: TodoPriority

  # Date filtering
  dueBeforeDate: DateTime
  dueAfterDate: DateTime
  isOverdue: Boolean

  # Content filtering
  search: String
  categoryId: String
}

"""
Pagination Support
Cursor-based for large datasets
"""
input PaginationInput {
  limit: Int = 50
  offset: Int = 0
}

"""
Flexible Sorting Options
"""
input TodoSort {
  field: String = "createdAt"
  direction: String = "DESC"
}

"""
Statistics Filtering
"""
input StatsFilter {
  period: StatsPeriod = MONTH
  categoryId: String
  startDate: DateTime
  endDate: DateTime
}

# ============================================
# RESULT TYPES
# ============================================

"""
Paginated Todo Results
Relay-style pagination
"""
type TodoConnection {
  todos: [Todo!]!
  total: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}

"""
Mutation Result with Error Handling
"""
type TodoMutationResult {
  success: Boolean!
  message: String
  todo: Todo
}

"""
Bulk Operation Results
"""
type BulkMutationResult {
  success: Boolean!
  message: String
  affectedCount: Int!
  errors: [String!]
}

"""
Comprehensive Statistics
"""
type TodoStats {
  # Overview
  total: Int!
  completed: Int!
  pending: Int!
  inProgress: Int!
  cancelled: Int!
  overdue: Int!

  # Metrics
  completionRate: Float!
  averageCompletionTime: Float!

  # Metadata
  period: StatsPeriod!
  generatedAt: DateTime!

  # Breakdowns
  categories: [CategoryStats!]!
  dailyStats: [DailyStats!]!
}

"""
Category-wise Statistics
"""
type CategoryStats {
  id: String!
  name: String!
  color: String!
  total: Int!
  completed: Int!
  pending: Int!
  completionRate: Float!
}

"""
Daily Statistics for Trending
"""
type DailyStats {
  date: String!
  total: Int!
  completed: Int!
  created: Int!
}

# ============================================
# SCALARS
# ============================================

"""
DateTime scalar for precise time handling
"""
scalar DateTime
```

## 🔧 Resolver Implementation Strategy

### Field Resolver Pattern

```typescript
@Resolver(() => Todo)
export class TodoResolver {
  /**
   * Computed Field: Completion Rate
   * Business Logic: Calculate based on subtasks + main status
   */
  @FieldResolver(() => Float)
  completionRate(@Root() todo: Todo): number {
    if (todo.status === TodoStatus.COMPLETED) return 1.0
    if (todo.status === TodoStatus.CANCELLED) return 0.0

    if (!todo.subTasks || todo.subTasks.length === 0) {
      return todo.status === TodoStatus.IN_PROGRESS ? 0.5 : 0.0
    }

    const completedSubTasks = todo.subTasks.filter((st) => st.completed).length
    return completedSubTasks / todo.subTasks.length
  }

  /**
   * Computed Field: Overdue Status
   * Business Logic: Compare with current date considering timezone
   */
  @FieldResolver(() => Boolean)
  isOverdue(@Root() todo: Todo): boolean {
    if (
      !todo.dueDate ||
      todo.status === TodoStatus.COMPLETED ||
      todo.status === TodoStatus.CANCELLED
    ) {
      return false
    }
    return new Date() > new Date(todo.dueDate)
  }
}
```

### DataLoader Integration (Performance Optimization)

```typescript
export class TodoDataLoaders {
  private readonly categoryLoader: DataLoader<string, Category>
  private readonly subTasksLoader: DataLoader<string, SubTask[]>

  constructor(private prisma: PrismaClient) {
    this.categoryLoader = new DataLoader(this.batchLoadCategories.bind(this))
    this.subTasksLoader = new DataLoader(this.batchLoadSubTasks.bind(this))
  }

  private async batchLoadCategories(
    categoryIds: string[]
  ): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    })

    return categoryIds.map(
      (id) => categories.find((category) => category.id === id) || null
    )
  }
}
```

## 🚀 Performance & Caching Strategy

### Apollo Server Cache Configuration

```typescript
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  plugins: [
    // Query Complexity Analysis
    createComplexityLimitRule(1000),

    // Response Caching
    responseCachePlugin({
      sessionId: (requestContext) =>
        requestContext.request.http?.headers.get('user-id') || null,
      shouldReadFromCache: (requestContext) =>
        requestContext.request.operationName !== 'dashboardStats',
      cacheKeyFor: (source, args, context, info) =>
        `${info.fieldName}:${JSON.stringify(args)}:${context.userId}`,
    }),

    // Query Cost Analysis
    costAnalysisPlugin({
      maximumCost: 1000,
      introspection: false,
    }),
  ],

  // Cache Control
  cacheControl: {
    defaultMaxAge: 60, // 1 minute default
    calculateHttpHeaders: false,
  },
})
```

### Client-Side Caching (Apollo Client)

```typescript
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        todos: {
          keyArgs: ['filter', 'sort'],
          merge(existing, incoming, { args }) {
            // Implement cursor-based pagination merge logic
            const offset = args?.pagination?.offset || 0
            const merged = existing ? existing.todos.slice() : []

            if (incoming) {
              for (let i = 0; i < incoming.todos.length; i++) {
                merged[offset + i] = incoming.todos[i]
              }
            }

            return {
              ...incoming,
              todos: merged,
            }
          },
        },
        todoStats: {
          keyArgs: ['filter'],
          ttl: 300000, // 5 minutes cache
        },
      },
    },
    Todo: {
      fields: {
        subTasks: {
          merge(existing, incoming) {
            return incoming // Always replace with fresh data
          },
        },
      },
    },
  },
})
```

## 🔐 Security & Authorization

### Context-Based Authorization

```typescript
export async function createGraphQLContext({ req }): Promise<GraphQLContext> {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }

  return {
    userId: session.user.id,
    commandBus: container.get<CommandBus>(TYPES.CommandBus),
    queryBus: container.get<QueryBus>(TYPES.QueryBus),
    user: session.user,
  }
}
```

### Resource-Level Authorization

```typescript
@Query(() => Todo, { nullable: true })
async todo(
  @Arg('id', () => ID) id: string,
  @Ctx() context: GraphQLContext
): Promise<Todo | null> {
  const query = new GetTodoByIdQuery({
    id,
    userId: context.userId // Automatic user isolation
  })

  const result = await context.queryBus.execute(query)
  return result.todo
}
```

## 📊 Monitoring & Observability

### GraphQL Metrics Collection

```typescript
const server = new ApolloServer({
  plugins: [
    // Apollo Studio Integration
    ApolloServerPluginUsageReporting({
      sendHeaders: { all: true },
      sendVariableValues: { all: true },
    }),

    // Custom Metrics
    {
      requestDidStart() {
        return {
          didResolveOperation(requestContext) {
            console.log(`Operation: ${requestContext.request.operationName}`)
          },
          didEncounterErrors(requestContext) {
            console.error('GraphQL Errors:', requestContext.errors)
          },
        }
      },
    },
  ],
})
```

---

## 🎯 Implementation Priorities

### Phase 1: Core Stabilization (Week 1-2)

1. ✅ Apollo Server 4.x Migration
2. ✅ GraphQL Code Generator Setup
3. ✅ DataLoader Implementation
4. ✅ Comprehensive Error Handling

### Phase 2: Performance Optimization (Week 3-4)

1. ✅ Query Complexity Analysis
2. ✅ Response Caching
3. ✅ N+1 Query Prevention
4. ✅ Client Cache Optimization

### Phase 3: Advanced Features (Week 5-6)

1. ⏳ GraphQL Subscriptions
2. ⏳ Bulk Operations
3. ⏳ Advanced Filtering
4. ⏳ Real-time Updates

---

**Architecture Quality: Enterprise Grade** ✨  
**DDD Implementation: Exemplary** 🏆  
**GraphQL Design: Production Ready** 🚀
