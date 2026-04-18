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
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg
          placeholder:text-gray-400 dark:placeholder:text-slate-500 text-gray-900 dark:text-slate-100
          focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400
          transition-all duration-150
          disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-slate-800
          ${error ? "border-red-300 focus:ring-red-200/50 focus:border-red-400" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
