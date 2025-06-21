import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ConsoleLogMessage, ConsoleLogStatus } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const useConsoleLog = () => {
  const [logs, setLogs] = useState<ConsoleLogMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState<ConsoleLogStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const socket = io(`${API_BASE_URL}/logs`, {
      transports: ['websocket'],
      timeout: 5000,
      forceNew: true
    })

    socketRef.current = socket

    // Connection handlers
    socket.on('connect', () => {
      setIsConnected(true)
      setLoading(false)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', () => {
      setIsConnected(false)
      setLoading(false)
    })

    // Log event handlers
    socket.on('recent-logs', (recentLogs: ConsoleLogMessage[]) => {
      setLogs(recentLogs)
      setLoading(false)
    })

    socket.on('new-log', (newLog: ConsoleLogMessage) => {
      setLogs(prevLogs => {
        const newLogs = [...prevLogs, newLog]
        // Keep only last 1000 logs to prevent memory issues
        return newLogs.slice(-1000)
      })
    })

    socket.on('logs-cleared', () => {
      setLogs([])
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
    }
  }, [])

  // Fetch console status
  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs/console/status`)
      const statusData = await response.json()
      setStatus(statusData)
    } catch  {
      // Silently fail
    }
  }

  // Fetch recent logs via HTTP (fallback)
  const fetchRecentLogs = async (limit = 100) => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs/console/recent?limit=${limit}`)
      const data = await response.json()
      setLogs(data.logs || [])
      setStatus({
        interceptorActive: true,
        connectedClients: data.connectedClients || 0,
        bufferSize: data.logs?.length || 0
      })
    } catch  {
      // Silently fail
    }
  }

  // Clear console buffer
  const clearLogs = async () => {
    try {
      await fetch(`${API_BASE_URL}/logs/console/clear`, { method: 'DELETE' })
      setLogs([])
    } catch  {
      // Silently fail
    }
  }



  // Initialize status and logs
  useEffect(() => {
    fetchStatus()
    if (!socketRef.current?.connected) {
      fetchRecentLogs()
    }
  }, [])

  return {
    logs,
    isConnected,
    status,
    loading,
    actions: {
      fetchStatus,
      fetchRecentLogs,
      clearLogs,
      refreshConnection: () => {
        if (socketRef.current) {
          socketRef.current.disconnect()
          socketRef.current.connect()
        }
      }
    }
  }
} 