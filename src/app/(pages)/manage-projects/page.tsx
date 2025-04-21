'use client'
import React, { useState } from "react"
import Link from "next/link"
import ProjectManageButtons from "../../components/buttons/ProjectManageButtons";

// สร้างคอมโพเนนต์การ์ดโปรเจกต์
const ProjectManageCard = ({ id, title, owner, status, progress, onUpdateProgress }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newProgress, setNewProgress] = useState(progress);
  
  const handleProgressUpdate = () => {
    onUpdateProgress(id, newProgress);
    setIsEditing(false);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-primary-blue-500 truncate">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full text-nowrap ${
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
          status === 'revision' ? 'bg-orange-100 text-orange-800' :
          status === 'active' ? 'bg-green-100 text-green-800' :
          status === 'request' ? 'bg-purple-100 text-purple-800' :
          status === 'awaiting' ? 'bg-indigo-100 text-indigo-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {status === 'pending' ? 'รอตอบรับ' : 
           status === 'revision' ? 'กำลังแก้ไข' :
           status === 'active' ? 'กำลังดำเนินการ' :
           status === 'request' ? 'คำขอร่วมงาน' :
           status === 'awaiting' ? 'รอการยืนยัน' :
           'เสร็จสิ้น'}
        </span>
      </div>
      <div className="flex gap-2">
        <p className="text-sm text-gray-400">โดย</p>
        <Link href={'/user/owner'}>
            <p className="text-sm text-gray-600 mb-2 truncate hover:underline hover:text-primary-blue-400">{owner}</p>
        </Link>
      </div>
      
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div 
          className="bg-primary-blue-400 h-2 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between w-full text-xs text-gray-500">
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min="0" 
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(Number(e.target.value))}
                className="w-16 p-1 bg-gray-100 rounded text-xs"
              />
              <button 
                onClick={handleProgressUpdate}
                className="text-primary-blue-400 px-2 py-1 rounded text-xs"
              >
                บันทึก
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setNewProgress(progress); // รีเซ็ตกลับเป็นค่าเดิม
                }}
                className="text-gray-500 px-2 py-1 rounded text-xs"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex py-1 items-center gap-1 hover:text-primary-blue-500"
            >
              {progress}%
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex justify-between place-items-end">
        <ProjectManageButtons/>
        <Link href={`/project/${id}`} className="text-primary-blue-500 text-sm hover:underline">
          ดูรายละเอียด →
        </Link>
      </div>
    </div>
  )
}

// สร้างคอมโพเนนต์ส่วนโปรเจกต์ตามสถานะ
const ProjectManageList = ({ title, status, projects, emptyMessage, onUpdateProgress }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-gray-700">{title}</h2>
        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {projects.length}
        </span>
      </div>
      
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <ProjectManageCard 
              key={index} 
              {...project} 
              onUpdateProgress={onUpdateProgress}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 text-center text-gray-500 border border-dashed border-gray-300">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}

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