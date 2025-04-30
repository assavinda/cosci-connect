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
};

const PusherContext = createContext<PusherContextType>({
  pusherClient: null,
  isConnected: false,

  subscribeToProject: () => () => {},
  subscribeToFreelancer: () => () => {},
  subscribeToUserEvents: () => () => {},
  subscribeToProjectList: () => () => {},
  subscribeToFreelancerList: () => () => {},
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

    channel.bind('project-status-changed', eventCallback);

    return () => {
      channel.unbind('project-status-changed', eventCallback);
      pusherClient.unsubscribe(`user-${userId}`);
    };
  };

  const subscribeToProjectList = (eventCallback: (data: any) => void) => {
    if (!pusherClient) return () => {};

    const channel = pusherClient.subscribe('project-updates');

    channel.bind('project-list-updated', eventCallback);

    return () => {
      channel.unbind('project-list-updated', eventCallback);
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

  // Subscribe to user-specific events (auto on login)
  useEffect(() => {
    if (!pusherClient || !isConnected || !session?.user?.id) return;

    const userId = session.user.id;
    const channel = pusherClient.subscribe(`user-${userId}`);

    const onStatusChange = (data: any) => {
      console.log('📢 User project-status-changed:', data);
    };

    channel.bind('project-status-changed', onStatusChange);

    return () => {
      channel.unbind('project-status-changed', onStatusChange);
      pusherClient.unsubscribe(`user-${userId}`);
    };
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
        subscribeToFreelancerList,
      }}
    >
      {children}
    </PusherContext.Provider>
  );
}
