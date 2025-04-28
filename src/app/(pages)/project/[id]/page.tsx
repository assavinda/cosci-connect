'use client';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import Loading from "../../../components/common/Loading";

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requiredSkills: string[];
  owner: string;
  ownerName: string;
  status: 'open' | 'assigned' | 'in_progress' | 'revision' | 'completed' | 'cancelled';
  progress: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  assignedTo?: string;
  assignedFreelancerName?: string;
  applicants?: string[];
  applicantNames?: string[];
  invitations?: string[];
  invitationNames?: string[];
  messages?: ProjectMessage[];
}

interface ProjectMessage {
  from: string;
  fromName: string;
  content: string;
  timestamp: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  // รับค่า id จาก URL parameter
  const id = params.id as string;
  // สถานะสำหรับเก็บข้อมูลโปรเจกต์
  const [project, setProject] = useState<Project | null>(null);
  // สถานะแสดงการโหลด
  const [loading, setLoading] = useState(true);
  // สถานะสำหรับเก็บข้อความข้อผิดพลาด (ถ้ามี)
  const [error, setError] = useState("");
  
  // ดึงข้อมูลโปรเจกต์เมื่อ component โหลด
  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        // เรียกใช้ API endpoint เพื่อดึงข้อมูลโปรเจกต์ตาม ID
        const response = await axios.get(`/api/projects/${id}`);
        setProject(response.data);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("ไม่สามารถโหลดข้อมูลโปรเจกต์ได้");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProject();
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
  
  // ฟังก์ชันแปลงวันที่เป็นรูปแบบที่อ่านง่าย
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      
      // ตรวจสอบว่าเป็นวันที่ที่ถูกต้องหรือไม่
      if (isNaN(date.getTime())) {
        return "";
      }
      
      // รูปแบบวันที่ DD/MM/YYYY
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (error) {
      console.error("Invalid date format:", error);
      return "";
    }
  };
  
  // ฟังก์ชันแปลงสถานะโปรเจกต์เป็นภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'เปิดรับสมัคร';
      case 'assigned': return 'มีผู้รับงานแล้ว';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'revision': return 'กำลังแก้ไข';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };
  
  // ฟังก์ชันคำนวณระยะเวลาที่เหลือจนถึงวันกำหนดส่ง
  const getRemainingTime = (deadlineString: string) => {
    if (!deadlineString) return "";
    
    try {
      const today = new Date();
      const deadline = new Date(deadlineString);
      
      // ตรวจสอบว่าเป็นวันที่ที่ถูกต้องหรือไม่
      if (isNaN(deadline.getTime())) {
        return "";
      }
      
      // คำนวณจำนวนวันที่เหลือ
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return "เลยกำหนดแล้ว";
      } else if (diffDays === 0) {
        return "วันนี้";
      } else {
        return `อีก ${diffDays} วัน`;
      }
    } catch (error) {
      console.error("Error calculating remaining time:", error);
      return "";
    }
  };
  
  // ฟังก์ชันกำหนดสีตามสถานะโปรเจกต์
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'revision': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // แสดงสถานะกำลังโหลด
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลโปรเจกต์...</p>
      </div>
    );
  }
  
  // แสดงข้อความกรณีเกิดข้อผิดพลาดหรือไม่พบข้อมูล
  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center my-6">
        <h2 className="text-red-600 text-lg font-medium mb-3">
          {error || "ไม่พบข้อมูลโปรเจกต์"}
        </h2>
        <p className="text-gray-600 mb-4">
          ขออภัย ไม่สามารถโหลดข้อมูลโปรเจกต์ที่คุณต้องการได้
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
  
  return (
    <div className="w-full mx-auto">
      {/* ปุ่มกลับไปหน้าก่อนหน้า */}
      <div className="mb-6">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
          กลับไปหน้ารายการโปรเจกต์
        </button>
      </div>
      
      {/* หัวข้อโปรเจกต์และสถานะ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-medium">{project.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(project.status)}`}>
            {getStatusText(project.status)}
          </span>
        </div>
        
        <div className="mt-4 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <span className="text-gray-500">เจ้าของโปรเจกต์:</span>
            <span className="ml-2">{project.ownerName}</span>
          </div>
          <div>
            <span className="text-gray-500">วันที่สร้าง:</span>
            <span className="ml-2">{formatDate(project.createdAt)}</span>
          </div>
        </div>
      </div>
      
      {/* รายละเอียดข้อมูลโปรเจกต์ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* คอลัมน์ซ้าย - ข้อมูลทั่วไป */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">รายละเอียดโปรเจกต์</h2>
            <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
          </div>
          
          {/* ทักษะที่ต้องการ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-medium mb-4">ทักษะที่ต้องการ</h2>
            <div className="flex flex-wrap gap-2">
              {project.requiredSkills && project.requiredSkills.length > 0 ? (
                project.requiredSkills.map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-400">ไม่ระบุทักษะที่ต้องการ</p>
              )}
            </div>
          </div>
        </div>
        
        {/* คอลัมน์ขวา - ข้อมูลเพิ่มเติม */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-medium mb-4">ข้อมูลโปรเจกต์</h2>
            <div className="space-y-4">
              {/* งบประมาณ */}
              <div>
                <h3 className="text-gray-500 font-medium mb-1">งบประมาณ</h3>
                <p className="text-xl text-blue-600 font-medium">{formatCurrency(project.budget)}</p>
              </div>
              
              {/* กำหนดส่งงาน */}
              <div>
                <h3 className="text-gray-500 font-medium mb-1">กำหนดส่งงาน</h3>
                <p className="font-medium">{formatDate(project.deadline)}</p>
                <p className="text-sm text-gray-500">{getRemainingTime(project.deadline)}</p>
              </div>
              
              {/* ความคืบหน้า */}
              <div>
                <div className="flex justify-between mb-1">
                  <h3 className="text-gray-500 font-medium">ความคืบหน้า</h3>
                  <span className="text-sm">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* แสดงฟรีแลนซ์ที่รับงาน (ถ้ามี) */}
              {project.assignedFreelancerName && (
                <div>
                  <h3 className="text-gray-500 font-medium mb-1">ฟรีแลนซ์ที่รับงาน</h3>
                  <p className="font-medium">{project.assignedFreelancerName}</p>
                </div>
              )}
              
              {/* แสดงผู้สมัครทำงาน (ถ้ามี) */}
              {project.applicantNames && project.applicantNames.length > 0 && (
                <div>
                  <h3 className="text-gray-500 font-medium mb-1">ผู้สมัครทำงาน</h3>
                  <p className="font-medium">{project.applicantNames.length} คน</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}