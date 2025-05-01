'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

// Define user data interface
interface UserData {
  id: string;
  name: string;
  email: string;
  role?: 'student' | 'alumni' | 'teacher';
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string | null;
  isOpen?: boolean;
  basePrice?: number;
  galleryImages?: string[];
  skills?: string[];
}

// Define context type
type UserContextType = {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  updateUserData: (newData: Partial<UserData>) => void;
  refreshUserData: () => Promise<void>;
};

// Create context with default values
const UserContext = createContext<UserContextType>({
  userData: null,
  isLoading: true,
  error: null,
  updateUserData: () => {},
  refreshUserData: async () => {},
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

// Provider component
export default function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch user data from API
  const fetchUserData = async () => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/user/profile');
      const data = response.data;

      setUserData({
        id: session.user.id,
        name: data.name,
        email: data.email,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        profileImageUrl: data.profileImageUrl,
        isOpen: data.isOpen,
        basePrice: data.basePrice,
        galleryImages: data.galleryImages,
        skills: data.skills,
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
      
      // Fall back to session data if API fails
      if (session?.user) {
        setUserData({
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          profileImageUrl: session.user.profileImageUrl,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update local user data (without API call)
  const updateUserData = (newData: Partial<UserData>) => {
    setUserData(prev => prev ? { ...prev, ...newData } : null);
  };

  // Refresh user data from API
  const refreshUserData = async () => {
    await fetchUserData();
  };

  // Fetch user data on session change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    } else if (status === 'unauthenticated') {
      setUserData(null);
      setIsLoading(false);
    }
  }, [status, session]);

  return (
    <UserContext.Provider value={{ userData, isLoading, error, updateUserData, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
}