// ═══════════════════════════════════════
//  Image compression & resizing
// ═══════════════════════════════════════
// Compresses images to ~30-50KB for instant uploads (1-2 seconds)

const MAX_DIMENSION = 800;  // Max width OR height
const JPEG_QUALITY = 0.7;   // 0.7 = good enough for face analysis, ~30-50KB

/**
 * Compress a base64 image string to a smaller JPEG.
 * Works for both camera captures (already base64) and gallery uploads.
 * Returns base64 WITHOUT the data: prefix (raw base64 string).
 */
export function compressImage(base64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Calculate new dimensions (maintain aspect ratio)
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        // Draw to canvas at reduced size
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        const rawBase64 = dataUrl.split(',')[1];

        console.log(`[Compress] ${img.naturalWidth}x${img.naturalHeight} → ${width}x${height} (${Math.round(rawBase64.length * 0.75 / 1024)}KB)`);
        resolve(rawBase64);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));

    // Handle both raw base64 and data: URL formats
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Convert raw base64 string to a Blob for upload.
 */
export function base64ToBlob(base64: string, mime = 'image/jpeg'): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

/**
 * Get the proper <img> src for a face image value.
 * Handles: Supabase URLs, data: URLs, raw base64 strings.
 */
export function getImageSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('http')) return value;          // Supabase Storage URL
  if (value.startsWith('data:')) return value;         // Full data URL
  return `data:image/jpeg;base64,${value}`;            // Raw base64
}
