import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { isAdminUID } from '@/lib/admin';

const USER_ESSENTIAL_FIELDS = 'googleId email displayName photoURL isAdmin isPremium premiumUntil bio dailyDownloads';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { googleId, email, displayName, photoURL } = body;

        if (!googleId) {
            return NextResponse.json({ success: false, message: 'googleId is required' }, { status: 400 });
        }

        const isUserAdmin = isAdminUID(googleId);
        const today = new Date().toISOString().split('T')[0];

        // Pisahkan $set dan $setOnInsert agar tidak ada field yang sama di keduanya.
        // isPremium HANYA ada di $setOnInsert (saat insert baru).
        // Untuk user admin yang sudah ada, isPremium di-set via updateOne terpisah di bawah.
        const user = await User.findOneAndUpdate(
            { googleId },
            {
                $set: {
                    isAdmin: isUserAdmin,
                    ...(displayName  && { displayName }),
                    ...(photoURL     && { photoURL }),
                    ...(email        && { email }),
                },
                $setOnInsert: {
                    googleId,
                    isPremium:      isUserAdmin,
                    dailyDownloads: { date: today, count: 0 },
                },
            },
            { returnDocument: 'after', upsert: true, runValidators: false }
        ).lean();

        // Pastikan admin selalu isPremium = true (untuk user yang sudah exist sebelumnya)
        if (isUserAdmin && !user.isPremium) {
            await User.updateOne({ googleId }, { $set: { isPremium: true } });
            user.isPremium = true;
        }

        if (!isUserAdmin && user.isPremium && user.premiumUntil && new Date() > user.premiumUntil) {
            await User.updateOne({ googleId }, { $set: { isPremium: false, premiumUntil: null } });
            user.isPremium    = false;
            user.premiumUntil = null;
        }

        if (user.dailyDownloads?.date && user.dailyDownloads.date !== today) {
            await User.updateOne({ googleId }, { $set: { 'dailyDownloads.date': today, 'dailyDownloads.count': 0 } });
            user.dailyDownloads = { date: today, count: 0 };
        }

        return NextResponse.json({
            success: true,
            data: {
                googleId:       user.googleId,
                email:          user.email,
                displayName:    user.displayName,
                photoURL:       user.photoURL,
                isAdmin:        user.isAdmin,
                isPremium:      user.isPremium,
                premiumUntil:   user.premiumUntil,
                bio:            user.bio,
                dailyDownloads: user.dailyDownloads,
                downloadCount:  user.downloadCount,
                totalReadingMinutes: user.totalReadingMinutes || 0,
            }
        });
    } catch (err) {
        console.error('User Sync Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
