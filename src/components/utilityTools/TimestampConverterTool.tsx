import React, { useState, useEffect } from 'react';
import {
  Clock,
  Copy,
  Check,
  Play,
  Pause,
  RefreshCw,
  Calendar,
  Globe,
} from 'lucide-react';

export const TimestampConverterTool: React.FC = () => {
  const [currentEpoch, setCurrentEpoch] = useState<number>(Math.floor(Date.now() / 1000));
  const [isTicking, setIsTicking] = useState<boolean>(true);

  // Conversion 1: Timestamp to Date
  const [inputEpoch, setInputEpoch] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [epochType, setEpochType] = useState<'seconds' | 'milliseconds'>('seconds');

  // Conversion 2: Date to Timestamp
  const now = new Date();
  const [inputDateTime, setInputDateTime] = useState<string>(
    new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19)
  );

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live ticker
  useEffect(() => {
    if (!isTicking) return;
    const interval = setInterval(() => {
      setCurrentEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTicking]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Parsed Date from Epoch
  const parsedTimestampMs =
    epochType === 'seconds'
      ? parseFloat(inputEpoch) * 1000
      : parseFloat(inputEpoch);

  const isValidTimestamp = !isNaN(parsedTimestampMs) && parsedTimestampMs > -62135596800000;
  const parsedDate = isValidTimestamp ? new Date(parsedTimestampMs) : null;

  // Parsed Epoch from Date Input
  const targetDateObj = new Date(inputDateTime);
  const isValidDateObj = !isNaN(targetDateObj.getTime());
  const convertedSeconds = isValidDateObj ? Math.floor(targetDateObj.getTime() / 1000) : 0;
  const convertedMs = isValidDateObj ? targetDateObj.getTime() : 0;

  // Relative time helper
  const getRelativeTime = (d: Date): string => {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (Math.abs(diff) < 5) return 'Just now';
    if (diff > 0) {
      if (diff < 60) return `${diff} seconds ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      return `${Math.floor(diff / 86400)} days ago`;
    } else {
      const future = Math.abs(diff);
      if (future < 60) return `in ${future} seconds`;
      if (future < 3600) return `in ${Math.floor(future / 60)} minutes`;
      if (future < 86400) return `in ${Math.floor(future / 3600)} hours`;
      return `in ${Math.floor(future / 86400)} days`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Current Epoch Banner */}
      <div className="p-4 bg-gradient-to-r from-[#FFF3DF] to-[#FAF5EC] rounded-2xl border border-[#E9DCC8] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E9DCC8] flex items-center justify-center text-[#D98218] shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#61758A] uppercase tracking-wider block">
              CURRENT UNIX TIMESTAMP
            </span>
            <span className="text-xl font-black text-[#102A43] font-mono tracking-tight">
              {currentEpoch}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTicking(!isTicking)}
            className="px-3 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] hover:text-[#D98218] flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isTicking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isTicking ? 'Pause' : 'Resume'}</span>
          </button>
          <button
            onClick={() => handleCopy(currentEpoch.toString(), 'current')}
            className="px-3 py-1.5 rounded-full bg-[#D98218] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 hover:bg-[#C66A08] cursor-pointer"
          >
            {copiedKey === 'current' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy</span>
          </button>
        </div>
      </div>

      {/* Two Columns: Epoch to Date & Date to Epoch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Timestamp -> Date */}
        <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
              Unix Epoch to Human Date
            </h4>
            <div className="flex items-center gap-1 bg-[#FAF5EC] p-0.5 rounded-lg border border-[#E9DCC8]">
              <button
                onClick={() => setEpochType('seconds')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  epochType === 'seconds' ? 'bg-[#D98218] text-white shadow-xs' : 'text-[#61758A]'
                }`}
              >
                Seconds
              </button>
              <button
                onClick={() => setEpochType('milliseconds')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  epochType === 'milliseconds' ? 'bg-[#D98218] text-white shadow-xs' : 'text-[#61758A]'
                }`}
              >
                Milliseconds
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputEpoch}
              onChange={(e) => setInputEpoch(e.target.value)}
              placeholder="Enter epoch timestamp..."
              className="flex-1 p-2.5 rounded-xl border border-[#E9DCC8] font-mono text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
            />
            <button
              onClick={() => setInputEpoch(Math.floor(Date.now() / 1000).toString())}
              className="px-3 py-2.5 rounded-xl bg-[#FAF5EC] border border-[#E9DCC8] text-xs font-bold text-[#D98218] hover:bg-[#FFF3DF] cursor-pointer"
            >
              Now
            </button>
          </div>

          {parsedDate ? (
            <div className="space-y-2 pt-2 border-t border-[#E9DCC8]">
              {[
                { label: 'GMT / UTC', val: parsedDate.toUTCString(), key: 'utc' },
                { label: 'Local Timezone', val: parsedDate.toString(), key: 'local' },
                { label: 'ISO 8601', val: parsedDate.toISOString(), key: 'iso' },
                { label: 'Relative Time', val: getRelativeTime(parsedDate), key: 'rel' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-2.5 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="text-[10px] font-bold text-[#61758A] block uppercase">
                      {item.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#102A43] truncate block">
                      {item.val}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.val, item.key)}
                    className="p-1.5 text-[#61758A] hover:text-[#D98218] cursor-pointer shrink-0"
                  >
                    {copiedKey === item.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">
              Invalid timestamp format.
            </div>
          )}
        </div>

        {/* Section 2: Date -> Timestamp */}
        <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
            Human Date to Unix Epoch
          </h4>

          <div>
            <label className="text-[11px] font-bold text-[#61758A] block mb-1">
              Select Date & Time (Local)
            </label>
            <input
              type="datetime-local"
              step="1"
              value={inputDateTime}
              onChange={(e) => setInputDateTime(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E9DCC8] font-mono text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-[#E9DCC8]">
            <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#61758A] uppercase block">
                  Epoch in Seconds
                </span>
                <span className="font-mono text-base font-black text-[#D98218]">
                  {convertedSeconds}
                </span>
              </div>
              <button
                onClick={() => handleCopy(convertedSeconds.toString(), 'sec')}
                className="px-3 py-1.5 bg-white border border-[#E9DCC8] rounded-lg text-xs font-bold text-[#102A43] hover:text-[#D98218] flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'sec' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy</span>
              </button>
            </div>

            <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#61758A] uppercase block">
                  Epoch in Milliseconds
                </span>
                <span className="font-mono text-base font-black text-[#102A43]">
                  {convertedMs}
                </span>
              </div>
              <button
                onClick={() => handleCopy(convertedMs.toString(), 'ms')}
                className="px-3 py-1.5 bg-white border border-[#E9DCC8] rounded-lg text-xs font-bold text-[#102A43] hover:text-[#D98218] flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'ms' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
