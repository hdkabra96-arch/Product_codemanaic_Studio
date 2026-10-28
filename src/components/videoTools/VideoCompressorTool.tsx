import React, { useState, useEffect } from 'react';
import {
  Upload,
  RefreshCw,
  Download,
  Check,
  AlertCircle,
  FileVideo,
  ArrowRight,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  formatBytes,
  formatTime,
  VideoMetadata,
  RenderedVideoResult,
} from '../../services/video/videoProcessingService';

export const VideoCompressorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');

  // Compression presets
  const [preset, setPreset] = useState<'high' | 'balanced' | 'low' | 'custom'>('balanced');
  const [customBitrateKbps, setCustomBitrateKbps] = useState<number>(1200);
  const [customResolution, setCustomResolution] = useState<'720p' | '480p' | '360p'>('720p');

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [compressedResult, setCompressedResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setCompressedResult(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setVideoSrc(URL.createObjectURL(selected));
      } catch (err) {
        setError('Invalid video file. Please upload an MP4, WebM, MOV, or AVI video.');
      }
    }
  };

  const handleCompress = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setCompressedResult(null);

      let targetW = 1280;
      let targetH = 720;
      let bitrate = 1500000;

      if (preset === 'high') {
        // High compression (smaller file, ~480p, 800 kbps)
        targetW = 854;
        targetH = 480;
        bitrate = 750000;
      } else if (preset === 'balanced') {
        // Balanced (~720p, 1500 kbps)
        targetW = 1280;
        targetH = 720;
        bitrate = 1400000;
      } else if (preset === 'low') {
        // Low compression / High quality (~1080p or native, 2500 kbps)
        targetW = metadata.width > 1280 ? 1920 : metadata.width;
        targetH = metadata.height > 720 ? 1080 : metadata.height;
        bitrate = 2600000;
      } else {
        // Custom
        bitrate = customBitrateKbps * 1000;
        if (customResolution === '480p') {
          targetW = 854;
          targetH = 480;
        } else if (customResolution === '360p') {
          targetW = 640;
          targetH = 360;
        } else {
          targetW = 1280;
          targetH = 720;
        }
      }

      // Preserve native aspect ratio
      if (metadata.aspectRatio) {
        if (metadata.aspectRatio >= 1) {
          targetH = Math.round(targetW / metadata.aspectRatio);
        } else {
          targetW = Math.round(targetH * metadata.aspectRatio);
        }
      }

      const result = await renderProcessedVideo({
        file,
        targetWidth: targetW,
        targetHeight: targetH,
        bitrate,
        fps: 24, // Optimized fps for compression efficiency
        onProgress: (p) => setProgress(p.percent),
      });

      setCompressedResult(result);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Compression error.');
    }
  };

  const handleDownload = () => {
    if (!compressedResult || !file) return;
    const a = document.createElement('a');
    a.href = compressedResult.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_compressed.${compressedResult.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getSavedPct = () => {
    if (!metadata || !compressedResult) return 0;
    const diff = metadata.fileSize - compressedResult.sizeBytes;
    if (diff <= 0) return 0;
    return Math.round((diff / metadata.fileSize) * 100);
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (compressedResult?.url) URL.revokeObjectURL(compressedResult.url);
    };
  }, [videoSrc, compressedResult]);

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
            <Upload className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select video to compress
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Reduce file size up to 70% while keeping high visual clarity
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Videos
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* File Card */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center">
                <FileVideo className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-sm">{metadata?.name}</h4>
                <p className="text-xs text-[#61758A]">
                  Original Size: <strong>{metadata?.formattedSize}</strong> · {metadata?.width}x{metadata?.height} · {metadata?.formattedDuration}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setCompressedResult(null);
                if (videoSrc) URL.revokeObjectURL(videoSrc);
                setVideoSrc('');
              }}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Compression Level Presets */}
          <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider block">
                Compression Level
              </label>
              <span className="text-xs font-bold text-[#D98218]">
                Smart Bitrate & Resolution Optimization
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'high',
                  title: 'Maximum Compression',
                  sub: '~70% reduction',
                  desc: '480p resolution · Ideal for WhatsApp, Discord, Email',
                },
                {
                  id: 'balanced',
                  title: 'Balanced (Recommended)',
                  sub: '~45% reduction',
                  desc: '720p resolution · Great balance of quality and size',
                },
                {
                  id: 'low',
                  title: 'High Quality',
                  sub: '~25% reduction',
                  desc: 'Full HD resolution · Preserves maximum sharpness',
                },
              ].map((p) => {
                const selected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id as typeof preset)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-[#D98218] bg-[#FAF5EC] ring-1 ring-[#D98218] shadow-xs'
                        : 'border-[#E9DCC8] bg-white hover:border-[#D98218]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#102A43]">{p.title}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FFF3DF] text-[#D98218]">
                        {p.sub}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#61758A] mt-1">{p.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Custom Options Toggle */}
            <div className="pt-2 border-t border-[#E9DCC8]">
              <button
                onClick={() => setPreset(preset === 'custom' ? 'balanced' : 'custom')}
                className="text-xs font-bold text-[#D98218] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{preset === 'custom' ? 'Use Standard Presets' : 'Advanced: Set Custom Bitrate & Resolution'}</span>
              </button>

              {preset === 'custom' && (
                <div className="mt-3 p-4 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1">
                      <span>Target Video Bitrate</span>
                      <span className="font-mono text-[#D98218]">{customBitrateKbps} kbps</span>
                    </div>
                    <input
                      type="range"
                      min={400}
                      max={3500}
                      step={100}
                      value={customBitrateKbps}
                      onChange={(e) => setCustomBitrateKbps(Number(e.target.value))}
                      className="w-full accent-[#D98218]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#102A43] block mb-1">Downscale Resolution</label>
                    <select
                      value={customResolution}
                      onChange={(e) => setCustomResolution(e.target.value as typeof customResolution)}
                      className="w-full p-2 bg-white border border-[#E9DCC8] rounded-lg text-xs font-bold text-[#102A43]"
                    >
                      <option value="720p">720p HD (1280x720)</option>
                      <option value="480p">480p SD (854x480)</option>
                      <option value="360p">360p Compact (640x360)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action & Results Area */}
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
                    Encoding video with optimized bitrate...
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

            {/* Comparison card on completion */}
            {compressedResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Video Compression Completed Successfully!</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-emerald-200 text-center">
                  <div>
                    <div className="text-[11px] text-[#61758A] font-bold">ORIGINAL SIZE</div>
                    <div className="text-base font-extrabold text-[#102A43] font-mono mt-0.5">
                      {metadata?.formattedSize}
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-[#D98218]">
                    <ArrowRight className="w-5 h-5 hidden sm:block" />
                    <div className="sm:hidden text-xs font-bold text-[#D98218]">To</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#61758A] font-bold">COMPRESSED SIZE</div>
                    <div className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">
                      {compressedResult.formattedSize}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600">
                      {getSavedPct() > 0 ? `(${getSavedPct()}% reduction)` : '(Optimized)'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Compressed Video</span>
                  </button>
                </div>
              </div>
            )}

            {!compressedResult && (
              <button
                onClick={handleCompress}
                disabled={processing}
                className="w-full py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compressing Video ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Start Compression Now</span>
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
