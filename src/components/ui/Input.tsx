import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
          placeholder:text-gray-400 text-gray-900
          focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300
          transition-colors duration-150
          disabled:opacity-50 disabled:bg-gray-50
          ${error ? "border-red-300 focus:ring-red-100" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
