import React, { useState } from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  fileName?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, fileName = "ไฟล์พอร์ตโฟลิโอ" }) => {
  return (
    <div>
      {/* ปุ่มเปิดไฟล์ PDF */}
      <div className="flex items-center gap-2">
        <a 
          href={pdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-primary w-full text-center"
        >
          ดูพอร์ตโฟลิโอ PDF
        </a>
      </div>
    </div>
  );
};

export default PDFViewer;