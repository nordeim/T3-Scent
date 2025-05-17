// src/contexts/NotificationsContext.tsx
"use client";

import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import type { Notification as PrismaNotification } from "@prisma/client"; // Assuming Prisma type
import { api } from '~/utils/api'; // For tRPC calls

// Extend PrismaNotification if needed, e.g., for client-side state
export interface AppNotification extends Omit<PrismaNotification, 'createdAt' | 'readAt'> {
  createdAt: string; // Store dates as strings or Date objects client-side
  readAt?: string | null;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isLoading: boolean;
  // addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'userId' | 'isRead'>) => void; // For client-side adding (e.g. after an action)
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Example using tRPC query (actual query name might differ)
  // const getNotificationsQuery = api.notifications.getNotifications.useQuery(undefined, {
  //   enabled: false, // Manually fetch
  //   onSuccess: (data) => {
  //     const processedNotifications = data.items.map(n => ({
  //       ...n,
  //       createdAt: n.createdAt.toISOString(), // Convert Date to string
  //       readAt: n.readAt?.toISOString(),
  //     }))
  //     setNotifications(processedNotifications);
  //     setUnreadCount(data.unreadCount);
  //     setIsLoading(false);
  //   },
  //   onError: () => setIsLoading(false),
  // });

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    // await getNotificationsQuery.refetch();
    // Placeholder:
    console.log("Fetching notifications...");
    // Simulate API call
    setTimeout(() => {
        // Replace with actual API call: e.g. const data = await api.notifications.get.query();
        // setNotifications(data.items);
        // setUnreadCount(data.unreadCount);
        setIsLoading(false);
    }, 1000);
  }, [/* getNotificationsQuery */]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Placeholder: Call tRPC mutation
    // await api.notifications.markAsRead.mutate({ notificationId });
    setNotifications(prev => 
      prev.map(n => n.id === notificationId && !n.isRead ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => (notifications.find(n => n.id === notificationId && !n.isRead) ? Math.max(0, prev - 1) : prev));
    console.log(`Notification ${notificationId} marked as read.`);
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    // Placeholder: Call tRPC mutation
    // await api.notifications.markAllAsRead.mutate();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
    console.log("All notifications marked as read.");
  }, []);

  // Effect to fetch notifications on mount (if user is logged in)
  // This depends on how session is checked; often done after session is available.
  // useEffect(() => {
  //   fetchNotifications();
  // }, [fetchNotifications]);

  return (
    <NotificationsContext.Provider value={{ 
        notifications, 
        unreadCount, 
        fetchNotifications, 
        markAsRead, 
        markAllAsRead,
        isLoading 
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};