export interface SavedItem {
  postId: string;
  userId: string;
  savedAt: string;
  folder: string;
}

const STORAGE_KEY_SAVED_ITEMS = 'fb_lite_saved_items';
const STORAGE_KEY_SAVED_FOLDERS = 'fb_lite_saved_folders';

export const DEFAULT_SAVED_FOLDERS = ['All Saved', 'News', 'Watch Later', 'Read Later'];

export function getSavedFolders(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_FOLDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure defaults are always present
        const merged = Array.from(new Set([...DEFAULT_SAVED_FOLDERS, ...parsed]));
        return merged;
      }
    }
  } catch {}
  return [...DEFAULT_SAVED_FOLDERS];
}

export function createSavedFolder(name: string): boolean {
  const clean = name.trim();
  if (!clean) return false;
  const current = getSavedFolders();
  if (current.some((f) => f.toLowerCase() === clean.toLowerCase())) {
    return false;
  }
  const next = [...current, clean];
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_FOLDERS, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('saved-folders-changed', { detail: next }));
    return true;
  } catch {
    return false;
  }
}

export function getSavedItems(): SavedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function isPostSaved(postId: string, userId = 'user_me'): boolean {
  const items = getSavedItems();
  return items.some((item) => item.postId === postId && item.userId === userId);
}

export function savePostItem(postId: string, folder = 'All Saved', userId = 'user_me'): boolean {
  const items = getSavedItems();
  const existing = items.find((item) => item.postId === postId && item.userId === userId);
  if (existing) {
    // If already saved, update folder if needed
    if (existing.folder !== folder) {
      const updated = items.map((item) =>
        item.postId === postId && item.userId === userId ? { ...item, folder } : item
      );
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_ITEMS, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('saved-posts-changed', { detail: updated }));
      } catch {}
    }
    return true;
  }

  const newItem: SavedItem = {
    postId,
    userId,
    savedAt: new Date().toISOString(),
    folder: folder || 'All Saved',
  };

  const updated = [newItem, ...items];
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_ITEMS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('saved-posts-changed', { detail: updated }));
    return true;
  } catch {
    return false;
  }
}

export function unsavePostItem(postId: string, userId = 'user_me'): boolean {
  const items = getSavedItems();
  const updated = items.filter((item) => !(item.postId === postId && item.userId === userId));
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_ITEMS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('saved-posts-changed', { detail: updated }));
    return true;
  } catch {
    return false;
  }
}

export function getSavedItemForPost(postId: string, userId = 'user_me'): SavedItem | undefined {
  const items = getSavedItems();
  return items.find((item) => item.postId === postId && item.userId === userId);
}
