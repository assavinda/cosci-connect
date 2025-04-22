import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="w-full flex items-center justify-between mt-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          {/* Step indicator dot with animations */}
          <div className="flex flex-col items-center">
            <div 
              className={`h-6 w-6 rounded-full flex items-center justify-center transition-all duration-400 ease-in-out ${
                index + 1 === currentStep 
                  ? 'bg-primary-blue-500 text-white scale-110' 
                  : index + 1 < currentStep 
                    ? 'bg-primary-blue-300 text-white' 
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1 < currentStep ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            <span 
              className={`text-xs mt-1 transition-all duration-300 ${
                index + 1 === currentStep 
                  ? 'text-primary-blue-500 font-medium' 
                  : 'text-gray-500'
              }`}
            >
              {index === 0 && "บทบาท"}
              {index === 1 && "ข้อมูลส่วนตัว"}
              {index === 2 && "สาขา/ทักษะ"}
              {index === 3 && "อีเมล"}
              {index === 4 && "โปรไฟล์"}
            </span>
          </div>
          
          {/* Connector line between dots with animation */}
          {index < totalSteps - 1 && (
            <div className="relative h-0.5 flex-1">
              <div 
                className="absolute h-0.5 bg-gray-200 w-full"
              ></div>
              <div 
                className={`absolute h-0.5 bg-primary-blue-300 transition-all duration-500 ease-in-out`}
                style={{ 
                  width: index + 1 < currentStep ? '100%' : index + 1 === currentStep ? '50%' : '0%'
                }}
              ></div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default StepIndicator;