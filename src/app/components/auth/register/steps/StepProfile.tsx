import React, { useState, useEffect } from 'react';
import { RegisterData } from '../RegisterForm';

interface StepProfileProps {
  data: RegisterData;
  updateData: (data: Partial<RegisterData>) => void;
  onSelectImage: (imageUrl: string) => void;
}

function StepProfile({ data, updateData, onSelectImage }: StepProfileProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [portfolioError, setPortfolioError] = useState('');

  // Update preview when profileImage changes (after cropping)
  useEffect(() => {
    if (data.profileImage) {
      // Clear any previous preview URL to avoid memory leaks
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      // Create a new preview from the cropped image
      const newPreviewUrl = URL.createObjectURL(data.profileImage);
      setPreviewImage(newPreviewUrl);
      
      // Clean up preview URL when component unmounts or preview changes
      return () => {
        URL.revokeObjectURL(newPreviewUrl);
      };
    }
  }, [data.profileImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Create a preview URL for the cropper
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        // Don't set the preview yet, wait until after cropping
        onSelectImage(imageUrl); // Open crop modal
      };
      reader.readAsDataURL(file);
      
      // Reset the input value to ensure change event fires even if the same file is selected again
      e.target.value = '';
    }
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setPortfolioError('ไฟล์ขนาดใหญ่เกินไป (จำกัด 5MB)');
        return;
      }
      
      // Check file type (PDF only)
      if (file.type !== 'application/pdf') {
        setPortfolioError('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
        return;
      }
      
      // Clear error and update data
      setPortfolioError('');
      updateData({ portfolioFile: file });
    }
  };

  const removePortfolio = () => {
    updateData({ portfolioFile: undefined });
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateData({ bio: e.target.value });
  };
  
  const removeProfileImage = () => {
    // Clear preview image
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
    // Reset profile image data
    updateData({ profileImage: undefined });
  };

  // Format file size in KB or MB
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // สำหรับนิสิตเท่านั้น: ฟังก์ชันตั้งค่าราคาเริ่มต้น
  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 100) {
      updateData({ basePrice: value });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-gray-800">โปรไฟล์</h2>
        <p className="text-gray-500 text-sm">
          เพิ่มรูปโปรไฟล์และรายละเอียดเพิ่มเติม
        </p>
      </div>

      {/* Profile Image */}
      <div>
        <label className="block text-gray-700 text-sm mb-1">
          รูปโปรไฟล์
        </label>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>
          
          <div className="flex gap-2">
            <label
              htmlFor="profile-image"
              className="px-3 py-1 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm inline-block"
            >
              เลือกรูปภาพ
            </label>
            <input
              type="file"
              id="profile-image"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            
            {previewImage && (
              <button
                type="button"
                onClick={removeProfileImage}
                className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-red-500 hover:bg-gray-50 text-sm inline-block"
              >
                ลบรูปภาพ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-gray-700 text-sm mb-1">
          คำอธิบายตนเอง
        </label>
        <textarea
          id="bio"
          rows={3}
          className="input resize-none"
          placeholder="แนะนำตัวคุณสั้นๆ..."
          value={data.bio}
          onChange={handleBioChange}
        />
      </div>

      {/* แสดงฟิลด์เฉพาะสำหรับนิสิตเท่านั้น */}
      {data.role === 'student' && (
        <>
          {/* ราคาเริ่มต้น */}
          <div>
            <label htmlFor="basePrice" className="block text-gray-700 text-sm mb-1">
              ราคาเริ่มต้น (บาท)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="basePrice"
                min="100"
                step="100"
                className="input max-w-32"
                value={data.basePrice || 500}
                onChange={handleBasePriceChange}
              />
              <span className="text-gray-600">บาท</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">ราคาเริ่มต้นสำหรับการรับงาน (ขั้นต่ำ 100 บาท)</p>
          </div>

          {/* สถานะรับงาน */}
          {/* <div>
            <label className="block text-gray-700 text-sm mb-1">
              สถานะการรับงาน
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateData({ isOpen: true })}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                  data.isOpen !== false
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-300'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${data.isOpen !== false ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                พร้อมรับงาน
              </button>
              
              <button
                type="button"
                onClick={() => updateData({ isOpen: false })}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                  data.isOpen === false
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-300'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${data.isOpen === false ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                ไม่พร้อมรับงาน
              </button>
            </div>
          </div> */}

          {/* Portfolio file upload */}
          <div>
            <label htmlFor="portfolio" className="block text-gray-700 text-sm mb-1">
              พอร์ตโฟลิโอ (PDF)
            </label>
            
            {data.portfolioFile ? (
              // File is selected - show file info card
              <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M9 15v-4"></path>
                        <path d="M12 15v-6"></path>
                        <path d="M15 15v-2"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {data.portfolioFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(data.portfolioFile.size)}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={removePortfolio}
                    className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18"></path>
                      <path d="M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              // No file selected - show upload button
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="portfolio"
                  className={`px-4 py-3 border border-dashed rounded-lg cursor-pointer flex items-center justify-center hover:bg-gray-50 ${
                    portfolioError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="text-sm">
                    คลิกเพื่ออัพโหลดพอร์ตโฟลิโอ PDF
                  </span>
                </label>
                
                <input
                  type="file"
                  id="portfolio"
                  accept=".pdf"
                  className="hidden"
                  onChange={handlePortfolioChange}
                />
                
                {portfolioError && (
                  <p className="text-red-500 text-xs">{portfolioError}</p>
                )}
                
                <p className="text-xs text-gray-500">
                  ไฟล์ PDF ขนาดไม่เกิน 5MB
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default StepProfile;