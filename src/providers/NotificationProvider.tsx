'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePusher } from './PusherProvider';
import axios from 'axios';

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
  setIsOpen: (isOpen: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: Notification) => void;
};

// สร้าง Context พร้อมค่าเริ่มต้น
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  setIsOpen: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
  addNotification: () => {},
});

// Custom hook สำหรับใช้งาน Context
export const useNotifications = () => useContext(NotificationContext);

// Provider Component
export default function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { subscribeToUserEvents, subscribeToProjectList, subscribeToFreelancerList } = usePusher();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // โหลดการแจ้งเตือนจาก localStorage เมื่อ component โหลด
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      try {
        const storedNotifications = localStorage.getItem(`notifications_${session.user.id}`);
        if (storedNotifications) {
          const parsedNotifications = JSON.parse(storedNotifications);
          setNotifications(parsedNotifications);
          
          // คำนวณจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
          const unread = parsedNotifications.filter(
            (notification: Notification) => !notification.isRead
          ).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }
  }, [session?.user?.id, status]);

  // บันทึกการแจ้งเตือนลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (session?.user?.id && notifications.length > 0) {
      localStorage.setItem(`notifications_${session.user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, session?.user?.id]);

  // คำนวณจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
  useEffect(() => {
    const count = notifications.filter((notification) => !notification.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // ลงทะเบียนรับการแจ้งเตือนจาก Pusher เมื่อมีการเปลี่ยนแปลงต่างๆ
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const userId = session.user.id;
    const isFreelancer = session.user.role === 'student';

    // ฟังก์ชันรับการแจ้งเตือนโปรเจกต์
    const handleProjectStatusChange = (data: any) => {
      console.log('ได้รับการแจ้งเตือนสถานะโปรเจกต์:', data);
      
      // สร้างการแจ้งเตือนตามสถานะที่เปลี่ยนไป
      if (data.projectId && data.newStatus) {
        let title = '';
        let message = '';
        let type: NotificationType = 'project_status_change';
        
        switch (data.newStatus) {
          case 'in_progress':
            title = 'เริ่มทำโปรเจกต์แล้ว';
            message = `โปรเจกต์ "${data.projectTitle || 'โปรเจกต์'}" ได้เริ่มดำเนินการแล้ว`;
            type = 'project_accepted';
            break;
          case 'awaiting':
            title = 'โปรเจกต์รอการตรวจสอบ';
            message = `ฟรีแลนซ์ส่งงานโปรเจกต์ "${data.projectTitle || 'โปรเจกต์'}" เพื่อรอการตรวจสอบ`;
            break;
          case 'revision':
            title = 'โปรเจกต์ต้องได้รับการแก้ไข';
            message = `โปรเจกต์ "${data.projectTitle || 'โปรเจกต์'}" ต้องได้รับการแก้ไข`;
            break;
          case 'completed':
            title = 'โปรเจกต์เสร็จสิ้น';
            message = `โปรเจกต์ "${data.projectTitle || 'โปรเจกต์'}" เสร็จสมบูรณ์แล้ว`;
            type = 'project_completed';
            break;
          default:
            title = 'การอัปเดตโปรเจกต์';
            message = `สถานะโปรเจกต์ "${data.projectTitle || 'โปรเจกต์'}" เปลี่ยนเป็น ${data.newStatus}`;
        }
        
        // สร้างการแจ้งเตือนใหม่
        const newNotification: Notification = {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type,
          title,
          message,
          createdAt: new Date().toISOString(),
          isRead: false,
          data: {
            projectId: data.projectId,
            projectTitle: data.projectTitle,
            status: data.newStatus
          }
        };
        
        // เพิ่มการแจ้งเตือนและแสดง toast
        addNotification(newNotification);
      }
    };
    
    // รับการแจ้งเตือนคำขอใหม่ (สำหรับเจ้าของโปรเจกต์)
    const handleProjectRequest = (data: any) => {
      if (!data.freelancerId || !data.projectId) return;
      
      // สร้างการแจ้งเตือนคำขอร่วมโปรเจกต์
      const newNotification: Notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'project_request',
        title: 'คำขอร่วมโปรเจกต์ใหม่',
        message: `${data.freelancerName || 'ฟรีแลนซ์'} ต้องการร่วมงานในโปรเจกต์ "${data.projectTitle || 'โปรเจกต์'}"`,
        createdAt: new Date().toISOString(),
        isRead: false,
        data: {
          projectId: data.projectId,
          projectTitle: data.projectTitle,
          userId: data.freelancerId,
          userName: data.freelancerName
        }
      };
      
      addNotification(newNotification);
    };
    
    // รับการแจ้งเตือนคำเชิญทำโปรเจกต์ (สำหรับฟรีแลนซ์)
    const handleProjectInvitation = (data: any) => {
      if (!data.projectId || !data.ownerId) return;
      
      // สร้างการแจ้งเตือนคำเชิญทำโปรเจกต์
      const newNotification: Notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'project_invitation',
        title: 'คำเชิญทำโปรเจกต์ใหม่',
        message: `${data.ownerName || 'เจ้าของโปรเจกต์'} เชิญคุณร่วมทำโปรเจกต์ "${data.projectTitle || 'โปรเจกต์'}"`,
        createdAt: new Date().toISOString(),
        isRead: false,
        data: {
          projectId: data.projectId,
          projectTitle: data.projectTitle,
          userId: data.ownerId,
          userName: data.ownerName
        }
      };
      
      addNotification(newNotification);
    };
    
    // ลงทะเบียนรับการแจ้งเตือนสำหรับผู้ใช้นี้
    const unsubscribeUserEvents = subscribeToUserEvents(userId, handleProjectStatusChange);
    
    // ลงทะเบียนรับการแจ้งเตือนโปรเจกต์ทั้งหมด
    const unsubscribeProjectList = subscribeToProjectList((data) => {
      // ตรวจสอบหากมีการเปลี่ยนแปลงที่เกี่ยวข้องกับผู้ใช้
      if (data.newRequest && data.projectOwnerId === userId) {
        handleProjectRequest(data);
      }
      
      if (data.newInvitation && data.freelancerId === userId) {
        handleProjectInvitation(data);
      }
    });
    
    // ลงทะเบียนรับการแจ้งเตือนฟรีแลนซ์ทั้งหมด (สำหรับฟรีแลนซ์เท่านั้น)
    let unsubscribeFreelancerList = () => {};
    if (isFreelancer) {
      unsubscribeFreelancerList = subscribeToFreelancerList((data) => {
        // ตรวจสอบหากมีการเปลี่ยนแปลงที่เกี่ยวข้องกับฟรีแลนซ์นี้
      });
    }
    
    // ยกเลิกการลงทะเบียนเมื่อ component unmount
    return () => {
      unsubscribeUserEvents();
      unsubscribeProjectList();
      unsubscribeFreelancerList();
    };
  }, [status, session?.user?.id, session?.user?.role, subscribeToUserEvents, subscribeToProjectList, subscribeToFreelancerList]);

  // เพิ่มการแจ้งเตือนใหม่
  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // เก็บไว้สูงสุด 50 รายการ
  };

  // ทำเครื่องหมายว่าอ่านแล้ว
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  // ทำเครื่องหมายว่าอ่านทั้งหมด
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  // ล้างการแจ้งเตือนทั้งหมด
  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        setIsOpen,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}