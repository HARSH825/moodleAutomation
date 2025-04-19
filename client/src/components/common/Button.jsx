import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  variant = 'primary'
}) => {
  const baseClasses = "py-2 px-6 rounded-md font-medium transition duration-300 focus:outline-none";
  const variantClasses = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white shadow-md",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    outline: "border border-teal-600 text-teal-600 hover:bg-teal-50"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};
