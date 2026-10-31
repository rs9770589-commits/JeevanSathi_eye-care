/**
 * Client-side photo quality gate for oral screening images.
 * Checks brightness (too dark) and focus (blurry) on a downscaled canvas.
 * This is only a capture-quality helper — it never assesses medical content.
 */

export interface QualityResult {
  ok: boolean;
  note?: string;
}

const MIN_WIDTH = 480;

export async function checkImageQuality(file: Blob): Promise<QualityResult> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    if (img.naturalWidth < MIN_WIDTH) {
      return { ok: false, note: "Photo resolution is too low. Please retake with a better camera setting." };
    }
    const { brightness, focus } = analyze(img);
    if (brightness < 40) {
      return { ok: false, note: "Photo is too dark. Stand facing a door or window and retake." };
    }
    if (focus < 30) {
      return { ok: false, note: "Photo looks blurry. Hold steady and retake." };
    }
    return { ok: true };
  } catch {
    return { ok: true }; // If analysis fails, do not block the upload.
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function analyze(img: HTMLImageElement) {
  const size = 160;
  const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { brightness: 128, focus: 100 };
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0; i < w * h; i++) {
    const g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    gray[i] = g;
    sum += g;
  }
  const brightness = sum / (w * h);

  // Laplacian variance as a focus measure.
  let lapSum = 0;
  let lapSqSum = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      lapSum += lap;
      lapSqSum += lap * lap;
      count++;
    }
  }
  if (count === 0) return { brightness, focus: 100 };
  const mean = lapSum / count;
  const variance = lapSqSum / count - mean * mean;
  // Scale variance to a 0-100-ish score for thresholding.
  const focus = Math.min(100, Math.sqrt(Math.max(0, variance)) * 2.5);
  return { brightness, focus };
}
