import React, { useState, useEffect } from "react"

interface FreelanceCardProps {
  name?: string;
  major?: string;
  profileImageUrl?: string;
  basePrice?: number;
  skills?: string[];
  galleryImages?: string[];
}

function FreelanceCard({
  name = "ชื่อจริง นามสกุล",
  major = "วิชาเอก",
  profileImageUrl,
  basePrice = 600,
  skills = [],
  galleryImages = []
}: FreelanceCardProps) {
  // Limit skills display to maximum 3
  const displaySkills = skills.slice(0, 2);
  const hasMoreSkills = skills.length > 2;
  
  // First letter for placeholder profile
  const firstLetter = name ? name.charAt(0).toUpperCase() : "?";
  
  // Slideshow state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = galleryImages.length > 1;

  
  // Manual navigation
  const goToNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    
    setCurrentImageIndex(prevIndex => 
      prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const goToPrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    );
  };
  
  return (
    <div className="bg-white shadow-md rounded-xl w-full p-3 flex flex-col border-[0.1px] border-gray-300 gap-3 hover:bg-gray-50 transition-all">
        <div className="flex place-items-center gap-3">
            <div className="bg-primary-blue-400 size-10 rounded-full shadow-sm overflow-hidden flex items-center justify-center text-white font-medium">
                {profileImageUrl ? (
                    <img 
                        src={profileImageUrl} 
                        alt={name} 
                        className="w-full h-full object-cover"
                    />
                ) : firstLetter}
            </div>
            <div className="truncate">
                <p className="font-medium truncate hover:text-primary-blue-400">{name}</p>
                <p className="text-xs text-gray-400">{major}</p>
            </div>
        </div>
        <hr className="text-gray-200"/>
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
                            +{skills.length - 2}
                        </span>
                    )}
                </>
            ) : (
                <p className="text-gray-400 text-xs">ไม่ระบุทักษะ</p>
            )}
        </div>
        <div className="w-full h-44 rounded-xl bg-gray-200 flex justify-end place-items-end relative overflow-hidden">
          {galleryImages.length > 0 ? (
            <>
              <img 
                src={galleryImages[currentImageIndex]} 
                alt={`ตัวอย่างผลงาน ${currentImageIndex + 1}`} 
                className="absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-500"
              />

              <div className="absolute bg-gradient-to-t from-black/50 w-full h-[50%] rounded-b-xl">
                <p className="text-white absolute bottom-2 right-2 text-end text-xs">
                  {`ตัวอย่างผลงาน ${currentImageIndex + 1}/${galleryImages.length}`}
                </p>
              </div>
              
              {/* Navigation arrows for multiple images */}
              {hasMultipleImages && (
                <>
                  <button 
                    onClick={goToPrevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button 
                    onClick={goToNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </>
              )}
              
              {/* Indicators for multiple images */}
              {hasMultipleImages && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {galleryImages.map((_, index) => (
                    <div 
                      key={index} 
                      className={`w-1.5 h-1.5 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p className="mt-2 text-sm text-gray-500">ไม่มีตัวอย่างผลงาน</p>
            </div>
          )}
        </div>
        <div className="flex justify-between place-items-center gap-2">
          <div className="bg-gray-100 p-2 w-full rounded-xl">
            <p className="text-gray-500 text-s">เริ่มต้น <span className="text-primary-blue-400 text-s">{basePrice} ฿</span></p>
          </div>
          
          <button className="btn-primary">
              ดูโปรไฟล์
          </button>
        </div>
    </div>
  )
}
export default FreelanceCard