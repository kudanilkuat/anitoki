import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://komikverse.com';
const DEPLOY_DATE = process.env.NEXT_PUBLIC_DEPLOY_DATE || '2025-01-01';

export const revalidate = 86400;

function urlset(urls) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ url, lastModified, changeFrequency, priority }) =>
        `  <url>
    <loc>${url}</loc>
    ${lastModified ? `<lastmod>${new Date(lastModified).toISOString()}</lastmod>` : ''}
    ${changeFrequency ? `<changefreq>${changeFrequency}</changefreq>` : ''}
    ${priority ? `<priority>${priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
}

export async function GET() {
    const d = new Date(DEPLOY_DATE);
    const now = new Date();
    const urls = [
        { url: SITE_URL, lastModified: d, changeFrequency: 'daily', priority: 1.0 },
        { url: `${SITE_URL}/anime`, lastModified: d, changeFrequency: 'daily', priority: 0.9 },
        { url: `${SITE_URL}/download`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${SITE_URL}/app`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}/genres`, lastModified: d, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${SITE_URL}/privacy-policy`, lastModified: d, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/terms`, lastModified: d, changeFrequency: 'monthly', priority: 0.5 },
    ];

    return new Response(urlset(urls), {
        status: 200,
        headers: {
            'Content-Type': 'text/xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
        },
    });
}
