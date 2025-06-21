import { XMarkIcon } from '@heroicons/react/24/outline'
import { getNotificationIcon } from '../utils/notificationUtils'

interface CustomToastProps {
  id: string
  message: string
  type: string
  onDismiss: () => void
}

export function CustomToast({ message, type, onDismiss }: CustomToastProps) {
  return (
    <div className="flex items-start gap-3 w-full max-w-sm">
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 mb-1">
          Thông báo mới
        </div>
        <div className="text-sm text-gray-600 leading-relaxed">
          {message}
        </div>
      </div>
      <button
        className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        onClick={onDismiss}
        title="Đóng thông báo"
      >
        <XMarkIcon className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  )
} 