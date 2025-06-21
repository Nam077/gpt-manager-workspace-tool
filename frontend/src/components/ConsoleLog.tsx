import { useState, useEffect, useRef } from 'react'
import { useUnifiedConsoleLog } from '../hooks/useUnifiedSocket'
import toast from 'react-hot-toast'

interface ConsoleLogProps {
  maxHeight?: string
  autoScroll?: boolean
}

export const ConsoleLog = ({ maxHeight = '600px', autoScroll = true }: ConsoleLogProps) => {
  const { logs, isConnected, loading, actions } = useUnifiedConsoleLog()
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isPaused, setIsPaused] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && logContainerRef.current) {
      const container = logContainerRef.current
      // Smooth scroll to bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
      
      // Update isAtBottom state after auto-scroll
      setTimeout(() => {
        setIsAtBottom(true)
      }, 100)
    }
  }, [logs, autoScroll, isPaused])

  // Handle manual scroll to detect if user scrolled up
  const handleScroll = () => {
    if (logContainerRef.current) {
      const container = logContainerRef.current
      // More precise detection - within 5px of bottom
      const isScrolledToBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 5
      setIsAtBottom(isScrolledToBottom)
    }
  }

  // Scroll to bottom manually
  const scrollToBottom = () => {
    if (logContainerRef.current) {
      const container = logContainerRef.current
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
      
      // Update isAtBottom state after manual scroll
      setTimeout(() => {
        setIsAtBottom(true)
      }, 100)
    }
  }

  // Filter logs based on level and search term
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.context?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesLevel && matchesSearch
  })

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'warn':
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'debug':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'log':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'info':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'warn':
      case 'warning':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'debug':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      case 'log':
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })
  }

  const handleClearLogs = () => {
    toast((t) => (
      <div className="flex items-center space-x-3">
        <div>
          <p className="font-medium">Clear console logs?</p>
          <p className="text-sm text-gray-600">This will clear the current buffer.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                await actions.clearLogs()
                toast.success('Console logs cleared')
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                                  toast.error(`Failed to clear logs: ${errorMessage}`)
              }
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Clear
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      style: {
        background: '#fff',
        color: '#000',
        maxWidth: '400px',
      }
    })
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Connecting to console logs...</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">Console Logs</h2>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status info removed - managed by unified socket */}
            
            {/* Auto-scroll indicator */}
            <div className="flex items-center space-x-1 text-xs">
              <div className={`w-2 h-2 rounded-full ${autoScroll && !isPaused ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-gray-500">Auto-scroll</span>
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1 text-sm rounded flex items-center space-x-1 ${
                isPaused 
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              {isPaused ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                  <span>Pause</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter by level */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="log">Log</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Action buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleClearLogs}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Log container */}
      <div className="relative">
        <div 
          ref={logContainerRef}
          onScroll={handleScroll}
          className="p-4 font-mono text-sm bg-gray-900 text-gray-100 overflow-y-auto"
          style={{ maxHeight }}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {logs.length === 0 ? 'No logs available' : 'No logs match your filters'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-2 hover:bg-gray-800 px-2 py-1 rounded">
                  <span className="text-gray-400 text-xs min-w-[80px]">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className="text-xs min-w-[16px] flex items-center">
                    {getLevelIcon(log.level)}
                  </span>
                  <span className={`text-xs font-medium min-w-[50px] ${getLevelColor(log.level).split(' ')[0]}`}>
                    {log.level.toUpperCase()}
                  </span>
                  {log.context && (
                    <span className="text-cyan-400 text-xs min-w-[80px]">
                      [{log.context}]
                    </span>
                  )}
                  <span className="flex-1 break-all">
                    {log.message}
                  </span>
                  <span className="text-xs text-gray-500 min-w-[60px]">
                    {log.source}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && !isPaused && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors flex items-center space-x-1"
            title="Scroll to bottom"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-xs">Bottom</span>
          </button>
        )}
      </div>
    </div>
  )
} 