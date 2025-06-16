import axios from 'axios'
import type { 
  Workspace, 
  Member, 
  Cookie,
  Log,
  CreateWorkspaceRequest, 
  CreateMemberRequest, 
  CreateCookieRequest 
} from '../types'

const API_BASE_URL = 'http://192.168.2.28:3232'

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

  // Create new workspace
  create: (data: CreateWorkspaceRequest): Promise<Workspace> =>
    api.post('/workspace', data).then(response => response.data),

  // Update workspace
  update: (id: number, data: Partial<CreateWorkspaceRequest>): Promise<Workspace> =>
    api.patch(`/workspace/${id}`, data).then(response => response.data),

  // Delete workspace
  delete: (id: number): Promise<void> =>
    api.delete(`/workspace/${id}`).then(response => response.data),

  // Get workspace by ID
  getById: (id: number): Promise<Workspace> =>
    api.get(`/workspace/${id}`).then(response => response.data),
}

// Member API
export const memberApi = {
  // Get all members
  getAll: (): Promise<Member[]> =>
    api.get('/member').then(response => response.data),

  // Get members by workspace ID
  getByWorkspaceId: (workspaceId: number): Promise<Member[]> =>
    api.get(`/member/workspace/${workspaceId}`).then(response => response.data),

  // Create new member
  create: (data: CreateMemberRequest): Promise<Member> =>
    api.post('/member', data).then(response => response.data),

  // Update member
  update: (id: number, data: Partial<CreateMemberRequest>): Promise<Member> =>
    api.put(`/member/${id}`, data).then(response => response.data),

  // Delete member
  delete: (id: number): Promise<void> =>
    api.delete(`/member/${id}`).then(response => response.data),

  // Get member by ID
  getById: (id: number): Promise<Member> =>
    api.get(`/member/${id}`).then(response => response.data),
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
  update: (id: number, data: Partial<CreateCookieRequest>): Promise<Cookie> =>
    api.put(`/cookie/${id}`, data).then(response => response.data),

  // Delete cookie
  delete: (id: number): Promise<void> =>
    api.delete(`/cookie/${id}`).then(response => response.data),

  // Get cookie by ID
  getById: (id: number): Promise<Cookie> =>
    api.get(`/cookie/${id}`).then(response => response.data),

  // Get cookie by email
  getByEmail: (email: string): Promise<Cookie> =>
    api.get(`/cookie/email/${email}`).then(response => response.data),

  // Delete cookie by email
  deleteByEmail: (email: string): Promise<void> =>
    api.delete(`/cookie/email/${email}`).then(response => response.data),

  // Get active cookies (non-error cookies)
  getActive: (): Promise<Cookie[]> =>
    api.get('/cookie/status/active').then(response => response.data),

  // Get error cookies
  getError: (): Promise<Cookie[]> =>
    api.get('/cookie/status/error').then(response => response.data),

  // Validate cookie
  validate: (id: number): Promise<{ isValid: boolean; cookie: Cookie }> =>
    api.post(`/cookie/validate/${id}`).then(response => response.data),

  // Bulk create cookies
  bulkCreate: (data: CreateCookieRequest[]): Promise<Cookie[]> =>
    api.post('/cookie/bulk-create', data).then(response => response.data),

  // Bulk delete cookies
  bulkDelete: (ids: number[]): Promise<{ deleted: number; errors: string[] }> =>
    api.delete('/cookie/bulk-delete', { data: ids }).then(response => response.data),

  // Export cookies to CSV
  exportCsv: (): Promise<Blob> =>
    api.get('/cookie/export-csv', { responseType: 'blob' }).then(response => response.data),
}

// Task API (for invite functionality)
export const taskApi = {
  // Invite members
  invite: (): Promise<string[]> =>
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

export default api