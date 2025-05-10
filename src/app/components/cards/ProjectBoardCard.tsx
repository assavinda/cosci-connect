import Link from "next/link"
import React from "react"

interface ProjectBoardCardProps {
  title?: string;
  ownerName?: string;
  description?: string;
  budget?: number;
  requiredSkills?: string[];
  createdAt?: string;
}

function ProjectBoardCard({
  title = "ชื่อโปรเจกต์",
  ownerName = "อาจารย์ชื่อ นามสกุล",
  description = "คำอธิบาย",
  budget = 600,
  requiredSkills = [],
  createdAt
}: ProjectBoardCardProps) {
  
  // ฟังก์ชั่นแปลงวันที่เป็นรูปแบบที่อ่านง่าย
  const formatDate = (dateString: string) => {
    if (!dateString) return "โพสต์เมื่อ 25/02/2025"; // ค่าเริ่มต้นถ้าไม่มีวันที่
    
    try {
      const date = new Date(dateString);
      
      // ตรวจสอบว่าเป็นวันที่ที่ถูกต้องหรือไม่
      if (isNaN(date.getTime())) {
        return "โพสต์เมื่อ 25/02/2025";
      }
      
      // รูปแบบวันที่ DD/MM/YYYY
      return `โพสต์เมื่อ ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (error) {
      console.error("Invalid date format:", error);
      return "โพสต์เมื่อ 25/02/2025";
    }
  };
  
  // แสดงทักษะที่ต้องการไม่เกิน 2 ทักษะ
  const displaySkills = requiredSkills.slice(0, 3);
  const hasMoreSkills = requiredSkills.length > 3;
  
  return (
    <div className="bg-white shadow-md rounded-xl w-full p-3 flex flex-col border-[0.1px] border-gray-300 gap-3 hover:bg-gray-50">
        <div className="flex place-items-center gap-3">
            <div className="truncate w-full">
                <p className="font-medium truncate hover:text-primary-blue-400">{title}</p>
                <div className="flex justify-between place-items-end">
                    <p className="text-xs text-gray-400">
                        โดย: {ownerName}
                    </p>
                    <p className="text-xs text-gray-400">
                        {formatDate(createdAt)}
                    </p>   
                </div>
            </div>
        </div>
        <hr className="text-gray-200"/>
        
        {/* Required Skills */}
        <p className="text-gray-400 text-xs">required skills</p>
        <div className="flex flex-wrap gap-1.5">
          {displaySkills.length > 0 ? (
            <>
              {displaySkills.map((skill, index) => (
                <span 
                  key={index} 
                  className="border border-primary-blue-300 bg-primary-blue-100 text-primary-blue-500 text-xs px-1 py-0.5 rounded-lg"
                >
                  {skill}
                </span>
              ))}
              {hasMoreSkills && (
                <span className="text-white bg-primary-blue-400 border border-primary-blue-400 text-xs px-1 py-0.5 rounded-lg">
                  +{requiredSkills.length - 3}
                </span>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-xs">ไม่ระบุทักษะ</p>
          )}
        </div>
        <p className="text-gray-400 truncate">
            {description}
        </p>
        
        <div className="flex justify-between place-items-center gap-2">
          <div className="bg-gray-100 p-2 w-full rounded-xl">
            <p className="text-gray-500 text-s">งบค่าจ้าง <span className="text-primary-blue-400 text-s">{budget?.toLocaleString() || 600} ฿</span></p>
          </div>
          
          <button className="btn-primary">
              ดูรายละเอียด
          </button>
        </div>
    </div>
  )
}
export default ProjectBoardCard