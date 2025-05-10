'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Loading from '../common/Loading';

interface Project {
  id: string;
  title: string;
  budget: number;
  requiredSkills: string[];
  requestToFreelancer?: string | null;
  freelancersRequested: string[]; // เพิ่มฟิลด์นี้เพื่อเช็คว่าฟรีแลนซ์ส่งคำขอมาแล้วหรือไม่
}

interface HireButtonProps {
  freelancerId: string;
  freelancerName: string;
  freelancerSkills: string[];
}

const HireButton: React.FC<HireButtonProps> = ({ 
  freelancerId, 
  freelancerName,
  freelancerSkills 
}) => {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ตรวจสอบว่าผู้ใช้ปัจจุบันไม่ใช่ student และไม่ใช่ฟรีแลนซ์คนเดียวกัน
  const canHire = session?.user?.role !== 'student' && session?.user?.id !== freelancerId;

  // ดึงโปรเจกต์ที่ตรงตามเงื่อนไขเมื่อเปิดป๊อปอัพ
  useEffect(() => {
    if (isModalOpen && canHire) {
      fetchAvailableProjects();
    }
  }, [isModalOpen, canHire]);

  // ดึงโปรเจกต์ที่ตรงตามเงื่อนไข
  // 1. สถานะเป็น open 
  // 2. assignedTo ไม่มีข้อมูล 
  // 3. requestToFreelancer ไม่มีข้อมูล
  // 4. มี requiredSkills ตรงกับ Skills ของฟรีแลนซ์อย่างน้อย 1 อย่าง
  // 5. เจ้าของโปรเจกต์คือผู้ใช้ปัจจุบัน
  const fetchAvailableProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // ดึงโปรเจกต์ของผู้ใช้ปัจจุบันที่มีสถานะ open
      // และใช้พารามิเตอร์ noRequest เพื่อกรองโปรเจกต์ที่ไม่มี requestToFreelancer
      const response = await axios.get('/api/projects', {
        params: {
          status: 'open',
          owner: session?.user?.id,
          noRequest: true // เพิ่มพารามิเตอร์นี้
        }
      });

      console.log("Raw projects data:", response.data);

      // กรองโปรเจกต์ที่ตรงเงื่อนไข (เฉพาะทักษะที่ตรงกัน)
      const filteredProjects = response.data.projects.filter((project: any) => {
        // ตรวจสอบว่ามีทักษะที่ตรงกันอย่างน้อย 1 อย่าง
        const hasMatchingSkill = project.requiredSkills.some((skill: string) =>
          freelancerSkills.includes(skill)
        );

        if (!hasMatchingSkill) {
          console.log(`Project ${project.id} skipped: no matching skills`);
          return false;
        }

        console.log(`Project ${project.id} included in filtered list`);
        return true;
      });

      console.log(`Found ${filteredProjects.length} matching projects out of ${response.data.projects.length} total`);
      setAvailableProjects(filteredProjects);
    } catch (err) {
      console.error('Error fetching available projects:', err);
      setError('ไม่สามารถโหลดโปรเจกต์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // ส่งคำขอให้ฟรีแลนซ์
  const sendHireRequest = async () => {
    if (!selectedProjectId) {
      setError('กรุณาเลือกโปรเจกต์');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // ส่งคำขอไปยัง API เพื่ออัปเดตค่า requestToFreelancer ให้โปรเจกต์
      const response = await axios.patch(`/api/projects/${selectedProjectId}`, {
        requestToFreelancer: freelancerId
      });

      console.log("Hire request response:", response.data);

      // แสดงข้อความสำเร็จ
      setSuccessMessage(`ส่งคำขอให้ ${freelancerName} รับงานเรียบร้อยแล้ว`);
      
      // ลบโปรเจกต์ที่เพิ่ง update ออกจากรายการ
      setAvailableProjects(prevProjects => 
        prevProjects.filter(project => project.id !== selectedProjectId)
      );
      
      // รีเซ็ตการเลือกโปรเจกต์
      setSelectedProjectId(null);
      
      // ปิดป๊อปอัพหลัง 2 วินาที
      setTimeout(() => {
        if (availableProjects.length <= 1) {
          // ถ้าเป็นโปรเจกต์สุดท้าย ให้ปิดป๊อปอัพเลย
          setIsModalOpen(false);
          setSuccessMessage(null);
        } else {
          // ถ้ายังมีโปรเจกต์อื่นอยู่ ให้เคลียร์ข้อความสำเร็จเพื่อให้เลือกโปรเจกต์ต่อไปได้
          setSuccessMessage(null);
        }
      }, 2000);

    } catch (err: any) {
      console.error('Error sending hire request:', err);
      setError(`เกิดข้อผิดพลาดในการส่งคำขอ: ${err.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ฟอร์แมตราคาเป็นสกุลเงินบาท
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // ถ้าผู้ใช้กำลังโหลดหรือไม่สามารถจ้างได้ ไม่ต้องแสดงปุ่ม
  if (status === 'loading' || !canHire) {
    return null;
  }

  // ตรวจสอบว่าฟรีแลนซ์ได้ส่งคำขอมาแล้วหรือไม่
  const checkIfFreelancerRequested = (project: Project): boolean => {
    return project.freelancersRequested.includes(freelancerId);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary flex items-center gap-2"
        aria-label="จ้างฟรีแลนซ์"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 16V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4"></path>
          <polyline points="16 2 16 10 12 8 8 10 8 2"></polyline>
          <line x1="12" y1="16" x2="12" y2="22"></line>
          <line x1="9" y1="19" x2="15" y2="19"></line>
        </svg>
        จ้างฟรีแลนซ์
      </button>

      {/* Modal/Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[50vh] overflow-y-auto">
            <div className="sticky top-0 bg-primary-blue-500 p-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">เลือกโปรเจกต์สำหรับจ้างฟรีแลนซ์</h2>
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
                <p className="text-gray-600">
                  คุณกำลังจะส่งคำขอให้ <span className="font-medium">{freelancerName}</span> รับงานของคุณ
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  เลือกโปรเจกต์ที่คุณต้องการให้ฟรีแลนซ์รับงาน
                </p>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <Loading size="medium" color="primary" />
                  <p className="mt-4 text-gray-500">กำลังโหลดโปรเจกต์...</p>
                </div>
              ) : error && !successMessage ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : successMessage ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <p className="text-green-600">{successMessage}</p>
                </div>
              ) : availableProjects.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-600">ไม่พบโปรเจกต์ที่ตรงตามเงื่อนไข</p>
                  <p className="text-sm text-yellow-600 mt-2">
                    คุณต้องมีโปรเจกต์ที่เปิดรับสมัครและมีทักษะที่ตรงกับฟรีแลนซ์
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    {availableProjects.map((project) => (
                      <div 
                        key={project.id}
                        className={`border rounded-lg p-3 cursor-pointer transition ${
                          selectedProjectId === project.id 
                            ? 'border-primary-blue-500 bg-primary-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        } ${
                          checkIfFreelancerRequested(project) 
                            ? 'opacity-60 hover:border-gray-200' 
                            : ''
                        }`}
                        onClick={() => {
                          if (!checkIfFreelancerRequested(project)) {
                            // ถ้ากดที่โปรเจกต์เดิมที่กำลังเลือกอยู่ ให้ยกเลิกการเลือก
                            if (selectedProjectId === project.id) {
                              setSelectedProjectId(null);
                            } else {
                              setSelectedProjectId(project.id);
                            }
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{project.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              งบประมาณ: {formatPrice(project.budget)}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {project.requiredSkills.map((skill) => (
                                <span 
                                  key={skill}
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    freelancerSkills.includes(skill)
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                            
                            {/* แสดงข้อความเมื่อฟรีแลนซ์ส่งคำขอมาแล้ว */}
                            {checkIfFreelancerRequested(project) && (
                              <p className="mt-2 text-sm text-orange-500 font-medium">
                                ฟรีแลนซ์ได้ส่งคำขอร่วมงานในโปรเจกต์นี้แล้ว
                              </p>
                            )}
                          </div>
                          <div className="ml-2">
                            {!checkIfFreelancerRequested(project) && (
                              <div 
                                className={`w-5 h-5 rounded-full border ${
                                  selectedProjectId === project.id
                                    ? 'border-primary-blue-500 bg-primary-blue-500'
                                    : 'border-gray-300'
                                } flex items-center justify-center`}
                              >
                                {selectedProjectId === project.id && (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom buttons */}
            <div className="sticky bottom-0 p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              {availableProjects.length > 0 && !successMessage && (
                <button
                  onClick={sendHireRequest}
                  className={`btn-primary flex items-center justify-center min-w-24 ${
                    !selectedProjectId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!selectedProjectId || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
                      กำลังส่ง...
                    </>
                  ) : 'ส่งคำขอ'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HireButton;