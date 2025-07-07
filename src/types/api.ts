export interface ApiResponse<T = unknown> {
  data: T
  error?: {
    code: string
    details?: unknown
    message: string
  }
  success: boolean
  timestamp: string
}

export interface ErrorDetails {
  field?: string
  message: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    hasNext: boolean
    hasPrev: boolean
    limit: number
    page: number
    total: number
    totalPages: number
  }
}

export interface TodoStats {
  assignedCount: number
  completedCount: number
  importantCount: number
  todayCount: number
  totalCount: number
  upcomingCount: number
}
