import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';
import Episode from '@/lib/models/Episode';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://komikverse.com';
const DEPLOY_DATE = process.env.NEXT_PUBLIC_DEPLOY_DATE || '2025-01-01';

function escapeXml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export const revalidate = 86400;

function urlset(urls) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ url, lastUpdated, changeFrequency, priority }) =>
        `  <url>
    <loc>${escapeXml(url)}</loc>
    ${lastUpdated ? `<lastmod>${new Date(lastUpdated).toISOString()}</lastmod>` : ''}
    ${changeFrequency ? `<changefreq>${changeFrequency}</changefreq>` : ''}
    ${priority ? `<priority>${priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
}

export async function GET() {
    const urls = [];

    try {
        await connectDB();
        // Filter out Hentai from public sitemap to protect main domain from Google SafeSearch flags
        const animes = await Anime.find(
            { type: { $ne: 'Hentai' }, genres: { $nin: ['Hentai', 'hentai'] } },
            { slug: 1, status: 1, 'episodes.slug': 1 }
        ).lean();

        // Map "animeSlug/episodeSlug" -> createdAt (tanggal update episode)
        const epDates = await Episode.find({}, { animeSlug: 1, episodeSlug: 1, createdAt: 1 }).lean();
        const dateMap = new Map(
            epDates.map((e) => [`${e.animeSlug}/${e.episodeSlug}`, e.createdAt])
        );

        for (const anime of animes) {
            const isOngoing = anime.status?.toLowerCase() === 'ongoing';
            const eps = anime.episodes || [];
            // ongoing: semua ep; completed: 20 terbaru saja
            const subset = isOngoing ? eps : eps.slice(-20);
            for (const ep of subset) {
                if (!ep.slug) continue;
                urls.push({
                    url: `${SITE_URL}/episode/${anime.slug}/${ep.slug}`,
                    lastUpdated: dateMap.get(`${anime.slug}/${ep.slug}`) || new Date(DEPLOY_DATE),
                    changeFrequency: isOngoing ? 'daily' : 'weekly',
                    priority: isOngoing ? 0.7 : 0.5,
                });
            }
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
