// src/app/components/auth/register/RegisterForm.tsx
'use client';

import React, { useState, useEffect } from "react";
import axios from "axios";
import StepRole from "./steps/StepRole";
import StepPersonalInfo from "./steps/StepPersonalInfo";
import StepMajorAndSkills from "./steps/StepMajorAndSkills";
import StepEmail from "./steps/StepEmail";
import StepProfile from "./steps/StepProfile";
import OTP from "../otp/OTP";
import ImageCropModal from "./steps/ImageCropModal";
import StepIndicator from "./steps/StepIndicator";
import { useRouter } from "next/navigation";

interface RegisterFormProps {
  onLoginClick: () => void;
}

// รายชื่อทักษะตามหมวดหมู่
export const skillCategories = {
  "IT": ["Web Development", "UX/UI Design", "Data Analysis", "Mobile App Development", "Game Development", "AI/Machine Learning"],
  "Graphic": ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe After Effects", "3D Modeling"],
  "Business": ["Marketing", "Content Writing", "Business Analysis", "Project Management", "Financial Analysis"],
  "Video": ["Video Editing", "Animation", "Motion Graphics", "Videography"],
  "Audio": ["Sound Design", "Music Production", "Voice Over"]
};

export type UserRole = "student" | "alumni" | "teacher";

export interface RegisterData {
  role: UserRole;
  firstName: string;
  lastName: string;
  name: string;
  studentId?: string;
  major: string;
  skills: string[];
  email: string;
  isEmailVerified: boolean;
  profileImage?: File;
  portfolioFile?: File;
  bio?: string;
  basePrice?: number;
  isOpen?: boolean;
  galleryImages?: File[];
}

interface ValidationState {
  studentId: {
    isChecking: boolean;
    exists: boolean;
    error: string;
    touched: boolean;
  };
  email: {
    isChecking: boolean;
    exists: boolean;
    error: string;
    touched: boolean;
  };
  firstName: {
    error: string;
  };
  lastName: {
    error: string;
  };
}

function RegisterForm({ onLoginClick }: RegisterFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [previousEmail, setPreviousEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  
  // Centralized validation state
  const [validation, setValidation] = useState<ValidationState>({
    studentId: {
      isChecking: false,
      exists: false,
      error: '',
      touched: false
    },
    email: {
      isChecking: false,
      exists: false,
      error: '',
      touched: false
    },
    firstName: {
      error: ''
    },
    lastName: {
      error: ''
    }
  });
  
  const [registerData, setRegisterData] = useState<RegisterData>({
    role: "student",
    firstName: "",
    lastName: "",
    name: "",
    studentId: "",
    major: "",
    skills: [],
    email: "",
    isEmailVerified: false,
    bio: "",
    // เริ่มต้นโดยไม่กำหนดค่าสำหรับฟิลด์เฉพาะนิสิต
  });

  // เพิ่มค่าเริ่มต้นสำหรับฟิลด์ของนิสิตเมื่อเลือกบทบาทเป็นนิสิต
  useEffect(() => {
    if (registerData.role === 'student') {
      setRegisterData(prev => ({
        ...prev,
        basePrice: prev.basePrice ?? 500,
        isOpen: prev.isOpen ?? true,
        skills: prev.skills.length ? prev.skills : [],
      }));
    }
  }, [registerData.role]);

  // Validate student ID pattern whenever it changes
  useEffect(() => {
    if (registerData.role === 'student' && registerData.studentId) {
      if (registerData.studentId.length !== 11) {
        setValidation(prev => ({
          ...prev,
          studentId: { ...prev.studentId, error: 'รหัสนิสิตต้องมี 11 หลัก' }
        }));
      } else if (!/^[0-9]+$/.test(registerData.studentId)) {
        setValidation(prev => ({
          ...prev,
          studentId: { ...prev.studentId, error: 'รหัสนิสิตต้องเป็นตัวเลขเท่านั้น' }
        }));
      } else if (registerData.studentId.substring(3, 8) !== '30010') {
        setValidation(prev => ({
          ...prev,
          studentId: { ...prev.studentId, error: 'รหัสนิสิตไม่ถูกต้อง' }
        }));
      } else {
        // ถ้ารูปแบบถูกต้อง และรหัสนิสิตเคยถูกกรอกแล้ว (touched)
        // ให้ตรวจสอบว่ามีรหัสนิสิตนี้ในระบบแล้วหรือไม่
        if (validation.studentId.touched) {
          checkStudentIdExists(registerData.studentId);
        } else {
          setValidation(prev => ({
            ...prev,
            studentId: { ...prev.studentId, error: '' }
          }));
        }
      }
    } else {
      setValidation(prev => ({
        ...prev,
        studentId: { ...prev.studentId, error: '' }
      }));
    }
  }, [registerData.studentId, registerData.role, validation.studentId.touched]);

  // Validate email format whenever it changes
  useEffect(() => {
    if (registerData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerData.email)) {
        setValidation(prev => ({
          ...prev,
          email: { ...prev.email, error: 'กรุณากรอกอีเมลให้ถูกต้อง' }
        }));
      } else {
        // เมื่ออีเมลถูกต้องตามรูปแบบและได้รับการแตะ (touched) แล้ว
        // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
        if (validation.email.touched) {
          checkEmailExists();
        } else {
          setValidation(prev => ({
            ...prev,
            email: { ...prev.email, error: '' }
          }));
        }
      }
    } else {
      setValidation(prev => ({
        ...prev,
        email: { ...prev.email, error: '' }
      }));
    }
  }, [registerData.email, validation.email.touched]);

  // ตรวจสอบว่ารหัสนิสิตมีในระบบแล้วหรือไม่
  const checkStudentIdExists = async (studentId: string) => {
    if (!studentId || studentId.length !== 11) return;

    setValidation(prev => ({
      ...prev,
      studentId: { ...prev.studentId, isChecking: true, error: '' }
    }));

    try {
      const response = await axios.get(`/api/auth/check-student-id?studentId=${encodeURIComponent(studentId)}`);
      const exists = response.data.exists;
      
      setValidation(prev => ({
        ...prev,
        studentId: { 
          ...prev.studentId, 
          isChecking: false, 
          exists: exists,
          error: exists ? 'มีผู้ใช้งานรหัสนิสิตนี้แล้ว' : '' 
        }
      }));
    } catch (error: any) {
      console.error("Error checking student ID:", error);
      setValidation(prev => ({
        ...prev,
        studentId: { 
          ...prev.studentId, 
          isChecking: false,
          error: 'เกิดข้อผิดพลาดในการตรวจสอบรหัสนิสิต' 
        }
      }));
    }
  };

  // ตรวจสอบว่าอีเมลมีในระบบแล้วหรือไม่
  const checkEmailExists = async () => {
    if (!registerData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) return;

    setValidation(prev => ({
      ...prev,
      email: { ...prev.email, isChecking: true, error: '' }
    }));

    try {
      const response = await axios.get(`/api/auth/check-email?email=${encodeURIComponent(registerData.email)}`);
      const exists = response.data.exists;
      
      setValidation(prev => ({
        ...prev,
        email: { 
          ...prev.email, 
          isChecking: false, 
          exists: exists,
          error: exists ? 'อีเมลนี้ได้ลงทะเบียนไปแล้ว' : '' 
        }
      }));
    } catch (error) {
      console.error("Error checking email:", error);
      setValidation(prev => ({
        ...prev,
        email: { 
          ...prev.email, 
          isChecking: false,
          error: 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' 
        }
      }));
    }
  };

  // เช็คว่าขั้นตอนปัจจุบันมีข้อมูลครบหรือไม่
  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Role
        return !!registerData.role;
      case 2: // Personal Info
        if (!registerData.firstName || !registerData.lastName) return false;
        if (validation.firstName.error || validation.lastName.error) return false;
        
        if (registerData.role === "student") {
          if (!registerData.studentId || registerData.studentId.length !== 11) {
            return false;
          }
          // ตรวจสอบว่ามีข้อผิดพลาดในรหัสนิสิตหรือไม่
          if (validation.studentId.error || validation.studentId.exists) {
            return false;
          }
        }
        return true;
      case 3: // Major and Skills
        if (!registerData.major) return false;
        if (registerData.role === "student" && registerData.skills.length === 0) {
          return false;
        }
        return true;
      case 4: // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registerData.email)) return false;
        
        // ตรวจสอบว่ามีข้อผิดพลาดในอีเมลหรือไม่
        if (validation.email.error || validation.email.exists) {
          return false;
        }
        
        return true;
      case 5: // Profile (optional fields, always valid)
        return true;
      default:
        return false;
    }
  };

  const nextStep = async () => {
    // Clear previous errors
    setError("");
    
    // Check if this is the final step
    if (currentStep === 5) {
      // Final step, submit form
      handleSubmit();
      return;
    }
    
    // Case step 1-3, just move to next step
    if (currentStep < 4) {
      console.log(`Moving from step ${currentStep} to step ${currentStep + 1}`);
      setCurrentStep(currentStep + 1);
      return;
    }
    
    // For step 4 (Email validation and OTP)
    if (currentStep === 4) {
      // ตรวจสอบว่าอีเมลมีอยู่ในระบบแล้วหรือไม่ (อีกครั้ง)
      if (validation.email.exists) {
        setError("อีเมลนี้ได้ลงทะเบียนไปแล้ว กรุณาใช้อีเมลอื่น");
        return;
      }
      
      // Check if email was already verified or if it changed
      if (registerData.isEmailVerified && registerData.email === previousEmail) {
        // Email already verified and not changed - go directly to next step
        setCurrentStep(5);
        return;
      }
      
      // Email not verified or changed - send OTP
      setIsLoading(true);
      
      try {
        // Request an OTP for verification
        const response = await axios.get(`/api/auth/verify-otp?email=${encodeURIComponent(registerData.email)}`);
        
        if (response.data.success) {
          setPreviousEmail(registerData.email); // Save current email
          setShowOTP(true);
        } else {
          setError("Failed to send OTP. Please try again.");
        }
      } catch (error) {
        console.error("Failed to send OTP:", error);
        setError("An error occurred. Please try again later.");
      } finally {
        setIsLoading(false);
      }
      
      return;
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
    // Clear any errors when moving back
    setError("");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Create FormData to send files
      const formData = new FormData();
      
      // Add basic user data
      formData.append('firstName', registerData.firstName);
      formData.append('lastName', registerData.lastName);
      formData.append('email', registerData.email);
      formData.append('role', registerData.role);
      formData.append('major', registerData.major);
      
      // Add bio if provided
      if (registerData.bio) {
        formData.append('bio', registerData.bio);
      }
      
      // Add profile image if provided
      if (registerData.profileImage) {
        formData.append('profileImage', registerData.profileImage);
      }
      
      // เพิ่มฟิลด์เฉพาะของนิสิตเท่านั้น
      if (registerData.role === 'student') {
        // Add student ID
        if (registerData.studentId) {
          formData.append('studentId', registerData.studentId);
        }
        
        // Add skills as JSON string
        if (registerData.skills && registerData.skills.length > 0) {
          formData.append('skills', JSON.stringify(registerData.skills));
        }
        
        // Add student-specific fields
        if (registerData.basePrice !== undefined) {
          formData.append('basePrice', registerData.basePrice.toString());
        }
        
        if (registerData.isOpen !== undefined) {
          formData.append('isOpen', registerData.isOpen.toString());
        }
        
        // Add portfolio file if provided
        if (registerData.portfolioFile) {
          formData.append('portfolio', registerData.portfolioFile);
        }
        
        // Add gallery images if provided
        if (registerData.galleryImages && registerData.galleryImages.length > 0) {
          registerData.galleryImages.forEach((file, index) => {
            formData.append(`galleryImage${index}`, file);
          });
        }
      }
      
      // Send registration request
      const response = await axios.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // แสดงข้อความสำเร็จ
        setIsRegistrationSuccess(true);
        
        // รอ 2 วินาทีแล้วค่อยเปลี่ยนหน้า
        setTimeout(() => {
          router.push('/auth?state=login');
        }, 2000);
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Handle specific error messages from the server
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError("An error occurred during registration. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateRegisterData = (data: Partial<RegisterData>) => {
    // ถ้ามีการเปลี่ยนบทบาท
    if ('role' in data && data.role !== registerData.role) {
      const newData: Partial<RegisterData> = { ...data };
      
      // ถ้าเปลี่ยนจากนิสิตเป็นบทบาทอื่น ให้ลบฟิลด์ที่เกี่ยวข้องกับนิสิต
      if (data.role !== 'student') {
        newData.studentId = undefined;
        newData.skills = [];  // ใช้อาร์เรย์ว่างแทนการกำหนดเป็น undefined เพื่อหลีกเลี่ยงปัญหา TypeScript
        newData.basePrice = undefined;
        newData.isOpen = undefined;
        newData.portfolioFile = undefined;
        newData.galleryImages = undefined;
      } 
      // ถ้าเปลี่ยนเป็นนิสิต ให้กำหนดค่าเริ่มต้น
      else {
        newData.basePrice = 500;
        newData.isOpen = true;
        newData.skills = [];
      }
      
      setRegisterData(prev => ({ ...prev, ...newData }));
      return;
    }
    
    // If email is being updated, reset verification status
    if ('email' in data && data.email !== registerData.email) {
      setRegisterData(prev => ({ 
        ...prev, 
        ...data, 
        isEmailVerified: false 
      }));
      
      // Set email as touched
      setValidation(prev => ({
        ...prev,
        email: { ...prev.email, touched: true }
      }));
      return;
    } 
    
    // If firstName or lastName is updated, update name as well
    if ('firstName' in data || 'lastName' in data) {
      const updatedData = {
        ...data
      };
      
      // Create the full name by combining firstName and lastName
      const firstName = 'firstName' in data ? data.firstName : registerData.firstName;
      const lastName = 'lastName' in data ? data.lastName : registerData.lastName;
      
      // Only set name if both firstName and lastName are present
      if (firstName && lastName) {
        updatedData.name = `${firstName} ${lastName}`;
      }
      
      setRegisterData(prev => ({ ...prev, ...updatedData }));
      return;
    }
    
    // If studentId is updated, mark it as touched
    if ('studentId' in data) {
      setRegisterData(prev => ({ ...prev, ...data }));
      
      // Set studentId as touched
      setValidation(prev => ({
        ...prev,
        studentId: { ...prev.studentId, touched: true }
      }));
      return;
    }
    
    // Default case: just update the data
    setRegisterData(prev => ({ ...prev, ...data }));
  };

  // Handle name validation
  const handleNameValidation = (value: string, field: 'firstName' | 'lastName') => {
    // ให้รองรับทั้งภาษาไทยและภาษาอังกฤษ ไม่รับตัวเลขและอักขระพิเศษ
    const letterRegex = /^[ก-๙a-zA-Z\s]+$/;
    
    if (value === '' || letterRegex.test(value)) {
      setValidation(prev => ({
        ...prev,
        [field]: { error: '' }
      }));
      return true;
    } else {
      setValidation(prev => ({
        ...prev,
        [field]: { error: field === 'firstName' ? 'ชื่อต้องเป็นตัวอักษรเท่านั้น' : 'นามสกุลต้องเป็นตัวอักษรเท่านั้น' }
      }));
      return false;
    }
  };

  const handleOTPVerified = () => {
    // Mark email as verified
    updateRegisterData({ isEmailVerified: true });
    setShowOTP(false);
    setCurrentStep(5); // Move to profile step after OTP verification
  };

  const handleCroppedImage = (file: File) => {
    updateRegisterData({ profileImage: file });
    setCropImage(null);
  };

  // Handle gallery images
  const handleGalleryImages = (files: FileList) => {
    if (files && files.length > 0) {
      // Limit to max 6 images
      const newImages = Array.from(files).slice(0, 6);
      updateRegisterData({ galleryImages: newImages });
    }
  };

  // Touch email field
  const handleEmailTouched = () => {
    setValidation(prev => ({
      ...prev,
      email: { ...prev.email, touched: true }
    }));
  };

  // Touch studentId field
  const handleStudentIdTouched = () => {
    setValidation(prev => ({
      ...prev,
      studentId: { ...prev.studentId, touched: true }
    }));
  };

  return (
    <div className="max-w-[520px] max-h-[640px] w-full h-full bg-white m-3 p-6 flex flex-col gap-4 rounded-xl shadow-md overflow-auto">
      {isRegistrationSuccess ? (
        // หน้าสำเร็จ
        <div className="text-center py-4">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">สร้างบัญชีสำเร็จ</h2>
          <p className="text-gray-600 mb-6">
            กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
          </p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-blue-400 border-r-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        // หน้าลงทะเบียนปกติ
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-medium">สร้างบัญชีใหม่</h1>
            <span className="text-gray-500 text-sm">
              ขั้นตอน {currentStep} จาก 5
            </span>
          </div>

          <hr className="text-gray-200" />

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-6">
            {currentStep === 1 && (
              <StepRole 
                selectedRole={registerData.role} 
                onRoleSelect={(role) => updateRegisterData({ role })} 
              />
            )}

            {currentStep === 2 && (
              <StepPersonalInfo 
                data={registerData} 
                validation={validation}
                updateData={updateRegisterData}
                onValidateName={handleNameValidation}
                onStudentIdTouched={handleStudentIdTouched}
              />
            )}

            {currentStep === 3 && (
              <StepMajorAndSkills 
                data={registerData} 
                updateData={updateRegisterData} 
                skillCategories={skillCategories}
              />
            )}

            {currentStep === 4 && (
              <StepEmail 
                email={registerData.email}
                isVerified={registerData.isEmailVerified}
                validation={validation.email}
                onEmailChange={(email) => updateRegisterData({ email })}
                onEmailTouched={handleEmailTouched}
              />
            )}

            {currentStep === 5 && (
              <StepProfile 
                data={registerData} 
                updateData={updateRegisterData}
                onSelectImage={(imageUrl) => setCropImage(imageUrl)}
              />
            )}

            <div className="flex justify-between">
              {currentStep > 1 ? (
                <button 
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  ย้อนกลับ
                </button>
              ) : (
                <div></div> // Empty div to maintain layout
              )}

              <button 
                type="button"
                onClick={nextStep}
                disabled={!isStepValid() || isLoading}
                className={`btn-primary ${!isStepValid() || isLoading ? 'opacity-50 cursor-not-allowed' : ''} w-32 flex justify-center items-center`}
              >
                {isLoading && (
                  <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
                )}
                {currentStep < 5 ? 'ถัดไป' : 'สร้างบัญชี'}
              </button>
            </div>

            <div className="flex gap-2 justify-end text-sm">
              <p className="text-gray-400">มีบัญชีอยู่แล้ว ?</p>
              <button 
                type="button" 
                className="text-primary-blue-500 hover:text-primary-blue-400 hover:underline"
                onClick={onLoginClick}
              >
                ลงชื่อเข้าใช้
              </button>
            </div>
          </div>
        </>
      )}

      {showOTP && (
        <OTP 
          onClose={() => setShowOTP(false)} 
          onVerified={handleOTPVerified} 
          email={registerData.email}
        />
      )}
      
      {cropImage && (
        <ImageCropModal 
          imageSrc={cropImage} 
          onClose={() => setCropImage(null)} 
          onSave={handleCroppedImage} 
        />
      )}
    </div>
  );
}

export default RegisterForm;