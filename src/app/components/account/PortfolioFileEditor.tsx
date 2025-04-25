'use client';

import React, { useRef, ChangeEvent, useState } from 'react';

interface PortfolioFileEditorProps {
  portfolioUrl: string | null;
  onPortfolioChange: (file: File | null, shouldDelete: boolean) => void;
}

const PortfolioFileEditor: React.FC<PortfolioFileEditorProps> = ({ 
  portfolioUrl, 
  onPortfolioChange 
}) => {
  const [hasPortfolio, setHasPortfolio] = useState(!!portfolioUrl);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle portfolio file selection
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('ไฟล์ขนาดใหญ่เกินไป (สูงสุด 5MB)');
        return;
      }
      
      // Check file type (PDF only)
      if (file.type !== 'application/pdf') {
        setError('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
        return;
      }
      
      setPortfolioFile(file);
      setError('');
      setDeleteConfirmation(false);
      
      // Send the file to parent component
      onPortfolioChange(file, false);
    }
  };
  
  // Remove portfolio file
  const handleRemovePortfolio = () => {
    if (portfolioFile) {
      // If there's a new file selected, just remove it
      setPortfolioFile(null);
      onPortfolioChange(null, false);
    } else if (portfolioUrl) {
      // If there's an existing portfolio, show confirmation
      setDeleteConfirmation(true);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Confirm deletion of existing portfolio
  const confirmDeletePortfolio = () => {
    setHasPortfolio(false);
    onPortfolioChange(null, true);
    setDeleteConfirmation(false);
  };
  
  // Cancel deletion
  const cancelDeletePortfolio = () => {
    setDeleteConfirmation(false);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">พอร์ตโฟลิโอ (PDF)</h3>
      
      {/* Error message */}
      {error && (
        <div className="mb-3 text-red-500 text-sm">
          {error}
        </div>
      )}
      
      {/* Current portfolio */}
      {portfolioUrl && !deleteConfirmation && !portfolioFile && (
        <div className="mb-3 border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
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
                <p className="text-sm font-medium">พอร์ตโฟลิโอปัจจุบัน</p>
                <div className="flex gap-2 mt-1">
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-blue-500 hover:underline"
                  >
                    ดูไฟล์
                  </a>
                  <button
                    type="button"
                    onClick={handleRemovePortfolio}
                    className="text-xs text-red-500 hover:underline"
                  >
                    ลบไฟล์
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete confirmation */}
      {portfolioUrl && deleteConfirmation && !portfolioFile && (
        <div className="mb-3 border border-red-200 rounded-lg p-3 bg-red-50">
          <p className="text-red-700 text-sm mb-2">คุณกำลังจะลบพอร์ตโฟลิโอ ต้องการดำเนินการต่อหรือไม่?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelDeletePortfolio}
              className="text-xs bg-white text-gray-700 px-3 py-1 rounded border border-gray-300"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={confirmDeletePortfolio}
              className="text-xs bg-red-500 text-white px-3 py-1 rounded"
            >
              ยืนยันการลบ
            </button>
          </div>
        </div>
      )}
      
      {/* New portfolio file */}
      {portfolioFile && (
        <div className="mb-3 border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <path d="M9 15v-4"></path>
                  <path d="M12 15v-6"></path>
                  <path d="M15 15v-2"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium truncate max-w-[200px]">{portfolioFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(portfolioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemovePortfolio}
              className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Upload new portfolio */}
      {(!hasPortfolio || deleteConfirmation) && !portfolioFile && (
        <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-6 w-full flex flex-col items-center justify-center text-gray-500 hover:text-primary-blue-500 hover:bg-gray-50 transition-colors rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span className="text-sm font-medium">อัปโหลดพอร์ตโฟลิโอ PDF</span>
            <span className="text-xs text-gray-400 mt-1">ไฟล์ PDF ขนาดไม่เกิน 5MB</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PortfolioFileEditor;