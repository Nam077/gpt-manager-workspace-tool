import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../services/api'
import type { Notification } from '../types'
import toast from 'react-hot-toast'

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...notificationKeys.lists(), { page, limit }] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  byType: (type: string) => [...notificationKeys.all, 'type', type] as const,
}

// Hook to get notifications with pagination
export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: notificationKeys.list(page, limit),
    queryFn: () => notificationApi.getAll(page, limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto refetch every 30 seconds
  })
}

// Hook to get unread notifications
export function useUnreadNotifications(limit = 50) {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationApi.getUnread(limit),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000, // Auto refetch every 10 seconds
  })
}

// Hook to get notifications by type
export function useNotificationsByType(type: string, limit = 50) {
  return useQuery({
    queryKey: notificationKeys.byType(type),
    queryFn: () => notificationApi.getByType(type, limit),
    enabled: !!type,
    staleTime: 30 * 1000,
  })
}

// Hook to mark notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: (updatedNotification) => {
      // Update the notification in all relevant queries
      queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
        if (!old) return old
        return old.filter(n => n.id !== updatedNotification.id)
      })

      // Update paginated lists
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      
      toast.success('Đã đánh dấu đã đọc')
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error)
      toast.error('Không thể đánh dấu đã đọc')
    },
  })
}

// Hook to mark all notifications as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      // Clear unread notifications
      queryClient.setQueryData<Notification[]>(notificationKeys.unread(), [])
      
      // Invalidate all notification queries to refresh data
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      
      toast.success('Đã đánh dấu tất cả đã đọc')
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error)
      toast.error('Không thể đánh dấu tất cả đã đọc')
    },
  })
}

// Hook to delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificationApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from unread notifications
      queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
        if (!old) return old
        return old.filter(n => n.id !== deletedId)
      })

      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      
      toast.success('Đã xóa thông báo')
    },
    onError: (error) => {
      console.error('Failed to delete notification:', error)
      toast.error('Không thể xóa thông báo')
    },
  })
}

// Hook to cleanup old notifications
export function useCleanupNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (days: number) => notificationApi.cleanup(days),
    onSuccess: (deletedCount) => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      
      toast.success(`Đã xóa ${deletedCount} thông báo cũ`)
    },
    onError: (error) => {
      console.error('Failed to cleanup notifications:', error)
      toast.error('Không thể dọn dẹp thông báo cũ')
    },
  })
} 