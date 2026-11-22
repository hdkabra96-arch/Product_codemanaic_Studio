import { PDFDocument } from 'pdf-lib';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

/**
 * Loads an image from File, Blob, or URL into an HTMLImageElement
 */
export function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let url = '';

    if (typeof source === 'string') {
      url = source;
    } else {
      url = URL.createObjectURL(source);
    }

    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
      reject(new Error('Failed to load image file: ' + String(e)));
    };
    img.src = url;
  });
}

/**
 * Get dimensions of image file
 */
export async function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
}

/**
 * Helper to convert Canvas to Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/png',
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob conversion failed'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Image Conversion: Supports PNG, JPEG, WEBP, and BMP
 */
export interface ConvertOptions {
  targetFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number; // 0.1 to 1.0
  backgroundColor?: string; // used when target format does not support transparency (e.g. JPEG)
}

export async function convertImage(
  file: File,
  options: ConvertOptions
): Promise<{
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
}> {
  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas 2D context');

  // If converting to JPEG, fill background with chosen color (default white)
  if (options.targetFormat === 'image/jpeg') {
    ctx.fillStyle = options.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0);

  const quality = options.quality !== undefined ? options.quality : 0.92;
  const blob = await canvasToBlob(canvas, options.targetFormat, quality);

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  let ext = 'png';
  if (options.targetFormat === 'image/jpeg') ext = 'jpg';
  else if (options.targetFormat === 'image/webp') ext = 'webp';

  return {
    blob,
    fileName: `${baseName}.${ext}`,
    width,
    height,
    originalSize: file.size,
    newSize: blob.size,
  };
}

/**
 * Image Compression
 */
export interface CompressOptions {
  quality: number; // 0.1 to 1.0
  scale?: number; // 0.25 to 1.0
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export async function compressImage(
  file: File,
  options: CompressOptions
): Promise<{
  blob: Blob;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  percentReduction: number;
  width: number;
  height: number;
}> {
  const img = await loadImage(file);
  const scale = options.scale || 1.0;
  const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Determine format
  const format =
    options.format ||
    (file.type === 'image/webp'
      ? 'image/webp'
      : file.type === 'image/png'
      ? 'image/jpeg' // PNG to JPEG gives huge compression while preserving visual fidelity
      : 'image/jpeg');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, format, options.quality);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';

  const originalSize = file.size;
  const compressedSize = blob.size;
  const percentReduction = Math.max(
    0,
    Math.round(((originalSize - compressedSize) / originalSize) * 100)
  );

  return {
    blob,
    fileName: `${baseName}_compressed.${ext}`,
    originalSize,
    compressedSize,
    percentReduction,
    width,
    height,
  };
}

/**
 * Image Resizing
 */
export interface ResizeOptions {
  targetWidth: number;
  targetHeight: number;
  mode: 'stretch' | 'contain' | 'cover';
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

export async function resizeImage(
  file: File,
  options: ResizeOptions
): Promise<{
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
}> {
  const img = await loadImage(file);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const { targetWidth, targetHeight, mode } = options;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const format = options.format || (file.type as any) || 'image/png';
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  if (mode === 'stretch') {
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  } else if (mode === 'contain') {
    const scale = Math.min(targetWidth / srcW, targetHeight / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const x = (targetWidth - drawW) / 2;
    const y = (targetHeight - drawH) / 2;
    ctx.drawImage(img, x, y, drawW, drawH);
  } else if (mode === 'cover') {
    const scale = Math.max(targetWidth / srcW, targetHeight / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const x = (targetWidth - drawW) / 2;
    const y = (targetHeight - drawH) / 2;
    ctx.drawImage(img, x, y, drawW, drawH);
  }

  const quality = options.quality || 0.92;
  const blob = await canvasToBlob(canvas, format, quality);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';

  return {
    blob,
    fileName: `${baseName}_resized_${targetWidth}x${targetHeight}.${ext}`,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Image Editor: Filters, adjustments, orientation, text overlays
 */
export interface EditorOptions {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  grayscale: number; // 0 to 100
  sepia: number; // 0 to 100
  invert: boolean;
  blur: number; // 0 to 20 px
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  textAnnotation?: {
    text: string;
    fontSize: number;
    color: string;
    position: 'top' | 'center' | 'bottom';
  };
}

export async function processImageEditor(
  file: File,
  options: EditorOptions
): Promise<{ blob: Blob; fileName: string }> {
  const img = await loadImage(file);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  // Determine canvas dimensions based on 90 / 270 deg rotations
  const isRotatedSideways = options.rotation % 180 !== 0;
  const outW = isRotatedSideways ? srcH : srcW;
  const outH = isRotatedSideways ? srcW : srcH;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.save();

  // Position transform center
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((options.rotation * Math.PI) / 180);
  ctx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);

  // CSS filter string
  const bVal = 100 + options.brightness;
  const cVal = 100 + options.contrast;
  const sVal = 100 + options.saturation;
  const filterParts = [
    `brightness(${bVal}%)`,
    `contrast(${cVal}%)`,
    `saturate(${sVal}%)`,
  ];
  if (options.grayscale > 0) filterParts.push(`grayscale(${options.grayscale}%)`);
  if (options.sepia > 0) filterParts.push(`sepia(${options.sepia}%)`);
  if (options.invert) filterParts.push('invert(100%)');
  if (options.blur > 0) filterParts.push(`blur(${options.blur}px)`);

  ctx.filter = filterParts.join(' ');
  ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH);
  ctx.restore();

  // Optional Text Annotation
  if (options.textAnnotation && options.textAnnotation.text.trim()) {
    ctx.save();
    const { text, fontSize, color, position } = options.textAnnotation;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const x = outW / 2;
    let y = outH / 2;
    if (position === 'top') y = fontSize + 24;
    else if (position === 'bottom') y = outH - 24;

    ctx.fillText(text, x, y);
    ctx.restore();
  }

  const blob = await canvasToBlob(canvas, 'image/png');
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return {
    blob,
    fileName: `${baseName}_edited.png`,
  };
}

/**
 * Image Cropping
 */
export async function cropImage(
  file: File,
  cropRect: { x: number; y: number; width: number; height: number },
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<{ blob: Blob; fileName: string }> {
  const img = await loadImage(file);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  // Boundary clamp
  const safeX = Math.max(0, Math.min(srcW - 1, cropRect.x));
  const safeY = Math.max(0, Math.min(srcH - 1, cropRect.y));
  const safeW = Math.max(1, Math.min(srcW - safeX, cropRect.width));
  const safeH = Math.max(1, Math.min(srcH - safeY, cropRect.height));

  const canvas = document.createElement('canvas');
  canvas.width = safeW;
  canvas.height = safeH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, safeW, safeH);
  }

  ctx.drawImage(img, safeX, safeY, safeW, safeH, 0, 0, safeW, safeH);

  const blob = await canvasToBlob(canvas, format, 0.95);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = format === 'image/jpeg' ? 'jpg' : 'png';
  return {
    blob,
    fileName: `${baseName}_cropped.${ext}`,
  };
}

/**
 * Background Remover (Smart Chroma, Edge-Connected Flood Fill & Human Subject Protection)
 */
export interface BackgroundRemoverOptions {
  tolerance: number; // 5 to 80 (distance threshold)
  edgeSmooth?: number; // 0 to 5
  targetBg: 'transparent' | 'color';
  bgColor?: string;
  sampleColor?: { r: number; g: number; b: number };
  samplePoint?: { x: number; y: number };
  mode?: 'flood' | 'global';
  protectSubject?: boolean; // Protect face, skin, clothing, and subject core from being deleted
  eraserMask?: Uint8ClampedArray | Uint8Array; // Optional manual erased pixels (1 = erase, 0 = keep)
  restoreMask?: Uint8ClampedArray | Uint8Array; // Optional manual restored pixels (1 = restore, 0 = noop)
}

/**
 * Checks if a pixel matches human skin chromatic properties in YCbCr and RGB color spaces.
 * Universal across diverse skin tones (light, medium, dark).
 */
function isHumanSkinTone(r: number, g: number, b: number): boolean {
  // YCbCr conversion
  const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
  const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;

  // Standard skin locus in Cb-Cr plane
  const inCbCr = cb >= 77 && cb <= 128 && cr >= 133 && cr <= 173;

  // Normalized RGB skin heuristics
  const inRgb =
    r > 50 &&
    g > 30 &&
    b > 20 &&
    r >= g &&
    r >= b &&
    r - g >= 8 &&
    Math.abs(r - g) > 8;

  return inCbCr || inRgb;
}

export async function removeBackground(
  file: File,
  options: BackgroundRemoverOptions
): Promise<{ blob: Blob; fileName: string }> {
  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Build Subject & Skin Protection Shield if protectSubject !== false
  const protectSubject = options.protectSubject !== false;
  const isSubject = new Uint8Array(width * height);

  if (protectSubject) {
    const rawSkin = new Uint8Array(width * height);
    let skinPixelCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pIdx = y * width + x;
        const dIdx = pIdx * 4;
        const r = data[dIdx];
        const g = data[dIdx + 1];
        const b = data[dIdx + 2];

        if (isHumanSkinTone(r, g, b)) {
          rawSkin[pIdx] = 1;
          skinPixelCount++;
        }
      }
    }

    // If skin pixels are present (human in frame), dilate the facial envelope to shield
    // hair, beard, eyes, eyebrows, lips, neck and torso from being eaten by background flood
    if (skinPixelCount > 40) {
      const radius = Math.max(16, Math.min(32, Math.round(Math.min(width, height) / 25)));
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pIdx = y * width + x;
          if (rawSkin[pIdx]) {
            // Dilate surrounding window
            const minX = Math.max(0, x - radius);
            const maxX = Math.min(width - 1, x + radius);
            const minY = Math.max(0, y - radius);
            const maxY = Math.min(height - 1, y + radius);

            for (let ny = minY; ny <= maxY; ny++) {
              for (let nx = minX; nx <= maxX; nx++) {
                isSubject[ny * width + nx] = 1;
              }
            }
          }
        }
      }
    }
  }

  // 2. Determine reference background color
  let refR = 255;
  let refG = 255;
  let refB = 255;

  if (options.samplePoint) {
    const px = Math.min(width - 1, Math.max(0, Math.round(options.samplePoint.x)));
    const py = Math.min(height - 1, Math.max(0, Math.round(options.samplePoint.y)));
    const idx = (py * width + px) * 4;
    refR = data[idx];
    refG = data[idx + 1];
    refB = data[idx + 2];
  } else if (options.sampleColor) {
    refR = options.sampleColor.r;
    refG = options.sampleColor.g;
    refB = options.sampleColor.b;
  } else {
    // Sample along the 4 borders (strictly avoiding any subject shield pixels)
    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    const step = Math.max(1, Math.floor(Math.min(width, height) / 40));

    // Top & Bottom rows
    for (let x = 0; x < width; x += step) {
      const topP = x;
      const botP = (height - 1) * width + x;

      if (!isSubject[topP]) {
        sumR += data[topP * 4];
        sumG += data[topP * 4 + 1];
        sumB += data[topP * 4 + 2];
        count++;
      }
      if (!isSubject[botP]) {
        sumR += data[botP * 4];
        sumG += data[botP * 4 + 1];
        sumB += data[botP * 4 + 2];
        count++;
      }
    }

    // Left & Right columns
    for (let y = 0; y < height; y += step) {
      const leftP = y * width;
      const rightP = y * width + (width - 1);

      if (!isSubject[leftP]) {
        sumR += data[leftP * 4];
        sumG += data[leftP * 4 + 1];
        sumB += data[leftP * 4 + 2];
        count++;
      }
      if (!isSubject[rightP]) {
        sumR += data[rightP * 4];
        sumG += data[rightP * 4 + 1];
        sumB += data[rightP * 4 + 2];
        count++;
      }
    }

    if (count > 0) {
      refR = Math.round(sumR / count);
      refG = Math.round(sumG / count);
      refB = Math.round(sumB / count);
    }
  }

  const tol = options.tolerance * 2.2;
  const tolSq = tol * tol;
  const softTolSq = tolSq * 1.5;

  const useFlood = options.mode !== 'global';
  const isBg = new Uint8Array(width * height);

  if (useFlood) {
    // Breadth-First Flood Fill starting strictly from image borders
    const queue = new Int32Array(width * height);
    let qHead = 0;
    let qTail = 0;

    const pushPixel = (x: number, y: number) => {
      const pIdx = y * width + x;
      if (isBg[pIdx]) return;
      // SUBJECT SHIELD: Never flood into human face or protected subject!
      if (isSubject[pIdx]) return;

      const dIdx = pIdx * 4;
      const dr = data[dIdx] - refR;
      const dg = data[dIdx + 1] - refG;
      const db = data[dIdx + 2] - refB;

      if (dr * dr + dg * dg + db * db <= softTolSq) {
        isBg[pIdx] = 1;
        queue[qTail++] = pIdx;
      }
    };

    // Seed from all edges where subject shield is not present
    for (let x = 0; x < width; x++) {
      pushPixel(x, 0);
      pushPixel(x, height - 1);
    }
    for (let y = 1; y < height - 1; y++) {
      pushPixel(0, y);
      pushPixel(width - 1, y);
    }

    if (options.samplePoint) {
      pushPixel(
        Math.min(width - 1, Math.max(0, Math.round(options.samplePoint.x))),
        Math.min(height - 1, Math.max(0, Math.round(options.samplePoint.y)))
      );
    }

    // Process BFS Queue
    while (qHead < qTail) {
      const curr = queue[qHead++];
      const cx = curr % width;
      const cy = Math.floor(curr / width);

      if (cx > 0) pushPixel(cx - 1, cy);
      if (cx < width - 1) pushPixel(cx + 1, cy);
      if (cy > 0) pushPixel(cx, cy - 1);
      if (cy < height - 1) pushPixel(cx, cy + 1);
    }

    // Apply alpha based on flood result
    for (let i = 0; i < width * height; i++) {
      const dIdx = i * 4;
      // Guaranteed: Subject shield pixels ALWAYS remain 100% opaque original image
      if (isSubject[i]) {
        data[dIdx + 3] = 255;
        continue;
      }

      if (isBg[i]) {
        const dr = data[dIdx] - refR;
        const dg = data[dIdx + 1] - refG;
        const db = data[dIdx + 2] - refB;
        const distSq = dr * dr + dg * dg + db * db;
        if (distSq <= tolSq) {
          data[dIdx + 3] = 0; // Pure transparent
        } else {
          // Feathered alpha edge
          const alphaFactor = (distSq - tolSq) / (softTolSq - tolSq);
          data[dIdx + 3] = Math.round(255 * Math.min(1, Math.max(0, alphaFactor)));
        }
      }
    }
  } else {
    // Global color distance pass with subject protection
    for (let i = 0; i < data.length; i += 4) {
      const pIdx = i / 4;
      if (isSubject[pIdx]) {
        data[i + 3] = 255; // Shielded
        continue;
      }

      const dr = data[i] - refR;
      const dg = data[i + 1] - refG;
      const db = data[i + 2] - refB;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq < tolSq) {
        data[i + 3] = 0;
      } else if (distSq < softTolSq) {
        const factor = (distSq - tolSq) / (softTolSq - tolSq);
        data[i + 3] = Math.round(data[i + 3] * Math.min(1, Math.max(0, factor)));
      }
    }
  }

  // Apply manual touchup masks if provided
  if (options.eraserMask) {
    for (let i = 0; i < width * height; i++) {
      if (options.eraserMask[i]) data[i * 4 + 3] = 0;
    }
  }
  if (options.restoreMask) {
    for (let i = 0; i < width * height; i++) {
      if (options.restoreMask[i]) data[i * 4 + 3] = 255;
    }
  }

  // If user requested solid replacement color instead of transparent
  if (options.targetBg === 'color' && options.bgColor) {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) throw new Error('Out canvas failed');

    outCtx.fillStyle = options.bgColor;
    outCtx.fillRect(0, 0, width, height);
    ctx.putImageData(imgData, 0, 0);
    outCtx.drawImage(canvas, 0, 0);

    const blob = await canvasToBlob(outCanvas, 'image/png');
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return { blob, fileName: `${baseName}_nobg.png` };
  }

  ctx.putImageData(imgData, 0, 0);
  const blob = await canvasToBlob(canvas, 'image/png');
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return { blob, fileName: `${baseName}_nobg.png` };
}

/**
 * Watermark Removal Options
 */
export interface WatermarkRemoverOptions {
  rect?: { x: number; y: number; width: number; height: number };
  brushMask?: Uint8Array | Uint8ClampedArray; // Optional brush mask from manual painting (1 = watermark, 0 = keep)
  sensitivity?: number; // 10 to 50 (threshold for localized watermark stroke detection)
  onlyStrokes?: boolean; // If true, selectively detects watermark strokes inside rect and leaves background 100% untouched
  format?: 'image/png' | 'image/jpeg';
}

/**
 * Remove Watermark from Image using Telea Fast Marching Inpainting & Morphological Stroke Detection.
 * Preserves 100% untouched background, clouds, sky gradients, textures, and details with ZERO blur.
 */
export async function removeWatermarkInpaint(
  file: File,
  maskOrOptions: { x: number; y: number; width: number; height: number } | WatermarkRemoverOptions,
  legacyFormat: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<{ blob: Blob; fileName: string; preservedPercent?: number }> {
  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Draw original image exactly without modifications
  ctx.drawImage(img, 0, 0);

  // Parse options
  const isDirectRect = 'x' in maskOrOptions;
  const rect = isDirectRect
    ? maskOrOptions
    : (maskOrOptions.rect || { x: 0, y: 0, width, height });

  const brushMask = !isDirectRect ? maskOrOptions.brushMask : undefined;
  const sensitivity = !isDirectRect ? (maskOrOptions.sensitivity ?? 22) : 22;
  const onlyStrokes = !isDirectRect ? (maskOrOptions.onlyStrokes ?? true) : true;
  const format = !isDirectRect ? (maskOrOptions.format || legacyFormat) : legacyFormat;

  // Clamp bounding box to valid image bounds
  const x0 = Math.max(0, Math.min(width - 1, Math.round(rect.x)));
  const y0 = Math.max(0, Math.min(height - 1, Math.round(rect.y)));
  const w = Math.max(1, Math.min(width - x0, Math.round(rect.width)));
  const h = Math.max(1, Math.min(height - y0, Math.round(rect.height)));

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Working copy of image RGB channels
  const rArr = new Uint8Array(width * height);
  const gArr = new Uint8Array(width * height);
  const bArr = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    rArr[i] = data[i * 4];
    gArr[i] = data[i * 4 + 1];
    bArr[i] = data[i * 4 + 2];
  }

  // 1. Build initial binary mask: 1 = to inpaint, 0 = keep 100% untouched
  const mask = new Uint8Array(width * height);
  let maskedPixelCount = 0;

  if (brushMask) {
    // If user painted with the precision highlighter brush, use brush mask directly
    for (let i = 0; i < width * height; i++) {
      if (brushMask[i]) {
        mask[i] = 1;
        maskedPixelCount++;
      }
    }
  }

  // If no brush mask (or box mode), process the region
  if (maskedPixelCount === 0) {
    if (!onlyStrokes) {
      // Entire box inpainting (for stickers, opaque stamps, solid logos)
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          mask[y * width + x] = 1;
          maskedPixelCount++;
        }
      }
    } else {
      // ZERO-BLUR SMART STROKE EXTRACTION:
      // Watermark text and logos consist of localized high-frequency strokes over a smooth photo background.
      // We estimate the local background color at radius 7-10 (outside the stroke width)
      // and only mark pixels whose contrast deviation exceeds sensitivity.
      const sampleDist = 8;
      const detectedStrokes = new Uint8Array(width * height);

      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          const pIdx = y * width + x;
          const curR = rArr[pIdx];
          const curG = gArr[pIdx];
          const curB = bArr[pIdx];

          // Sample 8 outer background ring samples at distance sampleDist
          let bgSumR = 0;
          let bgSumG = 0;
          let bgSumB = 0;
          let bgCount = 0;

          const offsets = [
            [-sampleDist, 0], [sampleDist, 0], [0, -sampleDist], [0, sampleDist],
            [-sampleDist, -sampleDist], [sampleDist, -sampleDist],
            [-sampleDist, sampleDist], [sampleDist, sampleDist]
          ];

          for (let k = 0; k < offsets.length; k++) {
            const nx = x + offsets[k][0];
            const ny = y + offsets[k][1];
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              bgSumR += rArr[nIdx];
              bgSumG += gArr[nIdx];
              bgSumB += bArr[nIdx];
              bgCount++;
            }
          }

          if (bgCount > 0) {
            const bgR = bgSumR / bgCount;
            const bgG = bgSumG / bgCount;
            const bgB = bgSumB / bgCount;

            // Maximum color difference or luminance contrast
            const diffR = Math.abs(curR - bgR);
            const diffG = Math.abs(curG - bgG);
            const diffB = Math.abs(curB - bgB);
            const maxDiff = Math.max(diffR, diffG, diffB);
            const lumDiff = Math.abs(
              (0.299 * curR + 0.587 * curG + 0.114 * curB) -
              (0.299 * bgR + 0.587 * bgG + 0.114 * bgB)
            );

            if (maxDiff > sensitivity || lumDiff > sensitivity * 0.9) {
              detectedStrokes[pIdx] = 1;
            }
          }
        }
      }

      // Morphological Dilation (1-2px) to fully encompass anti-aliased font edges
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          const pIdx = y * width + x;
          if (detectedStrokes[pIdx]) {
            mask[pIdx] = 1;
            maskedPixelCount++;
            continue;
          }

          // Check if any immediate neighbor is a stroke
          let hasStrokeNeighbor = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= x0 && nx < x0 + w && ny >= y0 && ny < y0 + h) {
                if (detectedStrokes[ny * width + nx]) {
                  hasStrokeNeighbor = true;
                  break;
                }
              }
            }
            if (hasStrokeNeighbor) break;
          }

          if (hasStrokeNeighbor) {
            mask[pIdx] = 1;
            maskedPixelCount++;
          }
        }
      }
    }
  }

  // 2. High-Performance Telea Fast Marching Inpainting:
  // Propagates color and gradients inward from boundary layers.
  // Never creates a blurry smear: maintains continuous isophotes and gradients.
  if (maskedPixelCount > 0) {
    // Determine active processing window around the mask (with padding of 12px)
    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const pad = 12;
    const ax0 = Math.max(0, minX - pad);
    const ay0 = Math.max(0, minY - pad);
    const ax1 = Math.min(width - 1, maxX + pad);
    const ay1 = Math.min(height - 1, maxY + pad);

    // Pixel states: 0 = KNOWN, 1 = BAND, 2 = INSIDE
    const state = new Uint8Array(width * height);
    const dist = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) dist[i] = 1e6;

    // Narrow band queue
    const bandQueue: number[] = [];

    for (let y = ay0; y <= ay1; y++) {
      for (let x = ax0; x <= ax1; x++) {
        const pIdx = y * width + x;
        if (mask[pIdx]) {
          state[pIdx] = 2; // INSIDE
        } else {
          state[pIdx] = 0; // KNOWN
          dist[pIdx] = 0;
        }
      }
    }

    // Find initial BAND pixels (INSIDE pixels having at least one KNOWN 4-neighbor)
    for (let y = ay0; y <= ay1; y++) {
      for (let x = ax0; x <= ax1; x++) {
        const pIdx = y * width + x;
        if (state[pIdx] === 2) {
          let hasKnown = false;
          if (x > 0 && state[pIdx - 1] === 0) hasKnown = true;
          else if (x < width - 1 && state[pIdx + 1] === 0) hasKnown = true;
          else if (y > 0 && state[pIdx - width] === 0) hasKnown = true;
          else if (y < height - 1 && state[pIdx + width] === 0) hasKnown = true;

          if (hasKnown) {
            state[pIdx] = 1; // BAND
            dist[pIdx] = 1;
            bandQueue.push(pIdx);
          }
        }
      }
    }

    // Process narrow band moving inward
    const inpaintRadius = 4;
    let head = 0;

    while (head < bandQueue.length) {
      const curr = bandQueue[head++];
      const cx = curr % width;
      const cy = Math.floor(curr / width);

      // Compute normal vector n = (gradX, gradY) from distance field
      let gradX = 0;
      let gradY = 0;
      if (cx > 0 && cx < width - 1) gradX = (dist[curr + 1] - dist[curr - 1]) * 0.5;
      if (cy > 0 && cy < height - 1) gradY = (dist[curr + width] - dist[curr - width]) * 0.5;
      const gradLen = Math.sqrt(gradX * gradX + gradY * gradY);
      const nx = gradLen > 1e-4 ? gradX / gradLen : 0;
      const ny = gradLen > 1e-4 ? gradY / gradLen : 0;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let totalW = 0;

      // Sample KNOWN neighbors in small radius
      const yMin = Math.max(0, cy - inpaintRadius);
      const yMax = Math.min(height - 1, cy + inpaintRadius);
      const xMin = Math.max(0, cx - inpaintRadius);
      const xMax = Math.min(width - 1, cx + inpaintRadius);

      for (let nyPos = yMin; nyPos <= yMax; nyPos++) {
        for (let nxPos = xMin; nxPos <= xMax; nxPos++) {
          const nIdx = nyPos * width + nxPos;
          if (state[nIdx] !== 0) continue; // Only blend from KNOWN pixels

          const dx = cx - nxPos;
          const dy = cy - nyPos;
          const dSq = dx * dx + dy * dy;
          if (dSq === 0) continue;
          const d = Math.sqrt(dSq);

          // Directional factor along gradient isophotes
          let dir = (dx * nx + dy * ny) / d;
          if (dir < 0) dir = -dir * 0.3;
          dir = Math.max(0.02, dir);

          // Geometric distance weighting
          const dst = 1 / (d * dSq);

          // Level-set distance weighting
          const lev = 1 / (1 + Math.abs(dist[curr] - dist[nIdx]));

          const w = dir * dst * lev;

          // First-order Taylor gradient extrapolation
          let gxR = 0, gyR = 0;
          let gxG = 0, gyG = 0;
          let gxB = 0, gyB = 0;

          if (nxPos > 0 && nxPos < width - 1) {
            gxR = (rArr[nIdx + 1] - rArr[nIdx - 1]) * 0.5;
            gxG = (gArr[nIdx + 1] - gArr[nIdx - 1]) * 0.5;
            gxB = (bArr[nIdx + 1] - bArr[nIdx - 1]) * 0.5;
          }
          if (nyPos > 0 && nyPos < height - 1) {
            gyR = (rArr[nIdx + width] - rArr[nIdx - width]) * 0.5;
            gyG = (gArr[nIdx + width] - gArr[nIdx - width]) * 0.5;
            gyB = (bArr[nIdx + width] - bArr[nIdx - width]) * 0.5;
          }

          const extrapolatedR = Math.max(0, Math.min(255, rArr[nIdx] + gxR * dx + gyR * dy));
          const extrapolatedG = Math.max(0, Math.min(255, gArr[nIdx] + gxG * dx + gyG * dy));
          const extrapolatedB = Math.max(0, Math.min(255, bArr[nIdx] + gxB * dx + gyB * dy));

          sumR += extrapolatedR * w;
          sumG += extrapolatedG * w;
          sumB += extrapolatedB * w;
          totalW += w;
        }
      }

      if (totalW > 0) {
        rArr[curr] = Math.round(sumR / totalW);
        gArr[curr] = Math.round(sumG / totalW);
        bArr[curr] = Math.round(sumB / totalW);
      }

      // Mark pixel as KNOWN
      state[curr] = 0;

      // Expand front to any 4-neighbors still INSIDE
      const neighbors = [
        cx > 0 ? curr - 1 : -1,
        cx < width - 1 ? curr + 1 : -1,
        cy > 0 ? curr - width : -1,
        cy < height - 1 ? curr + width : -1,
      ];

      for (let k = 0; k < neighbors.length; k++) {
        const nbr = neighbors[k];
        if (nbr >= 0 && state[nbr] === 2) {
          state[nbr] = 1; // BAND
          dist[nbr] = dist[curr] + 1;
          bandQueue.push(nbr);
        }
      }
    }

    // Write back inpainted values to canvas ImageData
    for (let i = 0; i < width * height; i++) {
      if (mask[i]) {
        const dIdx = i * 4;
        data[dIdx] = rArr[i];
        data[dIdx + 1] = gArr[i];
        data[dIdx + 2] = bArr[i];
      }
    }
  }

  // Write finalized ImageData back to canvas
  ctx.putImageData(imgData, 0, 0);

  const totalBoxPixels = w * h;
  const preservedPercent = totalBoxPixels > 0
    ? Math.max(0, Math.min(100, Math.round(((totalBoxPixels - maskedPixelCount) / totalBoxPixels) * 100)))
    : 100;

  const blob = await canvasToBlob(canvas, format, 0.98);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = format === 'image/jpeg' ? 'jpg' : 'png';

  return {
    blob,
    fileName: `${baseName}_clean.${ext}`,
    preservedPercent,
  };
}

/**
 * Creates a standard animated GIF from multiple images with custom frame delay
 */
export async function createAnimatedGif(
  files: File[],
  options: { delayMs?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<{ blob: Blob; fileName: string; size: number }> {
  if (files.length === 0) throw new Error('No image files provided for GIF creation.');

  const delayMs = options.delayMs || 400;
  const maxW = options.maxWidth || 800;
  const maxH = options.maxHeight || 800;

  // Load all images and determine target dimensions
  const loadedImages: HTMLImageElement[] = [];
  for (const f of files) {
    const img = await loadImage(f);
    loadedImages.push(img);
  }

  // Use dimensions of first image scaled down if exceeds max
  let targetW = loadedImages[0].naturalWidth || loadedImages[0].width || 600;
  let targetH = loadedImages[0].naturalHeight || loadedImages[0].height || 600;

  if (targetW > maxW || targetH > maxH) {
    const scale = Math.min(maxW / targetW, maxH / targetH);
    targetW = Math.round(targetW * scale);
    targetH = Math.round(targetH * scale);
  }

  // Instantiate GIFEncoder
  const gif = GIFEncoder();
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context not available for GIF generation');

  for (let i = 0; i < loadedImages.length; i++) {
    const img = loadedImages[i];
    ctx.clearRect(0, 0, targetW, targetH);

    // Fill white background for uniform appearance
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);

    // Scale to fit / contain
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const scale = Math.min(targetW / srcW, targetH / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const drawX = (targetW - drawW) / 2;
    const drawY = (targetH - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const rgba = imgData.data;

    // Quantize RGBA to 256 colors palette
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);

    // Write frame with palette and delay in milliseconds
    gif.writeFrame(index, targetW, targetH, {
      palette,
      delay: delayMs,
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes as any], { type: 'image/gif' });

  return {
    blob,
    fileName: 'codemaniac_animation.gif',
    size: blob.size,
  };
}

/**
 * Image Quality Enhancer: Unsharp mask sharpening + auto-contrast + 2x high-res upscaling
 */
export interface EnhanceOptions {
  sharpen: boolean;
  contrastBoost: boolean;
  upscale2x: boolean;
}

export async function enhanceImage(
  file: File,
  options: EnhanceOptions
): Promise<{
  blob: Blob;
  fileName: string;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
}> {
  const img = await loadImage(file);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  const scale = options.upscale2x ? 2 : 1;
  const outW = srcW * scale;
  const outH = srcH * scale;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context error');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (options.contrastBoost) {
    ctx.filter = 'contrast(115%) saturate(110%) brightness(102%)';
  }
  ctx.drawImage(img, 0, 0, outW, outH);
  ctx.filter = 'none';

  // Apply 3x3 unsharp mask convolution kernel if sharpening enabled
  if (options.sharpen) {
    const imgData = ctx.getImageData(0, 0, outW, outH);
    const src = imgData.data;
    const output = ctx.createImageData(outW, outH);
    const dst = output.data;

    // Convolution kernel: Center positive, edges negative
    // [  0, -0.5,  0 ]
    // [ -0.5, 3, -0.5 ]
    // [  0, -0.5,  0 ]
    const kCenter = 3.0;
    const kEdge = -0.5;

    for (let y = 1; y < outH - 1; y++) {
      for (let x = 1; x < outW - 1; x++) {
        const idx = (y * outW + x) * 4;
        for (let c = 0; c < 3; c++) {
          const top = src[((y - 1) * outW + x) * 4 + c];
          const bottom = src[((y + 1) * outW + x) * 4 + c];
          const left = src[(y * outW + (x - 1)) * 4 + c];
          const right = src[(y * outW + (x + 1)) * 4 + c];
          const center = src[idx + c];

          const val =
            center * kCenter +
            (top + bottom + left + right) * kEdge;

          dst[idx + c] = Math.min(255, Math.max(0, val));
        }
        dst[idx + 3] = src[idx + 3]; // keep alpha
      }
    }

    ctx.putImageData(output, 0, 0);
  }

  const blob = await canvasToBlob(canvas, 'image/png');
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return {
    blob,
    fileName: `${baseName}_enhanced.${options.upscale2x ? 'png' : 'png'}`,
    originalWidth: srcW,
    originalHeight: srcH,
    newWidth: outW,
    newHeight: outH,
  };
}

/**
 * Image Metadata Remover (Sanitizes EXIF, GPS, camera details)
 */
export async function stripImageMetadata(
  file: File
): Promise<{ blob: Blob; fileName: string; originalSize: number; newSize: number }> {
  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context error');

  // Repainting onto clean canvas discards all EXIF / IPTC / XMP metadata chunks
  ctx.drawImage(img, 0, 0);

  const format = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await canvasToBlob(canvas, format, 0.95);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = format === 'image/jpeg' ? 'jpg' : 'png';

  return {
    blob,
    fileName: `${baseName}_clean.${ext}`,
    originalSize: file.size,
    newSize: blob.size,
  };
}

/**
 * Image Watermark
 */
export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  fontSize?: number;
  textColor?: string;
  opacity?: number; // 0.1 to 1.0
  position:
    | 'top-left'
    | 'top-right'
    | 'center'
    | 'bottom-left'
    | 'bottom-right'
    | 'tiled';
  rotation?: number; // degrees
  watermarkImage?: File;
}

export async function applyWatermark(
  file: File,
  options: WatermarkOptions
): Promise<{ blob: Blob; fileName: string }> {
  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context error');

  ctx.drawImage(img, 0, 0);

  ctx.save();
  ctx.globalAlpha = options.opacity !== undefined ? options.opacity : 0.6;

  if (options.type === 'text' && options.text) {
    const text = options.text;
    const fontSize = options.fontSize || Math.max(18, Math.round(width * 0.04));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = options.textColor || '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    if (options.position === 'tiled') {
      const stepX = fontSize * 10;
      const stepY = fontSize * 6;
      ctx.rotate((-25 * Math.PI) / 180);
      for (let x = -width; x < width * 2; x += stepX) {
        for (let y = -height; y < height * 2; y += stepY) {
          ctx.fillText(text, x, y);
        }
      }
    } else {
      let x = width / 2;
      let y = height / 2;
      ctx.textAlign = 'center';

      if (options.position === 'top-left') {
        ctx.textAlign = 'left';
        x = 30;
        y = fontSize + 30;
      } else if (options.position === 'top-right') {
        ctx.textAlign = 'right';
        x = width - 30;
        y = fontSize + 30;
      } else if (options.position === 'bottom-left') {
        ctx.textAlign = 'left';
        x = 30;
        y = height - 30;
      } else if (options.position === 'bottom-right') {
        ctx.textAlign = 'right';
        x = width - 30;
        y = height - 30;
      }

      if (options.rotation) {
        ctx.translate(x, y);
        ctx.rotate((options.rotation * Math.PI) / 180);
        ctx.fillText(text, 0, 0);
      } else {
        ctx.fillText(text, x, y);
      }
    }
  } else if (options.type === 'image' && options.watermarkImage) {
    const wmImg = await loadImage(options.watermarkImage);
    const wmWidth = Math.min(width * 0.3, wmImg.naturalWidth || wmImg.width);
    const aspect = (wmImg.naturalHeight || wmImg.height) / (wmImg.naturalWidth || wmImg.width);
    const wmHeight = wmWidth * aspect;

    let wx = (width - wmWidth) / 2;
    let wy = (height - wmHeight) / 2;

    if (options.position === 'top-left') {
      wx = 30;
      wy = 30;
    } else if (options.position === 'top-right') {
      wx = width - wmWidth - 30;
      wy = 30;
    } else if (options.position === 'bottom-left') {
      wx = 30;
      wy = height - wmHeight - 30;
    } else if (options.position === 'bottom-right') {
      wx = width - wmWidth - 30;
      wy = height - wmHeight - 30;
    }

    ctx.drawImage(wmImg, wx, wy, wmWidth, wmHeight);
  }

  ctx.restore();

  const blob = await canvasToBlob(canvas, 'image/png');
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return {
    blob,
    fileName: `${baseName}_watermarked.png`,
  };
}

/**
 * Image to PDF using pdf-lib
 */
export interface ImageToPdfOptions {
  pageSize: 'a4' | 'letter' | 'fit';
  orientation: 'portrait' | 'landscape';
  margin: number; // in points
}

export async function imagesToPdf(
  files: File[],
  options: ImageToPdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Standard sizes in points (72 points/inch)
  // A4: 595.28 x 841.89
  // Letter: 612 x 792
  let defaultW = options.pageSize === 'letter' ? 612 : 595.28;
  let defaultH = options.pageSize === 'letter' ? 792 : 841.89;

  if (options.orientation === 'landscape' && options.pageSize !== 'fit') {
    const temp = defaultW;
    defaultW = defaultH;
    defaultH = temp;
  }

  for (const file of files) {
    const fileBytes = await file.arrayBuffer();
    let embeddedImg;

    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      embeddedImg = await pdfDoc.embedJpg(fileBytes);
    } else if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
      embeddedImg = await pdfDoc.embedPng(fileBytes);
    } else {
      // Convert to PNG on canvas first if WebP/GIF/other
      const img = await loadImage(file);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth || img.width;
      tempCanvas.height = img.naturalHeight || img.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pngBlob = await canvasToBlob(tempCanvas, 'image/png');
        const pngBytes = await pngBlob.arrayBuffer();
        embeddedImg = await pdfDoc.embedPng(pngBytes);
      } else {
        continue;
      }
    }

    const imgDims = embeddedImg.scale(1);
    const imgW = imgDims.width;
    const imgH = imgDims.height;

    let pageW = defaultW;
    let pageH = defaultH;

    if (options.pageSize === 'fit') {
      pageW = imgW + options.margin * 2;
      pageH = imgH + options.margin * 2;
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    const maxDrawW = pageW - options.margin * 2;
    const maxDrawH = pageH - options.margin * 2;

    const scaleFactor = Math.min(maxDrawW / imgW, maxDrawH / imgH, 1);
    const drawW = imgW * scaleFactor;
    const drawH = imgH * scaleFactor;

    const x = options.margin + (maxDrawW - drawW) / 2;
    const y = options.margin + (maxDrawH - drawH) / 2;

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawW,
      height: drawH,
    });
  }

  return await pdfDoc.save();
}

/**
 * Rotate & Flip Image
 */
export interface RotateImageOptions {
  angle: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
}

export async function rotateImage(
  file: File,
  options: RotateImageOptions
): Promise<{
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
}> {
  const img = await loadImage(file);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Swap width and height if rotated by 90 or 270 degrees
  const isQuarterTurn = options.angle === 90 || options.angle === 270;
  const targetW = isQuarterTurn ? origH : origW;
  const targetH = isQuarterTurn ? origW : origH;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas 2D context');

  // Fill background if JPEG
  const format = options.format || (file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png');
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.save();
  // Move origin to center of canvas
  ctx.translate(targetW / 2, targetH / 2);

  // Apply rotation
  ctx.rotate((options.angle * Math.PI) / 180);

  // Apply flip
  const scaleX = options.flipHorizontal ? -1 : 1;
  const scaleY = options.flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Draw image centered
  ctx.drawImage(img, -origW / 2, -origH / 2, origW, origH);
  ctx.restore();

  const blob = await canvasToBlob(canvas, format, options.quality || 0.92);
  const ext = format === 'image/jpeg' ? '.jpg' : format === 'image/webp' ? '.webp' : '.png';
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  return {
    blob,
    fileName: `${baseName}_rotated${ext}`,
    width: targetW,
    height: targetH,
    originalSize: file.size,
    newSize: blob.size,
  };
}

/**
 * Generate Meme with Top and Bottom Text
 */
export interface MemeOptions {
  topText: string;
  bottomText: string;
  fontSize?: number;
  textColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  fontFamily?: string;
  allCaps?: boolean;
}

export async function createMemeImage(
  source: File | Blob | string,
  options: MemeOptions
): Promise<{
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
}> {
  const img = await loadImage(source);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  // Draw original image
  ctx.drawImage(img, 0, 0, width, height);

  // Setup text styling
  const baseFontSize = options.fontSize || Math.max(24, Math.floor(width / 14));
  const fontFam = options.fontFamily || 'Impact, "Arial Black", sans-serif';
  ctx.font = `900 ${baseFontSize}px ${fontFam}`;
  ctx.fillStyle = options.textColor || '#FFFFFF';
  ctx.strokeStyle = options.outlineColor || '#000000';
  ctx.lineWidth = options.outlineWidth || Math.max(3, Math.floor(baseFontSize / 8));
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const formatText = (t: string) => (options.allCaps !== false ? t.toUpperCase() : t);

  // Draw Top Text
  if (options.topText.trim()) {
    const text = formatText(options.topText);
    const y = baseFontSize + Math.floor(height * 0.03);
    ctx.strokeText(text, width / 2, y, width - 40);
    ctx.fillText(text, width / 2, y, width - 40);
  }

  // Draw Bottom Text
  if (options.bottomText.trim()) {
    const text = formatText(options.bottomText);
    const y = height - Math.floor(height * 0.04);
    ctx.strokeText(text, width / 2, y, width - 40);
    ctx.fillText(text, width / 2, y, width - 40);
  }

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  const originalName = source instanceof File ? source.name : 'meme.jpg';
  const baseName = originalName.replace(/\.[^/.]+$/, '');

  return {
    blob,
    fileName: `${baseName}_meme.jpg`,
    width,
    height,
  };
}

/**
 * Blur Face & Sensitive Regions
 */
export interface BlurRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'blur' | 'pixelate' | 'blackout';
  intensity?: number;
}

export async function blurImageRegions(
  file: File,
  regions: BlurRegion[]
): Promise<{
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
}> {
  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  ctx.drawImage(img, 0, 0, width, height);

  for (const reg of regions) {
    const rx = Math.max(0, Math.floor(reg.x));
    const ry = Math.max(0, Math.floor(reg.y));
    const rw = Math.min(width - rx, Math.floor(reg.width));
    const rh = Math.min(height - ry, Math.floor(reg.height));

    if (rw <= 0 || rh <= 0) continue;

    if (reg.type === 'blackout') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(rx, ry, rw, rh);
    } else if (reg.type === 'pixelate') {
      const blockSize = Math.max(6, Math.floor(reg.intensity || Math.min(rw, rh) / 8));
      // Downscale region then upscale to create mosaic
      const tempCanvas = document.createElement('canvas');
      const tempW = Math.max(1, Math.floor(rw / blockSize));
      const tempH = Math.max(1, Math.floor(rh / blockSize));
      tempCanvas.width = tempW;
      tempCanvas.height = tempH;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, tempW, tempH);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, tempW, tempH, rx, ry, rw, rh);
        ctx.imageSmoothingEnabled = true;
      }
    } else {
      // Gaussian blur simulation via multi-pass box blur on canvas
      const blurSteps = Math.min(8, Math.max(2, Math.floor((reg.intensity || 15) / 3)));
      const tempCanvas = document.createElement('canvas');
      const scaledW = Math.max(2, Math.floor(rw / blurSteps));
      const scaledH = Math.max(2, Math.floor(rh / blurSteps));
      tempCanvas.width = scaledW;
      tempCanvas.height = scaledH;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, scaledW, scaledH);
        ctx.drawImage(tempCanvas, 0, 0, scaledW, scaledH, rx, ry, rw, rh);
      }
    }
  }

  const blob = await canvasToBlob(canvas, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = file.type === 'image/png' ? '.png' : '.jpg';

  return {
    blob,
    fileName: `${baseName}_blurred${ext}`,
    width,
    height,
  };
}

/**
 * Upscale Image with Edge-Preserving Clarity
 */
export async function upscaleImage(
  file: File,
  scaleFactor: 2 | 4
): Promise<{
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}> {
  const img = await loadImage(file);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  const targetW = origW * scaleFactor;
  const targetH = origH * scaleFactor;

  // Step 1: High quality multi-step upscale
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Step 2: Apply subtle sharpening filter
  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  // 3x3 sharpening kernel
  // [  0, -0.2,   0 ]
  // [ -0.2, 1.8, -0.2 ]
  // [  0, -0.2,   0 ]
  const strength = 0.25;
  for (let y = 1; y < targetH - 1; y++) {
    for (let x = 1; x < targetW - 1; x++) {
      const idx = (y * targetW + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const up = copy[((y - 1) * targetW + x) * 4 + c];
        const down = copy[((y + 1) * targetW + x) * 4 + c];
        const left = copy[(y * targetW + (x - 1)) * 4 + c];
        const right = copy[(y * targetW + (x + 1)) * 4 + c];

        const sharpened = center + strength * (4 * center - up - down - left - right);
        data[idx + c] = Math.min(255, Math.max(0, Math.round(sharpened)));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const blob = await canvasToBlob(canvas, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.95);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = file.type === 'image/png' ? '.png' : '.jpg';

  return {
    blob,
    fileName: `${baseName}_${scaleFactor}x_upscaled${ext}`,
    width: targetW,
    height: targetH,
    originalWidth: origW,
    originalHeight: origH,
  };
}
