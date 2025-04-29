'use client';
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";

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
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState("");
  
  // ==== Freelancer Actions ====
  
  // Accept/Reject project request from owner
  const handleFreelancerResponse = async (accept: boolean) => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      if (accept) {
        // Accept the project - this updates the status to assigned and assigns the freelancer
        await axios.patch(`/api/projects/${project.id}`, {
          status: 'assigned',
          assignFreelancer: true,
          freelancerId: userId
        });
        toast.success('คุณได้รับโปรเจกต์นี้แล้ว');
      } else {
        // Reject the project - this removes the freelancer from requestToFreelancer
        await axios.patch(`/api/projects/${project.id}`, {
          cancelRequest: true
        });
        toast.success('ปฏิเสธคำขอเรียบร้อยแล้ว');
      }
      
      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error('Error responding to project request:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel freelancer's application to a project
  const handleCancelApplication = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      await axios.patch(`/api/projects/${project.id}`, {
        cancelApplication: true,
        freelancerId: userId
      });
      toast.success('ยกเลิกคำขอร่วมงานเรียบร้อยแล้ว');
      router.refresh();
    } catch (error) {
      console.error('Error canceling application:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mark project as complete (submit for owner review)
  const handleSubmitProject = async () => {
    if (!userId) return;
    
    // Check if progress is 100%
    if (project.progress < 100) {
      toast.error('ความคืบหน้าต้องถึง 100% ก่อนส่งงาน');
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.patch(`/api/projects/${project.id}`, {
        status: 'awaiting'
      });
      toast.success('ส่งงานเพื่อรอการตรวจสอบเรียบร้อยแล้ว');
      router.refresh();
    } catch (error) {
      console.error('Error submitting project:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit revision
  const handleSubmitRevision = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      await axios.patch(`/api/projects/${project.id}`, {
        status: 'awaiting'
      });
      toast.success('ส่งงานแก้ไขเรียบร้อยแล้ว');
      router.refresh();
    } catch (error) {
      console.error('Error submitting revision:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send message to project owner/freelancer
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('กรุณาระบุข้อความ');
      return;
    }
    
    setIsLoading(true);
    try {
      // In a real app, this would send a message to the other party
      // Here we just simulate it with a success message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('ส่งข้อความเรียบร้อยแล้ว');
      setShowMessageModal(false);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ==== Project Owner Actions ====
  
  // Accept/Reject a freelancer's application
  const handleOwnerResponse = async (accept: boolean, freelancerId?: string) => {
    if (!userId || !freelancerId) return;
    setIsLoading(true);
    
    try {
      if (accept) {
        // Accept the freelancer - updates the project status and assigns the freelancer
        await axios.patch(`/api/projects/${project.id}`, {
          status: 'assigned',
          assignFreelancer: true,
          freelancerId: freelancerId
        });
        toast.success('ยอมรับฟรีแลนซ์เรียบร้อยแล้ว');
      } else {
        // Reject the freelancer - removes them from freelancersRequested
        await axios.patch(`/api/projects/${project.id}`, {
          rejectFreelancer: true,
          freelancerId: freelancerId
        });
        toast.success('ปฏิเสธฟรีแลนซ์เรียบร้อยแล้ว');
      }
      
      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error('Error responding to freelancer request:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel a request to a freelancer
  const handleCancelFreelancerRequest = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      await axios.patch(`/api/projects/${project.id}`, {
        cancelFreelancerRequest: true
      });
      toast.success('ยกเลิกคำขอเรียบร้อยแล้ว');
      router.refresh();
    } catch (error) {
      console.error('Error canceling freelancer request:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Review completed project (approve or request revisions)
  const handleReviewProject = async (approve: boolean) => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      if (approve) {
        // Approve the project - mark it as completed
        await axios.patch(`/api/projects/${project.id}`, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        toast.success('ยืนยันงานเสร็จสิ้นเรียบร้อยแล้ว');
      } else {
        // Request revisions
        await axios.patch(`/api/projects/${project.id}`, {
          status: 'revision'
        });
        toast.success('ส่งคำขอแก้ไขเรียบร้อยแล้ว');
      }
      
      router.refresh();
    } catch (error) {
      console.error('Error reviewing project:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
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
              onClick={() => handleFreelancerResponse(true)}
              disabled={isLoading}
            >
              ยอมรับ
            </button>
            <button 
              className="btn-danger" 
              onClick={() => handleFreelancerResponse(false)}
              disabled={isLoading}
            >
              ปฏิเสธ
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
              ยกเลิกคำขอ
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
              {project.status === 'revision' ? 'แก้ไขเสร็จสิ้น' : 'เสร็จสิ้น'}
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setShowMessageModal(true)}
              disabled={isLoading}
            >
              ส่งข้อความ
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
              ยกเลิกคำขอ
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
              onClick={() => handleOwnerResponse(true, firstFreelancer)}
              disabled={isLoading}
            >
              ยอมรับ
            </button>
            <button 
              className="btn-danger" 
              onClick={() => handleOwnerResponse(false, firstFreelancer)}
              disabled={isLoading}
            >
              ปฏิเสธ
            </button>
          </div>
        );
      }
      
      // Case 3: Project is in progress, owner can message freelancer
      if (project.status === 'in_progress' || project.status === 'revision') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-secondary" 
              onClick={() => setShowMessageModal(true)}
              disabled={isLoading}
            >
              ส่งข้อความ
            </button>
          </div>
        );
      }
      
      // Case 4: Project is awaiting approval
      if (project.status === 'awaiting') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-primary" 
              onClick={() => handleReviewProject(true)}
              disabled={isLoading}
            >
              ยืนยันงานเสร็จ
            </button>
            <button 
              className="btn-danger" 
              onClick={() => handleReviewProject(false)}
              disabled={isLoading}
            >
              ต้องแก้ไข
            </button>
          </div>
        );
      }
    }
    
    // Default: no buttons
    return null;
  };

  // Message modal
  const renderMessageModal = () => {
    if (!showMessageModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-4 bg-primary-blue-500 text-white flex justify-between items-center rounded-t-xl">
            <h3 className="font-medium">ส่งข้อความ</h3>
            <button 
              onClick={() => setShowMessageModal(false)}
              className="text-white hover:text-white/80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="p-4">
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 resize-none min-h-32"
              placeholder="พิมพ์ข้อความของคุณที่นี่..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-2 p-4 bg-gray-50 rounded-b-xl">
            <button 
              className="btn-secondary" 
              onClick={() => setShowMessageModal(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? 'กำลังส่ง...' : 'ส่งข้อความ'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-right" />
      {renderButtons()}
      {renderMessageModal()}
    </>
  );
}

export default ProjectManageButtons;