'use client';

import React, { Suspense } from "react";
import Loading from "../../components/common/Loading";

// แยก Component หลักไปอยู่ด้านล่าง
const FindFreelancePage = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center my-12">
        <Loading size="large" color="primary" />
      </div>
    }>
      <FreelancePageContent />
    </Suspense>
  );
};

// สร้าง Component ย่อยที่มีโค้ดหลักทั้งหมด
import { useState, useEffect } from "react";
import FreelanceList from "../../components/lists/FreelanceList";
import FreelanceFilter from "../../components/filters/FreelanceFilter";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { skillCategories } from "../../components/auth/register/RegisterForm";
import { usePusher } from "../../../providers/PusherProvider";

function FreelancePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [totalFreelancers, setTotalFreelancers] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedMajor, setSelectedMajor] = useState(searchParams.get('major') || '');
    const [priceRange, setPriceRange] = useState({
        min: parseInt(searchParams.get('minPrice') || '0', 10),
        max: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : null
    });
    
    // เพิ่ม usePusher hook เพื่อใช้งาน Pusher
    const { subscribeToFreelancerList } = usePusher();
    
    // Get all available skills from skill categories for the filter
    const allSkills: string[] = Object.values(skillCategories).flat();
    
    // Initialize selected skills from URL parameters
    useEffect(() => {
        const skills = searchParams.get('skills');
        if (skills) {
            setSelectedSkills(skills.split(','));
        }
        
        const query = searchParams.get('q');
        if (query) {
            setSearchQuery(query);
        }
        
        const major = searchParams.get('major');
        if (major) {
            setSelectedMajor(major);
        }
        
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        
        if (minPrice || maxPrice) {
            setPriceRange({
                min: minPrice ? parseInt(minPrice, 10) : 0,
                max: maxPrice ? parseInt(maxPrice, 10) : null
            });
        }
    }, [searchParams]);
    
    // เพิ่ม Effect สำหรับการลงทะเบียนรับการอัปเดตรายการฟรีแลนซ์แบบ realtime
    useEffect(() => {
        // ฟังก์ชัน callback สำหรับเมื่อได้รับการอัปเดตรายการฟรีแลนซ์
        const handleFreelancerListUpdate = (data) => {
            console.log('ได้รับการอัปเดตรายการฟรีแลนซ์:', data);
            
            // รีโหลดข้อมูลจำนวนฟรีแลนซ์
            fetchTotalCount();
        };
        
        // ลงทะเบียนรับการอัปเดตรายการฟรีแลนซ์
        const unsubscribe = subscribeToFreelancerList(handleFreelancerListUpdate);
        
        // ยกเลิกการลงทะเบียนเมื่อ component unmount
        return () => {
            unsubscribe();
        };
    }, [subscribeToFreelancerList]);
    
    // Fetch total count of available freelancers (students with isOpen=true)
    const fetchTotalCount = async () => {
        try {
            // Build params object for API call
            const params: Record<string, string | number> = {};
            
            // Add filters if they exist
            if (searchQuery) params.q = searchQuery;
            if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');
            if (selectedMajor) params.major = selectedMajor;
            if (priceRange.min > 0) params.minPrice = priceRange.min;
            if (priceRange.max !== null) params.maxPrice = priceRange.max;
            
            // Make HEAD request to get count
            const response = await axios.head('/api/freelancers', { params });
            const totalCount = parseInt(response.headers['x-total-count'], 10);
            
            if (!isNaN(totalCount)) {
                setTotalFreelancers(totalCount);
            }
            
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching total freelancers count:', error);
            setIsLoading(false);
        }
    };

    // เรียก fetchTotalCount เมื่อ component โหลดครั้งแรกหรือเมื่อตัวกรองเปลี่ยน
    useEffect(() => {
        fetchTotalCount();
    }, [searchQuery, selectedSkills, selectedMajor, priceRange]);
    
    // Handle filter changes and update URL
    const applyFilters = () => {
        const params = new URLSearchParams();
        
        if (searchQuery) params.set('q', searchQuery);
        if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','));
        if (selectedMajor) params.set('major', selectedMajor);
        if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
        if (priceRange.max !== null) params.set('maxPrice', priceRange.max.toString());
        
        // Reset to page 1
        params.set('page', '1');
        
        router.push(`/find-freelance?${params.toString()}`);
    };
    
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedSkills([]);
        setSelectedMajor('');
        setPriceRange({ min: 0, max: null });
        router.push('/find-freelance');
    };
    
    const majors = [
        "คอมพิวเตอร์เพื่อการสื่อสาร",
        "การจัดการธุรกิจไซเบอร์",
        "การออกแบบส่ื่อปฏิสัมพันธ์และมัลติมีเดีย",
        "การสื่อสารเพื่อการท่องเที่ยว",
        "การสื่อสารเพื่อสุขภาพ"
    ];
    
    return (
        <div className="flex flex-col gap-3">
            {/* page title */}
            <section className="mt-6 mb-4 flex flex-col gap-2">
                <h1 className="font-medium text-xl text-primary-blue-500 whitespace-nowrap">
                    ค้นหาฟรีแลนซ์
                </h1>
                <p className="text-gray-400 text-wrap">
                    ค้นหาฟรีแลนซ์จากทักษะความสามารถที่ตอบโจทย์ไอเดียของคุณ
                </p>
            </section>

            {/* Filters section */}
            <FreelanceFilter 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedSkills={selectedSkills}
                onSkillsChange={setSelectedSkills}
                selectedMajor={selectedMajor}
                onMajorChange={setSelectedMajor}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
                availableSkills={allSkills}
                availableMajors={majors}
            />

            <hr className="text-gray-300"/>

            {/* freelance list with pagination */}
            {isLoading ? (
                <div className="flex justify-center my-12">
                    <Loading size="large" color="primary" />
                </div>
            ) : (
                <FreelanceList 
                    totalItems={totalFreelancers}
                    searchQuery={searchQuery}
                    selectedSkills={selectedSkills} 
                    selectedMajor={selectedMajor}
                    priceRange={priceRange}
                />
            )}
        </div>
    );
}

export default FindFreelancePage;