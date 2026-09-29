import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';
import Episode from '@/lib/models/Episode';

export const revalidate = 150;

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { slug, episodeSlug } = params;

        const [anime, episode] = await Promise.all([
            Anime.findOne({ slug })
                .select('title slug coverImage synopsis genres type status rating studio totalEpisode episodes')
                .lean(),
            Episode.findOne({ animeSlug: slug, episodeSlug })
                .select('title servers downloads prevSlug nextSlug createdAt episodeIndex')
                .lean()
        ]);

        if (!anime) return NextResponse.json({ success: false, message: 'Anime not found' }, { status: 404 });
        if (!episode) return NextResponse.json({ success: false, message: 'Episode not found' }, { status: 404 });

        // Fetch recommendations: same genres, different slug, limit 6
        let recommendations = [];
        try {
            if (anime.genres?.length > 0) {
                recommendations = await Anime.find({
                    slug: { $ne: slug },
                    genres: { $in: anime.genres },
                })
                    .select('title slug coverImage type status')
                    .sort({ lastUpdated: -1 })
                    .limit(6)
                    .lean();
            }
            // Fallback: latest anime
            if (recommendations.length < 4) {
                const extra = await Anime.find({ slug: { $ne: slug } })
                    .select('title slug coverImage type status')
                    .sort({ lastUpdated: -1 })
                    .limit(6)
                    .lean();
                const existing = new Set(recommendations.map(r => r.slug));
                recommendations = [
                    ...recommendations,
                    ...extra.filter(r => !existing.has(r.slug))
                ].slice(0, 6);
            }
        } catch (_) { /* skip recommendations on error */ }

        return NextResponse.json({
            success: true,
            data: {
                episode: {
                    title: episode.title,
                    servers: Array.isArray(episode.servers) ? episode.servers : [],
                    downloads: Array.isArray(episode.downloads) ? episode.downloads : [],
                    episodeIndex: episode.episodeIndex,
                    createdAt: episode.createdAt,
                },
                // Legacy keys for backward compat
                chapter: {
                    title: episode.title,
                    servers: Array.isArray(episode.servers) ? episode.servers : [],
                    downloads: Array.isArray(episode.downloads) ? episode.downloads : [],
                    episodeIndex: episode.episodeIndex,
                    createdAt: episode.createdAt,
                },
                anime,
                manga: anime,
                navigation: {
                    prev: episode.prevSlug || null,
                    next: episode.nextSlug || null,
                },
                recommendations,
            }
        });
    } catch (err) {
        console.error('Episode API Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 600 });
    }
}
