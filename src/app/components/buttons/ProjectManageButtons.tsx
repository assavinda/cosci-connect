'use client';
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  owner: string;
  ownerName: string;
  status: string;
  progress: number;
  assignedTo?: string;
  assignedFreelancerName?: string;
  requestToFreelancer?: string;
  freelancersRequested: string[];
}

interface ProjectManageButtonsProps {
  project: Project;
  isFreelancer: boolean;
  userId?: string;
}

function ProjectManageButtons({ project, isFreelancer, userId }: ProjectManageButtonsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // ==== Freelancer Actions ====
  
  // Freelancer accepts a project invitation
  const handleAcceptProject = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      // For freelancer accepting a direct request from project owner
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'assigned',
        assignedTo: userId
      });
      
      if (response.data.success) {
        toast.success('คุณได้รับโปรเจกต์นี้แล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error accepting project:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Freelancer rejects a project invitation
  const handleRejectProject = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      // For freelancer rejecting a direct request from project owner
      const response = await axios.patch(`/api/projects/${project.id}`, {
        requestToFreelancer: null
      });
      
      if (response.data.success) {
        toast.success('ปฏิเสธคำขอเรียบร้อยแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error rejecting project:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Freelancer cancels their application to a project
  const handleCancelApplication = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      // We need to remove the freelancer's ID from the freelancersRequested array
      const response = await axios.patch(`/api/projects/${project.id}`, {
        action: 'removeFreelancerRequest',
        freelancerId: userId
      });
      
      if (response.data.success) {
        toast.success('ยกเลิกคำขอร่วมงานเรียบร้อยแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error canceling application:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Freelancer marks project as complete (submit for review)
  const handleSubmitProject = async () => {
    if (!userId) return;
    
    // Check if progress is 100%
    if (project.progress < 100) {
      toast.error('ความคืบหน้าต้องถึง 100% ก่อนส่งงาน');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'awaiting'
      });
      
      if (response.data.success) {
        toast.success('ส่งงานเพื่อรอการตรวจสอบเรียบร้อยแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error submitting project:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Freelancer submits a revision
  const handleSubmitRevision = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'awaiting'
      });
      
      if (response.data.success) {
        toast.success('ส่งงานแก้ไขเรียบร้อยแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error submitting revision:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // ==== Project Owner Actions ====
  
  // Owner cancels a request to a freelancer
  const handleCancelFreelancerRequest = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        requestToFreelancer: null
      });
      
      if (response.data.success) {
        toast.success('ยกเลิกคำขอเรียบร้อยแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error canceling freelancer request:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Owner accepts a freelancer's application
  const handleAcceptFreelancer = async (freelancerId: string) => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'assigned',
        assignedTo: freelancerId
      });
      
      if (response.data.success) {
        toast.success('ยอมรับฟรีแลนซ์เรียบร้อยแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error accepting freelancer:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Owner rejects a freelancer's application
  const handleRejectFreelancer = async (freelancerId: string) => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        action: 'removeFreelancerRequest',
        freelancerId: freelancerId
      });
      
      if (response.data.success) {
        toast.success('ปฏิเสธฟรีแลนซ์เรียบร้อยแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error rejecting freelancer:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Owner approves completed project
  const handleApproveProject = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      if (response.data.success) {
        toast.success('ยืนยันงานเสร็จสิ้นเรียบร้อยแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error approving project:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Owner requests revisions
  const handleRequestRevision = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'revision'
      });
      
      if (response.data.success) {
        toast.success('ส่งคำขอแก้ไขเรียบร้อยแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error requesting revision:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to determine which buttons to show based on project status and user role
  const renderButtons = () => {
    // If project is completed, don't show any action buttons
    if (project.status === 'completed') {
      return null;
    }
    
    // For Freelancer
    if (isFreelancer) {
      // Case 1: Freelancer has been requested by the project owner
      if (project.requestToFreelancer === userId && project.status === 'open') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-primary" 
              onClick={handleAcceptProject}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ยอมรับ'}
            </button>
            <button 
              className="btn-danger" 
              onClick={handleRejectProject}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ปฏิเสธ'}
            </button>
          </div>
        );
      }
      
      // Case 2: Freelancer has applied to the project
      if (project.freelancersRequested.includes(userId) && project.status === 'open') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-secondary" 
              onClick={handleCancelApplication}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ยกเลิกคำขอ'}
            </button>
          </div>
        );
      }
      
      // Case 3: Freelancer is working on the project
      if (project.assignedTo === userId && (project.status === 'in_progress' || project.status === 'revision')) {
        return (
          <div className="flex gap-3">
            <button 
              className={`btn-primary ${project.progress < 100 ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={project.status === 'revision' ? handleSubmitRevision : handleSubmitProject}
              disabled={project.progress < 100 || isLoading}
            >
              {isLoading ? 'กำลังส่ง...' : project.status === 'revision' ? 'แก้ไขเสร็จสิ้น' : 'เสร็จสิ้น'}
            </button>
          </div>
        );
      }
    } 
    // For Project Owner
    else {
      // Case 1: Owner is waiting for freelancer response
      if (project.requestToFreelancer && project.status === 'open') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-secondary" 
              onClick={handleCancelFreelancerRequest}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ยกเลิกคำขอ'}
            </button>
          </div>
        );
      }
      
      // Case 2: Owner has received freelancer applications
      if (project.freelancersRequested.length > 0 && project.status === 'open') {
        // In a real app, this would open a modal to select a freelancer
        // For simplicity, we'll just use the first freelancer in the list
        const firstFreelancer = project.freelancersRequested[0];
        return (
          <div className="flex gap-3">
            <button 
              className="btn-primary" 
              onClick={() => handleAcceptFreelancer(firstFreelancer)}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ยอมรับ'}
            </button>
            <button 
              className="btn-danger" 
              onClick={() => handleRejectFreelancer(firstFreelancer)}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ปฏิเสธ'}
            </button>
          </div>
        );
      }
      
      // Case 3: Project is in progress, owner can message freelancer
      if (project.status === 'in_progress' || project.status === 'revision') {
        // ปุ่มส่งข้อความถูกเอาออกตามที่ร้องขอ
        return null;
      }
      
      // Case 4: Project is awaiting approval
      if (project.status === 'awaiting') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-primary" 
              onClick={handleApproveProject}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ยืนยันงานเสร็จ'}
            </button>
            <button 
              className="btn-danger" 
              onClick={handleRequestRevision}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ต้องแก้ไข'}
            </button>
          </div>
        );
      }
    }
    
    // Default: no buttons
    return null;
  };

  return (
    <>
      {renderButtons()}
    </>
  );
}

export default ProjectManageButtons;