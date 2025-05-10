'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { usePusher } from '../../../providers/PusherProvider';
import { useSession } from 'next-auth/react';

interface NotificationBellProps {
  onClick: () => void;
  isOpen?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, isOpen = false }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session, status } = useSession();
  const { subscribeToUserNotifications } = usePusher();

  // Fetch unread notification count when component mounts
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchUnreadCount();
    }
  }, [status, session?.user?.id]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    // Function to handle new notifications
    const handleNewNotification = (data: any) => {
      console.log('New notification received:', data);
      setUnreadCount(prev => prev + 1);
    };

    // Subscribe to notifications for this user
    const unsubscribe = subscribeToUserNotifications(
      session.user.id,
      handleNewNotification
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [status, session?.user?.id, subscribeToUserNotifications]);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    try {
      const response = await axios.get('/api/notifications', {
        params: { 
          limit: 1,
          page: 1
        },
        // ส่ง headers เพื่อช่วยในการตรวจสอบ session
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });

      setUnreadCount(response.data.pagination.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // ไม่ต้องทำอะไรเมื่อเกิดข้อผิดพลาด การแสดงผลปกติโดยไม่มีจำนวนแจ้งเตือน
    }
  };

  // Reset unread count when notifications panel is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // ถ้ายังไม่ได้ authenticate ไม่ต้องแสดงปุ่มแจ้งเตือน
  if (status !== 'authenticated') {
    return null;
  }

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
      
      {/* Notification badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex justify-center items-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;