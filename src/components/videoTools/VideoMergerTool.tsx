import React, { useState, useEffect } from 'react';
import {
  Upload,
  Layers,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Plus,
  FileVideo,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderMergedVideos,
  formatTime,
  formatBytes,
  VideoMetadata,
  RenderedVideoResult,
} from '../../services/video/videoProcessingService';

interface VideoClipItem {
  id: string;
  file: File;
  metadata: VideoMetadata;
  thumbnailUrl?: string;
}

export const VideoMergerTool: React.FC = () => {
  const [clips, setClips] = useState<VideoClipItem[]>([]);
  const [resolution, setResolution] = useState<'1080p' | '720p' | '480p'>('720p');

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentClipText, setCurrentClipText] = useState<string>('');
  const [mergedResult, setMergedResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddVideos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setError(null);
      setMergedResult(null);
      const newFiles = Array.from(e.target.files);

      const loadedItems: VideoClipItem[] = [];
      for (const f of newFiles) {
        try {
          const meta = await getVideoMetadata(f);
          loadedItems.push({
            id: `clip-${Date.now()}-${Math.random()}`,
            file: f,
            metadata: meta,
          });
        } catch {
          // skip invalid files
        }
      }

      setClips((prev) => [...prev, ...loadedItems]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setClips((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === clips.length - 1) return;
    setClips((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleRemove = (index: number) => {
    setClips((prev) => prev.filter((_, i) => i !== index));
    setMergedResult(null);
  };

  const totalDuration = clips.reduce((acc, c) => acc + c.metadata.duration, 0);
  const totalSize = clips.reduce((acc, c) => acc + c.metadata.fileSize, 0);

  const handleMerge = async () => {
    if (clips.length < 2) {
      setError('Please add at least 2 video clips to merge.');
      return;
    }

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setMergedResult(null);

      let targetW = 1280;
      let targetH = 720;
      if (resolution === '1080p') {
        targetW = 1920;
        targetH = 1080;
      } else if (resolution === '480p') {
        targetW = 854;
        targetH = 480;
      }

      const files = clips.map((c) => c.file);
      const result = await renderMergedVideos({
        files,
        targetWidth: targetW,
        targetHeight: targetH,
        onProgress: (p) => {
          setProgress(p.percent);
          setCurrentClipText(`Merging clip ${p.currentClipIndex} of ${p.totalClips}: ${p.clipName}`);
        },
      });

      setMergedResult(result);
      setProcessing(false);
      try {
        confetti({ particleCount: 60, spread: 70 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error merging videos.');
    }
  };

  const handleDownload = () => {
    if (!mergedResult) return;
    const a = document.createElement('a');
    a.href = mergedResult.url;
    a.download = `codemaniac_merged_${Date.now()}.${mergedResult.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (mergedResult?.url) URL.revokeObjectURL(mergedResult.url);
    };
  }, [mergedResult]);

  return (
    <div className="space-y-6">
      {clips.length === 0 ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleAddVideos}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select multiple videos to combine
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Upload 2 or more MP4, WebM, MOV clips to merge into one single video file
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Videos
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* Top Bar with Add More and Summary */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-[#102A43]">
                {clips.length} Clips Selected ({formatTime(totalDuration)} Total Duration)
              </h4>
              <p className="text-xs text-[#61758A]">
                Combined Size: {formatBytes(totalSize)} · Reorder clips using arrows below
              </p>
            </div>

            <label className="px-3.5 py-1.5 rounded-xl bg-[#FAF5EC] border border-[#E9DCC8] hover:border-[#D98218] text-[#D98218] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Clips</span>
              <input
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={handleAddVideos}
              />
            </label>
          </div>

          {/* Clips List */}
          <div className="space-y-2.5">
            {clips.map((clip, index) => (
              <div
                key={clip.id}
                className="p-3.5 bg-white rounded-xl border border-[#E9DCC8] shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF5EC] text-[#D98218] font-bold text-xs flex items-center justify-center shrink-0 border border-[#E9DCC8]">
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-[#102A43] truncate">{clip.metadata.name}</h5>
                    <p className="text-[11px] text-[#61758A]">
                      {clip.metadata.width}x{clip.metadata.height} · {clip.metadata.formattedDuration} · {clip.metadata.formattedSize}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-1.5 rounded-lg border border-[#E9DCC8] text-[#61758A] hover:text-[#102A43] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === clips.length - 1}
                    title="Move Down"
                    className="p-1.5 rounded-lg border border-[#E9DCC8] text-[#61758A] hover:text-[#102A43] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(index)}
                    title="Remove Clip"
                    className="p-1.5 rounded-lg border border-[#E9DCC8] text-[#61758A] hover:text-red-600 hover:border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Settings & Action */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#102A43]">Merged Output Resolution:</span>
              <div className="flex gap-1.5">
                {(['1080p', '720p', '480p'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      resolution === r
                        ? 'bg-[#D98218] text-white shadow-xs'
                        : 'bg-white text-[#102A43] border border-[#E9DCC8]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {processing && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#102A43]">
                  <span className="flex items-center gap-2 truncate">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D98218] shrink-0" />
                    <span>{currentClipText || 'Merging clips...'}</span>
                  </span>
                  <span className="font-mono text-[#D98218] shrink-0">{progress}%</span>
                </div>
                <div className="w-full bg-[#E9DCC8] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D98218] h-full transition-all duration-150 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {mergedResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">Videos Merged Successfully!</h5>
                    <p className="text-[11px] text-emerald-700">
                      Duration: <strong>{formatTime(mergedResult.duration)}</strong> · Size: {mergedResult.formattedSize}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Merged Video</span>
                </button>
              </div>
            )}

            {!mergedResult && (
              <button
                onClick={handleMerge}
                disabled={processing || clips.length < 2}
                className="w-full py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Merging Clips ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Merge {clips.length} Clips Into One</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
