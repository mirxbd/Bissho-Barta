import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Zap,
  BadgeCheck,
  Sliders,
  HelpCircle,
  Moon,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { UserProfile, Post, Friend } from '../types';
import {
  getStoredVideoResolution,
  setStoredVideoResolution,
  VideoResolutionSetting,
} from '../utils/mediaOptimizer';
import {
  FeedPreferenceMode,
  getStoredFeedPreference,
  updateFeedPreferenceState,
} from '../utils/contentPreference';
import PageHeader from './menu/PageHeader';
import SettingsGroup from './menu/SettingsGroup';
import SettingsRow from './menu/SettingsRow';
import Toggle from './menu/Toggle';
import SettingsPrivacyScreen from './menu/SettingsPrivacyScreen';
import ControlPanelScreen from './menu/ControlPanelScreen';
import ToolsScreen from './menu/ToolsScreen';
import ContentPreferenceScreen from './menu/ContentPreferenceScreen';
import VerificationScreen from './menu/VerificationScreen';
import SupportScreen from './menu/SupportScreen';
import SavedPostsScreen from './SavedPostsScreen';
import { Bookmark } from 'lucide-react';

interface ToolsMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  posts?: Post[];
  friends?: Friend[];
  updateUserProfile?: (profile: UserProfile) => void;
  onShowToast?: (msg: string) => void;
  activeTab?: number;
  onNavigateTab?: (tabId: number) => void;
}

type MenuScreenId = 'settings' | 'control_panel' | 'verification' | 'tools' | 'preferences' | 'support' | 'saved_posts';

const SCREEN_TITLES: Record<MenuScreenId, string> = {
  settings: 'Settings and Privacy',
  control_panel: 'Control Panel',
  verification: 'Verification',
  tools: 'Tools',
  preferences: 'Content Preference',
  support: 'Support',
  saved_posts: 'Saved Posts',
};

export default function ToolsMenuDrawer({
  isOpen,
  onClose,
  profile,
  posts = [],
  friends = [],
  updateUserProfile,
  onShowToast,
  onNavigateTab,
}: ToolsMenuDrawerProps) {
  const [selectedScreen, setSelectedScreen] = useState<MenuScreenId | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  // Content & Media Preference States
  const [reducedSensitive, setReducedSensitive] = useState<boolean>(() => {
    return localStorage.getItem('reducedSensitiveContent') !== 'false';
  });
  const [autoplayVideos, setAutoplayVideos] = useState<boolean>(() => {
    return localStorage.getItem('autoplayVideos') !== 'false';
  });
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    return localStorage.getItem('dataSaver') === 'true';
  });
  const [videoResolution, setVideoResolution] = useState<VideoResolutionSetting>(() =>
    getStoredVideoResolution()
  );
  const [feedPreference, setFeedPreference] = useState<FeedPreferenceMode>(() =>
    getStoredFeedPreference()
  );
  const [darkModeActive, setDarkModeActive] = useState<boolean>(() => {
    return (
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('nightMode') === 'true'
    );
  });

  useEffect(() => {
    const handleNightModeChange = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setDarkModeActive(e.detail);
      }
    };
    const handleFeedPrefChange = () => {
      setFeedPreference(getStoredFeedPreference());
    };
    window.addEventListener('nightmode-setting-changed', handleNightModeChange);
    window.addEventListener('feed-preference-changed', handleFeedPrefChange);
    return () => {
      window.removeEventListener('nightmode-setting-changed', handleNightModeChange);
      window.removeEventListener('feed-preference-changed', handleFeedPrefChange);
    };
  }, []);

  const handleToggleDarkMode = (nextState: boolean) => {
    setDarkModeActive(nextState);
    localStorage.setItem('nightMode', String(nextState));
    if (nextState) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(
      new CustomEvent('nightmode-setting-changed', { detail: nextState })
    );
    onShowToast?.(nextState ? 'Night mode enabled' : 'Light mode enabled');
  };

  const handleChangeFeedPreference = (pref: FeedPreferenceMode) => {
    setFeedPreference(pref);
    updateFeedPreferenceState(pref);
    onShowToast?.(
      pref === 'For you'
        ? 'Feed set to For You (Viral Trends)'
        : 'Feed set to Following (Latest Posts)'
    );
  };

  const handleChangeVideoResolution = (res: VideoResolutionSetting) => {
    setVideoResolution(res);
    setStoredVideoResolution(res);
    onShowToast?.(`Video resolution set to ${res}`);
  };

  const handleToggleReducedSensitive = (nextState: boolean) => {
    setReducedSensitive(nextState);
    localStorage.setItem('reducedSensitiveContent', String(nextState));
    window.dispatchEvent(
      new CustomEvent('sensitive-content-changed', { detail: nextState })
    );
    onShowToast?.(
      nextState ? 'Sensitive content filter enabled' : 'Sensitive content filter off'
    );
  };

  const handleToggleAutoplay = (nextState: boolean) => {
    setAutoplayVideos(nextState);
    localStorage.setItem('autoplayVideos', String(nextState));
    window.dispatchEvent(
      new CustomEvent('autoplay-setting-changed', { detail: nextState })
    );
    onShowToast?.(nextState ? 'Autoplay enabled' : 'Autoplay off');
  };

  const handleToggleDataSaver = (nextState: boolean) => {
    setDataSaver(nextState);
    localStorage.setItem('dataSaver', String(nextState));
    window.dispatchEvent(
      new CustomEvent('datasaver-setting-changed', { detail: nextState })
    );
    onShowToast?.(nextState ? 'Data Saver enabled' : 'Data Saver off');
  };

  const handleSaveProfile = (name: string, bio: string) => {
    updateUserProfile?.({
      ...profile,
      name,
      bio,
    });
    onShowToast?.('Profile settings updated.');
  };

  const handleHeaderBack = () => {
    if (selectedScreen !== null) {
      setSelectedScreen(null);
    } else {
      onClose();
    }
  };

  const currentTitle = selectedScreen ? SCREEN_TITLES[selectedScreen] : 'Menu';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (above Header z-[60]) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[70]"
            id="tools-menu-backdrop"
          />

          {/* Full-screen page on mobile / clean sheet on desktop (z-[75] so PageHeader is never covered by Header) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto w-full sm:max-w-md bg-[#F3F4F6] z-[75] flex flex-col overflow-hidden sm:border-l sm:border-[#E5E7EB]"
            id="tools-menu-drawer"
          >
            {/* Single Header Only: Back arrow on left, single centered title, nothing else */}
            <PageHeader
              title={currentTitle}
              onBack={handleHeaderBack}
              backAriaLabel={selectedScreen ? 'Back to Menu' : 'Close Menu'}
              backLabel="Back"
            />

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto bg-[#F3F4F6]">
              <AnimatePresence mode="wait" initial={false}>
                {selectedScreen === null ? (
                  <motion.div
                    key="menu-root"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="p-4 space-y-6"
                  >
                    {/* Top of the Menu: Profile row (avatar, name, "See your profile" in secondary text) */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab?.(5);
                        onClose();
                      }}
                      id="menu-profile-row"
                      className="w-full min-h-[64px] p-4 bg-white rounded-[12px] border border-[#E5E7EB] flex items-center justify-between text-left transition-colors duration-150 hover:bg-[#F3F4F6]/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="w-12 h-12 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="text-base font-semibold text-[#111827] truncate">
                            {profile.name}
                          </div>
                          <div className="text-xs text-[#6B7280] mt-0.5">
                            See your profile
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className="w-5 h-5 text-[#6B7280] shrink-0"
                        strokeWidth={1.75}
                      />
                    </button>

                    {/* Group 1: Account */}
                    <SettingsGroup title="Account">
                      <SettingsRow
                        id="menu-item-control-panel"
                        icon={Shield}
                        label="Control Panel"
                        rightElement={
                          <span className="px-2 py-0.5 bg-[#E3EF26] text-[#0C342C] text-[10px] font-black rounded-full uppercase tracking-wider">
                            New
                          </span>
                        }
                        showChevron
                        onClick={() => setSelectedScreen('control_panel')}
                      />
                      <SettingsRow
                        id="menu-item-settings"
                        icon={Settings}
                        label="Settings and Privacy"
                        showChevron
                        onClick={() => setSelectedScreen('settings')}
                      />
                      <SettingsRow
                        id="menu-item-saved-posts"
                        icon={Bookmark}
                        label="Saved Posts"
                        showChevron
                        onClick={() => setSelectedScreen('saved_posts')}
                      />
                      <SettingsRow
                        id="menu-item-verification"
                        icon={BadgeCheck}
                        label="Verification"
                        showChevron
                        onClick={() => setSelectedScreen('verification')}
                      />
                    </SettingsGroup>

                    {/* Group 2: Creator */}
                    <SettingsGroup title="Creator">
                      <SettingsRow
                        id="menu-item-tools"
                        icon={Zap}
                        label="Tools"
                        showChevron
                        onClick={() => setSelectedScreen('tools')}
                      />
                    </SettingsGroup>

                    {/* Group 3: Preferences */}
                    <SettingsGroup title="Preferences">
                      <SettingsRow
                        id="menu-item-preferences"
                        icon={Sliders}
                        label="Content Preference"
                        showChevron
                        onClick={() => setSelectedScreen('preferences')}
                      />
                      <SettingsRow
                        id="menu-item-nightmode"
                        icon={Moon}
                        label="Night Mode"
                        rightElement={
                          <Toggle
                            checked={darkModeActive}
                            onChange={handleToggleDarkMode}
                            ariaLabel="Toggle Night Mode"
                          />
                        }
                      />
                    </SettingsGroup>

                    {/* Group 4: Help */}
                    <SettingsGroup title="Help">
                      <SettingsRow
                        id="menu-item-support"
                        icon={HelpCircle}
                        label="Support"
                        showChevron
                        onClick={() => setSelectedScreen('support')}
                      />
                    </SettingsGroup>

                    {/* Separate full-width outline Logout button in red text */}
                    <div className="pt-2 pb-4">
                      <button
                        type="button"
                        id="menu-item-logout"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full h-11 bg-white border border-red-600 text-red-600 hover:bg-red-50 font-semibold text-sm rounded-[10px] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                      >
                        Log Out
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedScreen}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {selectedScreen === 'control_panel' && (
                      <ControlPanelScreen
                        profile={profile}
                        friends={friends}
                        onShowToast={onShowToast}
                        onBack={() => setSelectedScreen(null)}
                      />
                    )}

                    {selectedScreen === 'settings' && (
                      <SettingsPrivacyScreen
                        profile={profile}
                        friends={friends}
                        videoResolution={videoResolution}
                        onChangeVideoResolution={handleChangeVideoResolution}
                        onSaveProfile={handleSaveProfile}
                        onShowToast={onShowToast}
                        onBack={() => setSelectedScreen(null)}
                      />
                    )}

                    {selectedScreen === 'tools' && (
                      <ToolsScreen
                        profile={profile}
                        posts={posts}
                        onShowToast={onShowToast}
                        onBack={() => setSelectedScreen(null)}
                      />
                    )}

                    {selectedScreen === 'preferences' && (
                      <ContentPreferenceScreen
                        feedPreference={feedPreference}
                        onChangeFeedPreference={handleChangeFeedPreference}
                        videoResolution={videoResolution}
                        onChangeVideoResolution={handleChangeVideoResolution}
                        reducedSensitive={reducedSensitive}
                        onToggleReducedSensitive={handleToggleReducedSensitive}
                        autoplayVideos={autoplayVideos}
                        onToggleAutoplayVideos={handleToggleAutoplay}
                        dataSaver={dataSaver}
                        onToggleDataSaver={handleToggleDataSaver}
                        darkModeActive={darkModeActive}
                        onToggleDarkMode={handleToggleDarkMode}
                        onBack={() => setSelectedScreen(null)}
                      />
                    )}

                    {selectedScreen === 'verification' && (
                      <VerificationScreen
                        profile={profile}
                        verificationSubmitted={verificationSubmitted}
                        onSubmitVerification={() => {
                          setVerificationSubmitted(true);
                          onShowToast?.('Demo: Verification request submitted.');
                        }}
                        onBack={() => setSelectedScreen(null)}
                      />
                    )}

                    {selectedScreen === 'saved_posts' && (
                      <SavedPostsScreen
                        posts={posts}
                        profile={profile}
                        onClose={() => setSelectedScreen(null)}
                        onShowToast={onShowToast}
                      />
                    )}

                    {selectedScreen === 'support' && (
                      <SupportScreen
                        onShowToast={onShowToast}
                        onBack={() => setSelectedScreen(null)}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
              {showLogoutConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="fixed inset-0 bg-black/50 z-[85] flex items-center justify-center p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="logout-confirm-title"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm bg-white rounded-[12px] border border-[#E5E7EB] p-6 space-y-4"
                  >
                    <div className="space-y-2">
                      <h3
                        id="logout-confirm-title"
                        className="text-base font-semibold text-[#111827]"
                      >
                        Log out of Bissho Barta?
                      </h3>
                      <p className="text-sm text-[#6B7280] leading-relaxed">
                        You are currently using Bissho Barta in demo mode. Confirming will close the menu session preview.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 h-11 bg-white border border-[#076653] text-[#076653] hover:bg-[#EBF7F2] font-semibold text-sm rounded-[10px] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLogoutConfirm(false);
                          onClose();
                          onShowToast?.(
                            'Demo mode: No live account session is connected to log out.'
                          );
                        }}
                        className="flex-1 h-11 bg-white border border-red-600 text-red-600 hover:bg-red-50 font-semibold text-sm rounded-[10px] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                      >
                        Log Out
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
