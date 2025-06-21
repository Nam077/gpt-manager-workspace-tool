import { useState } from 'react'
import toast from 'react-hot-toast'
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { memberApi } from '../services/api'
import type { SearchEmailsResponse, AutoAssignEmailsResponse } from '../types'

interface EmailSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EmailSearchModal({ isOpen, onClose }: EmailSearchModalProps) {
  const [emailsText, setEmailsText] = useState('')
  const [searchResults, setSearchResults] = useState<SearchEmailsResponse | null>(null)
  const [autoAssignResults, setAutoAssignResults] = useState<AutoAssignEmailsResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAutoAssigning, setIsAutoAssigning] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'assign'>('search')

  // Extract emails from text using regex
  const extractEmails = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g
    const matches = text.match(emailRegex) || []
    return [...new Set(matches.map(email => email.toLowerCase().trim()))]
  }

  const handleSearch = async () => {
    const emails = extractEmails(emailsText)
    if (emails.length === 0) {
      toast.error('No valid emails found')
      return
    }

    setIsSearching(true)
    try {
      const results = await memberApi.searchEmails({ emails })
      setSearchResults(results)
      setAutoAssignResults(null)
    } catch (error) {
      toast.error('Failed to search emails')
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAutoAssign = async () => {
    const emails = extractEmails(emailsText)
    if (emails.length === 0) {
      toast.error('No valid emails found')
      return
    }

    setIsAutoAssigning(true)
    try {
      const results = await memberApi.autoAssignEmails({ emails })
      setAutoAssignResults(results)
      setSearchResults(null)
      toast.success(results.summary)
    } catch (error: unknown) {
      console.error('Auto assign error:', error)
      
      // Handle different error formats from API
      let errorMessage = 'Failed to auto assign emails'
      
      try {
        // Try to parse as fetch response error
        const errorObj = error as { response?: { data?: { message?: string } }; message?: string }
        if (errorObj.response?.data?.message) {
          errorMessage = errorObj.response.data.message
        } else if (errorObj.message) {
          errorMessage = errorObj.message
        } else if (typeof error === 'string') {
          errorMessage = error
        }
      } catch {
        errorMessage = 'Failed to auto assign emails'
      }
      
      toast.error(errorMessage)
    } finally {
      setIsAutoAssigning(false)
    }
  }

  const handleDeleteMember = async (memberId: string, email: string) => {
    try {
      await memberApi.delete(memberId)
      toast.success(`Deleted ${email} successfully`)
      // Refresh search results
      if (searchResults) {
        handleSearch()
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to delete member')
      toast.error(`Failed to delete ${email}`)
    }
  }

  const resetModal = () => {
    setEmailsText('')
    setSearchResults(null)
    setAutoAssignResults(null)
    setActiveTab('search')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Email Management</h3>
          <button
            onClick={() => {
              onClose()
              resetModal()
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tab Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Search Emails
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'assign'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Auto Assign
            </button>
          </div>

          {/* Input Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {activeTab === 'search' ? 'Search Emails in Workspaces' : 'Auto Assign Emails to Available Workspaces'}
            </label>
            <textarea
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors h-32 resize-none"
              placeholder="Paste emails here... The system will automatically extract all valid email addresses."
            />
            <p className="text-xs text-gray-600 mt-2">
              {extractEmails(emailsText).length} email(s) detected
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {activeTab === 'search' ? (
              <button
                onClick={handleSearch}
                disabled={isSearching || extractEmails(emailsText).length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <MagnifyingGlassIcon className="h-4 w-4" />
                )}
                Search in Workspaces
              </button>
            ) : (
              <button
                onClick={handleAutoAssign}
                disabled={isAutoAssigning || extractEmails(emailsText).length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isAutoAssigning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <UserPlusIcon className="h-4 w-4" />
                )}
                Auto Assign to Workspaces
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-3">Search Results</h4>
              
              {searchResults.found && searchResults.found.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-green-700 mb-2">
                    Found ({searchResults.found.length}):
                  </h5>
                  <div className="space-y-2">
                    {searchResults.found.map((result, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">{result.email}</p>
                          <p className="text-sm text-green-600">
                            Workspace: {result.workspace.email} ({result.workspace.currentMembers}/{result.workspace.maxSlots} slots)
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMember(result.member.id, result.email)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete this member"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.notFound && searchResults.notFound.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Not Found ({searchResults.notFound.length}):
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {searchResults.notFound.map((email, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Auto Assign Results */}
          {autoAssignResults && (
            <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-3">Auto Assignment Results</h4>
              
              {autoAssignResults.assigned && autoAssignResults.assigned.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-green-700 mb-2">
                    Successfully Assigned ({autoAssignResults.assigned.length}):
                  </h5>
                  <div className="space-y-2">
                    {autoAssignResults.assigned.map((result, index) => (
                      <div key={index} className="bg-green-50 p-3 rounded-lg">
                        <p className="font-medium text-green-800">{result.email}</p>
                        <p className="text-sm text-green-600">
                          → Assigned to: {result.workspaceEmail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {autoAssignResults.failed && autoAssignResults.failed.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2">
                    Failed ({autoAssignResults.failed.length}):
                  </h5>
                  <div className="space-y-2">
                    {autoAssignResults.failed.map((result, index) => (
                      <div key={index} className="bg-red-50 p-3 rounded-lg">
                        <p className="font-medium text-red-800">{result.email}</p>
                        <p className="text-sm text-red-600">Reason: {result.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 