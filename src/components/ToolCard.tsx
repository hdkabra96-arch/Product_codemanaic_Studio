import React from 'react';
import {
  FileText,
  Layers,
  Scissors,
  Minimize2,
  Minimize,
  Table,
  Presentation,
  Edit3,
  FileMinus,
  LayoutGrid,
  Lock,
  Stamp,
  Image as ImageIcon,
  Scaling,
  Maximize,
  Wand2,
  Crop,
  ScanText,
  UserX,
  FileImage,
  FileCheck,
  FilePlus2,
  Sparkles,
  ShieldAlert,
  Film,
  RefreshCw,
  Music,
  Camera,
  Activity,
  FileAudio,
  Video,
  Tag,
  QrCode,
  Barcode,
  Type,
  Code,
  CheckSquare,
  Link2,
  Palette,
  KeyRound,
  Hash,
  Clock,
  Bot,
  HelpCircle,
  PenTool,
  Search,
  ArrowRight,
  Clock3,
  Unlock,
  Wrench,
  GitCompare,
  Globe,
  FileSignature,
  FileCode2,
  FileType2,
  Sheet,
  MonitorPlay,
  ShieldCheck,
  Smile,
  EyeOff,
  ArrowUpRight,
  RotateCw,
  Gauge,
  VolumeX,
  Eraser,
} from 'lucide-react';
import { ToolItem } from '../types';

interface ToolCardProps {
  tool: ToolItem;
  onSelectTool?: (tool: ToolItem) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelectTool }) => {
  // Map icon name to lucide icon component
  const renderIcon = () => {
    const props = { className: 'w-6 h-6 stroke-[2.2]' };
    switch (tool.iconName) {
      case 'FileText':
        return <FileText {...props} />;
      case 'Layers':
        return <Layers {...props} />;
      case 'Scissors':
        return <Scissors {...props} />;
      case 'Minimize2':
        return <Minimize2 {...props} />;
      case 'Minimize':
        return <Minimize {...props} />;
      case 'Table':
        return <Table {...props} />;
      case 'Presentation':
        return <Presentation {...props} />;
      case 'Edit3':
        return <Edit3 {...props} />;
      case 'FileMinus':
        return <FileMinus {...props} />;
      case 'LayoutGrid':
        return <LayoutGrid {...props} />;
      case 'Lock':
        return <Lock {...props} />;
      case 'Stamp':
        return <Stamp {...props} />;
      case 'Image':
        return <ImageIcon {...props} />;
      case 'Scaling':
        return <Scaling {...props} />;
      case 'Maximize':
      case 'Maximize2':
        return <Maximize {...props} />;
      case 'Wand2':
        return <Wand2 {...props} />;
      case 'Crop':
        return <Crop {...props} />;
      case 'ScanText':
      case 'Scan':
        return <ScanText {...props} />;
      case 'UserX':
        return <UserX {...props} />;
      case 'FileImage':
        return <FileImage {...props} />;
      case 'FileCheck':
        return <FileCheck {...props} />;
      case 'FilePlus2':
        return <FilePlus2 {...props} />;
      case 'Sparkles':
        return <Sparkles {...props} />;
      case 'ShieldAlert':
        return <ShieldAlert {...props} />;
      case 'Film':
        return <Film {...props} />;
      case 'RefreshCw':
        return <RefreshCw {...props} />;
      case 'Music':
      case 'Music2':
        return <Music {...props} />;
      case 'Camera':
        return <Camera {...props} />;
      case 'Activity':
        return <Activity {...props} />;
      case 'FileAudio':
        return <FileAudio {...props} />;
      case 'Video':
        return <Video {...props} />;
      case 'Tag':
        return <Tag {...props} />;
      case 'QrCode':
        return <QrCode {...props} />;
      case 'Barcode':
        return <Barcode {...props} />;
      case 'Type':
        return <Type {...props} />;
      case 'Code':
      case 'Code2':
        return <Code {...props} />;
      case 'CheckSquare':
        return <CheckSquare {...props} />;
      case 'Link2':
        return <Link2 {...props} />;
      case 'Palette':
        return <Palette {...props} />;
      case 'KeyRound':
        return <KeyRound {...props} />;
      case 'Hash':
        return <Hash {...props} />;
      case 'Clock':
        return <Clock {...props} />;
      case 'HelpCircle':
        return <HelpCircle {...props} />;
      case 'PenTool':
        return <PenTool {...props} />;
      case 'FileSignature':
        return <FileSignature {...props} />;
      case 'Unlock':
        return <Unlock {...props} />;
      case 'Wrench':
        return <Wrench {...props} />;
      case 'GitCompare':
        return <GitCompare {...props} />;
      case 'Globe':
        return <Globe {...props} />;
      case 'ShieldCheck':
        return <ShieldCheck {...props} />;
      case 'FileCode2':
        return <FileCode2 {...props} />;
      case 'FileType2':
        return <FileType2 {...props} />;
      case 'Sheet':
        return <Sheet {...props} />;
      case 'MonitorPlay':
        return <MonitorPlay {...props} />;
      case 'Search':
        return <Search {...props} />;
      case 'Smile':
        return <Smile {...props} />;
      case 'EyeOff':
        return <EyeOff {...props} />;
      case 'RotateCw':
        return <RotateCw {...props} />;
      case 'Gauge':
        return <Gauge {...props} />;
      case 'VolumeX':
        return <VolumeX {...props} />;
      case 'Eraser':
        return <Eraser {...props} />;
      default:
        return <Bot {...props} />;
    }
  };

  const isComingSoon = tool.status === 'coming_soon';

  return (
    <a
      href={`#/tools/${tool.id}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        onSelectTool?.(tool);
      }}
      className="group relative bg-white rounded-2xl p-6 border border-[#E9DCC8] shadow-[0_4px_20px_rgba(217,130,24,0.05)] hover:shadow-[0_8px_30px_rgba(217,130,24,0.14)] hover:border-[#D98218] hover:-translate-y-1 transition-all duration-250 cursor-pointer flex flex-col justify-between block no-underline"
    >
      <div>
        {/* Top Header Row with Icon, optional Badge, and open arrow */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${tool.badgeBg} transition-transform group-hover:scale-105`}
          >
            {renderIcon()}
          </div>
          <div className="flex items-center gap-2">
            {tool.badge && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                {tool.badge}
              </span>
            )}
            <ArrowUpRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#D98218] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#102A43] group-hover:text-[#D98218] transition-colors leading-snug">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#61758A] mt-2 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Action Area */}
      <div className="pt-6 mt-2">
        {isComingSoon ? (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FFF3DF] text-[#D98218] border border-[#F4A62A]/30">
            <Clock3 className="w-3.5 h-3.5" />
            <span>Coming Soon</span>
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold text-[#102A43] bg-transparent border border-[#E9DCC8] group-hover:border-[#D98218] group-hover:text-[#D98218] group-hover:bg-[#FFF3DF]/40 transition-all"
          >
            <span>Try Now</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        )}
      </div>
    </a>
  );
};
