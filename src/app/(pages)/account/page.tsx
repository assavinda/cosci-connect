// src/app/(pages)/account/page.tsx
'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import LogOutButton from "../../components/buttons/LogOutButton";
import EditProfileForm from "../../components/account/EditProfileForm";
import React from "react";
import PDFViewer from "@/app/components/common/PDFViewer";
import { addPDFTransformation } from "@/utils/fileHelpers";

function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

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

  // Toggle isOpen status (for students only)
  const toggleIsOpen = async () => {
    if (!userData || userData.role !== 'student') return;
    
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('isOpen', (!userData.isOpen).toString());
      
      const response = await axios.patch('/api/user/profile', formData);
      setUserData(response.data);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter edit mode
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Update user data after successful edit
  const handleUpdateSuccess = (updatedData: any) => {
    setUserData(updatedData);
    setIsEditing(false);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  // Show edit form if in edit mode
  if (isEditing && userData) {
    return (
      <div className="w-full mx-auto">
        <EditProfileForm 
          userData={userData}
          onUpdateSuccess={handleUpdateSuccess}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  // Show account page content when authenticated and data is loaded
  return (
    <div className="w-full mx-auto ">
      <div className="bg-white rounded-xl p-6 mb-6">
        <div className="flex justify-start items-center mb-6 border-b border-gray-200 pb-4">
          <h1 className="text-xl font-medium text-primary-blue-500">โปรไฟล์ของฉัน</h1>
        </div>

        {userData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column - Profile image and basic info */}
            <div className="md:col-span-1">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-white flex items-center justify-center outline-8 outline-double outline-primary-blue-500 shadow-lg mb-4">
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

                <div className="flex gap-3 mb-3">
                  <button 
                    onClick={handleEditProfile}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    แก้ไขโปรไฟล์
                  </button>
                  <LogOutButton />
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 w-full">
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
                
                {/* สถานะพร้อมรับงาน (สำหรับนิสิตเท่านั้น) */}
                {userData.role === 'student' && (
                  <div className="mt-4 w-full">
                    <button
                      onClick={toggleIsOpen}
                      className={`w-full py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                        userData.isOpen
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <span className={`block w-3 h-3 rounded-full ${userData.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {userData.isOpen ? 'พร้อมรับงาน' : 'ไม่พร้อมรับงาน'}
                    </button>
                  </div>
                )}
                
                {/* ราคาเริ่มต้น (สำหรับนิสิตเท่านั้น) */}
                {userData.role === 'student' && userData.basePrice && (
                  <div className="mt-4 w-full">
                    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                      <span className="text-sm text-gray-500">ราคาเริ่มต้น</span>
                      <p className="font-medium text-primary-blue-500 text-xl">
                        {formatCurrency(userData.basePrice)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right column - Details */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-medium mb-2">ข้อมูลส่วนตัว</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">ชื่อ</span>
                    <p className="font-medium text-l">{userData.firstName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">นามสกุล</span>
                    <p className="font-medium text-l">{userData.lastName}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-medium mb-2">เกี่ยวกับฉัน</h3>
                <p className="text-gray-700">
                  {userData.bio || 'ยังไม่มีข้อมูล'}
                </p>
              </div>
              
              {userData.skills && userData.skills.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
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
              
              {userData.role === 'student' && userData.galleryImages && userData.galleryImages.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                  <h3 className="text-lg font-medium mb-2">ตัวอย่างผลงาน</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {userData.galleryImages.map((image, index) => (
                      <div key={index} className="rounded-lg overflow-hidden h-40 bg-gray-200 border border-gray-300">
                        <img 
                          src={image} 
                          alt={`ตัวอย่างผลงาน ${index+1}`} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {userData.role === 'student' && userData.portfolioUrl && (
                <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                  <h3 className="text-lg font-medium mb-2">พอร์ตโฟลิโอ</h3>
                  <PDFViewer 
                    pdfUrl={addPDFTransformation(userData.portfolioUrl)} 
                    fileName={`พอร์ตโฟลิโอของ ${userData.name}`}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AccountPage;