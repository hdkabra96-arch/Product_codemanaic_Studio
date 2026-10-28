import * as lamejs from '@breezystack/lamejs';

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  fileSize: number;
  formattedDuration: string;
  formattedSize: string;
  name: string;
  type: string;
  estimatedBitrateKbps: number;
}

export interface ConvertAudioOptions {
  format: 'mp3' | 'wav';
  bitrate?: 320 | 256 | 192 | 128 | 96 | 64; // kbps for MP3
  volume?: number; // 0 to 2.0 (1.0 = 100%)
  sampleRate?: number;
  onProgress?: (percent: number) => void;
}

export interface CutAudioOptions {
  startTime: number; // in seconds
  endTime: number; // in seconds
  format: 'mp3' | 'wav';
  bitrate?: 320 | 256 | 192 | 128 | 96 | 64;
  volume?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  onProgress?: (percent: number) => void;
}

export interface CompressAudioOptions {
  preset: 'high' | 'medium' | 'low' | 'extreme';
  customBitrate?: 320 | 256 | 192 | 128 | 96 | 64;
  targetFormat?: 'mp3' | 'wav';
  channels?: 'stereo' | 'mono';
  onProgress?: (percent: number) => void;
}

export interface ProcessedAudioResult {
  blob: Blob;
  url: string;
  duration: number;
  format: 'mp3' | 'wav';
  sizeBytes: number;
  formattedSize: string;
  originalSize: number;
}

/**
 * Format time in seconds to mm:ss or hh:mm:ss
 */
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bytes to readable string
 */
export function formatAudioBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Create or reuse safe AudioContext
 */
function getAudioContext(targetSampleRate?: number): AudioContext {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (targetSampleRate) {
    try {
      return new AudioCtx({ sampleRate: targetSampleRate });
    } catch {
      return new AudioCtx();
    }
  }
  return new AudioCtx();
}

/**
 * Get detailed audio file metadata
 */
export async function getAudioMetadata(file: File | Blob, originalFileName?: string): Promise<AudioMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = getAudioContext();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const fileSize = file.size;
    const estimatedBitrateKbps = duration > 0 ? Math.round((fileSize * 8) / duration / 1000) : 192;

    const name = originalFileName || (file instanceof File ? file.name : 'audio_track');
    const type = file.type || 'audio/mpeg';

    return {
      duration,
      sampleRate,
      numberOfChannels,
      fileSize,
      formattedDuration: formatAudioTime(duration),
      formattedSize: formatAudioBytes(fileSize),
      name,
      type,
      estimatedBitrateKbps,
    };
  } finally {
    try {
      await ctx.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Encode PCM audio channels into a standard 16-bit WAV Blob
 */
export function encodeWavBlob(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  numChannels: number,
  sampleRate: number,
  volume: number = 1.0
): Blob {
  const numSamples = leftChannel.length;
  const wavBuffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
  const view = new DataView(wavBuffer);

  // RIFF identifier
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * numChannels * 2, true);
  writeAscii(view, 8, 'WAVE');

  // fmt sub-chunk
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeAscii(view, 36, 'data');
  view.setUint32(40, numSamples * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const leftVal = Math.max(-1, Math.min(1, leftChannel[i] * volume));
    view.setInt16(offset, leftVal < 0 ? leftVal * 32768 : leftVal * 32767, true);
    offset += 2;
    if (numChannels > 1) {
      const rightVal = Math.max(-1, Math.min(1, rightChannel[i] * volume));
      view.setInt16(offset, rightVal < 0 ? rightVal * 32768 : rightVal * 32767, true);
      offset += 2;
    }
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encode PCM audio channels into a standard MP3 Blob using lamejs
 */
export function encodeMp3Blob(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  numChannels: number,
  sampleRate: number,
  bitrate: number = 192,
  volume: number = 1.0,
  onProgress?: (pct: number) => void
): Blob {
  const Mp3Encoder = lamejs.Mp3Encoder || (lamejs as unknown as { default?: { Mp3Encoder: typeof lamejs.Mp3Encoder } }).default?.Mp3Encoder;
  if (!Mp3Encoder) {
    throw new Error('MP3 Encoder engine is not initialized.');
  }

  const encoder = new Mp3Encoder(numChannels > 1 ? 2 : 1, sampleRate, bitrate);
  const numSamples = leftChannel.length;
  const mp3Data: Uint8Array[] = [];

  // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
  const leftInt16 = new Int16Array(numSamples);
  const rightInt16 = numChannels > 1 ? new Int16Array(numSamples) : leftInt16;

  for (let i = 0; i < numSamples; i++) {
    const leftVal = Math.max(-1, Math.min(1, leftChannel[i] * volume));
    leftInt16[i] = leftVal < 0 ? leftVal * 32768 : leftVal * 32767;

    if (numChannels > 1) {
      const rightVal = Math.max(-1, Math.min(1, rightChannel[i] * volume));
      rightInt16[i] = rightVal < 0 ? rightVal * 32768 : rightVal * 32767;
    }
  }

  const sampleBlockSize = 1152;
  const totalBlocks = Math.ceil(numSamples / sampleBlockSize);

  for (let i = 0, block = 0; i < numSamples; i += sampleBlockSize, block++) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    let mp3buf: Int8Array | Uint8Array;
    if (numChannels > 1) {
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = encoder.encodeBuffer(leftChunk);
    }
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }

    if (onProgress && block % 15 === 0) {
      const progress = Math.min(95, Math.round((block / totalBlocks) * 100));
      onProgress(progress);
    }
  }

  const endBuf = encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(new Uint8Array(endBuf));
  }

  return new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mpeg' });
}

/**
 * 1. Convert Audio (MP3, WAV, etc.)
 */
export async function convertAudioFile(
  file: File | Blob,
  options: ConvertAudioOptions
): Promise<ProcessedAudioResult> {
  const { format = 'mp3', bitrate = 192, volume = 1.0, onProgress } = options;

  if (onProgress) onProgress(10);
  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(30);

  const ctx = getAudioContext(options.sampleRate);
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } finally {
    try {
      await ctx.close();
    } catch {
      // ignore
    }
  }

  if (onProgress) onProgress(50);

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  let outputBlob: Blob;
  if (format === 'mp3') {
    outputBlob = encodeMp3Blob(
      leftChannel,
      rightChannel,
      numChannels,
      sampleRate,
      bitrate,
      volume,
      (pct) => {
        if (onProgress) onProgress(50 + Math.round(pct * 0.45));
      }
    );
  } else {
    outputBlob = encodeWavBlob(leftChannel, rightChannel, numChannels, sampleRate, volume);
  }

  if (onProgress) onProgress(100);

  return {
    blob: outputBlob,
    url: URL.createObjectURL(outputBlob),
    duration: audioBuffer.duration,
    format,
    sizeBytes: outputBlob.size,
    formattedSize: formatAudioBytes(outputBlob.size),
    originalSize: file.size,
  };
}

/**
 * 2. Cut & Trim Audio
 */
export async function cutAudioFile(
  file: File | Blob,
  options: CutAudioOptions
): Promise<ProcessedAudioResult> {
  const {
    startTime,
    endTime,
    format = 'mp3',
    bitrate = 192,
    volume = 1.0,
    fadeIn = false,
    fadeOut = false,
    onProgress,
  } = options;

  if (onProgress) onProgress(10);
  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(30);

  const ctx = getAudioContext();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } finally {
    try {
      await ctx.close();
    } catch {
      // ignore
    }
  }

  if (onProgress) onProgress(50);

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const totalDuration = audioBuffer.duration;

  const validStart = Math.max(0, Math.min(startTime, totalDuration));
  const validEnd = Math.min(totalDuration, Math.max(validStart + 0.1, endTime));
  const outDuration = validEnd - validStart;

  const startSample = Math.floor(validStart * sampleRate);
  const endSample = Math.floor(validEnd * sampleRate);
  const numSamples = endSample - startSample;

  const leftChannel = new Float32Array(numSamples);
  leftChannel.set(audioBuffer.getChannelData(0).subarray(startSample, endSample));

  const rightChannel = new Float32Array(numSamples);
  if (numChannels > 1) {
    rightChannel.set(audioBuffer.getChannelData(1).subarray(startSample, endSample));
  } else {
    rightChannel.set(leftChannel);
  }

  // Apply optional Fade In (first 0.5s)
  if (fadeIn && numSamples > sampleRate * 0.5) {
    const fadeSamples = Math.floor(sampleRate * 0.5);
    for (let i = 0; i < fadeSamples; i++) {
      const factor = i / fadeSamples;
      leftChannel[i] *= factor;
      rightChannel[i] *= factor;
    }
  }

  // Apply optional Fade Out (last 0.5s)
  if (fadeOut && numSamples > sampleRate * 0.5) {
    const fadeSamples = Math.floor(sampleRate * 0.5);
    for (let i = 0; i < fadeSamples; i++) {
      const factor = (fadeSamples - i) / fadeSamples;
      leftChannel[numSamples - fadeSamples + i] *= factor;
      rightChannel[numSamples - fadeSamples + i] *= factor;
    }
  }

  let outputBlob: Blob;
  if (format === 'mp3') {
    outputBlob = encodeMp3Blob(
      leftChannel,
      rightChannel,
      numChannels,
      sampleRate,
      bitrate,
      volume,
      (pct) => {
        if (onProgress) onProgress(50 + Math.round(pct * 0.45));
      }
    );
  } else {
    outputBlob = encodeWavBlob(leftChannel, rightChannel, numChannels, sampleRate, volume);
  }

  if (onProgress) onProgress(100);

  return {
    blob: outputBlob,
    url: URL.createObjectURL(outputBlob),
    duration: outDuration,
    format,
    sizeBytes: outputBlob.size,
    formattedSize: formatAudioBytes(outputBlob.size),
    originalSize: file.size,
  };
}

/**
 * 3. Compress Audio
 */
export async function compressAudioFile(
  file: File | Blob,
  options: CompressAudioOptions
): Promise<ProcessedAudioResult> {
  const { preset, customBitrate, targetFormat = 'mp3', channels = 'stereo', onProgress } = options;

  let targetBitrate: 320 | 256 | 192 | 128 | 96 | 64 = 128;
  if (customBitrate) {
    targetBitrate = customBitrate;
  } else {
    switch (preset) {
      case 'extreme':
        targetBitrate = 64;
        break;
      case 'high':
        targetBitrate = 96;
        break;
      case 'medium':
        targetBitrate = 128;
        break;
      case 'low':
        targetBitrate = 192;
        break;
    }
  }

  if (onProgress) onProgress(10);
  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(30);

  const ctx = getAudioContext();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } finally {
    try {
      await ctx.close();
    } catch {
      // ignore
    }
  }

  if (onProgress) onProgress(50);

  const origChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = channels === 'mono' ? 1 : Math.min(2, origChannels);

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  let outputBlob: Blob;
  if (targetFormat === 'mp3') {
    outputBlob = encodeMp3Blob(
      leftChannel,
      rightChannel,
      numChannels,
      sampleRate,
      targetBitrate,
      1.0,
      (pct) => {
        if (onProgress) onProgress(50 + Math.round(pct * 0.45));
      }
    );
  } else {
    outputBlob = encodeWavBlob(leftChannel, rightChannel, numChannels, sampleRate, 1.0);
  }

  if (onProgress) onProgress(100);

  return {
    blob: outputBlob,
    url: URL.createObjectURL(outputBlob),
    duration: audioBuffer.duration,
    format: targetFormat,
    sizeBytes: outputBlob.size,
    formattedSize: formatAudioBytes(outputBlob.size),
    originalSize: file.size,
  };
}

/**
 * 4. Merge Multiple Audio Files Sequentially
 */
export async function mergeAudioFiles(
  files: (File | Blob)[],
  options: {
    format?: 'mp3' | 'wav';
    bitrate?: 320 | 256 | 192 | 128 | 96;
    onProgress?: (percent: number) => void;
  }
): Promise<ProcessedAudioResult> {
  const format = options.format || 'mp3';
  const bitrate = options.bitrate || 192;
  const onProgress = options.onProgress;

  if (files.length === 0) {
    throw new Error('Please select at least one audio file to merge.');
  }

  const ctx = getAudioContext();
  const decodedBuffers: AudioBuffer[] = [];
  let totalDuration = 0;
  let totalInputBytes = 0;

  for (let i = 0; i < files.length; i++) {
    totalInputBytes += files[i].size;
    const buf = await files[i].arrayBuffer();
    const decoded = await ctx.decodeAudioData(buf);
    decodedBuffers.push(decoded);
    totalDuration += decoded.duration;
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 40));
    }
  }

  await ctx.close();

  // Pick target sample rate from first track
  const sampleRate = decodedBuffers[0].sampleRate;
  const numChannels = Math.max(...decodedBuffers.map((b) => b.numberOfChannels));
  const totalSamples = Math.ceil(totalDuration * sampleRate);

  const mergedLeft = new Float32Array(totalSamples);
  const mergedRight = new Float32Array(totalSamples);

  let sampleOffset = 0;
  for (const buffer of decodedBuffers) {
    const left = buffer.getChannelData(0);
    const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;

    mergedLeft.set(left, sampleOffset);
    mergedRight.set(right, sampleOffset);
    sampleOffset += left.length;
  }

  if (onProgress) onProgress(50);

  let outputBlob: Blob;
  if (format === 'mp3') {
    outputBlob = encodeMp3Blob(
      mergedLeft,
      mergedRight,
      numChannels,
      sampleRate,
      bitrate,
      1.0,
      (pct) => {
        if (onProgress) onProgress(50 + Math.round(pct * 0.45));
      }
    );
  } else {
    outputBlob = encodeWavBlob(mergedLeft, mergedRight, numChannels, sampleRate, 1.0);
  }

  if (onProgress) onProgress(100);

  return {
    blob: outputBlob,
    url: URL.createObjectURL(outputBlob),
    duration: totalDuration,
    format,
    sizeBytes: outputBlob.size,
    formattedSize: formatAudioBytes(outputBlob.size),
    originalSize: totalInputBytes,
  };
}
