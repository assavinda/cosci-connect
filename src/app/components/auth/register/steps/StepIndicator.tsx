import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="w-full flex items-center justify-between mt-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          {/* Step indicator dot */}
          <div className="flex flex-col items-center">
            <div 
              className={`h-6 w-6 rounded-full flex items-center justify-center ${
                index + 1 === currentStep 
                  ? 'bg-primary-blue-500 text-white' 
                  : index + 1 < currentStep 
                    ? 'bg-primary-blue-300 text-white' 
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              <span className="text-xs font-medium">{index + 1}</span>
            </div>
            <span className="text-xs mt-1 text-gray-500">
              {index === 0 && "บทบาท"}
              {index === 1 && "ข้อมูลส่วนตัว"}
              {index === 2 && "สาขา/ทักษะ"}
              {index === 3 && "อีเมล"}
              {index === 4 && "โปรไฟล์"}
            </span>
          </div>
          
          {/* Connector line between dots (except after the last dot) */}
          {index < totalSteps - 1 && (
            <div 
              className={`h-0.5 flex-1 ${
                index + 1 < currentStep ? 'bg-primary-blue-300' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default StepIndicator;