import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { 
  UserGroupIcon, 
  ChartBarIcon, 
  ServerIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { useWorkspaces, useInvite } from '../hooks/useApi'
import { MembersModal } from '../components/MembersModal'
import { ErrorHandlers, SuccessMessages } from '../utils/errorHandler'
import type { CreateWorkspaceRequest, Workspace } from '../types'

export const Route = createFileRoute('/workspace')({
  component: WorkspacePage,
})

function WorkspacePage() {
  const { 
    workspaces, 
    loading, 
    error, 
    createWorkspace, 
    updateWorkspace, 
    deleteWorkspace,
    refetch 
  } = useWorkspaces()

  const { inviteMembers, loading: inviteLoading } = useInvite()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  
  const [formData, setFormData] = useState<CreateWorkspaceRequest>({
    email: '',
    maxSlots: 5
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalWorkspaces = workspaces.length
  const totalMembers = workspaces.reduce((sum, w) => sum + w.members.length, 0)
  const activeWorkspaces = workspaces.filter(w => w.members.length > 0).length

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      await createWorkspace(formData)
      setShowCreateModal(false)
      const email = formData.email
      setFormData({ email: '', maxSlots: 5 })
      SuccessMessages.workspace.create(email)
    } catch (error: unknown) {
      ErrorHandlers.workspace.create(error as { message?: string; response?: { data?: { message?: string } } })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !editingWorkspace) return

    try {
      setIsSubmitting(true)
      await updateWorkspace(editingWorkspace.id, formData)
      setShowEditModal(false)
      setEditingWorkspace(null)
      const email = formData.email
      setFormData({ email: '', maxSlots: 5 })
      SuccessMessages.workspace.update(email)
    } catch (error: unknown) {
      ErrorHandlers.workspace.update(error as { message?: string; response?: { data?: { message?: string } } })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number, workspaceEmail: string) => {
    toast((t) => (
      <div className="flex items-center space-x-3">
        <div>
          <p className="font-medium">Delete workspace {workspaceEmail}?</p>
          <p className="text-sm text-gray-600">This will remove all members too!</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                await deleteWorkspace(id)
                SuccessMessages.workspace.delete(workspaceEmail)
              } catch (error: unknown) {
                ErrorHandlers.workspace.delete(error as { message?: string; response?: { data?: { message?: string } } })
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

  const handleInvite = async () => {
    try {
      toast.loading('🚀 Inviting members...', { id: 'invite' })
      const result = await inviteMembers()
      toast.success(`🎉 Invite completed! Processed ${result.length} invitations`, { id: 'invite' })
      refetch() // Refresh workspaces
    } catch (error: unknown) {
      toast.dismiss('invite')
      ErrorHandlers.invite.process(error as { message?: string; response?: { data?: { message?: string } } })
    }
  }

  const openEditModal = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setFormData({
      email: workspace.email,
      maxSlots: workspace.maxSlots
    })
    setShowEditModal(true)
  }

  const openMembersModal = (workspace: Workspace) => {
    setSelectedWorkspace(workspace)
    setShowMembersModal(true)
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">Error loading workspaces: {JSON.stringify(error)}</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Workspace & Member Management</h1>
              <p className="text-gray-600">Manage your workspaces and team members</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleInvite}
                disabled={inviteLoading}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  inviteLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                {inviteLoading ? 'Inviting...' : 'Invite Members'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <ServerIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Workspaces</p>
                <p className="text-2xl font-bold text-gray-900">{totalWorkspaces}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Workspaces</p>
                <p className="text-2xl font-bold text-gray-900">{activeWorkspaces}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workspaces Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Workspaces</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Slots
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workspaces.map((workspace) => {
                  const usagePercent = (workspace.members.length / workspace.maxSlots) * 100
                  return (
                    <tr key={workspace.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{workspace.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workspace.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workspace.maxSlots}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => openMembersModal(workspace)}
                          className="flex items-center text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {workspace.members.length} members
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                usagePercent >= 80 ? 'bg-red-500' :
                                usagePercent >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{Math.round(usagePercent)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(workspace.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openMembersModal(workspace)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View members"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(workspace)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit workspace"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(workspace.id, workspace.email)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete workspace"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Workspace Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create Workspace</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Slots
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.maxSlots}
                    onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) })}
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
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Workspace Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Workspace</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Slots
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.maxSlots}
                    onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) })}
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
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Members Management Modal */}
        {selectedWorkspace && (
          <MembersModal
            workspace={selectedWorkspace}
            isOpen={showMembersModal}
            onClose={() => setShowMembersModal(false)}
          />
        )}


      </div>
    </div>
  )
}