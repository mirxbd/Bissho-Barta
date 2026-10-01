import React from 'react';
import bisshoBartaLogoUrl from '../assets/images/bissho_barta_logo_1789231157825.jpg';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
  onClick?: () => void;
}

export const BISSHO_BARTA_LOGO_URL = bisshoBartaLogoUrl;

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
  onClick
}) => {
  const sizeMap = {
    xs: { img: 'w-5 h-5', text: 'text-xs', iconBox: 'rounded-md' },
    sm: { img: 'w-6 h-6', text: 'text-sm', iconBox: 'rounded-lg' },
    md: { img: 'w-8 h-8', text: 'text-base', iconBox: 'rounded-xl' },
    lg: { img: 'w-10 h-10', text: 'text-lg', iconBox: 'rounded-2xl' },
    xl: { img: 'w-14 h-14', text: 'text-2xl', iconBox: 'rounded-2xl' }
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      id="bissho-barta-app-brand-logo"
    >
      <div className={`relative overflow-hidden shrink-0 shadow-xs border border-[#076653]/30 bg-[#0C342C] ${selectedSize.img} ${selectedSize.iconBox}`}>
        <img
          src={bisshoBartaLogoUrl}
          alt="Bissho Barta"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight text-[#076653] dark:text-[#E3EF26] ${selectedSize.text} ${textClassName}`}>
            Bissho <span className="text-gray-900 dark:text-white">Barta</span>
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span className="text-[10px] text-gray-500 font-medium tracking-wide">
              World News & Social
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AppLogo;
