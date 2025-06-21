import { io, Socket } from 'socket.io-client'
import type { Notification } from '../types'
import { showNotificationToast } from './toastUtils'

class NotificationManager {
  private static instance: NotificationManager
  private socket: Socket | null = null
  private isConnected = false
  private processedNotifications = new Set<string>()
  private callbacks: ((notification: Notification) => void)[] = []

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return
    }

    console.log('Connecting to notification WebSocket...')
    
    this.socket = io(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
      transports: ['websocket'],
      autoConnect: true,
      forceNew: true,
    })

    this.socket.on('connect', () => {
      console.log('Connected to notification WebSocket')
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification WebSocket')
      this.isConnected = false
    })

    this.socket.on('new-notification', (notification: Notification) => {
      console.log('New notification received:', notification)
      this.handleNewNotification(notification)
    })

            this.socket.on('notification-read', (data: { id: string }) => {
      console.log('Notification marked as read:', data.id)
      this.callbacks.forEach(callback => callback({ ...data, type: 'read' } as unknown as Notification))
    })

    this.socket.on('all-notifications-read', () => {
      console.log('All notifications marked as read')
      this.callbacks.forEach(callback => callback({ type: 'all-read' } as unknown as Notification))
    })

            this.socket.on('notification-deleted', (data: { id: string }) => {
      console.log('Notification deleted:', data.id)
      this.callbacks.forEach(callback => callback({ ...data, type: 'deleted' } as unknown as Notification))
    })
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting notification WebSocket')
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  private handleNewNotification(notification: Notification): void {
    // Create unique key from notification ID and message
    const notificationKey = `${notification.id}-${notification.message.slice(0, 50)}`
    
    // Prevent duplicate toasts for the same notification
    if (this.processedNotifications.has(notificationKey)) {
      console.log('Duplicate notification detected, skipping toast:', notificationKey)
      return
    }
    
    this.processedNotifications.add(notificationKey)
    
    // Clean up old processed notifications (keep only last 50)
    if (this.processedNotifications.size > 100) {
      const keysArray = Array.from(this.processedNotifications)
      this.processedNotifications = new Set(keysArray.slice(-50))
    }

    // Show toast notification with custom styling and close button
    showNotificationToast({
      id: notification.id,
      message: notification.message,
      type: notification.type,
    })

    // Notify all callbacks
    this.callbacks.forEach(callback => callback(notification))
  }

  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  onNotification(callback: (notification: Notification) => void): () => void {
    this.callbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }
}

export const notificationManager = NotificationManager.getInstance() 