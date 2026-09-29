import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://komikverse.com';
const DEPLOY_DATE = process.env.NEXT_PUBLIC_DEPLOY_DATE || '2025-01-01';

export const revalidate = 86400;

export async function GET() {
  let lastAnime = new Date(DEPLOY_DATE);
  let lastEpisode = new Date(DEPLOY_DATE);

  try {
    await connectDB();
    const [latestAnime] = await Anime.find({}, { lastUpdated: 1 })
      .sort({ lastUpdated: -1 })
      .limit(1)
      .lean();
    if (latestAnime?.lastUpdated) lastAnime = new Date(latestAnime.lastUpdated);

    // Latest episode createdAt — from embedded episodes array
    const [latestEp] = await Anime.aggregate([
      { $unwind: '$episodes' },
      { $sort: { 'episodes.createdAt': -1 } },
      { $limit: 1 },
      { $project: { _id: 0, createdAt: '$episodes.createdAt' } },
    ]);
    if (latestEp?.createdAt) lastEpisode = new Date(latestEp.createdAt);
  } catch {
    // fallback dates
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-static.xml</loc>
    <lastmod>${new Date(DEPLOY_DATE).toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-anime.xml</loc>
    <lastmod>${lastAnime.toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-episode.xml</loc>
    <lastmod>${lastEpisode.toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
    },
  });
}
