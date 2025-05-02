'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePusher } from './PusherProvider';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// นิยามประเภทการแจ้งเตือน
export type NotificationType = 
  | 'project_request'       // คำขอร่วมโปรเจกต์จากฟรีแลนซ์
  | 'project_invitation'    // คำเชิญทำโปรเจกต์จากเจ้าของโปรเจกต์
  | 'project_accepted'      // การยอมรับโปรเจกต์
  | 'project_rejected'      // การปฏิเสธโปรเจกต์
  | 'project_completed'     // โปรเจกต์เสร็จสิ้น
  | 'project_status_change' // การเปลี่ยนสถานะโปรเจกต์
  | 'message';              // ข้อความใหม่

// นิยามโครงสร้างข้อมูลการแจ้งเตือน
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  data?: {
    projectId?: string;
    projectTitle?: string;
    userId?: string;
    userName?: string;
    status?: string;
  };
}

// นิยาม Context สำหรับการแจ้งเตือน
type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  setIsOpen: (isOpen: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  refreshNotifications: () => Promise<void>;
};

// สร้าง Context พร้อมค่าเริ่มต้น
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
  setIsOpen: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
  refreshNotifications: async () => {},
});

// Custom hook สำหรับใช้งาน Context
export const useNotifications = () => useContext(NotificationContext);

// Provider Component
export default function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { subscribeToUserNotifications } = usePusher();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch notifications from API
  const fetchNotifications = async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/notifications', {
        params: {
          limit: 30,  // เริ่มต้นดึงแค่ 30 รายการล่าสุด
          page: 1
        }
      });

      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('ไม่สามารถโหลดการแจ้งเตือนได้');
      
      // แสดง toast เตือนผู้ใช้
      toast.error('ไม่สามารถโหลดการแจ้งเตือนได้ กรุณาลองใหม่อีกครั้ง', {
        duration: 3000,
        position: 'top-right'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // โหลดการแจ้งเตือนเมื่อ login สำเร็จ
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchNotifications();
    }
  }, [session?.user?.id, status]);

  // ลงทะเบียนรับการแจ้งเตือนแบบ real-time ด้วย Pusher
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    // ฟังก์ชันรับการแจ้งเตือนใหม่
    const handleNewNotification = (notification: Notification) => {
      console.log('ได้รับการแจ้งเตือนใหม่:', notification);
      
      // เพิ่มการแจ้งเตือนใหม่เข้าไปในรายการ
      setNotifications(prev => [notification, ...prev]);
      
      // อัปเดตจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
      setUnreadCount(prev => prev + 1);
    };

    // ลงทะเบียนรับการแจ้งเตือนผ่าน Pusher
    const unsubscribe = subscribeToUserNotifications(
      session.user.id,
      handleNewNotification
    );

    // ยกเลิกการลงทะเบียนเมื่อ component unmount
    return () => {
      unsubscribe();
    };
  }, [status, session?.user?.id, subscribeToUserNotifications]);

  // Function to mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      // Make API call to mark as read
      await axios.patch(`/api/notifications/${id}`, {});
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้', {
        duration: 3000,
        position: 'top-right'
      });
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Make API call to mark all as read
      await axios.patch('/api/notifications', { markAllAsRead: true });
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('ไม่สามารถทำเครื่องหมายว่าอ่านทั้งหมดได้', {
        duration: 3000,
        position: 'top-right'
      });
    }
  };

  // Function to clear all notifications
  const clearNotifications = async () => {
    try {
      // Make API call to delete all notifications
      await axios.delete('/api/notifications', {
        params: { clearAll: true }
      });
      
      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('ไม่สามารถล้างการแจ้งเตือนได้', {
        duration: 3000,
        position: 'top-right'
      });
    }
  };

  // Function to refresh notifications
  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        isLoading,
        setIsOpen,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}