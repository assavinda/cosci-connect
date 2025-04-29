import Link from "next/link";
import React, { useState } from "react";
import ProjectManageButtons from "../buttons/ProjectManageButtons";

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
}

interface ProjectManageCardProps {
  id: string;
  title: string;
  owner: string;
  status: string;
  progress: number;
  onUpdateProgress: (id: string, progress: number) => void;
  isFreelancer: boolean;
  profileLink: string;
  userId?: string;
  project: Project;
}

function ProjectManageCard({ 
  id, 
  title, 
  owner, 
  status, 
  progress, 
  onUpdateProgress,
  isFreelancer,
  profileLink,
  userId,
  project
}: ProjectManageCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newProgress, setNewProgress] = useState(progress);
  
  const handleProgressUpdate = () => {
    onUpdateProgress(id, newProgress);
    setIsEditing(false);
  };

  // Function to determine if progress editing is allowed
  const canEditProgress = () => {
    // Only allow editing if the project is in progress and the user is a freelancer
    return (status === 'in_progress' || status === 'revision') && isFreelancer && project.assignedTo === userId;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-primary-blue-500 truncate">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full text-nowrap ${
          status === 'open' ? 'bg-yellow-100 text-yellow-800' : 
          status === 'revision' ? 'bg-orange-100 text-orange-800' :
          status === 'in_progress' ? 'bg-green-100 text-green-800' :
          status === 'awaiting' ? 'bg-indigo-100 text-indigo-800' :
          status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status === 'open' ? 'เปิดรับสมัคร' : 
           status === 'revision' ? 'กำลังแก้ไข' :
           status === 'in_progress' ? 'กำลังดำเนินการ' :
           status === 'awaiting' ? 'รอการยืนยัน' :
           status === 'completed' ? 'เสร็จสิ้น' :
           status}
        </span>
      </div>
      <div className="flex gap-2">
        <p className="text-sm text-gray-400">{isFreelancer ? 'โดย' : 'ผู้รับผิดชอบ'}</p>
        <Link href={profileLink}>
            <p className="text-sm text-gray-600 mb-2 truncate hover:underline hover:text-primary-blue-400">{owner}</p>
        </Link>
      </div>
      
      {/* Progress bar - show for all in_progress, revision and awaiting projects */}
      {(status === 'in_progress' || status === 'revision' || status === 'awaiting') && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div 
              className="bg-primary-blue-400 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between w-full text-xs text-gray-500">
            <div>
              {canEditProgress() && isEditing ? (
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
                      setNewProgress(progress);
                    }}
                    className="text-gray-500 px-2 py-1 rounded text-xs"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => canEditProgress() && setIsEditing(true)}
                  className={`flex py-1 items-center gap-1 ${canEditProgress() ? 'hover:text-primary-blue-500 cursor-pointer' : 'cursor-default'}`}
                >
                  {progress}%
                  {canEditProgress() && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}
      
      <div className="mt-4 flex justify-between place-items-end">
        <ProjectManageButtons 
          project={project}
          isFreelancer={isFreelancer}
          userId={userId}
        />
        <Link href={`/project/${id}`} className="text-primary-blue-500 text-sm hover:underline">
          ดูรายละเอียด →
        </Link>
      </div>
    </div>
  );
}

export default ProjectManageCard;