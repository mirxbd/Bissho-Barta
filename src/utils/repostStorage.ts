export interface RepostRecord {
  originalPostId: string;
  repostPostId: string;
  userId: string;
  repostedAt: string;
  quoteContent?: string;
}

const STORAGE_KEY_REPOSTS = 'fb_lite_user_reposts';

export function getRepostRecords(): RepostRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPOSTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function isPostRepostedByMe(originalPostId: string, userId = 'user_me'): boolean {
  const records = getRepostRecords();
  return records.some((r) => r.originalPostId === originalPostId && r.userId === userId);
}

export function recordUserRepost(
  originalPostId: string,
  repostPostId: string,
  quoteContent?: string,
  userId = 'user_me'
): void {
  const records = getRepostRecords();
  const existing = records.find(
    (r) => r.originalPostId === originalPostId && r.userId === userId
  );
  if (existing) return;

  const newRecord: RepostRecord = {
    originalPostId,
    repostPostId,
    userId,
    repostedAt: new Date().toISOString(),
    quoteContent,
  };

  const next = [newRecord, ...records];
  try {
    localStorage.setItem(STORAGE_KEY_REPOSTS, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('reposts-changed', { detail: next }));
  } catch {}
}

export function removeUserRepost(originalPostId: string, userId = 'user_me'): string | null {
  const records = getRepostRecords();
  const match = records.find((r) => r.originalPostId === originalPostId && r.userId === userId);
  if (!match) return null;

  const next = records.filter(
    (r) => !(r.originalPostId === originalPostId && r.userId === userId)
  );
  try {
    localStorage.setItem(STORAGE_KEY_REPOSTS, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('reposts-changed', { detail: next }));
  } catch {}
  return match.repostPostId;
}
