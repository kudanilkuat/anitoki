import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';
import { isAdminUID } from '@/lib/admin';
import { slugify } from '@/lib/slug';

export const dynamic = 'force-dynamic';

const ADMIN_HEADER = 'x-admin-uid';
const unauthorized = NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });

const toNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const normalizeGenres = (genres) => {
    if (Array.isArray(genres)) {
        return genres.map(g => (g || '').toString().trim()).filter(Boolean);
    }
    if (typeof genres === 'string') {
        return genres
            .split(',')
            .map(g => g.trim())
            .filter(Boolean);
    }
    return [];
};

const normalizeEpisodes = (episodes) => {
    if (!Array.isArray(episodes)) return [];

    return episodes
        .map((e) => {
            const title = (e?.title || '').toString().trim();
            const slug = slugify(e?.slug || title);
            const airDate = (e?.airDate || '').toString().trim();

            if (!title && !slug) return null;

            return { title, slug, airDate };
        })
        .filter(Boolean);
};

function ensureAdmin(request, body) {
    const adminId = request.headers.get(ADMIN_HEADER) || body?.adminId;
    if (!isAdminUID(adminId)) {
        return { ok: false, response: unauthorized };
    }
    return { ok: true, adminId };
}

const buildUpdatePayload = (body, slug) => {
    const update = { lastUpdated: new Date() };

    if (body.title !== undefined) update.title = (body.title || '').trim();
    if (body.nativeTitle !== undefined) update.nativeTitle = (body.nativeTitle || '').trim();
    if (slug) update.slug = slug;
    if (body.coverImage !== undefined) update.coverImage = (body.coverImage || '').trim();
    if (body.bannerImage !== undefined) update.bannerImage = (body.bannerImage || '').trim();
    if (body.type !== undefined) update.type = (body.type || 'Anime').trim();
    if (body.rating !== undefined) update.rating = toNumber(body.rating, 0);
    if (body.views !== undefined) update.views = toNumber(body.views, 0);
    if (body.status !== undefined) update.status = (body.status || '').trim();
    if (body.airDate !== undefined) update.airDate = (body.airDate || '').trim();
    if (body.producer !== undefined) update.producer = (body.producer || '').trim();
    if (body.studio !== undefined) update.studio = (body.studio || '').trim();
    if (body.duration !== undefined) update.duration = (body.duration || '').trim();
    if (body.totalEpisode !== undefined) update.totalEpisode = toNumber(body.totalEpisode, 0);
    if (body.synopsis !== undefined) update.synopsis = (body.synopsis || '').trim();
    if (body.synopsisEn !== undefined) update.synopsisEn = (body.synopsisEn || '').trim();
    if (body.sourceUrl !== undefined) update.sourceUrl = (body.sourceUrl || '').trim() || undefined;
    if (body.genres !== undefined) update.genres = normalizeGenres(body.genres);
    if (body.episodes !== undefined) update.episodes = normalizeEpisodes(body.episodes);
    if (body.anilistId !== undefined) update.anilistId = toNumber(body.anilistId, null);
    if (body.malId !== undefined) update.malId = toNumber(body.malId, null);
    if (body.englishTitle !== undefined) update.englishTitle = (body.englishTitle || '').trim();
    if (body.romajiTitle !== undefined) update.romajiTitle = (body.romajiTitle || '').trim();
    if (body.season !== undefined) update.season = (body.season || '').trim();
    if (body.seasonYear !== undefined) update.seasonYear = toNumber(body.seasonYear, null);
    if (body.color !== undefined) update.color = (body.color || '').trim();
    if (body.createdAt !== undefined) update.createdAt = new Date(body.createdAt);
    if (body.lastUpdated !== undefined) update.lastUpdated = new Date(body.lastUpdated);

    return update;
};

export async function GET(request, { params }) {
    const auth = ensureAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        await connectDB();
        const anime = await Anime.findOne({ slug: params.slug }).lean();
        if (!anime) {
            return NextResponse.json({ success: false, message: 'Anime not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: anime });
    } catch (err) {
        console.error('Admin Get Anime Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const auth = ensureAdmin(request, {});
    if (!auth.ok) return auth.response;

    try {
        await connectDB();

        const deletedAnime = await Anime.findOneAndDelete({ slug: params.slug });
        if (!deletedAnime) {
            return NextResponse.json({ success: false, message: 'Anime not found' }, { status: 404 });
        }

        // Delete all associated Episode documents for this anime
        import('@/lib/models/Episode').then(async ({ default: Episode }) => {
            try {
                await Episode.deleteMany({ animeSlug: params.slug });
            } catch (e) {
                console.error('Error deleting associated episodes:', e);
            }
        });

        return NextResponse.json({ success: true, message: 'Anime and associated episodes deleted' });
    } catch (err) {
        console.error('Admin Delete Anime Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    let body;
    try {
        body = await request.json();
    } catch (err) {
        return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    const auth = ensureAdmin(request, body);
    if (!auth.ok) return auth.response;

    try {
        await connectDB();
        const current = await Anime.findOne({ slug: params.slug });
        if (!current) {
            return NextResponse.json({ success: false, message: 'Anime not found' }, { status: 404 });
        }

        const nextSlug = slugify(body.slug || body.title || params.slug);
        if (!nextSlug) {
            return NextResponse.json({ success: false, message: 'Slug tidak valid' }, { status: 400 });
        }

        if (nextSlug !== params.slug) {
            const conflict = await Anime.findOne({ slug: nextSlug });
            if (conflict) {
                return NextResponse.json({ success: false, message: 'Slug already exists' }, { status: 409 });
            }
        }

        const payload = buildUpdatePayload(body, nextSlug);
        const updated = await Anime.findOneAndUpdate(
            { slug: params.slug },
            payload,
            { new: true }
        );

        return NextResponse.json({ success: true, data: updated });
    } catch (err) {
        console.error('Admin Update Anime Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
