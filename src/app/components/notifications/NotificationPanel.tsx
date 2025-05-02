'use client';

import React, { useRef, useEffect } from 'react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // ถ้าไม่เปิดพาเนล ไม่ต้องแสดงอะไร
  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 max-h-[70vh] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
      style={{ top: '100%' }}
    >
      <div className="sticky top-0 bg-white z-10 p-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-medium">การแจ้งเตือน</h3>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
              <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
            </svg>
          </div>
          <p className="text-gray-500">ไม่มีการแจ้งเตือนใหม่</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;