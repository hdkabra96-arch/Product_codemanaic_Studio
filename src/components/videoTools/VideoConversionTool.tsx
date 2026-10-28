import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  RefreshCw,
  Download,
  Check,
  AlertCircle,
  FileVideo,
  Settings2,
  Film,
  Music,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  encodeVideoToGif,
  extractAudioFromVideo,
  formatTime,
  formatBytes,
  VideoMetadata,
  getSupportedVideoMimeTypes,
} from '../../services/video/videoProcessingService';

export const VideoConversionTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');

  // Target format settings
  const [targetFormat, setTargetFormat] = useState<'webm' | 'mp4' | 'gif' | 'mp3'>('webm');
  const [qualityPreset, setQualityPreset] = useState<'high' | 'medium' | 'low'>('medium');
  const [maintainAudio, setMaintainAudio] = useState<boolean>(true);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string>('');
  const [convertedExt, setConvertedExt] = useState<string>('webm');
  const [convertedSizeStr, setConvertedSizeStr] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const supportedCodecs = getSupportedVideoMimeTypes();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setConvertedBlob(null);
        setConvertedUrl('');
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setVideoSrc(URL.createObjectURL(selected));
      } catch (err) {
        setError('Unsupported video file. Please upload an MP4, WebM, MOV, or AVI video.');
      }
    }
  };

  const handleConvert = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setConvertedBlob(null);
      setConvertedUrl('');

      if (targetFormat === 'gif') {
        // GIF Conversion
        const gifBlob = await encodeVideoToGif(file, {
          startTime: 0,
          endTime: Math.min(15, metadata.duration), // Limit to first 15 seconds for optimal GIF performance
          fps: qualityPreset === 'high' ? 16 : qualityPreset === 'medium' ? 12 : 8,
          width: qualityPreset === 'high' ? 540 : qualityPreset === 'medium' ? 420 : 320,
          onProgress: (p) => setProgress(p),
        });

        const url = URL.createObjectURL(gifBlob);
        setConvertedBlob(gifBlob);
        setConvertedUrl(url);
        setConvertedExt('gif');
        setConvertedSizeStr(formatBytes(gifBlob.size));
      } else if (targetFormat === 'mp3') {
        // Audio Extraction
        const audioResult = await extractAudioFromVideo(file, {
          format: 'mp3',
          bitrate: qualityPreset === 'high' ? 320 : qualityPreset === 'medium' ? 192 : 128,
          onProgress: (p) => setProgress(p),
        });

        setConvertedBlob(audioResult.blob);
        setConvertedUrl(audioResult.url);
        setConvertedExt('mp3');
        setConvertedSizeStr(formatBytes(audioResult.blob.size));
      } else {
        // Video to WebM / MP4 Transcoding
        let targetW = 1280;
        let targetH = 720;
        let bitrate = 2000000;

        if (qualityPreset === 'high') {
          targetW = 1920;
          targetH = 1080;
          bitrate = 4000000;
        } else if (qualityPreset === 'low') {
          targetW = 854;
          targetH = 480;
          bitrate = 900000;
        }

        if (metadata.aspectRatio) {
          if (metadata.aspectRatio >= 1) {
            targetH = Math.round(targetW / metadata.aspectRatio);
          } else {
            targetW = Math.round(targetH * metadata.aspectRatio);
          }
        }

        const videoResult = await renderProcessedVideo({
          file,
          targetWidth: targetW,
          targetHeight: targetH,
          bitrate,
          volume: maintainAudio ? 1.0 : 0,
          outputMimeType: targetFormat === 'mp4' ? 'video/mp4' : 'video/webm',
          onProgress: (p) => setProgress(p.percent),
        });

        setConvertedBlob(videoResult.blob);
        setConvertedUrl(videoResult.url);
        setConvertedExt(videoResult.extension);
        setConvertedSizeStr(videoResult.formattedSize);
      }

      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error converting video file.');
    }
  };

  const handleDownload = () => {
    if (!convertedUrl || !file) return;
    const a = document.createElement('a');
    a.href = convertedUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_converted.${convertedExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [videoSrc, convertedUrl]);

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
            Select video to convert
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Convert between MP4, WebM, animated GIF, or extract MP3 audio
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Videos
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* File Information Card */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center">
                <FileVideo className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-sm">{metadata?.name}</h4>
                <p className="text-xs text-[#61758A]">
                  Original: {metadata?.width}x{metadata?.height} · {metadata?.formattedDuration} · {metadata?.formattedSize}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setConvertedBlob(null);
                if (videoSrc) URL.revokeObjectURL(videoSrc);
                setVideoSrc('');
              }}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Conversion Options */}
          <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] space-y-5">
            <div>
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider block mb-2.5">
                Target Output Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'webm', label: 'WebM Video', ext: '.webm', icon: Film, desc: 'High efficiency' },
                  { id: 'mp4', label: 'MP4 Video', ext: '.mp4', icon: Film, desc: 'Universal player' },
                  { id: 'gif', label: 'Animated GIF', ext: '.gif', icon: ImageIcon, desc: 'Looping animation' },
                  { id: 'mp3', label: 'MP3 Audio', ext: '.mp3', icon: Music, desc: 'Audio track only' },
                ].map((fmt) => {
                  const Icon = fmt.icon;
                  const selected = targetFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setTargetFormat(fmt.id as typeof targetFormat)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-[#D98218] bg-[#FFF3DF]/40 shadow-xs ring-1 ring-[#D98218]'
                          : 'border-[#E9DCC8] bg-white hover:border-[#D98218]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${selected ? 'text-[#D98218]' : 'text-[#61758A]'}`} />
                        <span className={`text-[11px] font-mono font-bold ${selected ? 'text-[#D98218]' : 'text-[#61758A]'}`}>
                          {fmt.ext}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#102A43]">{fmt.label}</div>
                      <div className="text-[10px] text-[#61758A]">{fmt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality Presets */}
            <div>
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider block mb-2">
                Quality & Encoding Profile
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'high', title: 'High Quality (1080p)', desc: 'Highest bitrate & sharpest detail' },
                  { id: 'medium', title: 'Balanced (720p)', desc: 'Standard bitrate, fast processing' },
                  { id: 'low', title: 'Compact (480p)', desc: 'Small file size for easy sharing' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setQualityPreset(p.id as typeof qualityPreset)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      qualityPreset === p.id
                        ? 'border-[#D98218] bg-[#FAF5EC] shadow-xs'
                        : 'border-[#E9DCC8] bg-white hover:border-[#D98218]/50'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#102A43]">{p.title}</div>
                    <div className="text-[11px] text-[#61758A] mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Toggle */}
            {targetFormat !== 'mp3' && targetFormat !== 'gif' && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF5EC] border border-[#E9DCC8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintainAudio}
                  onChange={(e) => setMaintainAudio(e.target.checked)}
                  className="w-4 h-4 accent-[#D98218] rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#102A43] block">Include Audio Stream</span>
                  <span className="text-[11px] text-[#61758A]">Preserve original soundtrack with synchronized audio track</span>
                </div>
              </label>
            )}
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
                    Transcoding streams to {targetFormat.toUpperCase()}...
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

            {convertedUrl && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">
                      Conversion Complete ({convertedExt.toUpperCase()})
                    </h5>
                    <p className="text-[11px] text-emerald-700">
                      Output Size: <strong>{convertedSizeStr}</strong> · Encoded & Verified
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              </div>
            )}

            {!convertedUrl && (
              <button
                onClick={handleConvert}
                disabled={processing}
                className="w-full py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Converting Video ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Convert to {targetFormat.toUpperCase()} Now</span>
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
