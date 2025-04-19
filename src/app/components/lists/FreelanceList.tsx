'use client'
import React, { useState, useEffect } from "react"
import FreelanceCard from "../cards/FreelanceCard"
import Link from "next/link"
import Pagination from "../common/Pagination"
import { useSearchParams } from "next/navigation"

interface FreelanceListProps {
  itemsPerPage?: number;
  totalItems?: number;
}

function FreelanceList({ itemsPerPage = 12, totalItems = 100 }: FreelanceListProps) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  
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