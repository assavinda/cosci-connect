'use client';

import React, { useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Loading from '../common/Loading';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    refreshNotifications,
    hasMore,
    loadMore
  } = useNotifications();

  // โหลดการแจ้งเตือนเมื่อเปิดพาเนล
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  // ฟังก์ชันจัดการคลิกที่การแจ้งเตือน
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    
    // Navigate if there's a link
    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  };

  // ฟังก์ชันแสดง Icon ตามประเภทการแจ้งเตือน
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_request':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
        );
      case 'project_invitation':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
          </div>
        );
      case 'project_accepted':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        );
      case 'project_rejected':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
        );
      case 'project_status_change':
        return (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </div>
        );
      case 'project_progress_update':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10"></path>
              <path d="M12 20V4"></path>
              <path d="M6 20v-6"></path>
            </svg>
          </div>
        );
      case 'project_completed':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M9 15l3 3 5-5"></path>
            </svg>
          </div>
        );
      case 'project_revision':
        return (
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
        );
      case 'system_message':
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
              <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
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
      className="absolute right-0 mt-2 w-96 max-h-[80vh] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
      style={{ top: '100%' }}
    >
      <div className="sticky top-0 bg-white z-10 p-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-medium">การแจ้งเตือน {unreadCount > 0 && <span className="text-sm text-primary-blue-500">({unreadCount} ใหม่)</span>}</h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-sm text-primary-blue-500 hover:text-primary-blue-600"
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto max-h-[calc(80vh-48px)]">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6">
            <Loading size="medium" color="primary" />
            <p className="mt-2 text-gray-500">กำลังโหลดการแจ้งเตือน...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div>
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-3 border-b border-gray-100 flex cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                {getNotificationIcon(notification.type)}
                <div className="ml-3 flex-1">
                  <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>{notification.title}</p>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: th })}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary-blue-500 rounded-full self-start mt-2"></div>
                )}
              </div>
            ))}
            
            {hasMore && (
              <div className="p-3 text-center">
                <button 
                  onClick={loadMore}
                  className="text-sm text-primary-blue-500 hover:underline"
                  disabled={loading}
                >
                  {loading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
              </svg>
            </div>
            <p className="text-gray-500">ไม่มีการแจ้งเตือน</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 text-center">
            <p className="text-red-500">{error}</p>
            <button
              onClick={refreshNotifications}
              className="mt-2 text-sm text-primary-blue-500 hover:underline"
            >
              ลองใหม่
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;