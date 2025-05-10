'use client';

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

interface ApplyButtonProps {
  projectId: string;
  projectTitle: string;
  alreadyApplied?: boolean;
}

function ApplyButton({ projectId, projectTitle, alreadyApplied = false }: ApplyButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localApplied, setLocalApplied] = useState(alreadyApplied);

  // ตรวจสอบว่าผู้ใช้เป็น student (ฟรีแลนซ์) หรือไม่
  const isFreelancer = session?.user?.role === 'student';

  // ตรวจสอบว่าฟรีแลนซ์ได้ส่งคำขอไปแล้วหรือไม่
  if (!isFreelancer || localApplied) {
    return null; // ไม่แสดงปุ่มถ้าไม่ใช่ฟรีแลนซ์หรือส่งคำขอไปแล้ว
  }

  const handleApply = async () => {
    // เปิด modal ยืนยันการสมัคร
    setIsModalOpen(true);
  };

  const confirmApply = async () => {
    // ถ้ายังไม่ได้ล็อกอิน ให้ redirect ไปหน้าล็อกอิน
    if (status !== 'authenticated') {
      router.push('/auth?state=login');
      return;
    }

    setIsSubmitting(true);

    try {
      // ส่งคำขอไปที่ API โดยใช้ endpoint ที่มีอยู่แล้ว
      // ส่ง applyToProject: true เพื่อระบุว่าเป็นการส่งคำขอร่วมงาน
      const response = await axios.patch(`/api/projects/${projectId}`, {
        applyToProject: true
      });
      
      // อัปเดตสถานะในหน้าปัจจุบัน (ไม่ต้อง refresh เพราะจะได้รับการอัปเดตผ่าน Pusher)
      setLocalApplied(true);
      
      // ปิด modal
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error applying to project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleApply}
        className="btn-primary flex items-center gap-2 w-full justify-center"
        disabled={isSubmitting}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        ส่งคำขอร่วมงาน
      </button>

      {/* Modal ยืนยันการสมัคร */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">ยืนยันการส่งคำขอร่วมงาน</h3>
              <p className="text-gray-600 mb-6">
                คุณต้องการส่งคำขอร่วมงานในโปรเจกต์ {projectTitle} ใช่หรือไม่?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmApply}
                  className="btn-primary flex items-center justify-center min-w-24"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
                      กำลังส่ง...
                    </>
                  ) : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ApplyButton