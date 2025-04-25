import React from "react"

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'gray';
}

function Loading({ size = 'medium', color = 'primary' }: LoadingProps) {
  // Size mapping
  const sizeMap = {
    small: 'w-5 h-5 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  };
  
  // Color mapping
  const colorMap = {
    primary: 'border-primary-blue-400 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-300 border-t-transparent',
  };
  
  return (
    <div className="flex justify-center items-center">
      <div 
        className={`rounded-full animate-spin ${sizeMap[size]} ${colorMap[color]}`} 
        role="status" 
        aria-label="กำลังโหลด"
      ></div>
    </div>
  )
}

export default Loading