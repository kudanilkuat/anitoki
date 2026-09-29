import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        const genres = await Anime.aggregate([
            { $unwind: '$genres' },
            { $match: { genres: { $ne: '' } } },
            { $group: { _id: '$genres', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        return NextResponse.json({
            success: true,
            data: {
                genres: genres.map(g => ({ name: g._id, count: g.count })),
                themes: [],
                demographics: []
            }
        });
    } catch (err) {
        console.error('Genres API Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
