// src/providers/PusherProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { useSession } from 'next-auth/react';

// ตรวจสอบว่ามีการกำหนดค่า PUSHER_KEY ฝั่ง client หรือไม่
if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
  console.warn('NEXT_PUBLIC_PUSHER_KEY หรือ NEXT_PUBLIC_PUSHER_CLUSTER ไม่ได้ถูกกำหนด');
}

// กำหนด type ของ context
type PusherContextType = {
  pusherClient: Pusher | null;
  isConnected: boolean;
  
  // ฟังก์ชันสำหรับการใช้งาน
  subscribeToProject: (projectId: string, eventCallback: (data: any) => void) => () => void;
  subscribeToFreelancer: (freelancerId: string, eventCallback: (data: any) => void) => () => void;
  subscribeToUserEvents: (userId: string, eventCallback: (data: any) => void) => () => void;
  subscribeToProjectList: (eventCallback: (data: any) => void) => () => void;
  subscribeToFreelancerList: (eventCallback: (data: any) => void) => () => void;
};

// สร้าง context สำหรับใช้งาน Pusher
const PusherContext = createContext<PusherContextType>({
  pusherClient: null,
  isConnected: false,
  
  // ฟังก์ชันว่างเปล่า
  subscribeToProject: () => () => {},
  subscribeToFreelancer: () => () => {},
  subscribeToUserEvents: () => () => {},
  subscribeToProjectList: () => () => {},
  subscribeToFreelancerList: () => () => {},
});

// Hook สำหรับใช้งาน Pusher ใน component อื่นๆ
export const usePusher = () => useContext(PusherContext);

// Provider component
export default function PusherProvider({ children }: { children: React.ReactNode }) {
  const [pusherClient, setPusherClient] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // สร้าง Pusher client เมื่อ component ถูก mount
    if (typeof window !== 'undefined' && !pusherClient && 
        process.env.NEXT_PUBLIC_PUSHER_KEY && 
        process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      
      // Initialize Pusher client
      const client = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        forceTLS: true,
      });

      // ตั้งค่า event listener สำหรับสถานะการเชื่อมต่อ
      client.connection.bind('connected', () => {
        console.log('Pusher connected successfully');
        setIsConnected(true);
      });

      client.connection.bind('disconnected', () => {
        console.log('Pusher disconnected');
        setIsConnected(false);
      });

      client.connection.bind('error', (error: any) => {
        console.error('Pusher connection error:', error);
        setIsConnected(false);
      });

      setPusherClient(client);

      // Cleanup เมื่อ component ถูก unmount
      return () => {
        client.disconnect();
      };
    }
  }, []);

  // ฟังก์ชันสำหรับ subscribe และ listen events ของโปรเจกต์
  const subscribeToProject = (projectId: string, eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};
    
    const channel = pusherClient.subscribe('project-updates');
    const eventName = `project-${projectId}-updated`;
    
    channel.bind(eventName, eventCallback);
    
    // Return unsubscribe function
    return () => {
      channel.unbind(eventName);
      // ไม่ต้อง unsubscribe ตรงนี้ เพราะอาจมีคนอื่นยังใช้ channel นี้อยู่
    };
  };

  // ฟังก์ชันสำหรับ subscribe และ listen events ของฟรีแลนซ์
  const subscribeToFreelancer = (freelancerId: string, eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};
    
    const channel = pusherClient.subscribe('freelancer-updates');
    const eventName = `freelancer-${freelancerId}-updated`;
    
    channel.bind(eventName, eventCallback);
    
    // Return unsubscribe function
    return () => {
      channel.unbind(eventName);
      // ไม่ต้อง unsubscribe ตรงนี้ เพราะอาจมีคนอื่นยังใช้ channel นี้อยู่
    };
  };

  // ฟังก์ชันสำหรับ subscribe และ listen events ของผู้ใช้
  const subscribeToUserEvents = (userId: string, eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};
    
    const channel = pusherClient.subscribe(`user-${userId}`);
    
    channel.bind('project-status-changed', eventCallback);
    
    // Return unsubscribe function
    return () => {
      channel.unbind('project-status-changed');
      channel.unsubscribe();
    };
  };

  // ฟังก์ชันสำหรับ subscribe และ listen events ของรายการโปรเจกต์ทั้งหมด
  const subscribeToProjectList = (eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};
    
    const channel = pusherClient.subscribe('project-updates');
    
    channel.bind('project-list-updated', eventCallback);
    
    // Return unsubscribe function
    return () => {
      channel.unbind('project-list-updated');
      // ไม่ต้อง unsubscribe ตรงนี้ เพราะอาจมีคนอื่นยังใช้ channel นี้อยู่
    };
  };

  // ฟังก์ชันสำหรับ subscribe และ listen events ของรายการฟรีแลนซ์ทั้งหมด
  const subscribeToFreelancerList = (eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};
    
    const channel = pusherClient.subscribe('freelancer-updates');
    
    channel.bind('freelancer-list-updated', eventCallback);
    
    // Return unsubscribe function
    return () => {
      channel.unbind('freelancer-list-updated');
      // ไม่ต้อง unsubscribe ตรงนี้ เพราะอาจมีคนอื่นยังใช้ channel นี้อยู่
    };
  };

  // Subscribe to user events when session is available
  useEffect(() => {
    if (pusherClient && isConnected && session?.user?.id) {
      // Auto-subscribe to user's own channel for notifications
      const userId = session.user.id;
      const channel = pusherClient.subscribe(`user-${userId}`);
      
      // Add any user-specific event listeners here
      
      return () => {
        // Cleanup when session changes or component unmounts
        channel.unsubscribe();
      };
    }
  }, [pusherClient, isConnected, session?.user?.id]);

  return (
    <PusherContext.Provider 
      value={{ 
        pusherClient, 
        isConnected,
        subscribeToProject,
        subscribeToFreelancer,
        subscribeToUserEvents,
        subscribeToProjectList,
        subscribeToFreelancerList
      }}
    >
      {children}
    </PusherContext.Provider>
  );
}