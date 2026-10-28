import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Subtitles,
  Plus,
  Trash2,
  Download,
  FileText,
  Check,
  AlertCircle,
  RefreshCw,
  FileVideo,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  formatTime,
  parseSubtitleText,
  generateSrtContent,
  generateVttContent,
  VideoMetadata,
  SubtitleCue,
  RenderedVideoResult,
} from '../../services/video/videoProcessingService';

export const VideoSubtitlesTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Subtitle cues list
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [fontSize, setFontSize] = useState<number>(24);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [bgColor, setBgColor] = useState<string>('rgba(0, 0, 0, 0.75)');
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [renderedResult, setRenderedResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setRenderedResult(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setVideoSrc(URL.createObjectURL(selected));

        // Generate smart starter cues based on video duration
        const dur = meta.duration;
        const initialCues: SubtitleCue[] = [
          {
            id: 'cue-1',
            startTime: 0.5,
            endTime: Math.min(3.5, dur),
            text: 'Welcome to Codemaniac Studio',
          },
          {
            id: 'cue-2',
            startTime: Math.min(4.0, dur),
            endTime: Math.min(7.5, dur),
            text: 'Powerful media tools right in your browser',
          },
        ];
        setCues(initialCues);
      } catch (err) {
        setError('Unsupported video format.');
      }
    }
  };

  const handleImportSrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const srtFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = String(event.target?.result || '');
          const parsed = parseSubtitleText(content);
          if (parsed.length > 0) {
            setCues(parsed);
          } else {
            setError('Could not parse subtitles from file. Please ensure standard SRT or VTT formatting.');
          }
        } catch {
          setError('Error reading subtitle file.');
        }
      };
      reader.readAsText(srtFile);
    }
  };

  const handleAddCue = () => {
    const lastCue = cues[cues.length - 1];
    const newStart = lastCue ? Math.min((metadata?.duration || 100) - 1, lastCue.endTime + 0.5) : currentTime;
    const newEnd = Math.min(metadata?.duration || 100, newStart + 3.0);

    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startTime: Math.round(newStart * 10) / 10,
      endTime: Math.round(newEnd * 10) / 10,
      text: 'New subtitle line',
    };
    setCues([...cues, newCue]);
  };

  const handleUpdateCue = (id: string, updates: Partial<SubtitleCue>) => {
    setCues(cues.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleRemoveCue = (id: string) => {
    setCues(cues.filter((c) => c.id !== id));
  };

  const handleDownloadSrt = () => {
    const srtText = generateSrtContent(cues);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${file?.name.split('.')[0] || 'subtitles'}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBurnSubtitles = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setRenderedResult(null);

      const result = await renderProcessedVideo({
        file,
        subtitles: {
          cues,
          fontSize,
          textColor,
          bgColor,
          position,
        },
        targetWidth: metadata.width,
        targetHeight: metadata.height,
        fps: 30,
        onProgress: (p) => setProgress(p.percent),
      });

      setRenderedResult(result);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error rendering subtitles into video.');
    }
  };

  const handleDownloadVideo = () => {
    if (!renderedResult || !file) return;
    const a = document.createElement('a');
    a.href = renderedResult.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_subtitled.${renderedResult.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeCue = cues.find((c) => currentTime >= c.startTime && currentTime <= c.endTime);

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (renderedResult?.url) URL.revokeObjectURL(renderedResult.url);
    };
  }, [videoSrc, renderedResult]);

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
            <Subtitles className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select video to add subtitles
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Create, sync, import/export SRT files, and burn subtitles directly into the video
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
                  Duration: {metadata?.formattedDuration} · {cues.length} Subtitle Cues
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-xl border border-[#E9DCC8] hover:border-[#D98218] bg-white text-xs font-bold text-[#102A43] flex items-center gap-1.5 cursor-pointer shadow-xs">
                <Upload className="w-3.5 h-3.5 text-[#D98218]" />
                <span>Import SRT / VTT</span>
                <input
                  type="file"
                  accept=".srt,.vtt,text/plain"
                  className="hidden"
                  onChange={handleImportSrt}
                />
              </label>

              <button
                onClick={handleDownloadSrt}
                className="px-3 py-1.5 rounded-xl border border-[#E9DCC8] hover:border-[#D98218] bg-white text-xs font-bold text-[#102A43] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#D98218]" />
                <span>Export .SRT</span>
              </button>
            </div>
          </div>

          {/* Video Preview with Real-time Subtitle Overlay */}
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

            {/* Live Subtitle Overlay */}
            {activeCue && (
              <div
                className={`absolute left-0 right-0 px-8 text-center pointer-events-none ${
                  position === 'top' ? 'top-6' : 'bottom-6'
                }`}
              >
                <span
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    fontSize: `${Math.max(14, fontSize * 0.7)}px`,
                  }}
                  className="inline-block px-3.5 py-1.5 rounded-lg font-bold shadow-md backdrop-blur-xs font-sans max-w-lg leading-relaxed whitespace-pre-wrap"
                >
                  {activeCue.text}
                </span>
              </div>
            )}
          </div>

          {/* Timeline Scrubber */}
          <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] flex items-center gap-3">
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
              className="p-2 rounded-lg bg-[#D98218] text-white hover:bg-[#C66A08] cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={metadata?.duration || 100}
                step={0.1}
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
              {formatTime(currentTime)} / {formatTime(metadata?.duration || 0)}
            </span>
          </div>

          {/* Subtitles Cue List */}
          <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
                Subtitle Timeline Cues ({cues.length})
              </h5>
              <button
                onClick={handleAddCue}
                className="px-3 py-1.5 rounded-xl bg-[#FAF5EC] hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Cue</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {cues.map((cue, index) => {
                const isActive = currentTime >= cue.startTime && currentTime <= cue.endTime;
                return (
                  <div
                    key={cue.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'border-[#D98218] bg-[#FFF3DF]/40 ring-1 ring-[#D98218]'
                        : 'border-[#E9DCC8] bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5EC] text-[#D98218] border border-[#E9DCC8]">
                          #{index + 1}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#102A43]">
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={cue.startTime}
                            onChange={(e) => handleUpdateCue(cue.id, { startTime: Number(e.target.value) })}
                            className="w-16 p-1 bg-[#FAF5EC] border border-[#E9DCC8] rounded text-center text-xs"
                          />
                          <span>s →</span>
                          <input
                            type="number"
                            min={cue.startTime}
                            step={0.1}
                            value={cue.endTime}
                            onChange={(e) => handleUpdateCue(cue.id, { endTime: Number(e.target.value) })}
                            className="w-16 p-1 bg-[#FAF5EC] border border-[#E9DCC8] rounded text-center text-xs"
                          />
                          <span>s</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (videoRef.current) videoRef.current.currentTime = cue.startTime;
                            setCurrentTime(cue.startTime);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-[#61758A] hover:text-[#D98218] cursor-pointer"
                        >
                          Jump To
                        </button>
                        <button
                          onClick={() => handleRemoveCue(cue.id)}
                          className="p-1 text-[#61758A] hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={cue.text}
                      onChange={(e) => handleUpdateCue(cue.id, { text: e.target.value })}
                      placeholder="Enter subtitle line..."
                      className="w-full p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-lg text-xs text-[#102A43] font-medium focus:outline-none focus:border-[#D98218]"
                    />
                  </div>
                );
              })}
            </div>

            {/* Styling Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E9DCC8]">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as 'bottom' | 'top')}
                  className="w-full p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43]"
                >
                  <option value="bottom">Bottom of Frame</option>
                  <option value="top">Top of Frame</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Font Size ({fontSize}px)</label>
                <input
                  type="range"
                  min={16}
                  max={48}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#D98218]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[#E9DCC8] cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold text-[#102A43]">{textColor}</span>
                </div>
              </div>
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
                    Burning hardcoded subtitles into video stream...
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

            {renderedResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">Subtitles Burned In Successfully!</h5>
                    <p className="text-[11px] text-emerald-700">
                      Output Size: {renderedResult.formattedSize} · Open in any video player
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadVideo}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video</span>
                </button>
              </div>
            )}

            {!renderedResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadSrt}
                  className="py-3 bg-white hover:bg-[#FAF5EC] border border-[#E9DCC8] text-[#102A43] rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 text-[#D98218]" />
                  <span>Save .SRT Subtitle File</span>
                </button>

                <button
                  onClick={handleBurnSubtitles}
                  disabled={processing || cues.length === 0}
                  className="py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Burning Subtitles ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Subtitles className="w-4 h-4" />
                      <span>Burn Subtitles Onto Video</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
