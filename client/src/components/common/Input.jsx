import React from 'react';

export const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  label,
  required = false,
  className = '',
  autoComplete = 'on',
  isPassword = false
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent ${className}`}
      />
    </div>
  );
};