// src/app/(pages)/account/page.tsx
'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import LogOutButton from "../../components/buttons/LogOutButton";
import React from "react";

function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
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
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [session, status]);

  // Show loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // Show account page content when authenticated and data is loaded
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium text-primary-blue-500">โปรไฟล์ของฉัน</h1>
          <LogOutButton />
        </div>

        {userData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column - Profile image and basic info */}
            <div className="md:col-span-1">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                  {userData.profileImageUrl ? (
                    <img 
                      src={userData.profileImageUrl} 
                      alt={userData.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-blue-500 text-white text-4xl font-medium">
                      {userData.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-medium text-center">{userData.name}</h2>
                <p className="text-gray-500 text-center mb-4">{userData.email}</p>
                
                <div className="w-full bg-gray-100 rounded-lg p-4 mt-2">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">บทบาท</span>
                    <p className="font-medium">{userData.role === 'student' ? 'นิสิต' : 
                                              userData.role === 'alumni' ? 'ศิษย์เก่า' : 'อาจารย์'}</p>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">วิชาเอก</span>
                    <p className="font-medium">{userData.major}</p>
                  </div>
                  
                  {userData.role === 'student' && userData.studentId && (
                    <div>
                      <span className="text-sm text-gray-500">รหัสนิสิต</span>
                      <p className="font-medium">{userData.studentId}</p>
                    </div>
                  )}
                </div>
                
                <button className="btn-secondary w-full mt-4">
                  แก้ไขโปรไฟล์
                </button>
              </div>
            </div>
            
            {/* Right column - Details */}
            <div className="md:col-span-2">
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-medium mb-2">ข้อมูลส่วนตัว</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">ชื่อ</span>
                    <p className="font-medium">{userData.firstName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">นามสกุล</span>
                    <p className="font-medium">{userData.lastName}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-medium mb-2">เกี่ยวกับฉัน</h3>
                <p className="text-gray-700">
                  {userData.bio || 'ยังไม่มีข้อมูล'}
                </p>
              </div>
              
              {userData.skills && userData.skills.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-medium mb-2">ทักษะ</h3>
                  <div className="flex flex-wrap gap-2">
                    {userData.skills.map(skill => (
                      <span 
                        key={skill}
                        className="bg-primary-blue-100 text-primary-blue-600 text-sm px-3 py-1 rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {userData.role === 'student' && userData.portfolioUrl && (
                <div className="bg-gray-50 rounded-xl p-4 mt-6">
                  <h3 className="text-lg font-medium mb-2">พอร์ตโฟลิโอ</h3>
                  <a 
                    href={userData.portfolioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-blue-500 hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    ดูพอร์ตโฟลิโอ (PDF)
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountPage