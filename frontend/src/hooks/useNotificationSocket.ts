import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'
import type { Notification } from '../types'
import { notificationKeys } from './useNotifications'
import toast from 'react-hot-toast'

interface NotificationSocketData {
  connectedClients: number
  totalNotifications: number
  unreadNotifications: number
}

export function useNotificationSocket() {
  const socketRef = useRef<Socket | null>(null)
  const queryClient = useQueryClient()
  const isConnectedRef = useRef(false)
      const lastNotificationIdRef = useRef<string | null>(null)
  const processedNotifications = useRef<Set<string>>(new Set())

  // Debounced toast function to prevent duplicates
  const showToast = useCallback((notification: Notification) => {
    // Create unique key from notification ID and message
    const notificationKey = `${notification.id}-${notification.message.slice(0, 50)}`
    
    // Prevent duplicate toasts for the same notification
    if (lastNotificationIdRef.current === notification.id || 
        processedNotifications.current.has(notificationKey)) {
      return
    }
    
    lastNotificationIdRef.current = notification.id
    processedNotifications.current.add(notificationKey)
    
    // Clean up old processed notifications (keep only last 100)
    if (processedNotifications.current.size > 100) {
      const keysArray = Array.from(processedNotifications.current)
      processedNotifications.current = new Set(keysArray.slice(-50))
    }

    toast.success(`Thông báo mới: ${notification.message}`, {
      duration: 5000,
      id: `notification-${notification.id}`, // Unique toast ID
    })
  }, [])

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current?.connected || isConnectedRef.current) {
      return
    }

    // Create socket connection
    const socket = io(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
      transports: ['websocket'],
      autoConnect: true,
      forceNew: true, // Force new connection
    })

    socketRef.current = socket

    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to notification WebSocket')
      isConnectedRef.current = true
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from notification WebSocket')
      isConnectedRef.current = false
    })

    // Handle new notification
    socket.on('new-notification', (notification: Notification) => {
      console.log('New notification received:', notification)
      
      // Add to unread notifications
      queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
        if (!old) return [notification]
        return [notification, ...old]
      })

      // Invalidate all notification queries to refresh data
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })

      // Show toast notification with debounce
      showToast(notification)
    })

    // Handle notification marked as read
            socket.on('notification-read', (data: { id: string }) => {
      console.log('Notification marked as read:', data.id)
      
      // Remove from unread notifications
      queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
        if (!old) return old
        return old.filter(n => n.id !== data.id)
      })

      // Update in all notifications list
      queryClient.setQueryData<{ data: Notification[] }>(notificationKeys.lists(), (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map(n => n.id === data.id ? { ...n, isRead: true } : n)
        }
      })
    })

    // Handle all notifications marked as read
    socket.on('all-notifications-read', () => {
      console.log('All notifications marked as read')
      
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
    })

    // Handle notification deleted
            socket.on('notification-deleted', (data: { id: string }) => {
      console.log('Notification deleted:', data.id)
      
      // Remove from unread notifications
      queryClient.setQueryData<Notification[]>(notificationKeys.unread(), (old) => {
        if (!old) return old
        return old.filter(n => n.id !== data.id)
      })

      // Remove from all notifications
      queryClient.setQueryData<{ data: Notification[] }>(notificationKeys.lists(), (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.filter(n => n.id !== data.id)
        }
      })
    })

    // Handle notification status updates
    socket.on('notification-status', (status: NotificationSocketData) => {
      console.log('Notification status:', status)
      // Could be used to update UI status indicators
    })

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up notification socket')
      socket.disconnect()
      socketRef.current = null
      isConnectedRef.current = false
    }
  }, [queryClient, showToast])

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  }
} 