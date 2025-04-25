'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import EditProfileForm from "../../../components/account/EditProfileForm";
import React from "react";

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?state=login');
    }
  }, [status, router]);

  // Fetch user data when session is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'authenticated' && session) {
        try {
          setIsLoading(true);
          const response = await axios.get('/api/user/profile');
          setUserData(response.data);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Redirect to account page on error
          router.push('/account');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [session, status, router]);

  // Handle cancel
  const handleCancel = () => {
    router.push('/account');
  };

  // Handle successful update
  const handleUpdateSuccess = (updatedData: any) => {
    // Update session data
    setUserData(updatedData);
    
    // Redirect to account page after a brief delay
    setTimeout(() => {
      router.push('/account');
    }, 1500);
  };

  // Show loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {userData ? (
        <EditProfileForm 
          userData={userData}
          onUpdateSuccess={handleUpdateSuccess}
          onCancel={handleCancel}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-xl font-medium text-red-500 mb-4">เกิดข้อผิดพลาด</h2>
          <p className="mb-4">ไม่สามารถโหลดข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง</p>
          <button
            onClick={() => router.push('/account')}
            className="btn-secondary"
          >
            กลับไปหน้าโปรไฟล์
          </button>
        </div>
      )}
    </div>
  );
}