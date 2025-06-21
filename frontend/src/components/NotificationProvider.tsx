import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { unifiedSocketManager } from '../utils/unifiedSocketManager'

interface NotificationProviderProps {
  children: ReactNode
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  useEffect(() => {
    console.log('Initializing unified socket manager...')
    unifiedSocketManager.connect()
    
    return () => {
      console.log('Cleaning up unified socket manager...')
      unifiedSocketManager.disconnect()
    }
  }, [])
  
  return <>{children}</>
} 