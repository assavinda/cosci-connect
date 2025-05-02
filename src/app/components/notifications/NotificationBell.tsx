'use client';

import React from 'react';
import { useNotifications } from '../../../providers/NotificationProvider';

const NotificationBell: React.FC = () => {
  const { unreadCount, isOpen, setIsOpen, isLoading } = useNotifications();

  // ฟังก์ชันสลับการแสดง/ซ่อนพาเนลการแจ้งเตือน
  const toggleNotificationPanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <button 
      className="p-1 rounded-full hover:bg-gray-100 transition-all duration-200 relative"
      onClick={toggleNotificationPanel}
      aria-label={`การแจ้งเตือน ${unreadCount > 0 ? unreadCount + ' รายการที่ยังไม่ได้อ่าน' : ''}`}
      disabled={isLoading}
    >
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'text-primary-blue-500 rotate-12' : ''} ${unreadCount > 0 ? 'animate-wiggle' : ''}`}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* กระดิ่ง - เส้นเดียวแบบมินิมอล */}
        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
      </svg>
      
      {/* แสดงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      
      {/* แสดงสถานะกำลังโหลด */}
      {isLoading && (
        <span className="absolute -top-1 -right-1 w-5 h-5 border-2 border-primary-blue-300 border-t-primary-blue-600 rounded-full animate-spin"></span>
      )}
    </button>
  );
};

export default NotificationBell;