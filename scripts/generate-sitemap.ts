import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALL_TOOLS, CATEGORIES_DATA } from '../src/data/toolsData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace with production domain or environment variable
const BASE_URL = process.env.VITE_SITE_URL || 'https://studio.codemaniac.com';
const TODAY = new Date().toISOString().split('T')[0];

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

const urls: SitemapUrl[] = [
  // 1. Homepage & All Products
  { loc: `${BASE_URL}/`, lastmod: TODAY, changefreq: 'daily', priority: '1.0' },
  { loc: `${BASE_URL}/product`, lastmod: TODAY, changefreq: 'daily', priority: '0.9' },

  // 2. Category Hub Pages
  ...Object.keys(CATEGORIES_DATA).map((catKey) => ({
    loc: `${BASE_URL}/products/${catKey}`,
    lastmod: TODAY,
    changefreq: 'daily' as const,
    priority: '0.9',
  })),

  // 3. All 93 Individual Tools
  ...ALL_TOOLS.map((tool) => ({
    loc: `${BASE_URL}/tools/${tool.id}`,
    lastmod: TODAY,
    changefreq: 'weekly' as const,
    priority: '0.8',
  })),

  // 4. Secondary Pages
  { loc: `${BASE_URL}/service`, lastmod: TODAY, changefreq: 'monthly', priority: '0.6' },
  { loc: `${BASE_URL}/education`, lastmod: TODAY, changefreq: 'weekly', priority: '0.7' },
  { loc: `${BASE_URL}/about`, lastmod: TODAY, changefreq: 'monthly', priority: '0.6' },
  { loc: `${BASE_URL}/blog`, lastmod: TODAY, changefreq: 'weekly', priority: '0.7' },
  { loc: `${BASE_URL}/contact`, lastmod: TODAY, changefreq: 'monthly', priority: '0.5' },
  { loc: `${BASE_URL}/privacy`, lastmod: TODAY, changefreq: 'yearly', priority: '0.4' },
];

// Generate XML Sitemap
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

// Generate robots.txt
const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Direct Googlebot & Bingbot to Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xmlContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');

console.log(`✅ Successfully generated sitemap.xml with ${urls.length} URLs!`);
console.log(`✅ Successfully generated robots.txt pointing to ${BASE_URL}/sitemap.xml!`);
