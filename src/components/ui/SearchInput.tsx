import React from "react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function SearchInput({ className = "", onClear, value, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        className={`
          w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
          placeholder:text-gray-400 text-gray-900
          focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400
          transition-all duration-150
          ${className}
        `}
        value={value}
        {...props}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
