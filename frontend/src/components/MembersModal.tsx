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
import type { CreateMemberRequest, Workspace, Member } from '../types'

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
    isDeleting
  } = useMembersByWorkspace(workspace.id)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  
  const [memberFormData, setMemberFormData] = useState<CreateMemberRequest>({
    email: '',
    workspaceId: workspace.id
  })

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreating) return

    try {
      await createMember({
        ...memberFormData,
        workspaceId: workspace.id
      })
      setShowCreateModal(false)
      const email = memberFormData.email
      setMemberFormData({ email: '', workspaceId: workspace.id })
      SuccessMessages.member.create(email)
    } catch (error: unknown) {
      ErrorHandlers.member.create(error as { message?: string; response?: { data?: { message?: string } } })
    }
  }

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

  const handleDeleteMember = async (memberId: number, memberEmail: string) => {
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

  if (!isOpen) return null

  return (
    <>
      {/* Main Members Modal */}
      <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold">Members - {workspace.email}</h3>
              <p className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${members.length} of ${workspace.maxSlots} slots used`}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={openCreateModal}
                disabled={loading || members.length >= workspace.maxSlots}
                className="flex items-center px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Member
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[70vh]">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 ${getAvatarColor(member.email)} rounded-full flex items-center justify-center text-white font-semibold`}>
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {member.email}
                        </h4>
                        <p className="text-xs text-gray-500">ID: #{member.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                      <span>Joined: {formatDate(member.createdAt)}</span>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(member)}
                        disabled={isUpdating}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded disabled:opacity-50"
                        title="Edit member"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id, member.email)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
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
                <p className="text-gray-600 mb-4">
                  This workspace doesn't have any members. Add the first member to get started.
                </p>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
        <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Member</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={memberFormData.email}
                  onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCreating ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Member</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={memberFormData.email}
                  onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
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