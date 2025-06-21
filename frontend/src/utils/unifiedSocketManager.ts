import { io, Socket } from 'socket.io-client'
import type { Notification } from '../types'
import type { ConsoleLogMessage, ConsoleLogStatus } from '../types'
import { showNotificationToast } from './toastUtils'

interface SocketCallbacks {
  // Notification callbacks
  onNewNotification?: (notification: Notification) => void
  onNotificationRead?: (data: { id: string }) => void
  onAllNotificationsRead?: () => void
  onNotificationDeleted?: (data: { id: string }) => void
  
  // Log callbacks
  onNewLog?: (log: ConsoleLogMessage) => void
  onRecentLogs?: (logs: ConsoleLogMessage[]) => void
  onLogsCleared?: () => void
  onLogStatus?: (status: ConsoleLogStatus) => void
}

class UnifiedSocketManager {
  private static instance: UnifiedSocketManager
  private notificationSocket: Socket | null = null
  private logSocket: Socket | null = null
  private isConnected = false
  private callbacks: SocketCallbacks = {}
  private processedNotifications = new Set<string>()

  private constructor() {}

  static getInstance(): UnifiedSocketManager {
    if (!UnifiedSocketManager.instance) {
      UnifiedSocketManager.instance = new UnifiedSocketManager()
    }
    return UnifiedSocketManager.instance
  }

  connect(): void {
    if (this.isConnected) {
      console.log('Unified WebSocket already connected')
      return
    }

    console.log('Connecting to unified WebSocket...')
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3232'

    // Create separate namespace connections but reuse the underlying transport
    this.notificationSocket = io(`${baseUrl}/notifications`, {
      transports: ['websocket'],
      autoConnect: true,
      forceNew: false, // Allow connection reuse
    })

    this.logSocket = io(`${baseUrl}/logs`, {
      transports: ['websocket'],
      autoConnect: true,
      forceNew: false, // Allow connection reuse
    })

    // Setup notification socket handlers
    this.setupNotificationHandlers()
    
    // Setup log socket handlers  
    this.setupLogHandlers()

    // Track overall connection status
    this.setupConnectionTracking()
  }

  private setupNotificationHandlers(): void {
    if (!this.notificationSocket) return

    this.notificationSocket.on('connect', () => {
      console.log('Connected to notification namespace')
    })

    this.notificationSocket.on('disconnect', () => {
      console.log('Disconnected from notification namespace')
    })

    this.notificationSocket.on('new-notification', (notification: Notification) => {
      console.log('New notification received:', notification)
      this.handleNewNotification(notification)
      this.callbacks.onNewNotification?.(notification)
    })

    this.notificationSocket.on('notification-read', (data: { id: string }) => {
      console.log('Notification marked as read:', data.id)
      this.callbacks.onNotificationRead?.(data)
    })

    this.notificationSocket.on('all-notifications-read', () => {
      console.log('All notifications marked as read')
      this.callbacks.onAllNotificationsRead?.()
    })

    this.notificationSocket.on('notification-deleted', (data: { id: string }) => {
      console.log('Notification deleted:', data.id)
      this.callbacks.onNotificationDeleted?.(data)
    })
  }

  private setupLogHandlers(): void {
    if (!this.logSocket) return

    this.logSocket.on('connect', () => {
      console.log('Connected to log namespace')
    })

    this.logSocket.on('disconnect', () => {
      console.log('Disconnected from log namespace')
    })

    this.logSocket.on('recent-logs', (logs: ConsoleLogMessage[]) => {
      console.log('Recent logs received:', logs.length)
      this.callbacks.onRecentLogs?.(logs)
    })

    this.logSocket.on('new-log', (log: ConsoleLogMessage) => {
      this.callbacks.onNewLog?.(log)
    })

    this.logSocket.on('logs-cleared', () => {
      console.log('Logs cleared')
      this.callbacks.onLogsCleared?.()
    })
  }

  private setupConnectionTracking(): void {
    const checkConnection = () => {
      const notificationConnected = this.notificationSocket?.connected || false
      const logConnected = this.logSocket?.connected || false
      this.isConnected = notificationConnected || logConnected
    }

    this.notificationSocket?.on('connect', checkConnection)
    this.notificationSocket?.on('disconnect', checkConnection)
    this.logSocket?.on('connect', checkConnection)
    this.logSocket?.on('disconnect', checkConnection)

    // Initial check
    checkConnection()
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

    // Show toast notification
    showNotificationToast({
      id: notification.id,
      message: notification.message,
      type: notification.type,
    })
  }

  disconnect(): void {
    if (this.notificationSocket) {
      console.log('Disconnecting notification socket')
      this.notificationSocket.disconnect()
      this.notificationSocket = null
    }

    if (this.logSocket) {
      console.log('Disconnecting log socket')
      this.logSocket.disconnect()
      this.logSocket = null
    }

    this.isConnected = false
    this.callbacks = {}
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }

  // Register callbacks for different events
  onNotification(callback: (notification: Notification) => void): () => void {
    this.callbacks.onNewNotification = callback
    
    return () => {
      this.callbacks.onNewNotification = undefined
    }
  }

  onNotificationRead(callback: (data: { id: string }) => void): () => void {
    this.callbacks.onNotificationRead = callback
    
    return () => {
      this.callbacks.onNotificationRead = undefined
    }
  }

  onAllNotificationsRead(callback: () => void): () => void {
    this.callbacks.onAllNotificationsRead = callback
    
    return () => {
      this.callbacks.onAllNotificationsRead = undefined
    }
  }

  onNotificationDeleted(callback: (data: { id: string }) => void): () => void {
    this.callbacks.onNotificationDeleted = callback
    
    return () => {
      this.callbacks.onNotificationDeleted = undefined
    }
  }

  // Log event callbacks
  onNewLog(callback: (log: ConsoleLogMessage) => void): () => void {
    this.callbacks.onNewLog = callback
    
    return () => {
      this.callbacks.onNewLog = undefined
    }
  }

  onRecentLogs(callback: (logs: ConsoleLogMessage[]) => void): () => void {
    this.callbacks.onRecentLogs = callback
    
    return () => {
      this.callbacks.onRecentLogs = undefined
    }
  }

  onLogsCleared(callback: () => void): () => void {
    this.callbacks.onLogsCleared = callback
    
    return () => {
      this.callbacks.onLogsCleared = undefined
    }
  }

  // Socket status getters
  getNotificationSocketStatus(): boolean {
    return this.notificationSocket?.connected || false
  }

  getLogSocketStatus(): boolean {
    return this.logSocket?.connected || false
  }
}

export const unifiedSocketManager = UnifiedSocketManager.getInstance() 