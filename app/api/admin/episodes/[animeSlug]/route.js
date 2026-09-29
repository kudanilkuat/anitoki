import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Episode from '@/lib/models/Episode';
import Anime from '@/lib/models/Anime';
import { isAdminUID } from '@/lib/admin';
import { slugify } from '@/lib/slug';

export const dynamic = 'force-dynamic';

const ADMIN_HEADER = 'x-admin-uid';
const unauthorized = NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });

function ensureAdmin(request) {
    const adminId = request.headers.get(ADMIN_HEADER);
    if (!isAdminUID(adminId)) return { ok: false, response: unauthorized };
    return { ok: true };
}

// GET /api/admin/episodes/[animeSlug] — list all Episode docs for an anime
export async function GET(request, { params }) {
    const auth = ensureAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        await connectDB();
        const episodes = await Episode.find({ animeSlug: params.animeSlug })
            .sort({ episodeIndex: 1 })
            .lean();

        return NextResponse.json({ success: true, data: episodes });
    } catch (err) {
        console.error('Admin Episodes GET Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// POST /api/admin/episodes/[animeSlug] — create a new Episode doc
export async function POST(request, { params }) {
    const auth = ensureAdmin(request);
    if (!auth.ok) return auth.response;

    let body;
    try { body = await request.json(); } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    try {
        await connectDB();

        const animeSlug = params.animeSlug;

        // Verify anime exists
        const anime = await Anime.findOne({ slug: animeSlug }).lean();
        if (!anime) {
            return NextResponse.json({ success: false, message: 'Anime not found' }, { status: 404 });
        }

        const episodeSlug = slugify(body.episodeSlug || body.title || '');
        if (!episodeSlug) {
            return NextResponse.json({ success: false, message: 'episodeSlug or title is required' }, { status: 400 });
        }

        // Check duplicate
        const existing = await Episode.findOne({ animeSlug, episodeSlug }).lean();
        if (existing) {
            return NextResponse.json({ success: false, message: 'Episode slug already exists for this anime' }, { status: 409 });
        }

        const servers = Array.isArray(body.servers)
            ? body.servers.map((s, i) => ({ name: s.name || `Server ${i + 1}`, url: s.url || '' })).filter(s => s.url)
            : [];

        const downloads = Array.isArray(body.downloads)
            ? body.downloads
                .filter(d => d.quality && Array.isArray(d.links) && d.links.length)
                .map(d => ({
                    quality: (d.quality || '').trim(),
                    size: (d.size || '').trim(),
                    links: d.links
                        .filter(l => l.name && l.url)
                        .map(l => ({ name: l.name.trim(), url: l.url.trim() })),
                }))
            : [];

        const episodeIndex = Number(body.episodeIndex) || 0;

        const episode = await Episode.create({
            animeSlug,
            episodeSlug,
            title: (body.title || '').trim(),
            episodeIndex,
            servers,
            downloads,
            prevSlug: (body.prevSlug || '').trim() || undefined,
            nextSlug: (body.nextSlug || '').trim() || undefined,
        });

        // Also upsert episode entry in Anime.episodes array
        await Anime.updateOne(
            { slug: animeSlug, 'episodes.slug': { $ne: episodeSlug } },
            {
                $push: {
                    episodes: {
                        title: episode.title,
                        slug: episodeSlug,
                        airDate: (body.airDate || '').trim(),
                    }
                },
                $set: { lastUpdated: new Date() }
            }
        );

        return NextResponse.json({ success: true, data: episode });
    } catch (err) {
        console.error('Admin Create Episode Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
