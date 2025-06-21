import { XMarkIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import type { Notification } from '../types'
import { getNotificationIcon, getNotificationTypeName } from '../utils/notificationUtils'

interface NotificationDetailModalProps {
  notification: Notification | null
  isOpen: boolean
  onClose: () => void
  onMarkAsRead?: (id: string) => void
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onMarkAsRead
}: NotificationDetailModalProps) {
  if (!isOpen || !notification) return null

  const handleMarkAsRead = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const parseAdditionalInfo = (info?: string) => {
    if (!info) return null
    try {
      return JSON.parse(info)
    } catch {
      return null
    }
  }

  const additionalInfo = parseAdditionalInfo(notification.additionalInfo)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getNotificationTypeName(notification.type)}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {notification.isRead ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Đã đọc</span>
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600">Chưa đọc</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Message */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Nội dung</h4>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-gray-800 leading-relaxed">
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Thông tin chi tiết</h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Admin thực hiện</span>
                    <span className="text-sm font-medium text-gray-900 break-all">
                      {notification.adminEmail}
                    </span>
                  </div>
                  
                  {notification.targetEmail && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        {notification.targetEmail.includes(',') ? 'Người dùng' : 'Người dùng'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 break-all text-right">
                        {notification.targetEmail.includes(',') 
                          ? `${notification.targetEmail.split(',').length} người dùng`
                          : notification.targetEmail
                        }
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Thời gian tạo</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {additionalInfo?.action && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Hành động</span>
                      <span className="text-sm font-medium text-gray-900">
                        {additionalInfo.action}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details (Collapsible) */}
            {additionalInfo && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 list-none">
                  <div className="flex items-center justify-between">
                    <span>Thông tin bổ sung</span>
                    <span className="text-xs text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </div>
                </summary>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs space-y-2">
                  {additionalInfo.workspaceId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workspace ID:</span>
                      <span className="font-mono text-gray-800 break-all">{additionalInfo.workspaceId}</span>
                    </div>
                  )}
                  {additionalInfo.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="text-gray-800">{new Date(additionalInfo.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  {additionalInfo.userId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-mono text-gray-800">{additionalInfo.userId}</span>
                    </div>
                  )}
                  {additionalInfo.successfulEmails && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lời mời thành công:</span>
                      <span className="text-gray-800">{additionalInfo.successfulEmails.length} người</span>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            {!notification.isRead && onMarkAsRead && (
              <button
                onClick={handleMarkAsRead}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 