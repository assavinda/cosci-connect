// src/app/components/auth/register/RegisterForm.tsx
'use client';

import React, { useState } from "react";
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
}

function RegisterForm({ onLoginClick }: RegisterFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [previousEmail, setPreviousEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  
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
    bio: ""
  });

  // เช็คว่าขั้นตอนปัจจุบันมีข้อมูลครบหรือไม่
  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Role
        return !!registerData.role;
      case 2: // Personal Info
        if (!registerData.firstName || !registerData.lastName) return false;
        if (registerData.role === "student" && (!registerData.studentId || registerData.studentId.length !== 11)) {
          return false;
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
        return emailRegex.test(registerData.email);
      case 5: // Profile (optional fields, always valid)
        return true;
      default:
        return false;
    }
  };

  const nextStep = async () => {
    // Clear previous errors
    setError("");
    
    if (currentStep === 4) {
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

    if (currentStep === 5) {
      // Final step, submit form
      handleSubmit();
      return;
    }

    setCurrentStep(currentStep + 1);
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
      
      // Add student ID if role is student
      if (registerData.role === 'student' && registerData.studentId) {
        formData.append('studentId', registerData.studentId);
      }
      
      // Add skills as JSON string
      formData.append('skills', JSON.stringify(registerData.skills));
      
      // Add bio if provided
      if (registerData.bio) {
        formData.append('bio', registerData.bio);
      }
      
      // Add profile image if provided
      if (registerData.profileImage) {
        formData.append('profileImage', registerData.profileImage);
      }
      
      // Add portfolio file if provided and role is student
      if (registerData.role === 'student' && registerData.portfolioFile) {
        formData.append('portfolio', registerData.portfolioFile);
      }
      
      // Send registration request
      const response = await axios.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // Registration successful, redirect to login
        router.push('/auth?state=login');
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
    // If email is being updated, reset verification status
    if ('email' in data && data.email !== registerData.email) {
      setRegisterData(prev => ({ 
        ...prev, 
        ...data, 
        isEmailVerified: false 
      }));
    } 
    // If firstName or lastName is updated, update name as well
    else if ('firstName' in data || 'lastName' in data) {
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
    }
    else {
      setRegisterData(prev => ({ ...prev, ...data }));
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

  return (
    <div className="max-w-[520px] max-h-[640px] w-full h-full bg-white m-3 p-6 flex flex-col gap-4 rounded-xl shadow-md overflow-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium">สร้างบัญชีใหม่</h1>
        <span className="text-gray-500 text-sm">
          ขั้นตอน {currentStep} จาก 5
        </span>
      </div>

      <hr className="text-gray-200" />
      
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={5} />

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
            updateData={updateRegisterData}
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
            onEmailChange={(email) => updateRegisterData({ email })}
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