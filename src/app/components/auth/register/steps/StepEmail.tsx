import React from 'react';

interface EmailValidation {
  isChecking: boolean;
  exists: boolean;
  error: string;
  touched: boolean;
}

interface StepEmailProps {
  email: string;
  isVerified: boolean;
  validation: EmailValidation;
  onEmailChange: (email: string) => void;
  onEmailTouched: () => void;
}

function StepEmail({ email, isVerified, validation, onEmailChange, onEmailTouched }: StepEmailProps) {
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-gray-800">อีเมล</h2>
        <p className="text-gray-500 text-sm">
          กรอกอีเมลของคุณเพื่อใช้ในการเข้าสู่ระบบ
        </p>
      </div>

      <div className="relative">
        <label htmlFor="email" className="block text-gray-700 text-sm mb-1">
          อีเมล
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            className={`input pr-10 ${
              validation.error ? 'border-red-500' : 
              isVerified ? 'border-green-500' : 
              validation.touched && !validation.exists && !validation.isChecking ? 'border-green-500' : ''
            }`}
            placeholder="example@g.swu.ac.th"
            value={email}
            onChange={handleEmailChange}
            onBlur={onEmailTouched}
            required
          />
          
          {/* แสดงไอคอนสถานะการตรวจสอบอีเมล */}
          {email && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {validation.isChecking ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-r-transparent rounded-full animate-spin"></div>
              ) : isVerified ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : validation.exists ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              ) : validation.touched && !validation.error ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : null}
            </div>
          )}
        </div>

        <div className='relative py-2'>
          {isVerified ? (
            <div className="absolute">
              <p className="text-green-500 text-xs mt-1">
                อีเมลได้รับการยืนยันแล้ว
              </p>
            </div>
          ) : (
            <div className="absolute">
            {validation.error ? (
                <p className="text-red-500 text-xs">
                  {validation.error}
                </p>
              ) : (
              <p className="text-xs text-gray-500">
                คุณจะได้รับรหัส OTP ทางอีเมลนี้เพื่อยืนยันตัวตน
              </p>)
            }
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span className="font-medium">หมายเหตุ</span>
        </div>
        {isVerified ? (
          <p className="text-gray-600 text-sm mt-1">
            อีเมลนี้ได้รับการยืนยันแล้ว คุณสามารถดำเนินการต่อได้ทันที
            หากต้องการเปลี่ยนอีเมล คุณจะต้องยืนยันอีเมลใหม่อีกครั้ง
          </p>
        ) : (
          <p className="text-gray-600 text-sm mt-1">
            เมื่อกดปุ่มถัดไป ระบบจะส่งรหัส OTP ไปยังอีเมลของคุณ 
            กรุณาตรวจสอบว่าอีเมลถูกต้องก่อนดำเนินการต่อ
          </p>
        )}
      </div>
    </div>
  );
}

export default StepEmail;