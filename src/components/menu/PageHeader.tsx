import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  backAriaLabel?: string;
  backLabel?: string;
}

export default function PageHeader({
  title,
  onBack,
  backAriaLabel = 'Go back',
  backLabel = 'Back',
}: PageHeaderProps) {
  return (
    <header
      className="h-14 px-4 bg-white border-b border-[#E5E7EB] flex items-center justify-between shrink-0 sticky top-0 z-20"
      id="tools-drawer-header"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={backAriaLabel}
        id="menu-back-btn"
        className="min-w-[44px] h-11 px-2.5 -ml-2 flex items-center gap-1.5 rounded-[10px] text-[#111827] hover:text-[#076653] hover:bg-[#EBF7F2] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
      >
        <ArrowLeft className="w-5 h-5 text-[#6B7280]" strokeWidth={1.75} />
        <span className="text-sm font-medium">{backLabel}</span>
      </button>

      <h2 className="text-base font-semibold text-[#111827] truncate text-center">
        {title}
      </h2>

      <div className="min-w-[68px] h-11 -mr-2 shrink-0" aria-hidden="true" />
    </header>
  );
}
