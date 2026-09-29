import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';

const formatAnimeList = (animes) => {
    return animes.map(m => {
        // $slice(-1) gives last (latest) episode in asc-sorted array
        const latestEp = m.episodes && m.episodes.length > 0 ? m.episodes[m.episodes.length - 1] : null;
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
            last_episode: latestEp ? latestEp.title : '?',
            last_episode_slug: latestEp ? latestEp.slug : ''
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
                title: 1, slug: 1, coverImage: 1, type: 1, status: 1,
                rating: 1, views: 1, lastUpdated: 1,
                episode_count: { $size: { $ifNull: ['$episodes', []] } },
                episodes: { $slice: ['$episodes', -1] }
            }
        }
    ]);
};

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { slug } = params;

        const anime = await Anime.findOneAndUpdate(
            { slug },
            { $inc: { views: 1 } },
            {
                returnDocument: 'after',
                projection: {
                    title: 1, slug: 1, coverImage: 1, type: 1, status: 1,
                    rating: 1, views: 1, lastUpdated: 1, synopsis: 1,
                    genres: 1, nativeTitle: 1, airDate: 1, producer: 1,
                    studio: 1, duration: 1, totalEpisode: 1,
                    'episodes.title': 1,
                    'episodes.slug': 1,
                    'episodes.airDate': 1,
                }
            }
        ).lean();

        if (!anime) {
            return NextResponse.json(
                { success: false, error: 'Anime not found' },
                { status: 404 }
            );
        }

        let recommendationsRaw = [];
        if (anime.genres && anime.genres.length > 0) {
            recommendationsRaw = await Anime.aggregate([
                { $match: { genres: { $in: anime.genres }, _id: { $ne: anime._id } } },
                { $sample: { size: 10 } },
                {
                    $project: {
                        title: 1, slug: 1, coverImage: 1, type: 1, status: 1,
                        rating: 1, views: 1, lastUpdated: 1,
                        episode_count: { $size: { $ifNull: ['$episodes', []] } },
                        episodes: { $slice: ['$episodes', -1] }
                    }
                }
            ]);
        }

        return NextResponse.json({
            success: true,
            data: {
                info: anime,
                recommendations: formatAnimeList(recommendationsRaw)
            }
        });

    } catch (err) {
        console.error('Anime Detail API Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
