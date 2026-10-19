import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://komikverse.com';
const DEPLOY_DATE = process.env.NEXT_PUBLIC_DEPLOY_DATE || '2025-01-01';

function escapeXml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export const revalidate = 86400;

function urlset(urls) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.map(({ url, lastModified, changeFrequency, priority, image, news }) => {
        const imagePart = image ? `
    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
    </image:image>` : '';
        const newsPart = news ? `
    <news:news>
      <news:publication>
        <news:name>${escapeXml(news.name)}</news:name>
        <news:language>id</news:language>
      </news:publication>
      <news:publication_date>${news.publicationDate}</news:publication_date>
      <news:title>${escapeXml(news.title)}</news:title>
    </news:news>` : '';
        return `  <url>
    <loc>${escapeXml(url)}</loc>
    ${lastModified ? `<lastmod>${new Date(lastModified).toISOString()}</lastmod>` : ''}
    ${changeFrequency ? `<changefreq>${changeFrequency}</changefreq>` : ''}
    ${priority ? `<priority>${priority}</priority>` : ''}${imagePart}${newsPart}
  </url>`;
    }).join('\n')}
</urlset>`;
}

export async function GET() {
    const urls = [];

    try {
        // Filter out Hentai from public sitemap to protect main domain from Google SafeSearch flags
        const animes = await Anime.find(
            { type: { $ne: 'Hentai' }, genres: { $nin: ['Hentai', 'hentai'] } },
            { slug: 1, title: 1, status: 1, lastUpdated: 1, airDate: 1, coverImage: 1 }
        ).lean();

        const deployDate = new Date(DEPLOY_DATE);
        for (const anime of animes) {
            const isOngoing = anime.status?.toLowerCase() === 'ongoing';
            const airParsed = anime.airDate ? new Date(anime.airDate) : null;
            const airValid = airParsed && !isNaN(airParsed) ? airParsed : null;
            const lastUpdated = anime.lastUpdated ? new Date(anime.lastUpdated) : null;
            const candidates = [airValid, lastUpdated].filter(Boolean);
            const lastMod = candidates.length ? new Date(Math.max(...candidates)) : deployDate;
            const isRecent = (new Date() - lastMod) < 2 * 24 * 60 * 60 * 1000; // 48h
            urls.push({
                url: `${SITE_URL}/anime/${anime.slug}`,
                lastModified: lastMod,
                changeFrequency: isOngoing ? 'daily' : 'weekly',
                priority: 0.8,
                image: anime.coverImage ? {
                    loc: anime.coverImage,
                    title: anime.title,
                } : null,
                news: isRecent && anime.title ? {
                    name: process.env.NEXT_PUBLIC_SITE_NAME || 'Anitoki',
                    publicationDate: lastMod.toISOString(),
                    title: anime.title,
                } : null,
            });
        }
    } catch {
        // return empty on error
    }

    return new Response(urlset(urls), {
        status: 200,
        headers: {
            'Content-Type': 'text/xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
        },
    });
}
