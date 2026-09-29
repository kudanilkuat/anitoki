import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

const getPaginationParams = (searchParams, defaultLimit = 20) => {
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.max(1, parseInt(searchParams.get('limit')) || defaultLimit);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);

        const { page, limit, skip } = getPaginationParams(searchParams, 20);
        const q = searchParams.get('q');

        const matchStage = {};
        if (q && q.trim()) {
            matchStage.displayName = { $regex: q.trim(), $options: 'i' };
        }

        const pipeline = [
            ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
            { $sort: { _id: -1 } },
            {
                $group: {
                    _id:         '$googleId',
                    displayName: { $first: '$displayName' },
                    photoURL:    { $first: '$photoURL' },
                    bio:         { $first: '$bio' },
                    isPremium:   { $first: '$isPremium' },
                    isAdmin:     { $first: '$isAdmin' },
                    library:     { $first: '$library' },
                }
            },
            { $sort: { _id: -1 } },
        ];

        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await User.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        const users = await User.aggregate([
            ...pipeline,
            { $skip: skip },
            { $limit: limit },
        ]);

        const formatted = users.map(u => {
            const library = u.library || [];
            const stats = library.reduce((acc, item) => {
                const s = item.mangaData?.readingStatus || 'reading';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, {});

            return {
                googleId:    u._id,
                displayName: u.displayName || 'Pengguna',
                photoURL:    u.photoURL    || '',
                bio:         u.bio         || '',
                isPremium:   u.isPremium   || false,
                isAdmin:     u.isAdmin     || false,
                stats: {
                    total:    library.length,
                    reading:  stats.reading  || 0,
                    finished: stats.finished || 0,
                    to_read:  stats.to_read  || 0,
                    dropped:  stats.dropped  || 0,
                }
            };
        });

        return NextResponse.json({
            success: true,
            data: formatted,
            pagination: {
                currentPage: page,
                totalPages:  Math.ceil(total / limit),
                totalItems:  total,
                perPage:     limit
            }
        });
    } catch (err) {
        console.error('API Users Array Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
