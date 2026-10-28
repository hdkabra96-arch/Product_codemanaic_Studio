import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Minimize2,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  FileAudio,
  TrendingDown,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getAudioMetadata,
  compressAudioFile,
  AudioMetadata,
  ProcessedAudioResult,
  formatAudioBytes,
  formatAudioTime,
} from '../../services/audio/audioProcessingService';

export const AudioCompressorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);

  // Compression presets
  const [preset, setPreset] = useState<'low' | 'medium' | 'high' | 'extreme'>('medium');
  const [channels, setChannels] = useState<'stereo' | 'mono'>('stereo');

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ProcessedAudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const presetsConfig = [
    {
      id: 'extreme',
      title: 'Extreme Compress',
      bitrate: '64 kbps',
      desc: 'Smallest file size (~75% reduction). Best for voice memos & podcasts.',
      badge: 'Max Savings',
      badgeBg: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'high',
      title: 'High Compress',
      bitrate: '96 kbps',
      desc: 'Great size reduction (~60% savings). Good clarity for streaming.',
      badge: 'Optimal Web',
      badgeBg: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'medium',
      title: 'Balanced',
      bitrate: '128 kbps',
      desc: 'Standard MP3 fidelity (~45% savings). Crisp stereo balance.',
      badge: 'Recommended',
      badgeBg: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'low',
      title: 'Light Compress',
      bitrate: '192 kbps',
      desc: 'Near lossless (~25% savings). Best for rich music & instruments.',
      badge: 'High Fidelity',
      badgeBg: 'bg-purple-100 text-purple-800',
    },
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
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not decode audio. Please upload an MP3, WAV, AAC, or OGG file.'
        );
      }
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setProcessing(true);
      setProgress(10);
      setError(null);
      setResult(null);

      const res = await compressAudioFile(file, {
        preset,
        channels,
        targetFormat: 'mp3',
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
      setError(err instanceof Error ? err.message : 'Error compressing audio file.');
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_compressed.mp3`;
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

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Minimize2 className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Choose audio file to compress
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Reduce audio file size with intelligent bit-depth compression (up to 80% smaller)
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Audio File
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File Card & Metadata */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</h4>
                <div className="flex items-center gap-3 text-xs text-[#61758A]">
                  <span className="font-bold text-[#102A43]">{formatAudioBytes(file.size)}</span>
                  <span>•</span>
                  <span>{metadata ? metadata.formattedDuration : 'Loading...'}</span>
                  <span>•</span>
                  <span>{metadata ? `~${metadata.estimatedBitrateKbps} kbps` : ''}</span>
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

          {/* Preset Cards */}
          <div>
            <label className="text-xs font-bold text-[#102A43] block mb-2 uppercase tracking-wide">
              Select Compression Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presetsConfig.map((p) => {
                const isSelected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id as any)}
                    className={`p-3 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-md ring-2 ring-[#D98218]/20'
                        : 'border-[#E9DCC8] bg-white hover:border-[#D98218]/50 hover:bg-[#FAF5EC]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-[#102A43]">{p.title}</span>
                        <span className="text-[10px] font-bold text-[#D98218] font-mono">
                          {p.bitrate}
                        </span>
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-1 ${p.badgeBg}`}
                      >
                        {p.badge}
                      </span>
                      <p className="text-[11px] text-[#61758A] leading-tight">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channel Option */}
          <div className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] flex items-center justify-between text-xs">
            <span className="font-bold text-[#102A43]">Channels Mode:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setChannels('stereo')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  channels === 'stereo'
                    ? 'bg-[#D98218] text-white shadow-sm'
                    : 'bg-white text-[#102A43] border border-[#E9DCC8]'
                }`}
              >
                Stereo (2 Channels)
              </button>
              <button
                type="button"
                onClick={() => setChannels('mono')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  channels === 'mono'
                    ? 'bg-[#D98218] text-white shadow-sm'
                    : 'bg-white text-[#102A43] border border-[#E9DCC8]'
                }`}
              >
                Mono (Smaller Size)
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Processing progress or result */}
          {processing ? (
            <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
                <span>Compressing Audio Stream...</span>
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
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                      <span>Compression Complete!</span>
                      {result.sizeBytes < result.originalSize && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800">
                          {Math.round(
                            ((result.originalSize - result.sizeBytes) / result.originalSize) * 100
                          )}
                          % Smaller
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-emerald-700 block mt-0.5">
                      Original: {formatAudioBytes(result.originalSize)} → Compressed:{' '}
                      <span className="font-bold">{result.formattedSize}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Compressed MP3</span>
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setIsPlaying(false);
                    }}
                    className="p-2.5 rounded-full bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
                    title="Change settings"
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
              onClick={handleCompress}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Compress Audio Now</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
