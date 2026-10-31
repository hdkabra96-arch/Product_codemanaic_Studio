import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Gauge,
  FastForward,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getAudioMetadata,
  changeAudioSpeed,
  AudioMetadata,
  ProcessedAudioResult,
  formatAudioBytes,
  formatAudioTime,
} from '../../services/audio/audioProcessingService';

export const AudioSpeedChangerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [speed, setSpeed] = useState<number>(1.25);
  const [targetFormat, setTargetFormat] = useState<'mp3' | 'wav'>('mp3');
  const [bitrate, setBitrate] = useState<320 | 256 | 192 | 128>(192);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ProcessedAudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const SPEED_PRESETS = [
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '0.9x', value: 0.9 },
    { label: '1.0x', value: 1.0 },
    { label: '1.15x', value: 1.15 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2.0x', value: 2.0 },
  ];

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
        setAudioUrl(URL.createObjectURL(selected));
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not decode audio. Please upload an MP3, WAV, AAC, or OGG file.'
        );
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = speed;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleProcess = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(10);
      setError(null);
      setResult(null);

      const res = await changeAudioSpeed(file, {
        speed,
        format: targetFormat,
        bitrate,
        onProgress: (p) => setProgress(p),
      });

      setResult(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Speed change failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const estimatedNewDuration = metadata ? metadata.duration / speed : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">
          <Gauge className="w-3.5 h-3.5" />
          <span>Speed Changer</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
          Change Playback Speed Without Pitch Shift
        </h2>
        <p className="text-sm sm:text-base text-[#61758A] max-w-xl mx-auto">
          Speed up podcasts, audiobooks, or slow down music practice tracks directly in your browser with zero quality degradation.
        </p>
      </div>

      {!file ? (
        /* Upload Area */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-[#E9DCC8] hover:border-amber-400 transition-all text-center">
          <input
            type="file"
            id="audio-speed-upload"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="audio-speed-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
              <FastForward className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#102A43]">Click to select audio file</p>
              <p className="text-xs sm:text-sm text-[#61758A] mt-1">
                Supports MP3, WAV, AAC, M4A, OGG, and FLAC
              </p>
            </div>
            <span className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md transition-all">
              Choose Audio File
            </span>
          </label>
        </div>
      ) : (
        /* Studio Area */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9DCC8] shadow-sm space-y-6">
          {/* File Card & Audio Player */}
          <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-[#102A43] text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {metadata?.name}
                </p>
                <p className="text-xs text-[#61758A]">
                  Original: {metadata?.formattedDuration} • New: {formatAudioTime(estimatedNewDuration)} ({speed}x)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <button
                onClick={handlePlayPause}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] hover:border-amber-500 hover:text-amber-600 transition-all flex items-center justify-center gap-2"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play at ' + speed + 'x'}</span>
              </button>
            </div>
          </div>

          {/* Speed Presets */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-[#102A43]">
              <span>Speed Presets</span>
              <span className="text-amber-600 font-mono text-sm">{speed}x Speed</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {SPEED_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setSpeed(p.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                    speed === p.value
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-[#FAF5EC] border border-[#E9DCC8] hover:border-amber-400 text-[#102A43]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#102A43] font-semibold">
              <span>Fine Speed Slider</span>
              <span className="font-mono text-amber-600">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[11px] text-[#61758A]">
              <span>0.5x (Slow-mo)</span>
              <span>1.0x (Normal)</span>
              <span>2.0x (Double Speed)</span>
            </div>
          </div>

          {/* Format Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#E9DCC8]">
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#102A43] block">Export Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTargetFormat('mp3')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    targetFormat === 'mp3'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-[#FAF5EC] border-[#E9DCC8] text-[#102A43] hover:border-amber-400'
                  }`}
                >
                  MP3
                </button>
                <button
                  onClick={() => setTargetFormat('wav')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    targetFormat === 'wav'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-[#FAF5EC] border-[#E9DCC8] text-[#102A43] hover:border-amber-400'
                  }`}
                >
                  WAV
                </button>
              </div>
            </div>

            {targetFormat === 'mp3' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#102A43] block">MP3 Bitrate</label>
                <div className="grid grid-cols-4 gap-2">
                  {([320, 256, 192, 128] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setBitrate(b)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        bitrate === b
                          ? 'bg-[#102A43] text-white shadow'
                          : 'bg-gray-100 text-[#102A43] hover:bg-gray-200'
                      }`}
                    >
                      {b} kbps
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button & Results */}
          <div className="pt-4 border-t border-[#E9DCC8] space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {processing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[#102A43]">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    Resampling audio to {speed}x...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleProcess}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gauge className="w-4 h-4" />
                <span>Export Audio at {speed}x Speed</span>
              </button>
            )}

            {result && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Speed Change Complete! ({result.formattedSize})</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold">{speed}x Playback</span>
                </div>

                <audio controls src={result.url} className="w-full rounded-lg" />

                <a
                  href={result.url}
                  download={`speed-${speed}x-${file.name.replace(/\.[^/.]+$/, '')}.${result.format}`}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all block text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Speed Audio ({result.format.toUpperCase()})</span>
                </a>
              </div>
            )}

            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setResult(null);
              }}
              className="w-full text-xs text-[#61758A] hover:text-[#102A43] font-semibold py-1"
            >
              Upload a different audio file
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
