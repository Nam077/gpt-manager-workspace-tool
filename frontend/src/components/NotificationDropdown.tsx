import { useState, useEffect, useRef } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'
import { 
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useNotifications, useUnreadNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications'
import { useUnifiedNotifications } from '../hooks/useUnifiedSocket'
import { getNotificationIcon, getNotificationColor } from '../utils/notificationUtils'
import NotificationDetailModal from './NotificationDetailModal'
import type { Notification } from '../types'

interface NotificationDropdownProps {
  className?: string
}

export default function NotificationDropdown({ className = '' }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // React Query hooks
  const { data: unreadNotifications = [], refetch: refetchUnread } = useUnreadNotifications(50)
  const { data: allNotificationsData, refetch: refetchAll } = useNotifications(1, 50)
  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()
  
  // WebSocket hook
  const { isConnected } = useUnifiedNotifications()
  
  const allNotifications = allNotificationsData?.data || []
  const notifications = showAll ? allNotifications : unreadNotifications
  const unreadCount = unreadNotifications.length
  const loading = false

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Open notification detail
  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification)
    setShowDetailModal(true)
    setIsOpen(false) // Close dropdown
    
    // Auto mark as read if notification is unread and we're in unread tab
    if (!notification.isRead && !showAll) {
      handleMarkAsRead(notification.id)
    }
  }

  // Mark notification as read
      const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id)
  }

  // Close detail modal
  const handleCloseModal = () => {
    setShowDetailModal(false)
    setSelectedNotification(null)
  }

  // Mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refetchUnread()
      if (showAll) {
        refetchAll()
      }
    }
  }, [isOpen, showAll, refetchUnread, refetchAll])



  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
                 <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
           {/* Header */}
           <div className="px-4 py-3 border-b border-gray-200">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center space-x-2">
                 <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                 {/* Connection status indicator */}
                 <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                      title={isConnected ? 'Kết nối WebSocket' : 'Mất kết nối WebSocket'} />
               </div>
               {unreadCount > 0 && !showAll && (
                 <button
                   onClick={handleMarkAllAsRead}
                   disabled={markAllAsReadMutation.isPending}
                   className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                 >
                   {markAllAsReadMutation.isPending ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
                 </button>
               )}
             </div>
             
             {/* Toggle buttons */}
             <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
               <button
                 onClick={() => setShowAll(false)}
                 className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                   !showAll
                     ? 'bg-white text-indigo-700 shadow-sm'
                     : 'text-gray-600 hover:text-gray-900'
                 }`}
               >
                 Chưa đọc ({unreadCount})
               </button>
               <button
                 onClick={() => setShowAll(true)}
                 className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                   showAll
                     ? 'bg-white text-indigo-700 shadow-sm'
                     : 'text-gray-600 hover:text-gray-900'
                 }`}
               >
                 Tất cả ({allNotifications.length})
               </button>
             </div>
           </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2">Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
                                            notifications.map((notification) => (
                 <div
                   key={notification.id}
                   onClick={() => handleNotificationClick(notification)}
                   className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                     !notification.isRead ? 'bg-blue-50' : 'bg-white'
                   }`}
                 >
                   <div className="flex items-start space-x-3">
                     {/* Icon */}
                     <div className="flex-shrink-0">
                       {getNotificationIcon(notification.type)}
                     </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                        {notification.message}
                      </p>
                      
                      {notification.targetEmail && (
                        <p className="text-xs text-gray-500 mt-1">
                          User: {notification.targetEmail}
                        </p>
                      )}
                      
                                             <p className="text-xs text-gray-400 mt-1">
                         {new Date(notification.createdAt).toLocaleString('vi-VN')}
                       </p>
                    </div>

                                         {/* Read/Unread Indicator */}
                     <div className="flex-shrink-0">
                       {notification.isRead ? (
                         <CheckCircleIcon className="h-4 w-4 text-green-500" />
                       ) : (
                         <ClockIcon className="h-4 w-4 text-blue-500" />
                       )}
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to full notifications page if needed
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium w-full text-center"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={showDetailModal}
        onClose={handleCloseModal}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  )
} 