import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Key,
  Copy,
  Check,
  Download,
  RefreshCw,
  Upload,
  AlertCircle,
  FileText,
  Sliders,
  Send,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToolItem } from '../../types';
import {
  getSavedGeminiKey,
  saveGeminiKey,
  executeAiPrompt,
} from '../../services/ai/aiProcessingService';
import { pdfjsLib } from '../../services/pdf/pdfJsSetup';

interface AiToolRunnerProps {
  tool: ToolItem;
}

export const AiToolRunner: React.FC<AiToolRunnerProps> = ({ tool }) => {
  const [apiKey, setApiKey] = useState<string>(getSavedGeminiKey());
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>(getSavedGeminiKey());

  // Input states
  const [promptInput, setPromptInput] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedPdfText, setExtractedPdfText] = useState<string>('');
  const [extracting, setExtracting] = useState<boolean>(false);

  // Result states
  const [executing, setExecuting] = useState<boolean>(false);
  const [outputResult, setOutputResult] = useState<string>('');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set default contextual prompts based on tool
  useEffect(() => {
    setOutputResult('');
    setUploadedFile(null);
    setExtractedPdfText('');
    setError(null);

    switch (tool.id) {
      case 'ai-pdf-summarizer':
        setPromptInput('Provide an executive summary, key insights, and action items from this document.');
        break;
      case 'ai-pdf-question-generator':
        setPromptInput('Generate 5 multiple-choice questions with answer explanations and 3 review flashcards based on this material.');
        break;
      case 'ai-document-analyzer':
        setPromptInput('Identify key terms, risk factors, deadlines, and critical facts in this text.');
        break;
      case 'ai-content-generator':
        setPromptInput('Write a high-converting announcement blog post and 3 social media captions about our new digital studio launch.');
        break;
      case 'ai-video-caption-generator':
        setPromptInput('Generate engaging SRT video captions and timestamps for a 30-second product demo video.');
        break;
      case 'ai-image-generator':
        setPromptInput('A futuristic holographic workspace with glowing neon interfaces, cinematic lighting, 8k resolution, minimalist aesthetic.');
        break;
      case 'ai-image-editor':
        setPromptInput('Remove the background distraction and adjust lighting to warm golden hour studio tones.');
        break;
      case 'ai-image-enhancer':
        setPromptInput('Upscale resolution, remove compression artifacts, and enhance edge sharpness with cinematic balance.');
        break;
      case 'ai-background-remover':
        setPromptInput('Identify the foreground subject and isolate clean silhouette boundaries for transparent cutout.');
        break;
      case 'ai-text-extractor':
        setPromptInput('Extract all text and tabular data with structured markdown formatting.');
        break;
      default:
        setPromptInput('Analyze this content and generate structured results.');
    }
  }, [tool.id]);

  // Extract text if a PDF is dropped
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setError(null);

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
          setExtracting(true);
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = '';
          const maxPages = Math.min(pdf.numPages, 10); // read up to 10 pages for AI prompt

          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += `\n--- Page ${i} ---\n` + pageText;
          }

          setExtractedPdfText(fullText.trim());
          setExtracting(false);
        } catch (err: unknown) {
          setExtracting(false);
          setError('Failed to extract text from PDF.');
        }
      }
    }
  };

  const handleRunAi = async () => {
    try {
      setExecuting(true);
      setError(null);
      setOutputResult('');

      let fullPrompt = promptInput;
      if (extractedPdfText) {
        fullPrompt = `${promptInput}\n\n[DOCUMENT CONTENT EXCERPT]:\n${extractedPdfText.slice(0, 8000)}`;
      }

      const res = await executeAiPrompt(
        fullPrompt,
        `You are Codemaniac AI Assistant. Help the user with ${tool.name}. Provide well-structured, clear markdown output.`,
        apiKey
      );

      setOutputResult(res.text);
      setIsSimulated(res.isSimulated);
      setExecuting(false);

      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setExecuting(false);
      setError(err instanceof Error ? err.message : 'Error executing AI model.');
    }
  };

  const handleSaveKey = () => {
    saveGeminiKey(keyInput);
    setApiKey(keyInput);
    setShowKeyModal(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([outputResult], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}_result.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isDocumentTool =
    tool.id === 'ai-pdf-summarizer' ||
    tool.id === 'ai-pdf-question-generator' ||
    tool.id === 'ai-document-analyzer' ||
    tool.id === 'ai-text-extractor';

  return (
    <div className="space-y-6">
      {/* Top Banner: Key status & prompt instructions */}
      <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#E9DCC8] flex items-center justify-center text-[#D98218]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[#102A43] flex items-center gap-2">
              <span>Gemini 2.5 AI Model</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  apiKey
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {apiKey ? 'API Key Connected' : 'Free Demo / Smart Preview'}
              </span>
            </div>
            <span className="text-[11px] text-[#61758A]">
              {apiKey
                ? 'Using your custom Gemini key for full live cloud inference'
                : 'Using interactive preview. Add your free Gemini API key anytime for live generation.'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowKeyModal(true)}
          className="px-3.5 py-1.5 rounded-full bg-white border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] hover:text-[#D98218] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
        >
          <Key className="w-3.5 h-3.5" />
          <span>{apiKey ? 'Configure API Key' : 'Add Gemini Key'}</span>
        </button>
      </div>

      {/* File Upload Zone (For Document & Vision tools) */}
      {isDocumentTool && (
        <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs space-y-3">
          <label className="text-xs font-bold text-[#102A43] uppercase tracking-wide block">
            Optional: Attach Document or PDF for Analysis
          </label>
          <div className="flex items-center gap-3">
            <label className="px-4 py-2 bg-[#FAF5EC] border border-[#E9DCC8] hover:border-[#D98218] rounded-xl text-xs font-bold text-[#102A43] hover:text-[#D98218] cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#D98218]" />
              <span>{uploadedFile ? 'Change File' : 'Upload PDF / Text File'}</span>
              <input
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {uploadedFile && (
              <div className="text-xs font-semibold text-[#102A43] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D98218]" />
                <span className="truncate max-w-xs">{uploadedFile.name}</span>
                {extracting ? (
                  <span className="text-[#D98218]">(Extracting text...)</span>
                ) : extractedPdfText ? (
                  <span className="text-emerald-700 font-bold">(Text extracted ✓)</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prompt Input Box */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#102A43] uppercase tracking-wide flex items-center justify-between">
          <span>AI Instructions / Prompt</span>
          <span className="text-[11px] text-[#61758A] font-normal">
            Customizable for your exact task
          </span>
        </label>
        <textarea
          rows={4}
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Enter instructions for the AI..."
          className="w-full p-3.5 rounded-2xl border border-[#E9DCC8] text-xs text-[#102A43] bg-white focus:outline-none focus:border-[#D98218] shadow-inner font-sans"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Execution Progress / Action Button */}
      {executing ? (
        <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] space-y-2 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#D98218] border-t-transparent animate-spin mx-auto mb-2" />
          <span className="text-xs font-bold text-[#102A43] block">
            Synthesizing response with Gemini AI...
          </span>
          <span className="text-[11px] text-[#61758A]">
            Processing instructions & structuring markdown response
          </span>
        </div>
      ) : outputResult ? (
        <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E9DCC8] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D98218]" />
              <span className="text-xs font-bold text-[#102A43] uppercase">AI Response</span>
              {isSimulated && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Demo Preview
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs text-[#D98218] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadTxt}
                className="text-xs text-[#102A43] font-bold flex items-center gap-1 hover:text-[#D98218] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save .md</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#FAF5EC]/70 rounded-xl border border-[#E9DCC8] text-xs text-[#102A43] whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
            {outputResult}
          </div>

          <button
            onClick={handleRunAi}
            className="w-full py-2.5 rounded-full border border-[#E9DCC8] hover:border-[#D98218] text-xs font-bold text-[#102A43] hover:text-[#D98218] hover:bg-[#FFF3DF]/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-generate Result</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleRunAi}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Execute with {tool.name}</span>
        </button>
      )}

      {/* API Key Modal Dialog */}
      {showKeyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
                <Key className="w-4 h-4 text-[#D98218]" />
                <span>Google Gemini API Key</span>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-xs text-[#61758A] hover:text-[#102A43] font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#61758A] leading-relaxed">
              Your API key is stored securely in your browser's <code className="bg-[#FAF5EC] px-1 rounded">localStorage</code> and is only used directly to call the Gemini API.
            </p>

            <div>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-2.5 rounded-xl border border-[#E9DCC8] font-mono text-xs text-[#102A43] focus:outline-none focus:border-[#D98218]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setKeyInput('');
                  saveGeminiKey('');
                  setApiKey('');
                  setShowKeyModal(false);
                }}
                className="px-4 py-2 rounded-full border border-[#E9DCC8] text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
              >
                Clear Key
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-5 py-2 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
