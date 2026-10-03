import React from 'react';

interface SettingsGroupProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function SettingsGroup({
  title,
  children,
  className = '',
}: SettingsGroupProps) {
  return (
    <section className={`space-y-2 ${className}`}>
      {title && (
        <h3 className="text-base font-semibold text-[#111827] px-1">
          {title}
        </h3>
      )}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] divide-y divide-[#E5E7EB] overflow-hidden">
        {children}
      </div>
    </section>
  );
}
