'use client';

import React from 'react';

interface BasicInfoEditorProps {
  firstName: string;
  lastName: string;
  bio: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
}

const BasicInfoEditor: React.FC<BasicInfoEditorProps> = ({
  firstName,
  lastName,
  bio,
  onFirstNameChange,
  onLastNameChange,
  onBioChange
}) => {
  // Store first and last name in local storage for ProfileImageEditor
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFirstNameChange(value);
    localStorage.setItem('firstName', value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onLastNameChange(value);
    localStorage.setItem('lastName', value);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="firstName" className="text-lg font-medium mb-2">ชื่อ</label>
          <input
            type="text"
            id="firstName"
            className="input"
            value={firstName}
            onChange={handleFirstNameChange}
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="text-lg font-medium mb-2">นามสกุล</label>
          <input
            type="text"
            id="lastName"
            className="input"
            value={lastName}
            onChange={handleLastNameChange}
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="bio" className="text-lg font-medium mb-2">คำอธิบายตนเอง</label>
        <textarea
          id="bio"
          className="input min-h-24 resize-none"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="แนะนำตัวคุณสั้นๆ..."
          rows={4}
        />
      </div>
    </div>
  );
};

export default BasicInfoEditor;