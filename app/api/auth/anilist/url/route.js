import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const returnTo = searchParams.get('returnTo') || '/';

        if (!uid) {
            return NextResponse.json({ success: false, message: 'UID user diperlukan' }, { status: 400 });
        }

        const clientId = process.env.ANILIST_CLIENT_ID || process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json({
                success: false,
                message: 'ANILIST_CLIENT_ID belum dikonfigurasi di file .env'
            }, { status: 500 });
        }

        // Encode state to preserve user session & return URL across the OAuth redirect
        const statePayload = {
            uid,
            returnTo,
            nonce: Math.random().toString(36).substring(7),
        };
        const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

        const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&state=${encodeURIComponent(state)}`;

        return NextResponse.json({
            success: true,
            url: authUrl,
        });
    } catch (err) {
        console.error('AniList Auth URL Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
