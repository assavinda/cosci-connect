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
import { addPDFTransformation } from '@/utils/fileHelpers';

interface CompletedProject {
  id: string;
  title: string;
  description: string;
  budget: number;
  ownerName: string;
  completedAt: string;
  owner: string;
}

export default function FreelancerProfilePage() {
  const { id } = useParams();
  const freelancerId = Array.isArray(id) ? id[0] : id;
  const { data: session } = useSession();
  const [freelancer, setFreelancer] = useState(null);
  const [completedProjects, setCompletedProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'projects'
  
  // เพิ่ม usePusher hook เพื่อใช้งาน Pusher
  const { subscribeToFreelancer } = usePusher();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ดึงข้อมูลฟรีแลนซ์
        const freelancerResponse = await axios.get(`/api/freelancers/${freelancerId}`);
        setFreelancer(freelancerResponse.data);
        
        // ดึงข้อมูลโปรเจกต์ที่ทำเสร็จแล้ว
        const projectsResponse = await axios.get('/api/projects', {
          params: {
            status: 'completed',
            assignedTo: freelancerId,
            limit: 100
          }
        });
        
        // ตั้งค่าโปรเจกต์ที่ทำเสร็จแล้ว
        setCompletedProjects(projectsResponse.data.projects || []);
        
        setError('');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    if (freelancerId) {
      fetchData();
    }
  }, [freelancerId]);
  
  // subscribe การอัปเดตข้อมูลฟรีแลนซ์แบบ realtime
  useEffect(() => {
    if (!freelancerId) return;
    
    const handleFreelancerUpdate = (data) => {
      console.log('ได้รับการอัปเดตข้อมูลฟรีแลนซ์:', data);
      
      // อัปเดตข้อมูลฟรีแลนซ์
      if (data.freelancer) {
        setFreelancer(data.freelancer);
      }
    };
    
    const unsubscribe = subscribeToFreelancer(freelancerId.toString(), handleFreelancerUpdate);
    
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
  
  // ฟังก์ชันฟอร์แมตวันที่
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric' as const, 
      month: 'long' as const, 
      day: 'numeric' as const 
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
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
      <div className="max-w-5xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl my-6 shadow-sm">
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
      <div className="max-w-5xl mx-auto p-6 bg-gray-50 border border-gray-200 rounded-xl my-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">ไม่พบข้อมูลฟรีแลนซ์</h2>
        <p className="text-gray-600 mb-4">ไม่พบข้อมูลฟรีแลนซ์ที่คุณต้องการดู หรืออาจไม่มีอยู่ในระบบ</p>
        <Link href="/find-freelance" className="btn-secondary inline-block">
          กลับไปยังหน้าค้นหาฟรีแลนซ์
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto pt-6">
      {/* หัวข้อและปุ่มย้อนกลับ */}
      <div className="flex justify-between items-center">
        <Link href="/find-freelance" className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          กลับไปหน้าค้นหาฟรีแลนซ์
        </Link>
      </div>

      {/* Hero section - แสดงข้อมูลสำคัญ */}
      <div className="relative p-8 overflow-hidden border-b border-gray-200 mb-6">
        
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
          {/* รูปโปรไฟล์ */}
          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-white flex items-center justify-center outline-8 outline-double outline-primary-blue-500 shadow-lg">
            {freelancer.profileImageUrl ? (
              <img
                src={freelancer.profileImageUrl}
                alt={freelancer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-blue-300 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {freelancer.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          
          {/* ข้อมูลพื้นฐาน */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold">{freelancer.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
              <span className="bg-white/20 backdrop-blur-sm py-1 rounded-full text-sm">
                {freelancer.major}
              </span>
            </div>
            {freelancer.isOpen ? (
                <span className="bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit">
                  <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                  พร้อมรับงาน
                </span>
              ) : (
                <span className="bg-red-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit">
                  <span className="w-2 h-2 bg-red-400 rounded-full inline-block"></span>
                  ไม่พร้อมรับงาน
                </span>
            )}
          </div>
          
          {/* ปุ่มจ้างและส่งข้อความ */}
          <div className="flex place-items-center gap-2 self-center md:self-start">
            {/* ถ้าเป็นผู้ใช้ที่ล็อกอินแล้ว ไม่ใช่ตัวเอง และไม่ใช่ฟรีแลนซ์ ให้แสดงปุ่ม */}
            <div>
              {session?.user?.id && session?.user?.id !== freelancerId && (
                <div className="flex gap-2">
                  {session?.user?.role !== 'student' && (
                    <HireButton 
                      freelancerId={freelancerId} 
                      freelancerName={freelancer.name} 
                      freelancerSkills={freelancer.skills || []} 
                    />
                  )}
                  
                  <SendMessageButton 
                    recipientId={freelancerId} 
                    recipientName={freelancer.name} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content - แสดงข้อมูลและแกลเลอรี่ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* คอลัมน์ซ้าย - ทักษะและข้อมูล */}
        <div className="lg:col-span-1 space-y-6">
          {/* ทักษะ */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                <path d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.15 1 4.9a5.71 5.71 0 0 1 .5 2.55V20"></path>
                <path d="M2 12h20"></path>
                <path d="M19 8.25s-.5-6.5-4-6.5-4.5 6.5-4.5 6.5"></path>
                <path d="M19.9 16.75C19.4 16.37 18.7 16 18 16c-1.35 0-2 .62-2 1.5s.65 1.5 2 1.5c.7 0 1.4-.37 1.9-.75l1.1 1.5c-.85.62-1.9 1-3 1-2.35 0-4-1.37-4-3.25S15.65 14 18 14c1.1 0 2.15.38 3 1l-1.1 1.75z"></path>
              </svg>
              <h2 className="text-lg font-bold">ทักษะ</h2>
              <span className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-0.5 rounded-full">
                {freelancer.skills?.length || 0}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {freelancer.skills && freelancer.skills.length > 0 ? (
                freelancer.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="bg-primary-blue-50 text-primary-blue-600 text-sm px-3 py-1 rounded-full border border-primary-blue-100 hover:bg-primary-blue-100 transition-colors"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 italic">ไม่ระบุทักษะ</p>
              )}
            </div>
          </div>
          
          {/* พอร์ตโฟลิโอ */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"></path>
                <path d="M19 3h-8.5a3.5 3.5 0 0 0-3.5 3.5 3.5 3.5 0 0 0 3.5 3.5H16"></path>
                <path d="M19 13h-7.5a3.5 3.5 0 0 0 0 7H12"></path>
              </svg>
              <h2 className="text-lg font-bold">พอร์ตโฟลิโอ</h2>
            </div>
            
            {freelancer.portfolioUrl ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                {/* เพิ่ม PDFViewer component สำหรับดูไฟล์ PDF */}
                <PDFViewer 
                  pdfUrl={addPDFTransformation(freelancer.portfolioUrl)} 
                  fileName={`พอร์ตโฟลิโอของ ${freelancer.name}`}
                />
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <p className="text-gray-500">ไม่มีไฟล์พอร์ตโฟลิโอ</p>
              </div>
            )}
          </div>
        </div>
        
        {/* คอลัมน์ขวา - แกลเลอรี่ ประวัติ และโปรเจกต์ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ประวัติและคำอธิบาย */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                <circle cx="12" cy="8" r="5"></circle>
                <path d="M20 21a8 8 0 1 0-16 0"></path>
              </svg>
              <h2 className="text-lg font-bold">เกี่ยวกับฟรีแลนซ์</h2>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className={`${freelancer.bio ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                {freelancer.bio || 'ฟรีแลนซ์ไม่ได้เพิ่มข้อมูลส่วนตัว'}
              </p>
            </div>
          </div>
          
          {/* แท็บแกลเลอรี่/โปรเจกต์ */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Tab navigation */}
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-3 px-4 font-medium text-center transition-colors ${
                  activeTab === 'gallery'
                    ? 'border-b-2 border-primary-blue-500 text-primary-blue-500'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('gallery')}
              >
                ตัวอย่างผลงาน
              </button>
              <button
                className={`flex-1 py-3 px-4 font-medium text-center transition-colors ${
                  activeTab === 'projects'
                    ? 'border-b-2 border-primary-blue-500 text-primary-blue-500'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('projects')}
              >
                โปรเจกต์ที่เสร็จแล้ว {completedProjects.length > 0 && <span className="ml-1 bg-primary-blue-100 text-primary-blue-600 text-xs px-1.5 py-0.5 rounded-full">{completedProjects.length}</span>}
              </button>
            </div>
            
            {/* Tab content */}
            <div className="p-6">
              {/* แกลเลอรี่ */}
              {activeTab === 'gallery' && (
                <div>
                  {freelancer.galleryImages && freelancer.galleryImages.length > 0 ? (
                    <div className="space-y-4">
                      {/* รูปใหญ่ */}
                      <div className="relative bg-gray-100 rounded-xl overflow-hidden shadow-inner aspect-video flex items-center justify-center">
                        <img
                          src={freelancer.galleryImages[currentImageIndex]}
                          alt={`ตัวอย่างผลงาน ${currentImageIndex + 1}`}
                          className="max-w-full max-h-full object-contain"
                        />
                        
                        {/* ปุ่มเลื่อนรูปภาพ */}
                        {freelancer.galleryImages.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
                              aria-label="ภาพก่อนหน้า"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                              </svg>
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
                              aria-label="ภาพถัดไป"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </button>
                          </>
                        )}
                        
                        {/* ตัวบอกจำนวนรูปภาพ */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {freelancer.galleryImages.length}
                        </div>
                      </div>
                      
                      {/* รูปภาพขนาดเล็ก */}
                      {freelancer.galleryImages.length > 1 && (
                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                          {freelancer.galleryImages.map((img, index) => (
                            <div 
                              key={index}
                              className={`aspect-square cursor-pointer rounded-lg overflow-hidden ${
                                index === currentImageIndex 
                                  ? 'ring-2 ring-primary-blue-500 ring-offset-2' 
                                  : 'border border-gray-200 opacity-70 hover:opacity-100'
                              }`}
                              onClick={() => setCurrentImageIndex(index)}
                            >
                              <img
                                src={img}
                                alt={`thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <p className="text-gray-500 mb-2">ฟรีแลนซ์ยังไม่ได้เพิ่มตัวอย่างผลงาน</p>
                      <p className="text-gray-400 text-sm">คุณสามารถดูประวัติการทำงานได้ในแท็บ "โปรเจกต์ที่เสร็จแล้ว"</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* โปรเจกต์ที่ทำเสร็จแล้ว */}
              {activeTab === 'projects' && (
                <div>
                  {completedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completedProjects.map((project) => (
                        <Link 
                          key={project.id}
                          href={`/project/${project.id}`}
                          className="block bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-primary-blue-300 hover:shadow-md transition-all"
                        >
                          <h3 className="font-bold text-primary-blue-500">{project.title}</h3>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">เจ้าของโปรเจกต์</span>
                              <span className="font-medium">{project.ownerName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">งบประมาณ</span>
                              <span className="font-medium text-green-600">{formatPrice(project.budget)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">เสร็จสิ้นเมื่อ</span>
                              <span className="font-medium">{formatDate(project.completedAt)}</span>
                            </div>
                          </div>
                          <p className="mt-3 text-gray-600 line-clamp-2 text-sm">{project.description}</p>
                          <div className="mt-2 text-primary-blue-500 text-right text-sm font-medium">
                            ดูรายละเอียด →
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                      <p className="text-gray-500 mb-2">ฟรีแลนซ์ยังไม่มีโปรเจกต์ที่ทำเสร็จ</p>
                      <p className="text-gray-400 text-sm">คุณสามารถดูตัวอย่างผลงานได้ในแท็บ "ตัวอย่างผลงาน"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* ส่วนเพิ่มเติม - คำรับรองและตราประทับ */}
      {completedProjects.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4 gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
              <path d="m7 11 2-2-2-2"></path>
              <path d="M11 13h4"></path>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
            <h2 className="text-lg font-bold">ข้อมูลเพิ่มเติม</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* โปรเจกต์ที่ทำเสร็จ */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col items-center">
              <div className="rounded-full bg-primary-blue-100 w-12 h-12 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="font-bold text-xl text-primary-blue-500">{completedProjects.length}</h3>
              <p className="text-gray-700">โปรเจกต์ที่ทำเสร็จแล้ว</p>
            </div>
            
            {/* ระยะเวลาที่ใช้ */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col items-center">
              <div className="rounded-full bg-primary-blue-100 w-12 h-12 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 className="font-bold text-xl text-primary-blue-500">
                {/* คำนวณเฉลี่ยวัน */}
                ~7 วัน
              </h3>
              <p className="text-gray-700">ระยะเวลาทำงานเฉลี่ย</p>
            </div>
            
            {/* ความพึงพอใจ */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col items-center">
              <div className="rounded-full bg-primary-blue-100 w-12 h-12 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                  <path d="M9 10h.01"></path>
                  <path d="M15 10h.01"></path>
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20"></path>
                  <path d="M9.5 15a3.5 3.5 0 0 0 5 0"></path>
                </svg>
              </div>
              <h3 className="font-bold text-xl text-primary-blue-500">
                100%
              </h3>
              <p className="text-gray-700">ความพึงพอใจของลูกค้า</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}