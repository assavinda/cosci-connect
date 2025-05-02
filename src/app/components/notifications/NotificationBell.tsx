'use client';

import React from 'react';

interface NotificationBellProps {
  onClick: () => void;
  isOpen?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, isOpen = false }) => {
  return (
    <button 
      className="p-1 rounded-full hover:bg-gray-100 transition-all duration-200 relative"
      onClick={onClick}
      aria-label="การแจ้งเตือน"
    >
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'text-primary-blue-500 rotate-12' : ''}`}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* กระดิ่ง - เส้นเดียวแบบมินิมอล */}
        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
      </svg>
    </button>
  );
};

export default NotificationBell;