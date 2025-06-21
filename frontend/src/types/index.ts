export interface Member {
  id: string
  email: string
  createdAt: string
  updatedAt: string
  workspaceId: string
  workspace?: Workspace
}

export interface Workspace {
  id: string
  email: string
  maxSlots: number
  createdAt: string
  updatedAt: string
  members: Member[]
}

export interface Log {
  id: string
  level: string
  message: string
  additionalInfo?: string
  createdAt: string
  updatedAt: string
}

export interface Cookie {
  id: string
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
  workspaceId?: string
}

export interface BulkCreateMemberRequest {
  emails: string[]
  workspaceId: string
}

export interface BulkCreateMemberResponse {
  created: Member[]
  skipped: string[]
  errors: string[]
  totalFound: number
  summary: string
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

// Invite response interface
export interface InviteResponse {
  status: string
  invitedCount: number
  invitedEmails: string[]
}

// Console log types for real-time logging
export interface ConsoleLogMessage {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug' | 'log'
  message: string
  context?: string
  source: 'console' | 'winston'
  additionalInfo?: unknown
}

export interface ConsoleLogStatus {
  interceptorActive: boolean
  connectedClients: number
  bufferSize: number
}

// Notification types
export interface Notification {
  id: string
  type: 'user_removed_pending' | 'user_removed_main' | 'cookie_expired' | 'users_invited'
  adminEmail: string
  targetEmail?: string
  message: string
  additionalInfo?: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedNotificationResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface CreateNotificationRequest {
  type: 'user_removed_pending' | 'user_removed_main' | 'cookie_expired'
  adminEmail: string
  targetEmail?: string
  message: string
  additionalInfo?: string
  isRead?: boolean
}

export interface SearchEmailsRequest {
  emails: string[]
}

export interface SearchEmailsResponse {
  found: Array<{
    email: string
    member: Member
    workspace: {
      id: string
      email: string
      maxSlots: number
      currentMembers: number
    }
  }>
  notFound: string[]
}

export interface AutoAssignEmailsRequest {
  emails: string[]
}

export interface AutoAssignEmailsResponse {
  assigned: Array<{
    email: string
    workspaceId: string
    workspaceEmail: string
  }>
  failed: Array<{
    email: string
    reason: string
  }>
  summary: string
}