'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { useSession } from 'next-auth/react';

type PusherContextType = {
  pusherClient: Pusher | null;
  isConnected: boolean;

  subscribeToProject: (projectId: string, eventCallback: (data: any) => void) => () => void;
  subscribeToFreelancer: (freelancerId: string, eventCallback: (data: any) => void) => () => void;
  subscribeToUserEvents: (userId: string, eventCallback: (data: any) => void) => () => void;
  subscribeToProjectList: (eventCallback: (data: any) => void) => () => void;
  subscribeToFreelancerList: (eventCallback: (data: any) => void) => () => void;
  
  // เพิ่มฟังก์ชันสำหรับรับการแจ้งเตือนเฉพาะ
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
  
  // ฟังก์ชั่นใหม่สำหรับรับการแจ้งเตือนเฉพาะบุคคล
  const subscribeToUserNotifications = (userId: string, eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};

    const channel = pusherClient.subscribe(`notifications-${userId}`);

    // รับการแจ้งเตือนใหม่
    channel.bind('new-notification', eventCallback);

    return () => {
      channel.unbind('new-notification', eventCallback);
      pusherClient.unsubscribe(`notifications-${userId}`);
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
    
    // ลงทะเบียนรับการแจ้งเตือนทั่วไป
    const notificationChannel = pusherClient.subscribe(`notifications-${userId}`);
    
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
    
    // รับการแจ้งเตือนทั่วไป
    notificationChannel.bind('new-notification', (data: any) => {
      console.log('📢 New notification:', data);
    });

    return () => {
      // ยกเลิกการฟังทั้งหมด
      userChannel.unbind('project-status-changed', handleProjectStatusChange);
      
      if (isFreelancer) {
        userChannel.unbind('project-invitation', handleProjectInvitation);
      } else {
        userChannel.unbind('project-request', handleProjectRequest);
      }
      
      notificationChannel.unbind_all();
      
      // ยกเลิกการลงทะเบียน
      pusherClient.unsubscribe(`user-${userId}`);
      pusherClient.unsubscribe(`notifications-${userId}`);
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