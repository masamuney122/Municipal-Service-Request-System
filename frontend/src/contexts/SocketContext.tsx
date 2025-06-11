import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Notification {
  _id?: string;
  type: string;
  requestId: string;
  title: string;
  message: string;
  status?: string;
  comment?: string;
  updatedBy: {
    _id: string;
    name: string;
  };
  timestamp: Date;
  read: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  notifications: Notification[];
  markNotificationAsRead: (requestId: string) => void;
  clearNotifications: () => void;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // Function to create new socket connection
  const createSocketConnection = useCallback(() => {
    if (!user?._id) return null;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for socket authentication');
      return null;
    }

    console.log('Creating new socket connection for user:', user._id);
    
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    return newSocket;
  }, [user]);

  // Handle socket connection and events
  useEffect(() => {
    const newSocket = createSocketConnection();
    
    if (!newSocket) return;

    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnected(true);
      setSocket(newSocket);

      // Emit role change event if user exists
      if (user?.role && socketRef.current) {
        socketRef.current.emit('role-change', user.role);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Handle notifications
    newSocket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification);
      
      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => 
          n.type === notification.type && 
          n.requestId === notification.requestId &&
          n.timestamp === notification.timestamp
        );

        if (exists) {
          console.log('Duplicate notification, skipping');
          return prev;
        }

        const newNotification = {
          ...notification,
          read: false,
          timestamp: new Date(notification.timestamp)
        };

        // Show browser notification
        if (Notification.permission === 'granted') {
          try {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/logo192.png',
              tag: `${notification.type}-${notification.requestId}` // Prevent duplicate notifications
            });
          } catch (error) {
            console.error('Error showing browser notification:', error);
          }
        }

        return [newNotification, ...prev];
      });
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
    };
  }, [user, createSocketConnection]);

  // Handle user role changes
  useEffect(() => {
    if (socketRef.current && user?.role) {
      socketRef.current.emit('role-change', user.role);
    }
  }, [user?.role]);

  // Handle storage events (for multiple tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed (logout)
        if (socket) {
          socket.close();
          setSocket(null);
          setConnected(false);
          setNotifications([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [socket]);

  const markNotificationAsRead = useCallback((requestId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.requestId === requestId
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      notifications,
      markNotificationAsRead,
      clearNotifications,
      connected
    }}>
      {children}
    </SocketContext.Provider>
  );
}; 