# Directory Structure Guide for Next.js 15 with App Router

## Technology Stack

- Next.js 15 with App Router
- TypeScript
- Zod (Schema validation)
- Zustand (State management)
- Prisma (Database ORM)
- Vitest (Testing framework)

## Root Directory Structure

```text
project-root/
├── app/                   # App Router pages and layouts
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── stores/                # Zustand state management
├── types/                 # TypeScript type definitions
├── schemas/               # Zod validation schemas
├── prisma/                # Database schema and migrations
├── tests/                 # Test files
├── public/                # Static assets
└── hooks/                 # Custom React hooks
```

## Detailed Directory Structure

### `/app` - App Router Structure

```text
app/
├── globals.css
├── layout.tsx            # Root layout
├── page.tsx              # Home page
├── loading.tsx           # Loading UI
├── error.tsx             # Error UI
├── not-found.tsx         # 404 page
├── (auth)/               # Route groups
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   └── settings/
│       └── page.tsx
└── api/                  # API routes
    ├── auth/
    │   └── route.ts
    └── users/
        └── route.ts
```

### `/components` - UI Components

```text
components/
├── ui/                  # Base UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── modal.tsx
│   └── index.ts         # Barrel exports
├── forms/               # Form components
│   ├── auth-form.tsx
│   └── user-form.tsx
├── layout/              # Layout components
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── footer.tsx
└── features/            # Feature-specific components
    ├── user-profile/
    │   ├── profile-card.tsx
    │   └── profile-settings.tsx
    └── dashboard/
        ├── stats-card.tsx
        └── recent-activity.tsx
```

### `/lib` - Utilities and Configurations

```text
lib/
├── db.ts                # Database connection
├── auth.ts              # Authentication utilities
├── utils.ts             # General utilities
├── constants.ts         # Application constants
├── validations.ts       # Shared validation logic
└── api.ts               # API client utilities
```

### `/stores` - Zustand State Management

```text
stores/
├── auth-store.ts        # Authentication state
├── user-store.ts        # User data state
├── ui-store.ts          # UI state (modals, themes)
└── index.ts             # Store exports
```

### `/types` - TypeScript Definitions

```text
types/
├── auth.ts              # Authentication types
├── user.ts              # User types
├── api.ts               # API response types
└── global.d.ts          # Global type declarations
```

### `/schemas` - Zod Validation Schemas

```text
schemas/
├── auth.ts              # Auth validation schemas
├── user.ts              # User validation schemas
├── api.ts               # API request/response schemas
└── index.ts             # Schema exports
```

### `/prisma` - Database

```text
prisma/
├── schema.prisma        # Database schema
├── migrations/          # Database migrations
├── seed.ts              # Database seeding
└── seed.js              # Compiled seed file
```

### `/tests` - Testing

```text
tests/
├── __mocks__/           # Mock files
├── setup.ts             # Test setup
├── components/          # Component tests
├── pages/               # Page tests
├── api/                 # API tests
└── utils/               # Utility tests
```

### `/hooks` - Custom React Hooks

```text
hooks/
├── use-auth.ts          # Authentication hook
├── use-local-storage.ts # Local storage hook
├── use-debounce.ts      # Debounce hook
└── index.ts             # Hook exports
```

## Naming Conventions

### Files and Folders

- Use kebab-case for folder names: `user-profile/`
- Use kebab-case for component files: `user-card.tsx`
- Use PascalCase for component names: `UserCard`
- Use camelCase for utility functions: `formatDate`

### Components

- Component files should match component names
- Use descriptive names: `UserProfileCard` not `Card`
- Group related components in folders

### API Routes

- Use RESTful conventions
- Folder names should be plural: `users/`, `posts/`
- Use `route.ts` for API handlers in App Router

## Best Practices

### Import Organization

```typescript
// 1. React and Next.js imports
import { useState } from 'react'
import { NextResponse } from 'next/server'

// 2. External libraries
import { z } from 'zod'
import { useStore } from 'zustand'

// 3. Internal imports (absolute paths)
import { Button } from '@/components/ui/button'
import { userSchema } from '@/schemas/user'
import { useAuthStore } from '@/stores/auth-store'

// 4. Relative imports
import './styles.css'
```

### Barrel Exports

Use `index.ts` files for clean imports:

```typescript
// components/ui/index.ts
export { Button } from './button'
export { Input } from './input'
export { Modal } from './modal'

// Usage
import { Button, Input, Modal } from '@/components/ui'
```

### Configuration Files Location

- Place config files in root: `next.config.ts`, `tailwind.config.ts`
- Environment files: `.env.local`, `.env.example`
- Tool configs: `.eslintrc.json`, `prettier.config.js`, `vitest.config.ts`

### State Management Pattern

```typescript
// stores/user-store.ts
import { create } from 'zustand'
import { userSchema } from '@/schemas/user'

interface UserState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
```

### Schema Validation Pattern

```typescript
// schemas/user.ts
import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
})

export type User = z.infer<typeof userSchema>
```

This structure provides clear separation of concerns, maintainability, and scalability for Next.js applications using the specified technology stack.
