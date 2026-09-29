import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

const USER_ESSENTIAL_FIELDS = 'googleId email displayName photoURL isAdmin isPremium premiumUntil bio dailyDownloads';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { googleId } = params;

        const user = await User.findOne({ googleId })
            .select(USER_ESSENTIAL_FIELDS + ' downloadCount')
            .lean();

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user });
    } catch (err) {
        console.error('User Detail GET Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
