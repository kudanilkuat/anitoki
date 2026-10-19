import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Anime from '@/lib/models/Anime';
import { saveMediaProgress, findBestAniListMatch } from '@/lib/anilist';

// Helper to extract episode number from title or slug if needed
function parseEpisodeNumber(num, title, slug) {
    if (typeof num === 'number' && !isNaN(num) && num > 0) {
        return num;
    }
    if (typeof num === 'string' && !isNaN(Number(num)) && Number(num) > 0) {
        return Number(num);
    }
    // Try extract from title e.g. "Episode 12", "Ep 12", "12"
    if (title) {
        const match = title.match(/(?:episode|ep\.?|ke-?)\s*(\d+)/i) || title.match(/\b(\d+)\b/);
        if (match && match[1]) return parseInt(match[1], 10);
    }
    // Try extract from slug e.g. "frieren-episode-12"
    if (slug) {
        const match = slug.match(/(?:episode|ep)-(\d+)/i) || slug.match(/-(\d+)$/);
        if (match && match[1]) return parseInt(match[1], 10);
    }
    return 1;
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { uid, animeSlug, episodeNumber, episodeTitle, episodeSlug, status } = body;

        if (!uid) {
            return NextResponse.json({ success: false, message: 'User ID diperlukan' }, { status: 400 });
        }

        const user = await User.findOne({ googleId: uid });
        if (!user || !user.anilist?.accessToken) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'Akun AniList belum terhubung',
            }, { status: 401 });
        }

        let anilistId = body.anilistId ? Number(body.anilistId) : null;
        let anime = null;

        if (animeSlug) {
            anime = await Anime.findOne({ slug: animeSlug });
            if (anime && !anilistId && anime.anilistId) {
                anilistId = anime.anilistId;
            }
        }

        // If anime found but no anilistId stored yet, perform smart match & persist it
        if (anime && !anilistId) {
            try {
                const match = await findBestAniListMatch({
                    title: anime.title,
                    nativeTitle: anime.nativeTitle,
                    slug: anime.slug,
                    type: anime.type,
                    totalEpisode: anime.totalEpisode,
                });
                if (match?.id) {
                    anilistId = match.id;
                    anime.anilistId = match.id;
                    if (!anime.bannerImage && match.bannerImage) anime.bannerImage = match.bannerImage;
                    await anime.save();
                }
            } catch (matchErr) {
                console.warn('[AniList Match Warning]:', matchErr.message);
            }
        }

        if (!anilistId) {
            return NextResponse.json({
                success: false,
                message: 'Tidak dapat menemukan ID anime di database AniList untuk judul ini',
            }, { status: 404 });
        }

        const epNum = parseEpisodeNumber(episodeNumber, episodeTitle, episodeSlug);

        // Determine status: if reached or passed total episode, mark COMPLETED, otherwise CURRENT
        let targetStatus = status || 'CURRENT';
        if (!status && anime?.totalEpisode && epNum >= anime.totalEpisode) {
            targetStatus = 'COMPLETED';
        }

        try {
            const result = await saveMediaProgress(user.anilist.accessToken, {
                mediaId: anilistId,
                progress: epNum,
                status: targetStatus,
            });

            return NextResponse.json({
                success: true,
                synced: true,
                entry: result,
                progress: epNum,
                status: targetStatus,
                mediaId: anilistId,
                userName: user.anilist.userName,
            });
        } catch (apiErr) {
            if (apiErr.message === 'UNAUTHORIZED_TOKEN') {
                // Invalidate local stored token so user can re-auth
                user.anilist.accessToken = null;
                await user.save();
                return NextResponse.json({
                    success: false,
                    unauthorized: true,
                    connected: false,
                    message: 'Sesi AniList telah kedaluwarsa. Silakan hubungkan kembali.',
                }, { status: 401 });
            }
            throw apiErr;
        }
    } catch (err) {
        console.error('[AniList Sync Error]:', err);
        return NextResponse.json({
            success: false,
            message: err.message || 'Gagal menyinkronkan ke AniList',
        }, { status: 500 });
    }
}
