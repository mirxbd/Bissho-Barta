import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsRowProps {
  icon?: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  active?: boolean;
  id?: string;
}

export default function SettingsRow({
  icon: Icon,
  label,
  description,
  onClick,
  rightElement,
  showChevron = false,
  active = false,
  id,
}: SettingsRowProps) {
  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
        {Icon && (
          <Icon
            className={`w-5 h-5 shrink-0 transition-colors duration-150 ${
              active ? 'text-[#076653]' : 'text-[#6B7280]'
            }`}
            strokeWidth={1.75}
          />
        )}
        <div className="min-w-0 flex-1 text-left">
          <div
            className={`text-[15px] font-medium leading-snug ${
              active ? 'text-[#076653]' : 'text-[#111827]'
            }`}
          >
            {label}
          </div>
          {description && (
            <p className="text-xs text-[#6B7280] mt-0.5 leading-normal">
              {description}
            </p>
          )}
        </div>
      </div>

      {rightElement && <div className="shrink-0 flex items-center">{rightElement}</div>}

      {showChevron && !rightElement && (
        <ChevronRight
          className="w-5 h-5 text-[#6B7280] shrink-0"
          strokeWidth={1.75}
        />
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        id={id}
        className={`w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#076653] ${
          active ? 'bg-[#EBF7F2]' : 'hover:bg-[#F3F4F6]/70'
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      id={id}
      className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between"
    >
      {content}
    </div>
  );
}
