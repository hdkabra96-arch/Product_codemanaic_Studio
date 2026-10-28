import React, { useState } from 'react';
import {
  Type,
  Copy,
  Check,
  Download,
  Trash2,
  ArrowUpDown,
  Sparkles,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TextFormatterTool: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    'Codemaniac studio is a powerful online tools platform for all digital creators, students and professionals.'
  );
  const [outputText, setOutputText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const applyFormat = (type: string) => {
    const text = inputText;
    let res = '';

    switch (type) {
      case 'uppercase':
        res = text.toUpperCase();
        break;
      case 'lowercase':
        res = text.toLowerCase();
        break;
      case 'titlecase':
        res = text.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );
        break;
      case 'sentencecase':
        res = text
          .toLowerCase()
          .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;
      case 'camelcase':
        res = text
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
          .replace(/^[A-Z]/, (c) => c.toLowerCase());
        break;
      case 'pascalcase':
        res = text
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
          .replace(/^[a-z]/, (c) => c.toUpperCase());
        break;
      case 'kebabcase':
        res = text
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        break;
      case 'snakecase':
        res = text
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        break;
      case 'slugify':
        res = text
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        break;
      case 'clean-spaces':
        res = text
          .split('\n')
          .map((line) => line.replace(/\s+/g, ' ').trim())
          .filter((line, idx, arr) => line !== '' || (idx > 0 && arr[idx - 1] !== ''))
          .join('\n');
        break;
      case 'sort-az':
        res = text
          .split('\n')
          .sort((a, b) => a.localeCompare(b))
          .join('\n');
        break;
      case 'sort-za':
        res = text
          .split('\n')
          .sort((a, b) => b.localeCompare(a))
          .join('\n');
        break;
      case 'dedupe-lines':
        res = Array.from(new Set(text.split('\n'))).join('\n');
        break;
      case 'line-numbers':
        res = text
          .split('\n')
          .map((line, i) => `${i + 1}. ${line}`)
          .join('\n');
        break;
      case 'reverse':
        res = text.split('').reverse().join('');
        break;
      default:
        res = text;
    }

    setOutputText(res);
  };

  const handleCopy = () => {
    const textToCopy = outputText || inputText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const textToSave = outputText || inputText;
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    try {
      confetti({ particleCount: 40, spread: 50 });
    } catch {
      // ignore
    }
  };

  const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const chars = inputText.length;
  const lines = inputText.split('\n').length;

  return (
    <div className="space-y-6">
      {/* Transformation Action Buttons */}
      <div>
        <label className="text-xs font-bold text-[#102A43] block mb-2 uppercase tracking-wide">
          Select Text Transformation
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
          {[
            { id: 'uppercase', label: 'UPPERCASE' },
            { id: 'lowercase', label: 'lowercase' },
            { id: 'titlecase', label: 'Title Case' },
            { id: 'sentencecase', label: 'Sentence case' },
            { id: 'camelcase', label: 'camelCase' },
            { id: 'pascalcase', label: 'PascalCase' },
            { id: 'kebabcase', label: 'kebab-case' },
            { id: 'snakecase', label: 'snake_case' },
            { id: 'slugify', label: 'Slugify URL' },
            { id: 'clean-spaces', label: 'Clean Extra Spaces' },
            { id: 'sort-az', label: 'Sort Lines A-Z' },
            { id: 'sort-za', label: 'Sort Lines Z-A' },
            { id: 'dedupe-lines', label: 'Remove Duplicates' },
            { id: 'line-numbers', label: 'Add Line Numbers' },
            { id: 'reverse', label: 'Reverse Text' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => applyFormat(btn.id)}
              className="px-2.5 py-2 rounded-xl bg-white border border-[#E9DCC8] hover:border-[#D98218] hover:bg-[#FFF3DF] text-[#102A43] hover:text-[#D98218] text-xs font-bold transition-all cursor-pointer truncate shadow-2xs"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs & Outputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
            <span>INPUT TEXT</span>
            <div className="flex items-center gap-2 text-[11px] text-[#61758A]">
              <span>{words} words</span>
              <span>•</span>
              <span>{chars} chars</span>
              <span>•</span>
              <span>{lines} lines</span>
            </div>
          </div>
          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="w-full p-3.5 rounded-2xl border border-[#E9DCC8] text-xs font-mono text-[#102A43] bg-white focus:outline-none focus:border-[#D98218] shadow-inner"
          />
        </div>

        {/* Output Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
            <span>TRANSFORMED RESULT</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs text-[#D98218] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="text-xs text-[#102A43] font-bold flex items-center gap-1 hover:text-[#D98218] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save .txt</span>
              </button>
            </div>
          </div>
          <textarea
            rows={8}
            readOnly
            value={outputText || inputText}
            placeholder="Result will appear here..."
            className="w-full p-3.5 rounded-2xl border border-[#E9DCC8] text-xs font-mono text-[#102A43] bg-[#FAF5EC]/70 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
