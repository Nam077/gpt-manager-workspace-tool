import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import toast from 'react-hot-toast'
import { 
  useCookies, 
  useCookieStats,
  useCookieExport 
} from '../hooks/useApi'
import { usePagination } from '../hooks/usePagination'
import { PaginationControls } from '../components/PaginationControls'
import { ErrorHandlers, handleApiSuccess } from '../utils/errorHandler'
import type { Cookie, CreateCookieRequest } from '../types'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/cookies')({
  component: CookiesPage,
})

function CookiesPage() {
  const {
    cookies,
    loading,
    error,
    refetch,
    createCookie,
    updateCookie,
    deleteCookie,
    bulkCreateCookies,
    bulkDeleteCookies,
    validateCookie,
    isCreating,
    isUpdating,
    isBulkCreating,
    isBulkDeleting,
    isValidating
  } = useCookies()

  const stats = useCookieStats()
  const { exportToCsv, loading: exportLoading } = useCookieExport()

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedCookies, setSelectedCookies] = useState<number[]>([])
  const [editingCookie, setEditingCookie] = useState<Cookie | null>(null)
  
  const [formData, setFormData] = useState<CreateCookieRequest>({
    email: '',
    value: ''
  })

  const [bulkCookiesText, setBulkCookiesText] = useState('')

  const pagination = usePagination({
    totalItems: 0,
    initialItemsPerPage: 50
  })

  // Filter cookies based on status and search
  const filteredCookies = useMemo(() => {
    let filtered = cookies

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(cookie => cookie.value !== 'error')
    } else if (filterStatus === 'error') {
      filtered = filtered.filter(cookie => cookie.value === 'error')
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cookie =>
        cookie.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cookie.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [cookies, filterStatus, searchTerm])

  // Paginate filtered cookies
  const paginatedCookies = pagination.paginateArray(filteredCookies)

  // Update pagination when filtered cookies change
  useEffect(() => {
    pagination.setTotalItems(filteredCookies.length)
    pagination.setCurrentPage(1)
  }, [filteredCookies.length, pagination])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreating) return

    try {
      await createCookie(formData)
      setShowCreateModal(false)
      setFormData({ email: '', value: '' })
      handleApiSuccess(`Added cookie for ${formData.email}!`, '🍪')
    } catch (error: unknown) {
      ErrorHandlers.workspace.create(error as { message?: string; response?: { data?: { message?: string } } })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isUpdating || !editingCookie) return

    try {
      await updateCookie(editingCookie.id, formData)
      setShowEditModal(false)
      setEditingCookie(null)
      setFormData({ email: '', value: '' })
      handleApiSuccess(`Updated cookie for ${formData.email}!`, '✏️')
    } catch (error: unknown) {
      ErrorHandlers.workspace.update(error as { message?: string; response?: { data?: { message?: string } } })
    }
  }

  const handleDelete = async (id: number, email: string) => {
    toast((t) => (
      <div className="flex items-center space-x-3">
        <div>
          <p className="font-medium">Delete cookie for {email}?</p>
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                await deleteCookie(id)
                handleApiSuccess(`Deleted cookie for ${email}`, '🗑️')
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

  const handleBulkCreate = async () => {
    if (!bulkCookiesText.trim()) return

    try {
      const lines = bulkCookiesText.trim().split('\n')
      const cookiesToCreate: CreateCookieRequest[] = []

      for (const line of lines) {
        const [email, value] = line.split('\t').map(s => s.trim())
        if (email && value) {
          cookiesToCreate.push({ email, value })
        }
      }

      if (cookiesToCreate.length === 0) {
        toast.error('No valid cookies found. Format: email\tvalue')
        return
      }

      await bulkCreateCookies(cookiesToCreate)
      setShowBulkModal(false)
      setBulkCookiesText('')
      handleApiSuccess(`Created ${cookiesToCreate.length} cookies!`, '🚀')
    } catch (error: unknown) {
      ErrorHandlers.workspace.create(error as { message?: string; response?: { data?: { message?: string } } })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCookies.length === 0) return

    toast((t) => (
      <div className="flex items-center space-x-3">
        <div>
          <p className="font-medium">Delete {selectedCookies.length} selected cookies?</p>
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                const result = await bulkDeleteCookies(selectedCookies)
                setSelectedCookies([])
                handleApiSuccess(`Deleted ${result.deleted} cookies`, '🗑️')
                if (result.errors.length > 0) {
                  toast.error(`${result.errors.length} errors occurred`)
                }
              } catch (error: unknown) {
                ErrorHandlers.workspace.delete(error as { message?: string; response?: { data?: { message?: string } } })
              }
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Delete All
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

  const handleValidate = async (id: number, email: string) => {
    try {
      const result = await validateCookie(id)
      const status = result.isValid ? 'valid' : 'invalid'
      const emoji = result.isValid ? '✅' : '❌'
      handleApiSuccess(`Cookie for ${email} is ${status}`, emoji)
    } catch (error: unknown) {
      ErrorHandlers.workspace.create(error as { message?: string; response?: { data?: { message?: string } } })
    }
  }

  const handleExport = async () => {
    try {
      await exportToCsv()
      handleApiSuccess('Cookies exported successfully!', '📄')
    } catch (error: unknown) {
      ErrorHandlers.workspace.create(error as { message?: string; response?: { data?: { message?: string } } })
    }
  }

  const openEditModal = (cookie: Cookie) => {
    setEditingCookie(cookie)
    setFormData({
      email: cookie.email,
      value: cookie.value
    })
    setShowEditModal(true)
  }

  const toggleCookieSelection = (id: number) => {
    setSelectedCookies(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCookies.length === paginatedCookies.length) {
      setSelectedCookies([])
    } else {
      setSelectedCookies(paginatedCookies.map(c => c.id))
    }
  }

  const getCookieStatus = (cookie: Cookie) => {
    if (cookie.value === 'error') {
      return { status: 'error', color: 'bg-red-100 text-red-800', icon: XCircleIcon }
    }
    return { status: 'active', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateValue = (value: string, length = 50) => {
    return value.length > length ? value.substring(0, length) + '...' : value
  }

  const parseCurlCookies = (curlCommand: string) => {
    const cookies: { name: string; value: string }[] = []
    
    // Try different patterns for cookie extraction
    const patterns = [
      /-b\s+'([^']+)'/,
      /-b\s+"([^"]+)"/,
      /--cookie\s+'([^']+)'/,
      /--cookie\s+"([^"]+)"/,
      /-H\s+'Cookie:\s*([^']+)'/i,
      /-H\s+"Cookie:\s*([^"]+)"/i
    ]
    
    let cookieString = ''
    for (const pattern of patterns) {
      const match = curlCommand.match(pattern)
      if (match && match[1]) {
        cookieString = match[1]
        break
      }
    }
    
    if (cookieString) {
      const cookiePairs = cookieString.split(';')
      cookiePairs.forEach(pair => {
        const [name, value] = pair.trim().split('=')
        if (name && value) {
          cookies.push({
            name: name.trim(),
            value: value.trim()
          })
        }
      })
    }
    
    return cookies
  }
  // Detect if value contains cURL command
  const isCurlCommand = (value: string) => {
    return value.includes('curl') && (
      value.includes('-b ') || 
      value.includes('--cookie') || 
      value.includes('-H ') ||
      value.includes('Cookie:')
    )
  }

  const handleParseValueAsCurl = () => {
    const cookies = parseCurlCookies(formData.value)
    if (cookies.length === 0) {
      toast.error('No cookies found in cURL command')
      return
    }

    // Join all cookies into a single string
    const cookieValue = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
    
    // Try to extract email from the cURL command if email is empty
    if (!formData.email) {
      const emailMatch = formData.value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
      const extractedEmail = emailMatch ? emailMatch[0] : ''
      
      setFormData({
        email: extractedEmail,
        value: cookieValue
      })
    } else {
      setFormData({
        ...formData,
        value: cookieValue
      })
    }

    toast.success(`Parsed ${cookies.length} cookies successfully!`, { icon: '🍪' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">Error loading cookies: {error.message}</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cookie Management</h1>
              <p className="mt-2 text-gray-600">Manage application cookies and session data</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                  exportLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <ServerIcon className="w-4 h-4 mr-2" />
                Bulk Add
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Cookie
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ServerIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cookies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Cookies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Error Cookies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.error}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recently Added</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentlyAdded}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-md rounded-lg border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Cookies</option>
                    <option value="active">Active</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                  <select
                    value={pagination.itemsPerPage}
                    onChange={(e) => pagination.setItemsPerPage(parseInt(e.target.value, 10) || 50)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                  </select>
                </div>

                {selectedCookies.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bulk Actions</label>
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkDeleting}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete {selectedCookies.length} Selected
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search cookies by email or value..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cookies Table */}
        <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Cookie Storage</h2>
              <div className="text-sm text-gray-500">
                Showing {filteredCookies.length} of {cookies.length} cookies
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={paginatedCookies.length > 0 && selectedCookies.length === paginatedCookies.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCookies.map((cookie) => {
                  const { status, color, icon: StatusIcon } = getCookieStatus(cookie)
                  return (
                    <tr key={cookie.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCookies.includes(cookie.id)}
                          onChange={() => toggleCookieSelection(cookie.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cookie.email}</div>
                        <div className="text-sm text-gray-500">ID: #{cookie.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-mono max-w-xs">
                          <div className="truncate" title={cookie.value}>
                            {truncateValue(cookie.value)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(cookie.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleValidate(cookie.id, cookie.email)}
                            disabled={isValidating}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Validate cookie"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(cookie)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit cookie"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cookie.id, cookie.email)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete cookie"
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

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-200">
            <PaginationControls
              pagination={pagination}
              totalItems={filteredCookies.length}
              showItemsPerPage={false}
            />
          </div>

          {filteredCookies.length === 0 && (
            <div className="text-center py-12">
              <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cookies found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No cookies available at the moment.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Create Cookie Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Cookie</h3>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cookie Value
                </label>
                <div className="relative">
                  <textarea
                    required
                    rows={3}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="Cookie value or paste cURL command here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isCurlCommand(formData.value) && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleParseValueAsCurl}
                        className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <CommandLineIcon className="w-4 h-4 mr-1" />
                        Parse cURL Cookies
                      </button>
                    </div>
                  )}
                </div>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? 'Adding...' : 'Add Cookie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cookie Modal */}
      {showEditModal && editingCookie && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Cookie</h3>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cookie Value
                </label>
                <div className="relative">
                  <textarea
                    required
                    rows={3}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="Cookie value or paste cURL command here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isCurlCommand(formData.value) && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleParseValueAsCurl}
                        className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <CommandLineIcon className="w-4 h-4 mr-1" />
                        Parse cURL Cookies
                      </button>
                    </div>
                  )}
                </div>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Cookie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bulk Add Cookies</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cookies (Format: email[TAB]value, one per line)
                </label>
                <textarea
                  rows={10}
                  value={bulkCookiesText}
                  onChange={(e) => setBulkCookiesText(e.target.value)}
                  placeholder="user1@example.com	cookie_value_1&#10;user2@example.com	cookie_value_2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use Tab to separate email and cookie value. One cookie per line.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={isBulkCreating || !bulkCookiesText.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isBulkCreating ? 'Creating...' : 'Create Cookies'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}