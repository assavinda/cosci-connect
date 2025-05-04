import React, { useState } from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  fileName?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, fileName = "ไฟล์พอร์ตโฟลิโอ" }) => {
  const [isOpen, setIsOpen] = useState(false);

  // เปิดหน้าต่างแสดง PDF
  const openPDFViewer = () => {
    setIsOpen(true);
  };

  // ปิดหน้าต่างแสดง PDF
  const closePDFViewer = () => {
    setIsOpen(false);
  };

  return (
    <div>
      {/* ปุ่มเปิดไฟล์ PDF */}
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <button 
          onClick={openPDFViewer}
          className="text-primary-blue-500 hover:underline"
        >
          ดูพอร์ตโฟลิโอในหน้าเว็บ
        </button>
        
        <a 
          href={pdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary-blue-500 hover:underline ml-4"
        >
          ดาวน์โหลด PDF
        </a>
      </div>

      {/* Modal แสดง PDF */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">{fileName}</h3>
              <button 
                onClick={closePDFViewer}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe 
                src={`${pdfUrl}#view=FitH`} 
                title="PDF Viewer" 
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;