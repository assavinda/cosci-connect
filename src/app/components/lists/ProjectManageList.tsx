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
  // Function to get the appropriate name to display
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
      return "รอการตอบรับจากฟรีแลนซ์";
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

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-gray-700">{title}</h2>
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