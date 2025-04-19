'use client'
import React, { useState, useEffect } from "react"
import FreelanceCard from "../cards/FreelanceCard"
import Link from "next/link"
import Pagination from "../common/Pagination"
import { useSearchParams, useRouter } from "next/navigation"

interface FreelanceListProps {
  totalItems?: number;
  initialItemsPerPage?: number;
}

function FreelanceList({ totalItems = 100, initialItemsPerPage = 12 }: FreelanceListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  
  // Handle responsive itemsPerPage based on screen size
  useEffect(() => {
    const handleResize = () => {
      // Get window width
      const width = window.innerWidth;
      
      // Set items per page based on screen breakpoints
      // These should match your grid column breakpoints in the template
      if (width >= 1536) { // 2xl - 8 columns
        setItemsPerPage(16); // 2 rows of 8
      } else if (width >= 1280) { // xl - 4 columns
        setItemsPerPage(12); // 3 rows of 4
      } else if (width >= 1024) { // lg - 3 columns
        setItemsPerPage(12); // 4 rows of 3
      } else if (width >= 640) { // sm - 2 columns
        setItemsPerPage(10); // 5 rows of 2
      } else { // Default mobile - 1 column
        setItemsPerPage(6); // 6 rows of 1
      }
    };
    
    // Initial calculation
    handleResize();
    
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Update current page when URL changes
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    if (!isNaN(page) && page > 0 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setCurrentPage(1);
    }
  }, [searchParams, totalPages]);
  
  // Calculate items to display based on pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);
  
  return (
    <div>
      {/* Page indicator at top right */}
      <div className="flex justify-end mb-4">
        <p className="text-gray-500 text-sm">
          หน้า {currentPage} จาก {totalPages}
        </p>
      </div>
      
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-4">
        {/* freelance cards */}
        {currentItems.map((index) => (
          <Link key={index} href={`/user/${index}`}>
            <FreelanceCard />
          </Link>
        ))}
      </section>
      
      {/* Pagination component */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/find-freelance"
        queryParams={{
          // Add any existing filter query params here
          ...(searchParams.get('skill') && { skill: searchParams.get('skill')! }),
          ...(searchParams.get('category') && { category: searchParams.get('category')! })
        }}
      />
    </div>
  )
}

export default FreelanceList