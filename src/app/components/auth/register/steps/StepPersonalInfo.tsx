import React, { useState, useEffect } from 'react';
import { RegisterData } from '../RegisterForm';
import axios from 'axios';

interface StepPersonalInfoProps {
  data: RegisterData;
  updateData: (data: Partial<RegisterData>) => void;
}

function StepPersonalInfo({ data, updateData }: StepPersonalInfoProps) {
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [studentIdError, setStudentIdError] = useState('');
  const [isCheckingStudentId, setIsCheckingStudentId] = useState(false);
  const [studentIdExists, setStudentIdExists] = useState(false);
  const [studentIdTouched, setStudentIdTouched] = useState(false);

  // Validate student ID pattern
  useEffect(() => {
    if (data.role === 'student' && data.studentId) {
      if (data.studentId.length !== 11) {
        setStudentIdError('รหัสนิสิตต้องมี 11 หลัก');
      } else if (!/^[0-9]+$/.test(data.studentId)) {
        setStudentIdError('รหัสนิสิตต้องเป็นตัวเลขเท่านั้น');
      } else if (data.studentId.substring(3, 8) !== '30010') {
        setStudentIdError('รหัสนิสิตไม่ถูกต้อง');
      } else {
        // ถ้ารูปแบบถูกต้อง และรหัสนิสิตเคยถูกกรอกแล้ว (touched)
        // ให้ตรวจสอบว่ามีรหัสนิสิตนี้ในระบบแล้วหรือไม่
        if (studentIdTouched) {
          checkStudentIdExists(data.studentId);
        } else {
          setStudentIdError('');
        }
      }
    } else {
      setStudentIdError('');
    }
  }, [data.studentId, data.role, studentIdTouched]);

  // ตรวจสอบว่ารหัสนิสิตมีในระบบแล้วหรือไม่
  const checkStudentIdExists = async (studentId: string) => {
    if (!studentId || studentId.length !== 11) return;

    setIsCheckingStudentId(true);
    setStudentIdError('');

    try {
      const response = await axios.get(`/api/auth/check-student-id?studentId=${encodeURIComponent(studentId)}`);
      setStudentIdExists(response.data.exists);
      
      if (response.data.exists) {
        setStudentIdError('มีผู้ใช้งานรหัสนิสิตนี้แล้ว');
      }
    } catch (error: any) {
      console.error("Error checking student ID:", error);
    } finally {
      setIsCheckingStudentId(false);
    }
  };

  // Validate only letters in name fields
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'firstName' | 'lastName') => {
    const { value } = e.target;
    
    // ให้รองรับทั้งภาษาไทยและภาษาอังกฤษ ไม่รับตัวเลขและอักขระพิเศษ
    const letterRegex = /^[ก-๙a-zA-Z\s]+$/;
    
    if (value === '' || letterRegex.test(value)) {
      updateData({ [field]: value });
      if (field === 'firstName') {
        setFirstNameError('');
      } else {
        setLastNameError('');
      }
    } else {
      if (field === 'firstName') {
        setFirstNameError('ชื่อต้องเป็นตัวอักษรเท่านั้น');
      } else {
        setLastNameError('นามสกุลต้องเป็นตัวอักษรเท่านั้น');
      }
    }
  };

  // Handle student ID input (numbers only)
  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // Allow only numbers and limit to 11 digits
    if (/^\d*$/.test(value) && value.length <= 11) {
      updateData({ studentId: value });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-gray-800">ข้อมูลส่วนตัว</h2>
        <p className="text-gray-500 text-sm">กรอกข้อมูลส่วนตัวของคุณ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-gray-700 text-sm mb-1">
            ชื่อ
          </label>
          <input
            type="text"
            id="firstName"
            className={`input ${firstNameError ? 'border-red-500' : ''}`}
            placeholder="ชื่อจริง"
            value={data.firstName}
            onChange={(e) => handleNameChange(e, 'firstName')}
            required
          />
          <div className="relative py-2">
            {firstNameError && (
              <p className="text-red-500 text-xs absolute">{firstNameError}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-gray-700 text-sm mb-1">
            นามสกุล
          </label>
          <input
            type="text"
            id="lastName"
            className={`input ${lastNameError ? 'border-red-500' : ''}`}
            placeholder="นามสกุล"
            value={data.lastName}
            onChange={(e) => handleNameChange(e, 'lastName')}
            required
          />
          <div className="relative py-2">
            {lastNameError && (
              <p className="text-red-500 text-xs absolute">{lastNameError}</p>
            )}
          </div>
        </div>
      </div>

      {data.role === 'student' && (
        <div>
          <label htmlFor="studentId" className="block text-gray-700 text-sm mb-1">
            รหัสนิสิต
          </label>
          <div className="relative">
            <input
              type="text"
              id="studentId"
              className={`input ${studentIdError ? 'border-red-500' : studentIdTouched && !studentIdExists && data.studentId.length === 11 ? 'border-green-500' : ''}`}
              placeholder="รหัสนิสิต"
              value={data.studentId}
              onChange={handleStudentIdChange}
              onBlur={() => setStudentIdTouched(true)}
              required
            />
            
            {/* แสดงไอคอนสถานะการตรวจสอบรหัสนิสิต */}
            {data.studentId && data.studentId.length === 11 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isCheckingStudentId ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-r-transparent rounded-full animate-spin"></div>
                ) : studentIdExists ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                ) : !studentIdError ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                ) : null}
              </div>
            )}
          </div>
          <div className="relative py-2">
            {studentIdError && (
              <p className="text-red-500 text-xs absolute">{studentIdError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StepPersonalInfo;