'use client'
import React, { useState, useEffect } from "react"
import FreelanceCard from "../cards/FreelanceCard"
import Link from "next/link"
import Pagination from "../common/Pagination"
import { useSearchParams, useRouter } from "next/navigation"
import axios from "axios"
import Loading from "../common/Loading"

interface Freelancer {
  id: string;
  name: string;
  major: string;
  profileImageUrl?: string;
  basePrice: number;
  skills: string[];
  galleryImages?: string[];
}

interface PriceRange {
  min: number;
  max: number | null;
}

interface FreelanceListProps {
  totalItems?: number;
  initialItemsPerPage?: number;
  searchQuery?: string;
  selectedSkills?: string[];
  selectedMajor?: string;
  priceRange?: PriceRange;
}

function FreelanceList({ 
  totalItems: propsTotalItems, 
  initialItemsPerPage = 12,
  searchQuery = '',
  selectedSkills = [],
  selectedMajor = '',
  priceRange = { min: 0, max: null }
}: FreelanceListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [loading, setLoading] = useState(true);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [totalItems, setTotalItems] = useState(propsTotalItems || 0);
  const [error, setError] = useState("");
  
  // Fetch freelancers (students with isOpen = true)
  useEffect(() => {
    const fetchFreelancers = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Build params object for API call
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: itemsPerPage
        };
        
        // Add filters if they exist
        if (searchQuery) params.q = searchQuery;
        if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');
        if (selectedMajor) params.major = selectedMajor;
        if (priceRange.min > 0) params.minPrice = priceRange.min;
        if (priceRange.max !== null) params.maxPrice = priceRange.max;
        
        // Fetch data from API
        const response = await axios.get('/api/freelancers', { params });
        
        // Set state with API response data
        setFreelancers(response.data.freelancers);
        
        // Only update totalItems if not provided as prop
        if (propsTotalItems === undefined) {
          setTotalItems(response.data.totalCount);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching freelancers:", error);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
      }
    };
    
    fetchFreelancers();
  }, [currentPage, itemsPerPage, searchParams, searchQuery, selectedSkills, selectedMajor, priceRange, propsTotalItems]);
  
  // Update totalItems when prop changes
  useEffect(() => {
    if (propsTotalItems !== undefined) {
      setTotalItems(propsTotalItems);
    }
  }, [propsTotalItems]);
  
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
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลฟรีแลนซ์...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          ลองใหม่
        </button>
      </div>
    );
  }
  
  if (freelancers.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">
        {(searchQuery || selectedSkills.length > 0 || selectedMajor || priceRange.min > 0 || priceRange.max !== null) ? 
        'ไม่พบฟรีแลนซ์ที่ตรงตามเงื่อนไขการค้นหา' : 
        'ไม่พบข้อมูลฟรีแลนซ์ที่พร้อมรับงาน'}
        </p>
        {(searchQuery || selectedSkills.length > 0 || selectedMajor || priceRange.min > 0 || priceRange.max !== null) && (
          <button 
            onClick={() => router.push('/find-freelance')}
            className="mt-4 px-4 py-2 bg-primary-blue-500 text-white rounded-lg hover:bg-primary-blue-600"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div>
      {/* Page indicator and filter info */}
      <div className="flex flex-col sm:flex-row sm:justify-end mb-6 gap-2">
        <div className="flex items-center gap-2">
          <p className="text-gray-500 text-sm whitespace-nowrap">
            หน้า {currentPage} จาก {totalPages}
          </p>
        </div>
      </div>
      
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-4">
        {/* freelance cards */}
        {freelancers.map((freelancer) => (
          <Link key={freelancer.id} href={`/user/freelance/${freelancer.id}`}>
            <FreelanceCard 
              name={freelancer.name}
              major={freelancer.major}
              profileImageUrl={freelancer.profileImageUrl}
              basePrice={freelancer.basePrice}
              skills={freelancer.skills}
              galleryImages={freelancer.galleryImages}
            />
          </Link>
        ))}
      </section>
      
      {/* Pagination component */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/find-freelance"
        queryParams={{
          // Add all existing filter params
          ...(searchQuery && { q: searchQuery }),
          ...(selectedSkills.length > 0 && { skills: selectedSkills.join(',') }),
          ...(selectedMajor && { major: selectedMajor }),
          ...(priceRange.min > 0 && { minPrice: priceRange.min.toString() }),
          ...(priceRange.max !== null && { maxPrice: priceRange.max.toString() }),
        }}
      />
    </div>
  )
}

export default FreelanceList