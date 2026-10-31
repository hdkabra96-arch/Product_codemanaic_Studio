import React, { useState, useRef } from 'react';
import {
  Upload,
  Play,
  Pause,
  VolumeX,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Music,
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

export const VideoRemoveAudioTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setResult(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setVideoSrc(URL.createObjectURL(selected));
      } catch {
        setError('Could not open video. Please upload a valid MP4, WebM, MOV, or AVI video.');
      }
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleProcess = async () => {
    if (!file || !metadata) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const res = await renderProcessedVideo({
        file,
        muteAudio: true,
        volume: 0,
        onProgress: (p) => setProgress(p.percent),
      });

      setResult(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Audio removal failed. Please try again.';
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
          <VolumeX className="w-3.5 h-3.5" />
          <span>Remove Audio from Video</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
          Mute for Adding Trending Sounds
        </h2>
        <p className="text-sm sm:text-base text-[#61758A] max-w-xl mx-auto">
          Strip background noise and unwanted sound from your video clips with a single click. Ready for TikTok, Reels, and Shorts.
        </p>
      </div>

      {!file ? (
        /* Upload Area */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-[#E9DCC8] hover:border-red-400 transition-all text-center">
          <input
            type="file"
            id="video-mute-upload"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="video-mute-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
              <VolumeX className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#102A43]">Click to select video</p>
              <p className="text-xs sm:text-sm text-[#61758A] mt-1">
                Supports MP4, WebM, MOV, and AVI up to 1GB
              </p>
            </div>
            <span className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-md transition-all">
              Choose Video to Mute
            </span>
          </label>
        </div>
      ) : (
        /* Studio Area */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Preview */}
          <div className="lg:col-span-2 bg-[#102A43] rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[420px]">
            <div className="relative w-full max-h-[480px] flex items-center justify-center overflow-hidden rounded-xl">
              <video
                ref={videoRef}
                src={videoSrc}
                muted={true}
                onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                onEnded={() => setIsPlaying(false)}
                className="max-h-[380px] max-w-full rounded-lg"
              />
            </div>

            {/* Play/Pause controls */}
            <div className="w-full flex items-center justify-between mt-4 px-2 text-white/80 text-xs">
              <button
                onClick={handlePlayPause}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'Pause' : 'Play (Muted)'}</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-500/30 text-red-300 font-bold text-[11px] flex items-center gap-1">
                  <VolumeX className="w-3 h-3" /> Muted Preview
                </span>
                <span>{formatTime(currentTime)} / {metadata?.formattedDuration}</span>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-[#102A43]">Mute Video Configuration</h3>
                <p className="text-xs text-[#61758A] mt-0.5">Completely strips audio stream from output</p>
              </div>

              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                  <Music className="w-4 h-4 text-red-500" />
                  <span>Why remove audio?</span>
                </div>
                <p className="text-[12px] text-red-600/90 leading-relaxed">
                  Removing native microphone hiss, wind noise, or copyrighted background music allows social algorithms to boost your video when you attach trending tracks on Instagram and TikTok.
                </p>
              </div>

              {metadata && (
                <div className="p-3.5 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8] text-xs space-y-2 text-[#102A43]">
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Original Size:</span>
                    <span className="font-bold">{metadata.formattedSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Resolution:</span>
                    <span className="font-bold">{metadata.width} × {metadata.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Duration:</span>
                    <span className="font-bold">{metadata.formattedDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Output Sound:</span>
                    <span className="font-bold text-red-600">Zero Audio Tracks (100% Silent)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-[#E9DCC8]">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {processing ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-[#102A43]">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-500" />
                      Muting video stream...
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleProcess}
                  className="w-full py-3.5 px-6 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>Remove Audio & Export</span>
                </button>
              )}

              {result && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Muted video ready! ({result.formattedSize})</span>
                  </div>
                  <a
                    href={result.url}
                    download={`muted-${file.name.replace(/\.[^/.]+$/, '')}.${result.extension}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all block text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Muted Video</span>
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
                Upload a different video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
