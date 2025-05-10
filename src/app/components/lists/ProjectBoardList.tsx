'use client'
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import ProjectBoardCard from "../cards/ProjectBoardCard";
import Link from "next/link";
import Pagination from "../common/Pagination";
import axios from "axios";
import Loading from "../common/Loading";

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requiredSkills: string[];
  ownerName: string;
  status: string;
  createdAt: string;
}

interface ProjectBoardListProps {
  initialItemsPerPage?: number;
  filter?: string;
}

function ProjectBoardList({ initialItemsPerPage = 12, filter = 'open' }: ProjectBoardListProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [totalItems, setTotalItems] = useState(0);

    // ฟังก์ชั่นดึงข้อมูลโปรเจกต์จาก API
    const fetchProjects = async () => {
      setLoading(true);
      setError("");

      try {
        // สร้าง query parameters
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: itemsPerPage
        };

        // นำ filter parameter มาใช้ถ้ามี
        if (filter) {
          params.status = filter;
        }

        // เพิ่ม query parameters จาก URL
        const q = searchParams.get('q');
        const skills = searchParams.get('skills');
        const status = searchParams.get('status');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');

        if (q) params.q = q;
        if (skills) params.skills = skills;
        if (status) params.status = status; // Override filter if status is in URL
        if (minPrice) params.minPrice = parseInt(minPrice, 10);
        if (maxPrice) params.maxPrice = parseInt(maxPrice, 10);

        // เรียกใช้ API
        const response = await axios.get('/api/projects', { params });
        
        // อัพเดทข้อมูลโปรเจกต์และจำนวนทั้งหมด
        setProjects(response.data.projects);
        setTotalItems(response.data.totalCount);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจกต์");
      } finally {
        setLoading(false);
      }
    };

    // ดึงข้อมูลเมื่อหน้าเปลี่ยนหรือมีการอัพเดท searchParams
    useEffect(() => {
      fetchProjects();
    }, [currentPage, itemsPerPage, searchParams, filter]);

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

    // แสดง loading state
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loading size="large" color="primary" />
          <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลโปรเจกต์...</p>
        </div>
      );
    }

    // แสดงข้อความเมื่อเกิด error
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchProjects()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            ลองใหม่
          </button>
        </div>
      );
    }

    // ถ้าไม่มีโปรเจกต์ให้แสดง
    if (projects.length === 0) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">ไม่พบโปรเจกต์ที่ตรงตามเงื่อนไขการค้นหา</p>
          
          {(searchParams.size > 0) && (
            <button 
              onClick={() => router.push('/project-board')}
              className="mt-4 px-4 py-2 bg-primary-blue-500 text-white rounded-lg hover:bg-primary-blue-600"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      );
    }

    // แสดงรายการโปรเจกต์
    return (
        <div>
          {/* Page indicator at top right */}
          <div className="flex justify-end mb-6">
              <p className="text-gray-500 text-sm">
                  หน้า {currentPage} จาก {totalPages}
              </p>
          </div>
          
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-8 gap-4">
              {/* Project cards */}
              {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                  <ProjectBoardCard 
                    title={project.title}
                    ownerName={project.ownerName}
                    description={project.description}
                    budget={project.budget}
                    requiredSkills={project.requiredSkills}
                    createdAt={project.createdAt}
                  />
              </Link>
              ))}
          </section>
          
          {/* Pagination component */}
          <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/project-board"
              queryParams={{
                // Add any existing filter query params here
                ...(searchParams.get('q') && { q: searchParams.get('q')! }),
                ...(searchParams.get('skills') && { skills: searchParams.get('skills')! }),
                ...(searchParams.get('status') && { status: searchParams.get('status')! }),
                ...(searchParams.get('minPrice') && { minPrice: searchParams.get('minPrice')! }),
                ...(searchParams.get('maxPrice') && { maxPrice: searchParams.get('maxPrice')! })
              }}
          />
        </div>
    )
}

export default ProjectBoardList