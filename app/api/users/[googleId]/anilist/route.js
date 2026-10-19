import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { googleId } = params;

        const user = await User.findOne({ googleId })
            .select('anilist')
            .lean();

        if (!user) {
            return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
        }

        const isConnected = !!(user.anilist?.accessToken);

        return NextResponse.json({
            success: true,
            connected: isConnected,
            anilist: isConnected ? {
                userId: user.anilist.userId,
                userName: user.anilist.userName,
                avatar: user.anilist.avatar,
                autoSync: user.anilist.autoSync !== false,
                connectedAt: user.anilist.connectedAt,
            } : null,
        });
    } catch (err) {
        console.error('Get AniList Status Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        await connectDB();
        const { googleId } = params;
        const body = await request.json();

        // Disconnect AniList
        if (body.disconnect) {
            await User.findOneAndUpdate(
                { googleId },
                {
                    $set: {
                        anilist: {
                            accessToken: null,
                            userId: null,
                            userName: null,
                            avatar: null,
                            connectedAt: null,
                            autoSync: true,
                        }
                    }
                }
            );

            return NextResponse.json({
                success: true,
                message: 'Koneksi akun AniList berhasil diputuskan',
                connected: false,
            });
        }

        // Toggle autoSync
        if (typeof body.autoSync === 'boolean') {
            await User.findOneAndUpdate(
                { googleId },
                { $set: { 'anilist.autoSync': body.autoSync } }
            );

            return NextResponse.json({
                success: true,
                autoSync: body.autoSync,
            });
        }

        return NextResponse.json({ success: false, message: 'Aksi tidak valid' }, { status: 400 });
    } catch (err) {
        console.error('Update AniList Settings Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
