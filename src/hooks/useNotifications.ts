// src/hooks/useNotifications.ts
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { usePusher } from '@/providers/PusherProvider';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  sender?: {
    id: string;
    name: string;
    profileImageUrl?: string;
  };
  projectId?: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { subscribeToUserNotifications } = usePusher();

  // Subscribe to real-time notifications
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    // Function to handle new notifications
    const handleNewNotification = (data: any) => {
      if (data.notification) {
        // Add the new notification to the list
        setNotifications(prev => [data.notification, ...prev]);
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
      }
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

  // Function to fetch notifications
  const fetchNotifications = useCallback(async (pageNum: number = 1) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/notifications', {
        params: {
          page: pageNum,
          limit: 10
        },
        // ส่ง headers เพื่อช่วยในการตรวจสอบ session
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });

      if (pageNum === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }

      setUnreadCount(response.data.pagination.unreadCount);
      setHasMore(pageNum < response.data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('ไม่สามารถโหลดการแจ้งเตือนได้');
    } finally {
      setLoading(false);
    }
  }, [status, session?.user?.id]);

  // Function to refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (status !== 'authenticated') {
      return;
    }
    
    setPage(1);
    await fetchNotifications(1);
  }, [status, fetchNotifications]);

  // Fetch notifications when component mounts or session changes
  useEffect(() => {
    // เรียก API เฉพาะเมื่อ authenticated เท่านั้น
    if (status === 'authenticated') {
      refreshNotifications();
    }
  }, [status, refreshNotifications]);

  // Function to load more notifications
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  // Function to mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }
    
    try {
      await axios.post(`/api/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      // Update unread count
      const updatedCount = unreadCount - 1;
      setUnreadCount(Math.max(0, updatedCount));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [status, session?.user?.id, unreadCount]);

  // Function to mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }
    
    try {
      await axios.patch('/api/notifications', { markAll: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [status, session?.user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    hasMore,
    loadMore
  };
}