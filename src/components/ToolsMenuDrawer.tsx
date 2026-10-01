import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Settings,
  Zap,
  BadgeCheck,
  Sliders,
  HelpCircle,
  LogOut,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Users,
  BarChart2,
  CreditCard,
  Sparkles,
  Activity,
  Moon,
  Sun,
  ShieldCheck,
  Lock,
  Bell,
  User,
  CheckCircle2,
  MessageSquare,
  Home,
  Play,
  Search
} from 'lucide-react';
import { UserProfile } from '../types';
import AppLogo from './AppLogo';

interface ToolsMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  updateUserProfile?: (profile: UserProfile) => void;
  onShowToast?: (msg: string) => void;
  activeTab?: number;
  onNavigateTab?: (tabId: number) => void;
}

type MenuItemId = 'tools' | 'verification' | 'settings' | 'preferences' | 'support' | 'logout';

export default function ToolsMenuDrawer({
  isOpen,
  onClose,
  profile,
  updateUserProfile,
  onShowToast,
  activeTab,
  onNavigateTab,
}: ToolsMenuDrawerProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItemId | null>(null);

  // Tools Sub-Navigation Tab State
  const [toolsTab, setToolsTab] = useState<'dashboard' | 'analytics' | 'monetization'>('dashboard');

  // Sub-Navigation Tabs State for Dashboard, Analytics, Monetization
  const [dashTab, setDashTab] = useState<'overview' | 'growth' | 'activity'>('overview');
  const [analyticsTab, setAnalyticsTab] = useState<'performance' | 'demographics' | 'content'>('performance');
  const [monetizationTab, setMonetizationTab] = useState<'balance' | 'payouts' | 'tips'>('balance');

  // Settings Tabs State
  const [settingsTab, setSettingsTab] = useState<'account' | 'privacy' | 'security' | 'notifications'>('account');

  // Content Preference State
  const [reducedSensitive, setReducedSensitive] = useState<boolean>(() => {
    return localStorage.getItem('reducedSensitiveContent') !== 'false';
  });
  const [autoplayVideos, setAutoplayVideos] = useState<boolean>(() => {
    return localStorage.getItem('autoplayVideos') !== 'false';
  });
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    return localStorage.getItem('dataSaver') === 'true';
  });
  const [homeFeedPref, setHomeFeedPref] = useState<'Following' | 'Suggested'>('Following');
  const [darkModeActive, setDarkModeActive] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('nightMode') === 'true';
  });

  useEffect(() => {
    const handleNightModeChange = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setDarkModeActive(e.detail);
      }
    };
    window.addEventListener('nightmode-setting-changed', handleNightModeChange);
    return () => window.removeEventListener('nightmode-setting-changed', handleNightModeChange);
  }, []);

  // Settings Fields State
  const [editedName, setEditedName] = useState(profile.name);
  const [editedBio, setEditedBio] = useState(profile.bio);

  // Verification & Support State
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  const menuListItems: Array<{
    id: MenuItemId;
    label: string;
    icon: React.ElementType;
    desc: string;
    color: string;
    bgColor: string;
    danger?: boolean;
  }> = [
    {
      id: 'tools',
      label: 'Tools',
      icon: Zap,
      desc: 'Dashboard, Analytics & Monetization',
      color: 'text-[#076653]',
      bgColor: 'bg-[#EBF7F2]',
    },
    {
      id: 'verification',
      label: 'Verification',
      icon: BadgeCheck,
      desc: 'Identity & Badge Status',
      color: 'text-[#076653]',
      bgColor: 'bg-[#EBF7F2]',
    },
    {
      id: 'settings',
      label: 'Settings and Privacy',
      icon: Settings,
      desc: 'Account, Security & Privacy Settings',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
    },
    {
      id: 'preferences',
      label: 'Content Preference',
      icon: Sliders,
      desc: 'Feeds, Topics & Appearance',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'support',
      label: 'Support',
      icon: HelpCircle,
      desc: 'Help Center & Contact',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: LogOut,
      desc: 'Sign out of your account',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      danger: true,
    },
  ];

  const handleSelectMenuItem = (id: MenuItemId) => {
    if (id === 'logout') {
      onShowToast?.('Logged out successfully');
      onClose();
      return;
    }
    setSelectedItem(id);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateUserProfile) {
      updateUserProfile({
        ...profile,
        name: editedName,
        bio: editedBio,
      });
    }
    onShowToast?.('Profile settings updated successfully!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Starts below top bar + header so all top icons remain clickable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed top-[64px] sm:top-[72px] left-0 right-0 bottom-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
            id="tools-menu-backdrop"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            className="fixed top-[64px] sm:top-[72px] right-0 bottom-0 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] w-full max-w-full sm:max-w-md bg-white z-40 shadow-2xl flex flex-col overflow-hidden border-l border-gray-200"
            id="tools-menu-drawer"
          >
            {/* DRAWER HEADER */}
            <div className="bg-[#076653] text-white px-4 py-3 flex justify-between items-center shrink-0 shadow-xs border-b border-[#0C342C]">
              <div className="flex items-center gap-2.5">
                {selectedItem ? (
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white transition-colors cursor-pointer mr-0.5"
                    title="Back to menu list"
                    id="menu-back-btn"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="p-2 bg-[#0C342C] text-[#E3EF26] rounded-xl border border-[#E3EF26]/30 shadow-xs">
                    <Settings className="w-4.5 h-4.5" />
                  </div>
                )}
                <div>
                  <h2 className="font-extrabold text-sm text-white leading-tight">
                    {selectedItem
                      ? menuListItems.find((item) => item.id === selectedItem)?.label
                      : 'Menu'}
                  </h2>
                  <p className="text-[10px] text-[#E3EF26] font-medium">
                    {profile.name} • Social Hub
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Close menu"
                id="close-tools-drawer-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY CONTENT */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              {/* TOP LEVEL MENU LIST */}
              {selectedItem === null && (
                <div className="p-3 sm:p-4 space-y-3">
                  {/* Bissho Barta Brand Card */}
                  <div className="p-3.5 bg-linear-to-br from-[#0C342C] via-[#076653] to-[#043d32] rounded-2xl border border-[#076653]/30 text-white shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AppLogo size="md" showText={false} />
                      <div>
                        <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                          Bissho <span className="text-[#E3EF26]">Barta</span>
                        </h3>
                        <p className="text-[10px] text-emerald-200/90 font-medium">World News & Social Platform</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-[#E3EF26] text-[#0C342C] px-2 py-0.5 rounded-full shadow-2xs">
                      v2.4
                    </span>
                  </div>

                  <div className="px-1 pt-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Menu Categories
                  </div>
                  <div className="space-y-1.5">
                    {menuListItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectMenuItem(item.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                            item.danger
                              ? 'bg-red-50/50 border-red-200/70 hover:bg-red-100/60'
                              : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-2xs'
                          }`}
                          id={`menu-item-${item.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${item.bgColor} ${item.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div
                                className={`text-xs font-bold ${
                                  item.danger ? 'text-red-700' : 'text-gray-900'
                                } group-hover:text-black`}
                              >
                                {item.label}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {item.desc}
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 ${
                              item.danger ? 'text-red-400' : 'text-gray-400'
                            } group-hover:translate-x-0.5 transition-transform`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1. TOOLS VIEW */}
              {selectedItem === 'tools' && (
                <div className="p-4 space-y-4 bg-white min-h-full">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#076653]" />
                        Creator Tools
                      </h3>
                      <p className="text-xs text-gray-500">Manage creator stats, insights and earnings</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                      <Zap className="w-3 h-3 text-emerald-600" /> Account Active
                    </span>
                  </div>

                  {/* SUB-NAVIGATION TAB BAR FOR TOOLS: DASHBOARD, ANALYTICS, MONETIZATION */}
                  <div className="bg-slate-100/90 border border-gray-200 p-1 rounded-xl flex gap-1 overflow-x-auto text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setToolsTab('dashboard')}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        toolsTab === 'dashboard'
                          ? 'bg-white text-[#076653] font-bold shadow-2xs border border-gray-200'
                          : 'hover:bg-gray-200/60 text-gray-600'
                      }`}
                      id="tools-subtab-dashboard"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#076653]" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setToolsTab('analytics')}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        toolsTab === 'analytics'
                          ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-gray-200'
                          : 'hover:bg-gray-200/60 text-gray-600'
                      }`}
                      id="tools-subtab-analytics"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Analytics</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setToolsTab('monetization')}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        toolsTab === 'monetization'
                          ? 'bg-white text-emerald-700 font-bold shadow-2xs border border-gray-200'
                          : 'hover:bg-gray-200/60 text-gray-600'
                      }`}
                      id="tools-subtab-monetization"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Monetization</span>
                    </button>
                  </div>

                  {/* 1A. DASHBOARD CONTENT */}
                  {toolsTab === 'dashboard' && (
                    <div className="space-y-4 pt-1">
                      <div className="bg-slate-100/80 border border-gray-200/80 p-1 rounded-xl flex gap-1 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setDashTab('overview')}
                          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            dashTab === 'overview'
                              ? 'bg-white text-[#076653] font-bold shadow-2xs border border-gray-200'
                              : 'hover:bg-gray-200/60 text-gray-600'
                          }`}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Overview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDashTab('growth')}
                          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            dashTab === 'growth'
                              ? 'bg-white text-emerald-700 font-bold shadow-2xs border border-gray-200'
                              : 'hover:bg-gray-200/60 text-gray-600'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Growth</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDashTab('activity')}
                          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            dashTab === 'activity'
                              ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-gray-200'
                              : 'hover:bg-gray-200/60 text-gray-600'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Activity</span>
                        </button>
                      </div>

                      {dashTab === 'overview' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 shadow-2xs">
                              <span className="text-[10px] text-slate-400 font-medium block">Total Monthly Reach</span>
                              <div className="text-xl font-black mt-0.5">148.2K</div>
                              <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">+24.8% this month</span>
                            </div>
                            <div className="bg-emerald-950 text-white rounded-xl p-3.5 border border-emerald-800 shadow-2xs">
                              <span className="text-[10px] text-emerald-300 font-medium block">Net Balance</span>
                              <div className="text-xl font-black text-emerald-400 mt-0.5">$1,842.50</div>
                              <span className="text-[10px] text-emerald-300 font-bold mt-1 inline-block">Monetized Account</span>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Performance Highlights</h4>
                            <div className="text-xs text-gray-600 space-y-2.5">
                              <div className="flex justify-between py-1 border-b border-gray-200/60">
                                <span>Profile Views (30 days)</span>
                                <span className="font-bold text-gray-900">12,490</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-gray-200/60">
                                <span>Average Post Engagement</span>
                                <span className="font-bold text-gray-900">8.4%</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span>Global Creator Status</span>
                                <span className="font-bold text-indigo-600">Top 1% Rank</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {dashTab === 'growth' && (
                        <div className="bg-gray-50/80 rounded-xl border border-gray-200 p-4 space-y-3">
                          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span className="text-xs font-bold text-gray-800">Follower Velocity</span>
                            <span className="text-xs font-bold text-emerald-600">+1,240 this week</span>
                          </div>
                          <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Viral Video Reach</span>
                              <span className="font-bold text-gray-900">84.2K views</span>
                            </div>
                            <div className="flex justify-between">
                              <span>New Subscriptions</span>
                              <span className="font-bold text-gray-900">+312 users</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {dashTab === 'activity' && (
                        <div className="space-y-2">
                          <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs flex justify-between items-center">
                            <span className="text-gray-700">Account Security Scan Completed</span>
                            <span className="text-[10px] text-gray-400">2h ago</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs flex justify-between items-center">
                            <span className="text-gray-700">Monetization Payout Verified</span>
                            <span className="text-[10px] text-gray-400">1d ago</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 1B. ANALYTICS CONTENT */}
                  {toolsTab === 'analytics' && (
                    <div className="space-y-4 pt-1">
                      <div className="bg-slate-100/80 border border-gray-200/80 p-1 rounded-xl flex gap-1 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setAnalyticsTab('performance')}
                          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            analyticsTab === 'performance'
                              ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-gray-200'
                              : 'hover:bg-gray-200/60 text-gray-600'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Performance</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnalyticsTab('demographics')}
                          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            analyticsTab === 'demographics'
                              ? 'bg-white text-[#076653] font-bold shadow-2xs border border-gray-200'
                              : 'hover:bg-gray-200/60 text-gray-600'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Audience</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnalyticsTab('content')}
                          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            analyticsTab === 'content'
                              ? 'bg-white text-purple-700 font-bold shadow-2xs border border-gray-200'
                              : 'hover:bg-gray-200/60 text-gray-600'
                          }`}
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>Content</span>
                        </button>
                      </div>

                      {analyticsTab === 'performance' && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-2xs">
                          <div>
                            <div className="flex justify-between text-xs mb-1.5 font-semibold">
                              <span className="text-gray-700">Impressions Growth</span>
                              <span className="text-emerald-600 font-bold">+24.8%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78%' }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1.5 font-semibold">
                              <span className="text-gray-700">Audience Retention</span>
                              <span className="text-[#076653] font-bold">64.2%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-[#076653] h-full rounded-full" style={{ width: '64%' }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1.5 font-semibold">
                              <span className="text-gray-700">Profile Conversions</span>
                              <span className="text-[#076653] font-bold">12.1%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-[#076653] h-full rounded-full" style={{ width: '45%' }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {analyticsTab === 'demographics' && (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Top Country</span>
                            <span className="font-bold text-gray-900">United States (42%)</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Primary Age Group</span>
                            <span className="font-bold text-gray-900">25–34 years (58%)</span>
                          </div>
                        </div>
                      )}

                      {analyticsTab === 'content' && (
                        <div className="space-y-2 text-xs">
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                            <span className="font-medium text-gray-800">Reels & Short Video Engagement</span>
                            <span className="font-bold text-emerald-600">High (9.4%)</span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                            <span className="font-medium text-gray-800">Photo Post Click Rate</span>
                            <span className="font-bold text-[#076653]">6.1%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 1C. MONETIZATION CONTENT */}
                  {toolsTab === 'monetization' && (
                    <div className="space-y-4 pt-1">
                      <div className="bg-slate-100/80 border border-gray-200/80 p-1 rounded-xl flex gap-1 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setMonetizationTab('balance')}
                          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            monetizationTab === 'balance'
                              ? 'bg-white text-emerald-700 font-bold shadow-2xs border border-gray-200'
                              : 'hover:bg-gray-200/60 text-gray-600'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Balance</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMonetizationTab('payouts')}
                          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            monetizationTab === 'payouts'
                              ? 'bg-white text-[#076653] font-bold shadow-2xs border border-gray-200'
                              : 'hover:bg-gray-200/60 text-gray-600'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Payouts</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMonetizationTab('tips')}
                          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            monetizationTab === 'tips'
                              ? 'bg-white text-amber-700 font-bold shadow-2xs border border-gray-200'
                              : 'hover:bg-gray-200/60 text-gray-600'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Stars & Tips</span>
                        </button>
                      </div>

                      {monetizationTab === 'balance' && (
                        <div className="space-y-3">
                          <div className="bg-[#076653] text-[#E3EF26] p-4 rounded-xl shadow-xs space-y-2">
                            <span className="text-[11px] font-bold text-[#E3EF26]/80 block">Available Balance</span>
                            <div className="text-2xl font-black text-[#E3EF26]">$1,842.50</div>
                            <p className="text-[10px] text-white/80">Ready for instant withdrawal to bank account</p>
                          </div>

                          <button
                            onClick={() => onShowToast?.("Payout request submitted successfully!")}
                            className="w-full bg-[#076653] hover:bg-[#065042] text-[#E3EF26] font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                          >
                            Request Instant Payout
                          </button>
                        </div>
                      )}

                      {monetizationTab === 'payouts' && (
                        <div className="space-y-2 text-xs">
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                            <div>
                              <div className="font-bold text-gray-900">$450.00 Deposited</div>
                              <div className="text-[10px] text-gray-500">Direct Deposit • Chase ****4821</div>
                            </div>
                            <span className="text-[10px] font-bold text-[#076653] bg-[#EBF7F2] px-2 py-0.5 rounded border border-[#076653]/30">Completed</span>
                          </div>
                        </div>
                      )}

                      {monetizationTab === 'tips' && (
                        <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-2">
                          <div className="font-bold text-amber-900">Stars & Fan Gifting Active</div>
                          <p className="text-gray-600 text-[11px]">You have earned 12,400 Stars ($124.00) from supporters this month.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. VERIFICATION VIEW */}
              {selectedItem === 'verification' && (
                <div className="p-4 space-y-4 bg-white min-h-full">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-[#076653]" />
                      Account Verification
                    </h3>
                    <p className="text-xs text-gray-500">Manage identity badges & authenticity check</p>
                  </div>

                  {verificationSubmitted ? (
                    <div className="p-4 bg-[#EBF7F2] border border-[#076653]/30 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-[#076653] shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-[#076653]">Application Under Review</div>
                        <div className="text-[11px] text-[#076653]/80">Your verification submission is currently being processed.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Request a verified checkmark to increase authenticity and gain access to creator tools.
                      </p>
                      <button
                        onClick={() => {
                          setVerificationSubmitted(true);
                          onShowToast?.('Verification request submitted for review!');
                        }}
                        className="w-full bg-[#076653] hover:bg-[#065042] text-[#E3EF26] font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Submit Verification Request
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. SETTINGS AND PRIVACY VIEW */}
              {selectedItem === 'settings' && (
                <div className="p-4 space-y-4 bg-white min-h-full">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-800" />
                      Settings and Privacy
                    </h3>
                    <p className="text-xs text-gray-500">Manage profile data, privacy options and security</p>
                  </div>

                  {/* Sub-Navigation Tabs */}
                  <div className="bg-slate-100/80 border border-gray-200/80 p-1 rounded-xl flex gap-1 overflow-x-auto text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setSettingsTab('account')}
                      className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        settingsTab === 'account'
                          ? 'bg-white text-gray-900 font-bold shadow-2xs border border-gray-200'
                          : 'hover:bg-gray-200/60 text-gray-600'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsTab('privacy')}
                      className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        settingsTab === 'privacy'
                          ? 'bg-white text-gray-900 font-bold shadow-2xs border border-gray-200'
                          : 'hover:bg-gray-200/60 text-gray-600'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Privacy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsTab('security')}
                      className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        settingsTab === 'security'
                          ? 'bg-white text-gray-900 font-bold shadow-2xs border border-gray-200'
                          : 'hover:bg-gray-200/60 text-gray-600'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Security</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsTab('notifications')}
                      className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        settingsTab === 'notifications'
                          ? 'bg-white text-gray-900 font-bold shadow-2xs border border-gray-200'
                          : 'hover:bg-gray-200/60 text-gray-600'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notifs</span>
                    </button>
                  </div>

                  {settingsTab === 'account' && (
                    <form onSubmit={handleSaveProfile} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Display Name</label>
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#076653] focus:ring-1 focus:ring-[#076653]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Bio</label>
                        <textarea
                          rows={3}
                          value={editedBio}
                          onChange={(e) => setEditedBio(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#076653] focus:ring-1 focus:ring-[#076653]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#076653] hover:bg-[#065042] text-[#E3EF26] font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Save Account Changes
                      </button>
                    </form>
                  )}

                  {settingsTab === 'privacy' && (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                        <span className="font-medium text-gray-800">Profile Search Visibility</span>
                        <span className="font-bold text-emerald-600">Public</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                        <span className="font-medium text-gray-800">Friend Request Permissions</span>
                        <span className="font-bold text-gray-700">Everyone</span>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'security' && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-emerald-900">Two-Factor Authentication (2FA)</div>
                      <div className="text-[11px] text-emerald-700">Protected via SMS security codes</div>
                    </div>
                  )}

                  {settingsTab === 'notifications' && (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                        <span className="font-medium text-gray-800">Push Notifications</span>
                        <span className="font-bold text-emerald-600">Enabled</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. CONTENT PREFERENCE VIEW */}
              {selectedItem === 'preferences' && (
                <div className="p-4 space-y-4 bg-white min-h-full">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-purple-600" />
                      Content Preference
                    </h3>
                    <p className="text-xs text-gray-500">Customize feeds, media settings, and topics</p>
                  </div>

                  <div className="space-y-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-200">
                    {/* Home Feed Content Preference Dropdown / Option */}
                    <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                      <div>
                        <div className="text-xs font-bold text-gray-900">Home Page Content Preference</div>
                        <div className="text-[10px] text-gray-500">Default feed view mode on your timeline</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setHomeFeedPref('Following');
                            onShowToast?.('Home Feed set to: Following Only');
                          }}
                          className={`flex flex-col items-start p-2 rounded-lg border text-left cursor-pointer transition-all ${
                            homeFeedPref === 'Following' 
                              ? 'bg-[#EBF7F2] border-[#076653] ring-1 ring-[#076653]/30' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            <span>👥</span> Following Only
                          </div>
                          <div className="text-[9.5px] text-gray-500 mt-0.5 leading-tight">
                            Pages, Groups & Friends
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setHomeFeedPref('Suggested');
                            onShowToast?.('Home Feed set to: Suggested Topics');
                          }}
                          className={`flex flex-col items-start p-2 rounded-lg border text-left cursor-pointer transition-all ${
                            homeFeedPref === 'Suggested' 
                              ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500/30' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            <span>🔥</span> Suggested
                          </div>
                          <div className="text-[9.5px] text-gray-500 mt-0.5 leading-tight">
                            Hot Topics & Viral
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
                      <div className="pr-2">
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <span>Reduce Sensitive Content</span>
                          <span className="text-[9px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                            {reducedSensitive ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                          Automatically softens sensitive terms and reduces graphic posts in feeds.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !reducedSensitive;
                          setReducedSensitive(nextState);
                          localStorage.setItem('reducedSensitiveContent', String(nextState));
                          window.dispatchEvent(new CustomEvent('sensitive-content-changed', { detail: nextState }));
                          onShowToast?.(
                            nextState ? 'Sensitive content reduced (Algorithm active)' : 'Sensitive content filter off'
                          );
                        }}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          reducedSensitive ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                        id="reduce-sensitive-toggle-btn"
                      >
                        <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
                      <div>
                        <div className="text-xs font-bold text-gray-900">Autoplay Videos</div>
                        <div className="text-[10px] text-gray-500">Play videos automatically via mobile data & Wi-Fi</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !autoplayVideos;
                          setAutoplayVideos(nextState);
                          localStorage.setItem('autoplayVideos', String(nextState));
                          window.dispatchEvent(new CustomEvent('autoplay-setting-changed', { detail: nextState }));
                          onShowToast?.(nextState ? 'Autoplay enabled on Wi-Fi & Mobile Data' : 'Autoplay off (Click to play videos)');
                        }}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          autoplayVideos ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                        id="autoplay-videos-toggle-btn"
                      >
                        <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                      </button>
                    </div>

                    {/* Replaced HD Photo & Video with Data Save (Clean layout, no description text) */}
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-gray-900">Data Save</div>
                        <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          {dataSaver ? 'SD Mode' : 'Default Size'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !dataSaver;
                          setDataSaver(nextState);
                          localStorage.setItem('dataSaver', String(nextState));
                          window.dispatchEvent(new CustomEvent('datasaver-setting-changed', { detail: nextState }));
                          onShowToast?.(nextState ? 'Data Save enabled (Photo SD, Video SD)' : 'Data Save off (Default size & resolution)');
                        }}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          dataSaver ? 'bg-emerald-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                        id="data-save-toggle-btn"
                      >
                        <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        {darkModeActive ? (
                          <Moon className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-500" />
                        )}
                        <div>
                          <div className="text-xs font-bold text-gray-900">Night Mode Theme</div>
                          <div className="text-[10px] text-gray-500">{darkModeActive ? 'Night Mode Active' : 'Light Mode Active'}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !darkModeActive;
                          setDarkModeActive(nextState);
                          localStorage.setItem('nightMode', String(nextState));
                          if (nextState) {
                            document.documentElement.classList.add('dark');
                          } else {
                            document.documentElement.classList.remove('dark');
                          }
                          window.dispatchEvent(new CustomEvent('nightmode-setting-changed', { detail: nextState }));
                          onShowToast?.(nextState ? 'Night mode enabled' : 'Light mode enabled');
                        }}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          darkModeActive ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                        id="night-mode-toggle-btn"
                      >
                        <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onShowToast?.('Content preference updated!')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs mt-2"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* 5. SUPPORT VIEW */}
              {selectedItem === 'support' && (
                <div className="p-4 space-y-4 bg-white min-h-full">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-emerald-600" />
                      Help & Support Center
                    </h3>
                    <p className="text-xs text-gray-500">Get help with your account or contact support</p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-emerald-900">24/7 Creator Support Line</div>
                      <div className="text-[11px] text-emerald-700">
                        Priority support is available for verified creator accounts.
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Contact Support Team
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe your issue or feedback..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!supportMessage.trim()) return;
                        setSupportMessage('');
                        onShowToast?.('Support ticket submitted successfully!');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
