import { Friend, Post } from '../types';

export interface MySpaceSettings {
  profileVisibility: 'everyone' | 'followers' | 'friends' | 'only_me';
  whoCanFindMe: {
    search: boolean;
    phone: boolean;
    email: boolean;
    lookup: 'everyone' | 'friends_of_friends' | 'only_me';
  };
  whoCanFollowMe: 'everyone' | 'friends_of_friends' | 'no_one';
  requireFollowApproval: boolean;
  activityVisibility: {
    showOnline: boolean;
    showLastActive: boolean;
  };
  connectionsVisibility: 'public' | 'friends' | 'only_me';
  profileDetails: {
    showBio: boolean;
    showLocation: boolean;
    showWork: boolean;
    showEducation: boolean;
    showWebsite: boolean;
    showRelationship: boolean;
    showContact: boolean;
  };
  privateProfile: boolean; // Locked Profile
}

export interface MutedUserItem {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  mutedAt: string;
}

export interface BlockedUserItem {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  blockedAt: string;
}

export interface PeopleSettings {
  mutedUsers: MutedUserItem[];
  blockedUsers: BlockedUserItem[];
}

export interface ContentSettings {
  filterAdultRomance: boolean; // true = filter adult, nude, romance
  allowBloodAccidentSafeContent: boolean; // true = allow blood & accident revelation as safe documentary/news
  hiddenKeywords: string[];
  recommendationsRatio: number; // 0 to 100: percentage from Connections (remainder is Recommended discovery)
}

export interface InteractionSettings {
  messagesOrCall: 'everyone' | 'followers' | 'following' | 'friends' | 'no_one';
  comments: 'everyone' | 'followers' | 'following' | 'friends' | 'no_one';
  requireCommentApproval: boolean;
  tags: 'friends' | 'followers' | 'following' | 'no_one';
  reviewTags: boolean;
  connectionRequests: 'everyone' | 'no_one';
}

export interface AccountDeletionInfo {
  isScheduled: boolean;
  scheduledAt: string;
  expiryDate: string;
  daysRemaining: number;
  contactMethod: 'email' | 'phone';
  contactValue: string;
}

export interface QuickControlsSettings {
  lockdownMode: boolean;
  lockdownActivatedAt: string | null;
  accountDeletion: AccountDeletionInfo | null;
}

export interface ControlPanelSettings {
  mySpace: MySpaceSettings;
  people: PeopleSettings;
  content: ContentSettings;
  interaction: InteractionSettings;
  quickControls: QuickControlsSettings;
}

const STORAGE_KEY = 'bb_control_panel_settings';
const LOCKDOWN_KEY = 'bb_lockdown_active';
const DELETION_KEY = 'bb_account_deletion_state';

export const DEFAULT_MUTED_USERS: MutedUserItem[] = [
  {
    id: 'muted-1',
    name: 'Spam Marketing Group',
    avatar: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'Promotional Account',
    mutedAt: 'Yesterday',
  },
];

export const DEFAULT_BLOCKED_USERS: BlockedUserItem[] = [
  {
    id: 'blocked-1',
    name: 'Unknown Telemarketer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'Suspicious Profile',
    blockedAt: '3 days ago',
  },
];

export const DEFAULT_CONTROL_PANEL_SETTINGS: ControlPanelSettings = {
  mySpace: {
    profileVisibility: 'everyone',
    whoCanFindMe: {
      search: true,
      phone: false,
      email: true,
      lookup: 'everyone',
    },
    whoCanFollowMe: 'everyone',
    requireFollowApproval: false,
    activityVisibility: {
      showOnline: true,
      showLastActive: true,
    },
    connectionsVisibility: 'friends',
    profileDetails: {
      showBio: true,
      showLocation: true,
      showWork: true,
      showEducation: true,
      showWebsite: true,
      showRelationship: true,
      showContact: false,
    },
    privateProfile: false,
  },
  people: {
    mutedUsers: DEFAULT_MUTED_USERS,
    blockedUsers: DEFAULT_BLOCKED_USERS,
  },
  content: {
    filterAdultRomance: true,
    allowBloodAccidentSafeContent: true, // Social media allows Blood and accident or revelation as safe content
    hiddenKeywords: ['clickbait', 'crypto giveaways', 'spam bot'],
    recommendationsRatio: 50, // 50% Connections, 50% Recommended discovery
  },
  interaction: {
    messagesOrCall: 'everyone',
    comments: 'everyone',
    requireCommentApproval: false,
    tags: 'friends',
    reviewTags: true,
    connectionRequests: 'everyone',
  },
  quickControls: {
    lockdownMode: false,
    lockdownActivatedAt: null,
    accountDeletion: null,
  },
};

export function getControlPanelSettings(): ControlPanelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure complete schema
      return {
        mySpace: { ...DEFAULT_CONTROL_PANEL_SETTINGS.mySpace, ...(parsed.mySpace || {}) },
        people: {
          mutedUsers: Array.isArray(parsed.people?.mutedUsers)
            ? parsed.people.mutedUsers
            : DEFAULT_CONTROL_PANEL_SETTINGS.people.mutedUsers,
          blockedUsers: Array.isArray(parsed.people?.blockedUsers)
            ? parsed.people.blockedUsers
            : DEFAULT_CONTROL_PANEL_SETTINGS.people.blockedUsers,
        },
        content: { ...DEFAULT_CONTROL_PANEL_SETTINGS.content, ...(parsed.content || {}) },
        interaction: { ...DEFAULT_CONTROL_PANEL_SETTINGS.interaction, ...(parsed.interaction || {}) },
        quickControls: {
          ...DEFAULT_CONTROL_PANEL_SETTINGS.quickControls,
          ...(parsed.quickControls || {}),
          lockdownMode: localStorage.getItem(LOCKDOWN_KEY) === 'true',
        },
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_CONTROL_PANEL_SETTINGS;
}

export function saveControlPanelSettings(settings: ControlPanelSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(LOCKDOWN_KEY, String(settings.quickControls.lockdownMode));
    window.dispatchEvent(new CustomEvent('control-panel-changed', { detail: settings }));
  } catch {
    // ignore
  }
}

// Fast access helper to check if someone is muted
export function isUserMuted(nameOrId: string): boolean {
  if (!nameOrId) return false;
  const lower = nameOrId.toLowerCase().trim();
  const settings = getControlPanelSettings();
  return settings.people.mutedUsers.some(
    (u) => u.id === nameOrId || u.name.toLowerCase().trim() === lower
  );
}

// Fast access helper to check if someone is blocked
export function isUserBlocked(nameOrId: string): boolean {
  if (!nameOrId) return false;
  const lower = nameOrId.toLowerCase().trim();
  const settings = getControlPanelSettings();
  return settings.people.blockedUsers.some(
    (u) => u.id === nameOrId || u.name.toLowerCase().trim() === lower
  );
}

// Mute a user
export function muteUser(user: { id: string; name: string; avatar: string; role?: string }): void {
  const settings = getControlPanelSettings();
  const exists = settings.people.mutedUsers.some((u) => u.name.toLowerCase() === user.name.toLowerCase());
  if (!exists) {
    settings.people.mutedUsers.push({
      id: user.id || `mute-${Date.now()}`,
      name: user.name,
      avatar: user.avatar,
      role: user.role || 'User',
      mutedAt: 'Just now',
    });
    saveControlPanelSettings(settings);
  }
}

// Unmute a user
export function unmuteUser(identifier: string): void {
  const settings = getControlPanelSettings();
  const lower = identifier.toLowerCase();
  settings.people.mutedUsers = settings.people.mutedUsers.filter(
    (u) => u.id !== identifier && u.name.toLowerCase() !== lower
  );
  saveControlPanelSettings(settings);
}

// Block a user
export function blockUser(user: { id: string; name: string; avatar: string; role?: string }): void {
  const settings = getControlPanelSettings();
  const exists = settings.people.blockedUsers.some((u) => u.name.toLowerCase() === user.name.toLowerCase());
  if (!exists) {
    settings.people.blockedUsers.push({
      id: user.id || `block-${Date.now()}`,
      name: user.name,
      avatar: user.avatar,
      role: user.role || 'User',
      blockedAt: 'Just now',
    });
    saveControlPanelSettings(settings);
  }
}

// Unblock a user
export function unblockUser(identifier: string): void {
  const settings = getControlPanelSettings();
  const lower = identifier.toLowerCase();
  settings.people.blockedUsers = settings.people.blockedUsers.filter(
    (u) => u.id !== identifier && u.name.toLowerCase() !== lower
  );
  saveControlPanelSettings(settings);
}

// Lockdown Mode Controls
export function isLockdownActive(): boolean {
  return localStorage.getItem(LOCKDOWN_KEY) === 'true';
}

export function setLockdownState(active: boolean): void {
  localStorage.setItem(LOCKDOWN_KEY, String(active));
  const settings = getControlPanelSettings();
  settings.quickControls.lockdownMode = active;
  settings.quickControls.lockdownActivatedAt = active ? new Date().toISOString() : null;
  saveControlPanelSettings(settings);
  window.dispatchEvent(new CustomEvent('lockdown-mode-changed', { detail: active }));
}

// Account Deletion Controls (15-day grace period)
export function scheduleAccountDeletion(
  contactMethod: 'email' | 'phone',
  contactValue: string
): AccountDeletionInfo {
  const now = new Date();
  const expiry = new Date();
  expiry.setDate(now.getDate() + 15);

  const info: AccountDeletionInfo = {
    isScheduled: true,
    scheduledAt: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    expiryDate: expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    daysRemaining: 15,
    contactMethod,
    contactValue,
  };

  const settings = getControlPanelSettings();
  settings.quickControls.accountDeletion = info;
  saveControlPanelSettings(settings);
  localStorage.setItem(DELETION_KEY, JSON.stringify(info));
  return info;
}

export function cancelAccountDeletion(): void {
  const settings = getControlPanelSettings();
  settings.quickControls.accountDeletion = null;
  saveControlPanelSettings(settings);
  localStorage.removeItem(DELETION_KEY);
}

export function getAccountDeletionInfo(): AccountDeletionInfo | null {
  try {
    const raw = localStorage.getItem(DELETION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  const settings = getControlPanelSettings();
  return settings.quickControls.accountDeletion;
}
