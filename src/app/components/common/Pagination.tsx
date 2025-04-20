import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  queryParams?: Record<string, string>;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  baseUrl,
  queryParams = {},
}) => {
  const router = useRouter();
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  // Create URL with query parameters
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(queryParams);
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };
  
  // Handle navigation with scroll to top
  const handlePageChange = (page: number) => {
    // Scroll to top smoothly before changing the page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Wait for the scroll animation to complete before changing the page
    setTimeout(() => {
      router.push(createPageUrl(page));
    }, 500); // Adjust timing as needed - should match your scroll animation duration
  };

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 4;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first and last page
      // For current page in the middle with neighbors
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      // Adjust when near the end
      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      // Add pages with ellipsis
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push('ellipsis-start');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push('ellipsis-end');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex justify-center mt-12 mb-8" aria-label="Pagination">
      <ul className="flex gap-2 items-center">
        {/* Previous Page Button */}
        <li className="mx-2">
          {currentPage > 1 ? (
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-500 flex items-center"
              aria-label="Previous page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          ) : (
            <span className="p-1 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </span>
          )}
        </li>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <li key={`ellipsis-${index}`}>
                <span className="px-3 py-2 text-gray-500">...</span>
              </li>
            );
          }

          return (
            <li key={index}>
              {page === currentPage ? (
                <span className="px-3 py-1 rounded-xl bg-primary-blue-500 text-white font-medium">
                  {page}
                </span>
              ) : (
                <button
                  onClick={() => handlePageChange(page as number)}
                  className="px-3 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-500 font-medium"
                >
                  {page}
                </button>
              )}
            </li>
          );
        })}

        {/* Next Page Button */}
        <li className="mx-2">
          {currentPage < totalPages ? (
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-500 flex items-center"
              aria-label="Next page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          ) : (
            <span className="p-1 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;