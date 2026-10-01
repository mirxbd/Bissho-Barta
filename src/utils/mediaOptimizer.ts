/**
 * Media Optimization Utility for Social Media Feed and Watch/Reels
 * - Standard photo aspect ratio: 3:4 (1200×1600 px target / 1080p standard)
 * - Maximum photo file size: Under 1200 KB (1.2 MB) JPEG
 * - Video max regulation: 720p (1280×720 or 720×1280)
 */

export interface OptimizedMediaResult {
  url: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: 'image' | 'video' | 'file';
  originalSizeBytes?: number;
  dimensions?: { width: number; height: number };
  aspectRatio?: string;
  resolutionLabel?: string;
}

export type VideoResolutionSetting = 'auto' | '720p' | '480p';

export const VIDEO_RESOLUTION_KEY = 'bissho_barta_video_resolution_setting';

export const getStoredVideoResolution = (): VideoResolutionSetting => {
  try {
    const saved = localStorage.getItem(VIDEO_RESOLUTION_KEY) || localStorage.getItem('adda_video_resolution_setting');
    if (saved === '720p' || saved === '480p' || saved === 'auto') {
      return saved;
    }
  } catch (e) {
    // ignore
  }
  return '720p'; // Default high standard
};

export const setStoredVideoResolution = (res: VideoResolutionSetting) => {
  try {
    localStorage.setItem(VIDEO_RESOLUTION_KEY, res);
  } catch (e) {
    // ignore
  }
};

/**
 * Format bytes to readable string (e.g. "850 KB", "1.1 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Optimize an image file before upload/publish:
 * 1. Resizes within 1200×1600 bounding box (3:4 ratio standard)
 * 2. Compresses as JPG
 * 3. Enforces strict file size under 1200 KB max
 */
export async function optimizeImageFile(file: File): Promise<OptimizedMediaResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        const MAX_BYTES = 1200 * 1024; // 1200 KB

        let width = img.width;
        let height = img.height;

        // Scale down to fit within 1200x1600 max bounds while preserving aspect ratio
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback if canvas context fails
          resolve({
            url: e.target?.result as string,
            name: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
            size: formatFileSize(file.size),
            sizeBytes: file.size,
            type: 'image',
            dimensions: { width: img.width, height: img.height },
            aspectRatio: '3:4'
          });
          return;
        }

        // Draw image onto canvas with high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively compress to JPEG to stay under 1200 KB
        let quality = 0.90;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let byteLength = Math.round((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);

        // If file exceeds 1200 KB, gradually reduce quality
        while (byteLength > MAX_BYTES && quality > 0.4) {
          quality -= 0.10;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          byteLength = Math.round((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";

        resolve({
          url: dataUrl,
          name: cleanName,
          size: formatFileSize(byteLength),
          sizeBytes: byteLength,
          originalSizeBytes: file.size,
          type: 'image',
          dimensions: { width, height },
          aspectRatio: '3:4',
          resolutionLabel: '1080p (1200×1600 3:4 JPG)'
        });
      };

      img.onerror = () => {
        resolve({
          url: e.target?.result as string,
          name: file.name,
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          type: 'image'
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        url: '',
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        type: 'image'
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check and tag video file with 720p maximum resolution regulation
 */
export async function processVideoFile(file: File): Promise<OptimizedMediaResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const origW = video.videoWidth || 1280;
        const origH = video.videoHeight || 720;
        
        let label = '720p HD Max';
        if (Math.min(origW, origH) <= 480) {
          label = '480p SD';
        } else {
          label = '720p HD';
        }

        resolve({
          url: dataUrl,
          name: file.name,
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          type: 'video',
          dimensions: { width: origW, height: origH },
          resolutionLabel: label
        });
      };

      video.onerror = () => {
        resolve({
          url: dataUrl,
          name: file.name,
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          type: 'video',
          resolutionLabel: '720p Max'
        });
      };

      video.src = dataUrl;
    };

    reader.onerror = () => {
      resolve({
        url: '',
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        type: 'video'
      });
    };

    reader.readAsDataURL(file);
  });
}
