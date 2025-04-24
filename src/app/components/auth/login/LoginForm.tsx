// src/app/components/auth/login/LoginForm.tsx
'use client';

import axios from "axios";
import Link from "next/link";
import { signIn } from "next-auth/react";
import React, { useState } from "react";
import OTP from "../otp/OTP";

interface LoginFormProps {
  onRegisterClick: () => void;
}

function LoginForm({ onRegisterClick }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    // Clear any previous errors
    setError("");
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Request an OTP
      const response = await axios.get(`/api/auth/verify-otp?email=${encodeURIComponent(email)}`);
      
      if (response.data.success) {
        // Show OTP verification
        setShowOTP(true);
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = async () => {
    setShowOTP(false);
    setIsLoading(true);
    
    try {
      // Use NextAuth to sign in the user
      const result = await signIn("email", {
        email,
        redirect: false,
      });
      
      if (result?.error) {
        setError(result.error);
      } else {
        // Success - redirect will be handled by NextAuth
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to login. Please try again.");
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

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="label">อีเมล</label>
          <input 
            type="email" 
            className="input"
            placeholder="example@g.swu.ac.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className={`btn-primary w-full flex justify-center items-center ${isLoading ? 'opacity-75' : ''}`}
          disabled={isLoading}
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

      {showOTP && <OTP onClose={() => setShowOTP(false)} onVerified={handleOTPVerified} />}
    </div>
  );
}

export default LoginForm;