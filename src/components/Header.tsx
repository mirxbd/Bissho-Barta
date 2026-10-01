import { ComponentType, useState, useEffect, useRef } from 'react';
import { Home, Search, Play, Bell, Sparkles, Users, Check, X, Globe, Newspaper, Moon, Sun, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchSource } from '../types';
import AppLogo from './AppLogo';

interface HeaderProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  unreadNotificationsCount: number;
  unreadMessagesCount?: number;
  onProfileClick: () => void;
  userAvatar: string;
  onOpenToolsDrawer?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  searchSource?: SearchSource;
  setSearchSource?: (source: SearchSource) => void;
}

interface TabItem {
  id: number;
  label: string;
  badge: number;
  icon?: ComponentType<{ className?: string; fill?: string; strokeWidth?: number }>;
  isProfile?: boolean;
}

export default function Header({
  activeTab,
  setActiveTab,
  unreadNotificationsCount,
  unreadMessagesCount = 0,
  userAvatar,
  onOpenToolsDrawer,
  searchQuery = '',
  setSearchQuery,
  searchSource = 'fb',
  setSearchSource
}: HeaderProps) {
  const [isPrefPopoverOpen, setIsPrefPopoverOpen] = useState(false);
  const [feedPreference, setFeedPreference] = useState<'For you' | 'Feeds'>(() => {
    return (localStorage.getItem('home_feed_preference') as 'For you' | 'Feeds') || 'For you';
  });
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('nightMode') === 'true';
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync preference with external changes
  useEffect(() => {
    const handlePrefChange = (e: any) => {
      if (e.detail && (e.detail === 'For you' || e.detail === 'Feeds')) {
        setFeedPreference(e.detail);
      }
    };
    const handleNightModeChange = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setIsNightMode(e.detail);
      }
    };
    window.addEventListener('feed-preference-changed', handlePrefChange);
    window.addEventListener('nightmode-setting-changed', handleNightModeChange);
    return () => {
      window.removeEventListener('feed-preference-changed', handlePrefChange);
      window.removeEventListener('nightmode-setting-changed', handleNightModeChange);
    };
  }, []);

  const toggleNightMode = () => {
    const nextState = !isNightMode;
    setIsNightMode(nextState);
    localStorage.setItem('nightMode', String(nextState));
    if (nextState) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('nightmode-setting-changed', { detail: nextState }));
  };

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPrefPopoverOpen(false);
      }
    };

    if (isPrefPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPrefPopoverOpen]);

  const handleSelectPreference = (pref: 'For you' | 'Feeds') => {
    setFeedPreference(pref);
    localStorage.setItem('home_feed_preference', pref);
    window.dispatchEvent(new CustomEvent('feed-preference-changed', { detail: pref }));
    setIsPrefPopoverOpen(false);
    // Switch to Home tab immediately
    setActiveTab(0);
  };

  const tabs: TabItem[] = [
    { id: 0, icon: Home, label: 'Home', badge: 0 },
    { id: 3, icon: Play, label: 'Watch', badge: 0 },
    { id: 2, icon: MessageCircle, label: 'Messages', badge: unreadMessagesCount || 0 },
    { id: 5, label: 'Profile', badge: 0, isProfile: true }
  ];

  return (
    <div className="sticky top-0 z-[60] w-full select-none" id="app-global-header-wrapper">
      {/* Upper Row / Top Utility Bar: Left Content Preference, Center Search Box, Right Notification */}
      <div className="bg-white border-b border-gray-100 px-2.5 sm:px-3 py-1 flex items-center justify-between gap-2 text-gray-800 h-8 sm:h-9 relative" id="top-utility-bar">
        {/* Left Side: Brand Logo & Custom Content Preference */}
        <div className="relative shrink-0 flex items-center gap-1.5">
          <AppLogo
            size="xs"
            showText={false}
            onClick={() => setActiveTab(0)}
            className="hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0"
          />
          <button
            ref={buttonRef}
            onClick={() => setIsPrefPopoverOpen(!isPrefPopoverOpen)}
            className={`relative p-1 rounded-full transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
              isPrefPopoverOpen
                ? 'bg-[#EBF7F2] text-[#076653] ring-1 ring-[#076653]/40'
                : 'text-gray-700 hover:text-[#076653] hover:bg-[#EBF7F2]'
            }`}
            id="topbar-content-preference-btn"
            title="Content Preference (For you / Feeds)"
            aria-label="Content Preference (For you / Feeds)"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Top-Left and Bottom-Right corner brackets */}
              <path d="M14 3.5H6.5A3 3 0 0 0 3.5 6.5V14" />
              <path d="M10 20.5h7.5a3 3 0 0 0 3-3V10" />
              
              {/* Thumbs Up (Top Right) */}
              <path d="M13 9.5h4.2a1.3 1.3 0 0 0 1.3-1.3v-.4a1.3 1.3 0 0 0-1.3-1.3h-1.5l.8-2.3a1 1 0 0 0-.9-1.4h-.3a1 1 0 0 0-.8.5L13.2 6a2 2 0 0 0-.2.8v2.7z" fill="currentColor" />
              <rect x="11.5" y="6.5" width="1.8" height="3.5" rx="0.5" fill="currentColor" />

              {/* Thumbs Down (Bottom Left) */}
              <path d="M11 14.5H6.8a1.3 1.3 0 0 0-1.3 1.3v.4a1.3 1.3 0 0 0 1.3 1.3h1.5l-.8 2.3a1 1 0 0 0 .9 1.4h.3a1 1 0 0 0 .8-.5l2.2-2.7a2 2 0 0 0 .2-.8v-2.7z" fill="currentColor" />
              <rect x="10.7" y="14" width="1.8" height="3.5" rx="0.5" fill="currentColor" />
            </svg>
          </button>

          {/* COMPACT CONTENT PREFERENCE POPUP */}
          <AnimatePresence>
            {isPrefPopoverOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 overflow-hidden"
                id="header-content-preference-popover"
              >
                <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Feed View
                </div>

                <div className="space-y-0.5 px-1">
                  {/* Option 1: For you */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreference('For you')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-[11px] font-semibold ${
                      feedPreference === 'For you'
                        ? 'bg-[#EBF7F2] text-[#076653] font-bold'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    id="pref-option-for-you-btn"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className={`w-3.5 h-3.5 ${feedPreference === 'For you' ? 'text-[#076653]' : 'text-gray-500'}`} />
                      <span>For you</span>
                    </div>
                    {feedPreference === 'For you' && (
                      <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#076653]" />
                    )}
                  </button>

                  {/* Option 2: Feeds */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreference('Feeds')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-[11px] font-semibold ${
                      feedPreference === 'Feeds'
                        ? 'bg-[#EBF7F2] text-[#076653] font-bold'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    id="pref-option-feeds-btn"
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className={`w-3.5 h-3.5 ${feedPreference === 'Feeds' ? 'text-[#076653]' : 'text-gray-500'}`} />
                      <span>Feeds</span>
                    </div>
                    {feedPreference === 'Feeds' && (
                      <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#076653]" />
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="my-1.5 border-t border-gray-100"></div>

                {/* Night Mode Toggle inside Content Preference */}
                <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Appearance
                </div>

                <div className="px-1">
                  <button
                    type="button"
                    onClick={toggleNightMode}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-[11px] font-semibold ${
                      isNightMode
                        ? 'bg-[#16362e] text-[#E3EF26]'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    id="pref-option-nightmode-btn"
                  >
                    <div className="flex items-center gap-1.5">
                      {isNightMode ? (
                        <Moon className="w-3.5 h-3.5 text-[#E3EF26] fill-[#E3EF26]" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-gray-500" />
                      )}
                      <span>Night Mode</span>
                    </div>
                    <div
                      className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${
                        isNightMode ? 'bg-[#076653] justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-white shadow-xs"></span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center: Search Box with 2 Toggle Bar (Bissho Barta / Web) */}
        <div className="flex-1 max-w-md mx-auto relative flex items-center gap-1.5" id="topbar-search-box-wrapper">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#076653]/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                if (setSearchQuery) {
                  setSearchQuery(e.target.value);
                }
              }}
              onFocus={() => {
                if (activeTab !== 6) {
                  setActiveTab(6);
                }
              }}
              placeholder={searchSource === 'web' ? "Search Google web..." : "Search Bissho Barta public posts..."}
              className="w-full bg-[#F2FAF6] hover:bg-[#EBF7F2] focus:bg-white text-gray-900 text-xs rounded-full h-6.5 sm:h-7 pl-7.5 pr-6 transition-all duration-150 focus:outline-none focus:ring-1.5 focus:ring-[#076653]/40 border border-transparent focus:border-[#076653]/40"
              id="topbar-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  if (setSearchQuery) setSearchQuery('');
                }}
                className="absolute right-1.5 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors cursor-pointer flex items-center justify-center"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 2 TOGGLE BAR: BISSHO BARTA vs WEB */}
          <div className="bg-[#EBF7F2] p-0.5 rounded-full flex items-center border border-[#076653]/20 shrink-0 shadow-2xs" id="topbar-search-toggle-bar">
            <button
              type="button"
              onClick={() => {
                setSearchSource?.('fb');
                if (activeTab !== 6 && searchQuery) setActiveTab(6);
              }}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-all flex items-center gap-0.5 cursor-pointer leading-tight ${
                searchSource === 'fb'
                  ? 'bg-[#076653] text-[#E3EF26] shadow-2xs'
                  : 'text-[#076653] hover:text-[#065042]'
              }`}
              title="Search Social Media (All Public Posts)"
              id="topbar-search-toggle-fb"
            >
              <Newspaper className="w-2.5 h-2.5" />
              <span>Bissho Barta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchSource?.('web');
                if (activeTab !== 6 && searchQuery) setActiveTab(6);
              }}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-all flex items-center gap-0.5 cursor-pointer leading-tight ${
                searchSource === 'web'
                  ? 'bg-[#076653] text-[#E3EF26] shadow-2xs'
                  : 'text-[#076653] hover:text-[#065042]'
              }`}
              title="Search Web (Google Data)"
              id="topbar-search-toggle-web"
            >
              <Globe className="w-2.5 h-2.5" />
              <span>Web</span>
            </button>
          </div>
        </div>

        {/* Right Side: Notification Icon */}
        <button
          onClick={() => setActiveTab(4)}
          className={`relative p-1 rounded-full text-gray-600 hover:text-[#076653] hover:bg-[#EBF7F2] transition-colors cursor-pointer active:scale-95 flex items-center justify-center shrink-0 ${
            activeTab === 4 ? 'text-[#076653] bg-[#EBF7F2]' : ''
          }`}
          id="topbar-notification-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 shrink-0" fill={activeTab === 4 ? "currentColor" : "none"} strokeWidth={activeTab === 4 ? 2.5 : 2} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#0C342C] text-[#E3EF26] text-[8px] font-black h-3.5 min-w-[14px] px-0.5 flex items-center justify-center rounded-full border border-[#E3EF26]/40 shadow-xs leading-none animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white border-b border-gray-100 text-gray-800 px-2 sm:px-3 flex items-center justify-center shadow-xs h-8 sm:h-9 w-full" id="app-global-header">
        {/* Centered Navigation Tabs - All Same Size and Spacing */}
        <div className="flex items-center gap-1 sm:gap-2 justify-center h-full w-full max-w-sm" id="header-navigation-tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-full flex-1 flex items-center justify-center relative cursor-pointer group transition-all duration-200 active:scale-95 ${
                  isActive 
                    ? 'text-[#076653]' 
                    : 'text-gray-400 hover:text-[#076653]'
                }`}
                id={`header-tab-btn-${tab.id}`}
                aria-label={tab.label}
                title={tab.label}
              >
                {/* Subtle hover background ring/pill */}
                {!isActive && (
                  <div className="absolute inset-y-1 inset-x-0.5 rounded-lg transition-all duration-200 group-hover:bg-[#EBF7F2]/60" />
                )}

                {/* Icon / Profile container */}
                <div className="relative flex items-center justify-center z-10">
                  {tab.isProfile ? (
                    <div className={`w-4.5 h-4.5 rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'ring-1.5 ring-[#076653] ring-offset-1 scale-105 shadow-xs' 
                        : 'border border-gray-300 hover:border-[#076653] group-hover:scale-105'
                    }`}>
                      <img 
                        src={userAvatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    Icon && (
                      <Icon 
                        className={`w-4 h-4 transition-all duration-300 shrink-0 ${
                          isActive ? 'scale-105' : 'group-hover:scale-105'
                        }`} 
                        fill={isActive ? "currentColor" : "none"}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    )
                  )}

                  {/* Badge for Notifications or other updates */}
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#0C342C] text-[#E3EF26] text-[8px] font-black h-3 min-w-[12px] px-0.5 flex items-center justify-center rounded-full border border-[#E3EF26]/40 shadow-xs leading-none animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>

                {/* Active Bottom Bar Indicator */}
                {isActive && (
                  <div 
                    className="absolute bottom-0 left-1 right-1 h-[2px] bg-[#076653] rounded-t-full z-20" 
                    id={`active-bar-${tab.id}`} 
                  />
                )}
              </button>
            );
          })}

          {/* 3 ||| BAR MENU BUTTON - RIGHT SIDE AFTER PROFILE ICON */}
          <button
            onClick={onOpenToolsDrawer}
            className="h-full flex-1 flex items-center justify-center relative cursor-pointer group transition-all duration-200 active:scale-95 text-[#0C342C] hover:text-[#076653]"
            title="Menu"
            id="header-tools-menu-btn"
            aria-label="Menu"
          >
            <div className="absolute inset-y-1 inset-x-0.5 rounded-lg transition-all duration-200 group-hover:bg-[#EBF7F2]/60" />
            <span className="font-mono font-bold text-xs text-[#0C342C] group-hover:text-[#076653] group-hover:scale-105 transition-transform duration-200 z-10 leading-none tracking-tighter">
              |||
            </span>
          </button>
        </div>
      </header>
    </div>
  );
}
