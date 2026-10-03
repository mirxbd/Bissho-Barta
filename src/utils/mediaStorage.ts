import { Post, Story, UserProfile, Attachment } from '../types';

const DB_NAME = 'BisshoBartaMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media';
export const IDB_PREFIX = 'idb://';

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function saveMediaToIndexedDB(mediaId: string, dataUrl: string): Promise<string> {
  const key = mediaId.startsWith(IDB_PREFIX) ? mediaId : `${IDB_PREFIX}${mediaId}`;
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(dataUrl, key);
    req.onsuccess = () => resolve(key);
    req.onerror = () => reject(req.error || new Error('Failed to write media to IndexedDB'));
    tx.oncomplete = () => db.close();
  });
}

export async function getMediaFromIndexedDB(mediaId: string): Promise<string | null> {
  const key = mediaId.startsWith(IDB_PREFIX) ? mediaId : `${IDB_PREFIX}${mediaId}`;
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null);
    req.onerror = () => reject(req.error || new Error('Failed to read media from IndexedDB'));
    tx.oncomplete = () => db.close();
  });
}

export async function deleteMediaFromIndexedDB(mediaId: string): Promise<void> {
  if (!mediaId) return;
  const key = mediaId.startsWith(IDB_PREFIX) ? mediaId : `${IDB_PREFIX}${mediaId}`;
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Failed to delete media from IndexedDB'));
    tx.oncomplete = () => db.close();
  });
}

export async function deletePostMediaFromIndexedDB(post: Post): Promise<void> {
  const idsToDelete = new Set<string>();
  if (post.imageMediaId) idsToDelete.add(post.imageMediaId);
  if (post.videoMediaId) idsToDelete.add(post.videoMediaId);
  if (post.image?.startsWith(IDB_PREFIX)) idsToDelete.add(post.image);
  if (post.videoUrl?.startsWith(IDB_PREFIX)) idsToDelete.add(post.videoUrl);
  if (post.attachment?.mediaId) idsToDelete.add(post.attachment.mediaId);
  if (post.attachment?.url?.startsWith(IDB_PREFIX)) idsToDelete.add(post.attachment.url);
  if (post.attachments) {
    post.attachments.forEach((att, idx) => {
      if (att.mediaId) idsToDelete.add(att.mediaId);
      if (att.url?.startsWith(IDB_PREFIX)) idsToDelete.add(att.url);
      idsToDelete.add(`${IDB_PREFIX}post_${post.id}_att_${idx}`);
    });
  }
  idsToDelete.add(`${IDB_PREFIX}post_${post.id}_img`);
  idsToDelete.add(`${IDB_PREFIX}post_${post.id}_vid`);
  idsToDelete.add(`${IDB_PREFIX}post_${post.id}_att_main`);

  await Promise.all(
    Array.from(idsToDelete).map((id) => deleteMediaFromIndexedDB(id).catch(() => {}))
  );
}

export function isBase64DataUrl(url?: string): boolean {
  return Boolean(url && url.startsWith('data:'));
}

async function dehydrateAttachment(att: Attachment, keyPrefix: string): Promise<Attachment> {
  if (isBase64DataUrl(att.url)) {
    const refId = att.mediaId || `${IDB_PREFIX}${keyPrefix}`;
    await saveMediaToIndexedDB(refId, att.url);
    return { ...att, url: refId, mediaId: refId };
  }
  return att;
}

async function hydrateAttachment(att: Attachment): Promise<Attachment> {
  if (att.url?.startsWith(IDB_PREFIX)) {
    const loaded = await getMediaFromIndexedDB(att.url);
    if (loaded) return { ...att, url: loaded, mediaId: att.url };
  } else if (att.mediaId && !att.url) {
    const loaded = await getMediaFromIndexedDB(att.mediaId);
    if (loaded) return { ...att, url: loaded };
  }
  return att;
}

export async function persistPostsWithIndexedDB(posts: Post[]): Promise<Post[]> {
  return Promise.all(
    posts.map(async (post) => {
      let image = post.image;
      let imageMediaId = post.imageMediaId;
      let videoUrl = post.videoUrl;
      let videoMediaId = post.videoMediaId;

      if (isBase64DataUrl(image)) {
        const refId = imageMediaId || `${IDB_PREFIX}post_${post.id}_img`;
        await saveMediaToIndexedDB(refId, image!);
        imageMediaId = refId;
        image = refId;
      }

      if (isBase64DataUrl(videoUrl)) {
        const refId = videoMediaId || `${IDB_PREFIX}post_${post.id}_vid`;
        await saveMediaToIndexedDB(refId, videoUrl!);
        videoMediaId = refId;
        videoUrl = refId;
      }

      const attachment = post.attachment
        ? await dehydrateAttachment(post.attachment, `post_${post.id}_att_main`)
        : undefined;

      const attachments = post.attachments
        ? await Promise.all(
            post.attachments.map((att, idx) =>
              dehydrateAttachment(att, `post_${post.id}_att_${idx}`)
            )
          )
        : undefined;

      let sharedPost = post.sharedPost;
      if (sharedPost) {
        let sImage = sharedPost.image;
        let sVideo = sharedPost.videoUrl;
        if (isBase64DataUrl(sImage)) {
          const sRef = `${IDB_PREFIX}post_${sharedPost.id}_img`;
          await saveMediaToIndexedDB(sRef, sImage!);
          sImage = sRef;
        }
        if (isBase64DataUrl(sVideo)) {
          const sRef = `${IDB_PREFIX}post_${sharedPost.id}_vid`;
          await saveMediaToIndexedDB(sRef, sVideo!);
          sVideo = sRef;
        }
        sharedPost = { ...sharedPost, image: sImage, videoUrl: sVideo };
      }

      return {
        ...post,
        image,
        imageMediaId,
        videoUrl,
        videoMediaId,
        attachment,
        attachments,
        sharedPost,
      };
    })
  );
}

export async function hydratePostsFromIndexedDB(posts: Post[]): Promise<Post[]> {
  return Promise.all(
    posts.map(async (post) => {
      let image = post.image;
      let videoUrl = post.videoUrl;

      if (image?.startsWith(IDB_PREFIX)) {
        const loaded = await getMediaFromIndexedDB(image);
        if (loaded) image = loaded;
      } else if (!image && post.imageMediaId) {
        const loaded = await getMediaFromIndexedDB(post.imageMediaId);
        if (loaded) image = loaded;
      }

      if (videoUrl?.startsWith(IDB_PREFIX)) {
        const loaded = await getMediaFromIndexedDB(videoUrl);
        if (loaded) videoUrl = loaded;
      } else if (!videoUrl && post.videoMediaId) {
        const loaded = await getMediaFromIndexedDB(post.videoMediaId);
        if (loaded) videoUrl = loaded;
      }

      const attachment = post.attachment
        ? await hydrateAttachment(post.attachment)
        : undefined;

      const attachments = post.attachments
        ? await Promise.all(post.attachments.map((att) => hydrateAttachment(att)))
        : undefined;

      let sharedPost = post.sharedPost;
      if (sharedPost) {
        let sImage = sharedPost.image;
        let sVideo = sharedPost.videoUrl;
        if (sImage?.startsWith(IDB_PREFIX)) {
          const loaded = await getMediaFromIndexedDB(sImage);
          if (loaded) sImage = loaded;
        }
        if (sVideo?.startsWith(IDB_PREFIX)) {
          const loaded = await getMediaFromIndexedDB(sVideo);
          if (loaded) sVideo = loaded;
        }
        sharedPost = { ...sharedPost, image: sImage, videoUrl: sVideo };
      }

      return {
        ...post,
        image,
        videoUrl,
        attachment,
        attachments,
        sharedPost,
      };
    })
  );
}

export async function persistStoriesWithIndexedDB(stories: Story[]): Promise<Story[]> {
  return Promise.all(
    stories.map(async (story) => {
      let storyImage = story.storyImage;
      let storyMediaId = story.storyMediaId;

      if (isBase64DataUrl(storyImage)) {
        const refId = storyMediaId || `${IDB_PREFIX}story_${story.id}_img`;
        await saveMediaToIndexedDB(refId, storyImage);
        storyMediaId = refId;
        storyImage = refId;
      }

      return { ...story, storyImage, storyMediaId };
    })
  );
}

export async function hydrateStoriesFromIndexedDB(stories: Story[]): Promise<Story[]> {
  return Promise.all(
    stories.map(async (story) => {
      let storyImage = story.storyImage;
      if (storyImage?.startsWith(IDB_PREFIX)) {
        const loaded = await getMediaFromIndexedDB(storyImage);
        if (loaded) storyImage = loaded;
      }
      return { ...story, storyImage };
    })
  );
}

export async function persistProfileWithIndexedDB(profile: UserProfile): Promise<UserProfile> {
  let avatar = profile.avatar;
  let coverPhoto = profile.coverPhoto;
  const userId = profile.id || 'user_me';

  if (isBase64DataUrl(avatar)) {
    const refId = `${IDB_PREFIX}profile_${userId}_avatar`;
    await saveMediaToIndexedDB(refId, avatar);
    avatar = refId;
  }
  if (isBase64DataUrl(coverPhoto)) {
    const refId = `${IDB_PREFIX}profile_${userId}_cover`;
    await saveMediaToIndexedDB(refId, coverPhoto);
    coverPhoto = refId;
  }

  return { ...profile, id: userId, avatar, coverPhoto };
}

export async function hydrateProfileFromIndexedDB(profile: UserProfile): Promise<UserProfile> {
  let avatar = profile.avatar;
  let coverPhoto = profile.coverPhoto;

  if (avatar?.startsWith(IDB_PREFIX)) {
    const loaded = await getMediaFromIndexedDB(avatar);
    if (loaded) avatar = loaded;
  }
  if (coverPhoto?.startsWith(IDB_PREFIX)) {
    const loaded = await getMediaFromIndexedDB(coverPhoto);
    if (loaded) coverPhoto = loaded;
  }

  return { ...profile, id: profile.id || 'user_me', avatar, coverPhoto };
}
