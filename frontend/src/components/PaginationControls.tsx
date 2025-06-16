import React from 'react'
import { DEFAULT_ITEMS_PER_PAGE_OPTIONS, type PaginationControlsProps } from '../hooks/usePagination'

export function PaginationControls({
  pagination,
  totalItems,
  showItemsPerPage = true,
  itemsPerPageOptions = DEFAULT_ITEMS_PER_PAGE_OPTIONS,
  className = ''
}: PaginationControlsProps) {
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage,
    setItemsPerPage,
    goToPreviousPage,
    goToNextPage,
    canGoPrevious,
    canGoNext,
    getPageNumbers
  } = pagination

  if (totalItems === 0) return null

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 ${className}`}>
      {/* Items per page selector */}
      {showItemsPerPage && (
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Items per page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={totalItems}>All ({totalItems})</option>
          </select>
        </div>
      )}

      {/* Page info */}
      <div className="text-sm text-gray-500">
        Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
        {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          {/* Previous button */}
          <button
            onClick={goToPreviousPage}
            disabled={!canGoPrevious}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              !canGoPrevious
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Previous
          </button>

          {/* First page */}
          {currentPage > 3 && (
            <>
              <button
                onClick={() => setCurrentPage(1)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                1
              </button>
              {currentPage > 4 && <span className="text-gray-500">...</span>}
            </>
          )}

          {/* Page numbers */}
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Last page */}
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="text-gray-500">...</span>}
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next button */}
          <button
            onClick={goToNextPage}
            disabled={!canGoNext}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              !canGoNext
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
