// src/app/components/auth/login/LoginForm.tsx
'use client';

import axios from "axios";
import Link from "next/link";
import { signIn } from "next-auth/react";
import React, { useState, useEffect } from "react";
import OTP from "../otp/OTP";

interface LoginFormProps {
  onRegisterClick: () => void;
}

function LoginForm({ onRegisterClick }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [error, setError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  // ตรวจสอบอีเมลเมื่อผู้ใช้พิมพ์และแล้วหยุดพิมพ์
  useEffect(() => {
    // กำหนด timeout สำหรับการตรวจสอบหลังจากผู้ใช้หยุดพิมพ์
    const delayCheck = setTimeout(() => {
      if (email && emailTouched) {
        checkEmailExists();
      }
    }, 500);

    return () => clearTimeout(delayCheck);
  }, [email, emailTouched]);

  // ตรวจสอบว่าอีเมลมีในระบบหรือไม่
  const checkEmailExists = async () => {
    if (!email || !isValidEmail(email)) return;

    setIsChecking(true);
    setError("");

    try {
      const response = await axios.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      setEmailExists(response.data.exists);
      
      if (!response.data.exists) {
        setError("อีเมลนี้ยังไม่ได้ลงทะเบียนในระบบ");
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailExists(false);
    } finally {
      setIsChecking(false);
    }
  };

  // ตรวจสอบรูปแบบอีเมล
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailTouched(true);
    
    if (!e.target.value) {
      setEmailExists(false);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !emailExists) return;
    
    // Clear any previous errors
    setError("");
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Request an OTP
      const response = await axios.get(`/api/auth/verify-otp?email=${encodeURIComponent(email)}`);
      console.log("OTP request response:", response.data);
      
      if (response.data.success) {
        // Show OTP verification
        setShowOTP(true);
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      
      // แสดงข้อความเอเร่อจาก API ถ้ามี
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError("An error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // OTP ถูกต้องและต้องการล็อกอินทันที
  const handleOTPVerified = async () => {
    // ซ่อนหน้าต่าง OTP
    setShowOTP(false);
    // แสดงสถานะกำลังโหลด
    setIsLoading(true);
    
    try {
      // ล็อกอินโดยตรงไม่ผ่านการยืนยันอีเมลซ้ำ
      // เราใช้ "credentials" เพื่อล็อกอินด้วยอีเมลเท่านั้น
      const result = await signIn("credentials", {
        email: email,
        redirect: false,
        callbackUrl: "/"
      });
      
      // ถ้าล็อกอินสำเร็จ
      if (!result?.error) {
        // Redirect ไปหน้าหลัก
        window.location.href = "/";
      } else {
        // ถ้ามีข้อผิดพลาด
        setError(result.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองอีกครั้ง");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[520px] max-h-[640px] w-full h-full bg-white m-3 p-6 flex flex-col gap-4 rounded-xl shadow-md">
      <div>
        <h1 className="text-xl font-medium">ลงชื่อเข้าใช้งาน</h1>
      </div>

      <hr className="text-gray-300"/>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="label">อีเมล</label>
          <div className="relative">
            <input 
              type="email" 
              className={`input ${
                email && (
                  isChecking ? 'border-gray-400' : 
                  emailExists ? 'border-green-500' : 
                  error ? 'border-red-500' : ''
                )
              }`}
              placeholder="example@g.swu.ac.th"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => setEmailTouched(true)}
              required
            />
            
            {/* แสดงไอคอนสถานะการตรวจสอบอีเมล */}
            {email && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isChecking ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-r-transparent rounded-full animate-spin"></div>
                ) : emailExists ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                ) : email && emailTouched ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                ) : null}
              </div>
            )}
          </div>
          <div className="relative py-2">
            {error && (
              <p className="text-xs text-red-500 absolute">
                {error}
              </p>
            )}
          </div>
          
        </div>
        
        <button 
          type="submit" 
          className={`btn-primary w-full flex justify-center items-center ${
            isLoading || isChecking || !email || !emailExists ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          disabled={isLoading || isChecking || !email || !emailExists}
        >
          {isLoading ? (
            <span className="inline-block h-5 w-5 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
          ) : null}
          ลงชื่อเข้าใช้
        </button>
        <div className="flex gap-2 text-sm">
          <p className="text-gray-400">ยังไม่มีบัญชี ?</p>
          <button 
            type="button" 
            className="text-primary-blue-500 hover:text-primary-blue-400 hover:underline"
            onClick={onRegisterClick}
          >
            สร้างบัญชี
          </button>
        </div>
      </form>

      {/* ส่งอีเมลไปด้วยเพื่อใช้ในการตรวจสอบ OTP */}
      {showOTP && <OTP onClose={() => setShowOTP(false)} onVerified={handleOTPVerified} email={email} />}
    </div>
  );
}

export default LoginForm;