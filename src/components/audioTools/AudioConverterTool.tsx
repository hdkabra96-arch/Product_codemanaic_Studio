import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Music,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  FileAudio,
  Radio,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getAudioMetadata,
  convertAudioFile,
  AudioMetadata,
  ProcessedAudioResult,
  formatAudioBytes,
  formatAudioTime,
} from '../../services/audio/audioProcessingService';

interface AudioConverterToolProps {
  initialFormat?: 'mp3' | 'wav';
  mode?: 'general' | 'to-mp3' | 'video-to-audio';
}

export const AudioConverterTool: React.FC<AudioConverterToolProps> = ({
  initialFormat = 'mp3',
  mode = 'general',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);

  // Conversion parameters
  const [targetFormat, setTargetFormat] = useState<'mp3' | 'wav'>(initialFormat);
  const [bitrate, setBitrate] = useState<320 | 256 | 192 | 128 | 96>(192);
  const [volume, setVolume] = useState<number>(1.0);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ProcessedAudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Audio preview playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
            : 'Could not decode audio. Please upload an MP3, WAV, AAC, OGG, or video file.'
        );
      }
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setProcessing(true);
      setProgress(5);
      setError(null);
      setResult(null);

      const res = await convertAudioFile(file, {
        format: targetFormat,
        bitrate,
        volume,
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
      setError(err instanceof Error ? err.message : 'Error converting audio file.');
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_converted.${result.format}`;
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
            <Music className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            {mode === 'video-to-audio'
              ? 'Select video to extract audio'
              : 'Choose an audio file to convert'}
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Supports MP3, WAV, AAC, FLAC, OGG, M4A, MP4, WebM (up to 250MB)
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
                  <span>{formatAudioBytes(file.size)}</span>
                  <span>•</span>
                  <span>{metadata ? metadata.formattedDuration : 'Loading...'}</span>
                  <span>•</span>
                  <span>{metadata ? `${metadata.sampleRate} Hz` : ''}</span>
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

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Format Selection */}
            <div className="p-3.5 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
              <label className="text-xs font-bold text-[#102A43] block mb-1.5">
                Output Format
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['mp3', 'wav'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTargetFormat(fmt)}
                    className={`py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
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

            {/* Bitrate Selection (for MP3) */}
            <div className="p-3.5 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
              <label className="text-xs font-bold text-[#102A43] block mb-1.5 flex items-center justify-between">
                <span>Audio Bitrate</span>
                <span className="text-[10px] text-[#D98218] font-bold">
                  {targetFormat === 'wav' ? '1411 kbps (Lossless)' : `${bitrate} kbps`}
                </span>
              </label>
              {targetFormat === 'mp3' ? (
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(Number(e.target.value) as any)}
                  className="w-full p-1.5 text-xs font-semibold rounded-xl bg-white border border-[#E9DCC8] text-[#102A43] focus:outline-none focus:border-[#D98218]"
                >
                  <option value={320}>320 kbps (Studio Quality)</option>
                  <option value={256}>256 kbps (Premium High)</option>
                  <option value={192}>192 kbps (Standard High)</option>
                  <option value={128}>128 kbps (Balanced)</option>
                  <option value={96}>96 kbps (Compact)</option>
                </select>
              ) : (
                <div className="p-1.5 text-xs text-[#61758A] bg-white rounded-xl border border-[#E9DCC8]">
                  WAV uses uncompressed PCM
                </div>
              )}
            </div>

            {/* Volume Gain */}
            <div className="p-3.5 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
              <label className="text-xs font-bold text-[#102A43] block mb-1.5 flex items-center justify-between">
                <span>Volume Gain</span>
                <span className="text-[10px] text-[#D98218] font-bold">
                  {Math.round(volume * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-[#D98218] cursor-pointer"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action or Progress */}
          {processing ? (
            <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
                <span>Encoding Audio with LameJS Engine...</span>
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
                    <h4 className="text-sm font-bold text-emerald-900">
                      Audio Converted Successfully!
                    </h4>
                    <span className="text-xs text-emerald-700 block mt-0.5">
                      Format: {result.format.toUpperCase()} • Size: {result.formattedSize} • Length:{' '}
                      {formatAudioTime(result.duration)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {result.format.toUpperCase()}</span>
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setIsPlaying(false);
                    }}
                    className="p-2.5 rounded-full bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
                    title="Convert with different settings"
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
              onClick={handleConvert}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>Convert to {targetFormat.toUpperCase()}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
