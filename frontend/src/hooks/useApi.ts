import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi, memberApi, cookieApi, taskApi, logApi } from '../services/api'
import type { CreateWorkspaceRequest, CreateMemberRequest, CreateCookieRequest, Cookie, BulkCreateMemberRequest } from '../types'
import { useState, useMemo } from 'react'

// Query Keys
export const queryKeys = {
  workspaces: ['workspaces'] as const,
  workspace: (id: string) => ['workspace', id] as const,
  members: ['members'] as const,
  member: (id: string) => ['member', id] as const,
  membersByWorkspace: (workspaceId: string) => ['members', 'workspace', workspaceId] as const,
  cookies: ['cookies'] as const,
  cookie: (id: string) => ['cookie', id] as const,
  notifications: (page: number, limit: number) => ['notifications', page, limit] as const,
  logs: ['logs'] as const,
  logsByLevel: (level: string) => ['logs', 'level', level] as const,
}

// Workspace hooks
export function useWorkspaces() {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: () => workspaceApi.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateWorkspaceRequest) => workspaceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWorkspaceRequest> }) => 
      workspaceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workspaceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })

  return {
    workspaces: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createWorkspace: createMutation.mutateAsync,
    updateWorkspace: (id: string, data: Partial<CreateWorkspaceRequest>) => 
      updateMutation.mutateAsync({ id, data }),
    deleteWorkspace: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Member hooks
export function useMembers() {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: queryKeys.members,
    queryFn: () => memberApi.getAll(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateMemberRequest) => memberApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })

  const bulkCreateMutation = useMutation({
    mutationFn: (data: BulkCreateMemberRequest) => memberApi.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMemberRequest> }) => 
      memberApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })

  return {
    members: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createMember: createMutation.mutateAsync,
    bulkCreateMembers: bulkCreateMutation.mutateAsync,
    updateMember: (id: string, data: Partial<CreateMemberRequest>) => 
      updateMutation.mutateAsync({ id, data }),
    deleteMember: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Hook for members by workspace
export function useMembersByWorkspace(workspaceId: string) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: queryKeys.membersByWorkspace(workspaceId),
    queryFn: () => memberApi.getByWorkspaceId(workspaceId),
    enabled: !!workspaceId, // Only run query if workspaceId is provided
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateMemberRequest) => memberApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.membersByWorkspace(workspaceId) })
    },
  })

  const bulkCreateMutation = useMutation({
    mutationFn: (data: BulkCreateMemberRequest) => memberApi.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.membersByWorkspace(workspaceId) })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMemberRequest> }) => 
      memberApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.membersByWorkspace(workspaceId) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.membersByWorkspace(workspaceId) })
    },
  })

  const deleteAllMutation = useMutation({
    mutationFn: () => memberApi.deleteAllByWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.membersByWorkspace(workspaceId) })
    },
  })

  return {
    members: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createMember: createMutation.mutateAsync,
    bulkCreateMembers: bulkCreateMutation.mutateAsync,
    updateMember: (id: string, data: Partial<CreateMemberRequest>) => 
      updateMutation.mutateAsync({ id, data }),
    deleteMember: deleteMutation.mutateAsync,
    deleteAllMembers: deleteAllMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeletingAll: deleteAllMutation.isPending,
  }
}

// Cookie hooks
export function useCookies() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.cookies,
    queryFn: () => cookieApi.getAll(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateCookieRequest) => cookieApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cookies })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCookieRequest> }) => 
      cookieApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cookies })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cookieApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cookies })
    },
  })

  const bulkCreateMutation = useMutation({
    mutationFn: (data: CreateCookieRequest[]) => cookieApi.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cookies })
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => cookieApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cookies })
    },
  })

  const validateMutation = useMutation({
    mutationFn: (id: string) => cookieApi.validate(id),
  })

  return {
    cookies: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createCookie: createMutation.mutateAsync,
    updateCookie: (id: string, data: Partial<CreateCookieRequest>) => 
      queryClient.setQueryData(queryKeys.cookie(id), (old: Cookie | undefined) => {
        if (!old) return old
        return { ...old, ...data }
      }),
    deleteCookie: deleteMutation.mutateAsync,
    bulkCreateCookies: bulkCreateMutation.mutateAsync,
    bulkDeleteCookies: bulkDeleteMutation.mutateAsync,
    validateCookie: validateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isValidating: validateMutation.isPending,
  }
}

// Hook for active cookies only
export function useActiveCookies() {
  const query = useQuery({
    queryKey: [...queryKeys.cookies, 'active'],
    queryFn: () => cookieApi.getActive(),
    refetchInterval: 30000,
  })

  return {
    activeCookies: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

// Hook for error cookies
export function useErrorCookies() {
  const query = useQuery({
    queryKey: [...queryKeys.cookies, 'error'],
    queryFn: () => cookieApi.getError(),
    refetchInterval: 30000,
  })

  return {
    errorCookies: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

// Hook for cookie by email
export function useCookieByEmail(email: string) {
  const query = useQuery({
    queryKey: [...queryKeys.cookies, 'email', email],
    queryFn: () => cookieApi.getByEmail(email),
    enabled: !!email,
  })

  return {
    cookie: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

// Hook for cookie stats
export function useCookieStats() {
  const { cookies } = useCookies()

  const stats = useMemo(() => {
    const total = cookies.length
    const active = cookies.filter(cookie => cookie.value !== 'error').length
    const error = cookies.filter(cookie => cookie.value === 'error').length
    const recentlyAdded = cookies.filter(cookie => {
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      return new Date(cookie.createdAt || '') > oneDayAgo
    }).length

    return { total, active, error, recentlyAdded }
  }, [cookies])

  return stats
}

// Hook for cookie export
export function useCookieExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportToCsv = async () => {
    try {
      setLoading(true)
      setError(null)
      const blob = await cookieApi.exportCsv()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cookies-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export cookies'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    exportToCsv,
    loading,
    error
  }
}

// Invite hook
export function useInvite() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteMembers = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await taskApi.invite()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite members'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    inviteMembers,
    loading,
    error
  }
}

// Logs hooks with server-side pagination
export function useLogs(limit = 100, offset = 0) {
  const query = useQuery({
    queryKey: [...queryKeys.logs, limit, offset],
    queryFn: () => logApi.getPaginated(limit, offset),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  })

  const cleanupMutation = useMutation({
    mutationFn: (days: number) => logApi.cleanup(days),
    onSuccess: () => {
      query.refetch()
    },
  })

  return {
    paginatedLogs: query.data,
    logs: query.data?.data || [],
    total: query.data?.total || 0,
    totalPages: query.data?.totalPages || 0,
    currentPage: query.data?.page || 1,
    hasNext: query.data?.hasNext || false,
    hasPrev: query.data?.hasPrev || false,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    cleanup: cleanupMutation.mutateAsync,
    isCleaningUp: cleanupMutation.isPending,
  }
}

// Hook for all logs (for stats calculation)
export function useAllLogs() {
  const query = useQuery({
    queryKey: [...queryKeys.logs, 'all'],
    queryFn: () => logApi.getAll(),
    refetchInterval: 60000, // Refresh less frequently for stats
  })

  return {
    allLogs: query.data || [],
    loading: query.isLoading,
    error: query.error,
  }
}

// Hook for logs by level
export function useLogsByLevel(level: string) {
  const query = useQuery({
    queryKey: queryKeys.logsByLevel(level),
    queryFn: () => logApi.getByLevel(level),
    enabled: level !== 'all',
    refetchInterval: 30000,
  })

  return {
    logs: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}