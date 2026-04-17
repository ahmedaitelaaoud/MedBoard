import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = "", id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full px-3.5 py-2.5 pr-9 text-sm bg-white border border-gray-200 rounded-lg
            text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400
            transition-all duration-150 appearance-none cursor-pointer
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
