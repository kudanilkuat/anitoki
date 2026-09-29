import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/lib/models/Comment';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

// GET /api/comments?slug=xxx&page=1&limit=20
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const slug  = searchParams.get('slug');
        const page  = Math.max(1, parseInt(searchParams.get('page'))  || 1);
        const limit = Math.max(1, parseInt(searchParams.get('limit')) || 20);
        const skip  = (page - 1) * limit;

        if (!slug) {
            return NextResponse.json({ success: false, message: 'slug diperlukan' }, { status: 400 });
        }

        const [comments, total] = await Promise.all([
            Comment.find({ slug })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments({ slug }),
        ]);

        // Format agar sesuai struktur yang dipakai CommentList
        const formatted = comments.map(c => ({
            id: c._id.toString(),
            user: {
                id:                  c.userId,
                displayName:         c.displayName,
                photoURL:            c.photoURL,
                isPremium:           c.isPremium,
                isAdmin:             c.isAdmin,
                totalReadingMinutes: c.totalReadingMinutes,
            },
            text:      c.text,
            createdAt: c.createdAt,
        }));

        return NextResponse.json({
            success: true,
            data: formatted,
            pagination: {
                currentPage: page,
                totalPages:  Math.ceil(total / limit),
                totalItems:  total,
                perPage:     limit,
            },
        });
    } catch (err) {
        console.error('GET /api/comments error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// POST /api/comments
// Body: { slug, userId, displayName, photoURL, isPremium, isAdmin, totalReadingMinutes, text }
export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { slug, userId, displayName, photoURL, isPremium, isAdmin, totalReadingMinutes, text } = body;

        if (!slug || !userId || !text?.trim()) {
            return NextResponse.json({ success: false, message: 'slug, userId, dan text diperlukan' }, { status: 400 });
        }
        if (text.trim().length > 2000) {
            return NextResponse.json({ success: false, message: 'Komentar terlalu panjang (maks 2000 karakter)' }, { status: 400 });
        }

        // Tambah EXP (Level) setiap kali komen: +10 menit baca
        const updatedUser = await User.findOneAndUpdate(
            { googleId: userId },
            { $inc: { totalReadingMinutes: 10 } },
            { new: true }
        );

        const newTotalMinutes = updatedUser ? updatedUser.totalReadingMinutes : (totalReadingMinutes || 0);

        const comment = await Comment.create({
            slug,
            userId,
            displayName: displayName || 'Pengguna',
            photoURL:    photoURL    || '',
            isPremium:   isPremium   || false,
            isAdmin:     isAdmin     || false,
            totalReadingMinutes: newTotalMinutes,
            text: text.trim(),
        });

        return NextResponse.json({
            success: true,
            data: {
                id: comment._id.toString(),
                user: {
                    id:                  comment.userId,
                    displayName:         comment.displayName,
                    photoURL:            comment.photoURL,
                    isPremium:           comment.isPremium,
                    isAdmin:             comment.isAdmin,
                    totalReadingMinutes: comment.totalReadingMinutes,
                },
                text:      comment.text,
                createdAt: comment.createdAt,
            },
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/comments error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
