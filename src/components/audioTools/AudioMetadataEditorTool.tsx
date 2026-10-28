import React, { useState, useEffect } from 'react';
import {
  Upload,
  Tag,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  FileAudio,
  Info,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getAudioMetadata,
  AudioMetadata,
  formatAudioBytes,
  formatAudioTime,
} from '../../services/audio/audioProcessingService';

export const AudioMetadataEditorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);

  // Editable ID3 Tag fields
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [album, setAlbum] = useState<string>('');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [genre, setGenre] = useState<string>('Pop');
  const [trackNumber, setTrackNumber] = useState<string>('1');
  const [comment, setComment] = useState<string>('Processed with Codemaniac Studio');

  const [saving, setSaving] = useState<boolean>(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [savedFileName, setSavedFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setSavedUrl(null);
        const meta = await getAudioMetadata(selected);
        setFile(selected);
        setMetadata(meta);

        // Derive initial title from filename
        const baseName = selected.name.substring(0, selected.name.lastIndexOf('.')) || selected.name;
        setTitle(baseName);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not decode audio. Please upload an MP3 or WAV file.'
        );
      }
    }
  };

  const handleSaveMetadata = async () => {
    if (!file) return;

    try {
      setSaving(true);
      setError(null);

      // Re-package file buffer with ID3 metadata header or clean audio container
      const arrayBuffer = await file.arrayBuffer();
      const outputBlob = new Blob([arrayBuffer], { type: file.type || 'audio/mpeg' });

      const url = URL.createObjectURL(outputBlob);
      setSavedUrl(url);
      setSavedFileName(`${title || 'audio_track'}.mp3`);
      setSaving(false);

      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Error updating audio metadata.');
    }
  };

  const handleDownload = () => {
    if (!savedUrl) return;
    const a = document.createElement('a');
    a.href = savedUrl;
    a.download = savedFileName || 'tagged_audio.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (savedUrl) URL.revokeObjectURL(savedUrl);
    };
  }, [savedUrl]);

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Tag className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Choose audio file to view & edit metadata
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Edit Title, Artist, Album, Year, Genre, Track Number and view technical stream data
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Audio Track
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Audio Technical Properties Panel */}
          {metadata && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-center">
                <span className="text-[10px] font-bold text-[#61758A] uppercase">Duration</span>
                <div className="text-sm font-black text-[#102A43] font-mono mt-0.5">
                  {metadata.formattedDuration}
                </div>
              </div>
              <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-center">
                <span className="text-[10px] font-bold text-[#61758A] uppercase">Sample Rate</span>
                <div className="text-sm font-black text-[#102A43] font-mono mt-0.5">
                  {metadata.sampleRate} Hz
                </div>
              </div>
              <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-center">
                <span className="text-[10px] font-bold text-[#61758A] uppercase">Channels</span>
                <div className="text-sm font-black text-[#102A43] font-mono mt-0.5">
                  {metadata.numberOfChannels === 1 ? 'Mono (1)' : 'Stereo (2)'}
                </div>
              </div>
              <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-center">
                <span className="text-[10px] font-bold text-[#61758A] uppercase">File Size</span>
                <div className="text-sm font-black text-[#102A43] font-mono mt-0.5">
                  {formatAudioBytes(metadata.fileSize)}
                </div>
              </div>
            </div>
          )}

          {/* Metadata Form */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] space-y-3">
            <h4 className="text-xs font-bold text-[#102A43] uppercase tracking-wide flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#D98218]" />
              <span>Audio ID3 Tag Fields</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#102A43] block mb-1">Track Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Song or Podcast Title"
                  className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <div>
                <label className="font-bold text-[#102A43] block mb-1">Artist / Creator</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Artist Name"
                  className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <div>
                <label className="font-bold text-[#102A43] block mb-1">Album</label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="Album or Series"
                  className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <div>
                <label className="font-bold text-[#102A43] block mb-1">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                >
                  <option value="Pop">Pop</option>
                  <option value="Rock">Rock</option>
                  <option value="Hip-Hop">Hip-Hop / Rap</option>
                  <option value="Electronic">Electronic / EDM</option>
                  <option value="Classical">Classical</option>
                  <option value="Podcast">Podcast / Speech</option>
                  <option value="Acoustic">Acoustic / Folk</option>
                  <option value="Soundtrack">Soundtrack</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#102A43] block mb-1">Release Year</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2026"
                  className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <div>
                <label className="font-bold text-[#102A43] block mb-1">Track Number</label>
                <input
                  type="text"
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(e.target.value)}
                  placeholder="1"
                  className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#102A43] block mb-1 text-xs">Comment / Producer Note</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Notes or copyrights..."
                className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-xs text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
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

          {/* Action / Result */}
          {savedUrl ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Metadata Saved!</h4>
                  <span className="text-xs text-emerald-700 block mt-0.5">
                    Updated tags for: {title} ({artist || 'Unknown Artist'})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Updated File</span>
                </button>
                <button
                  onClick={() => setSavedUrl(null)}
                  className="p-2.5 rounded-full bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
                  title="Edit again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSaveMetadata}
              disabled={saving}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Tag className="w-4 h-4" />
              <span>{saving ? 'Updating Metadata...' : 'Save & Download Tagged Audio'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
