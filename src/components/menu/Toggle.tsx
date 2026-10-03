import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (nextChecked: boolean) => void;
  ariaLabel: string;
  id?: string;
  disabled?: boolean;
}

export default function Toggle({
  checked,
  onChange,
  ariaLabel,
  id,
  disabled = false,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="min-h-[44px] min-w-[44px] flex items-center justify-end cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653] focus-visible:ring-offset-2 rounded-[10px]"
    >
      <span
        className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors duration-150 ${
          checked
            ? 'bg-[#076653] menu-toggle-active justify-end'
            : 'bg-gray-300 dark:bg-gray-600 justify-start'
        }`}
      >
        <span className="w-5 h-5 rounded-full bg-white transition-transform duration-150" />
      </span>
    </button>
  );
}
