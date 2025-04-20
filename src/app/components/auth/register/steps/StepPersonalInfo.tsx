import React, { useState, useEffect } from 'react';
import { RegisterData } from '../RegisterForm';

interface StepPersonalInfoProps {
  data: RegisterData;
  updateData: (data: Partial<RegisterData>) => void;
}

function StepPersonalInfo({ data, updateData }: StepPersonalInfoProps) {
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [studentIdError, setStudentIdError] = useState('');

  // Validate student ID pattern
  useEffect(() => {
    if (data.role === 'student' && data.studentId) {
      if (data.studentId.length !== 11) {
        setStudentIdError('รหัสนิสิตต้องมี 11 หลัก');
      } else if (data.studentId.substring(3, 8) !== '30010') {
        setStudentIdError('รหัสนิสิตไม่ถูกต้อง (ตัวเลขหลักที่ 4-8 ต้องเป็น 30010)');
      } else {
        setStudentIdError('');
      }
    } else {
      setStudentIdError('');
    }
  }, [data.studentId, data.role]);

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
          {firstNameError && (
            <p className="text-red-500 text-xs mt-1">{firstNameError}</p>
          )}
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
          {lastNameError && (
            <p className="text-red-500 text-xs mt-1">{lastNameError}</p>
          )}
        </div>
      </div>

      {data.role === 'student' && (
        <div>
          <label htmlFor="studentId" className="block text-gray-700 text-sm mb-1">
            รหัสนิสิต
          </label>
          <input
            type="text"
            id="studentId"
            className={`input ${studentIdError ? 'border-red-500' : ''}`}
            placeholder="รหัสนิสิต"
            value={data.studentId}
            onChange={handleStudentIdChange}
            required
          />
          {studentIdError && (
            <p className="text-red-500 text-xs mt-1">{studentIdError}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default StepPersonalInfo;