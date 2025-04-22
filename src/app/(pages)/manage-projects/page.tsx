'use client'
import React, { useState } from "react"
import ProjectManageList from "../../components/lists/ProjectManageList";

// ตัวอย่างข้อมูลโปรเจกต์
const sampleProjects = {
  pending: [
    {
      id: "p1",
      title: "ระบบจัดการร้านอาหาร",
      owner: "อาจารย์สมชาย มั่นคง",
      status: "pending",
      progress: 0
    }
  ],
  requests: [
    {
      id: "r1",
      title: "แอปพลิเคชันบันทึกรายรับรายจ่าย",
      owner: "ศิษย์เก่า กขค",
      status: "request",
      progress: 0
    },
    {
      id: "r2",
      title: "เว็บไซต์แนะนำหลักสูตร",
      owner: "อาจารย์วิชัย วิชาการ",
      status: "request",
      progress: 0
    }
  ],
  active: [
    {
      id: "a1",
      title: "แอปพลิเคชันจองห้องประชุม",
      owner: "อาจารย์สุดา เทคโนโลยี",
      status: "active",
      progress: 45
    }
  ],
  revision: [
    {
      id: "rv1",
      title: "ระบบลงทะเบียนงานสัมมนา",
      owner: "อาจารย์พิมพ์ใจ ใจดี",
      status: "revision",
      progress: 75
    }
  ],
  awaiting: [
    {
      id: "aw1",
      title: "เว็บแสดงข้อมูลนักศึกษา",
      owner: "ผศ.ดร.วิชัย ดีมาก",
      status: "awaiting",
      progress: 100
    }
  ],
  completed: [
    {
      id: "c1",
      title: "โมบายแอปพลิเคชันแจ้งปัญหาอาคาร",
      owner: "อาจารย์มนตรี ปัญญาดี",
      status: "completed",
      progress: 100
    }
  ]
}

export default function ManageProjectsPage() {
  // สร้าง state เพื่อจัดเก็บโปรเจกต์
  const [projects, setProjects] = useState(sampleProjects);
  
  // ฟังก์ชันอัพเดตความคืบหน้า
  const updateProgress = (projectId, newProgress) => {
    // ตรวจสอบว่าค่าความคืบหน้าอยู่ในช่วงที่ถูกต้อง (0-100)
    if (newProgress < 0) newProgress = 0;
    if (newProgress > 100) newProgress = 100;
    
    // อัพเดตสถานะโดยค้นหา project และอัพเดตเฉพาะโปรเจกต์นั้น
    setProjects(prevProjects => {
      // สร้าง copy ของ object projects
      const updatedProjects = {...prevProjects};
      
      // ค้นหาโปรเจกต์ในทุกสถานะ
      for (const status in updatedProjects) {
        updatedProjects[status] = updatedProjects[status].map(project => {
          if (project.id === projectId) {
            return {...project, progress: newProgress};
          }
          return project;
        });
      }
      
      // ถ้าเป็นแอพจริง อาจจะมีการบันทึกข้อมูลลง API ตรงนี้
      // saveProgressToAPI(projectId, newProgress);
      
      return updatedProjects;
    });
  };
  
  // ฟังก์ชันเพื่อส่งข้อมูลไปที่ API (ตัวอย่างเท่านั้น)
  const saveProgressToAPI = async (projectId, progress) => {
    try {
      // ในแอพจริงจะมีการเรียก API จริง
      console.log(`Saving progress ${progress}% for project ${projectId} to API`);
      // await fetch(`/api/projects/${projectId}/progress`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ progress }),
      // });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="mt-6 p-6 flex flex-col gap-2 bg-primary-blue-500 rounded-xl">
        <h1 className="font-medium text-xl text-white">
          จัดการโปรเจกต์
        </h1>
        <p className="text-white">
          จัดการทุกขั้นตอนในทุกโปรเจกต์ของคุณตั้งแต่รับงานจนถึงเสร็จงาน
        </p>
        <div className="flex justify-between items-center mt-2">
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
              <p className="text-white text-sm">โปรเจกต์ทั้งหมด: <span className="font-medium">
                {Object.values(projects).reduce((acc, arr) => acc + arr.length, 0)}
              </span></p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
              <p className="text-white text-sm">กำลังดำเนินการ: <span className="font-medium">
                {projects.active.length}
              </span></p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Row 1: Pending and Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProjectManageList 
          title="รอการตอบรับ" 
          status="pending" 
          projects={projects.pending}
          emptyMessage="ไม่มีโปรเจกต์ที่รอการตอบรับ" 
          onUpdateProgress={updateProgress}
        />
        <ProjectManageList 
          title="คำขอร่วมงาน" 
          status="requests" 
          projects={projects.requests}
          emptyMessage="ไม่มีคำขอร่วมงาน" 
          onUpdateProgress={updateProgress}
        />
      </div>
      
      {/* Row 2: Active, Revision, Awaiting */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectManageList 
          title="กำลังดำเนินการ" 
          status="active" 
          projects={projects.active}
          emptyMessage="ไม่มีโปรเจกต์ที่กำลังดำเนินการ" 
          onUpdateProgress={updateProgress}
        />
        <ProjectManageList 
          title="กำลังแก้ไข" 
          status="revision" 
          projects={projects.revision}
          emptyMessage="ไม่มีโปรเจกต์ที่กำลังแก้ไข" 
          onUpdateProgress={updateProgress}
        />
        <ProjectManageList 
          title="รอการยืนยัน" 
          status="awaiting" 
          projects={projects.awaiting}
          emptyMessage="ไม่มีโปรเจกต์ที่รอการยืนยัน" 
          onUpdateProgress={updateProgress}
        />
      </div>
      
      {/* Row 3: Completed (เต็มความกว้าง) */}
      <div className="w-full">
        <ProjectManageList 
          title="เสร็จสิ้น" 
          status="completed" 
          projects={projects.completed}
          emptyMessage="ไม่มีโปรเจกต์ที่เสร็จสิ้น" 
          onUpdateProgress={updateProgress}
        />
      </div>
    </div>
  )
}