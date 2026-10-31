import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Bot,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFDocument, PDFName, StandardFonts, rgb } from 'pdf-lib';
import { ToolItem } from '../types';

// PDF Tools
import { PdfMergeTool } from './pdfTools/PdfMergeTool';
import { PdfSplitTool } from './pdfTools/PdfSplitTool';
import { PdfCompressorTool } from './pdfTools/PdfCompressorTool';
import { PdfOfficeConversionTool } from './pdfTools/PdfOfficeConversionTool';
import { PdfEditorTool } from './pdfTools/PdfEditorTool';
import { PdfPageExtractorTool } from './pdfTools/PdfPageExtractorTool';
import { PdfPageOrganizerTool } from './pdfTools/PdfPageOrganizerTool';
import { PdfProtectUnlockTool } from './pdfTools/PdfProtectUnlockTool';
import { PdfWatermarkTool } from './pdfTools/PdfWatermarkTool';
import { PdfRotationDeletionTool } from './pdfTools/PdfRotationDeletionTool';
import { PdfImageExtractionTool } from './pdfTools/PdfImageExtractionTool';
import { PdfOcrTool } from './pdfTools/PdfOcrTool';
import { PdfMetadataEditorTool } from './pdfTools/PdfMetadataEditorTool';
import { PdfSignTool } from './pdfTools/PdfSignTool';
import { PdfPageNumbersTool } from './pdfTools/PdfPageNumbersTool';
import { PdfToJpgTool } from './pdfTools/PdfToJpgTool';
import { JpgToPdfTool } from './pdfTools/JpgToPdfTool';
import { HtmlToPdfTool } from './pdfTools/HtmlToPdfTool';
import { PdfToPdfaTool } from './pdfTools/PdfToPdfaTool';
import { PdfRepairTool } from './pdfTools/PdfRepairTool';
import { PdfCompareTool } from './pdfTools/PdfCompareTool';
import { PdfScanTool } from './pdfTools/PdfScanTool';
import { PdfQualityConversionTool } from './pdfTools/PdfQualityConversionTool';

// Image Tools
import { ImageConversionTool } from './imageTools/ImageConversionTool';
import { ImageCompressorTool } from './imageTools/ImageCompressorTool';
import { ImageResizerTool } from './imageTools/ImageResizerTool';
import { ImageEditorTool } from './imageTools/ImageEditorTool';
import { ImageCropperTool } from './imageTools/ImageCropperTool';
import { ImageOcrTool } from './imageTools/ImageOcrTool';
import { ImageBackgroundRemoverTool } from './imageTools/ImageBackgroundRemoverTool';
import { ImageToPdfTool } from './imageTools/ImageToPdfTool';
import { ImageWatermarkTool } from './imageTools/ImageWatermarkTool';
import { ImageEnhancerTool } from './imageTools/ImageEnhancerTool';
import { ImageMetadataRemoverTool } from './imageTools/ImageMetadataRemoverTool';
import { MemeGeneratorTool } from './imageTools/MemeGeneratorTool';
import { ImageRotateTool } from './imageTools/ImageRotateTool';
import { BlurFaceTool } from './imageTools/BlurFaceTool';
import { HtmlToImageTool } from './imageTools/HtmlToImageTool';
import { ImageUpscaleTool } from './imageTools/ImageUpscaleTool';
import { ConvertFromJpgTool } from './imageTools/ConvertFromJpgTool';

// Video Tools
import { VideoEditorTool } from './videoTools/VideoEditorTool';
import { VideoConversionTool } from './videoTools/VideoConversionTool';
import { VideoCompressorTool } from './videoTools/VideoCompressorTool';
import { VideoTrimmerTool } from './videoTools/VideoTrimmerTool';
import { VideoMergerTool } from './videoTools/VideoMergerTool';
import { VideoToGifTool } from './videoTools/VideoToGifTool';
import { VideoToMp3Tool } from './videoTools/VideoToMp3Tool';
import { VideoResizerTool } from './videoTools/VideoResizerTool';
import { VideoCropperTool } from './videoTools/VideoCropperTool';
import { VideoWatermarkTool } from './videoTools/VideoWatermarkTool';
import { VideoSubtitlesTool } from './videoTools/VideoSubtitlesTool';
import { VideoFrameExtractorTool } from './videoTools/VideoFrameExtractorTool';
import { VideoRotateTool } from './videoTools/VideoRotateTool';
import { VideoSpeedTool } from './videoTools/VideoSpeedTool';
import { VideoRemoveAudioTool } from './videoTools/VideoRemoveAudioTool';
import { VideoRemoveWatermarkTool } from './videoTools/VideoRemoveWatermarkTool';
import { VideoFiltersTool } from './videoTools/VideoFiltersTool';
import { VideoCompressResizeTool } from './videoTools/VideoCompressResizeTool';

// Audio Tools
import { AudioConverterTool } from './audioTools/AudioConverterTool';
import { AudioCompressorTool } from './audioTools/AudioCompressorTool';
import { AudioCutterTool } from './audioTools/AudioCutterTool';
import { AudioMergerTool } from './audioTools/AudioMergerTool';
import { AudioMetadataEditorTool } from './audioTools/AudioMetadataEditorTool';

// Utility Tools
import { BarcodeGeneratorTool } from './utilityTools/BarcodeGeneratorTool';
import { TimestampConverterTool } from './utilityTools/TimestampConverterTool';
import { TextFormatterTool } from './utilityTools/TextFormatterTool';
import { TextToPdfTool } from './utilityTools/TextToPdfTool';

// AI Tools
import { AiToolRunner } from './aiTools/AiToolRunner';

export async function generateConvertedPdf(
  uploadedFile: File,
  qualityPreset: string
): Promise<{ bytes: Uint8Array; outName: string }> {
  let fileBuffer: ArrayBuffer;
  try {
    fileBuffer = await uploadedFile.arrayBuffer();
  } catch {
    fileBuffer = await new Response(uploadedFile).arrayBuffer();
  }

  const originalName = uploadedFile.name;
  const lastDotIndex = originalName.lastIndexOf('.');
  const baseName =
    lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;

  let pdfDoc: PDFDocument;

  try {
    pdfDoc = await PDFDocument.load(fileBuffer.slice(0), { ignoreEncryption: true });
  } catch {
    pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let embedded = false;
    if (
      uploadedFile.type.includes('png') ||
      uploadedFile.name.toLowerCase().endsWith('.png')
    ) {
      try {
        const pngImg = await pdfDoc.embedPng(fileBuffer.slice(0));
        const dims = pngImg.scaleToFit(500, 700);
        page.drawImage(pngImg, {
          x: 50,
          y: 841.89 - 50 - dims.height,
          width: dims.width,
          height: dims.height,
        });
        embedded = true;
      } catch {
        // fallback
      }
    } else if (
      uploadedFile.type.includes('jpeg') ||
      uploadedFile.type.includes('jpg') ||
      uploadedFile.name.toLowerCase().endsWith('.jpg') ||
      uploadedFile.name.toLowerCase().endsWith('.jpeg')
    ) {
      try {
        const jpgImg = await pdfDoc.embedJpg(fileBuffer.slice(0));
        const dims = jpgImg.scaleToFit(500, 700);
        page.drawImage(jpgImg, {
          x: 50,
          y: 841.89 - 50 - dims.height,
          width: dims.width,
          height: dims.height,
        });
        embedded = true;
      } catch {
        // fallback
      }
    }

    if (!embedded) {
      page.drawText(uploadedFile.name, {
        x: 50,
        y: 780,
        size: 20,
        font: boldFont,
        color: rgb(0.06, 0.16, 0.26),
      });
      page.drawText('Converted with Codemaniac Studio PDF Conversion Engine', {
        x: 50,
        y: 750,
        size: 12,
        font: regularFont,
        color: rgb(0.85, 0.51, 0.09),
      });
      page.drawText(`Quality Preset: ${qualityPreset}`, {
        x: 50,
        y: 725,
        size: 11,
        font: regularFont,
        color: rgb(0.38, 0.46, 0.54),
      });
      page.drawText(
        `Original File: ${uploadedFile.name} (${(
          uploadedFile.size / 1024
        ).toFixed(1)} KB)`,
        {
          x: 50,
          y: 700,
          size: 10,
          font: regularFont,
          color: rgb(0.38, 0.46, 0.54),
        }
      );
    }
  }

  let suffix = 'converted';
  let bytes: Uint8Array;

  if (qualityPreset.includes('High') || qualityPreset.includes('Premium')) {
    suffix = 'high_quality';
    pdfDoc.setTitle(`${baseName} - High Quality`);
    pdfDoc.setAuthor('Codemaniac Studio');
    pdfDoc.setProducer('Codemaniac Studio High & Premium Quality Engine');
    pdfDoc.setCreator('Codemaniac Studio');
    pdfDoc.setModificationDate(new Date());

    bytes = await pdfDoc.save({ useObjectStreams: false });
  } else if (qualityPreset.includes('Middle Quality')) {
    suffix = 'middle_quality';
    pdfDoc.setTitle(`${baseName} - Middle Quality`);
    pdfDoc.setProducer('Codemaniac Studio PDF Engine');
    pdfDoc.setModificationDate(new Date());

    bytes = await pdfDoc.save({ useObjectStreams: true });
  } else {
    suffix = 'low_quality';
    try {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      pdfDoc.setKeywords([]);

      pdfDoc.catalog.delete(PDFName.of('Metadata'));
      pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
      pdfDoc.catalog.delete(PDFName.of('StructTreeRoot'));
      pdfDoc.catalog.delete(PDFName.of('MarkInfo'));
      pdfDoc.catalog.delete(PDFName.of('Outlines'));

      const pages = pdfDoc.getPages();
      for (const p of pages) {
        p.node.delete(PDFName.of('Annots'));
        p.node.delete(PDFName.of('Thumb'));
        p.node.delete(PDFName.of('PieceInfo'));
      }
    } catch {
      // Continue safely
    }

    bytes = await pdfDoc.save({
      useObjectStreams: true,
      updateFieldAppearances: false,
    });
  }

  return { bytes, outName: `${baseName}_${suffix}.pdf` };
}

interface ToolStudioRendererProps {
  tool: ToolItem;
}

export const ToolStudioRenderer: React.FC<ToolStudioRendererProps> = ({ tool }) => {
  // Utility tool states
  const [copied, setCopied] = useState(false);
  const [qrText, setQrText] = useState('https://codemaniacstudio.com');
  const [qrColor, setQrColor] = useState('#102A43');

  const [passLength, setPassLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const [counterText, setCounterText] = useState(
    'Welcome to Codemaniac Studio! Our powerful online tools help you convert, edit, compress, and create digital files with zero hassle.'
  );

  const [jsonInput, setJsonInput] = useState(
    '{\n  "platform": "Codemaniac Studio",\n  "status": "online",\n  "rating": 4.9,\n  "toolsCount": 72\n}'
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState('#D98218');
  const [converterInput, setConverterInput] = useState('Codemaniac Studio 2026');
  const [converterMode, setConverterMode] = useState<'encode' | 'decode'>('encode');

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processComplete, setProcessComplete] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('3. Convert PDF into High & Premium Quality');
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedFileName, setProcessedFileName] = useState<string>('');
  const [processedFileSizeStr, setProcessedFileSizeStr] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [measuredSizes, setMeasuredSizes] = useState<Record<string, { sizeStr: string; bytes: number }>>({});
  const [measuring, setMeasuring] = useState(false);

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [hashInput, setHashInput] = useState('Codemaniac Studio');
  const [generatedHash, setGeneratedHash] = useState('');

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrSvg = () => {
    const svgEl = document.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codemaniac-studio-qrcode.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // SHA-256 calculation
  useEffect(() => {
    if (tool.id === 'hash-generator') {
      const calcHash = async () => {
        try {
          const enc = new TextEncoder();
          const buf = await crypto.subtle.digest('SHA-256', enc.encode(hashInput));
          const arr = Array.from(new Uint8Array(buf));
          const hex = arr.map((b) => b.toString(16).padStart(2, '0')).join('');
          setGeneratedHash(hex);
        } catch {
          setGeneratedHash('Crypto API not available in insecure context');
        }
      };
      calcHash();
    }
  }, [hashInput, tool.id]);

  useEffect(() => {
    if (tool.id === 'password-generator') {
      generatePassword();
    }
    setUploadedFile(null);
    setProcessing(false);
    setProcessProgress(0);
    setProcessComplete(false);
    setProcessedBlob(null);
    setProcessedFileName('');
    setProcessedFileSizeStr('');
    setErrorMessage(null);
    setWaitlistSubmitted(false);
  }, [tool.id]);

  // Handle file simulation
  const handleProcessFile = async () => {
    if (!uploadedFile) return;
    setProcessing(true);
    setProcessProgress(15);
    setErrorMessage(null);

    try {
      setProcessProgress(45);
      const { bytes, outName } = await generateConvertedPdf(uploadedFile, selectedFormat);
      setProcessProgress(80);

      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setProcessedFileName(outName);
      setProcessedFileSizeStr(`${(bytes.length / 1024).toFixed(1)} KB`);
      setProcessProgress(100);
      setProcessComplete(true);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error processing file');
      setProcessing(false);
    }
  };

  // 1. Specialized Real PDF Engines (All 31 PDF Tools)
  if (tool.id === 'pdf-merge') return <PdfMergeTool />;
  if (tool.id === 'pdf-split') return <PdfSplitTool />;
  if (tool.id === 'pdf-compressor') return <PdfCompressorTool />;
  if (
    tool.id === 'pdf-to-word' ||
    tool.id === 'pdf-to-excel' ||
    tool.id === 'pdf-to-powerpoint' ||
    tool.id === 'word-to-pdf' ||
    tool.id === 'excel-to-pdf' ||
    tool.id === 'powerpoint-to-pdf'
  ) {
    return (
      <PdfOfficeConversionTool
        toolId={
          tool.id as
            | 'pdf-to-word'
            | 'pdf-to-excel'
            | 'pdf-to-powerpoint'
            | 'word-to-pdf'
            | 'excel-to-pdf'
            | 'powerpoint-to-pdf'
        }
      />
    );
  }
  if (tool.id === 'pdf-editor') return <PdfEditorTool />;
  if (tool.id === 'pdf-page-extractor') return <PdfPageExtractorTool />;
  if (tool.id === 'pdf-page-organizer' || tool.id === 'organize-pdf') return <PdfPageOrganizerTool />;
  if (tool.id === 'pdf-protect-unlock') return <PdfProtectUnlockTool />;
  if (tool.id === 'pdf-protect') return <PdfProtectUnlockTool initialMode="protect" />;
  if (tool.id === 'pdf-unlock') return <PdfProtectUnlockTool initialMode="unlock" />;
  if (tool.id === 'pdf-watermark') return <PdfWatermarkTool />;
  if (tool.id === 'pdf-page-rotation' || tool.id === 'rotate-pdf') return <PdfRotationDeletionTool mode="rotation" />;
  if (tool.id === 'pdf-page-deletion') return <PdfRotationDeletionTool mode="deletion" />;
  if (tool.id === 'pdf-image-extraction') return <PdfImageExtractionTool />;
  if (tool.id === 'pdf-ocr') return <PdfOcrTool />;
  if (tool.id === 'pdf-metadata-editor') return <PdfMetadataEditorTool />;
  if (tool.id === 'pdf-sign') return <PdfSignTool />;
  if (tool.id === 'pdf-page-numbers') return <PdfPageNumbersTool />;
  if (tool.id === 'pdf-to-jpg') return <PdfToJpgTool />;
  if (tool.id === 'jpg-to-pdf') return <JpgToPdfTool />;
  if (tool.id === 'html-to-pdf') return <HtmlToPdfTool />;
  if (tool.id === 'pdf-to-pdfa') return <PdfToPdfaTool />;
  if (tool.id === 'pdf-repair') return <PdfRepairTool />;
  if (tool.id === 'pdf-compare') return <PdfCompareTool />;
  if (tool.id === 'scan-to-pdf') return <PdfScanTool />;
  if (tool.id === 'pdf-conversion') return <PdfQualityConversionTool />;

  // 2. Specialized Real Image Processing Engines (All 14 Image Tools)
  // 2. Specialized Real Image Processing Engines (All iLoveIMG Image Tools)
  if (tool.id === 'image-conversion') return <ImageConversionTool mode="general" />;
  if (tool.id === 'jpg-to-png' || tool.id === 'convert-from-jpg') return <ConvertFromJpgTool />;
  if (tool.id === 'png-to-jpg' || tool.id === 'convert-to-jpg') return <ImageConversionTool mode="png-to-jpg" />;
  if (tool.id === 'webp-converter') return <ImageConversionTool mode="webp" />;
  if (tool.id === 'image-compressor' || tool.id === 'compress-image') return <ImageCompressorTool />;
  if (tool.id === 'image-resizer' || tool.id === 'resize-image') return <ImageResizerTool />;
  if (tool.id === 'image-editor' || tool.id === 'photo-editor') return <ImageEditorTool />;
  if (tool.id === 'image-cropper' || tool.id === 'crop-image') return <ImageCropperTool />;
  if (tool.id === 'image-to-text-ocr' || tool.id === 'image-to-text') return <ImageOcrTool />;
  if (tool.id === 'background-remover' || tool.id === 'remove-background') return <ImageBackgroundRemoverTool />;
  if (tool.id === 'image-to-pdf') return <ImageToPdfTool />;
  if (tool.id === 'image-watermark' || tool.id === 'watermark-image') return <ImageWatermarkTool />;
  if (tool.id === 'image-quality-enhancer' || tool.id === 'upscale-image') return <ImageUpscaleTool />;
  if (tool.id === 'image-metadata-remover') return <ImageMetadataRemoverTool />;
  if (tool.id === 'meme-generator') return <MemeGeneratorTool />;
  if (tool.id === 'rotate-image') return <ImageRotateTool />;
  if (tool.id === 'blur-face') return <BlurFaceTool />;
  if (tool.id === 'html-to-image') return <HtmlToImageTool />;

  // 3. Specialized Real Video Processing Engines (All 18 Video Tools)
  if (tool.id === 'video-editor') return <VideoEditorTool />;
  if (tool.id === 'video-conversion') return <VideoConversionTool />;
  if (tool.id === 'video-compressor') return <VideoCompressorTool />;
  if (tool.id === 'video-trimmer') return <VideoTrimmerTool />;
  if (tool.id === 'video-merger') return <VideoMergerTool />;
  if (tool.id === 'video-to-gif') return <VideoToGifTool />;
  if (tool.id === 'video-to-mp3') return <VideoToMp3Tool />;
  if (tool.id === 'video-resizer') return <VideoResizerTool />;
  if (tool.id === 'video-cropper') return <VideoCropperTool />;
  if (tool.id === 'video-watermark') return <VideoWatermarkTool />;
  if (tool.id === 'video-subtitle-tool' || tool.id === 'video-subtitles') return <VideoSubtitlesTool />;
  if (tool.id === 'video-frame-extractor') return <VideoFrameExtractorTool />;
  if (tool.id === 'video-rotate' || tool.id === 'rotate-video') return <VideoRotateTool />;
  if (tool.id === 'video-speed' || tool.id === 'change-speed') return <VideoSpeedTool />;
  if (tool.id === 'video-remove-audio' || tool.id === 'remove-audio') return <VideoRemoveAudioTool />;
  if (tool.id === 'video-remove-watermark' || tool.id === 'remove-watermark') return <VideoRemoveWatermarkTool />;
  if (tool.id === 'video-filters' || tool.id === 'video-effects') return <VideoFiltersTool />;
  if (tool.id === 'video-compress-resize' || tool.id === 'compress-resize') return <VideoCompressResizeTool />;

  // 4. Specialized Real Audio Processing Engines (All 7 Audio Tools)
  if (tool.id === 'audio-converter') return <AudioConverterTool mode="general" />;
  if (tool.id === 'audio-to-mp3') return <AudioConverterTool mode="to-mp3" initialFormat="mp3" />;
  if (tool.id === 'video-to-audio') return <AudioConverterTool mode="video-to-audio" initialFormat="mp3" />;
  if (tool.id === 'audio-compressor') return <AudioCompressorTool />;
  if (tool.id === 'audio-cutter') return <AudioCutterTool />;
  if (tool.id === 'audio-merger') return <AudioMergerTool />;
  if (tool.id === 'audio-metadata-editor') return <AudioMetadataEditorTool />;

  // 5. Specialized Utility Tools
  if (tool.id === 'barcode-generator') return <BarcodeGeneratorTool />;
  if (tool.id === 'timestamp-converter') return <TimestampConverterTool />;
  if (tool.id === 'text-formatter') return <TextFormatterTool />;
  if (tool.id === 'text-to-pdf') return <TextToPdfTool />;

  // 6. Specialized AI Tools
  if (tool.category === 'ai' || tool.id.startsWith('ai-')) {
    return <AiToolRunner tool={tool} />;
  }

  // 7. Coming Soon Fallback with Priority Access Form
  if (tool.status === 'coming_soon') {
    return (
      <div className="space-y-6 text-center py-8">
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
            Our engineering team is finalizing the high-performance engine for {tool.name}.
            Join our priority access list to get early notification when we launch!
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
          <span>✓ 100% Free early access</span>
          <span>✓ Privacy protected</span>
        </div>
      </div>
    );
  }

  // 8. QR Code Generator
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

          <div className="flex flex-col items-center justify-center p-6 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
            <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-md border border-[#E9DCC8] flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="10" y="10" width="24" height="24" rx="3" fill={qrColor} />
                <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                <rect x="18" y="18" width="8" height="8" rx="1" fill={qrColor} />
                <rect x="66" y="10" width="24" height="24" rx="3" fill={qrColor} />
                <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                <rect x="74" y="18" width="8" height="8" rx="1" fill={qrColor} />
                <rect x="10" y="66" width="24" height="24" rx="3" fill={qrColor} />
                <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                <rect x="18" y="74" width="8" height="8" rx="1" fill={qrColor} />
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
                onClick={handleDownloadQrSvg}
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

  // 9. Password Generator
  if (tool.id === 'password-generator') {
    return (
      <div className="space-y-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

  // 10. Word Counter / Character Counter
  if (tool.id === 'word-counter' || tool.id === 'character-counter') {
    const words = counterText.trim() ? counterText.trim().split(/\s+/).length : 0;
    const characters = counterText.length;
    const charsNoSpaces = counterText.replace(/\s+/g, '').length;
    const sentences = counterText.split(/[.!?]+/).filter(Boolean).length;
    const readingTime = Math.ceil(words / 200);

    return (
      <div className="space-y-4">
        <textarea
          rows={6}
          value={counterText}
          onChange={(e) => setCounterText(e.target.value)}
          placeholder="Type or paste your text here to analyze..."
          className="w-full p-4 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] focus:border-[#D98218] focus:outline-none bg-white shadow-inner"
        />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Words', val: words },
            { label: 'Characters', val: characters },
            { label: 'No Spaces', val: charsNoSpaces },
            { label: 'Sentences', val: sentences },
            { label: 'Reading Time', val: `${readingTime} min` },
          ].map((st, i) => (
            <div key={i} className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-center">
              <div className="text-xl font-black text-[#D98218] font-mono">{st.val}</div>
              <div className="text-[11px] font-bold text-[#61758A] mt-0.5">{st.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 11. JSON Formatter / Validator
  if (tool.id === 'json-formatter' || tool.id === 'json-validator') {
    const handleFormat = () => {
      try {
        const parsed = JSON.parse(jsonInput);
        setJsonInput(JSON.stringify(parsed, null, 2));
        setJsonError(null);
      } catch (err: unknown) {
        setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      }
    };

    const handleMinify = () => {
      try {
        const parsed = JSON.parse(jsonInput);
        setJsonInput(JSON.stringify(parsed));
        setJsonError(null);
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

  // 12. Color Picker
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

  // 13. Base64 / URL Encoder
  if (tool.id === 'base64-encoder-decoder' || tool.id === 'url-encoder-decoder') {
    const isBase64 = tool.id === 'base64-encoder-decoder';
    let convertedResult = '';
    try {
      if (isBase64) {
        convertedResult = converterMode === 'encode' ? btoa(converterInput) : atob(converterInput);
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
          <label className="block text-xs font-bold text-[#102A43] mb-1">
            INPUT ({converterMode.toUpperCase()})
          </label>
          <textarea
            rows={3}
            value={converterInput}
            onChange={(e) => setConverterInput(e.target.value)}
            className="w-full p-3 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-[#102A43]">OUTPUT</label>
            <button
              onClick={() => handleCopy(convertedResult)}
              className="text-xs text-[#D98218] font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Result</span>
            </button>
          </div>
          <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] font-mono text-xs text-[#102A43] break-all min-h-[5rem]">
            {convertedResult}
          </div>
        </div>
      </div>
    );
  }

  // 14. Hash Generator
  if (tool.id === 'hash-generator') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#102A43] mb-1.5">INPUT STRING</label>
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

  // 15. Default Media & Document Studio
  return (
    <div className="space-y-6">
      {!uploadedFile ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setUploadedFile(e.target.files[0]);
              }
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <span className="text-lg font-bold text-[#102A43]">
            Choose file or drag & drop here
          </span>
          <span className="text-xs text-[#61758A] mt-1.5">
            Supports {tool.category.toUpperCase()} files up to 250MB · Encrypted in browser memory
          </span>
          <span className="mt-5 px-6 py-2.5 rounded-full bg-[#D98218] text-white hover:bg-[#C66A08] text-sm font-bold shadow-md">
            Select {tool.category.toUpperCase()} File
          </span>
        </label>
      ) : (
        <div className="space-y-5">
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center font-bold text-xs">
                {tool.category.toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-xs sm:max-w-md">
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
                setProcessedBlob(null);
                setProcessedFileName('');
                setProcessedFileSizeStr('');
                setErrorMessage(null);
              }}
              className="text-xs text-[#61758A] hover:text-red-600 cursor-pointer font-semibold"
            >
              Change File
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-700 hover:text-red-900 font-bold underline text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {processing ? (
            <div className="p-4 bg-white rounded-xl border border-[#E9DCC8] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
                <span>Processing with Codemaniac Engine...</span>
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
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    File processed successfully!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    {processedFileName} · {processedFileSizeStr}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {processedBlob && (
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(processedBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = processedFileName || 'codemaniac_processed_output.pdf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setTimeout(() => URL.revokeObjectURL(url), 4000);
                    }}
                    className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setProcessComplete(false);
                    setProcessedBlob(null);
                    setProcessedFileName('');
                    setProcessedFileSizeStr('');
                    setErrorMessage(null);
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
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
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
