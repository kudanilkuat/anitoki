import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';

const getPaginationParams = (searchParams, defaultLimit = 24) => {
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.max(1, parseInt(searchParams.get('limit')) || defaultLimit);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

const formatAnimeList = (animes) => {
    return animes.map(m => {
        // episodes from $slice(-3) are asc order → reverse for newest-first display
        const eps = Array.isArray(m.episodes)
            ? [...m.episodes].reverse().map(ep => ({
                ...ep,
                // fallback airDate to anime lastUpdated if episode has none
                airDate: ep.airDate || m.lastUpdated || null,
            }))
            : [];
        const latestEp = eps.length > 0 ? eps[0] : null;
        return {
            _id: m._id,
            title: m.title,
            slug: m.slug,
            coverImage: m.coverImage,
            bannerImage: m.bannerImage || '',
            type: m.type,
            status: m.status,
            rating: m.rating,
            views: m.views || 0,
            lastUpdated: m.lastUpdated,
            episode_count: m.episode_count || 0,
            last_episode: latestEp ? latestEp.title : '?',
            last_episode_slug: latestEp ? latestEp.slug : '',
            episodes: eps
        };
    });
};

const findAnimeList = async (matchQuery, sortOption, skip, limit) => {
    return Anime.aggregate([
        { $match: matchQuery },
        { $sort: sortOption },
        { $skip: skip },
        { $limit: limit },
        {
            $project: {
                title: 1, slug: 1, coverImage: 1, bannerImage: 1, type: 1, status: 1,
                rating: 1, views: 1, lastUpdated: 1,
                episode_count: { $size: { $ifNull: ['$episodes', []] } },
                episodes: { $slice: ['$episodes', -3] }
            }
        }
    ]);
};

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = getPaginationParams(searchParams);

        const [
            totalAnime,
            recentsRaw,
            trendingRaw,
            ongoingRaw,
            completedRaw,
        ] = await Promise.all([
            Anime.countDocuments(),
            // Recents: naik saat ada episode baru (by lastUpdated desc)
            findAnimeList({}, { lastUpdated: -1 }, skip, limit),
            // Trending: most viewed
            findAnimeList({}, { views: -1 }, 0, 24),
            // Ongoing
            findAnimeList({ status: { $regex: 'ongoing', $options: 'i' } }, { lastUpdated: -1 }, 0, 24),
            // Completed
            findAnimeList({ status: { $regex: 'completed', $options: 'i' } }, { lastUpdated: -1 }, 0, 24),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                recents: formatAnimeList(recentsRaw),
                trending: formatAnimeList(trendingRaw),
                ongoing: formatAnimeList(ongoingRaw),
                completed: formatAnimeList(completedRaw),
            },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalAnime / limit),
                totalItems: totalAnime,
                perPage: limit
            }
        });

    } catch (err) {
        console.error('Home API Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
