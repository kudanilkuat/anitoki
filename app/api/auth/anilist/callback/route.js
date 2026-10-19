import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { exchangeAniListCode, getAniListViewer } from '@/lib/anilist';

function buildReturnUrl(baseReturnTo, params = {}) {
    try {
        const url = new URL(baseReturnTo, 'http://localhost');
        for (const [key, val] of Object.entries(params)) {
            if (val !== undefined && val !== null) {
                url.searchParams.set(key, val);
            }
        }
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return baseReturnTo || '/';
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateStr = searchParams.get('state');
    const oauthError = searchParams.get('error') || searchParams.get('error_description');

    let state = {};
    if (stateStr) {
        try {
            state = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf8'));
        } catch {
            state = {};
        }
    }

    const returnTo = state.returnTo || '/';
    const uid = state.uid;

    if (oauthError) {
        console.warn('[AniList OAuth Error]:', oauthError);
        const destination = buildReturnUrl(returnTo, { anilist_error: oauthError });
        return NextResponse.redirect(new URL(destination, request.url));
    }

    if (!code || !uid) {
        const destination = buildReturnUrl(returnTo, { anilist_error: 'missing_code_or_user' });
        return NextResponse.redirect(new URL(destination, request.url));
    }

    try {
        await connectDB();

        // Determine redirectUri for token exchange (matches whatever URL path received the callback)
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
        const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
        const pathname = new URL(request.url).pathname;
        const redirectUri = `${proto}://${host}${pathname}`;

        // 1. Exchange code for access_token
        const tokenData = await exchangeAniListCode(code, redirectUri);
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            throw new Error('Tidak menerima access_token dari AniList');
        }

        // 2. Fetch Viewer profile from AniList
        const viewer = await getAniListViewer(accessToken);
        if (!viewer || !viewer.id) {
            throw new Error('Gagal mengambil data profil AniList');
        }

        // 3. Save to User document in MongoDB
        const updatedUser = await User.findOneAndUpdate(
            { googleId: uid },
            {
                $set: {
                    'anilist.accessToken': accessToken,
                    'anilist.userId': viewer.id,
                    'anilist.userName': viewer.name,
                    'anilist.avatar': viewer.avatar?.large || viewer.avatar?.medium || '',
                    'anilist.connectedAt': new Date(),
                    'anilist.autoSync': true,
                }
            },
            { new: true, upsert: false }
        );

        if (!updatedUser) {
            throw new Error('User lokal tidak ditemukan di database');
        }

        const destination = buildReturnUrl(returnTo, {
            anilist_connected: 'true',
            anilist_user: viewer.name,
        });

        return NextResponse.redirect(new URL(destination, request.url));
    } catch (err) {
        console.error('[AniList Callback Exception]:', err);
        const destination = buildReturnUrl(returnTo, { anilist_error: encodeURIComponent(err.message || 'auth_failed') });
        return NextResponse.redirect(new URL(destination, request.url));
    }
}
