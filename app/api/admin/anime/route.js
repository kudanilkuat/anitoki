import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';
import { isAdminUID } from '@/lib/admin';
import { getPaginationParams } from '@/lib/api-helpers';
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

            return {
                title,
                slug,
                airDate,
            };
        })
        .filter(Boolean);
};

const buildCreatePayload = (body, slug) => {
    const genres = normalizeGenres(body.genres);
    const episodes = normalizeEpisodes(body.episodes);

    return {
        title: (body.title || '').trim(),
        nativeTitle: (body.nativeTitle || '').trim(),
        slug,
        coverImage: (body.coverImage || '').trim(),
        bannerImage: (body.bannerImage || '').trim() || undefined,
        type: (body.type || 'Anime').trim(),
        rating: toNumber(body.rating, 0),
        views: toNumber(body.views, 0),
        status: (body.status || '').trim(),
        airDate: (body.airDate || '').trim(),
        producer: (body.producer || '').trim(),
        studio: (body.studio || '').trim(),
        duration: (body.duration || '').trim(),
        totalEpisode: toNumber(body.totalEpisode, 0),
        synopsis: (body.synopsis || '').trim(),
        sourceUrl: (body.sourceUrl || '').trim() || undefined,
        genres,
        episodes,
        createdAt: body.createdAt ? new Date(body.createdAt) : (body.datePublished ? new Date(body.datePublished) : new Date()),
        lastUpdated: body.lastUpdated ? new Date(body.lastUpdated) : (body.dateModified ? new Date(body.dateModified) : (body.datePublished ? new Date(body.datePublished) : new Date())),
    };
};

function ensureAdmin(request, body) {
    const adminId = request.headers.get(ADMIN_HEADER) || body?.adminId;
    if (!isAdminUID(adminId)) {
        return { ok: false, response: unauthorized };
    }
    return { ok: true, adminId };
}

export async function GET(request) {
    const auth = ensureAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = getPaginationParams(searchParams, 20);
        const q = searchParams.get('q')?.trim();

        const query = {};
        if (q) {
            query.title = { $regex: q, $options: 'i' };
        }

        const total = await Anime.countDocuments(query);
        const list = await Anime.find(query)
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(limit)
            .select('title slug coverImage type status rating views lastUpdated episodes')
            .lean();

        const data = list.map((m) => ({
            _id: m._id,
            title: m.title,
            slug: m.slug,
            coverImage: m.coverImage,
            type: m.type,
            status: m.status,
            rating: m.rating,
            views: m.views || 0,
            lastUpdated: m.lastUpdated,
            episodeCount: Array.isArray(m.episodes) ? m.episodes.length : 0,
        }));

        return NextResponse.json({
            success: true,
            data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                perPage: limit,
            },
        });
    } catch (err) {
        console.error('Admin Anime List Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(request) {
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

        const baseSlug = body.slug || body.title;
        const slug = slugify(baseSlug || '');
        if (!body.title || !slug) {
            return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
        }

        const existing = await Anime.findOne({ slug }).lean();
        if (existing) {
            return NextResponse.json({ success: false, message: 'Slug already exists' }, { status: 409 });
        }

        const payload = buildCreatePayload(body, slug);
        const created = await Anime.create(payload);

        return NextResponse.json({ success: true, data: created });
    } catch (err) {
        console.error('Admin Create Anime Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
