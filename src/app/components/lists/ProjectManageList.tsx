import React from "react";
import ProjectManageCard from "../cards/ProjectManageCard";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  owner: string;
  ownerName: string;
  status: string;
  progress: number;
  assignedTo?: string;
  assignedFreelancerName?: string;
  requestToFreelancer?: string;
  requestToFreelancerName?: string;
  freelancersRequested: string[];
  // เพิ่มฟิลด์ใหม่สำหรับแสดงผลแยกการ์ด
  requestingFreelancerId?: string;
  requestingFreelancerName?: string;
}

interface ProjectManageListProps {
  title: string;
  status: string;
  projects: Project[];
  emptyMessage: string;
  onUpdateProgress: (id: string, progress: number) => void;
  isFreelancer: boolean;
  userId?: string;
}

function ProjectManageList({ 
  title, 
  status, 
  projects, 
  emptyMessage, 
  onUpdateProgress,
  isFreelancer,
  userId
}: ProjectManageListProps) {
  // Function to determine the display name
  const getDisplayName = (project: Project) => {
    // For freelancers, show the project owner
    if (isFreelancer) {
      return project.ownerName;
    } 
    
    // สำหรับคำขอฟรีแลนซ์ ใช้ชื่อฟรีแลนซ์ที่ส่งคำขอมา
    if (status === "requests" && project.requestingFreelancerId) {
      return project.requestingFreelancerName || "ฟรีแลนซ์ไม่ระบุชื่อ";
    }
    
    // For project owners with assigned freelancer
    if (project.assignedTo && project.assignedFreelancerName) {
      return project.assignedFreelancerName;
    } else if (project.assignedTo) {
      return "ฟรีแลนซ์ที่รับงาน";
    }
    
    // For project owners waiting for freelancer response
    if (status === "waitingResponse" && project.requestToFreelancer) {
      // ใช้ชื่อจริงของฟรีแลนซ์ที่เจ้าของโปรเจกต์ส่งคำขอไป
      return project.requestToFreelancerName || "รอการตอบรับจากฟรีแลนซ์";
    }
    
    // Default
    return "ไม่มีผู้รับผิดชอบ";
  };

  // Function to determine the profile link target
  const getProfileLink = (project: Project) => {
    // For freelancers, link to the project owner
    if (isFreelancer) {
      return `/user/customer/${project.owner}`;
    }
    
    // สำหรับคำขอฟรีแลนซ์ ใช้ลิงก์ไปยังโปรไฟล์ของฟรีแลนซ์ที่ส่งคำขอมา
    if (status === "requests" && project.requestingFreelancerId) {
      return `/user/freelance/${project.requestingFreelancerId}`;
    }
    
    // For project owners, link to the assigned freelancer if available
    if (project.assignedTo) {
      return `/user/freelance/${project.assignedTo}`;
    }
    
    // For project owners waiting for a specific freelancer
    if (status === "waitingResponse" && project.requestToFreelancer) {
      return `/user/freelance/${project.requestToFreelancer}`;
    }
    
    // Default, go to project page
    return `/project/${project.id}`;
  };

  // Function to get the appropriate icon based on title and status
  const getSectionIcon = () => {
    // เช็คชื่อหัวข้อก่อน
    if (title.includes("กำลังดำเนินการ")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    } else if (title.includes("กำลังแก้ไข")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      );
    } else if (title.includes("กำลังรอการยืนยัน") || title.includes("รอการตอบรับ")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    // ถ้าไม่มีชื่อที่ตรงกับที่กำหนด ให้ใช้สถานะแทน
    switch(status) {
      case 'active':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'completed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'waitingResponse':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      case 'requests':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-gray-700 flex items-center">
          {getSectionIcon()}
          {title}
        </h2>
        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {projects.length}
        </span>
      </div>
      
      {projects.length > 0 ? (
        <div className={`${status === "completed" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}`}>
          {projects.map((project) => (
            <ProjectManageCard 
              key={`${project.id}${project.requestingFreelancerId || ''}`} // ใช้ key ที่ไม่ซ้ำกัน
              id={project.id}
              title={project.title}
              owner={getDisplayName(project)}
              status={project.status}
              progress={project.progress}
              onUpdateProgress={onUpdateProgress}
              isFreelancer={isFreelancer}
              profileLink={getProfileLink(project)}
              userId={userId}
              project={project}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 text-center text-gray-500 border border-dashed border-gray-300">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

export default ProjectManageList;