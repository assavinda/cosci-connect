'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Loading from "../../../components/common/Loading";
import { Toaster } from 'react-hot-toast';
import { toast } from "react-hot-toast";
import { usePusher } from "../../../../providers/PusherProvider";

// Project interface
interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requiredSkills: string[];
  owner: string;
  ownerName: string;
  status: string;
  progress: number;
  createdAt: string;
  assignedTo?: string;
  assignedFreelancerName?: string;
  requestToFreelancer?: string;
  freelancersRequested: string[];
}

export default function AllProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState<{[key: string]: boolean}>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // เพิ่ม usePusher hook เพื่อใช้งาน Pusher
  const { subscribeToProjectList } = usePusher();

  // Fetch projects when session is loaded
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError("กรุณาเข้าสู่ระบบเพื่อดูโปรเจกต์");
      router.push('/auth?state=login&callbackUrl=/manage-projects/all-projects');
    }
  }, [status, router]);
  
  // Subscribe to real-time updates for projects
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    // ฟังก์ชัน callback สำหรับเมื่อได้รับการอัปเดตรายการโปรเจกต์
    const handleProjectListUpdate = (data) => {
      console.log('ได้รับการอัปเดตรายการโปรเจกต์:', data);
      
      // รีโหลดข้อมูลโปรเจกต์
      fetchProjects();
    };
    
    // ลงทะเบียนรับการอัปเดตรายการโปรเจกต์
    const unsubscribe = subscribeToProjectList(handleProjectListUpdate);
    
    // ยกเลิกการลงทะเบียนเมื่อ component unmount
    return () => {
      unsubscribe();
    };
  }, [status, subscribeToProjectList]);

  // ฟังก์ชันสำหรับดึงข้อมูลโปรเจกต์ที่เกี่ยวข้องกับผู้ใช้ปัจจุบันเท่านั้น
  const fetchProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const isFreelancer = session?.user?.role === 'student';
      const userId = session?.user?.id;

      // กำหนด parameters สำหรับการค้นหาโปรเจกต์
      let params: Record<string, any> = {
        limit: 100, // ดึงโปรเจกต์จำนวนมากเพื่อให้ได้ทั้งหมด
        status: 'all' // ดึงทุกสถานะ
      };
      
      // สำหรับฟรีแลนซ์ ดึงเฉพาะโปรเจกต์ที่เกี่ยวข้องกับตัวเอง
      if (isFreelancer) {
        // ดึงข้อมูลโดยระบุเงื่อนไขเป็น union ของ 3 กรณี:
        // 1. โปรเจกต์ที่ได้รับมอบหมายให้ทำ (assignedTo)
        // 2. โปรเจกต์ที่เจ้าของส่งคำขอมาให้ (requestToFreelancer)
        // 3. โปรเจกต์ที่ฟรีแลนซ์ส่งคำขอเข้าร่วม (freelancerRequested)
        params = {
          ...params,
          assignedTo: userId,                 // โปรเจกต์ที่ได้รับมอบหมาย 
          requestToFreelancer: userId,        // โปรเจกต์ที่ขอให้ทำ
          freelancerRequested: userId,        // โปรเจกต์ที่ส่งคำขอเข้าร่วม
          userRelatedOnly: 'true'             // เพิ่มพารามิเตอร์พิเศษเพื่อให้ API ทราบว่าต้องการเฉพาะโปรเจกต์ที่เกี่ยวข้อง
        };
      } else {
        // สำหรับเจ้าของโปรเจกต์ (อาจารย์/ศิษย์เก่า) ดึงเฉพาะโปรเจกต์ที่เป็นเจ้าของ
        params = {
          ...params,
          owner: userId // โปรเจกต์ที่ผู้ใช้เป็นเจ้าของ
        };
      }

      // ส่งคำขอไปยัง API
      const response = await axios.get('/api/projects', { params });

      // Set projects data
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจกต์");
    } finally {
      setLoading(false);
    }
  };
  
  // ฟังก์ชันเตรียมลบโปรเจกต์
  const handleDeleteClick = (projectId: string) => {
    setShowDeleteConfirm(projectId);
  };
  
  // ฟังก์ชันยกเลิกการลบ
  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };
  
  // ฟังก์ชันลบโปรเจกต์
  const handleConfirmDelete = async (projectId: string) => {
    try {
      // เริ่มกระบวนการลบ
      setIsDeleting(prev => ({ ...prev, [projectId]: true }));
      
      // ส่งคำขอไปยัง API เพื่อลบโปรเจกต์
      await axios.delete(`/api/projects/${projectId}`);
      
      // อัปเดตรายการโปรเจกต์
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      // แจ้งเตือนสำเร็จ
      toast.success('ลบโปรเจกต์สำเร็จ');
      
      // ปิดหน้าต่างยืนยัน
      setShowDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      
      // แสดงข้อความผิดพลาด
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบโปรเจกต์');
    } finally {
      // จบกระบวนการลบ
      setIsDeleting(prev => ({ ...prev, [projectId]: false }));
    }
  };
  
  // ฟังก์ชันแปลงสถานะโปรเจกต์เป็นภาษาไทย
  const getStatusText = (status: string) => {
    const statusMap = {
      'open': 'เปิดรับสมัคร',
      'in_progress': 'กำลังดำเนินการ',
      'revision': 'กำลังแก้ไข',
      'awaiting': 'รอการยืนยัน',
      'completed': 'เสร็จสิ้น'
    };
    return statusMap[status] || status;
  };
  
  // ฟังก์ชันแปลงสถานะโปรเจกต์เป็นสี
  const getStatusColor = (status: string) => {
    const colorMap = {
      'open': 'bg-green-100 text-green-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'revision': 'bg-orange-100 text-orange-800',
      'awaiting': 'bg-indigo-100 text-indigo-800',
      'completed': 'bg-blue-100 text-blue-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };
  
  // ฟังก์ชันฟอร์แมตราคาเป็นสกุลเงินบาท
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // ฟังก์ชันฟอร์แมตวันที่
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };
  
  // รายการสถานะที่เป็นไปได้
  const statusOptions = [
    { value: 'all', label: 'สถานะทั้งหมด' },
    { value: 'open', label: 'เปิดรับสมัคร' },
    { value: 'in_progress', label: 'กำลังดำเนินการ' },
    { value: 'revision', label: 'กำลังแก้ไข' },
    { value: 'awaiting', label: 'รอการยืนยัน' },
    { value: 'completed', label: 'เสร็จสิ้น' }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลโปรเจกต์...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
        {status === 'unauthenticated' && (
          <button 
            onClick={() => window.location.href = '/auth?state=login&callbackUrl=/manage-projects/all-projects'}
            className="mt-4 px-4 py-2 bg-primary-blue-500 text-white rounded-lg hover:bg-primary-blue-600"
          >
            เข้าสู่ระบบ
          </button>
        )}
      </div>
    );
  }

  // ตรวจสอบว่าผู้ใช้เป็นฟรีแลนซ์หรือไม่
  const isFreelancer = session?.user?.role === 'student';

  return (
    <div className="w-full mx-auto pt-6">
      {/* Toaster component for showing notifications */}
      <Toaster position="bottom-left" />

      <div className="flex justify-between items-center mb-6">
        <Link href="/manage-projects" className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          กลับไปหน้าจัดการโปรเจกต์
        </Link>
      </div>
      
      {/* Header */}
      <section className="mt-6 p-6 flex flex-col gap-2 bg-primary-blue-500 rounded-xl mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-medium text-xl text-white">
              {isFreelancer ? 'โปรเจกต์ของฉัน' : 'โปรเจกต์ทั้งหมด'}
            </h1>
            <p className="text-white/80">
              {isFreelancer 
                ? 'ดูรายการโปรเจกต์ทั้งหมดที่คุณเกี่ยวข้อง'
                : 'ดูรายการโปรเจกต์ทั้งหมดที่คุณเป็นเจ้าของ'}
            </p>
          </div>
        </div>
        
        {/* จำนวนโปรเจกต์ */}
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
            <p className="text-white text-sm">โปรเจกต์ทั้งหมด: <span className="font-medium">
              {projects.length}
            </span></p>
          </div>
        </div>
      </section>
      
      {/* Project list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="text-left p-4 font-medium">ชื่อโปรเจกต์</th>
                  <th className="text-left p-4 font-medium">สถานะ</th>
                  <th className="text-left p-4 font-medium">งบประมาณ</th>
                  <th className="text-left p-4 font-medium">วันที่สร้าง</th>
                  <th className="text-left p-4 font-medium">วันที่ส่งงาน</th>
                  <th className="text-left p-4 font-medium">ความคืบหน้า</th>
                  <th className="text-center p-4 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-primary-blue-500">{project.title}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{project.description}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{formatPrice(project.budget)}</td>
                    <td className="p-4 text-gray-600">{formatDate(project.createdAt)}</td>
                    <td className="p-4 text-gray-600">{formatDate(project.deadline)}</td>
                    <td className="p-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            project.progress < 30 ? 'bg-red-400' : 
                            project.progress < 70 ? 'bg-yellow-400' : 'bg-green-400'
                          }`} 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-center mt-1">{project.progress || 0}%</div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-start">
                        <Link 
                          href={`/project/${project.id}`}
                          className="p-2 rounded-lg hover:bg-gray-100 text-primary-blue-500 transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <div className="btn-primary">
                            <p>ดูโปรเจกต์</p>
                          </div>
                        </Link>
                        
                        {/* แสดงปุ่มลบเฉพาะเมื่อเป็นเจ้าของและสถานะเป็น open */}
                        {!isFreelancer && project.owner === session?.user?.id && project.status === 'open' && (
                          <>
                            {showDeleteConfirm === project.id ? (
                              <div className="flex gap-1">
                                <button 
                                  className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                  onClick={() => handleConfirmDelete(project.id)}
                                  disabled={isDeleting[project.id]}
                                  title="ยืนยันการลบ"
                                >
                                  {isDeleting[project.id] ? (
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </button>
                                <button 
                                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                  onClick={handleCancelDelete}
                                  title="ยกเลิก"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                                onClick={() => handleDeleteClick(project.id)}
                                title="ลบโปรเจกต์"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-4">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <p className="text-gray-500 mb-2">ไม่พบโปรเจกต์ที่ตรงตามเงื่อนไข</p>
            {(searchTerm || filterStatus !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="mt-2 btn-secondary text-sm"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Footer with pagination (ถ้าจำเป็น) */}
      {projects.length > 0 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          แสดง {projects.length} จาก {projects.length} โปรเจกต์
        </div>
      )}
    </div>
  );
}