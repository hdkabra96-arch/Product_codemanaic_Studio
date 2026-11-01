import React, { useEffect } from 'react';
import { ToolItem, ToolCategory } from '../types';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  tool?: ToolItem;
  category?: ToolCategory;
  faqs?: { question: string; answer: string }[];
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalUrl,
  tool,
  category,
  faqs = [],
}) => {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // Helper to set or create meta tag
    const setMeta = (name: string, content: string, isProperty: boolean = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // 2. Standard Meta Tags
    setMeta('description', description);
    setMeta(
      'keywords',
      tool
        ? `${tool.name}, online ${tool.name}, free ${tool.name}, ${tool.category} tools, client-side tools, private file converter`
        : 'online tools, pdf tools, image tools, video tools, audio tools, document tools, free online converter'
    );
    setMeta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

    // 3. OpenGraph Tags
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'website', true);
    if (canonicalUrl) {
      setMeta('og:url', canonicalUrl, true);
    }
    setMeta('og:site_name', 'Codemaniac Studio', true);

    // 4. Twitter Cards
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    // 5. Canonical Link Tag
    if (canonicalUrl) {
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.href = canonicalUrl;
    }

    // 6. Inject Schema.org JSON-LD Structured Data
    const scriptId = 'codemaniac-seo-schema';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    const schemas: any[] = [];

    // WebApplication Schema (Matching iLovePDF)
    if (tool) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: tool.name,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All (Web Browser)',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description: tool.description,
        featureList: [
          '100% Client-Side Processing',
          'Zero Server Uploads & Full Privacy',
          'No File Limits & No Watermarks',
          'Instant High-Speed Conversion',
        ],
      });

      // HowTo Schema (Rich Snippet on Google)
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to use ${tool.name}`,
        description: `Follow these 3 easy steps to process your files with ${tool.name} for free online.`,
        step: [
          {
            '@type': 'HowToStep',
            name: 'Select Files',
            text: `Drag and drop your files into the ${tool.name} workspace or click to choose from your device.`,
            position: 1,
          },
          {
            '@type': 'HowToStep',
            name: 'Customize Options',
            text: 'Adjust compression, rotation, quality, or formatting parameters according to your preference.',
            position: 2,
          },
          {
            '@type': 'HowToStep',
            name: 'Download Result',
            text: 'Click process and download your converted file instantly with original quality preserved.',
            position: 3,
          },
        ],
      });

      // BreadcrumbList Schema
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: window.location.origin,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${tool.category.toUpperCase()} Tools`,
            item: `${window.location.origin}/#/products/${tool.category}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tool.name,
            item: window.location.href,
          },
        ],
      });
    }

    // FAQPage Schema (Displays expandable FAQ accordion directly in Google SERP!)
    if (faqs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      });
    }

    if (schemas.length > 0) {
      scriptEl.textContent = JSON.stringify(schemas);
    }

    return () => {
      // Cleanup schema on unmount
      if (scriptEl) {
        scriptEl.textContent = '';
      }
    };
  }, [title, description, canonicalUrl, tool, category, faqs]);

  return null;
};
