'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Define a type for the session user that includes skills
interface ExtendedUser {
  id: string;
  role?: "student" | "alumni" | "teacher";
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  profileImageUrl?: string | null;
  isOpen?: boolean;
  basePrice?: number;
  galleryImages?: string[];
  skills?: string[];
}

interface ApplyButtonProps {
  projectId: string;
  projectTitle: string;
  projectOwner: string;
  projectOwnerName: string;
  projectStatus: string;
  requiredSkills: string[];
  budget: number;
}

function ApplyButton({
  projectId,
  projectTitle,
  projectOwner,
  projectOwnerName,
  projectStatus,
  requiredSkills,
  budget
}: ApplyButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Cast session user to the extended user type
  const user = session?.user as ExtendedUser | undefined;
  
  // ตรวจสอบว่าผู้ใช้เป็นนิสิต (ฟรีแลนซ์) หรือไม่
  const isFreelancer = user?.role === 'student';
  
  // ตรวจสอบว่ามีทักษะที่ต้องการหรือไม่
  const userSkills = user?.skills || [];
  const hasMatchingSkills = requiredSkills.some(skill => 
    userSkills.includes(skill)
  );
  
  // ตรวจสอบราคาขั้นต่ำ
  const userBasePrice = user?.basePrice || 0;
  const meetsMinimumPrice = budget >= userBasePrice;
  
  // ตรวจสอบสถานะเปิดรับสมัคร
  const isOpenForApplications = projectStatus === 'open';
  
  // ตรวจสอบว่าไม่ใช่เจ้าของโปรเจกต์เอง
  const isNotOwner = user?.id !== projectOwner;
  
  // ฟังก์ชันสำหรับตรวจสอบว่าได้สมัครโปรเจกต์นี้ไปแล้วหรือไม่
  useEffect(() => {
    // เรียกตรวจสอบสถานะเมื่อคอมโพเนนต์โหลดครั้งแรก
    if (status === 'authenticated' && isFreelancer && isNotOwner) {
      checkApplicationStatus();
    } else {
      setLoading(false);
    }
  // รวมทุก dependencies ที่ใช้ในเงื่อนไข และเพิ่ม session?.user?.id เพื่อให้มั่นใจว่าจะทำงานเมื่อข้อมูล session เปลี่ยน
  }, [status, isFreelancer, isNotOwner, session?.user?.id]);
  
  const checkApplicationStatus = async () => {
    setLoading(true);
    try {
      console.log('Checking application status for project:', projectId);
      
      // เรียก API เพื่อตรวจสอบสถานะการสมัคร
      const response = await axios.get(`/api/projects/${projectId}/applications/status`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Application status response:', response.data);
      
      // อัพเดทสถานะการสมัคร
      setHasApplied(response.data.hasApplied);
      setApplicationStatus(response.data.applicationStatus);
    } catch (error) {
      console.error('Error checking application status:', error);
      // กรณีเกิดข้อผิดพลาด ตั้งค่าเป็นยังไม่ได้สมัคร
      setHasApplied(false);
      setApplicationStatus(null);
    } finally {
      setLoading(false);
    }
  };
  
  // ฟังก์ชันเมื่อกดปุ่ม Apply
  const handleApplyClick = () => {
    // ตรวจสอบว่าได้สมัครไปแล้วหรือไม่ (ป้องกันการกดซ้ำ)
    if (hasApplied) {
      toast.error('คุณได้สมัครงานนี้ไปแล้ว');
      return;
    }
    
    // ตรวจสอบการล็อกอิน
    if (status === 'unauthenticated') {
      toast.error('กรุณาเข้าสู่ระบบก่อนสมัครงาน');
      router.push(`/auth?state=login&callbackUrl=/project/${projectId}`);
      return;
    }
    
    // ตรวจสอบว่าเป็นนิสิต (ฟรีแลนซ์) หรือไม่
    if (!isFreelancer) {
      toast.error('เฉพาะนิสิตเท่านั้นที่สามารถสมัครงานได้');
      return;
    }
    
    // ตรวจสอบว่าไม่ใช่เจ้าของโปรเจกต์เอง
    if (!isNotOwner) {
      toast.error('คุณไม่สามารถสมัครงานของตัวเองได้');
      return;
    }
    
    // ตรวจสอบสถานะการเปิดรับสมัคร
    if (!isOpenForApplications) {
      toast.error('โปรเจกต์นี้ไม่ได้เปิดรับสมัครแล้ว');
      return;
    }
    
    // ตรวจสอบความตรงกันของทักษะ
    if (!hasMatchingSkills) {
      toast.error('คุณไม่มีทักษะที่ตรงกับที่โปรเจกต์ต้องการ');
      return;
    }
    
    // ตรวจสอบราคาขั้นต่ำ
    if (!meetsMinimumPrice) {
      toast.error(`งบประมาณของโปรเจกต์ต่ำกว่าราคาขั้นต่ำของคุณ (${userBasePrice} บาท)`);
      return;
    }
    
    // เปิด Modal สำหรับส่งข้อความ
    setIsModalOpen(true);
  };
  
  // ฟังก์ชันสำหรับยกเลิกการสมัคร
  const handleCancelApplication = async () => {
    if (!confirm('คุณต้องการยกเลิกคำขอร่วมงานนี้ใช่หรือไม่?')) {
      return;
    }
    
    setSending(true);
    try {
      // เรียกใช้ API สำหรับยกเลิกการสมัคร
      await axios.delete(`/api/projects/${projectId}/applications`, {
        withCredentials: true
      });
      
      toast.success('ยกเลิกคำขอร่วมงานเรียบร้อยแล้ว');
      
      // เรียกตรวจสอบสถานะอีกครั้งหลังจากยกเลิก
      await checkApplicationStatus();
    } catch (error: any) {
      console.error('Error canceling application:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('เกิดข้อผิดพลาดในการยกเลิกคำขอร่วมงาน');
      }
    } finally {
      setSending(false);
    }
  };
  
  // ฟังก์ชันส่งคำขอสมัครงาน
  const handleSubmitApplication = async () => {
    // ป้องกันการส่งซ้ำ
    if (hasApplied) {
      setIsModalOpen(false);
      toast.error('คุณได้สมัครงานนี้ไปแล้ว');
      return;
    }
    
    // ตรวจสอบว่ามีข้อความหรือไม่
    if (!message.trim()) {
      toast.error('กรุณากรอกข้อความถึงเจ้าของโปรเจกต์');
      return;
    }
    
    setSending(true);
    try {
      // ข้อมูลสำหรับส่งคำขอสมัครงาน
      const applicationData = {
        message
      };
      
      // เรียกใช้ API สำหรับส่งคำขอสมัครงาน
      await axios.post(`/api/projects/${projectId}/applications`, applicationData, {
        withCredentials: true
      });
      
      // ปิด Modal และแสดงข้อความสำเร็จ
      setIsModalOpen(false);
      toast.success('ส่งคำขอร่วมงานเรียบร้อยแล้ว');
      setMessage('');
      
      // เรียกตรวจสอบสถานะอีกครั้งหลังจากสมัคร
      await checkApplicationStatus();
    } catch (error: any) {
      // แสดงข้อความความผิดพลาด
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('เกิดข้อผิดพลาดในการส่งคำขอร่วมงาน');
      }
    } finally {
      setSending(false);
    }
  };
  
  // ถ้าผู้ใช้ไม่ใช่ฟรีแลนซ์ ไม่ต้องแสดงปุ่ม
  if (!isFreelancer) {
    return null;
  }
  
  // ถ้ากำลังโหลดข้อมูล แสดงปุ่มแต่ disable ไว้
  if (loading) {
    return (
      <button 
        className="btn-primary w-full opacity-60 cursor-not-allowed"
        disabled
      >
        <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
        กำลังตรวจสอบ...
      </button>
    );
  }
  
  // แสดงข้อความสถานะการสมัคร ถ้าได้สมัครไปแล้ว
  if (hasApplied) {
    // ถ้าสถานะเป็น pending ให้แสดงปุ่มยกเลิกคำขอ
    if (applicationStatus === 'pending') {
      return (
        <button 
          className="btn-danger w-full flex justify-center items-center gap-2"
          onClick={handleCancelApplication}
          disabled={sending}
        >
          {sending ? (
            <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          )}
          ยกเลิกคำขอร่วมงาน
        </button>
      );
    }
    
    // ถ้าสถานะเป็น accepted แสดงข้อความ "รับงานแล้ว"
    if (applicationStatus === 'accepted') {
      return (
        <div className="w-full p-2 text-center bg-green-100 text-green-700 rounded-lg border border-green-300">
          <span className="flex justify-center items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            คุณได้รับงานนี้แล้ว
          </span>
        </div>
      );
    }
    
    // ถ้าสถานะเป็น rejected แสดงข้อความ "ไม่ได้รับการคัดเลือก"
    if (applicationStatus === 'rejected') {
      return (
        <div className="w-full p-2 text-center bg-gray-100 text-gray-500 rounded-lg border border-gray-300">
          <span className="flex justify-center items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            คุณไม่ได้รับการคัดเลือกสำหรับงานนี้
          </span>
        </div>
      );
    }
    
    // สำหรับกรณีอื่นๆ แสดงข้อความ "สมัครงานแล้ว"
    return (
      <div className="w-full p-2 text-center bg-blue-100 text-blue-700 rounded-lg border border-blue-300">
        <span className="flex justify-center items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"></path>
            <path d="M8 12h8"></path>
          </svg>
          คุณได้สมัครงานนี้แล้ว
        </span>
      </div>
    );
  }
  
  // แสดงปุ่มสมัครงาน แต่ disable ถ้าไม่ผ่านเงื่อนไข
  const disableApply = !isOpenForApplications || !hasMatchingSkills || !meetsMinimumPrice || !isNotOwner;
  
  return (
    <>
      <button 
        className={`btn-primary w-full flex justify-center items-center gap-2 ${disableApply ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={handleApplyClick}
        disabled={disableApply}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"></path>
          <path d="M9 3h6v6H9z"></path>
          <path d="m22 12-8.5 8.5-4-4 8.5-8.5 4 4Z"></path>
        </svg>
        สมัครงาน
      </button>
      
      {/* Modal สำหรับส่งข้อความถึงเจ้าของโปรเจกต์ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 bg-primary-blue-500 text-white rounded-t-xl flex justify-between items-center">
              <h2 className="text-lg font-medium">สมัครงาน - {projectTitle}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-white/80"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                  ข้อความถึงเจ้าของโปรเจกต์
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="แนะนำตัวคุณ ประสบการณ์ และบอกเหตุผลที่คุณเหมาะสมกับงานนี้..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
                <p className="text-gray-500 text-sm mt-1">
                  ข้อความของคุณจะถูกส่งให้ {projectOwnerName} เพื่อพิจารณาคำขอเข้าร่วมงานของคุณ
                </p>
              </div>
              
              {/* แสดงข้อมูลทักษะที่ตรงกัน */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">ทักษะของคุณที่ตรงกับโปรเจกต์</h3>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills
                    .filter(skill => userSkills.includes(skill))
                    .map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={sending}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitApplication}
                  className="btn-primary flex items-center"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
                      กำลังส่ง...
                    </>
                  ) : 'ส่งคำขอร่วมงาน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ApplyButton;