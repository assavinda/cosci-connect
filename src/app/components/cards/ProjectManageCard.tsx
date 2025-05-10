import Link from "next/link";
import React, { useState, useEffect } from "react";
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
  // เพิ่มฟิลด์ใหม่สำหรับแสดงผลแยกการ์ด
  requestingFreelancerId?: string;
  requestingFreelancerName?: string;
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
  const [sliderValue, setSliderValue] = useState(progress); // สำหรับ slider
  
  // ปรับค่า newProgress เมื่อค่า progress จาก props เปลี่ยน
  useEffect(() => {
    setNewProgress(progress);
    setSliderValue(progress);
  }, [progress]);
  
  // Function to determine progress color
  const getProgressColor = (value, isRevision) => {
    // ใช้ชุดสีที่แตกต่างกันสำหรับสถานะการแก้ไข
    if (isRevision) {
      if (value < 30) return 'bg-orange-400';
      if (value < 70) return 'bg-yellow-400';
      return 'bg-green-400';
    } else {
      // สีปกติสำหรับสถานะ in_progress
      if (value < 30) return 'bg-red-400';
      if (value < 70) return 'bg-yellow-400';
      return 'bg-green-400';
    }
  };
  
  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setSliderValue(value);
    setNewProgress(value);
  };
  
  const handleProgressUpdate = () => {
    onUpdateProgress(id, newProgress);
    setIsEditing(false);
  };
  
  // ปุ่มปรับแบบ quick presets
  const presetValues = [0, 25, 50, 75, 100];
  
  const handlePresetClick = (value) => {
    setSliderValue(value);
    setNewProgress(value);
  };

  // Function to determine if progress editing is allowed
  const canEditProgress = () => {
    // Only allow editing if the project is in progress and the user is a freelancer
    return (status === 'in_progress' || status === 'revision') && isFreelancer && project.assignedTo === userId;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
      <Link href={`/project/${id}`}>
        <h3 className="font-medium text-primary-blue-500 hover:text-primary-blue-400 truncate">{title}</h3>
      </Link>
        
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
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-gray-400">{isFreelancer ? 'เจ้าของ' : 'ฟรีแลนซ์'}</p>
        <Link href={profileLink}>
            <p className="text-sm text-primary-blue-500 truncate hover:underline hover:text-primary-blue-400 font-medium">{owner}</p>
        </Link>
      </div>
      
      {/* Progress bar - show for all in_progress, revision and awaiting projects */}
      {(status === 'in_progress' || status === 'revision' || status === 'awaiting') && (
        <>
          {canEditProgress() && isEditing ? (
            <div className="bg-gray-50 rounded-lg p-3 mt-3 border border-gray-200">
              {/* Progress slider */}
              <div className="flex items-center mb-3">
                <div className="relative w-full">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-blue-500"
                    style={{
                      background: `linear-gradient(to right, ${getProgressColor(sliderValue, project.status === 'revision')} 0%, ${getProgressColor(sliderValue, project.status === 'revision')} ${sliderValue}%, #e5e7eb ${sliderValue}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
                <span className="ml-3 text-lg font-semibold text-primary-blue-500 min-w-16 text-center">
                  {sliderValue}%
                </span>
              </div>
              
              {/* Quick presets */}
              <div className="flex justify-between">
                {presetValues.map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handlePresetClick(value)}
                    className={`px-2 py-1 text-xs rounded-lg w-full mx-2 transition-colors ${
                      sliderValue === value 
                        ? 'bg-primary-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end mt-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSliderValue(progress);
                    setNewProgress(progress);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleProgressUpdate}
                  className="px-3 py-1.5 text-sm rounded-lg bg-primary-blue-500 text-white hover:bg-primary-blue-400 transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex justify-between w-full text-xs text-gray-500 mb-1">
                {canEditProgress() ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-primary-blue-500 hover:text-primary-blue-400 underline"
                  >
                    อัปเดต
                  </button>
                ) : (
                  <span>
                    {project.status === 'revision' ? 'ความคืบหน้าการแก้ไข' : 'ความคืบหน้า'}
                  </span>
                )}
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${getProgressColor(progress, project.status === 'revision')} h-2 rounded-full transition-all duration-500 ease-in-out`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="mt-4 flex justify-between place-items-end w-full">
        <ProjectManageButtons 
          project={project}
          isFreelancer={isFreelancer}
          userId={userId}
        />
        <Link href={`/project/${id}`} className="text-primary-blue-500 ml-auto text-sm hover:underline">
          ดูรายละเอียด →
        </Link>
      </div>
    </div>
  );
}

export default ProjectManageCard;