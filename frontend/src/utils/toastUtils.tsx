import toast from 'react-hot-toast'
import { CustomToast } from '../components/CustomToast'

export function showNotificationToast(notification: { id: number; message: string; type: string }) {
  toast(
    (t) => (
      <CustomToast
        id={t.id}
        message={notification.message}
        type={notification.type}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 8000,
      id: `notification-${notification.id}`,
      style: {
        maxWidth: '450px',
        padding: '16px',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
      },
    }
  )
} 