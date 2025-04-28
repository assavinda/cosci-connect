'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  budget: number;
  status: string;
  requiredSkills: string[];
}

interface HireButtonProps {
  freelancerId: string;
  freelancerName: string;
  freelancerSkills: string[];
  basePrice: number;
}

function HireButton({ freelancerId, freelancerName, freelancerSkills, basePrice }: HireButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // ตรวจสอบผู้ใช้ว่าเป็นอาจารย์หรือศิษย์เก่า (ผู้ที่สามารถสร้างโปรเจกต์ได้)
  const canHireFreelancer = session && (
    session.user?.role === 'teacher' || 
    session.user?.role === 'alumni'
  );

  // เมื่อกดปุ่ม Hire
  const handleHireClick = async () => {
    // ถ้ายังไม่ได้ login ให้ redirect ไปหน้า login
    if (status === 'unauthenticated') {
      toast.error('กรุณาเข้าสู่ระบบก่อนจ้างฟรีแลนซ์');
      router.push(`/auth?state=login&callbackUrl=/user/freelance/${freelancerId}`);
      return;
    }

    // ถ้าไม่ใช่อาจารย์หรือศิษย์เก่า
    if (!canHireFreelancer) {
      toast.error('เฉพาะอาจารย์และศิษย์เก่าเท่านั้นที่สามารถจ้างฟรีแลนซ์ได้');
      return;
    }

    // เปิด Modal และดึงข้อมูลโปรเจกต์
    setIsModalOpen(true);
    await fetchUserProjects();
  };

  // ดึงข้อมูลโปรเจกต์ของ user ที่ login อยู่
  const fetchUserProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/projects', {
        params: {
          owner: session?.user?.id,
          status: 'open'
        }
      });

      // กรองโปรเจกต์ที่มี skills ตรงกับ freelancer อย่างน้อย 1 อย่าง
      const matchingProjects = response.data.projects.filter((project: Project) => {
        // ตรวจสอบว่ามี skill ที่ตรงกันอย่างน้อย 1 อย่าง
        return project.requiredSkills.some(skill => 
          freelancerSkills.includes(skill)
        );
      });

      // กรองโปรเจกต์ที่มีงบประมาณไม่น้อยกว่าราคาขั้นต่ำของฟรีแลนซ์
      const affordableProjects = matchingProjects.filter((project: Project) => 
        project.budget >= basePrice
      );

      setProjects(affordableProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโปรเจกต์ได้');
    } finally {
      setLoading(false);
    }
  };

  // ส่งคำขอเข้าร่วมงาน
  const handleSendInvitation = async () => {
    if (!selectedProjectId) {
      toast.error('กรุณาเลือกโปรเจกต์');
      return;
    }

    setSending(true);
    try {
      // ส่งคำขอไปที่ API - ใช้ Invitation model แทน
      const response = await axios.post(`/api/projects/${selectedProjectId}/invite`, {
        freelancerId,
        freelancerName
      });

      // ปิด Modal และแสดงข้อความสำเร็จ
      setIsModalOpen(false);
      toast.success(`ส่งคำขอให้ ${freelancerName} เรียบร้อยแล้ว`);

      // Refresh หน้าหลังจากส่งคำขอสำเร็จ
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error: any) {
      // แสดงข้อความความผิดพลาด
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    } finally {
      setSending(false);
    }
  };

  // ปุ่ม Hire หลัก
  return (
    <>
      <button
        onClick={handleHireClick}
        className="btn-primary w-full md:w-auto px-6 py-2 flex items-center justify-center gap-2"
        disabled={status === 'loading'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        จ้างฟรีแลนซ์
      </button>

      {/* Modal สำหรับเลือกโปรเจกต์ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 bg-primary-blue-500 text-white rounded-t-xl flex justify-between items-center">
              <h2 className="text-lg font-medium">เลือกโปรเจกต์ที่ต้องการจ้าง</h2>
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
              <p className="text-gray-700 mb-4">
                เลือกโปรเจกต์ที่ต้องการจ้าง <strong>{freelancerName}</strong>
              </p>
              
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-8 h-8 border-4 border-primary-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : projects.length > 0 ? (
                <div className="max-h-60 overflow-y-auto mb-4">
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      className={`p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${
                        selectedProjectId === project.id 
                          ? 'border-primary-blue-500 bg-primary-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">{project.title}</h3>
                        <span className="text-primary-blue-500 font-medium">
                          {new Intl.NumberFormat('th-TH', {
                            style: 'currency',
                            currency: 'THB',
                            minimumFractionDigits: 0
                          }).format(project.budget)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.requiredSkills
                          .filter(skill => freelancerSkills.includes(skill))
                          .slice(0, 3)
                          .map((skill, index) => (
                            <span 
                              key={index}
                              className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-0.5 rounded-lg"
                            >
                              {skill}
                            </span>
                          ))}
                        {project.requiredSkills.filter(skill => freelancerSkills.includes(skill)).length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{project.requiredSkills.filter(skill => freelancerSkills.includes(skill)).length - 3} ทักษะที่ตรงกัน
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500 mb-2">ไม่พบโปรเจกต์ที่ตรงกับเงื่อนไข</p>
                  <p className="text-sm text-gray-400">
                    โปรเจกต์ต้องมีงบประมาณไม่น้อยกว่า {basePrice} บาท และมีทักษะที่ต้องการตรงกับฟรีแลนซ์อย่างน้อย 1 ทักษะ
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={sending}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSendInvitation}
                  className="btn-primary flex items-center"
                  disabled={!selectedProjectId || sending || projects.length === 0}
                >
                  {sending ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
                      กำลังส่ง...
                    </>
                  ) : 'ส่งคำขอ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HireButton;