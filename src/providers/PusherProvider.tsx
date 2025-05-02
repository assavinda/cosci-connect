// src/providers/PusherProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

type PusherContextType = {
  pusherClient: Pusher | null;
  isConnected: boolean;

  subscribeToProject: (projectId: string, eventCallback: (data: any) => void) => () => void;
  subscribeToFreelancer: (freelancerId: string, eventCallback: (data: any) => void) => () => void;
  subscribeToUserEvents: (userId: string, eventCallback: (data: any) => void) => () => void;
  subscribeToProjectList: (eventCallback: (data: any) => void) => () => void;
  subscribeToFreelancerList: (eventCallback: (data: any) => void) => () => void;
  
  // Modified function for user notifications
  subscribeToUserNotifications: (userId: string, eventCallback: (data: any) => void) => () => void;
};

const PusherContext = createContext<PusherContextType>({
  pusherClient: null,
  isConnected: false,

  subscribeToProject: () => () => {},
  subscribeToFreelancer: () => () => {},
  subscribeToUserEvents: () => () => {},
  subscribeToProjectList: () => () => {},
  subscribeToFreelancerList: () => () => {},
  subscribeToUserNotifications: () => () => {},
});

export const usePusher = () => useContext(PusherContext);

export default function PusherProvider({ children }: { children: React.ReactNode }) {
  const [pusherClient, setPusherClient] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();
  const hasInitializedRef = useRef(false);
  
  // Add a ref to track notification subscriptions - prevent duplicate toasts
  const notificationSubscriptionsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      hasInitializedRef.current ||
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      return;
    }

    const client = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      forceTLS: true,
    });

    client.connection.bind('connected', () => {
      console.log('✅ Pusher connected');
      setIsConnected(true);
    });

    client.connection.bind('disconnected', () => {
      console.log('⚠️ Pusher disconnected');
      setIsConnected(false);
    });

    client.connection.bind('error', (error: any) => {
      console.error('❌ Pusher error:', error);
      setIsConnected(false);
    });

    setPusherClient(client);
    hasInitializedRef.current = true;

    return () => {
      client.disconnect();
      hasInitializedRef.current = false;
      // Also clear notification subscriptions on unmount
      notificationSubscriptionsRef.current = {};
    };
  }, []);

  const subscribeToProject = (projectId: string, eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};

    const channel = pusherClient.subscribe('project-updates');
    const eventName = `project-${projectId}-updated`;

    channel.bind(eventName, eventCallback);

    return () => {
      channel.unbind(eventName, eventCallback);
    };
  };

  const subscribeToFreelancer = (freelancerId: string, eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};

    const channel = pusherClient.subscribe('freelancer-updates');
    const eventName = `freelancer-${freelancerId}-updated`;

    channel.bind(eventName, eventCallback);

    return () => {
      channel.unbind(eventName, eventCallback);
    };
  };

  const subscribeToUserEvents = (userId: string, eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};

    const channel = pusherClient.subscribe(`user-${userId}`);

    // รับการอัปเดตสถานะโปรเจกต์
    channel.bind('project-status-changed', eventCallback);

    // รับการแจ้งเตือนคำขอโปรเจกต์
    channel.bind('project-request', eventCallback);

    // รับการแจ้งเตือนคำเชิญร่วมโปรเจกต์
    channel.bind('project-invitation', eventCallback);

    return () => {
      channel.unbind('project-status-changed', eventCallback);
      channel.unbind('project-request', eventCallback);
      channel.unbind('project-invitation', eventCallback);
      pusherClient.unsubscribe(`user-${userId}`);
    };
  };

  const subscribeToProjectList = (eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};

    const channel = pusherClient.subscribe('project-updates');

    // รับการอัปเดตรายการโปรเจกต์ทั่วไป
    channel.bind('project-list-updated', eventCallback);
    
    // รับการแจ้งเตือนโปรเจกต์ที่มีการร้องขอใหม่
    channel.bind('project-request-new', eventCallback);
    
    // รับการแจ้งเตือนโปรเจกต์ที่มีการส่งคำเชิญใหม่
    channel.bind('project-invitation-new', eventCallback);

    return () => {
      channel.unbind('project-list-updated', eventCallback);
      channel.unbind('project-request-new', eventCallback);
      channel.unbind('project-invitation-new', eventCallback);
    };
  };

  const subscribeToFreelancerList = (eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};

    const channel = pusherClient.subscribe('freelancer-updates');

    channel.bind('freelancer-list-updated', eventCallback);

    return () => {
      channel.unbind('freelancer-list-updated', eventCallback);
    };
  };
  
  // Updated function for subscribing to user notifications
  const subscribeToUserNotifications = (userId: string, eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};

    // ใช้ channel ID ที่เฉพาะเจาะจงเพื่อป้องกันการซ้ำซ้อน
    const channelId = `notifications-${userId}`;
    const channel = pusherClient.subscribe(channelId);

    // ตรวจสอบว่าเคยลงทะเบียนกับ channel นี้แล้วหรือไม่
    if (notificationSubscriptionsRef.current[channelId]) {
      // ถ้าเคยลงทะเบียนแล้ว ให้เรียก callback โดยไม่แสดง toast ซ้ำ
      channel.bind('new-notification', eventCallback);
      
      return () => {
        channel.unbind('new-notification', eventCallback);
      };
    }

    // ถ้ายังไม่เคยลงทะเบียน ให้บันทึกว่าได้ลงทะเบียนแล้ว
    notificationSubscriptionsRef.current[channelId] = true;

    // รับการแจ้งเตือนใหม่ และแสดง toast
    channel.bind('new-notification', (data: any) => {
      // Show toast notification
      if (data.notification) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-primary-blue-100 flex items-center justify-center text-primary-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
                      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {data.notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {data.notification.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-blue-600 hover:text-primary-blue-500 focus:outline-none"
              >
                ปิด
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'top-right',
        });
      }
      
      // Call the provided callback
      eventCallback(data);
    });

    return () => {
      channel.unbind('new-notification', eventCallback);
      // ในกรณีที่ยกเลิกการสมัครทั้งหมด อย่าลืมลบบันทึกการลงทะเบียนด้วย
      delete notificationSubscriptionsRef.current[channelId];
      pusherClient.unsubscribe(channelId);
    };
  };

  // Subscribe to user-specific events (auto on login)
  useEffect(() => {
    if (!pusherClient || !isConnected || !session?.user?.id) return;

    const userId = session.user.id;
    const userRole = session.user.role;
    const isFreelancer = userRole === 'student';
    
    console.log(`🔔 Auto-subscribing to notifications for user ${userId} (${userRole})`);

    // ฟังก์ชันรับการแจ้งเตือนโปรเจกต์
    const handleProjectStatusChange = (data: any) => {
      console.log('📢 User project-status-changed:', data);
    };
    
    // ฟังก์ชันรับการแจ้งเตือนคำขอฟรีแลนซ์
    const handleProjectRequest = (data: any) => {
      console.log('📢 Received project request:', data);
    };
    
    // ฟังก์ชันรับการแจ้งเตือนคำเชิญฟรีแลนซ์
    const handleProjectInvitation = (data: any) => {
      console.log('📢 Received project invitation:', data);
    };
    
    // ลงทะเบียนรับการแจ้งเตือนส่วนตัว
    const userChannel = pusherClient.subscribe(`user-${userId}`);
    
    // ฟังการแจ้งเตือนสถานะโปรเจกต์
    userChannel.bind('project-status-changed', handleProjectStatusChange);
    
    // ฟังการแจ้งเตือนที่แตกต่างกันตามบทบาท
    if (isFreelancer) {
      // สำหรับฟรีแลนซ์
      userChannel.bind('project-invitation', handleProjectInvitation);
    } else {
      // สำหรับเจ้าของโปรเจกต์ (อาจารย์/ศิษย์เก่า)
      userChannel.bind('project-request', handleProjectRequest);
    }
    
    // ช่องทางรับการแจ้งเตือนทั่วไป ไม่จำเป็นต้องลงทะเบียนที่นี่เพื่อหลีกเลี่ยงการซ้ำซ้อน
    // เนื่องจากจะมีการเรียกใช้ subscribeToUserNotifications ในส่วนอื่นๆ ของแอปอยู่แล้ว

    return () => {
      // ยกเลิกการฟังทั้งหมด
      userChannel.unbind('project-status-changed', handleProjectStatusChange);
      
      if (isFreelancer) {
        userChannel.unbind('project-invitation', handleProjectInvitation);
      } else {
        userChannel.unbind('project-request', handleProjectRequest);
      }
      
      // ยกเลิกการลงทะเบียน
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [pusherClient, isConnected, session?.user?.id, session?.user?.role]);

  return (
    <PusherContext.Provider
      value={{
        pusherClient,
        isConnected,
        subscribeToProject,
        subscribeToFreelancer,
        subscribeToUserEvents,
        subscribeToProjectList,
        subscribeToFreelancerList,
        subscribeToUserNotifications,
      }}
    >
      {children}
    </PusherContext.Provider>
  );
}