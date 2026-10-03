import React from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  id?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`bg-[#F3F4F6] dark:bg-gray-800 p-1 rounded-[10px] border border-[#E5E7EB] flex items-center gap-1 ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            id={option.id}
            onClick={() => onChange(option.value)}
            className={`flex-1 min-h-[44px] px-3 py-2 rounded-[8px] text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653] ${
              isSelected
                ? 'bg-white text-[#076653] font-semibold border border-[#E5E7EB]'
                : 'text-[#6B7280] font-medium hover:text-[#111827]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
