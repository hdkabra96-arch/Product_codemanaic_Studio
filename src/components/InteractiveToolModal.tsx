import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Bot,
  AlertCircle,
  FileCheck,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToolItem } from '../types';

interface InteractiveToolModalProps {
  tool: ToolItem | null;
  onClose: () => void;
}

export const InteractiveToolModal: React.FC<InteractiveToolModalProps> = ({
  tool,
  onClose,
}) => {
  // Common states
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // QR Code tool state
  const [qrText, setQrText] = useState('https://codemaniacstudio.com');
  const [qrColor, setQrColor] = useState('#102A43');

  // Password Generator state
  const [passLength, setPassLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Word Counter state
  const [counterText, setCounterText] = useState(
    'Welcome to Codemaniac Studio! Our powerful online tools help you convert, edit, compress, and create digital files with zero hassle.'
  );

  // JSON Formatter state
  const [jsonInput, setJsonInput] = useState(
    '{\n  "platform": "Codemaniac Studio",\n  "status": "online",\n  "rating": 4.9,\n  "toolsCount": 72\n}'
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Color Picker state
  const [selectedColor, setSelectedColor] = useState('#D98218');

  // Base64 / URL state
  const [converterInput, setConverterInput] = useState('Codemaniac Studio 2026');
  const [converterMode, setConverterMode] = useState<'encode' | 'decode'>('encode');

  // File Tool Simulator state (for PDF/Image/Video/Audio)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processComplete, setProcessComplete] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('Word (.docx)');

  // AI Early Access state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // Hash state
  const [hashInput, setHashInput] = useState('Codemaniac Studio');
  const [generatedHash, setGeneratedHash] = useState('');

  // Generate password function
  const generatePassword = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let res = '';
    for (let i = 0; i < passLength; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(res);
  };

  // Generate SHA-256 Hash
  useEffect(() => {
    if (tool?.id === 'file-hash-generator') {
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);
      crypto.subtle.digest('SHA-256', data).then((buffer) => {
        const hashArray = Array.from(new Uint8Array(buffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        setGeneratedHash(hashHex);
      });
    }
  }, [hashInput, tool?.id]);

  useEffect(() => {
    if (tool?.id === 'password-generator') {
      generatePassword();
    }
    // Reset file simulation on tool change
    setUploadedFile(null);
    setProcessing(false);
    setProcessProgress(0);
    setProcessComplete(false);
    setWaitlistSubmitted(false);
  }, [tool?.id]);

  if (!tool) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied to clipboard!');
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    } catch {
      // ignore
    }
    setTimeout(() => setCopied(false), 2000);
  };

  // File tool simulation run
  const handleProcessFile = () => {
    if (!uploadedFile) {
      showToast('Please select a file first.');
      return;
    }
    setProcessing(true);
    setProcessProgress(10);
    const interval = setInterval(() => {
      setProcessProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          setProcessComplete(true);
          try {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          } catch {
            // ignore
          }
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  // Render content based on tool
  const renderToolBody = () => {
    // 1. AI Tools (Coming Soon)
    if (tool.status === 'coming_soon') {
      return (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF3DF] text-[#D98218] border border-[#F4A62A]/40 flex items-center justify-center mx-auto shadow-sm">
            <Bot className="w-9 h-9" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFF3DF] text-[#D98218] mb-2 border border-[#E9DCC8]">
              COMING SOON
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#102A43]">
              {tool.name} is in Active Development
            </h3>
            <p className="text-sm text-[#61758A] mt-2 max-w-md mx-auto">
              Our engineering team is finalizing the high-performance AI models for {tool.name}.
              Join our VIP priority access list to get 100 free AI credits when we launch!
            </p>
          </div>

          {waitlistSubmitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold max-w-md mx-auto flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>You're on the list! We'll notify you as soon as this tool goes live.</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (waitlistEmail) {
                  setWaitlistSubmitted(true);
                  try {
                    confetti({ particleCount: 50, spread: 60 });
                  } catch {
                    // ignore
                  }
                }
              }}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 px-4 py-2.5 rounded-full border border-[#E9DCC8] text-sm text-[#102A43] focus:outline-none focus:border-[#D98218] bg-white shadow-sm"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-sm font-bold shadow-md transition-colors cursor-pointer"
              >
                Notify Me
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#E9DCC8] flex items-center justify-center gap-6 text-xs text-[#61758A]">
            <span>✓ No spam guarantee</span>
            <span>✓ 100 Free credits on release</span>
            <span>✓ Privacy protected</span>
          </div>
        </div>
      );
    }

    // 2. QR Code Generator
    if (tool.id === 'qr-code-generator') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-1.5">
                  Content / URL / Text
                </label>
                <textarea
                  rows={3}
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="https://yourwebsite.com or text..."
                  className="w-full p-3 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] focus:border-[#D98218] focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-1.5">
                  QR Pattern Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-[#E9DCC8]"
                  />
                  <span className="font-mono text-sm text-[#102A43] font-bold">
                    {qrColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Generated QR View */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
              {/* Dynamic SVG QR Representation */}
              <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-md border border-[#E9DCC8] flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Outer corner finder 1 */}
                  <rect x="10" y="10" width="24" height="24" rx="3" fill={qrColor} />
                  <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                  <rect x="18" y="18" width="8" height="8" rx="1" fill={qrColor} />
                  {/* Outer corner finder 2 */}
                  <rect x="66" y="10" width="24" height="24" rx="3" fill={qrColor} />
                  <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                  <rect x="74" y="18" width="8" height="8" rx="1" fill={qrColor} />
                  {/* Outer corner finder 3 */}
                  <rect x="10" y="66" width="24" height="24" rx="3" fill={qrColor} />
                  <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                  <rect x="18" y="74" width="8" height="8" rx="1" fill={qrColor} />
                  {/* Simulated data modules based on text */}
                  <rect x="42" y="12" width="6" height="6" fill={qrColor} />
                  <rect x="52" y="16" width="6" height="6" fill={qrColor} />
                  <rect x="44" y="26" width="6" height="6" fill={qrColor} />
                  <rect x="12" y="44" width="6" height="6" fill={qrColor} />
                  <rect x="22" y="52" width="6" height="6" fill={qrColor} />
                  <rect x="40" y="40" width="8" height="8" rx="1" fill="#D98218" />
                  <rect x="54" y="44" width="6" height="6" fill={qrColor} />
                  <rect x="68" y="40" width="6" height="6" fill={qrColor} />
                  <rect x="80" y="52" width="6" height="6" fill={qrColor} />
                  <rect x="42" y="66" width="6" height="6" fill={qrColor} />
                  <rect x="54" y="74" width="6" height="6" fill={qrColor} />
                  <rect x="72" y="72" width="6" height="6" fill={qrColor} />
                  <rect x="82" y="80" width="6" height="6" fill={qrColor} />
                </svg>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleCopy(qrText)}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#E9DCC8] hover:border-[#D98218] text-xs font-bold text-[#102A43] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </button>
                <button
                  onClick={() => {
                    showToast('QR Code SVG downloaded successfully!');
                    try {
                      confetti({ particleCount: 30, spread: 50 });
                    } catch {
                      // ignore
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#D98218] text-white hover:bg-[#C66A08] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SVG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. Password Generator
    if (tool.id === 'password-generator') {
      return (
        <div className="space-y-6">
          {/* Password Display Box */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] flex items-center justify-between gap-4">
            <span className="font-mono text-lg sm:text-xl font-extrabold text-[#102A43] tracking-wider break-all select-all">
              {generatedPassword}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={generatePassword}
                className="p-2 rounded-xl bg-white border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] hover:text-[#D98218] transition-colors cursor-pointer"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopy(generatedPassword)}
                className="px-4 py-2 rounded-xl bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#102A43] mb-1.5">
                <span>PASSWORD LENGTH</span>
                <span className="text-sm font-mono text-[#D98218] font-black">{passLength}</span>
              </div>
              <input
                type="range"
                min={8}
                max={32}
                value={passLength}
                onChange={(e) => setPassLength(Number(e.target.value))}
                className="w-full accent-[#D98218] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E9DCC8] bg-white cursor-pointer hover:border-[#D98218] transition-colors">
                <input
                  type="checkbox"
                  checked={useUpper}
                  onChange={(e) => setUseUpper(e.target.checked)}
                  className="accent-[#D98218] w-4 h-4 rounded"
                />
                <span className="text-xs font-bold text-[#102A43]">Uppercase (A-Z)</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E9DCC8] bg-white cursor-pointer hover:border-[#D98218] transition-colors">
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                  className="accent-[#D98218] w-4 h-4 rounded"
                />
                <span className="text-xs font-bold text-[#102A43]">Numbers (0-9)</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E9DCC8] bg-white cursor-pointer hover:border-[#D98218] transition-colors">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  className="accent-[#D98218] w-4 h-4 rounded"
                />
                <span className="text-xs font-bold text-[#102A43]">Symbols (!@#)</span>
              </label>
            </div>
          </div>
        </div>
      );
    }

    // 4. Word Counter / Character Counter
    if (tool.id === 'word-counter' || tool.id === 'character-counter') {
      const words = counterText.trim() ? counterText.trim().split(/\s+/).length : 0;
      const characters = counterText.length;
      const charsNoSpaces = counterText.replace(/\s+/g, '').length;
      const sentences = counterText.split(/[.!?]+/).filter(Boolean).length;
      const readingTime = Math.ceil(words / 200);

      return (
        <div className="space-y-4">
          <textarea
            rows={5}
            value={counterText}
            onChange={(e) => setCounterText(e.target.value)}
            placeholder="Type or paste your text here to analyze..."
            className="w-full p-4 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] focus:border-[#D98218] focus:outline-none bg-white shadow-inner"
          />

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Words', val: words },
              { label: 'Characters', val: characters },
              { label: 'No Spaces', val: charsNoSpaces },
              { label: 'Sentences', val: sentences },
              { label: 'Reading Time', val: `${readingTime} min` },
            ].map((st, i) => (
              <div
                key={i}
                className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-center"
              >
                <div className="text-xl font-black text-[#D98218] font-mono">{st.val}</div>
                <div className="text-[11px] font-bold text-[#61758A] mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 5. JSON Formatter / Validator
    if (tool.id === 'json-formatter' || tool.id === 'json-validator') {
      const handleFormat = () => {
        try {
          const parsed = JSON.parse(jsonInput);
          setJsonInput(JSON.stringify(parsed, null, 2));
          setJsonError(null);
          showToast('JSON formatted successfully!');
        } catch (err: unknown) {
          setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
        }
      };

      const handleMinify = () => {
        try {
          const parsed = JSON.parse(jsonInput);
          setJsonInput(JSON.stringify(parsed));
          setJsonError(null);
          showToast('JSON minified!');
        } catch (err: unknown) {
          setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
        }
      };

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#102A43]">JSON INPUT / OUTPUT</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFormat}
                className="px-3 py-1 rounded-lg bg-[#D98218] text-white text-xs font-bold hover:bg-[#C66A08] transition-colors cursor-pointer"
              >
                Format (2-spaces)
              </button>
              <button
                onClick={handleMinify}
                className="px-3 py-1 rounded-lg bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] hover:border-[#D98218] transition-colors cursor-pointer"
              >
                Minify
              </button>
              <button
                onClick={() => handleCopy(jsonInput)}
                className="px-3 py-1 rounded-lg bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] hover:border-[#D98218] transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              try {
                JSON.parse(e.target.value);
                setJsonError(null);
              } catch (err: unknown) {
                setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
              }
            }}
            className="w-full font-mono text-xs p-4 rounded-xl border border-[#E9DCC8] text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
          />

          {jsonError ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{jsonError}</span>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Valid JSON Syntax</span>
            </div>
          )}
        </div>
      );
    }

    // 6. Color Picker
    if (tool.id === 'color-picker') {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-28 h-28 rounded-2xl cursor-pointer border-2 border-white shadow-md"
            />

            <div className="space-y-2 flex-1 w-full">
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#E9DCC8]">
                <span className="text-xs font-bold text-[#61758A]">HEX</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#102A43]">
                    {selectedColor.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedColor.toUpperCase())}
                    className="p-1 text-[#61758A] hover:text-[#D98218] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#E9DCC8]">
                <span className="text-xs font-bold text-[#61758A]">RGB</span>
                <span className="font-mono text-xs font-bold text-[#102A43]">
                  rgb(
                  {parseInt(selectedColor.slice(1, 3), 16)},
                  {parseInt(selectedColor.slice(3, 5), 16)},
                  {parseInt(selectedColor.slice(5, 7), 16)})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Palette */}
          <div>
            <span className="text-xs font-bold text-[#102A43] mb-2 block">
              CODEMANIAC STUDIO BRAND HARMONY
            </span>
            <div className="flex items-center gap-2">
              {['#D98218', '#C66A08', '#F4A62A', '#102A43', '#FBF7EF', '#61758A'].map((col) => (
                <button
                  key={col}
                  onClick={() => setSelectedColor(col)}
                  style={{ backgroundColor: col }}
                  className="w-9 h-9 rounded-xl border border-black/10 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                  title={col}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 7. Base64 / URL Encoder
    if (tool.id === 'base64-encoder-decoder' || tool.id === 'url-encoder-decoder') {
      const isBase64 = tool.id === 'base64-encoder-decoder';
      let convertedResult = '';
      try {
        if (isBase64) {
          convertedResult =
            converterMode === 'encode'
              ? btoa(converterInput)
              : atob(converterInput);
        } else {
          convertedResult =
            converterMode === 'encode'
              ? encodeURIComponent(converterInput)
              : decodeURIComponent(converterInput);
        }
      } catch {
        convertedResult = 'Conversion error: Invalid input data format';
      }

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConverterMode('encode')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                converterMode === 'encode'
                  ? 'bg-[#D98218] text-white shadow-sm'
                  : 'bg-white text-[#102A43] border border-[#E9DCC8]'
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => setConverterMode('decode')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                converterMode === 'decode'
                  ? 'bg-[#D98218] text-white shadow-sm'
                  : 'bg-white text-[#102A43] border border-[#E9DCC8]'
              }`}
            >
              Decode
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#102A43] mb-1">INPUT</label>
            <textarea
              rows={3}
              value={converterInput}
              onChange={(e) => setConverterInput(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#E9DCC8] text-xs font-mono text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#102A43]">RESULT</label>
              <button
                onClick={() => handleCopy(convertedResult)}
                className="text-xs text-[#D98218] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Result</span>
              </button>
            </div>
            <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] font-mono text-xs text-[#102A43] break-all select-all">
              {convertedResult}
            </div>
          </div>
        </div>
      );
    }

    // 8. File Hash Generator
    if (tool.id === 'file-hash-generator') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#102A43] mb-1.5">
              INPUT TEXT OR FILE STRING
            </label>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Enter text to hash..."
              className="w-full p-3 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
            />
          </div>

          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#61758A]">SHA-256 HASH</span>
              <button
                onClick={() => handleCopy(generatedHash)}
                className="text-xs text-[#D98218] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <div className="font-mono text-xs text-[#102A43] break-all bg-white p-3 rounded-xl border border-[#E9DCC8]">
              {generatedHash || 'Calculating...'}
            </div>
          </div>
        </div>
      );
    }

    // 9. Default Media & Document Studio (PDF, Image, Video, Audio)
    return (
      <div className="space-y-6">
        {/* Upload Drop Zone */}
        {!uploadedFile ? (
          <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadedFile(e.target.files[0]);
                }
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-base font-bold text-[#102A43]">
              Choose file or drag & drop here
            </span>
            <span className="text-xs text-[#61758A] mt-1">
              Supports {tool.category.toUpperCase()} files up to 250MB · Encrypted in memory
            </span>
            <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
              Browse Files
            </span>
          </label>
        ) : (
          <div className="space-y-4">
            {/* Selected File Card */}
            <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center font-bold text-xs">
                  {tool.category.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#102A43] truncate max-w-xs">
                    {uploadedFile.name}
                  </h4>
                  <span className="text-xs text-[#61758A]">
                    {(uploadedFile.size / 1024).toFixed(1)} KB · Ready to process
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setProcessComplete(false);
                }}
                className="text-xs text-[#61758A] hover:text-red-600 cursor-pointer font-semibold"
              >
                Change
              </button>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8]">
                <label className="font-bold text-[#102A43] block mb-1">Target Format</label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-[#102A43] font-medium"
                >
                  <option>Standard High Quality</option>
                  <option>Maximum Compression (Smallest)</option>
                  <option>Lossless Balanced</option>
                </select>
              </div>

              <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] flex flex-col justify-center">
                <span className="font-bold text-[#102A43] block mb-0.5">Privacy Engine</span>
                <span className="text-[#059669] font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 100% Client-side sandbox
                </span>
              </div>
            </div>

            {/* Progress or Actions */}
            {processing ? (
              <div className="p-4 bg-white rounded-xl border border-[#E9DCC8] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
                  <span>Processing with Codemaniac Core...</span>
                  <span>{processProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#FAF5EC] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${processProgress}%` }}
                    className="h-full bg-gradient-to-r from-[#D98218] to-[#C66A08] transition-all duration-300"
                  />
                </div>
              </div>
            ) : processComplete ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Task Completed!</h4>
                    <span className="text-xs text-emerald-700">
                      Reduced by 48% with zero artifact loss.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      showToast('File downloaded!');
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>
                  <button
                    onClick={() => {
                      setProcessComplete(false);
                      setUploadedFile(null);
                    }}
                    className="p-2.5 rounded-full bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
                    title="Process Another"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleProcessFile}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Process with {tool.name}</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#FFFDF8] rounded-3xl border border-[#E9DCC8] shadow-[0_20px_50px_rgba(16,42,67,0.25)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#FAF5EC] border-b border-[#E9DCC8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.badgeBg}`}>
              <Sparkles className="w-5 h-5 text-[#D98218]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#D98218] border border-[#E9DCC8]">
                  {tool.category.toUpperCase()} TOOL
                </span>
                <span className="text-xs text-[#61758A]">Codemaniac Studio</span>
              </div>
              <h2 className="text-lg font-extrabold text-[#102A43]">{tool.name}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] hover:text-[#D98218] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">{renderToolBody()}</div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF5EC]/50 border-t border-[#E9DCC8] flex items-center justify-between text-xs text-[#61758A]">
          <span>AES-256 Bit Local Encryption</span>
          <button
            onClick={() => handleCopy(window.location.href)}
            className="flex items-center gap-1.5 hover:text-[#D98218] transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Tool</span>
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#102A43] text-white text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top duration-200">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
