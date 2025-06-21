import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Notification } from '../types'
import { notificationKeys } from './useNotifications'
import { notificationManager } from '../utils/notificationManager'

export function useNotificationManager() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  // Update connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(notificationManager.getConnectionStatus())
    }
    
    // Check initial connection
    checkConnection()
    
    // Set up periodic check (every 5 seconds)
    const interval = setInterval(checkConnection, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Handle notifications and update React Query cache
      const handleNotification = useCallback((notification: Notification | { type: string; id?: string }) => {
    if ('type' in notification && notification.type === 'all-read') {
      // Handle all notifications read
      queryClient.setQueryData<Notification[]>(notificationKeys.unread(), [])
      queryClient.setQueryData<{ data: Notification[] }>(notificationKeys.lists(), (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map(n => ({ ...n, isRead: true }))
        }
      })
      return
    }

    if ('id' in notification && !('message' in notification)) {
      // Handle notification read or deleted
      const id = notification.id
      
      // Remove from unread notifications
      queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
        if (!old) return old
        return old.filter(n => n.id !== id)
      })

      // Update or remove from all notifications list
      queryClient.setQueryData<{ data: Notification[] }>(notificationKeys.lists(), (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map(n => n.id === id ? { ...n, isRead: true } : n)
        }
      })
      return
    }

    // Handle new notification
    if ('message' in notification) {
      // Add to unread notifications
      queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
        if (!old) return [notification]
        return [notification, ...old]
      })

      // Invalidate all notification queries to refresh data
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
    }
  }, [queryClient])

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notificationManager.onNotification(handleNotification)
    
    return unsubscribe
  }, [handleNotification])

  return {
    isConnected,
  }
} 