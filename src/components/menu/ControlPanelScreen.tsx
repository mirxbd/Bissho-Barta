import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  Users,
  Eye,
  Lock,
  Zap,
  Search,
  VolumeX,
  Volume2,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  KeyRound,
  Trash2,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Flame,
  Radio,
  LockKeyhole,
} from 'lucide-react';
import { Friend, UserProfile } from '../../types';
import {
  ControlPanelSettings,
  getControlPanelSettings,
  saveControlPanelSettings,
  muteUser,
  unmuteUser,
  blockUser,
  unblockUser,
  setLockdownState,
  scheduleAccountDeletion,
  cancelAccountDeletion,
  getAccountDeletionInfo,
  AccountDeletionInfo,
} from '../../utils/controlPanelStorage';
import { getStoredFollowingList } from '../../utils/contentPreference';
import SettingsGroup from './SettingsGroup';
import SettingsRow from './SettingsRow';
import Toggle from './Toggle';

interface ControlPanelScreenProps {
  profile: UserProfile;
  friends: Friend[];
  onBack: () => void;
  onShowToast?: (msg: string) => void;
}

type SectionKey = 'list' | 'myspace' | 'people' | 'content' | 'interaction' | 'quickcontrols';

export default function ControlPanelScreen({
  profile,
  friends,
  onBack,
  onShowToast,
}: ControlPanelScreenProps) {
  const [settings, setSettings] = useState<ControlPanelSettings>(getControlPanelSettings);
  const [activeSection, setActiveSection] = useState<SectionKey>('list');
  const [viewAllMode, setViewAllMode] = useState<boolean>(false);

  // Search People Action Modal State
  const [showSearchPeopleModal, setShowSearchPeopleModal] = useState(false);
  const [peopleModalSearch, setPeopleModalSearch] = useState('');

  // Local search inputs for Muted & Blocked
  const [mutedSearch, setMutedSearch] = useState('');
  const [blockedSearch, setBlockedSearch] = useState('');

  // Hidden keywords input
  const [newKeyword, setNewKeyword] = useState('');

  // Expandable granular controls
  const [expandedProfileDetails, setExpandedProfileDetails] = useState(false);

  // Quick Controls Modals
  const [showLockdownConfirm, setShowLockdownConfirm] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionStep, setDeletionStep] = useState<1 | 2 | 3>(1);
  const [deletionMethod, setDeletionMethod] = useState<'email' | 'phone'>('email');
  const [deletionPassword, setDeletionPassword] = useState('');
  const [deletionCode, setDeletionCode] = useState('');
  const [deletionError, setDeletionError] = useState('');
  const [deletionInfo, setDeletionInfo] = useState<AccountDeletionInfo | null>(getAccountDeletionInfo);

  // Sync state with storage and custom events
  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getControlPanelSettings());
      setDeletionInfo(getAccountDeletionInfo());
    };
    window.addEventListener('control-panel-changed', handleUpdate);
    window.addEventListener('lockdown-mode-changed', handleUpdate);
    return () => {
      window.removeEventListener('control-panel-changed', handleUpdate);
      window.removeEventListener('lockdown-mode-changed', handleUpdate);
    };
  }, []);

  const updateSettings = (updater: (prev: ControlPanelSettings) => ControlPanelSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      saveControlPanelSettings(next);
      return next;
    });
  };

  // Contacts dataset for search & action
  const activeFriends = friends.filter((f) => f.status === 'friend');
  const following = getStoredFollowingList();

  const allKnownContacts = [
    ...activeFriends.map((f) => ({ id: f.id, name: f.name, avatar: f.avatar, role: 'Connected Friend' })),
    ...following.map((fl) => ({ id: fl.id, name: fl.name, avatar: fl.avatar, role: fl.role || 'Following' })),
  ];

  const uniqueContacts = Array.from(
    new Map(allKnownContacts.map((c) => [c.name.toLowerCase(), c])).values()
  );

  const modalSearchResults = uniqueContacts.filter((c) =>
    c.name.toLowerCase().includes(peopleModalSearch.toLowerCase().trim())
  );

  const filteredMutedList = settings.people.mutedUsers.filter((m) =>
    m.name.toLowerCase().includes(mutedSearch.toLowerCase().trim())
  );

  const filteredBlockedList = settings.people.blockedUsers.filter((b) =>
    b.name.toLowerCase().includes(blockedSearch.toLowerCase().trim())
  );

  // Deletion Handlers
  const handleInitiateDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionPassword.trim()) {
      setDeletionError('Password required for account verification.');
      return;
    }
    setDeletionError('');
    setDeletionStep(2);
    setDeletionCode('202688'); // Auto-fill demo verification code
    onShowToast?.(`Verification token dispatched to ${deletionMethod === 'email' ? 'mirxbd@gmail.com' : '+880 1712-345678'}`);
  };

  const handleConfirmDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionCode || deletionCode.length < 4) {
      setDeletionError('Please enter the 6-digit verification code.');
      return;
    }
    const info = scheduleAccountDeletion(
      deletionMethod,
      deletionMethod === 'email' ? 'mirxbd@gmail.com' : '+880 1712-345678'
    );
    setDeletionInfo(info);
    setDeletionStep(3);
    onShowToast?.('15-day account deletion sequence initiated.');
  };

  const handleCancelDeletion = () => {
    cancelAccountDeletion();
    setDeletionInfo(null);
    onShowToast?.('Account deletion cancelled. Security restored.');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Active Deletion Warning Banner */}
      {deletionInfo?.isScheduled && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[12px] space-y-2 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Account Deletion Pending ({deletionInfo.daysRemaining} Days Left)</span>
          </div>
          <p className="text-xs text-amber-700/90 dark:text-amber-300/90 leading-relaxed">
            Your account deletion request is active until {deletionInfo.expiryDate}. You can cancel this request anytime before the 15-day period ends.
          </p>
          <button
            type="button"
            onClick={handleCancelDeletion}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-[8px] cursor-pointer transition-colors"
          >
            Cancel Deletion Request & Keep Account
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MAIN LIST VIEW: Control Panel Options as Listed Buttons (matching Settings) */}
      {/* ========================================================================= */}
      {activeSection === 'list' && !viewAllMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Control Panel Options
            </span>
            <button
              type="button"
              onClick={() => setViewAllMode(true)}
              className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer"
            >
              View All Expanded
            </button>
          </div>

          <div className="bg-white rounded-[12px] border border-[#E5E7EB] divide-y divide-[#E5E7EB] overflow-hidden shadow-2xs">
            {/* 1. MY SPACE */}
            <button
              type="button"
              id="control-btn-myspace"
              onClick={() => setActiveSection('myspace')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#076653] flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">MY SPACE</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    Profile Visibility, Who Can Find Me, Follow Rules, Activity, Connections, Details, Private Profile
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
            </button>

            {/* 2. PEOPLE */}
            <button
              type="button"
              id="control-btn-people"
              onClick={() => setActiveSection('people')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">PEOPLE</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    Connections, Muted ({settings.people.mutedUsers.length}), Blocked ({settings.people.blockedUsers.length})
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
            </button>

            {/* 3. CONTENT */}
            <button
              type="button"
              id="control-btn-content"
              onClick={() => setActiveSection('content')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">CONTENT</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    Hidden Adult Filters, Safe News Revelations, Recommendations ({settings.content.recommendationsRatio}% Conn)
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
            </button>

            {/* 4. INTERACTION */}
            <button
              type="button"
              id="control-btn-interaction"
              onClick={() => setActiveSection('interaction')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">INTERACTION</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    Messages or Call, Comments, Tags, Connection Requests
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
            </button>

            {/* 5. QUICK CONTROLS */}
            <button
              type="button"
              id="control-btn-quickcontrols"
              onClick={() => setActiveSection('quickcontrols')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span>QUICK CONTROLS</span>
                    {settings.quickControls.lockdownMode && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">
                        Lockdown Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    Lockdown Mode, Delete My Account (15-Day Server Cooling Off)
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* View All Options Mode toggle banner */}
      {viewAllMode && activeSection === 'list' && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            All Options List
          </span>
          <button
            type="button"
            onClick={() => setViewAllMode(false)}
            className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer"
          >
            Show Grouped View
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-SCREEN: MY SPACE                                                   */}
      {/* ========================================================================= */}
      {(activeSection === 'myspace' || viewAllMode) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">MY SPACE</h3>
            {activeSection !== 'list' && (
              <button
                type="button"
                onClick={() => setActiveSection('list')}
                className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Control Panel</span>
              </button>
            )}
          </div>

          <SettingsGroup>
            {/* Profile Visibility */}
            <SettingsRow
              label="Profile Visibility"
              description="Choose who can view your profile and basic information."
              rightElement={
                <select
                  value={settings.mySpace.profileVisibility}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateSettings((s) => ({ ...s, mySpace: { ...s.mySpace, profileVisibility: val } }));
                    onShowToast?.(`Profile visibility changed to ${val}`);
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:border-[#076653] focus:outline-none cursor-pointer"
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers</option>
                  <option value="friends">Friends & Connections</option>
                  <option value="only_me">Only Me</option>
                </select>
              }
            />

            {/* Who Can Find Me */}
            <SettingsRow
              label="Who Can Find Me (Search)"
              description="Control discoverability through search and username."
              rightElement={
                <Toggle
                  checked={settings.mySpace.whoCanFindMe.search}
                  onChange={(next) =>
                    updateSettings((s) => ({
                      ...s,
                      mySpace: { ...s.mySpace, whoCanFindMe: { ...s.mySpace.whoCanFindMe, search: next } },
                    }))
                  }
                  ariaLabel="Toggle search discoverability"
                />
              }
            />

            <SettingsRow
              label="Who Can Find Me (Phone & Email)"
              description="Allow people with your phone number or email to discover you."
              rightElement={
                <Toggle
                  checked={settings.mySpace.whoCanFindMe.phone && settings.mySpace.whoCanFindMe.email}
                  onChange={(next) =>
                    updateSettings((s) => ({
                      ...s,
                      mySpace: {
                        ...s.mySpace,
                        whoCanFindMe: { ...s.mySpace.whoCanFindMe, phone: next, email: next },
                      },
                    }))
                  }
                  ariaLabel="Toggle phone and email discoverability"
                />
              }
            />

            {/* Who Can Follow Me */}
            <SettingsRow
              label="Who Can Follow Me"
              description="Decide who can follow you and whether approval is required."
              rightElement={
                <select
                  value={settings.mySpace.whoCanFollowMe}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateSettings((s) => ({ ...s, mySpace: { ...s.mySpace, whoCanFollowMe: val } }));
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:border-[#076653] focus:outline-none cursor-pointer"
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends_of_friends">Friends of Friends</option>
                  <option value="no_one">No One</option>
                </select>
              }
            />

            <SettingsRow
              label="Require Follow Approval"
              description="Manually review and approve every incoming follower request."
              rightElement={
                <Toggle
                  checked={settings.mySpace.requireFollowApproval}
                  onChange={(next) =>
                    updateSettings((s) => ({ ...s, mySpace: { ...s.mySpace, requireFollowApproval: next } }))
                  }
                  ariaLabel="Toggle follower approval requirement"
                />
              }
            />

            {/* Activity Visibility */}
            <SettingsRow
              label="Activity Visibility"
              description="Control whether others can see your online, active, or recent activity status."
              rightElement={
                <Toggle
                  checked={settings.mySpace.activityVisibility.showOnline}
                  onChange={(next) =>
                    updateSettings((s) => ({
                      ...s,
                      mySpace: {
                        ...s.mySpace,
                        activityVisibility: {
                          ...s.mySpace.activityVisibility,
                          showOnline: next,
                          showLastActive: next,
                        },
                      },
                    }))
                  }
                  ariaLabel="Toggle active and online activity visibility"
                />
              }
            />

            {/* Connections Visibility */}
            <SettingsRow
              label="Connections Visibility"
              description="Choose who can see your connections/friends list."
              rightElement={
                <select
                  value={settings.mySpace.connectionsVisibility}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateSettings((s) => ({ ...s, mySpace: { ...s.mySpace, connectionsVisibility: val } }));
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:border-[#076653] focus:outline-none cursor-pointer"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="only_me">Only Me</option>
                </select>
              }
            />

            {/* Profile Details */}
            <SettingsRow
              label="Profile Details"
              description="Control visibility of individual profile information such as bio, location, website, and other details."
              onClick={() => setExpandedProfileDetails(!expandedProfileDetails)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setExpandedProfileDetails(!expandedProfileDetails)}
                  className="text-xs text-[#076653] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>{expandedProfileDetails ? 'Hide' : 'Configure'}</span>
                  {expandedProfileDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              }
            />

            {expandedProfileDetails && (
              <div className="p-3 bg-gray-50 grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'showBio', label: 'Bio' },
                  { key: 'showLocation', label: 'Location' },
                  { key: 'showWork', label: 'Workplace' },
                  { key: 'showEducation', label: 'Education' },
                  { key: 'showWebsite', label: 'Website' },
                  { key: 'showRelationship', label: 'Relationship' },
                ].map((item) => {
                  const isChecked = (settings.mySpace.profileDetails as any)[item.key] ?? true;
                  return (
                    <div key={item.key} className="p-2 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                      <span className="text-gray-700 font-medium">{item.label}</span>
                      <Toggle
                        checked={isChecked}
                        onChange={(next) =>
                          updateSettings((s) => ({
                            ...s,
                            mySpace: {
                              ...s.mySpace,
                              profileDetails: { ...s.mySpace.profileDetails, [item.key]: next },
                            },
                          }))
                        }
                        ariaLabel={`Toggle ${item.label}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Private Profile */}
            <SettingsRow
              label="Private Profile"
              description="Lock your profile so only approved connections can access your protected content."
              rightElement={
                <Toggle
                  checked={settings.mySpace.privateProfile}
                  onChange={(next) => {
                    updateSettings((s) => ({ ...s, mySpace: { ...s.mySpace, privateProfile: next } }));
                    onShowToast?.(next ? 'Profile locked: Protected content active.' : 'Profile unlocked: Public access enabled.');
                  }}
                  ariaLabel="Toggle Private Profile Lock"
                />
              }
            />
          </SettingsGroup>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-SCREEN: PEOPLE                                                     */}
      {/* ========================================================================= */}
      {(activeSection === 'people' || viewAllMode) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">PEOPLE</h3>
            {activeSection !== 'list' && (
              <button
                type="button"
                onClick={() => setActiveSection('list')}
                className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Control Panel</span>
              </button>
            )}
          </div>

          <SettingsGroup>
            {/* Connections */}
            <SettingsRow
              label="Connections"
              description="View, manage, remove, and organize people you are connected with ( add search button to search people to mute).."
              rightElement={
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchPeopleModal(true);
                    setPeopleModalSearch('');
                  }}
                  className="px-3 py-1.5 bg-[#076653] hover:bg-[#0C342C] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search People</span>
                </button>
              }
            />

            {/* Muted */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-medium text-gray-900">Muted ({settings.people.mutedUsers.length})</div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Quietly stop seeing selected people’s content or notifications , massage, call without blocking them ( muted person will see u as offline even u uploaded post he cant see in profile from when u mute) ( add search button to search people to mute).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchPeopleModal(true);
                    setPeopleModalSearch('');
                  }}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </div>

              {/* Local Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search muted accounts..."
                  value={mutedSearch}
                  onChange={(e) => setMutedSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#076653]"
                />
              </div>

              {filteredMutedList.length === 0 ? (
                <div className="text-xs text-gray-400 py-1">No muted accounts.</div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {filteredMutedList.map((m) => (
                    <div key={m.id} className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={m.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        <div className="min-w-0 truncate font-medium text-gray-800">{m.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          unmuteUser(m.id);
                          onShowToast?.(`Unmuted ${m.name}`);
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-semibold cursor-pointer"
                      >
                        Unmute
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blocked */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-medium text-gray-900">Blocked ({settings.people.blockedUsers.length})</div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Completely prevent selected accounts from interacting with or contacting you ( add search button to search people to mute)..
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchPeopleModal(true);
                    setPeopleModalSearch('');
                  }}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </div>

              {/* Local Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search blocked accounts..."
                  value={blockedSearch}
                  onChange={(e) => setBlockedSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#076653]"
                />
              </div>

              {filteredBlockedList.length === 0 ? (
                <div className="text-xs text-gray-400 py-1">No blocked accounts.</div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {filteredBlockedList.map((b) => (
                    <div key={b.id} className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={b.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        <div className="min-w-0 truncate font-medium text-gray-800">{b.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          unblockUser(b.id);
                          onShowToast?.(`Unblocked ${b.name}`);
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-semibold cursor-pointer"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SettingsGroup>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-SCREEN: CONTENT                                                    */}
      {/* ========================================================================= */}
      {(activeSection === 'content' || viewAllMode) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">CONTENT</h3>
            {activeSection !== 'list' && (
              <button
                type="button"
                onClick={() => setActiveSection('list')}
                className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Control Panel</span>
              </button>
            )}
          </div>

          <SettingsGroup>
            {/* Hidden: Adult / Sensitive */}
            <SettingsRow
              label="Hidden Adult & Sensitive Content"
              description="Manage posts - Adult - Sensitive content - (pron, nude, Romance) by automatically filtering them."
              rightElement={
                <Toggle
                  checked={settings.content.filterAdultRomance}
                  onChange={(next) => {
                    updateSettings((s) => ({ ...s, content: { ...s.content, filterAdultRomance: next } }));
                    onShowToast?.(next ? 'Adult & Romance filter enabled.' : 'Adult & Romance filter disabled.');
                  }}
                  ariaLabel="Toggle Adult Sensitive Content Filter"
                />
              }
            />

            {/* Hidden: Safe Content Policy */}
            <SettingsRow
              label="Safe Content (Blood & Accident Revelations)"
              description="Safe Content ( the social media allow Blood and accident 0r reveloation as safe conent)."
              rightElement={
                <Toggle
                  checked={settings.content.allowBloodAccidentSafeContent}
                  onChange={(next) => {
                    updateSettings((s) => ({ ...s, content: { ...s.content, allowBloodAccidentSafeContent: next } }));
                    onShowToast?.(next ? 'News revelations allowed as safe content.' : 'Violence restricted.');
                  }}
                  ariaLabel="Toggle blood and accident revelations as safe content"
                />
              }
            />

            {/* Custom Hidden Keywords */}
            <div className="p-4 space-y-2">
              <div className="text-[15px] font-medium text-gray-900">Custom Hidden Keywords</div>
              <p className="text-xs text-gray-500">Add words or hashtags you wish to conceal from feeds.</p>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Enter keyword (e.g. spoilers)..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="flex-1 h-8 px-3 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#076653]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newKeyword.trim()) return;
                    const word = newKeyword.trim().toLowerCase();
                    if (!settings.content.hiddenKeywords.includes(word)) {
                      updateSettings((s) => ({
                        ...s,
                        content: { ...s.content, hiddenKeywords: [...s.content.hiddenKeywords, word] },
                      }));
                      onShowToast?.(`Filtered keyword: "${word}"`);
                    }
                    setNewKeyword('');
                  }}
                  className="px-3 h-8 bg-[#076653] hover:bg-[#0C342C] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {settings.content.hiddenKeywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200">
                    <span>#{kw}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings((s) => ({
                          ...s,
                          content: { ...s.content, hiddenKeywords: s.content.hiddenKeywords.filter((k) => k !== kw) },
                        }));
                      }}
                      className="text-gray-400 hover:text-red-500 cursor-pointer ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-4 space-y-3">
              <div>
                <div className="text-[15px] font-medium text-gray-900">Recommendations</div>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                  Control how much personalized, trending, suggested, and discovery content appears in Recommended - From connections - 50% From Reccomended 50% - use a toogle bar to up down % .
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#076653]">Connections: {settings.content.recommendationsRatio}%</span>
                  <span className="text-blue-700">Recommended: {100 - settings.content.recommendationsRatio}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.content.recommendationsRatio}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateSettings((s) => ({ ...s, content: { ...s.content, recommendationsRatio: val } }));
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#076653]"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '50% / 50%', val: 50 },
                    { label: '70% / 30%', val: 70 },
                    { label: '20% / 80%', val: 20 },
                    { label: '100% Conn', val: 100 },
                    { label: '100% Rec', val: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => {
                        updateSettings((s) => ({ ...s, content: { ...s.content, recommendationsRatio: preset.val } }));
                        onShowToast?.(`Ratio set to ${preset.label}`);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold border cursor-pointer transition-colors ${
                        settings.content.recommendationsRatio === preset.val
                          ? 'bg-[#076653] text-white border-[#076653]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SettingsGroup>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-SCREEN: INTERACTION                                                */}
      {/* ========================================================================= */}
      {(activeSection === 'interaction' || viewAllMode) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">INTERACTION</h3>
            {activeSection !== 'list' && (
              <button
                type="button"
                onClick={() => setActiveSection('list')}
                className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Control Panel</span>
              </button>
            )}
          </div>

          <SettingsGroup>
            {/* Messages or Call */}
            <SettingsRow
              label="Messages or Call"
              description="Choose who can send you direct messages and message requests ( everyone, followers, Only u Follow, No One."
              rightElement={
                <select
                  value={settings.interaction.messagesOrCall}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateSettings((s) => ({ ...s, interaction: { ...s.interaction, messagesOrCall: val } }));
                    onShowToast?.(`Messages restricted to: ${val}`);
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:border-[#076653] focus:outline-none cursor-pointer"
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers</option>
                  <option value="following">Only You Follow</option>
                  <option value="no_one">No One</option>
                </select>
              }
            />

            {/* Comments */}
            <SettingsRow
              label="Comments"
              description="Control who can comment on your posts and whether comments require approval ( Everyone , Followers, Following, Friends, No One,"
              rightElement={
                <select
                  value={settings.interaction.comments}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateSettings((s) => ({ ...s, interaction: { ...s.interaction, comments: val } }));
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:border-[#076653] focus:outline-none cursor-pointer"
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers</option>
                  <option value="following">Following</option>
                  <option value="friends">Friends</option>
                  <option value="no_one">No One</option>
                </select>
              }
            />

            <SettingsRow
              label="Comment Approval Requirement"
              description="Require your approval before comments appear publicly on your posts."
              rightElement={
                <Toggle
                  checked={settings.interaction.requireCommentApproval}
                  onChange={(next) =>
                    updateSettings((s) => ({ ...s, interaction: { ...s.interaction, requireCommentApproval: next } }))
                  }
                  ariaLabel="Toggle comment approval"
                />
              }
            />

            {/* Tags */}
            <SettingsRow
              label="Tags"
              description="Control who can tag you and whether tags appear automatically or require review - Frends, Followers, Follwoing, No One."
              rightElement={
                <select
                  value={settings.interaction.tags}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateSettings((s) => ({ ...s, interaction: { ...s.interaction, tags: val } }));
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:border-[#076653] focus:outline-none cursor-pointer"
                >
                  <option value="friends">Friends</option>
                  <option value="followers">Followers</option>
                  <option value="following">Following</option>
                  <option value="no_one">No One</option>
                </select>
              }
            />

            <SettingsRow
              label="Review Tags Before Posting"
              description="Review tagged posts before they appear on your profile."
              rightElement={
                <Toggle
                  checked={settings.interaction.reviewTags}
                  onChange={(next) =>
                    updateSettings((s) => ({ ...s, interaction: { ...s.interaction, reviewTags: next } }))
                  }
                  ariaLabel="Toggle tag review"
                />
              }
            />

            {/* Connection Requests */}
            <SettingsRow
              label="Connection Requests"
              description="Choose who can send you connection requests and how requests are handled- Everyone- No One."
              rightElement={
                <select
                  value={settings.interaction.connectionRequests}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateSettings((s) => ({ ...s, interaction: { ...s.interaction, connectionRequests: val } }));
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:border-[#076653] focus:outline-none cursor-pointer"
                >
                  <option value="everyone">Everyone</option>
                  <option value="no_one">No One</option>
                </select>
              }
            />
          </SettingsGroup>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-SCREEN: QUICK CONTROLS                                             */}
      {/* ========================================================================= */}
      {(activeSection === 'quickcontrols' || viewAllMode) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">QUICK CONTROLS</h3>
            {activeSection !== 'list' && (
              <button
                type="button"
                onClick={() => setActiveSection('list')}
                className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Control Panel</span>
              </button>
            )}
          </div>

          <SettingsGroup>
            {/* Lockdown Mode */}
            <SettingsRow
              label="Lockdown Mode"
              description="Tempoary off ur Social media, U cannot use-on the App will show Lockdown --and on off button and logout button and login button- ( if u want to off lockdown mode then need verify via email or phone."
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowLockdownConfirm(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    settings.quickControls.lockdownMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold'
                  }`}
                >
                  {settings.quickControls.lockdownMode ? 'Turn Off Lockdown' : 'Turn On Lockdown'}
                </button>
              }
            />

            {/* Delete My Account */}
            <SettingsRow
              label="Delete My Account"
              description="Permanently request account deletion using email/phone verification + password, with a 15-day deletion period before server data is permanently removed; logging back in during the 15-day period can optionally cancel the deletion request."
              rightElement={
                deletionInfo?.isScheduled ? (
                  <button
                    type="button"
                    onClick={handleCancelDeletion}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel Deletion ({deletionInfo.daysRemaining}d left)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeletionModal(true);
                      setDeletionStep(1);
                      setDeletionPassword('');
                      setDeletionCode('');
                      setDeletionError('');
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Delete Account
                  </button>
                )
              }
            />
          </SettingsGroup>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROMINENT "SEARCH PEOPLE" MODAL (Mute or Block with 1-click)    */}
      {/* ========================================================================= */}
      {showSearchPeopleModal && (
        <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[16px] border border-gray-200 p-5 space-y-4 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#076653]" />
                <h3 className="font-bold text-sm text-gray-900">Search People to Mute or Block</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSearchPeopleModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={peopleModalSearch}
                onChange={(e) => setPeopleModalSearch(e.target.value)}
                autoFocus
                className="w-full h-10 pl-9 pr-3 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#076653]"
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {modalSearchResults.length === 0 ? (
                <div className="text-xs text-gray-400 py-6 text-center">No accounts found.</div>
              ) : (
                modalSearchResults.map((user) => {
                  const isMuted = settings.people.mutedUsers.some((m) => m.name.toLowerCase() === user.name.toLowerCase());
                  const isBlocked = settings.people.blockedUsers.some((b) => b.name.toLowerCase() === user.name.toLowerCase());
                  return (
                    <div
                      key={user.id}
                      className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate">{user.name}</div>
                          <div className="text-[10px] text-gray-500 truncate">{user.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isMuted ? (
                          <button
                            type="button"
                            onClick={() => {
                              unmuteUser(user.id);
                              onShowToast?.(`Unmuted ${user.name}`);
                            }}
                            className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Unmute
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              muteUser({ id: user.id, name: user.name, avatar: user.avatar, role: user.role });
                              onShowToast?.(`Muted ${user.name}. Sees you as offline.`);
                            }}
                            className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Mute
                          </button>
                        )}

                        {isBlocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              unblockUser(user.id);
                              onShowToast?.(`Unblocked ${user.name}`);
                            }}
                            className="px-2 py-1 bg-red-100 text-red-800 rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Unblock
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              blockUser({ id: user.id, name: user.name, avatar: user.avatar, role: user.role });
                              onShowToast?.(`Blocked ${user.name}`);
                            }}
                            className="px-2 py-1 bg-white hover:bg-red-50 hover:text-red-700 border border-gray-300 text-gray-700 rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => setShowSearchPeopleModal(false)}
                className="px-4 py-1.5 bg-[#076653] hover:bg-[#0C342C] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LOCKDOWN CONFIRMATION                                            */}
      {/* ========================================================================= */}
      {showLockdownConfirm && (
        <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-[16px] border border-gray-200 p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900 text-center">
              {settings.quickControls.lockdownMode ? 'Turn Off Lockdown Mode?' : 'Turn On Lockdown Mode?'}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed text-center">
              {settings.quickControls.lockdownMode
                ? 'Turning off Lockdown Mode requires multi-factor phone/email verification on the Lockdown screen.'
                : 'Lockdown Mode temporarily freezes your account. The app will show the Lockdown screen with Turn Off Lockdown, Logout, and Login buttons.'}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLockdownConfirm(false)}
                className="flex-1 h-10 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLockdownConfirm(false);
                  const next = !settings.quickControls.lockdownMode;
                  setLockdownState(next);
                  updateSettings((s) => ({ ...s, quickControls: { ...s.quickControls, lockdownMode: next } }));
                  onShowToast?.(next ? 'Lockdown mode enabled.' : 'Lockdown mode disabled.');
                }}
                className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded-lg cursor-pointer"
              >
                {settings.quickControls.lockdownMode ? 'Proceed' : 'Confirm Lockdown'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE MY ACCOUNT (15-DAY GRACE PERIOD DELETION PROTOCOL)        */}
      {/* ========================================================================= */}
      {showDeletionModal && (
        <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[16px] border border-gray-200 p-6 space-y-4 shadow-xl text-left">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Delete My Account</h3>
                <p className="text-xs text-gray-500">15-day server cooling-off period</p>
              </div>
            </div>

            {deletionStep === 1 && (
              <form onSubmit={handleInitiateDeletion} className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 leading-relaxed">
                  Notice: Confirming deletion initiates a <strong>15-day pending deletion period</strong>. Logging back in during the 15-day period can cancel the deletion request.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                    Send Verification Token Via:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeletionMethod('email')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                        deletionMethod === 'email'
                          ? 'border-[#076653] bg-emerald-50 text-[#076653] font-semibold'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="text-xs truncate">Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletionMethod('phone')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                        deletionMethod === 'phone'
                          ? 'border-[#076653] bg-emerald-50 text-[#076653] font-semibold'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="text-xs truncate">SMS Phone</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Account Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={deletionPassword}
                    onChange={(e) => setDeletionPassword(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#076653]"
                  />
                  {deletionError && <p className="text-xs text-red-500 mt-1">{deletionError}</p>}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeletionModal(false)}
                    className="flex-1 h-10 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Dispatch Token
                  </button>
                </div>
              </form>
            )}

            {deletionStep === 2 && (
              <form onSubmit={handleConfirmDeletion} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Enter 6-Digit Verification Code</label>
                  <div className="text-[11px] text-gray-500 font-mono">
                    Token sent to {deletionMethod === 'email' ? 'mirxbd@gmail.com' : '+880 1712-345678'} (Demo: 202688)
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={deletionCode}
                    onChange={(e) => setDeletionCode(e.target.value)}
                    className="w-full h-11 text-center font-mono text-lg tracking-widest bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#076653]"
                  />
                  {deletionError && <p className="text-xs text-red-500 mt-1">{deletionError}</p>}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletionStep(1)}
                    className="flex-1 h-10 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Confirm 15-Day Deletion
                  </button>
                </div>
              </form>
            )}

            {deletionStep === 3 && (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#076653] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Deletion Request Active</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">
                    15-day grace period is running. You can cancel deletion at any time by simply logging back in before the period concludes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeletionModal(false)}
                  className="w-full h-10 bg-[#076653] hover:bg-[#0C342C] text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
