'use client';

import React, { useState, useEffect } from "react";
import ProjectManageList from "../../components/lists/ProjectManageList";
import { useSession } from "next-auth/react";
import axios from "axios";
import Loading from "../../components/common/Loading";
import { Toaster } from 'react-hot-toast';
import { usePusher } from "../../../providers/PusherProvider";
import Link from "next/link";

// Define project interface
interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requiredSkills: string[];
  owner: string;
  ownerName: string;
  status: string;
  progress: number;
  createdAt: string;
  assignedTo?: string;
  assignedFreelancerName?: string;
  requestToFreelancer?: string;
  requestToFreelancerName?: string;
  freelancersRequested: string[];
  // เพิ่มฟิลด์ใหม่สำหรับแสดงผลแยกการ์ด
  requestingFreelancerId?: string;
  requestingFreelancerName?: string;
}

// Define the interface for grouped projects
interface ProjectGroups {
  waitingResponse: Project[];
  requests: Project[];
  in_progress: Project[];
  revision: Project[];
  awaiting: Project[];
  completed: Project[];
}

export default function ManageProjectsPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<ProjectGroups>({
    waitingResponse: [],
    requests: [],
    in_progress: [],
    revision: [],
    awaiting: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // เพิ่ม usePusher hook เพื่อใช้งาน Pusher
  const { subscribeToUserEvents, subscribeToProjectList } = usePusher();

  // Fetch projects when session is loaded
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError("กรุณาเข้าสู่ระบบเพื่อจัดการโปรเจกต์");
    }
  }, [status]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // ลงทะเบียนรับการแจ้งเตือนเมื่อมีการอัปเดตโปรเจกต์ที่เกี่ยวข้องกับผู้ใช้
      const unsubscribeUserEvents = subscribeToUserEvents(session.user.id, (data) => {
        console.log('ได้รับการแจ้งเตือนสถานะโปรเจกต์:', data);
        
        // รีโหลดข้อมูลโปรเจกต์
        fetchProjects();
      });
      
      // ลงทะเบียนรับการอัปเดตรายการโปรเจกต์ทั้งหมด
      const unsubscribeProjectList = subscribeToProjectList((data) => {
        console.log('ได้รับการอัปเดตรายการโปรเจกต์:', data);
        
        // รีโหลดข้อมูลโปรเจกต์
        fetchProjects();
      });
      
      // ยกเลิกการลงทะเบียนเมื่อ component unmount
      return () => {
        unsubscribeUserEvents();
        unsubscribeProjectList();
      };
    }
  }, [status, session?.user?.id, subscribeToUserEvents, subscribeToProjectList]);

  // ฟังก์ชันสำหรับดึงข้อมูลโปรเจกต์และสร้างการ์ดแยกสำหรับฟรีแลนซ์แต่ละคนที่ส่งคำขอ
  const fetchProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const isFreelancer = session?.user?.role === 'student';
      const userId = session?.user?.id;

      // Fetch all projects related to the user
      let response;
      
      if (isFreelancer) {
        // For freelancers, get projects where:
        // 1. They are assigned to the project
        // 2. They have been requested by project owners
        // 3. They have requested to join
        response = await axios.get('/api/projects', {
          params: {
            limit: 100, // Get more projects at once
            status: 'all', // ดึงทุกสถานะ
            assignedTo: userId, // Projects assigned to this freelancer
            requestToFreelancer: userId, // Projects that requested this freelancer
            freelancerRequested: userId, // Projects where freelancer requested to join
            userRelatedOnly: 'true' // เพิ่มพารามิเตอร์พิเศษเพื่อใช้การค้นหาแบบ OR
          }
        });
      } else {
        // For teachers/alumni, get projects they own
        response = await axios.get('/api/projects', {
          params: {
            limit: 100,
            status: 'all', // ดึงทุกสถานะ
            owner: userId
          }
        });
      }

      // ดึงข้อมูลฟรีแลนซ์เพิ่มเติมสำหรับโปรเจกต์ที่มีคำขอจากฟรีแลนซ์
      if (!isFreelancer) {
        // ดึงรายชื่อฟรีแลนซ์ที่เกี่ยวข้องกับโปรเจกต์
        const userIds = new Set();
        
        response.data.projects.forEach(project => {
          // เก็บ ID ฟรีแลนซ์ที่เกี่ยวข้องทั้งหมด
          if (project.requestToFreelancer) {
            userIds.add(project.requestToFreelancer);
          }
          if (project.freelancersRequested) {
            project.freelancersRequested.forEach(id => userIds.add(id));
          }
          if (project.assignedTo) {
            userIds.add(project.assignedTo);
          }
        });
        
        // ถ้ามีฟรีแลนซ์ที่ส่งคำขอ ให้ดึงข้อมูลเพิ่มเติม
        if (userIds.size > 0) {
          try {
            const userList = Array.from(userIds);
            console.log('จำนวนฟรีแลนซ์ที่ต้องดึงข้อมูล:', userList.length);
            
            // สร้าง Map เก็บข้อมูลฟรีแลนซ์
            const freelancerMap = {};
            
            // ดึงข้อมูลฟรีแลนซ์แต่ละคน
            for (const freelancerId of userList as string[]) {
              try {
                const freelancerResponse = await axios.get(`/api/freelancers/${freelancerId}`);
                freelancerMap[freelancerId] = {
                  name: freelancerResponse.data.name,
                  profileImageUrl: freelancerResponse.data.profileImageUrl
                };
              } catch (err) {
                console.log(`ไม่สามารถดึงข้อมูลฟรีแลนซ์ ID ${freelancerId}:`, err);
                freelancerMap[freelancerId] = {
                  name: `ฟรีแลนซ์ ${freelancerId.substring(0, 5)}...`,
                  profileImageUrl: null
                };
              }
            }
            
            // อัปเดตโปรเจกต์ด้วยข้อมูลฟรีแลนซ์
            const projectsWithFreelancers = [];
            
            response.data.projects.forEach(project => {
              // อัปเดตชื่อของฟรีแลนซ์ที่ได้รับการขอ
              if (project.requestToFreelancer) {
                const freelancer = freelancerMap[project.requestToFreelancer];
                if (freelancer) {
                  project.requestToFreelancerName = freelancer.name;
                }
              }
              
              // อัปเดตชื่อของฟรีแลนซ์ที่ได้รับมอบหมาย
              if (project.assignedTo) {
                const freelancer = freelancerMap[project.assignedTo];
                if (freelancer) {
                  project.assignedFreelancerName = freelancer.name;
                }
              }
              
              if (project.status === 'open' && project.freelancersRequested && project.freelancersRequested.length > 0) {
                // สร้างการ์ดแยกสำหรับฟรีแลนซ์แต่ละคน
                project.freelancersRequested.forEach(freelancerId => {
                  const freelancerInfo = freelancerMap[freelancerId] || { 
                    name: `ฟรีแลนซ์ ID: ${freelancerId.substring(0, 5)}...` 
                  };
                  
                  // สร้างออบเจกต์โปรเจกต์ใหม่สำหรับแสดงการ์ดเฉพาะฟรีแลนซ์คนนี้
                  const projectCopy = { ...project };
                  projectCopy.requestingFreelancerId = freelancerId;
                  projectCopy.requestingFreelancerName = freelancerInfo.name;
                  
                  projectsWithFreelancers.push(projectCopy);
                });
              } else {
                // ถ้าไม่มีฟรีแลนซ์ส่งคำขอ หรือไม่ใช่โปรเจกต์เปิด ให้เพิ่มเข้าไปเลย
                projectsWithFreelancers.push(project);
              }
            });
            
            // แทนที่ projects ด้วยข้อมูลใหม่ที่มีการแยกการ์ดสำหรับแต่ละฟรีแลนซ์
            response.data.projects = projectsWithFreelancers;
          } catch (error) {
            console.error("ไม่สามารถดึงข้อมูลฟรีแลนซ์ได้:", error);
            // ถึงแม้จะเกิดข้อผิดพลาด เรายังคงใช้ข้อมูลโปรเจกต์ที่มีอยู่ต่อไปได้
          }
        }
      }

      // Group projects based on their status and role
      groupProjects(response.data.projects, isFreelancer);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจกต์");
    } finally {
      setLoading(false);
    }
  };

  // Function to group projects by status and role
  const groupProjects = (projectList: Project[], isFreelancer: boolean) => {
    const userId = session?.user?.id;
    const grouped: ProjectGroups = {
      waitingResponse: [],
      requests: [],
      in_progress: [],
      revision: [],
      awaiting: [],
      completed: []
    };

    projectList.forEach(project => {
      // สำหรับฟรีแลนซ์ (นิสิต)
      if (isFreelancer) {
        // Waiting Response: Projects where the freelancer has applied
        if (project.freelancersRequested.includes(userId) && project.status === 'open') {
          grouped.waitingResponse.push(project);
        }
        // Requests: Projects where the owner has requested this freelancer
        else if (project.requestToFreelancer === userId && project.status === 'open') {
          grouped.requests.push(project);
        }
        // In Progress: Projects assigned to this freelancer with 'in_progress' status
        else if (project.assignedTo === userId && project.status === 'in_progress') {
          grouped.in_progress.push(project);
        }
        // Revision: Projects assigned to this freelancer with 'revision' status
        else if (project.assignedTo === userId && project.status === 'revision') {
          grouped.revision.push(project);
        }
        // Awaiting: Projects assigned to this freelancer with 'awaiting' status
        else if (project.assignedTo === userId && project.status === 'awaiting') {
          grouped.awaiting.push(project);
        }
        // Completed: Projects assigned to this freelancer with 'completed' status
        else if (project.assignedTo === userId && project.status === 'completed') {
          grouped.completed.push(project);
        }
      } 
      // สำหรับอาจารย์หรือศิษย์เก่า (เจ้าของโปรเจกต์)
      else {
        // Waiting Response: Projects where the owner has sent a request to a freelancer
        if (project.requestToFreelancer && project.status === 'open') {
          grouped.waitingResponse.push(project);
        }
        // Requests: Projects that have received requests from freelancers
        else if (project.requestingFreelancerId && project.status === 'open') {
          grouped.requests.push(project);
        }
        // In Progress: Owner's projects with 'in_progress' status
        else if (project.status === 'in_progress') {
          grouped.in_progress.push(project);
        }
        // Revision: Owner's projects with 'revision' status
        else if (project.status === 'revision') {
          grouped.revision.push(project);
        }
        // Awaiting: Owner's projects with 'awaiting' status
        else if (project.status === 'awaiting') {
          grouped.awaiting.push(project);
        }
        // Completed: Owner's projects with 'completed' status
        else if (project.status === 'completed') {
          grouped.completed.push(project);
        }
      }
    });

    setProjects(grouped);
  };

  // Function to update project progress
  const updateProgress = async (projectId: string, newProgress: number) => {
    try {
      // Ensure progress is within valid range
      if (newProgress < 0) newProgress = 0;
      if (newProgress > 100) newProgress = 100;

      // Update progress via API
      await axios.patch(`/api/projects/${projectId}`, {
        progress: newProgress
      });

      // ไม่จำเป็นต้อง fetchProjects() ที่นี่ เพราะเราจะได้รับการอัปเดตผ่าน Pusher

    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 h-screen">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลโปรเจกต์...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
        {status === 'unauthenticated' && (
          <button 
            onClick={() => window.location.href = '/auth?state=login'}
            className="mt-4 px-4 py-2 bg-primary-blue-500 text-white rounded-lg hover:bg-primary-blue-600"
          >
            เข้าสู่ระบบ
          </button>
        )}
      </div>
    );
  }

  const isFreelancer = session?.user?.role === 'student';
  
  return (
    <div className="flex flex-col gap-6">
      {/* Toaster component for showing notifications */}
      <Toaster position="bottom-left" />
      
      {/* Header */}
      <section className="mt-6 p-6 flex flex-col gap-2 bg-primary-blue-500 rounded-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-medium text-xl text-white">
              จัดการโปรเจกต์
            </h1>
            <p className="text-white">
              จัดการทุกขั้นตอนในทุกโปรเจกต์ของคุณตั้งแต่รับงานจนถึงเสร็จงาน
            </p>
          </div>
          
          {/* เพิ่มปุ่มดูโปรเจกต์ทั้งหมด */}
          <Link href="/manage-projects/all-projects" className="btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            ดูโปรเจกต์ทั้งหมด
          </Link>
        </div>
      </section>
      
      {/* Row 1: Waiting Response and Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProjectManageList 
          title={isFreelancer ? "คำขอของฉัน" : "รอการตอบรับ"} 
          status="waitingResponse" 
          projects={projects.waitingResponse}
          emptyMessage={isFreelancer ? "คุณยังไม่ได้ส่งคำขอร่วมงานโปรเจกต์ใด" : "ไม่มีคำขอที่รอการตอบรับจากฟรีแลนซ์"} 
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
        <ProjectManageList 
          title={isFreelancer ? "คำขอร่วมงาน" : "คำขอฟรีแลนซ์"} 
          status="requests" 
          projects={projects.requests}
          emptyMessage={isFreelancer ? "ไม่มีคำขอร่วมงานจากเจ้าของโปรเจกต์" : "ไม่มีฟรีแลนซ์ส่งคำขอร่วมงานกับคุณ"} 
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
      </div>
      
      {/* Row 2: In Progress, Revision, Awaiting */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectManageList 
          title="กำลังดำเนินการ" 
          status="in_progress" 
          projects={projects.in_progress}
          emptyMessage="ไม่มีโปรเจกต์ที่กำลังดำเนินการ" 
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
        <ProjectManageList 
          title="กำลังแก้ไข" 
          status="revision" 
          projects={projects.revision}
          emptyMessage="ไม่มีโปรเจกต์ที่กำลังแก้ไข" 
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
        <ProjectManageList 
          title="รอการยืนยัน" 
          status="awaiting" 
          projects={projects.awaiting}
          emptyMessage="ไม่มีโปรเจกต์ที่รอการยืนยัน" 
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
      </div>
      
      {/* Row 3: Completed (เต็มความกว้าง) */}
      <div className="w-full">
        <ProjectManageList 
          title="เสร็จสิ้น" 
          status="completed" 
          projects={projects.completed}
          emptyMessage="ไม่มีโปรเจกต์ที่เสร็จสิ้น" 
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
      </div>
    </div>
  );
}