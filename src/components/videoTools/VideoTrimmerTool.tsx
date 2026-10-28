import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  Scissors,
  Download,
  RotateCcw,
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  formatTime,
  formatBytes,
  VideoMetadata,
  RenderedVideoResult,
} from '../../services/video/videoProcessingService';

export const VideoTrimmerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Trim boundaries
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [loopSelection, setLoopSelection] = useState<boolean>(true);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [trimmedResult, setTrimmedResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setTrimmedResult(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setStartTime(0);
        setEndTime(meta.duration);
        setVideoSrc(URL.createObjectURL(selected));
      } catch (err) {
        setError('Could not open video file. Please upload an MP4, WebM, MOV, or AVI video.');
      }
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= endTime || videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    if (cur >= endTime) {
      if (loopSelection && isPlaying) {
        videoRef.current.currentTime = startTime;
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleTrim = async () => {
    if (!file || !metadata) return;

    if (endTime <= startTime) {
      setError('End time must be greater than start time.');
      return;
    }

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setTrimmedResult(null);

      const result = await renderProcessedVideo({
        file,
        startTime,
        endTime,
        targetWidth: metadata.width,
        targetHeight: metadata.height,
        fps: 30,
        onProgress: (p) => setProgress(p.percent),
      });

      setTrimmedResult(result);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error cutting and trimming video.');
    }
  };

  const handleDownload = () => {
    if (!trimmedResult || !file) return;
    const a = document.createElement('a');
    a.href = trimmedResult.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_trimmed.${trimmedResult.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (trimmedResult?.url) URL.revokeObjectURL(trimmedResult.url);
    };
  }, [videoSrc, trimmedResult]);

  const trimmedDuration = Math.max(0, endTime - startTime);

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Scissors className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select video to trim and cut
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Remove unwanted footage with millisecond precision
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Videos
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* File Header */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-[#102A43]">{metadata?.name}</h4>
              <p className="text-xs text-[#61758A]">
                Duration: {metadata?.formattedDuration} · {metadata?.width}x{metadata?.height} · {metadata?.formattedSize}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setTrimmedResult(null);
                if (videoSrc) URL.revokeObjectURL(videoSrc);
                setVideoSrc('');
              }}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Video Player */}
          <div className="relative bg-black rounded-2xl overflow-hidden border border-[#E9DCC8] aspect-video flex items-center justify-center max-h-[380px]">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          {/* Scrubber & Player Controls */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white flex items-center justify-center shadow-md cursor-pointer transition-colors shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => handleSeek(startTime)}
                title="Jump to Trim Start"
                className="p-2 rounded-xl bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={metadata?.duration || 100}
                  step={0.05}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
              </div>

              <span className="font-mono text-xs font-bold text-[#102A43] shrink-0">
                {formatTime(currentTime, true)} / {formatTime(metadata?.duration || 0, true)}
              </span>
            </div>

            {/* Range Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E9DCC8]">
              <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#102A43]">START TRIM (CUT IN)</span>
                  <button
                    onClick={() => setStartTime(currentTime)}
                    className="text-[11px] font-bold text-[#D98218] hover:underline cursor-pointer"
                  >
                    Set to Current ({formatTime(currentTime)})
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  max={endTime - 0.1}
                  step={0.1}
                  value={startTime}
                  onChange={(e) => setStartTime(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-lg text-sm font-mono text-[#102A43]"
                />
                <span className="text-[11px] text-[#61758A] block font-mono">
                  Timestamp: {formatTime(startTime, true)}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#102A43]">END TRIM (CUT OUT)</span>
                  <button
                    onClick={() => setEndTime(currentTime)}
                    className="text-[11px] font-bold text-[#D98218] hover:underline cursor-pointer"
                  >
                    Set to Current ({formatTime(currentTime)})
                  </button>
                </div>
                <input
                  type="number"
                  min={startTime + 0.1}
                  max={metadata?.duration || 100}
                  step={0.1}
                  value={endTime}
                  onChange={(e) => setEndTime(Math.min(metadata?.duration || 100, Number(e.target.value)))}
                  className="w-full p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-lg text-sm font-mono text-[#102A43]"
                />
                <span className="text-[11px] text-[#61758A] block font-mono">
                  Timestamp: {formatTime(endTime, true)}
                </span>
              </div>
            </div>

            {/* Selection Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#E9DCC8]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D98218]" />
                <span className="text-xs font-bold text-[#102A43]">
                  Selected Output Duration: <span className="font-mono text-[#D98218]">{formatTime(trimmedDuration, true)}</span>
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={loopSelection}
                  onChange={(e) => setLoopSelection(e.target.checked)}
                  className="accent-[#D98218] w-4 h-4 rounded"
                />
                <span className="text-xs font-semibold text-[#102A43]">Loop Selection in Player</span>
              </label>
            </div>
          </div>

          {/* Action Box */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {processing && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#102A43]">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D98218]" />
                    Trimming video frames ({formatTime(startTime)} → {formatTime(endTime)})...
                  </span>
                  <span className="font-mono text-[#D98218]">{progress}%</span>
                </div>
                <div className="w-full bg-[#E9DCC8] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D98218] h-full transition-all duration-150 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {trimmedResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">Video Trimmed Successfully!</h5>
                    <p className="text-[11px] text-emerald-700">
                      Duration: <strong>{formatTime(trimmedResult.duration)}</strong> · Size: {trimmedResult.formattedSize}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Trimmed Video</span>
                </button>
              </div>
            )}

            {!trimmedResult && (
              <button
                onClick={handleTrim}
                disabled={processing}
                className="w-full py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Cutting Video ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    <span>Trim & Save Video Now</span>
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
