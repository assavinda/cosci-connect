'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Loading from '../../../components/common/Loading';

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/projects/${id}`);
        setProject(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('ไม่สามารถโหลดข้อมูลโปรเจกต์ได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProjectData();
    }
  }, [id]);

  // ฟอร์แมตราคาเป็นสกุลเงินบาท
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // ฟอร์แมตวันที่
  const formatDate = (dateString) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };

  // แปลงสถานะเป็นภาษาไทย
  const getStatusText = (status) => {
    const statusMap = {
      'open': 'เปิดรับสมัคร',
      'assigned': 'มีผู้รับงานแล้ว',
      'in_progress': 'กำลังดำเนินการ',
      'revision': 'กำลังแก้ไข',
      'awaiting': 'รอการยืนยัน',
      'completed': 'เสร็จสิ้นแล้ว',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  };

  // รับสีสำหรับสถานะ
  const getStatusColor = (status) => {
    const colorMap = {
      'open': 'bg-green-100 text-green-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'revision': 'bg-orange-100 text-orange-800',
      'awaiting': 'bg-purple-100 text-purple-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลโปรเจกต์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl my-6">
        <h2 className="text-red-600 text-lg font-medium mb-4">เกิดข้อผิดพลาด</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/project-board" className="btn-secondary inline-block">
          กลับไปยังหน้าโปรเจกต์บอร์ด
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-gray-50 border border-gray-200 rounded-xl my-6">
        <h2 className="text-lg font-medium mb-4">ไม่พบข้อมูลโปรเจกต์</h2>
        <p className="text-gray-600 mb-4">ไม่พบข้อมูลโปรเจกต์ที่คุณต้องการดู หรืออาจไม่มีอยู่ในระบบ</p>
        <Link href="/project-board" className="btn-secondary inline-block">
          กลับไปยังหน้าโปรเจกต์บอร์ด
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* ปุ่มย้อนกลับ */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/project-board" className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          กลับไปหน้าโปรเจกต์บอร์ด
        </Link>
      </div>

      {/* ข้อมูลโปรเจกต์ */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        {/* ส่วนหัว - ชื่อโปรเจกต์และสถานะ */}
        <div className="bg-primary-blue-500 p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-medium">{project.title}</h1>
            <span className={`px-4 py-1 rounded-full text-sm ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
          </div>
          <p className="text-white/80 mt-2">โดย: {project.ownerName}</p>
        </div>

        {/* รายละเอียดโปรเจกต์ */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* คอลัมน์ซ้าย - ข้อมูลทั่วไป */}
            <div className="lg:col-span-1 space-y-6">
              {/* ข้อมูลงบประมาณและกำหนดส่ง */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">ข้อมูลโปรเจกต์</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-500 text-sm">งบประมาณ</p>
                    <p className="text-xl font-medium text-primary-blue-500">{formatPrice(project.budget)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">กำหนดส่งงาน</p>
                    <p className="font-medium">{formatDate(project.deadline)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">วันที่สร้าง</p>
                    <p className="font-medium">{formatDate(project.createdAt)}</p>
                  </div>
                  {project.status === 'in_progress' && (
                    <div>
                      <p className="text-gray-500 text-sm">ความคืบหน้า</p>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary-blue-500 h-2.5 rounded-full" 
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-right text-sm mt-1">{project.progress || 0}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* ทักษะที่ต้องการ */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">ทักษะที่ต้องการ</h2>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills && project.requiredSkills.length > 0 ? (
                    project.requiredSkills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="bg-primary-blue-100 text-primary-blue-600 text-sm px-3 py-1 rounded-lg"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">ไม่ระบุทักษะที่ต้องการ</p>
                  )}
                </div>
              </div>
              
              {/* ข้อมูลเจ้าของโปรเจกต์ */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">เจ้าของโปรเจกต์</h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-blue-200 flex items-center justify-center text-primary-blue-600 font-medium">
                    {project.ownerName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{project.ownerName}</p>
                    <Link 
                      href={`/user/customer/${project.owner}`}
                      className="text-sm text-primary-blue-500 hover:underline"
                    >
                      ดูโปรไฟล์
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* คอลัมน์ขวา - รายละเอียดโปรเจกต์ */}
            <div className="lg:col-span-2 space-y-6">
              {/* รายละเอียดงาน */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">รายละเอียดงาน</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line">{project.description}</p>
                </div>
              </div>
              
              {/* แสดงข้อมูลฟรีแลนซ์ที่รับงาน (ถ้ามี) */}
              {project.assignedTo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium mb-3 text-gray-800">ฟรีแลนซ์ที่รับงาน</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-green-600 font-medium">
                      F
                    </div>
                    <div>
                      <p className="font-medium">{project.assignedFreelancerName || 'ฟรีแลนซ์'}</p>
                      <Link 
                        href={`/user/freelance/${project.assignedTo}`}
                        className="text-sm text-primary-blue-500 hover:underline"
                      >
                        ดูโปรไฟล์
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              
              {/* ไทม์ไลน์สถานะโปรเจกต์ */}
              {(project.status !== 'open' && project.status !== 'cancelled') && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium mb-3 text-gray-800">สถานะโปรเจกต์</h2>
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    {/* Status timeline */}
                    <div className="relative z-10 flex items-center mb-6">
                      <div className={`w-10 h-10 rounded-full bg-primary-blue-500 text-white flex items-center justify-center`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium">มีผู้รับงานแล้ว</h3>
                        <p className="text-sm text-gray-500">ฟรีแลนซ์ได้รับงานนี้แล้ว</p>
                      </div>
                    </div>
                    
                    {(project.status === 'in_progress' || project.status === 'revision' || project.status === 'awaiting' || project.status === 'completed') && (
                      <div className="relative z-10 flex items-center mb-6">
                        <div className={`w-10 h-10 rounded-full bg-yellow-500 text-white flex items-center justify-center`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">กำลังดำเนินการ</h3>
                          <p className="text-sm text-gray-500">ฟรีแลนซ์กำลังทำงาน</p>
                        </div>
                      </div>
                    )}
                    
                    {(project.status === 'revision') && (
                      <div className="relative z-10 flex items-center mb-6">
                        <div className={`w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">กำลังแก้ไข</h3>
                          <p className="text-sm text-gray-500">ฟรีแลนซ์กำลังแก้ไขงาน</p>
                        </div>
                      </div>
                    )}
                    
                    {(project.status === 'awaiting') && (
                      <div className="relative z-10 flex items-center mb-6">
                        <div className={`w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">รอการยืนยัน</h3>
                          <p className="text-sm text-gray-500">งานเสร็จแล้ว รอเจ้าของโปรเจกต์ตรวจสอบ</p>
                        </div>
                      </div>
                    )}
                    
                    {(project.status === 'completed') && (
                      <div className="relative z-10 flex items-center">
                        <div className={`w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">งานเสร็จสิ้น</h3>
                          <p className="text-sm text-gray-500">
                            งานเสร็จสมบูรณ์แล้ว
                            {project.completedAt && ` เมื่อ ${formatDate(project.completedAt)}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}