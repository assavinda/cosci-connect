'use client';

import React, { useRef, useEffect } from 'react';
import { useNotifications, Notification } from '../../../providers/NotificationProvider';
import { useRouter } from 'next/navigation';
import Loading from '../common/Loading';

const NotificationPanel: React.FC = () => {
  const { 
    notifications, 
    isOpen, 
    isLoading,
    setIsOpen, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    refreshNotifications 
  } = useNotifications();
  
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // คำนวณเวลาที่ผ่านมา
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000; // ปี
    
    if (interval > 1) {
      return `${Math.floor(interval)} ปีที่แล้ว`;
    }
    interval = seconds / 2592000; // เดือน
    if (interval > 1) {
      return `${Math.floor(interval)} เดือนที่แล้ว`;
    }
    interval = seconds / 86400; // วัน
    if (interval > 1) {
      return `${Math.floor(interval)} วันที่แล้ว`;
    }
    interval = seconds / 3600; // ชั่วโมง
    if (interval > 1) {
      return `${Math.floor(interval)} ชั่วโมงที่แล้ว`;
    }
    interval = seconds / 60; // นาที
    if (interval > 1) {
      return `${Math.floor(interval)} นาทีที่แล้ว`;
    }
    return 'เมื่อสักครู่';
  };

  // จัดการคลิกภายนอกพาเนลเพื่อปิด
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // ดึงข้อมูลการแจ้งเตือนเมื่อเปิดพาเนล
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  // จัดการคลิกที่การแจ้งเตือน
  const handleNotificationClick = async (notification: Notification) => {
    // ทำเครื่องหมายว่าอ่านแล้ว
    await markAsRead(notification.id);
    
    // นำทางไปยังหน้าที่เกี่ยวข้อง
    if (notification.data?.projectId) {
      // หากมี projectId ให้นำทางไปที่หน้ารายละเอียดโปรเจกต์
      router.push(`/project/${notification.data.projectId}`);
    } else if (notification.data?.userId) {
      // หากมี userId ให้นำทางไปที่หน้าโปรไฟล์ผู้ใช้
      if (notification.type === 'project_request') {
        router.push(`/user/freelance/${notification.data.userId}`);
      } else {
        router.push(`/user/customer/${notification.data.userId}`);
      }
    }
    
    // ปิดพาเนล
    setIsOpen(false);
  };

  // ไอคอนตามประเภทการแจ้งเตือน
  const getIconForType = (type: string) => {
    switch (type) {
      case 'project_request':
        return (
          <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
        );
      case 'project_invitation':
        return (
          <div className="bg-green-100 text-green-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        );
      case 'project_accepted':
        return (
          <div className="bg-green-100 text-green-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        );
      case 'project_rejected':
        return (
          <div className="bg-red-100 text-red-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
        );
      case 'project_completed':
        return (
          <div className="bg-green-100 text-green-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        );
      case 'project_status_change':
        return (
          <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="bg-primary-blue-100 text-primary-blue-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 text-gray-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
        );
    }
  };

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
        <div className="flex gap-2">
          <button 
            onClick={markAllAsRead}
            className="text-xs text-primary-blue-500 hover:text-primary-blue-600"
            disabled={isLoading}
          >
            อ่านทั้งหมด
          </button>
          <button 
            onClick={clearNotifications}
            className="text-xs text-gray-500 hover:text-gray-600"
            disabled={isLoading}
          >
            ล้างทั้งหมด
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
        {isLoading ? (
          <div className="p-6 flex flex-col items-center justify-center">
            <Loading size="medium" color="primary" />
            <p className="mt-3 text-gray-500 text-sm">กำลังโหลดการแจ้งเตือน...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50/40' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  {getIconForType(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{getTimeAgo(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary-blue-500 mt-1 flex-shrink-0"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
              </svg>
            </div>
            <p className="text-gray-500">ไม่มีการแจ้งเตือนใหม่</p>
          </div>
        )}
      </div>
      
      {/* ปุ่มโหลดเพิ่มเติม */}
      {!isLoading && notifications.length >= 30 && (
        <div className="p-2 border-t border-gray-100 text-center">
          <button 
            onClick={() => refreshNotifications()}
            className="text-xs text-primary-blue-500 hover:text-primary-blue-600 px-4 py-1 rounded-lg hover:bg-gray-50"
          >
            โหลดเพิ่มเติม
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;