import React, { useState, useEffect } from 'react';
import {
  Upload,
  Music,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Volume2,
  FileAudio,
  Radio,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  extractAudioFromVideo,
  formatTime,
  formatBytes,
  VideoMetadata,
} from '../../services/video/videoProcessingService';

export const VideoToMp3Tool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Audio parameters
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');
  const [bitrate, setBitrate] = useState<320 | 192 | 128 | 96>(192);
  const [volume, setVolume] = useState<number>(1.0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [audioResult, setAudioResult] = useState<{
    blob: Blob;
    url: string;
    duration: number;
    format: 'mp3' | 'wav';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setAudioResult(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setStartTime(0);
        setEndTime(meta.duration);
      } catch (err) {
        setError('Could not open video file. Please upload an MP4, WebM, MOV, or AVI video.');
      }
    }
  };

  const handleExtract = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setAudioResult(null);

      const res = await extractAudioFromVideo(file, {
        format,
        bitrate,
        volume,
        startTime,
        endTime,
        onProgress: (p) => setProgress(p),
      });

      setAudioResult(res);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error extracting audio from video.');
    }
  };

  const handleDownload = () => {
    if (!audioResult || !file) return;
    const a = document.createElement('a');
    a.href = audioResult.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_audio.${audioResult.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (audioResult?.url) URL.revokeObjectURL(audioResult.url);
    };
  }, [audioResult]);

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
            <Music className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select video to extract audio
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Extract high-fidelity MP3 or WAV soundtracks from any video format
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
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-sm">{metadata?.name}</h4>
                <p className="text-xs text-[#61758A]">
                  Duration: {metadata?.formattedDuration} · Original Size: {metadata?.formattedSize}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setAudioResult(null);
              }}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Audio Options */}
          <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
            {/* Format Selector */}
            <div>
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider block mb-2">
                Output Audio Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormat('mp3')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    format === 'mp3'
                      ? 'border-[#D98218] bg-[#FAF5EC] ring-1 ring-[#D98218]'
                      : 'border-[#E9DCC8] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#102A43]">MP3 Audio (.mp3)</span>
                    <Radio className={`w-4 h-4 ${format === 'mp3' ? 'text-[#D98218]' : 'text-transparent'}`} />
                  </div>
                  <p className="text-[11px] text-[#61758A] mt-0.5">MPEG-1 Layer 3, compressed & universal</p>
                </button>

                <button
                  onClick={() => setFormat('wav')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    format === 'wav'
                      ? 'border-[#D98218] bg-[#FAF5EC] ring-1 ring-[#D98218]'
                      : 'border-[#E9DCC8] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#102A43]">WAV Audio (.wav)</span>
                    <Radio className={`w-4 h-4 ${format === 'wav' ? 'text-[#D98218]' : 'text-transparent'}`} />
                  </div>
                  <p className="text-[11px] text-[#61758A] mt-0.5">Uncompressed 16-bit PCM master quality</p>
                </button>
              </div>
            </div>

            {/* MP3 Bitrate Options */}
            {format === 'mp3' && (
              <div>
                <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider block mb-2">
                  MP3 Bitrate Quality
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 320, label: '320 kbps', sub: 'High Definition' },
                    { val: 192, label: '192 kbps', sub: 'Standard CD' },
                    { val: 128, label: '128 kbps', sub: 'Medium' },
                    { val: 96, label: '96 kbps', sub: 'Voice / Compact' },
                  ].map((b) => (
                    <button
                      key={b.val}
                      onClick={() => setBitrate(b.val as typeof bitrate)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        bitrate === b.val
                          ? 'border-[#D98218] bg-[#FAF5EC] text-[#D98218] font-bold'
                          : 'border-[#E9DCC8] bg-white text-[#102A43]'
                      }`}
                    >
                      <div className="text-xs font-bold">{b.label}</div>
                      <div className="text-[10px] text-[#61758A]">{b.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Volume Gain Slider */}
            <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] space-y-1">
              <div className="flex justify-between text-xs font-bold text-[#102A43]">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#D98218]" />
                  Volume Gain / Normalization
                </span>
                <span className="font-mono text-[#D98218]">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.5}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#D98218] cursor-pointer"
              />
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
                    Decoding audio stream & encoding to {format.toUpperCase()}...
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

            {audioResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Audio Extracted! ({formatBytes(audioResult.blob.size)})</span>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {audioResult.format.toUpperCase()}</span>
                  </button>
                </div>

                {/* Built-in Audio Player */}
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <audio src={audioResult.url} controls className="w-full" />
                </div>
              </div>
            )}

            {!audioResult && (
              <button
                onClick={handleExtract}
                disabled={processing}
                className="w-full py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Audio ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    <span>Extract & Save {format.toUpperCase()} Now</span>
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
