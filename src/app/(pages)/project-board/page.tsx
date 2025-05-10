'use client';

import NewProjectButton from "../../components/buttons/NewProjectButton";
import ProjectBoardList from "../../components/lists/ProjectBoardList";
import ProjectFilter from "../../components/filters/ProjectFilter";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Toaster } from 'react-hot-toast';
import { usePusher } from "../../../providers/PusherProvider";

// รายชื่อทักษะตามหมวดหมู่
const skillCategories = {
  "IT": ["Web Development", "UX/UI Design", "Data Analysis", "Mobile App Development", "Game Development", "AI/Machine Learning"],
  "Graphic": ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe After Effects", "3D Modeling"],
  "Business": ["Marketing", "Content Writing", "Business Analysis", "Project Management", "Financial Analysis"],
  "Video": ["Video Editing", "Animation", "Motion Graphics", "Videography"],
  "Audio": ["Sound Design", "Music Production", "Voice Over"]
};

// Get all skills from all categories
const allSkills = Object.values(skillCategories).flat();

// Create a client component that uses useSearchParams
function ProjectBoardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [totalProjects, setTotalProjects] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [selectedSkills, setSelectedSkills] = useState<string[]>(
      searchParams.get('skills') ? searchParams.get('skills')!.split(',') : []
    );
    const [status, setStatus] = useState(searchParams.get('status') || 'open');
    const [priceRange, setPriceRange] = useState({
        min: parseInt(searchParams.get('minPrice') || '0', 10),
        max: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : null
    });
    
    // เพิ่ม usePusher hook เพื่อใช้งาน Pusher
    const { subscribeToProjectList } = usePusher();
    
    // เพิ่ม Effect สำหรับการลงทะเบียนรับการอัปเดตรายการโปรเจกต์แบบ realtime
    useEffect(() => {
        // ฟังก์ชัน callback สำหรับเมื่อได้รับการอัปเดตรายการโปรเจกต์
        const handleProjectListUpdate = (data) => {
            console.log('ได้รับการอัปเดตรายการโปรเจกต์:', data);
            
            // รีโหลดข้อมูลจำนวนโปรเจกต์
            fetchTotalProjectsCount();
        };
        
        // ลงทะเบียนรับการอัปเดตรายการโปรเจกต์
        const unsubscribe = subscribeToProjectList(handleProjectListUpdate);
        
        // ยกเลิกการลงทะเบียนเมื่อ component unmount
        return () => {
            unsubscribe();
        };
    }, [subscribeToProjectList]);
    
    // ดึงจำนวนโปรเจกต์ทั้งหมด
    const fetchTotalProjectsCount = async () => {
        try {
            const params: Record<string, string | number> = {};
            
            // Add filters if they exist
            if (searchParams.get('q')) params.q = searchParams.get('q')!;
            if (searchParams.get('skills')) params.skills = searchParams.get('skills')!;
            if (searchParams.get('status')) params.status = searchParams.get('status')!;
            if (searchParams.get('minPrice')) params.minPrice = searchParams.get('minPrice')!;
            if (searchParams.get('maxPrice')) params.maxPrice = searchParams.get('maxPrice')!;
            
            const response = await axios.get('/api/projects', {
                params: { ...params, limit: 1 }
            });
            
            setTotalProjects(response.data.totalCount);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching total projects count:', error);
            setIsLoading(false);
        }
    };
    
    // เรียก fetchTotalProjectsCount เมื่อ component โหลดครั้งแรกหรือเมื่อ searchParams เปลี่ยน
    useEffect(() => {
        fetchTotalProjectsCount();
    }, [searchParams]);
    
    // ฟังก์ชั่นประยุกต์ใช้ Filters
    const applyFilters = () => {
        const params = new URLSearchParams();
        
        // เพิ่มตัวกรองทั้งหมดเข้าไปใน URL
        if (searchQuery) params.set('q', searchQuery);
        if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','));
        if (status !== 'open') params.set('status', status);
        if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
        if (priceRange.max !== null) params.set('maxPrice', priceRange.max.toString());
        
        // Reset to page 1
        params.set('page', '1');
        
        router.push(`/project-board?${params.toString()}`);
    };
    
    // ฟังก์ชั่นรีเซ็ตตัวกรอง
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedSkills([]);
        setStatus('open');
        setPriceRange({ min: 0, max: null });
        router.push('/project-board');
    };    

    return (
        <div className="flex flex-col gap-3">
            {/* Toaster component for showing notifications */}
            <Toaster position="bottom-left" />
            
            {/* page title */}
            <section className="mt-6 mb-4 flex gap-6 flex-col md:flex-row justify-between place-items-end">
                <div className="flex flex-col gap-2">
                    <h1 className="font-medium text-xl text-primary-blue-500 whitespace-nowrap">
                        โปรเจกต์บอร์ด
                    </h1>
                    <p className="text-gray-400 text-wrap">
                        โพสต์งานหรือโปรเจกต์เพื่อหาฟรีแลนซ์สำหรับทำโปรเจกต์ของคุณ
                    </p>
                </div>
                <NewProjectButton/>
            </section>
            
            {/* Project Filter */}
            <ProjectFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedSkills={selectedSkills}
                onSkillsChange={setSelectedSkills}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
                availableSkills={allSkills}
            />

            <hr className="text-gray-300"/>

            {/* ProjectBoardList with filters */}
            <ProjectBoardList 
                filter={status}
            />
        </div>
    );
}

// Loading fallback component
function ProjectBoardLoading() {
    return <div className="flex justify-center items-center h-64">กำลังโหลด...</div>;
}

// Main component with Suspense
function ProjectBoardPage() {
    return (
        <Suspense fallback={<ProjectBoardLoading />}>
            <ProjectBoardContent />
        </Suspense>
    );
}

export default ProjectBoardPage;