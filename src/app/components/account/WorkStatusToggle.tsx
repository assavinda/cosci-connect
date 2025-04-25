'use client';

import React from 'react';

interface WorkStatusToggleProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

const WorkStatusToggle: React.FC<WorkStatusToggleProps> = ({ isOpen, onToggle }) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">สถานะการรับงาน</h3>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isOpen
              ? 'bg-green-100 text-green-700 border-2 border-green-300'
              : 'bg-gray-100 text-gray-500 border border-gray-300'
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          พร้อมรับงาน
        </button>
        
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            !isOpen
              ? 'bg-red-100 text-red-700 border-2 border-red-300'
              : 'bg-gray-100 text-gray-500 border border-gray-300'
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${!isOpen ? 'bg-red-500' : 'bg-gray-400'}`}></span>
          ไม่พร้อมรับงาน
        </button>
      </div>
    </div>
  );
};

export default WorkStatusToggle;