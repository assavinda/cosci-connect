'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import Loading from '../../../../components/common/Loading';
import HireButton from '../../../../components/buttons/HireButton';
import SendMessageButton from '../../../../components/buttons/SendMessageButton';
import { usePusher } from '../../../../../providers/PusherProvider';
import PDFViewer from '../../../../components/common/PDFViewer';
// ด้านบนของไฟล์ที่จะใช้งาน
import { addPDFTransformation } from '@/utils/fileHelpers';

export default function FreelancerProfilePage() {
  const { id } = useParams();
  const freelancerId = Array.isArray(id) ? id[0] : id; // แปลงจาก ParamValue เป็น string
  const { data: session } = useSession();
  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // เพิ่ม usePusher hook เพื่อใช้งาน Pusher
  const { subscribeToFreelancer } = usePusher();

  useEffect(() => {
    const fetchFreelancerData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/freelancers/${freelancerId}`);
        setFreelancer(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching freelancer data:', err);
        setError('ไม่สามารถโหลดข้อมูลฟรีแลนซ์ได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    if (freelancerId) {
      fetchFreelancerData();
    }
  }, [freelancerId]);
  
  // เพิ่ม Effect สำหรับ subscribe การอัปเดตข้อมูลฟรีแลนซ์แบบ realtime
  useEffect(() => {
    if (!freelancerId) return;
    
    // ฟังก์ชัน callback สำหรับเมื่อได้รับข้อมูลอัปเดต
    const handleFreelancerUpdate = (data) => {
      console.log('ได้รับการอัปเดตข้อมูลฟรีแลนซ์:', data);
      
      // อัปเดตข้อมูลฟรีแลนซ์
      if (data.freelancer) {
        setFreelancer(data.freelancer);
      }
    };
    
    // ลงทะเบียนรับการอัปเดตข้อมูลฟรีแลนซ์
    const unsubscribe = subscribeToFreelancer(freelancerId.toString(), handleFreelancerUpdate);
    
    // ยกเลิกการลงทะเบียนเมื่อ component unmount
    return () => {
      unsubscribe();
    };
  }, [freelancerId, subscribeToFreelancer]);

  // สำหรับเปลี่ยนรูปภาพในแกลเลอรี่
  const nextImage = () => {
    if (freelancer?.galleryImages?.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === freelancer.galleryImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (freelancer?.galleryImages?.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? freelancer.galleryImages.length - 1 : prev - 1
      );
    }
  };

  // ฟอร์แมตราคาเป็นสกุลเงินบาท
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลฟรีแลนซ์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl my-6">
        <h2 className="text-red-600 text-lg font-medium mb-4">เกิดข้อผิดพลาด</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/find-freelance" className="btn-secondary inline-block">
          กลับไปยังหน้าค้นหาฟรีแลนซ์
        </Link>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-gray-50 border border-gray-200 rounded-xl my-6">
        <h2 className="text-lg font-medium mb-4">ไม่พบข้อมูลฟรีแลนซ์</h2>
        <p className="text-gray-600 mb-4">ไม่พบข้อมูลฟรีแลนซ์ที่คุณต้องการดู หรืออาจไม่มีอยู่ในระบบ</p>
        <Link href="/find-freelance" className="btn-secondary inline-block">
          กลับไปยังหน้าค้นหาฟรีแลนซ์
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* หัวข้อและปุ่มย้อนกลับ */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/find-freelance" className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          กลับไปหน้าค้นหาฟรีแลนซ์
        </Link>
        
        {/* เพิ่มปุ่ม HireButton และ SendMessageButton ตามสิทธิ์ */}
        <div className="flex gap-2">
            {/* ถ้าเป็นผู้ใช้ที่ล็อกอินแล้ว ไม่ใช่ตัวเอง และไม่ใช่ฟรีแลนซ์ ให้แสดงปุ่ม SendMessageButton */}
            {session?.user?.id && session?.user?.id !== freelancerId && session?.user?.role !== 'student' && (
              <SendMessageButton 
                recipientId={freelancerId} 
                recipientName={freelancer.name} 
              />
            )}
            
            {/* ถ้าผู้ใช้ไม่ใช่ student และไม่ใช่ตัวเอง ให้แสดงปุ่ม HireButton */}
            {session?.user?.role !== 'student' && session?.user?.id !== freelancerId && (
              <HireButton 
                freelancerId={freelancerId} 
                freelancerName={freelancer.name} 
                freelancerSkills={freelancer.skills || []} 
              />
            )}
        </div>
      </div>

      {/* ข้อมูลฟรีแลนซ์ */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        {/* ส่วนหัว - ข้อมูลพื้นฐาน */}
        <div className="bg-primary-blue-500 p-6 text-white">
          <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
            {/* รูปโปรไฟล์ */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/30 flex items-center justify-center">
              {freelancer.profileImageUrl ? (
                <img
                  src={freelancer.profileImageUrl}
                  alt={freelancer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-medium">
                  {freelancer.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            
            {/* ข้อมูลส่วนตัว */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-medium">{freelancer.name}</h1>
              <p className="text-white/80">{freelancer.major}</p>
              <p className="text-xl font-medium mt-2">
                ราคาเริ่มต้น: {formatPrice(freelancer.basePrice || 500)}
              </p>
            </div>
          </div>
        </div>

        {/* ข้อมูลทักษะและรายละเอียด */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* คอลัมน์ซ้าย - ทักษะและรายละเอียด */}
            <div className="lg:col-span-1 space-y-6">
              {/* ทักษะ */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">ทักษะ</h2>
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills && freelancer.skills.length > 0 ? (
                    freelancer.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="bg-primary-blue-100 text-primary-blue-600 text-sm px-3 py-1 rounded-lg"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">ไม่ระบุทักษะ</p>
                  )}
                </div>
              </div>
              
              {/* ข้อมูลการติดต่อ และลิงก์ */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">เอกสาร</h2>
                {freelancer.portfolioUrl ? (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    <a 
                      href={addPDFTransformation(freelancer.portfolioUrl)}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-blue-500 hover:underline"
                      download="portfolio.pdf"
                    >
                      ดูพอร์ตโฟลิโอ (PDF)
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500">ไม่มีเอกสารพอร์ตโฟลิโอ</p>
                )}
              </div>
            </div>
            
            {/* คอลัมน์ขวา - แกลเลอรี่และประวัติ */}
            <div className="lg:col-span-2 space-y-6">
              {/* ประวัติและคำอธิบาย */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">เกี่ยวกับฟรีแลนซ์</h2>
                <p className="text-gray-700">
                  {freelancer.bio || 'ฟรีแลนซ์ไม่ได้เพิ่มข้อมูลเกี่ยวกับตนเอง'}
                </p>
              </div>
              
              {/* แกลเลอรี่ */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">ตัวอย่างผลงาน</h2>
                
                {freelancer.galleryImages && freelancer.galleryImages.length > 0 ? (
                  <div className="relative">
                    <div className="w-full h-72 md:h-96 bg-gray-200 rounded-lg overflow-hidden relative">
                      <img
                        src={freelancer.galleryImages[currentImageIndex]}
                        alt={`ตัวอย่างผลงาน ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain"
                      />
                      
                      {/* ปุ่มเลื่อนรูปภาพ */}
                      {freelancer.galleryImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* ตัวบอกจำนวนรูปภาพ */}
                    <div className="mt-2 flex justify-center">
                      <p className="text-gray-500 text-sm">
                        {currentImageIndex + 1} / {freelancer.galleryImages.length}
                      </p>
                    </div>
                    
                    {/* รูปภาพขนาดเล็ก */}
                    {freelancer.galleryImages.length > 1 && (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {freelancer.galleryImages.map((img, index) => (
                          <div 
                            key={index}
                            className={`h-16 cursor-pointer rounded-md overflow-hidden border-2 ${index === currentImageIndex ? 'border-primary-blue-500' : 'border-transparent'}`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            <img
                              src={img}
                              alt={`thumbnail ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p className="text-gray-500">ไม่มีตัวอย่างผลงาน</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}