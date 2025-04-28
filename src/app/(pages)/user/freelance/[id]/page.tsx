'use client';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import Loading from "../../../../components/common/Loading";
import HireButton from "../../../../components/buttons/HireButton";
import { Toaster } from 'react-hot-toast';

interface Freelancer {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  major: string;
  skills: string[];
  profileImageUrl?: string;
  basePrice: number;
  galleryImages: string[];
  bio?: string;
  portfolioUrl?: string;
}

export default function FreelancerProfilePage() {
  const params = useParams();
  // รับค่า id จาก URL parameter
  const id = params.id as string;
  // สถานะสำหรับเก็บข้อมูลฟรีแลนซ์
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null);
  // สถานะแสดงการโหลด
  const [loading, setLoading] = useState(true);
  // สถานะสำหรับเก็บข้อความข้อผิดพลาด (ถ้ามี)
  const [error, setError] = useState("");
  // สถานะเก็บ index ของรูปภาพที่กำลังแสดงในแกลเลอรี่
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // ดึงข้อมูลฟรีแลนซ์เมื่อ component โหลด
  useEffect(() => {
    const fetchFreelancer = async () => {
      setLoading(true);
      try {
        // เรียกใช้ API endpoint เพื่อดึงข้อมูลฟรีแลนซ์ตาม ID
        const response = await axios.get(`/api/freelancers/${id}`);
        setFreelancer(response.data);
      } catch (err) {
        console.error("Error fetching freelancer:", err);
        setError("ไม่สามารถโหลดข้อมูลฟรีแลนซ์ได้");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchFreelancer();
    }
  }, [id]);
  
  // ฟังก์ชันสำหรับแปลงราคาเป็นรูปแบบเงินบาทไทย
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // แสดงสถานะกำลังโหลด
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลฟรีแลนซ์...</p>
      </div>
    );
  }
  
  // แสดงข้อความกรณีเกิดข้อผิดพลาดหรือไม่พบข้อมูล
  if (error || !freelancer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center my-6">
        <h2 className="text-red-600 text-lg font-medium mb-3">
          {error || "ไม่พบข้อมูลฟรีแลนซ์"}
        </h2>
        <p className="text-gray-600 mb-4">
          ขออภัย ไม่สามารถโหลดข้อมูลฟรีแลนซ์ที่คุณต้องการได้
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          กลับไปหน้าก่อนหน้า
        </button>
      </div>
    );
  }
  
  // คำนวณดัชนีของรูปภาพถัดไป
  const nextImageIndex = 
    currentImageIndex === freelancer.galleryImages.length - 1 
      ? 0 
      : currentImageIndex + 1;
  
  // คำนวณดัชนีของรูปภาพก่อนหน้า
  const prevImageIndex = 
    currentImageIndex === 0 
      ? freelancer.galleryImages.length - 1 
      : currentImageIndex - 1;
  
  return (
    <div className="w-full mt-6">
      {/* Toast notification component */}
      <Toaster position="top-right" />
      
      {/* ปุ่มกลับไปหน้าก่อนหน้า */}
      <div className="mb-6">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
          กลับไปหน้ารายการฟรีแลนซ์
        </button>
      </div>
      
      {/* ข้อมูลโปรไฟล์ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* รูปโปรไฟล์ */}
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 mx-auto md:mx-0 flex-shrink-0">
            {freelancer.profileImageUrl ? (
              <img 
                src={freelancer.profileImageUrl} 
                alt={`${freelancer.name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-4xl font-medium">
                {freelancer.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          
          {/* ข้อมูลพื้นฐาน */}
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h1 className="text-xl font-medium mb-2 text-center md:text-left">{freelancer.name}</h1>
                <div className="mb-4">
                  <span className="text-gray-500">{freelancer.major}</span>
                </div>
                
                <div className="mb-4">
                  <span className="text-gray-500">ราคาเริ่มต้น:</span>
                  <span className="ml-2 text-lg font-medium text-blue-600">{formatCurrency(freelancer.basePrice)}</span>
                </div>
                
                <div>
                  <span className="text-gray-500 block mb-2">ทักษะ:</span>
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills.length > 0 ? (
                      freelancer.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="bg-primary-blue-100 text-primary-blue-500 px-2 py-1 rounded-md text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">ไม่ระบุทักษะ</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* ปุ่มจ้างฟรีแลนซ์ */}
              <div className="flex justify-center md:justify-end mt-4 md:mt-0">
                <HireButton 
                  freelancerId={freelancer.id}
                  freelancerName={freelancer.name}
                  freelancerSkills={freelancer.skills}
                  basePrice={freelancer.basePrice}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ข้อมูลเกี่ยวกับ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">เกี่ยวกับ</h2>
        {freelancer.bio ? (
          <p className="text-gray-700 whitespace-pre-line">{freelancer.bio}</p>
        ) : (
          <p className="text-gray-400">ไม่มีข้อมูล</p>
        )}
      </div>
      
      {/* แกลเลอรี่ผลงาน */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">ตัวอย่างผลงาน</h2>
        
        {freelancer.galleryImages && freelancer.galleryImages.length > 0 ? (
          <div>
            {/* รูปภาพหลัก */}
            <div className="relative w-full h-64 md:h-80 bg-gray-100 rounded-lg mb-4 overflow-hidden">
              <img 
                src={freelancer.galleryImages[currentImageIndex]} 
                alt={`ตัวอย่างผลงานของ ${freelancer.name}`}
                className="w-full h-full object-contain"
              />
              
              {/* ปุ่มนำทางรูปภาพ - แสดงเฉพาะเมื่อมีรูปภาพมากกว่า 1 รูป */}
              {freelancer.galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prevImageIndex)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                    aria-label="Previous image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(nextImageIndex)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                    aria-label="Next image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </>
              )}
              
              {/* ข้อความแสดงจำนวนรูปภาพ */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
                {currentImageIndex + 1} / {freelancer.galleryImages.length}
              </div>
            </div>
            
            {/* รูปย่อสำหรับเลือกภาพ (แสดงเฉพาะเมื่อมีรูปภาพมากกว่า 1 รูป) */}
            {freelancer.galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {freelancer.galleryImages.map((image, index) => (
                  <button 
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-16 rounded-md overflow-hidden ${
                      index === currentImageIndex
                        ? 'ring-2 ring-blue-500'
                        : 'ring-1 ring-gray-200'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`ภาพย่อที่ ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
          </div>
        ) : (
          <div className="bg-gray-50 p-10 rounded-lg text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mx-auto mb-4 text-gray-400"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p className="text-gray-500">ฟรีแลนซ์ยังไม่ได้อัปโหลดตัวอย่างผลงาน</p>
          </div>
        )}
      </div>
      
      {/* พอร์ตโฟลิโอ (แสดงเฉพาะเมื่อมีข้อมูล) */}
      {freelancer.portfolioUrl && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-medium mb-4">พอร์ตโฟลิโอ</h2>
          <p className="mb-4 text-gray-700">
            ฟรีแลนซ์ได้แชร์ไฟล์พอร์ตโฟลิโอรวมผลงานในรูปแบบ PDF ไว้สำหรับให้คุณดูรายละเอียดเพิ่มเติม
          </p>
          <a 
            href={freelancer.portfolioUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            เปิดพอร์ตโฟลิโอ PDF
          </a>
        </div>
      )}
    </div>
  );
}