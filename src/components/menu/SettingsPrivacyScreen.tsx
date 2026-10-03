import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Lock,
  ShieldCheck,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { UserProfile, Friend } from '../../types';
import { VideoResolutionSetting } from '../../utils/mediaOptimizer';
import SegmentedControl from './SegmentedControl';
import SettingsGroup from './SettingsGroup';
import SettingsRow from './SettingsRow';
import Toggle from './Toggle';

interface SettingsPrivacyScreenProps {
  profile: UserProfile;
  friends?: Friend[];
  videoResolution: VideoResolutionSetting;
  onChangeVideoResolution: (res: VideoResolutionSetting) => void;
  onSaveProfile: (name: string, bio: string) => void;
  onShowToast?: (msg: string) => void;
  onBack: () => void;
}

type SubScreenId = 'list' | 'account' | 'privacy' | 'security' | 'notifications';

export default function SettingsPrivacyScreen({
  profile,
  videoResolution,
  onChangeVideoResolution,
  onSaveProfile,
  onShowToast,
  onBack,
}: SettingsPrivacyScreenProps) {
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreenId>('list');
  const [editedName, setEditedName] = useState(profile.name);
  const [editedBio, setEditedBio] = useState(profile.bio);

  // Privacy toggles
  const [publicSearch, setPublicSearch] = useState(true);
  const [everyoneFriendRequests, setEveryoneFriendRequests] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);

  // Security toggles
  const [twoFactorDemo, setTwoFactorDemo] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  // Notification toggles
  const [pushNotifs, setPushNotifs] = useState(true);
  const [commentNotifs, setCommentNotifs] = useState(true);

  useEffect(() => {
    setEditedName(profile.name);
    setEditedBio(profile.bio);
  }, [profile.name, profile.bio]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(editedName.trim() || profile.name, editedBio);
  };

  return (
    <div className="p-4 space-y-6">
      {/* 1. MAIN LIST VIEW: Listed buttons for Settings and Privacy options */}
      {activeSubScreen === 'list' && (
        <div className="space-y-4">
          {/* Standard Settings Listed Buttons */}
          <div className="bg-white rounded-[12px] border border-[#E5E7EB] divide-y divide-[#E5E7EB] overflow-hidden shadow-2xs">
            {/* Account & Profile Details */}
            <button
              type="button"
              id="settings-btn-account"
              onClick={() => setActiveSubScreen('account')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">Profile & Account Details</div>
                  <div className="text-xs text-gray-500 mt-0.5">Name, bio, and video resolution</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {/* Privacy & Visibility */}
            <button
              type="button"
              id="settings-btn-privacy"
              onClick={() => setActiveSubScreen('privacy')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">Privacy & Visibility</div>
                  <div className="text-xs text-gray-500 mt-0.5">Public search, active status, friend requests</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {/* Account Security */}
            <button
              type="button"
              id="settings-btn-security"
              onClick={() => setActiveSubScreen('security')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">Account Protection & Security</div>
                  <div className="text-xs text-gray-500 mt-0.5">Two-factor authentication, login alerts</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {/* Notification Channels */}
            <button
              type="button"
              id="settings-btn-notifications"
              onClick={() => setActiveSubScreen('notifications')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">Notification Channels</div>
                  <div className="text-xs text-gray-500 mt-0.5">Push alerts, comments, and replies</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* 2. ACCOUNT DETAILS SUB-SCREEN */}
      {activeSubScreen === 'account' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Profile Details</h3>
            <button
              type="button"
              onClick={() => setActiveSubScreen('list')}
              className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Settings</span>
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 space-y-4"
          >
            <div>
              <label
                htmlFor="settings-display-name"
                className="block text-sm font-medium text-[#111827] mb-1.5"
              >
                Display Name
              </label>
              <input
                id="settings-display-name"
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full h-11 px-3.5 text-[15px] text-[#111827] bg-white border border-[#E5E7EB] rounded-[10px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
              />
              <p className="text-xs text-[#6B7280] mt-1.5">
                Your name as it appears on your profile and timeline posts.
              </p>
            </div>

            <div>
              <label
                htmlFor="settings-bio"
                className="block text-sm font-medium text-[#111827] mb-1.5"
              >
                Bio
              </label>
              <textarea
                id="settings-bio"
                rows={3}
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="w-full min-h-[88px] px-3.5 py-2.5 text-[15px] text-[#111827] bg-white border border-[#E5E7EB] rounded-[10px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
              />
              <p className="text-xs text-[#6B7280] mt-1.5">
                A short introduction displayed on your profile page.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Video Resolution
              </label>
              <SegmentedControl<VideoResolutionSetting>
                ariaLabel="Video Resolution"
                value={videoResolution}
                onChange={onChangeVideoResolution}
                options={[
                  { value: '480p', label: '480p Standard' },
                  { value: '720p', label: '720p HD' },
                ]}
              />
              <p className="text-xs text-[#6B7280] mt-1.5">
                Default quality for video playback and uploads.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!editedName.trim()}
                className="w-full h-11 bg-[#076653] hover:bg-[#0C342C] text-white font-semibold text-sm rounded-[10px] transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. PRIVACY & VISIBILITY SUB-SCREEN */}
      {activeSubScreen === 'privacy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Privacy & Visibility</h3>
            <button
              type="button"
              onClick={() => setActiveSubScreen('list')}
              className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Settings</span>
            </button>
          </div>

          <SettingsGroup title="Visibility & Connections">
            <SettingsRow
              label="Public Profile Search"
              description="Allow people to find your profile in search results"
              rightElement={
                <Toggle
                  checked={publicSearch}
                  onChange={(next) => {
                    setPublicSearch(next);
                    onShowToast?.(
                      next
                        ? 'Profile search visibility set to Public'
                        : 'Profile hidden from public search'
                    );
                  }}
                  ariaLabel="Toggle public profile search"
                />
              }
            />
            <SettingsRow
              label="Friend Requests from Everyone"
              description="Allow any Bissho Barta member to send you a friend request"
              rightElement={
                <Toggle
                  checked={everyoneFriendRequests}
                  onChange={(next) => {
                    setEveryoneFriendRequests(next);
                    onShowToast?.(
                      next
                        ? 'Friend requests allowed from everyone'
                        : 'Friend requests restricted to friends of friends'
                    );
                  }}
                  ariaLabel="Toggle friend requests from everyone"
                />
              }
            />
            <SettingsRow
              label="Active Status"
              description="Show when you are active on Bissho Barta"
              rightElement={
                <Toggle
                  checked={activityStatus}
                  onChange={(next) => {
                    setActivityStatus(next);
                    onShowToast?.(
                      next ? 'Active status turned on' : 'Active status turned off'
                    );
                  }}
                  ariaLabel="Toggle active status"
                />
              }
            />
          </SettingsGroup>
        </div>
      )}

      {/* 4. SECURITY SUB-SCREEN */}
      {activeSubScreen === 'security' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Account Security</h3>
            <button
              type="button"
              onClick={() => setActiveSubScreen('list')}
              className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Settings</span>
            </button>
          </div>

          <SettingsGroup title="Account Protection">
            <SettingsRow
              label="Two-Factor Authentication (Demo)"
              description="Require a verification code when signing in from a new device"
              rightElement={
                <Toggle
                  checked={twoFactorDemo}
                  onChange={(next) => {
                    setTwoFactorDemo(next);
                    onShowToast?.(
                      next
                        ? 'Two-factor authentication enabled (Demo)'
                        : 'Two-factor authentication disabled (Demo)'
                    );
                  }}
                  ariaLabel="Toggle two-factor authentication"
                />
              }
            />
            <SettingsRow
              label="Login Alerts"
              description="Receive an alert when an unrecognized device logs in"
              rightElement={
                <Toggle
                  checked={loginAlerts}
                  onChange={(next) => {
                    setLoginAlerts(next);
                    onShowToast?.(
                      next ? 'Login alerts enabled' : 'Login alerts disabled'
                    );
                  }}
                  ariaLabel="Toggle login alerts"
                />
              }
            />
          </SettingsGroup>
        </div>
      )}

      {/* 5. NOTIFICATIONS SUB-SCREEN */}
      {activeSubScreen === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Notification Channels</h3>
            <button
              type="button"
              onClick={() => setActiveSubScreen('list')}
              className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Settings</span>
            </button>
          </div>

          <SettingsGroup title="Notification Channels">
            <SettingsRow
              label="Push Notifications"
              description="Receive alerts for likes, comments, and messages"
              rightElement={
                <Toggle
                  checked={pushNotifs}
                  onChange={(next) => {
                    setPushNotifs(next);
                    onShowToast?.(
                      next
                        ? 'Push notifications enabled'
                        : 'Push notifications muted'
                    );
                  }}
                  ariaLabel="Toggle push notifications"
                />
              }
            />
            <SettingsRow
              label="Comments and Replies"
              description="Get notified when someone comments on your posts"
              rightElement={
                <Toggle
                  checked={commentNotifs}
                  onChange={(next) => {
                    setCommentNotifs(next);
                    onShowToast?.(
                      next
                        ? 'Comment notifications enabled'
                        : 'Comment notifications muted'
                    );
                  }}
                  ariaLabel="Toggle comment notifications"
                />
              }
            />
          </SettingsGroup>
        </div>
      )}

      {/* Back Button on every Settings function */}
      <button
        type="button"
        onClick={() => {
          if (activeSubScreen !== 'list') {
            setActiveSubScreen('list');
          } else {
            onBack();
          }
        }}
        aria-label={activeSubScreen !== 'list' ? 'Back to Settings List' : 'Back to Menu'}
        className="w-full h-11 bg-white border border-[#076653] text-[#076653] hover:bg-[#EBF7F2] font-semibold text-sm rounded-[10px] flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        <span>{activeSubScreen !== 'list' ? 'Back to Settings List' : 'Back to Menu'}</span>
      </button>
    </div>
  );
}
