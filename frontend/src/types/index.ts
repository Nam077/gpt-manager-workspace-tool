export interface Member {
  id: number
  email: string
  createdAt: string
  updatedAt: string
  workspaceId: number
  workspace?: Workspace
}

export interface Workspace {
  id: number
  email: string
  maxSlots: number
  createdAt: string
  updatedAt: string
  members: Member[]
}

export interface Log {
  id: number
  level: string
  message: string
  additionalInfo?: string
  createdAt: string
  updatedAt: string
}

export interface Cookie {
  id: number
  email: string // Primary field matching backend
  value: string
  createdAt: string
  updatedAt: string
  // Computed properties from backend
  name?: string // Computed from email
  domain?: string // Computed from email domain
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

// API Request types
export interface CreateWorkspaceRequest {
  email: string
  maxSlots: number
}

export interface CreateMemberRequest {
  email: string
  workspaceId?: number
}

export interface CreateCookieRequest {
  email: string // Match backend field name
  value: string
}

// Add new interfaces for cookie operations
export interface CookieValidationResult {
  isValid: boolean
  cookie: Cookie
}

export interface CookieBulkDeleteResult {
  deleted: number
  errors: string[]
}

export interface CookieStats {
  total: number
  active: number
  error: number
  recentlyAdded: number
}