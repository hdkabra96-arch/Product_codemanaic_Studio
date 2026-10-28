import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Scissors,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  FileAudio,
  Sliders,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getAudioMetadata,
  cutAudioFile,
  AudioMetadata,
  ProcessedAudioResult,
  formatAudioBytes,
  formatAudioTime,
} from '../../services/audio/audioProcessingService';

export const AudioCutterTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);

  // Trimming parameters
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [targetFormat, setTargetFormat] = useState<'mp3' | 'wav'>('mp3');
  const [bitrate, setBitrate] = useState<320 | 256 | 192 | 128 | 96>(192);
  const [volume, setVolume] = useState<number>(1.0);
  const [fadeIn, setFadeIn] = useState<boolean>(false);
  const [fadeOut, setFadeOut] = useState<boolean>(false);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ProcessedAudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setResult(null);
        setIsPlaying(false);
        const meta = await getAudioMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setStartTime(0);
        setEndTime(meta.duration);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not decode audio. Please upload an MP3, WAV, AAC, or OGG file.'
        );
      }
    }
  };

  const handleCut = async () => {
    if (!file || !metadata) return;

    if (endTime <= startTime) {
      setError('End time must be greater than start time.');
      return;
    }

    try {
      setProcessing(true);
      setProgress(10);
      setError(null);
      setResult(null);

      const res = await cutAudioFile(file, {
        startTime,
        endTime,
        format: targetFormat,
        bitrate,
        volume,
        fadeIn,
        fadeOut,
        onProgress: (p) => setProgress(p),
      });

      setResult(res);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error cutting audio file.');
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_cut.${result.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const selectedDuration = Math.max(0, endTime - startTime);

  return (
    <div className="space-y-6">
      {!file || !metadata ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Scissors className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Choose audio track to trim & cut
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Cut unwanted audio parts, create ringtones, or trim podcast clips
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Audio Track
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File Card */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</h4>
                <div className="flex items-center gap-3 text-xs text-[#61758A]">
                  <span>Total: {metadata.formattedDuration}</span>
                  <span>•</span>
                  <span>Selected: {formatAudioTime(selectedDuration)}</span>
                  <span>•</span>
                  <span>{formatAudioBytes(file.size)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setResult(null);
                setIsPlaying(false);
                setError(null);
              }}
              className="text-xs text-[#61758A] hover:text-red-600 font-semibold cursor-pointer self-start sm:self-center"
            >
              Change File
            </button>
          </div>

          {/* Interactive Range Sliders */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
                Trim Range Selection
              </span>
              <span className="text-xs font-mono font-bold text-[#D98218]">
                {formatAudioTime(startTime)} → {formatAudioTime(endTime)} ({formatAudioTime(selectedDuration)})
              </span>
            </div>

            {/* Visual Timeline Bar */}
            <div className="relative h-6 bg-white rounded-lg border border-[#E9DCC8] overflow-hidden">
              <div
                style={{
                  left: `${(startTime / metadata.duration) * 100}%`,
                  width: `${(selectedDuration / metadata.duration) * 100}%`,
                }}
                className="absolute top-0 bottom-0 bg-gradient-to-r from-[#D98218] to-[#F4A62A] opacity-75 rounded"
              />
            </div>

            {/* Slider Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-bold text-[#102A43]">Start Time:</label>
                  <span className="font-mono text-[#D98218]">{startTime.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, endTime - 0.1)}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value))}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-bold text-[#102A43]">End Time:</label>
                  <span className="font-mono text-[#D98218]">{endTime.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min={Math.min(metadata.duration, startTime + 0.1)}
                  max={metadata.duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value))}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
              <label className="text-xs font-bold text-[#102A43] block mb-1">Format</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['mp3', 'wav'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTargetFormat(fmt)}
                    className={`py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      targetFormat === fmt
                        ? 'bg-[#D98218] text-white shadow-sm'
                        : 'bg-white text-[#102A43] border border-[#E9DCC8]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
              <label className="text-xs font-bold text-[#102A43] block mb-1">
                Volume: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-[#D98218] cursor-pointer"
              />
            </div>

            <div className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] flex flex-col justify-center gap-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#102A43]">
                <input
                  type="checkbox"
                  checked={fadeIn}
                  onChange={(e) => setFadeIn(e.target.checked)}
                  className="accent-[#D98218] rounded"
                />
                <span>0.5s Smooth Fade-In</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#102A43]">
                <input
                  type="checkbox"
                  checked={fadeOut}
                  onChange={(e) => setFadeOut(e.target.checked)}
                  className="accent-[#D98218] rounded"
                />
                <span>0.5s Smooth Fade-Out</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action or Result */}
          {processing ? (
            <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
                <span>Trimming and Exporting Audio Track...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#FAF5EC] rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-[#D98218] to-[#C66A08] transition-all duration-200"
                />
              </div>
            </div>
          ) : result ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Audio Trimmed Successfully!</h4>
                    <span className="text-xs text-emerald-700 block mt-0.5">
                      Exported Length: {formatAudioTime(result.duration)} • Size: {result.formattedSize}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Cut Track</span>
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setIsPlaying(false);
                    }}
                    className="p-2.5 rounded-full bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
                    title="Trim again"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline Player */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="w-8 h-8 rounded-full bg-[#D98218] text-white flex items-center justify-center cursor-pointer shrink-0 shadow-sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <audio
                    ref={audioRef}
                    src={result.url}
                    onEnded={() => setIsPlaying(false)}
                    controls
                    className="w-full h-8"
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCut}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Scissors className="w-4 h-4" />
              <span>Cut & Export Audio Segment</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
