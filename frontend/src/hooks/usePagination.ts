import { useState, useMemo, useEffect } from 'react'

interface UsePaginationProps {
  totalItems: number
  initialItemsPerPage?: number
  initialPage?: number
}

interface UsePaginationReturn {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  startIndex: number
  endIndex: number
  hasNext: boolean
  hasPrev: boolean
  
  // Handlers
  setCurrentPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  setTotalItems: (totalItems: number) => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  
  // Pagination info
  canGoNext: boolean
  canGoPrevious: boolean
  
  // Page numbers for UI
  getPageNumbers: () => number[]
  
  // Slice function for arrays
  paginateArray: <T>(array: T[]) => T[]
}

export function usePagination({
  totalItems: initialTotalItems = 0,
  initialItemsPerPage = 10,
  initialPage = 1
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPageState] = useState(initialPage)
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage)
  const [totalItems, setTotalItemsState] = useState(initialTotalItems)

  // Ensure totalItems is a valid number
  const safeTotalItems = Math.max(0, totalItems || 0)
  
  const totalPages = useMemo(() => {
    return Math.ceil(safeTotalItems / itemsPerPage) || 1
  }, [safeTotalItems, itemsPerPage])

  const startIndex = useMemo(() => {
    return Math.max(0, (currentPage - 1) * itemsPerPage)
  }, [currentPage, itemsPerPage])

  const endIndex = useMemo(() => {
    return startIndex + itemsPerPage
  }, [startIndex, itemsPerPage])

  const hasNext = currentPage < totalPages
  const hasPrev = currentPage > 1
  const canGoNext = hasNext
  const canGoPrevious = hasPrev

  const setCurrentPage = (page: number) => {
    // Ensure page is a valid number within bounds
    const validPage = Math.max(1, Math.min(Math.floor(page) || 1, totalPages))
    setCurrentPageState(validPage)
  }

  const setItemsPerPage = (items: number) => {
    // Ensure items is a valid positive number
    const validItems = Math.max(1, Math.floor(items) || 1)
    setItemsPerPageState(validItems)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const setTotalItems = (newTotalItems: number) => {
    setTotalItemsState(newTotalItems)
    // Reset to first page if current page is out of bounds
    const newTotalPages = Math.ceil(newTotalItems / itemsPerPage)
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPageState(1)
    }
  }

  // Update current page if it exceeds total pages due to totalItems change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPageState(totalPages)
    }
  }, [totalPages, currentPage])

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToNextPage = () => setCurrentPage(Math.min(currentPage + 1, totalPages))
  const goToPreviousPage = () => setCurrentPage(Math.max(currentPage - 1, 1))

  const getPageNumbers = () => {
    const pages: number[] = []
    const showPages = 5 // Number of page buttons to show
    
    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const halfShow = Math.floor(showPages / 2)
      let startPage = Math.max(currentPage - halfShow, 1)
      const endPage = Math.min(startPage + showPages - 1, totalPages)
      
      if (endPage - startPage < showPages - 1) {
        startPage = Math.max(endPage - showPages + 1, 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const paginateArray = <T,>(array: T[]): T[] => {
    return array.slice(startIndex, endIndex)
  }

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    hasNext,
    hasPrev,
    
    setCurrentPage,
    setItemsPerPage,
    setTotalItems,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    
    canGoNext,
    canGoPrevious,
    
    getPageNumbers,
    paginateArray
  }
}

// Optional: Pagination component props
export interface PaginationControlsProps {
  pagination: UsePaginationReturn
  totalItems: number
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
  className?: string
}

// Default items per page options
export const DEFAULT_ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000]
