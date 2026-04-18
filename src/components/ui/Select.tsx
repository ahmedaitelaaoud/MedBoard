"use client";

import React, { useEffect, useRef, useState } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  options,
  className = "",
  id,
  value,
  defaultValue,
  onChange,
  disabled,
  name,
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, "-");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(() => {
    if (typeof defaultValue === "string") return defaultValue;
    return options[0]?.value ?? "";
  });

  const isControlled = typeof value === "string";
  const currentValue = isControlled ? String(value) : internalValue;
  const selectedOption = options.find((opt) => opt.value === currentValue) ?? options[0];

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const applySelection = (nextValue: string) => {
    if (!isControlled) setInternalValue(nextValue);
    setOpen(false);

    if (onChange) {
      const syntheticEvent = {
        target: { value: nextValue },
        currentTarget: { value: nextValue },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;

      onChange(syntheticEvent);
    }
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={
            "w-full px-3.5 py-2.5 pr-9 text-left text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed " +
            className
          }
        >
          <span className="block truncate">{selectedOption?.label ?? "—"}</span>
        </button>

        {name && <input type="hidden" name={name} value={currentValue} />}

        {open && !disabled && (
          <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
            <ul role="listbox" className="max-h-64 overflow-auto py-1 scrollbar-thin">
              {options.map((opt) => {
                const isActive = opt.value === currentValue;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => applySelection(opt.value)}
                      className={
                        "w-full px-3.5 py-2 text-sm text-left transition-colors " +
                        (isActive
                          ? "bg-brand-600 text-white"
                          : "text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800")
                      }
                    >
                      {opt.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <svg
          className={
            "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500 pointer-events-none transition-transform duration-200 " +
            (open ? "rotate-180" : "")
          }
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
