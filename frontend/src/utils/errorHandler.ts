import toast from 'react-hot-toast'

export interface ApiError {
  response?: {
    data?: {
      message?: string
      statusCode?: number
    }
  }
  message?: string
}

export function getErrorMessage(error: ApiError): string {
  // Try to get message from response data first
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  // Fallback to error message
  if (error?.message) {
    return error.message
  }
  
  // Default fallback
  return 'An unexpected error occurred'
}

export function handleApiError(error: ApiError): void {
  const message = getErrorMessage(error)
  console.error('API Error:', error)
  toast.error(`❌ ${message}`)
}

export function handleApiSuccess(message: string, emoji: string = '✅'): void {
  toast.success(`${emoji} ${message}`)
}

// Specific error handlers for common scenarios
export const ErrorHandlers = {
  workspace: {
    create: (error: ApiError) => handleApiError(error),
    update: (error: ApiError) => handleApiError(error),
    delete: (error: ApiError) => handleApiError(error),
  },
  member: {
    create: (error: ApiError) => handleApiError(error),
    update: (error: ApiError) => handleApiError(error),
    delete: (error: ApiError) => handleApiError(error),
  },
  invite: {
    process: (error: ApiError) => handleApiError(error),
  }
}

// Success message templates
export const SuccessMessages = {
  workspace: {
    create: (email: string) => handleApiSuccess(`Created workspace for ${email}!`, '🚀'),
    update: (email: string) => handleApiSuccess(`Updated workspace for ${email}!`, '✏️'),
    delete: (email: string) => handleApiSuccess(`Deleted workspace ${email}`, '🗑️'),
  },
  member: {
    create: (email: string) => handleApiSuccess(`Added ${email} to workspace!`, '✨'),
    update: (email: string) => handleApiSuccess(`Updated member to ${email}!`, '🎉'),
    delete: (email: string) => handleApiSuccess(`Removed ${email} from workspace`, '🗑️'),
  },
  invite: {
    process: (count: number) => handleApiSuccess(`Invite completed! Processed ${count} invitations`, '🎉'),
  }
}