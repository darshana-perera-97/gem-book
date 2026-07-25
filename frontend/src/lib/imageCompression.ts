/**
 * Client-side image compression.
 *
 * Phone photos are routinely 3-8MB. Uploading them raw costs storage on write and
 * bandwidth on every single view. Resizing/re-encoding in the browser before upload
 * typically cuts payloads by 90%+ with no visible quality loss at display sizes.
 */

const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

export interface CompressResult {
  file: File;
  originalBytes: number;
  compressedBytes: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

export async function compressImage(file: File): Promise<CompressResult> {
  // GIFs would lose animation, and SVGs are already tiny — pass them through.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return { file, originalBytes: file.size, compressedBytes: file.size };
  }

  try {
    const img = await loadImage(file);

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return { file, originalBytes: file.size, compressedBytes: file.size };
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALITY)
    );

    // If compression somehow made it bigger (already-optimised small images), keep the original.
    if (!blob || blob.size >= file.size) {
      return { file, originalBytes: file.size, compressedBytes: file.size };
    }

    const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return { file: compressed, originalBytes: file.size, compressedBytes: compressed.size };
  } catch {
    // Never block an upload because compression failed.
    return { file, originalBytes: file.size, compressedBytes: file.size };
  }
}
