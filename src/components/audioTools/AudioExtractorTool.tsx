import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Film,
  Music,
  FileAudio,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  extractAudioFromVideoFile,
  ProcessedAudioResult,
  formatAudioBytes,
} from '../../services/audio/audioProcessingService';
import {
  getVideoMetadata,
  VideoMetadata,
} from '../../services/video/videoProcessingService';

export const AudioExtractorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [targetFormat, setTargetFormat] = useState<'mp3' | 'wav'>('mp3');
  const [bitrate, setBitrate] = useState<320 | 256 | 192 | 128>(192);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ProcessedAudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setResult(null);
        setIsPlaying(false);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setVideoSrc(URL.createObjectURL(selected));
      } catch {
        setError('Could not read video. Please upload a valid MP4, WebM, MOV, or AVI video.');
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
    if (!file) return;

    try {
      setProcessing(true);
      setProgress(10);
      setError(null);
      setResult(null);

      const res = await extractAudioFromVideoFile(file, {
        format: targetFormat,
        bitrate,
        onProgress: (p) => setProgress(p),
      });

      setResult(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Audio extraction failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
          <Music className="w-3.5 h-3.5" />
          <span>Extract Audio</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
          Extract Audio from Video Files
        </h2>
        <p className="text-sm sm:text-base text-[#61758A] max-w-xl mx-auto">
          Convert video clips, movies, and recordings into standalone high-quality MP3 or WAV soundtracks with zero quality loss.
        </p>
      </div>

      {!file ? (
        /* Upload Area */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-[#E9DCC8] hover:border-blue-400 transition-all text-center">
          <input
            type="file"
            id="audio-extract-upload"
            accept="video/*,audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="audio-extract-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
              <Film className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#102A43]">Click to select video</p>
              <p className="text-xs sm:text-sm text-[#61758A] mt-1">
                Supports MP4, WebM, MOV, and AVI up to 1GB
              </p>
            </div>
            <span className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow-md transition-all">
              Choose Video File
            </span>
          </label>
        </div>
      ) : (
        /* Studio Area */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9DCC8] shadow-sm space-y-6">
          {/* Video Preview */}
          <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-[#102A43] text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {metadata?.name}
                </p>
                <p className="text-xs text-[#61758A]">
                  {metadata?.formattedDuration} • {metadata?.formattedSize} • {metadata?.width} × {metadata?.height}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <video
                ref={videoRef}
                src={videoSrc}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <button
                onClick={handlePlayPause}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play Video'}</span>
              </button>
            </div>
          </div>

          {/* Format Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#102A43] block">Output Audio Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTargetFormat('mp3')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    targetFormat === 'mp3'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-[#FAF5EC] border-[#E9DCC8] text-[#102A43] hover:border-blue-400'
                  }`}
                >
                  MP3 (Universal)
                </button>
                <button
                  onClick={() => setTargetFormat('wav')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    targetFormat === 'wav'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-[#FAF5EC] border-[#E9DCC8] text-[#102A43] hover:border-blue-400'
                  }`}
                >
                  WAV (Lossless)
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
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Extracting audio tracks...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleProcess}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Music className="w-4 h-4" />
                <span>Extract Audio from Video</span>
              </button>
            )}

            {result && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Audio Extracted Successfully! ({result.formattedSize})</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold uppercase">{result.format}</span>
                </div>

                <audio controls src={result.url} className="w-full rounded-lg" />

                <a
                  href={result.url}
                  download={`extracted-audio-${file.name.replace(/\.[^/.]+$/, '')}.${result.format}`}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all block text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Extracted Audio ({result.format.toUpperCase()})</span>
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
      )}
    </div>
  );
};
