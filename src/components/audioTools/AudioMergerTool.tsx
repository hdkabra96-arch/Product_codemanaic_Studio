import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Layers,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  FileAudio,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  mergeAudioFiles,
  getAudioMetadata,
  AudioMetadata,
  ProcessedAudioResult,
  formatAudioBytes,
  formatAudioTime,
} from '../../services/audio/audioProcessingService';

interface TrackItem {
  id: string;
  file: File;
  metadata?: AudioMetadata;
}

export const AudioMergerTool: React.FC = () => {
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<'mp3' | 'wav'>('mp3');
  const [bitrate, setBitrate] = useState<320 | 256 | 192 | 128 | 96>(192);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ProcessedAudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      setError(null);
      setResult(null);

      const newItems: TrackItem[] = [];
      for (const f of incoming) {
        const item: TrackItem = {
          id: `${f.name}_${Date.now()}_${Math.random()}`,
          file: f,
        };
        try {
          item.metadata = await getAudioMetadata(f);
        } catch {
          // ignore
        }
        newItems.push(item);
      }

      setTracks((prev) => [...prev, ...newItems]);
    }
  };

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tracks.length) return;
    const updated = [...tracks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setTracks(updated);
  };

  const removeTrack = (index: number) => {
    setTracks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (tracks.length < 2) {
      setError('Please add at least 2 audio files to merge.');
      return;
    }

    try {
      setProcessing(true);
      setProgress(10);
      setError(null);
      setResult(null);

      const files = tracks.map((t) => t.file);
      const res = await mergeAudioFiles(files, {
        format: targetFormat,
        bitrate,
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
      setError(err instanceof Error ? err.message : 'Error merging audio files.');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `merged_track.${result.format}`;
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

  const totalCalculatedDuration = tracks.reduce(
    (sum, t) => sum + (t.metadata?.duration || 0),
    0
  );

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
        <input
          type="file"
          accept="audio/*,video/*"
          multiple
          className="hidden"
          onChange={handleAddFiles}
        />
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
          <Plus className="w-6 h-6" />
        </div>
        <span className="text-sm font-bold text-[#102A43]">
          Click to add audio files to merge
        </span>
        <span className="text-xs text-[#61758A] mt-0.5">
          Select multiple MP3, WAV, AAC, or OGG tracks to combine in order
        </span>
      </label>

      {/* Tracks List */}
      {tracks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
              Selected Tracks ({tracks.length}) • Total Est.{' '}
              {formatAudioTime(totalCalculatedDuration)}
            </span>
            <button
              onClick={() => setTracks([])}
              className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                className="p-3 bg-white rounded-xl border border-[#E9DCC8] shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#FAF5EC] text-[#D98218] text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-[#102A43] truncate max-w-xs sm:max-w-md">
                      {track.file.name}
                    </h5>
                    <div className="text-[11px] text-[#61758A] flex items-center gap-2">
                      <span>{formatAudioBytes(track.file.size)}</span>
                      {track.metadata && (
                        <>
                          <span>•</span>
                          <span>{track.metadata.formattedDuration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveTrack(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded-md text-[#61758A] hover:text-[#D98218] hover:bg-[#FAF5EC] disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveTrack(idx, 'down')}
                    disabled={idx === tracks.length - 1}
                    className="p-1 rounded-md text-[#61758A] hover:text-[#D98218] hover:bg-[#FAF5EC] disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeTrack(idx)}
                    className="p-1 rounded-md text-[#61758A] hover:text-red-600 hover:bg-red-50 cursor-pointer ml-1"
                    title="Remove Track"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
              <label className="text-xs font-bold text-[#102A43] block mb-1">Target Format</label>
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
              <label className="text-xs font-bold text-[#102A43] block mb-1">MP3 Bitrate</label>
              <select
                value={bitrate}
                onChange={(e) => setBitrate(Number(e.target.value) as any)}
                disabled={targetFormat === 'wav'}
                className="w-full p-1.5 text-xs font-semibold rounded-xl bg-white border border-[#E9DCC8] text-[#102A43] focus:outline-none focus:border-[#D98218] disabled:opacity-50"
              >
                <option value={320}>320 kbps (High Fidelity)</option>
                <option value={256}>256 kbps (Premium)</option>
                <option value={192}>192 kbps (Standard High)</option>
                <option value={128}>128 kbps (Balanced)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action, Processing or Result */}
      {processing ? (
        <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
            <span>Concatenating Audio Buffers...</span>
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
                <h4 className="text-sm font-bold text-emerald-900">Tracks Merged Successfully!</h4>
                <span className="text-xs text-emerald-700 block mt-0.5">
                  Combined Length: {formatAudioTime(result.duration)} • Size: {result.formattedSize}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Merged Audio</span>
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setIsPlaying(false);
                }}
                className="p-2.5 rounded-full bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
                title="Merge again"
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
        tracks.length >= 2 && (
          <button
            onClick={handleMerge}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Merge {tracks.length} Audio Files</span>
          </button>
        )
      )}
    </div>
  );
};
