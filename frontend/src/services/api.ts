import axios from 'axios'
import type { 
  Workspace, 
  Member, 
  Cookie,
  Log,
  Notification,
  InviteResponse,
  PaginatedNotificationResponse,
  CreateWorkspaceRequest, 
  CreateMemberRequest, 
  BulkCreateMemberRequest,
  BulkCreateMemberResponse,
  SearchEmailsRequest,
  SearchEmailsResponse,
  AutoAssignEmailsRequest,
  AutoAssignEmailsResponse,
  CreateCookieRequest, 
  CookieBulkDeleteResult,
  CreateNotificationRequest
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3232'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Workspace API
export const workspaceApi = {
  // Get all workspaces
  getAll: (): Promise<Workspace[]> =>
    api.get('/workspace').then(response => response.data),

  // Get workspace list
  getList: (): Promise<{ message: string; data: Workspace[]; count: number }> =>
    api.get('/workspace/list').then(response => response.data),

  // Create new workspace
  create: (data: CreateWorkspaceRequest): Promise<Workspace> =>
    api.post('/workspace', data).then(response => response.data),

  // Update workspace
  update: (id: string, data: Partial<CreateWorkspaceRequest>): Promise<Workspace> =>
    api.patch(`/workspace/${id}`, data).then(response => response.data),

  // Delete workspace
  delete: (id: string): Promise<void> =>
    api.delete(`/workspace/${id}`).then(() => {}),

  // Get workspace by ID
  getById: (id: string): Promise<Workspace> =>
    api.get(`/workspace/${id}`).then(response => response.data),

  // Get workspace group
  group: (): Promise<unknown> =>
    api.get('/workspace/group').then(response => response.data),
}

// Member API
export const memberApi = {
  // Get all members
  getAll: (): Promise<Member[]> =>
    api.get('/member').then(response => response.data),

  // Get members by workspace ID
  getByWorkspaceId: (workspaceId: string): Promise<Member[]> =>
    api.get(`/member/workspace/${workspaceId}`).then(response => response.data),

  // Create new member
  create: (data: CreateMemberRequest): Promise<Member> =>
    api.post('/member', data).then(response => response.data),

  // Bulk create members from string
  bulkCreate: (data: BulkCreateMemberRequest): Promise<BulkCreateMemberResponse> =>
    api.post('/member/bulk', data).then(response => response.data),

  // Update member
  update: (id: string, data: Partial<CreateMemberRequest>): Promise<Member> =>
    api.patch(`/member/${id}`, data).then(response => response.data),

  // Delete member
  delete: (id: string): Promise<void> =>
    api.delete(`/member/${id}`).then(() => {}),

  // Get member by ID
  getById: (id: string): Promise<Member> =>
    api.get(`/member/${id}`).then(response => response.data),

  // Delete all members from workspace
  deleteAllByWorkspace: (workspaceId: string): Promise<{ deleted: number; message: string }> =>
    api.delete(`/member/workspace/${workspaceId}/all`).then(response => response.data),

  // Search emails across workspaces
  searchEmails: (data: SearchEmailsRequest): Promise<SearchEmailsResponse> =>
    api.post('/member/search', data).then(response => response.data),

  // Auto assign emails to available workspaces
  autoAssignEmails: (data: AutoAssignEmailsRequest): Promise<AutoAssignEmailsResponse> =>
    api.post('/member/auto-assign', data).then(response => response.data),
}

// Cookie API
export const cookieApi = {
  // Get all cookies
  getAll: (): Promise<Cookie[]> =>
    api.get('/cookie').then(response => response.data),

  // Create new cookie
  create: (data: CreateCookieRequest): Promise<Cookie> =>
    api.post('/cookie', data).then(response => response.data),

  // Update cookie
  update: (id: string, data: Partial<CreateCookieRequest>): Promise<Cookie> =>
    api.patch(`/cookie/${id}`, data).then(response => response.data),

  // Delete cookie
  delete: (id: string): Promise<void> =>
    api.delete(`/cookie/${id}`).then(() => {}),

  // Get cookie by ID
  getById: (id: string): Promise<Cookie> =>
    api.get(`/cookie/${id}`).then(response => response.data),

  // Get cookie by email
  getByEmail: (email: string): Promise<Cookie> =>
    api.get(`/cookie/email/${email}`).then(response => response.data),

  // Delete cookie by email
  deleteByEmail: (email: string): Promise<void> =>
    api.delete(`/cookie/email/${email}`).then(() => {}),

  // Get active cookies (non-error cookies)
  getActive: (): Promise<Cookie[]> =>
    api.get('/cookie/status/active').then(response => response.data),

  // Get error cookies
  getError: (): Promise<Cookie[]> =>
    api.get('/cookie/status/error').then(response => response.data),

  // Validate cookie
  validate: (id: string): Promise<{ isValid: boolean; cookie: Cookie }> =>
    api.get(`/cookie/${id}/validate`).then(response => response.data),

  // Bulk create cookies
  bulkCreate: (data: CreateCookieRequest[]): Promise<Cookie[]> =>
    api.post('/cookie/bulk-create', { cookies: data }).then(response => response.data),

  // Bulk delete cookies
  bulkDelete: (ids: string[]): Promise<CookieBulkDeleteResult> =>
    api.post('/cookie/bulk/delete', { ids }).then(response => response.data),

  // Export cookies to CSV
  exportCsv: (): Promise<Blob> =>
    api.get('/cookie/export/csv', { responseType: 'blob' }).then(response => response.data),
}

// Task API (for invite functionality)
export const taskApi = {
  // Invite members
  invite: (): Promise<InviteResponse> =>
    api.get('/task/invite').then(response => response.data),
}

// Paginated response interface
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Log API
export const logApi = {
  // Get all logs without pagination
  getAll: (): Promise<Log[]> =>
    api.get('/logs/all').then(response => response.data),

  // Get logs with pagination
  getPaginated: (limit = 100, offset = 0): Promise<PaginatedResponse<Log>> =>
    api.get(`/logs?limit=${limit}&offset=${offset}`).then(response => response.data),

  // Get logs by level
  getByLevel: (level: string, limit = 100, offset = 0): Promise<Log[]> =>
    api.get(`/logs/level/${level}?limit=${limit}&offset=${offset}`).then(response => response.data),

  // Cleanup old logs
  cleanup: (days = 30): Promise<{ deleted: number }> =>
    api.delete(`/logs/cleanup?days=${days}`).then(response => response.data),
}

// Notification API
export const notificationApi = {
  // Get all notifications with pagination
  getAll: (page = 1, limit = 20): Promise<PaginatedNotificationResponse<Notification>> =>
    api.get(`/notifications?page=${page}&limit=${limit}`).then(response => response.data),

  // Get unread notifications
  getUnread: (limit?: number): Promise<Notification[]> => {
    const params = limit ? `?limit=${limit}` : '';
    return api.get(`/notifications/unread${params}`).then(response => response.data);
  },

  // Get notifications by type
  getByType: (type: string, limit?: number): Promise<Notification[]> => {
    const params = limit ? `?limit=${limit}` : '';
    return api.get(`/notifications/type/${type}${params}`).then(response => response.data);
  },

  // Get notification by ID
  getById: (id: string): Promise<Notification> =>
    api.get(`/notifications/${id}`).then(response => response.data),

  // Create new notification
  create: (data: CreateNotificationRequest): Promise<Notification> =>
    api.post('/notifications', data).then(response => response.data),

  // Mark notification as read
  markAsRead: (id: string): Promise<Notification> =>
    api.patch(`/notifications/${id}/read`).then(response => response.data),

  // Mark all notifications as read
  markAllAsRead: (): Promise<void> =>
    api.patch('/notifications/read-all').then(response => response.data),

  // Delete notification
  delete: (id: string): Promise<void> =>
    api.delete(`/notifications/${id}`).then(() => {}),

  // Delete old notifications
  cleanup: (days = 30): Promise<number> =>
    api.delete(`/notifications/cleanup/${days}`).then(response => response.data),
}

export default api