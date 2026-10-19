import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';

export const dynamic = 'force-dynamic';

// Explicit adult / NSFW keywords that must NEVER be exposed to Google SafeSearch on public /genres
const EXCLUDED_GENRES = new Set([
    'hentai', 'blowjob', 'creampie', 'oral', 'milf', 'big oppai',
    'housewife', 'uncensored', 'netorare', 'ntr', 'rape', 'forced',
    'ahegao', 'anal', 'gangbang', 'paizuri', 'virgin', 'humiliation',
    'monster', 'tentacles', 'incest', 'bondage', 'bdsm', 'erotica',
    'yuri', 'yaoi', 'futanari', 'masturbation', 'cumshot', 'censored'
]);

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const includeAdult = searchParams.get('includeAdult') === 'true';

        // Filter out anime of type Hentai unless explicitly requested
        const matchCondition = includeAdult
            ? { genres: { $ne: '' } }
            : { type: { $ne: 'Hentai' }, genres: { $ne: '' } };

        const typeCondition = includeAdult
            ? { type: { $nin: [null, ''] } }
            : { type: { $nin: [null, '', 'Hentai', 'hentai'] } };

        const statusCondition = includeAdult
            ? { status: { $nin: [null, ''] } }
            : { type: { $nin: ['Hentai', 'hentai'] }, status: { $nin: [null, ''] } };

        const [genres, types, statuses] = await Promise.all([
            Anime.aggregate([
                { $match: matchCondition },
                { $unwind: '$genres' },
                { $match: { genres: { $nin: [null, ''] } } },
                { $group: { _id: '$genres', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Anime.aggregate([
                { $match: typeCondition },
                { $group: { _id: '$type', count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } }
            ]),
            Anime.aggregate([
                { $match: statusCondition },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } }
            ])
        ]);

        // Filter explicit keywords from the returned list if not includeAdult
        const filteredGenres = includeAdult
            ? genres
            : genres.filter(g => !EXCLUDED_GENRES.has((g._id || '').toLowerCase()));

        const filteredTypes = types
            .filter(t => t._id && typeof t._id === 'string' && t._id.trim() !== '')
            .map(t => ({
                name: t._id.trim(),
                value: t._id.trim(),
                label: t._id.trim(),
                count: t.count
            }));

        const filteredStatuses = statuses
            .filter(s => s._id && typeof s._id === 'string' && s._id.trim() !== '')
            .map(s => ({
                name: s._id.trim(),
                value: s._id.trim(),
                label: s._id.trim(),
                count: s.count
            }));

        return NextResponse.json({
            success: true,
            data: {
                genres: filteredGenres.map(g => ({ name: g._id, count: g.count })),
                types: filteredTypes,
                statuses: filteredStatuses,
                themes: [],
                demographics: []
            }
        });
    } catch (err) {
        console.error('Genres API Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
