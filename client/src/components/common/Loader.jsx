import React from 'react';

export const Loader = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-teal-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};