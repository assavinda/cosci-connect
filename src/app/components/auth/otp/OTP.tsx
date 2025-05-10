// src/app/components/auth/otp/OTP.tsx
import axios from "axios";
import React, { useState, useRef, useEffect } from "react";

interface OTPProps {
  onClose: () => void;
  onVerified?: () => void;
  email?: string; // Optional email for resending OTP
}

function OTP({ onClose, onVerified, email }: OTPProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState("");

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const timerInterval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
      
      return () => clearInterval(timerInterval);
    }
  }, [timer]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // ล็อกอินอัตโนมัติหลังจากแสดงข้อความสำเร็จ
  useEffect(() => {
    if (isSuccess && onVerified) {
      const autoLogin = setTimeout(() => {
        onVerified();
      }, 1500); // รอ 1.5 วินาทีเพื่อให้ผู้ใช้เห็นข้อความสำเร็จ
      
      return () => clearTimeout(autoLogin);
    }
  }, [isSuccess, onVerified]);

  const handleInputChange = (index: number, value: string) => {
    // Clear any previous errors
    setError("");
    
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;
    
    // Create a new copy of OTP array
    const newOtp = [...otp];
    
    // Update the value at specified index
    // If pasting multiple digits, only take the first one
    newOtp[index] = value.substring(0, 1);
    setOtp(newOtp);
    
    // Move to next input if current input is filled
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input when backspace is pressed on an empty input
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    
    // Check if pasted content is all digits
    if (!/^\d+$/.test(pastedData)) return;
    
    // Fill the OTP inputs with the pasted digits
    const digits = pastedData.substring(0, 6).split("");
    const newOtp = [...otp];
    
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });
    
    setOtp(newOtp);
    
    // Focus the appropriate input field after paste
    if (digits.length < 6 && inputRefs.current[digits.length]) {
      inputRefs.current[digits.length]?.focus();
    }
  };

  const verifyOtp = async () => {
    // Check if all OTP fields are filled
    if (otp.some(digit => digit === "")) {
      setError("กรุณากรอก OTP ให้ครบทุกช่อง");
      return;
    }
    
    if (!email) {
      setError("ไม่พบอีเมล กรุณาลองใหม่อีกครั้ง");
      return;
    }
    
    // Show loading state
    setIsVerifying(true);
    setError("");
    
    // Get the full OTP
    const enteredOtp = otp.join("");
    
    // สร้างข้อมูลที่จะส่ง
    const payload = {
      email,
      otp: enteredOtp
    };
    
    console.log("Sending verification data:", payload);
    
    try {
      // Call the API to verify OTP
      const response = await axios.post('/api/auth/verify-otp', payload);
      
      console.log("Verification response:", response.data);
      
      if (response.data.success) {
        // แสดงข้อความสำเร็จ
        setIsSuccess(true);
        // onVerified จะถูกเรียกอัตโนมัติจาก useEffect หลังจากแสดงข้อความสำเร็จ
      } else {
        setError("OTP ไม่ถูกต้อง กรุณาลองอีกครั้ง");
        setIsVerifying(false);
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      
      // แสดงข้อความเอเร่อจาก API ถ้ามี
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError("OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองอีกครั้ง");
      }
      setIsVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (!email) {
      setError("ไม่สามารถส่ง OTP ใหม่ได้");
      return;
    }
    
    // Reset the OTP inputs
    setOtp(["", "", "", "", "", ""]);
    
    // Reset the timer
    setTimer(60);
    
    // Clear any errors
    setError("");
    
    // Focus the first input
    inputRefs.current[0]?.focus();
    
    try {
      // Call API to resend OTP
      const response = await axios.get(`/api/auth/verify-otp?email=${encodeURIComponent(email)}`);
      
      console.log("Resend OTP response:", response.data);
      
      if (!response.data.success) {
        setError("ไม่สามารถส่ง OTP ใหม่ได้ กรุณาลองอีกครั้ง");
      }
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      
      // แสดงข้อความเอเร่อจาก API ถ้ามี
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      }
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        {!isSuccess ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-gray-800">ยืนยัน OTP</h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {email && (
              <p className="text-gray-600 mb-1">
                ส่ง OTP ไปยัง: <span className="font-medium">{email}</span>
              </p>
            )}
            
            <p className="text-gray-600 mb-6">
              รหัส OTP ได้ถูกส่งไปยังอีเมลของท่าน กรุณากรอกรหัสเพื่อยืนยันตัวตน
            </p>
            
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInputChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-12 h-12 text-center text-xl font-medium border ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:border-primary-blue-400 focus:ring focus:ring-primary-blue-200 focus:outline-none`}
                />
              ))}
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mb-4 text-center">
                {error}
              </div>
            )}
            
            <button
              onClick={verifyOtp}
              disabled={isVerifying || otp.some(digit => digit === "")}
              className={`btn-primary w-full flex justify-center items-center ${
                isVerifying || otp.some(digit => digit === "") ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isVerifying ? (
                <span className="inline-block h-5 w-5 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
              ) : null}
              ยืนยัน OTP
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                ไม่ได้รับรหัส OTP?{' '}
                {timer > 0 ? (
                  <span className="text-gray-500">
                    ส่งรหัสใหม่ได้ในอีก {timer} วินาที
                  </span>
                ) : (
                  <button
                    onClick={resendOtp}
                    className="text-primary-blue-500 hover:text-primary-blue-400 hover:underline"
                  >
                    ส่งรหัสใหม่
                  </button>
                )}
              </p>
            </div>
          </>
        ) : (
          // แสดงข้อความเมื่อยืนยัน OTP สำเร็จ
          <div className="text-center py-4">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">ยืนยันตัวตนสำเร็จ</h2>
            <p className="text-gray-600 mb-6">
              กรุณารอสักครู่...
            </p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-primary-blue-400 border-r-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OTP;