import Link from "next/link"
import React, { useState } from "react"
import OTP from "../otp/OTP"

interface LoginFormProps {
  onRegisterClick: () => void;
}

function LoginForm({ onRegisterClick }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    // Show loading state
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Show OTP verification
      setShowOTP(true);
    }, 1000);
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

        {showOTP && <OTP onClose={() => setShowOTP(false)} />}
    </div>
  )
}
export default LoginForm