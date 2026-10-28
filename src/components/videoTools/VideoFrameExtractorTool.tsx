import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  FileVideo,
  Play,
  Pause,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import {
  getVideoMetadata,
  extractVideoFrames,
  seekVideo,
  captureFrameToCanvas,
  formatTime,
  formatBytes,
  VideoMetadata,
  ExtractedFrame,
} from '../../services/video/videoProcessingService';

export const VideoFrameExtractorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Extraction mode: 'single' (current frame snapshot) or 'batch' (interval)
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [intervalSec, setIntervalSec] = useState<number>(2);
  const [maxFrames, setMaxFrames] = useState<number>(20);

  // Extracted frames list
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [singleSnapshot, setSingleSnapshot] = useState<string | null>(null);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [zipping, setZipping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setFrames([]);
        setSingleSnapshot(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setVideoSrc(URL.createObjectURL(selected));
      } catch (err) {
        setError('Unsupported video format.');
      }
    }
  };

  const handleCaptureCurrentFrame = () => {
    if (!videoRef.current || !metadata) return;
    try {
      const canvas = captureFrameToCanvas(videoRef.current);
      const dataUrl = canvas.toDataURL(format, 0.95);
      setSingleSnapshot(dataUrl);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const newFrame: ExtractedFrame = {
          timestamp: currentTime,
          formattedTime: formatTime(currentTime, true),
          blob,
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          index: frames.length + 1,
        };
        setFrames((prev) => [newFrame, ...prev]);
        try {
          confetti({ particleCount: 30, spread: 50 });
        } catch {
          // ignore
        }
      }, format, 0.95);
    } catch {
      setError('Could not capture frame from video.');
    }
  };

  const handleBatchExtract = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);

      const extracted = await extractVideoFrames(file, {
        intervalSec,
        maxFrames,
        format,
        quality: 0.92,
        onProgress: (pct) => setProgress(pct),
      });

      setFrames(extracted);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error extracting frames.');
    }
  };

  const handleDownloadSingle = (frame: ExtractedFrame) => {
    const ext = format === 'image/png' ? 'png' : 'jpg';
    const a = document.createElement('a');
    a.href = frame.dataUrl;
    a.download = `frame_${frame.formattedTime.replace(':', '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    if (frames.length === 0) return;
    try {
      setZipping(true);
      const zip = new JSZip();
      const ext = format === 'image/png' ? 'png' : 'jpg';

      frames.forEach((f, idx) => {
        const padIndex = (idx + 1).toString().padStart(3, '0');
        const filename = `frame_${padIndex}_${f.formattedTime.replace(':', '_')}.${ext}`;
        zip.file(filename, f.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${file?.name.split('.')[0] || 'video'}_frames.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setZipping(false);
    } catch (err) {
      setZipping(false);
      setError('Could not generate ZIP archive.');
    }
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

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
            <Camera className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select video to extract image frames
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Capture exact high-res snapshots or extract batch image frames with ZIP download
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Videos
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* File Header */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center">
                <FileVideo className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-sm">{metadata?.name}</h4>
                <p className="text-xs text-[#61758A]">
                  Resolution: {metadata?.width}x{metadata?.height} · Duration: {metadata?.formattedDuration}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setFrames([]);
                if (videoSrc) URL.revokeObjectURL(videoSrc);
                setVideoSrc('');
              }}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Interactive Player with Scrubber */}
          <div className="relative bg-black rounded-2xl overflow-hidden border border-[#E9DCC8] aspect-video flex items-center justify-center max-h-[360px]">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              onTimeUpdate={() => {
                if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
              }}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          {/* Player controls */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!videoRef.current) return;
                  if (isPlaying) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                  } else {
                    videoRef.current.play();
                    setIsPlaying(true);
                  }
                }}
                className="p-2 rounded-xl bg-[#D98218] text-white hover:bg-[#C66A08] cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={metadata?.duration || 100}
                  step={0.05}
                  value={currentTime}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = val;
                    setCurrentTime(val);
                  }}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
              </div>

              <span className="font-mono text-xs font-bold text-[#102A43] shrink-0">
                {formatTime(currentTime, true)} / {formatTime(metadata?.duration || 0, true)}
              </span>

              <button
                onClick={handleCaptureCurrentFrame}
                className="px-4 py-2 rounded-xl bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Frame</span>
              </button>
            </div>
          </div>

          {/* Mode Switch: Single Snapshot vs Batch */}
          <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
            <div className="flex gap-2 border-b border-[#E9DCC8] pb-3">
              <button
                onClick={() => setMode('single')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'single'
                    ? 'bg-[#D98218] text-white shadow-xs'
                    : 'bg-[#FAF5EC] text-[#102A43] border border-[#E9DCC8]'
                }`}
              >
                Manual Snapshots
              </button>

              <button
                onClick={() => setMode('batch')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'batch'
                    ? 'bg-[#D98218] text-white shadow-xs'
                    : 'bg-[#FAF5EC] text-[#102A43] border border-[#E9DCC8]'
                }`}
              >
                Batch Auto-Extraction
              </button>
            </div>

            {/* Common format setting */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Image Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                  className="w-full p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43]"
                >
                  <option value="image/jpeg">JPEG (.jpg) - High Quality</option>
                  <option value="image/png">PNG (.png) - Lossless</option>
                </select>
              </div>

              {mode === 'batch' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#102A43] block mb-1">
                      Extraction Interval ({intervalSec} sec)
                    </label>
                    <select
                      value={intervalSec}
                      onChange={(e) => setIntervalSec(Number(e.target.value))}
                      className="w-full p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43]"
                    >
                      <option value={1}>Every 1 Second</option>
                      <option value={2}>Every 2 Seconds</option>
                      <option value={5}>Every 5 Seconds</option>
                      <option value={10}>Every 10 Seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#102A43] block mb-1">
                      Max Frames Cap ({maxFrames})
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={maxFrames}
                      onChange={(e) => setMaxFrames(Number(e.target.value))}
                      className="w-full accent-[#D98218] mt-2"
                    />
                  </div>
                </>
              )}
            </div>

            {mode === 'batch' && (
              <button
                onClick={handleBatchExtract}
                disabled={processing}
                className="w-full py-2.5 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Frames ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Extract All Frames Across Video</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Extracted Frames Gallery */}
          {frames.length > 0 && (
            <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
                    Extracted Frames ({frames.length})
                  </h5>
                  <p className="text-[11px] text-[#61758A]">
                    Native resolution: {metadata?.width}x{metadata?.height}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFrames([])}
                    className="text-xs text-[#61758A] hover:text-red-600 font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>

                  <button
                    onClick={handleDownloadAllZip}
                    disabled={zipping}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{zipping ? 'Zipping...' : 'Download All (.ZIP)'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {frames.map((frame, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-[#FAF5EC] rounded-xl overflow-hidden border border-[#E9DCC8] shadow-xs flex flex-col"
                  >
                    <div className="aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                      <img
                        src={frame.dataUrl}
                        alt={`Frame at ${frame.formattedTime}`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="p-2 flex items-center justify-between text-[11px] font-mono text-[#102A43]">
                      <span>{frame.formattedTime}</span>
                      <button
                        onClick={() => handleDownloadSingle(frame)}
                        className="p-1 rounded bg-white hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] cursor-pointer"
                        title="Download Frame"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
