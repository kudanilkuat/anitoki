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
        // $slice(-3) gives last 3 in asc order → reverse for newest-first
        const episodes = Array.isArray(m.episodes)
            ? [...m.episodes].reverse().map(ep => ({
                ...ep,
                airDate: ep.airDate || m.lastUpdated || null,
            }))
            : [];
        return {
            _id: m._id,
            title: m.title,
            slug: m.slug,
            coverImage: m.coverImage,
            type: m.type,
            status: m.status,
            rating: m.rating,
            views: m.views || 0,
            lastUpdated: m.lastUpdated,
            episode_count: m.episode_count || 0,
            episodes,
        };
    });
};

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = getPaginationParams(searchParams);
        const q = searchParams.get('q');
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const genre = searchParams.get('genre');
        const order = searchParams.get('order');

        let query = {};

        if (q) {
            query.title = { $regex: q, $options: 'i' };
        }
        if (status && status !== 'all') {
            const sLower = status.toLowerCase();
            if (sLower === 'completed' || sLower === 'end' || sLower === 'complete') {
                query.status = { $regex: /^(completed|complete|end)$/i };
            } else if (sLower === 'ongoing' || sLower === 'airing') {
                query.status = { $regex: /^(ongoing|airing)$/i };
            } else {
                query.status = { $regex: new RegExp(`^${status}$`, 'i') };
            }
        }
        if (type && type !== 'all') {
            query.type = { $regex: new RegExp(`^${type}$`, 'i') };
        }
        if (genre && genre !== 'all') {
            const cleanGenre = genre.replace(/-/g, '[\\s\\-]');
            query.genres = { $regex: new RegExp(cleanGenre, 'i') };
        }

        let sortOption = { lastUpdated: -1 };
        switch (order) {
            case 'oldest': sortOption = { lastUpdated: 1 }; break;
            case 'popular': sortOption = { views: -1 }; break;
            case 'az': sortOption = { title: 1 }; break;
            case 'za': sortOption = { title: -1 }; break;
            default: sortOption = { lastUpdated: -1 };
        }

        const total = await Anime.countDocuments(query);

        const animesRaw = await Anime.aggregate([
            { $match: query },
            { $sort: sortOption },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    coverImage: 1,
                    type: 1,
                    status: 1,
                    rating: 1,
                    views: 1,
                    lastUpdated: 1,
                    episode_count: { $size: { $ifNull: ['$episodes', []] } },
                    episodes: { $slice: ['$episodes', -3] }
                }
            }
        ]);

        const animes = formatAnimeList(animesRaw);

        return NextResponse.json({
            success: true,
            data: animes,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                perPage: limit,
            }
        });

    } catch (err) {
        console.error('Anime-list API Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
