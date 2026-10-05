export type ToolCategory = 'all' | 'pdf' | 'image' | 'video' | 'audio' | 'utility' | 'ai';

export interface ToolItem {
  id: string;
  name: string;
  category: Exclude<ToolCategory, 'all'>;
  description: string;
  iconName: string;
  badgeBg: string;
  iconColor: string;
  status: 'available' | 'coming_soon';
  route: string;
  featured?: boolean;
}

export interface CategoryInfo {
  id: Exclude<ToolCategory, 'all'>;
  name: string;
  badgeText: string;
  heroTitleLead: string;
  heroTitleHighlight: string;
  heroDescription: string;
  exploreTitle: string;
  exploreSubtitle: string;
  searchPlaceholder: string;
  whyTitle: string;
  whyDescription?: string;
  benefits: {
    title: string;
    description: string;
    icon: string;
  }[];
  cta: {
    title: string;
    highlight: string;
    subtitle: string;
    buttonText: string;
    badgeText?: string;
  };
}

export type PageView =
  | 'home'
  | 'product'
  | 'category'
  | 'service'
  | 'education'
  | 'about'
  | 'blog'
  | 'contact'
  | 'privacy';
