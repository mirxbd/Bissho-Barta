import { ComponentType, useState, useEffect } from 'react';
import {
  Home,
  Search,
  Play,
  Bell,
  Users,
  X,
  MessageCircle,
  Menu,
  Sparkles,
} from 'lucide-react';
import { SearchSource } from '../types';
import {
  FeedPreferenceMode,
  getStoredFeedPreference,
  updateFeedPreferenceState,
} from '../utils/contentPreference';

interface HeaderProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  unreadNotificationsCount: number;
  unreadMessagesCount?: number;
  pendingRequestsCount?: number;
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
  pendingRequestsCount = 0,
  userAvatar,
  onOpenToolsDrawer,
  searchQuery = '',
  setSearchQuery,
}: HeaderProps) {
  const [feedMode, setFeedMode] = useState<FeedPreferenceMode>(() =>
    getStoredFeedPreference()
  );

  useEffect(() => {
    const handlePrefChanged = () => {
      setFeedMode(getStoredFeedPreference());
    };
    window.addEventListener('feed-preference-changed', handlePrefChanged);
    return () =>
      window.removeEventListener('feed-preference-changed', handlePrefChanged);
  }, []);

  const handleSelectMode = (nextMode: FeedPreferenceMode) => {
    setFeedMode(nextMode);
    updateFeedPreferenceState(nextMode);
    if (activeTab !== 0) {
      setActiveTab(0);
    }
  };

  const tabs: TabItem[] = [
    { id: 0, icon: Home, label: 'Home', badge: 0 },
    { id: 1, icon: Users, label: 'Friends', badge: pendingRequestsCount },
    { id: 3, icon: Play, label: 'Watch', badge: 0 },
    { id: 2, icon: MessageCircle, label: 'Messages', badge: unreadMessagesCount || 0 },
    { id: 5, label: 'Profile', badge: 0, isProfile: true },
  ];

  return (
    <div className="sticky top-0 z-[60] w-full select-none" id="app-global-header-wrapper">
      {/* Top Bar: Logo + Feed Switch (For You / Following), Search, and Notification Bell */}
      <div
        className="bg-white border-b border-gray-100 px-2.5 sm:px-3 py-1 flex items-center justify-between gap-2 text-gray-800 h-9 sm:h-10 relative"
        id="top-utility-bar"
      >
        {/* Left Side: Feed Mode Icon Switch */}
        <button
          type="button"
          onClick={() => handleSelectMode(feedMode === 'For you' ? 'Following' : 'For you')}
          id="header-feed-mode-icon-btn"
          aria-label={feedMode === 'For you' ? 'Switch to Following feed' : 'Switch to For You feed'}
          title={feedMode === 'For you' ? 'For You (Tap to switch to Following)' : 'Following (Tap to switch to For You)'}
          className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 border active:scale-95 ${
            feedMode === 'For you'
              ? 'bg-[#EBF7F2] text-[#076653] border-[#076653]/30 hover:bg-[#076653] hover:text-white'
              : 'bg-[#076653] text-[#E3EF26] border-[#076653] hover:bg-[#0C342C]'
          }`}
        >
          {feedMode === 'For you' ? (
            <Sparkles className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          ) : (
            <Users className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          )}
        </button>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md mx-auto relative flex items-center" id="topbar-search-box-wrapper">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#076653]/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery?.(e.target.value);
                if (activeTab !== 6) {
                  setActiveTab(6);
                }
              }}
              onFocus={() => {
                if (activeTab !== 6) {
                  setActiveTab(6);
                }
              }}
              placeholder="Search Bissho Barta or Web..."
              className="w-full bg-[#F2FAF6] hover:bg-[#EBF7F2] focus:bg-white text-gray-900 text-xs rounded-full h-7 pl-7.5 pr-6 transition-all duration-150 focus:outline-none focus:ring-1.5 focus:ring-[#076653]/40 border border-transparent focus:border-[#076653]/40"
              id="topbar-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery?.('')}
                className="absolute right-1.5 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors cursor-pointer flex items-center justify-center"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Notification Bell */}
        <button
          onClick={() => setActiveTab(4)}
          className={`relative p-1 rounded-full text-gray-600 hover:text-[#076653] hover:bg-[#EBF7F2] transition-colors cursor-pointer active:scale-95 flex items-center justify-center shrink-0 ${
            activeTab === 4 ? 'text-[#076653] bg-[#EBF7F2]' : ''
          }`}
          id="topbar-notification-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell
            className="w-4 h-4 shrink-0"
            fill={activeTab === 4 ? 'currentColor' : 'none'}
            strokeWidth={activeTab === 4 ? 2.5 : 2}
          />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#0C342C] text-[#E3EF26] text-[8px] font-black h-3.5 min-w-[14px] px-0.5 flex items-center justify-center rounded-full border border-[#E3EF26]/40 shadow-xs leading-none">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Navigation Header */}
      <header
        className="bg-white border-b border-gray-100 text-gray-800 px-2 sm:px-3 flex items-center justify-center shadow-xs h-8 sm:h-9 w-full"
        id="app-global-header"
      >
        <div
          className="flex items-center gap-1 sm:gap-2 justify-center h-full w-full max-w-sm"
          id="header-navigation-tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-full flex-1 flex items-center justify-center relative cursor-pointer group transition-all duration-200 active:scale-95 ${
                  isActive ? 'text-[#076653]' : 'text-gray-400 hover:text-[#076653]'
                }`}
                id={`header-tab-btn-${tab.id}`}
                aria-label={tab.label}
                title={tab.label}
              >
                {!isActive && (
                  <div className="absolute inset-y-1 inset-x-0.5 rounded-lg transition-all duration-200 group-hover:bg-[#EBF7F2]/60" />
                )}

                <div className="relative flex items-center justify-center z-10">
                  {tab.isProfile ? (
                    <div
                      className={`w-4.5 h-4.5 rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'ring-1.5 ring-[#076653] ring-offset-1 scale-105 shadow-xs'
                          : 'border border-gray-300 hover:border-[#076653] group-hover:scale-105'
                      }`}
                    >
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
                        fill={isActive ? 'currentColor' : 'none'}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    )
                  )}

                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#0C342C] text-[#E3EF26] text-[8px] font-black h-3 min-w-[12px] px-0.5 flex items-center justify-center rounded-full border border-[#E3EF26]/40 shadow-xs leading-none">
                      {tab.badge}
                    </span>
                  )}
                </div>

                {isActive && (
                  <div
                    className="absolute bottom-0 left-1 right-1 h-[2px] bg-[#076653] rounded-t-full z-20"
                    id={`active-bar-${tab.id}`}
                  />
                )}
              </button>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={onOpenToolsDrawer}
            className="h-full flex-1 flex items-center justify-center relative cursor-pointer group transition-colors duration-150 text-[#6B7280] hover:text-[#076653] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
            title="Menu"
            id="header-tools-menu-btn"
            aria-label="Open menu"
          >
            <div className="absolute inset-y-1 inset-x-0.5 rounded-lg transition-colors duration-150 group-hover:bg-[#EBF7F2]/60" />
            <Menu className="w-5 h-5 shrink-0 z-10 transition-colors duration-150" strokeWidth={1.75} />
          </button>
        </div>
      </header>
    </div>
  );
}
