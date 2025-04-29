'use client';

import React, { useState, useEffect } from "react";
import ProjectManageList from "../../components/lists/ProjectManageList";
import { useSession } from "next-auth/react";
import axios from "axios";
import Loading from "../../components/common/Loading";

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
  freelancersRequested: string[];
}

// Define the interface for grouped projects
interface ProjectGroups {
  waitingResponse: Project[];
  requests: Project[];
  active: Project[];
  revision: Project[];
  awaiting: Project[];
  completed: Project[];
}

export default function ManageProjectsPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<ProjectGroups>({
    waitingResponse: [],
    requests: [],
    active: [],
    revision: [],
    awaiting: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch projects when session is loaded
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError("กรุณาเข้าสู่ระบบเพื่อจัดการโปรเจกต์");
    }
  }, [status]);

  // Function to fetch projects from API
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
            assignedTo: userId, // Projects assigned to this freelancer
            requestToFreelancer: userId, // Projects that requested this freelancer
            freelancerRequested: userId // Projects where freelancer requested to join
          }
        });
      } else {
        // For teachers/alumni, get projects they own
        response = await axios.get('/api/projects', {
          params: {
            limit: 100,
            owner: userId
          }
        });
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
      active: [],
      revision: [],
      awaiting: [],
      completed: []
    };

    projectList.forEach(project => {
      // For freelancers
      if (isFreelancer) {
        // Waiting Response: Projects where the freelancer has applied
        if (project.freelancersRequested.includes(userId) && project.status === 'open') {
          grouped.waitingResponse.push(project);
        }
        // Requests: Projects where the owner has requested this freelancer
        else if (project.requestToFreelancer === userId && project.status === 'open') {
          grouped.requests.push(project);
        }
        // Active: Projects assigned to this freelancer with 'in_progress' status
        else if (project.assignedTo === userId && project.status === 'in_progress') {
          grouped.active.push(project);
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
      // For teachers/alumni (project owners)
      else {
        // Waiting Response: Projects where the owner has sent a request to a freelancer
        if (project.requestToFreelancer && project.status === 'open') {
          grouped.waitingResponse.push(project);
        }
        // Requests: Projects that have received requests from freelancers
        else if (project.freelancersRequested.length > 0 && project.status === 'open') {
          grouped.requests.push(project);
        }
        // Active: Owner's projects with 'in_progress' status
        else if (project.status === 'in_progress') {
          grouped.active.push(project);
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

      // Refetch projects to update UI
      fetchProjects();

    } catch (error) {
      console.error("Error updating progress:", error);
      // You could add a toast notification here
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
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
  const totalProjects = Object.values(projects).reduce((acc, arr) => acc + arr.length, 0);
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="mt-6 p-6 flex flex-col gap-2 bg-primary-blue-500 rounded-xl">
        <h1 className="font-medium text-xl text-white">
          จัดการโปรเจกต์
        </h1>
        <p className="text-white">
          จัดการทุกขั้นตอนในทุกโปรเจกต์ของคุณตั้งแต่รับงานจนถึงเสร็จงาน
        </p>
        <div className="flex justify-between items-center mt-2">
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
              <p className="text-white text-sm">โปรเจกต์ทั้งหมด: <span className="font-medium">
                {totalProjects}
              </span></p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
              <p className="text-white text-sm">กำลังดำเนินการ: <span className="font-medium">
                {projects.active.length}
              </span></p>
            </div>
          </div>
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
      
      {/* Row 2: Active, Revision, Awaiting */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectManageList 
          title="กำลังดำเนินการ" 
          status="active" 
          projects={projects.active}
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