'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Loading from '../../../components/common/Loading';
import ApplyButton from '../../../components/buttons/ApplyButton';
import { toast, Toaster } from 'react-hot-toast';
import { usePusher } from '../../../../providers/PusherProvider';
import ProjectManageButtons from '@/app/components/buttons/ProjectManageButtons';
import SendMessageButton from '@/app/components/buttons/SendMessageButton';

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  
  // Use Pusher for real-time updates
  const { subscribeToProject } = usePusher();

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/projects/${id}`);
        setProject(response.data);
        
        // Check if the current user has already applied
        if (session?.user?.id && response.data.freelancersRequested) {
          const applied = response.data.freelancersRequested.includes(session.user.id);
          setHasApplied(applied);
        }
        
        // Fetch owner profile
        if (response.data.owner) {
          try {
            const ownerResponse = await axios.get(`/api/customers/${response.data.owner}`);
            setOwnerProfile(ownerResponse.data);
          } catch (err) {
            console.error('Error fetching owner profile:', err);
          }
        }
        
        // Fetch assigned freelancer profile if there is one
        if (response.data.assignedTo) {
          try {
            const freelancerResponse = await axios.get(`/api/freelancers/${response.data.assignedTo}`);
            setFreelancerProfile(freelancerResponse.data);
          } catch (err) {
            console.error('Error fetching freelancer profile:', err);
          }
        }
        
        setError('');
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('ไม่สามารถโหลดข้อมูลโปรเจกต์ได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProjectData();
    }
  }, [id, session?.user?.id]);

  // Subscribe to real-time project updates
  useEffect(() => {
    if (!id) return;
    
    // Callback function for when we receive an update
    const handleProjectUpdate = (data) => {
      console.log('ได้รับการอัปเดตข้อมูลโปรเจกต์:', data);
      
      // Update project data
      if (data.project) {
        setProject(data.project);
        
        // Update hasApplied status
        if (session?.user?.id && data.project.freelancersRequested) {
          const applied = data.project.freelancersRequested.includes(session.user.id);
          setHasApplied(applied);
        }
        
        // Fetch new freelancer profile if assignedTo has changed
        if (data.project.assignedTo && (!freelancerProfile || freelancerProfile.id !== data.project.assignedTo)) {
          fetchFreelancerProfile(data.project.assignedTo);
        }
      }
    };
    
    // Subscribe to project updates
    const unsubscribe = subscribeToProject(id.toString(), handleProjectUpdate);
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [id, subscribeToProject, session?.user?.id, freelancerProfile]);

  // Function to fetch freelancer profile
  const fetchFreelancerProfile = async (freelancerId) => {
    try {
      const response = await axios.get(`/api/freelancers/${freelancerId}`);
      setFreelancerProfile(response.data);
    } catch (err) {
      console.error('Error fetching freelancer profile:', err);
    }
  };

  // Format price as Thai Baht
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };

  // Translate status to Thai
  const getStatusText = (status) => {
    const statusMap = {
      'open': 'เปิดรับสมัคร',
      'assigned': 'มีผู้รับงานแล้ว',
      'in_progress': 'กำลังดำเนินการ',
      'revision': 'กำลังแก้ไข',
      'awaiting': 'รอการยืนยัน',
      'completed': 'เสร็จสิ้นแล้ว',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  };

  // Get color for status
  const getStatusColor = (status) => {
    const colorMap = {
      'open': 'bg-green-100 text-green-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'revision': 'bg-orange-100 text-orange-800',
      'awaiting': 'bg-purple-100 text-purple-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลโปรเจกต์...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl my-6 shadow-sm">
        <h2 className="text-red-600 text-lg font-medium mb-4">เกิดข้อผิดพลาด</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/project-board" className="btn-secondary inline-block">
          กลับไปยังหน้าโปรเจกต์บอร์ด
        </Link>
      </div>
    );
  }

  // No project found
  if (!project) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-gray-50 border border-gray-200 rounded-xl my-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">ไม่พบข้อมูลโปรเจกต์</h2>
        <p className="text-gray-600 mb-4">ไม่พบข้อมูลโปรเจกต์ที่คุณต้องการดู หรืออาจไม่มีอยู่ในระบบ</p>
        <Link href="/project-board" className="btn-secondary inline-block">
          กลับไปยังหน้าโปรเจกต์บอร์ด
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto mt-6">
      {/* Toaster for notifications */}
      <Toaster position="bottom-left" />
      
      {/* Back button and Apply/Action button */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/project-board" className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          กลับไปหน้าโปรเจกต์บอร์ด
        </Link>
      </div>

      {/* Project information card */}
      <div className="bg-white overflow-hidden">
        {/* Header - Project title and status */}
        <div className="p-3 border-b border-gray-200 mx-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
            <div className="flex flex-col gap-2 w-full md:w-auto">
            <p className="text-gray-500 text-sm">ชื่อโปรเจกต์</p>
              <h1 className="text-2xl font-medium text-primary-blue-500">{project.title}</h1>
              <div className="flex flex-col md:flex-row items-start w-full md:w-fit gap-4 mt-2 border border-gray-200 rounded-lg p-2">
              <div className="flex place-items-center gap-2">
                  <p className="text-gray-500 text-sm">วันที่โพสต์</p>
                  <p className="font-medium text-primary-blue-400">{formatDate(project.createdAt)}</p>
                </div>

                <div className="flex place-items-center gap-2">
                  <p className="text-gray-500 text-sm">กำหนดส่งงาน</p>
                  <p className="font-medium text-primary-blue-400">{formatDate(project.deadline)}</p>
                </div>
              </div>
              
            </div>
            
            <div className="self-center flex flex-col gap-2 w-full md:w-auto">
                <div className="text-center border border-gray-200 rounded-lg px-4 py-2 flex flex-col gap-2">
                    <p className="text-gray-500 text-sm">งบค่าจ้าง</p>
                    <p className="text-xl font-medium text-primary-blue-500">{formatPrice(project.budget)}</p>
                </div>
                {/* Action buttons for different user roles */}
                {session?.user?.role === 'student' && (
                  // If freelancer is assigned to this project
                  project.assignedTo === session?.user?.id ? (
                    <Link 
                      href="/manage-projects" 
                      className="btn-primary flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      ไปหน้าจัดการโปรเจกต์
                    </Link>
                  ) : (
                    // If freelancer has received a direct request
                    project.requestToFreelancer === session?.user?.id ? (
                      <ProjectManageButtons 
                        project={project}
                        isFreelancer={true}
                        userId={session?.user?.id}
                      />
                    ) : (
                      // If project is open for applications
                      project?.status === 'open' && (
                        hasApplied ? (
                          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            คุณได้ส่งคำขอร่วมงานแล้ว
                          </div>
                        ) : (
                          <ApplyButton 
                            projectId={project.id} 
                            projectTitle={project.title}
                            alreadyApplied={hasApplied}
                          />
                        )
                      )
                    )
                  )
                )}
                
                {/* Action buttons for project owners */}
                {session?.user?.id === project.owner && (
                  project.status === 'awaiting' ? (
                    <ProjectManageButtons 
                      project={project}
                      isFreelancer={false}
                      userId={session?.user?.id}
                    />
                  ) : (
                    <Link href="/manage-projects" className="btn-primary flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      ไปหน้าจัดการโปรเจกต์
                    </Link>
                  )
                )}
            </div>
            
          </div>
        </div>

        {/* Project details */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - General info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Required skills */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4 gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                    <path d="M12 2C8.14 2 5 5.14 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.14 15.86 2 12 2M9 21V20H15V21C15 21.55 14.55 22 14 22H10C9.45 22 9 21.55 9 21Z" stroke="#1167AE" strokeWidth="1.5" fill="none"/>
                  </svg>
                  <h2 className="text-lg font-semibold">ทักษะที่ต้องการ</h2>
                  <span className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-0.5 rounded-full">
                    {project.requiredSkills.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills && project.requiredSkills.length > 0 ? (
                    project.requiredSkills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="bg-primary-blue-50 text-primary-blue-600 text-sm px-3 py-1 rounded-full border border-primary-blue-100 hover:bg-primary-blue-100 transition-colors"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">ไม่ระบุทักษะที่ต้องการ</p>
                  )}
                </div>
              </div>
              
              {/* Project owner info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4 gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                    <circle cx="12" cy="8" r="5"></circle>
                    <path d="M20 21a8 8 0 1 0-16 0"></path>
                  </svg>
                  <h2 className="text-lg font-semibold">เจ้าของโปรเจกต์</h2>
                </div>
                <div>
                  {ownerProfile ? (
                    <>
                    <Link 
                      href={`/user/customer/${project.owner}`}
                      className="flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary-blue-200 flex items-center justify-center text-primary-blue-600 font-medium overflow-hidden outline-3 outline-double outline-primary-blue-500">
                        {ownerProfile.profileImageUrl ? (
                          <img 
                            src={ownerProfile.profileImageUrl} 
                            alt={ownerProfile.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          ownerProfile.name?.charAt(0) || '?'
                        )}
                      </div>
                      <div>
                          <p className="font-medium hover:text-primary-blue-500">{ownerProfile.name}</p>
                          <p className="text-sm text-primary-blue-500 hover:underline">ดูโปรไฟล์</p>
                      </div>
                    </Link>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-primary-blue-200 flex items-center justify-center text-primary-blue-600 font-medium overflow-hidden outline-3 outline-double outline-primary-blue-500">
                        {project.ownerName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{project.ownerName}</p>
                        <Link 
                          href={`/user/customer/${project.owner}`}
                          className="text-sm text-primary-blue-500 hover:underline"
                        >
                          ดูโปรไฟล์
                        </Link>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Message button - show only if not owner and user is logged in */}
                {session?.user?.id && session?.user?.id !== project.owner && (
                  <div className="mt-3">
                    <SendMessageButton 
                      recipientId={project.owner} 
                      recipientName={ownerProfile?.name || project.ownerName} 
                    />
                  </div>
                )}
              </div>

              {/* Assigned freelancer information (if any) */}
              {project.assignedTo && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-medium mb-3 text-gray-800">ฟรีแลนซ์ที่รับงาน</h2>
                  <div>
                    {freelancerProfile ? (
                      <>
                        <Link 
                            href={`/user/freelance/${project.assignedTo}`}
                            className="flex items-center gap-3"
                        >
                        <div className="w-12 h-12 rounded-full bg-primary-blue-200 flex items-center justify-center text-primary-blue-600 font-medium overflow-hidden outline-3 outline-double outline-primary-blue-500">
                          {freelancerProfile.profileImageUrl ? (
                            <img 
                              src={freelancerProfile.profileImageUrl} 
                              alt={freelancerProfile.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            freelancerProfile.name?.charAt(0) || 'F'
                          )}
                        </div>
                        <div>
                        <p className="font-medium hover:text-primary-blue-500">{freelancerProfile.name}</p>
                          <p
                            className="text-sm text-primary-blue-500 hover:underline"
                          >
                            ดูโปรไฟล์
                          </p>
                        </div>
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-primary-blue-200 flex items-center justify-center text-primary-blue-600 font-medium overflow-hidden outline-3 outline-double outline-primary-blue-500">
                          {project.assignedFreelancerName?.charAt(0) || 'F'}
                        </div>
                        <div>
                          <p className="font-medium hover:text-primary-blue-500">{project.assignedFreelancerName || 'ฟรีแลนซ์'}</p>
                          <Link 
                            href={`/user/freelance/${project.assignedTo}`}
                            className="text-sm text-primary-blue-500 hover:underline"
                          >
                            ดูโปรไฟล์
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Message button - show if user is owner and wants to message the freelancer */}
                  {session?.user?.id === project.owner && (
                    <div className="mt-3">
                      <SendMessageButton 
                        recipientId={project.assignedTo} 
                        recipientName={freelancerProfile?.name || project.assignedFreelancerName || 'ฟรีแลนซ์'} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Right column - Project details and assigned freelancer */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project description */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium mb-3 text-gray-800">รายละเอียดงาน</h2>
                <div className="whitespace-pre-line text-gray-700">
                  {project.description}
                </div>
              </div>
              
              {/* Project timeline */}
              {(project.status !== 'open' && project.status !== 'cancelled') && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-medium mb-3 text-gray-800">สถานะโปรเจกต์</h2>
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    {/* Status timeline */}
                    <div className="relative z-10 flex items-center mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary-blue-500 text-white flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium">มีผู้รับงานแล้ว</h3>
                        <p className="text-sm text-gray-500">ฟรีแลนซ์ได้รับงานนี้แล้ว</p>
                      </div>
                    </div>
                    
                    {(project.status === 'in_progress' || project.status === 'revision' || project.status === 'awaiting' || project.status === 'completed') && (
                      <div className="relative z-10 flex items-center mb-6">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 text-white flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">กำลังดำเนินการ</h3>
                          <p className="text-sm text-gray-500">ฟรีแลนซ์กำลังทำงาน</p>
                        </div>
                      </div>
                    )}
                    
                    {(project.status === 'revision') && (
                      <div className="relative z-10 flex items-center mb-6">
                        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">กำลังแก้ไข</h3>
                          <p className="text-sm text-gray-500">ฟรีแลนซ์กำลังแก้ไขงาน</p>
                        </div>
                      </div>
                    )}
                    
                    {(project.status === 'awaiting') && (
                      <div className="relative z-10 flex items-center mb-6">
                        <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">รอการยืนยัน</h3>
                          <p className="text-sm text-gray-500">งานเสร็จแล้ว รอเจ้าของโปรเจกต์ตรวจสอบ</p>
                        </div>
                      </div>
                    )}
                    
                    {(project.status === 'completed') && (
                      <div className="relative z-10 flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">งานเสร็จสิ้น</h3>
                          <p className="text-sm text-gray-500">
                            งานเสร็จสมบูรณ์แล้ว
                            {project.completedAt && ` เมื่อ ${formatDate(project.completedAt)}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Additional information for potential freelancers */}
              {project.status === 'open' && session?.user?.role === 'student' && !hasApplied && !project.requestToFreelancer && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex gap-3">
                    <div className="text-yellow-600 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-yellow-800 mb-1">ข้อควรรู้ก่อนสมัคร</h3>
                      <p className="text-yellow-700 text-sm">
                        โปรเจกต์นี้เปิดรับฟรีแลนซ์ที่มีทักษะตรงตามที่ระบุไว้ ก่อนสมัครควรตรวจสอบว่าคุณมีทักษะที่เหมาะสมและสามารถส่งงานได้ตามกำหนดเวลา
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Information for freelancers who already applied */}
              {project.status === 'open' && hasApplied && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex gap-3">
                    <div className="text-green-600 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800 mb-1">คุณได้ส่งคำขอร่วมงานแล้ว</h3>
                      <p className="text-green-700 text-sm">
                        เจ้าของโปรเจกต์จะพิจารณาคำขอร่วมงานของคุณและติดต่อกลับหากได้รับการคัดเลือก คุณสามารถติดตามสถานะได้ที่หน้าจัดการโปรเจกต์
                      </p>
                      <div className="mt-2">
                        <Link
                          href="/manage-projects"
                          className="text-sm font-medium text-primary-blue-500 hover:text-primary-blue-600 hover:underline"
                        >
                          ไปหน้าจัดการโปรเจกต์ →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Information for freelancers who received direct requests */}
              {project.status === 'open' && project.requestToFreelancer === session?.user?.id && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-800 mb-1">คุณได้รับคำขอร่วมงานโดยตรง</h3>
                      <p className="text-blue-700 text-sm">
                        เจ้าของโปรเจกต์ได้ส่งคำขอให้คุณร่วมงานในโปรเจกต์นี้ คุณสามารถตอบรับหรือปฏิเสธคำขอได้ โปรดพิจารณารายละเอียดโปรเจกต์ก่อนตัดสินใจ
                      </p>
                      <div className="mt-3">
                        <ProjectManageButtons 
                          project={project}
                          isFreelancer={true}
                          userId={session?.user?.id}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Project owner controls for awaiting projects */}
              {project.status === 'awaiting' && project.owner === session?.user?.id && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex gap-3">
                    <div className="text-purple-600 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-800 mb-1">โปรเจกต์รอการยืนยันจากคุณ</h3>
                      <p className="text-purple-700 text-sm">
                        ฟรีแลนซ์ได้ส่งงานเรียบร้อยแล้ว กรุณาตรวจสอบผลงานและยืนยันการสิ้นสุดโปรเจกต์ หรือขอให้มีการแก้ไขเพิ่มเติมหากจำเป็น
                      </p>
                      <div className="mt-3">
                        <ProjectManageButtons 
                          project={project}
                          isFreelancer={false}
                          userId={session?.user?.id}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Project completed notification */}
              {project.status === 'completed' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex gap-3">
                    <div className="text-green-600 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800 mb-1">โปรเจกต์เสร็จสิ้นแล้ว</h3>
                      <p className="text-green-700 text-sm">
                        โปรเจกต์นี้ได้เสร็จสิ้นเรียบร้อยแล้ว
                        {project.completedAt && ` เมื่อ ${formatDate(project.completedAt)}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}