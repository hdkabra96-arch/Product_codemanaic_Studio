import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getAudioMetadata,
  boostAudioVolume,
  AudioMetadata,
  ProcessedAudioResult,
  formatAudioBytes,
  formatAudioTime,
} from '../../services/audio/audioProcessingService';

export const AudioVolumeBoosterTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [boostPercent, setBoostPercent] = useState<number>(200); // 200% = 2x
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

  const BOOST_PRESETS = [
    { label: '+125%', value: 125 },
    { label: '+150%', value: 150 },
    { label: '+200% (2x)', value: 200 },
    { label: '+250%', value: 250 },
    { label: '+300% (3x)', value: 300 },
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

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
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

      const multiplier = boostPercent / 100;
      const res = await boostAudioVolume(file, {
        boostMultiplier: multiplier,
        format: targetFormat,
        bitrate,
        onProgress: (p) => setProgress(p),
      });

      setResult(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Volume boost failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>Volume Booster</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
          Amplify Volume Up to +300%
        </h2>
        <p className="text-sm sm:text-base text-[#61758A] max-w-xl mx-auto">
          Make quiet audio tracks, lectures, voice memos, and songs loud and punchy with intelligent soft-limiting to prevent clipping.
        </p>
      </div>

      {!file ? (
        /* Upload Area */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-[#E9DCC8] hover:border-orange-400 transition-all text-center">
          <input
            type="file"
            id="audio-boost-upload"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="audio-boost-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
              <Volume2 className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#102A43]">Click to select quiet audio</p>
              <p className="text-xs sm:text-sm text-[#61758A] mt-1">
                Supports MP3, WAV, AAC, M4A, OGG, and FLAC
              </p>
            </div>
            <span className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-md transition-all">
              Choose Audio to Boost
            </span>
          </label>
        </div>
      ) : (
        /* Studio Area */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9DCC8] shadow-sm space-y-6">
          {/* File Card & Audio Player */}
          <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-[#102A43] text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {metadata?.name}
                </p>
                <p className="text-xs text-[#61758A]">
                  {metadata?.formattedDuration} • {metadata?.formattedSize} • Target Gain: +{boostPercent}%
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
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] hover:border-orange-500 hover:text-orange-600 transition-all flex items-center justify-center gap-2"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play Original Level'}</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-[#102A43]">
              <span>Volume Multiplier</span>
              <span className="text-orange-600 font-mono text-base font-extrabold">{boostPercent}% ({(boostPercent / 100).toFixed(1)}x)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {BOOST_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setBoostPercent(p.value)}
                  className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all text-center ${
                    boostPercent === p.value
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-[#FAF5EC] border border-[#E9DCC8] hover:border-orange-400 text-[#102A43]'
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
              <span>Gain Slider</span>
              <span className="font-mono text-orange-600">{boostPercent}%</span>
            </div>
            <input
              type="range"
              min="100"
              max="350"
              step="10"
              value={boostPercent}
              onChange={(e) => setBoostPercent(parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-[11px] text-[#61758A]">
              <span>100% (Original)</span>
              <span>200% (2x Louder)</span>
              <span>300%+ (Max Loudness)</span>
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
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-[#FAF5EC] border-[#E9DCC8] text-[#102A43] hover:border-orange-400'
                  }`}
                >
                  MP3
                </button>
                <button
                  onClick={() => setTargetFormat('wav')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    targetFormat === 'wav'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-[#FAF5EC] border-[#E9DCC8] text-[#102A43] hover:border-orange-400'
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
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    Boosting volume to {boostPercent}%...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleProcess}
                className="w-full py-4 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Boost Volume to {boostPercent}% & Export</span>
              </button>
            )}

            {result && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Boosted Audio Ready! ({result.formattedSize})</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold">+{boostPercent}% Gain Applied</span>
                </div>

                <audio controls src={result.url} className="w-full rounded-lg" />

                <a
                  href={result.url}
                  download={`boosted-${boostPercent}pct-${file.name.replace(/\.[^/.]+$/, '')}.${result.format}`}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all block text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Boosted Audio ({result.format.toUpperCase()})</span>
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
