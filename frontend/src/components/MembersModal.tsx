import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { useMembersByWorkspace } from '../hooks/useApi'
import { ErrorHandlers, SuccessMessages } from '../utils/errorHandler'
import type { CreateMemberRequest, Workspace, Member, BulkCreateMemberRequest } from '../types'

interface MembersModalProps {
  workspace: Workspace
  isOpen: boolean
  onClose: () => void
}

export function MembersModal({ workspace, isOpen, onClose }: MembersModalProps) {
  const { 
    members, 
    loading, 
    error, 
    createMember, 
    updateMember, 
    deleteMember,
    isCreating,
    isUpdating,
    isDeleting,
    bulkCreateMembers,
    isBulkCreating,
    deleteAllMembers,
    isDeletingAll
  } = useMembersByWorkspace(workspace.id)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  
  const [memberFormData, setMemberFormData] = useState<CreateMemberRequest>({
    email: '',
    workspaceId: workspace.id
  })

  const [email, setEmail] = useState('')
  const [bulkEmails, setBulkEmails] = useState('')
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [excludedEmails, setExcludedEmails] = useState<Set<string>>(new Set())

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isUpdating || !editingMember) return

    try {
      await updateMember(editingMember.id, memberFormData)
      setShowEditModal(false)
      setEditingMember(null)
      const email = memberFormData.email
      setMemberFormData({ email: '', workspaceId: workspace.id })
      SuccessMessages.member.update(email)
    } catch (error: unknown) {
      ErrorHandlers.member.update(error as { message?: string; response?: { data?: { message?: string } } })
    }
  }

  const handleDeleteMember = async (memberId: string, memberEmail: string) => {
    // Use toast for confirmation instead of confirm
    toast((t) => (
      <div className="flex items-center space-x-3">
        <div>
          <p className="font-medium">Delete {memberEmail}?</p>
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                await deleteMember(memberId)
                SuccessMessages.member.delete(memberEmail)
              } catch (error: unknown) {
                ErrorHandlers.member.delete(error as { message?: string; response?: { data?: { message?: string } } })
              }
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Delete
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

  const openCreateModal = () => {
    setMemberFormData({ email: '', workspaceId: workspace.id })
    setEmail('')
    setBulkEmails('')
    setIsBulkMode(false)
    setExcludedEmails(new Set())
    setShowCreateModal(true)
  }

  const openEditModal = (member: Member) => {
    setEditingMember(member)
    setMemberFormData({
      email: member.email,
      workspaceId: member.workspaceId
    })
    setShowEditModal(true)
  }

  const getAvatarColor = (email: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500']
    const index = email.charCodeAt(0) % colors.length
    return colors[index]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Extract emails from text using comprehensive regex
  const extractEmails = (text: string): string[] => {
    // Comprehensive email regex supporting most common email formats
    const emailRegex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g
    
    const matches = text.match(emailRegex) || []
    // Remove duplicates and excluded emails
    const uniqueEmails = [...new Set(matches.map(email => email.toLowerCase().trim()))]
    return uniqueEmails.filter(email => !excludedEmails.has(email))
  }

  const removeEmail = (emailToRemove: string) => {
    setExcludedEmails(prev => new Set([...prev, emailToRemove]))
  }

  const clearExcludedEmails = () => {
    setExcludedEmails(new Set())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isBulkMode) {
      if (!bulkEmails.trim()) {
        toast.error('Please enter emails to import')
        return
      }

      // Extract emails from text
      const extractedEmails = extractEmails(bulkEmails)
      
      if (extractedEmails.length === 0) {
        toast.error('No valid emails found in the text')
        return
      }

      try {
        const data: BulkCreateMemberRequest = {
          emails: extractedEmails,
          workspaceId: workspace.id
        }
        
        const result = await bulkCreateMembers(data)
        
        toast.success(`${result.summary}. Created: ${result.created.length}, Skipped: ${result.skipped.length}`)
        setBulkEmails('')
        setIsBulkMode(false)
        setShowCreateModal(false)
      } catch (error: unknown) {
        ErrorHandlers.member.create(error as { message?: string; response?: { data?: { message?: string } } })
      }
    } else {
      // Single email creation
      if (!email.trim()) {
        toast.error('Email is required')
        return
      }

      try {
        const memberData: CreateMemberRequest = {
          email: email.trim(),
          workspaceId: workspace.id
        }
        
        await createMember(memberData)
        setEmail('')
        setShowCreateModal(false)
        SuccessMessages.member.create(email.trim())
      } catch (error: unknown) {
        ErrorHandlers.member.create(error as { message?: string; response?: { data?: { message?: string } } })
      }
    }
  }

  const handleDeleteAll = async () => {
    if (members.length === 0) {
      toast.error('No members to delete')
      return
    }

    // Use toast for confirmation
    toast((t) => (
      <div className="flex flex-col space-y-3">
        <div>
          <p className="font-medium text-red-600">Delete All Members?</p>
          <p className="text-sm text-gray-600">
            This will permanently delete all {members.length} members from this workspace. This action cannot be undone.
          </p>
        </div>
        <div className="flex space-x-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                const result = await deleteAllMembers()
                toast.success(result.message)
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to delete all members'
                toast.error(errorMessage)
              }
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Delete All
          </button>
        </div>
      </div>
    ), {
      duration: 15000,
      style: {
        background: '#fff',
        color: '#000',
        maxWidth: '450px',
      }
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Main Members Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 border-b border-gray-200 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Members - {workspace.email}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {loading ? 'Loading...' : `${members.length} of ${workspace.maxSlots} slots used`}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={openCreateModal}
                disabled={loading || members.length >= workspace.maxSlots}
                className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Member
              </button>
              {members.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingAll ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <TrashIcon className="h-4 w-4 mr-2" />
                  )}
                  Delete All
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading members...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">Error loading members: {error.message}</p>
              </div>
            ) : members.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 ${getAvatarColor(member.email)} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {member.email}
                        </h4>
                        <p className="text-xs text-gray-500">ID: #{member.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 mb-3 space-y-1 sm:space-y-0">
                      <span>Joined: {formatDate(member.createdAt)}</span>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(member)}
                        disabled={isUpdating}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                        title="Edit member"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id, member.email)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                        title="Delete member"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
                <p className="text-gray-600 mb-4 px-4">
                  This workspace doesn't have any members. Add the first member to get started.
                </p>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add First Member
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Member Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {isBulkMode ? 'Bulk Import Members' : 'Add Member'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setIsBulkMode(false)}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    !isBulkMode 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Single Email
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkMode(true)}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isBulkMode 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bulk Import
                </button>
              </div>

              {!isBulkMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="Enter member email"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bulk Email Import
                  </label>
                  <textarea
                    required
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors h-40 resize-none"
                    placeholder="Paste any text containing emails here. The system will automatically extract all valid email addresses from your text..."
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    You can paste emails in any format - comma-separated, line-separated, or within text. 
                    The system will automatically find and extract all valid emails.
                  </p>
                  
                  {/* Email Preview */}
                  {bulkEmails.trim() && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-700">
                          Found {extractEmails(bulkEmails).length} email(s):
                        </p>
                        {excludedEmails.size > 0 && (
                          <button
                            type="button"
                            onClick={clearExcludedEmails}
                            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                          >
                            Restore all
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {extractEmails(bulkEmails).map((email, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded group"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeEmail(email)}
                              className="opacity-0 group-hover:opacity-100 ml-1 text-indigo-600 hover:text-red-600 transition-all"
                              title="Remove this email"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      {excludedEmails.size > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {excludedEmails.size} email(s) excluded
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setIsBulkMode(false)
                    setEmail('')
                    setBulkEmails('')
                    setExcludedEmails(new Set())
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isBulkCreating}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  {(isCreating || isBulkCreating) && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isBulkMode ? 'Import Members' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Edit Member</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditMember} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={memberFormData.email}
                  onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="Enter member email"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
              )}
    </>
  )
}