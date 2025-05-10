'use client'
import React, { useState } from "react"
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// กำหนด interface ให้ตรงกับโมเดล Project
interface ProjectFormData {
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requiredSkills: string[];
  // ฟิลด์ต่อไปนี้จะถูกกำหนดโดยระบบ:
  // owner, ownerName, status, progress, createdAt
}

// รายชื่อทักษะตามหมวดหมู่
const skillCategories = {
  "IT": ["Web Development", "UX/UI Design", "Data Analysis", "Mobile App Development", "Game Development", "AI/Machine Learning"],
  "Graphic": ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe After Effects", "3D Modeling"],
  "Business": ["Marketing", "Content Writing", "Business Analysis", "Project Management", "Financial Analysis"],
  "Video": ["Video Editing", "Animation", "Motion Graphics", "Videography"],
  "Audio": ["Sound Design", "Music Production", "Voice Over"]
};

const NewProjectModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    budget: 100,
    deadline: '',
    requiredSkills: []
  });
  
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: ''
  });
  
  const [activeCategory, setActiveCategory] = useState(Object.keys(skillCategories)[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSkillToggle = (skill: string) => {
    setFormData(prev => {
      if (prev.requiredSkills.includes(skill)) {
        return {
          ...prev,
          requiredSkills: prev.requiredSkills.filter(s => s !== skill)
        };
      } else {
        return {
          ...prev,
          requiredSkills: [...prev.requiredSkills, skill]
        };
      }
    });
  };
  
  const validateForm = () => {
    let valid = true;
    const newErrors = { title: '', description: '', budget: '', deadline: '' };
    
    if (!formData.title.trim()) {
      newErrors.title = 'กรุณาระบุชื่อโปรเจกต์';
      valid = false;
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'กรุณาระบุรายละเอียดโปรเจกต์';
      valid = false;
    }
    
    if (formData.budget === null || formData.budget === undefined) {
      newErrors.budget = 'กรุณาระบุงบประมาณ';
      valid = false;
    } else if (isNaN(Number(formData.budget))) {
      newErrors.budget = 'งบประมาณต้องเป็นตัวเลขเท่านั้น';
      valid = false;
    } else if (Number(formData.budget) < 100) {
      newErrors.budget = 'งบประมาณต้องไม่น้อยกว่า 100 บาท';
      valid = false;
    }
    
    if (!formData.deadline.trim()) {
      newErrors.deadline = 'กรุณาระบุวันที่ต้องการให้งานเสร็จ';
      valid = false;
    }
    
    // ตรวจสอบว่ามีการเลือกทักษะอย่างน้อย 1 ทักษะ
    if (formData.requiredSkills.length === 0) {
      valid = false;
      // ไม่ต้องแสดง error message เพราะไม่มี field ให้แสดง
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // สร้างข้อมูลโปรเจกต์ตามโมเดล
      const projectData = {
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        deadline: formData.deadline,
        requiredSkills: formData.requiredSkills,
        // ส่วนต่อไปนี้จะถูกจัดการโดย API:
        // owner (จะได้จาก session)
        // ownerName (จะได้จาก user object)
        // status: 'open' (ค่าเริ่มต้น)
        // progress: 0 (ค่าเริ่มต้น)
        // createdAt (จะสร้างโดย API)
      };
      
      // ส่งข้อมูลไปยัง API
      const response = await axios.post('/api/projects', projectData);
      
      // เรียกฟังก์ชัน callback จาก prop
      onSubmit(formData, response.data);
      
      // รีเซ็ตฟอร์ม
      setFormData({
        title: '',
        description: '',
        budget: 100,
        deadline: '',
        requiredSkills: []
      });
      
      // ปิด Modal
      onClose();
    } catch (error) {
      console.error('Error submitting project:', error);
      
      // จัดการข้อผิดพลาดจาก API
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('เกิดข้อผิดพลาดในการสร้างโปรเจกต์ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get tomorrow's date as min date for deadline input
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-primary-blue-500 p-4 flex justify-between items-center z-10">
          <h2 className="text-lg font-medium text-white">โพสต์งานใหม่</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-white/80 transition-colors"
            aria-label="ปิด"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 relative">
          <div className="space-y-6">
            {/* Project title */}
            <div>
              <label htmlFor="title" className="font-medium text-sm text-gray-700">
                ชื่อโปรเจกต์
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="ระบุชื่อโปรเจกต์"
                value={formData.title}
                onChange={handleChange}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="font-medium text-sm text-gray-700">
                รายละเอียดโปรเจกต์ 
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className={`input resize-none ${errors.description ? 'border-red-500' : ''}`}
                placeholder="อธิบายรายละเอียดของโปรเจกต์"
                value={formData.description}
                onChange={handleChange}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">อธิบายรายละเอียดงาน ความต้องการ ขอบเขตของงาน เงื่อนไขต่างๆ</p>
            </div>
            
            {/* Budget and Deadline in two columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Budget */}
              <div className="flex flex-col">
                <label htmlFor="budget" className="font-medium text-sm text-gray-700">
                  งบประมาณ
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    min="100"
                    step="100"
                    className={`input max-w-32 ${errors.budget ? 'border-red-500' : ''}`}
                    value={formData.budget}
                    onChange={handleChange}
                  />
                  <span className="text-gray-600">บาท</span>
                </div>
                {errors.budget && (
                  <p className="text-red-500 text-xs mt-1">{errors.budget}</p>
                )}
              </div>
              
              {/* Deadline */}
              <div>
                <label htmlFor="deadline" className="font-medium text-sm text-gray-700">
                  กำหนดส่งงาน
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  className={`input ${errors.deadline ? 'border-red-500' : ''}`}
                  min={getTomorrowDate()}
                  value={formData.deadline}
                  onChange={handleChange}
                />
                {errors.deadline && (
                  <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>
                )}
              </div>
            </div>
            
            {/* Required Skills */}
            <div>
              <label className="font-medium text-sm text-gray-700">
                ทักษะที่ต้องการ <span className="text-xs text-gray-500 ml-1">(เลือกอย่างน้อย 1 ทักษะ)</span>
              </label>
              
              {/* Category tabs - เหมือนกับใน RegisterForm */}
              <div className="flex overflow-x-auto pb-2 mb-2 gap-2">
                {Object.keys(skillCategories).map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      activeCategory === category
                        ? 'bg-primary-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              {/* Skills selection */}
              <div className="border border-gray-300 rounded-xl p-3 h-44 overflow-y-auto bg-white shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  {skillCategories[activeCategory].map((skill) => (
                    <div key={skill} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`skill-${skill}`}
                        checked={formData.requiredSkills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="w-4 h-4 text-primary-blue-500 border-gray-300 rounded cursor-pointer focus:ring-primary-blue-400"
                      />
                      <label
                        htmlFor={`skill-${skill}`}
                        className="ml-2 text-sm text-gray-600 cursor-pointer"
                      >
                        {skill}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Selected skills display */}
              <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-2">ทักษะที่เลือก ({formData.requiredSkills.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.requiredSkills.map(skill => (
                      <span 
                        key={skill}
                        className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-1 rounded-lg flex items-center"
                      >
                        {skill}
                        <button 
                          type="button"
                          onClick={() => handleSkillToggle(skill)} 
                          className="ml-1 text-primary-blue-600 hover:text-primary-blue-800 transition-colors"
                          aria-label={`ลบทักษะ ${skill}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </span>
                    ))}
                    
                    {formData.requiredSkills.length === 0 && (
                      <span className="text-gray-400 text-xs">
                        ไม่ได้เลือกทักษะใด
                      </span>
                    )}
                  </div>
              </div>
            </div>
            
            {/* Information note */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500 mt-0.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div>
                  <p className="text-sm text-gray-600">
                    โพสต์ของคุณจะแสดงให้ฟรีแลนซ์ในระบบเห็นและสามารถส่งคำขอร่วมงานได้ คุณจะได้รับการแจ้งเตือนเมื่อมีคำขอเข้ามา
                  </p>
                </div>
              </div>
            </div>
          </div>
        
          <div className="sticky bottom-0 bg-gray-50 p-3 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center justify-center min-w-28"
              disabled={isSubmitting || formData.requiredSkills.length === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
                  กำลังส่ง...
                </>
              ) : 'โพสต์งาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function NewProjectButton() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  
  // Check if user is authorized to create projects
  const canCreateProject = session && (
    session.user?.role === 'teacher' || 
    session.user?.role === 'alumni'
  );
  
  const handleOpenModal = () => {
    // If not logged in, redirect to login
    if (status === 'unauthenticated') {
      toast.error('กรุณาเข้าสู่ระบบก่อนสร้างโปรเจกต์');
      router.push('/auth?state=login&callbackUrl=/project-board');
      return;
    }
    
    // If not authorized, show message
    if (!canCreateProject) {
      toast.error('เฉพาะอาจารย์และศิษย์เก่าเท่านั้นที่สามารถสร้างโปรเจกต์ได้');
      return;
    }
    
    // Open modal if authorized
    setIsModalOpen(true);
  };
  
  const handleSubmitProject = (projectData, apiResponse) => {
    // แสดงข้อความแจ้งเตือนว่าโพสต์สำเร็จ
    toast.success('โพสต์งานสำเร็จ');
    
    // Refresh the page to show the new project
    setTimeout(() => {
      router.refresh();
      
      // Optional: Navigate to the new project page
      if (apiResponse && apiResponse.project && apiResponse.project.id) {
        router.push(`/project/${apiResponse.project.id}`);
      }
    }, 1000);
  };

  if (!canCreateProject) {
    return null
  }  
  
  return (
    <div>
      <button 
        className="btn-primary w-full md:w-fit flex items-center justify-center gap-2"
        onClick={handleOpenModal}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        โพสต์งานใหม่
      </button>
      
      {isModalOpen && (
        <NewProjectModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitProject}
        />
      )}
    </div>
  );
}

export default NewProjectButton