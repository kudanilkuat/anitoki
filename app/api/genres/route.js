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

        const genres = await Anime.aggregate([
            { $match: matchCondition },
            { $unwind: '$genres' },
            { $match: { genres: { $ne: '' } } },
            { $group: { _id: '$genres', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Filter explicit keywords from the returned list if not includeAdult
        const filteredGenres = includeAdult
            ? genres
            : genres.filter(g => !EXCLUDED_GENRES.has((g._id || '').toLowerCase()));

        return NextResponse.json({
            success: true,
            data: {
                genres: filteredGenres.map(g => ({ name: g._id, count: g.count })),
                themes: [],
                demographics: []
            }
        });
    } catch (err) {
        console.error('Genres API Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
