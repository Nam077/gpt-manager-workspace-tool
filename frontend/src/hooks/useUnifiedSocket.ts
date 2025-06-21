import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Notification, ConsoleLogMessage } from '../types'
import { notificationKeys } from './useNotifications'
import { unifiedSocketManager } from '../utils/unifiedSocketManager'

// Hook for notifications using unified socket
export function useUnifiedNotifications() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  // Update connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(unifiedSocketManager.getNotificationSocketStatus())
    }
    
    // Check initial connection
    checkConnection()
    
    // Set up periodic check (every 5 seconds)
    const interval = setInterval(checkConnection, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Handle notifications and update React Query cache
  const handleNotification = useCallback((notification: Notification) => {
    // Add to unread notifications
    queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
      if (!old) return [notification]
      return [notification, ...old]
    })

    // Invalidate all notification queries to refresh data
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
  }, [queryClient])

  const handleNotificationRead = useCallback((data: { id: string }) => {
    const id = data.id
    
    // Remove from unread notifications
    queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
      if (!old) return old
      return old.filter(n => n.id !== id)
    })

    // Update in all notifications list
    queryClient.setQueryData<{ data: Notification[] }>(notificationKeys.lists(), (old) => {
      if (!old) return old
      return {
        ...old,
        data: old.data.map(n => n.id === id ? { ...n, isRead: true } : n)
      }
    })
  }, [queryClient])

  const handleAllNotificationsRead = useCallback(() => {
    // Clear unread notifications
    queryClient.setQueryData<Notification[]>(notificationKeys.unread(), [])
    
    // Update all notifications to read
    queryClient.setQueryData<{ data: Notification[] }>(notificationKeys.lists(), (old) => {
      if (!old) return old
      return {
        ...old,
        data: old.data.map(n => ({ ...n, isRead: true }))
      }
    })
  }, [queryClient])

  const handleNotificationDeleted = useCallback((data: { id: string }) => {
    const id = data.id
    
    // Remove from unread notifications
    queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
      if (!old) return old
      return old.filter(n => n.id !== id)
    })

    // Remove from all notifications list
    queryClient.setQueryData<{ data: Notification[] }>(notificationKeys.lists(), (old) => {
      if (!old) return old
      return {
        ...old,
        data: old.data.filter(n => n.id !== id)
      }
    })
  }, [queryClient])

  useEffect(() => {
    // Subscribe to notification events
    const unsubscribeNotification = unifiedSocketManager.onNotification(handleNotification)
    const unsubscribeRead = unifiedSocketManager.onNotificationRead(handleNotificationRead)
    const unsubscribeAllRead = unifiedSocketManager.onAllNotificationsRead(handleAllNotificationsRead)
    const unsubscribeDeleted = unifiedSocketManager.onNotificationDeleted(handleNotificationDeleted)
    
    return () => {
      unsubscribeNotification()
      unsubscribeRead()
      unsubscribeAllRead()
      unsubscribeDeleted()
    }
  }, [handleNotification, handleNotificationRead, handleAllNotificationsRead, handleNotificationDeleted])

  return {
    isConnected,
  }
}

// Hook for console logs using unified socket
export function useUnifiedConsoleLog() {
  const [logs, setLogs] = useState<ConsoleLogMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  // Update connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = unifiedSocketManager.getLogSocketStatus()
      setIsConnected(connected)
      if (connected) {
        setLoading(false)
      }
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Handle log events
  const handleNewLog = useCallback((newLog: ConsoleLogMessage) => {
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, newLog]
      // Keep only last 1000 logs to prevent memory issues
      return newLogs.slice(-1000)
    })
  }, [])

  const handleRecentLogs = useCallback((recentLogs: ConsoleLogMessage[]) => {
    setLogs(recentLogs)
    setLoading(false)
  }, [])

  const handleLogsCleared = useCallback(() => {
    setLogs([])
  }, [])

  useEffect(() => {
    // Subscribe to log events
    const unsubscribeNewLog = unifiedSocketManager.onNewLog(handleNewLog)
    const unsubscribeRecentLogs = unifiedSocketManager.onRecentLogs(handleRecentLogs)
    const unsubscribeCleared = unifiedSocketManager.onLogsCleared(handleLogsCleared)
    
    return () => {
      unsubscribeNewLog()
      unsubscribeRecentLogs()
      unsubscribeCleared()
    }
  }, [handleNewLog, handleRecentLogs, handleLogsCleared])

  // Fetch status and recent logs via HTTP (fallback)
  const fetchRecentLogs = async (limit = 100) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3232'
      const response = await fetch(`${API_BASE_URL}/logs/console/recent?limit=${limit}`)
      const data = await response.json()
      setLogs(data.logs || [])
      setLoading(false)
    } catch  {
      setLoading(false)
      // Silently fail
    }
  }

  const clearLogs = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3232'
      await fetch(`${API_BASE_URL}/logs/console/clear`, { method: 'DELETE' })
      setLogs([])
    } catch  {
      // Silently fail
    }
  }

  // Initialize logs if not connected
  useEffect(() => {
    if (!isConnected && loading) {
      fetchRecentLogs()
    }
  }, [isConnected, loading])

  return {
    logs,
    isConnected,
    loading,
    actions: {
      fetchRecentLogs,
      clearLogs,
      refreshConnection: () => {
        // Connection is managed by unified manager
        console.log('Connection refresh requested - managed by unified socket manager')
      }
    }
  }
} 