import React from 'react';
import { RegisterData } from '../RegisterForm';

interface ValidationState {
  studentId: {
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

interface StepPersonalInfoProps {
  data: RegisterData;
  validation: ValidationState;
  updateData: (data: Partial<RegisterData>) => void;
  onValidateName: (value: string, field: 'firstName' | 'lastName') => boolean;
  onStudentIdTouched: () => void;
}

function StepPersonalInfo({ 
  data, 
  validation, 
  updateData, 
  onValidateName,
  onStudentIdTouched
}: StepPersonalInfoProps) {

  // Handle name input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'firstName' | 'lastName') => {
    const { value } = e.target;
    
    // Validate name
    if (onValidateName(value, field)) {
      updateData({ [field]: value });
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
            className={`input ${validation.firstName.error ? 'border-red-500' : ''}`}
            placeholder="ชื่อจริง"
            value={data.firstName}
            onChange={(e) => handleNameChange(e, 'firstName')}
            required
          />
          <div className="relative py-2">
            {validation.firstName.error && (
              <p className="text-red-500 text-xs absolute">{validation.firstName.error}</p>
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
            className={`input ${validation.lastName.error ? 'border-red-500' : ''}`}
            placeholder="นามสกุล"
            value={data.lastName}
            onChange={(e) => handleNameChange(e, 'lastName')}
            required
          />
          <div className="relative py-2">
            {validation.lastName.error && (
              <p className="text-red-500 text-xs absolute">{validation.lastName.error}</p>
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
              className={`input ${validation.studentId.error ? 'border-red-500' : validation.studentId.touched && !validation.studentId.exists && data.studentId.length === 11 ? 'border-green-500' : ''}`}
              placeholder="รหัสนิสิต"
              value={data.studentId}
              onChange={handleStudentIdChange}
              onBlur={onStudentIdTouched}
              required
            />
            
            {/* แสดงไอคอนสถานะการตรวจสอบรหัสนิสิต */}
            {data.studentId && data.studentId.length === 11 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {validation.studentId.isChecking ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-r-transparent rounded-full animate-spin"></div>
                ) : validation.studentId.exists ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                ) : !validation.studentId.error ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                ) : null}
              </div>
            )}
          </div>
          <div className="relative py-2">
            {validation.studentId.error && (
              <p className="text-red-500 text-xs absolute">{validation.studentId.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StepPersonalInfo;