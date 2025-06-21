import { 
  UserIcon, 
  UserMinusIcon, 
  ExclamationTriangleIcon,
  BellIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'

// Get notification icon component
export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'user_removed_pending':
      return <UserIcon className="h-5 w-5 text-yellow-600" />
    case 'user_removed_main':
      return <UserMinusIcon className="h-5 w-5 text-red-600" />
    case 'cookie_expired':
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
    case 'users_invited':
      return <UserPlusIcon className="h-5 w-5 text-green-600" />
    default:
      return <BellIcon className="h-5 w-5 text-blue-600" />
  }
}

// Get notification color class
export const getNotificationColor = (type: string) => {
  switch (type) {
    case 'user_removed_pending':
      return 'text-yellow-600'
    case 'user_removed_main':
      return 'text-red-600'
    case 'cookie_expired':
      return 'text-orange-600'
    case 'users_invited':
      return 'text-green-600'
    default:
      return 'text-blue-600'
  }
}



// Get notification type display name
export const getNotificationTypeName = (type: string) => {
  switch (type) {
    case 'user_removed_pending':
      return 'Xóa user khỏi pending'
    case 'user_removed_main':
      return 'Xóa user khỏi workspace'
    case 'cookie_expired':
      return 'Cookie hết hạn'
    case 'users_invited':
      return 'Mời thành viên mới'
    default:
      return 'Thông báo'
  }
} 