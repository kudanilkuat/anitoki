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

// GET /api/admin/episodes/[animeSlug]/[episodeSlug]
export async function GET(request, { params }) {
    const auth = ensureAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        await connectDB();
        const episode = await Episode.findOne({
            animeSlug: params.animeSlug,
            episodeSlug: params.episodeSlug,
        }).lean();

        if (!episode) {
            return NextResponse.json({ success: false, message: 'Episode not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: episode });
    } catch (err) {
        console.error('Admin Get Episode Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// PUT /api/admin/episodes/[animeSlug]/[episodeSlug]
export async function PUT(request, { params }) {
    const auth = ensureAdmin(request);
    if (!auth.ok) return auth.response;

    let body;
    try { body = await request.json(); } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    try {
        await connectDB();

        const { animeSlug, episodeSlug } = params;

        const episode = await Episode.findOne({ animeSlug, episodeSlug });
        if (!episode) {
            return NextResponse.json({ success: false, message: 'Episode not found' }, { status: 404 });
        }

        const update = { $set: {} };

        if (body.title !== undefined) update.$set.title = (body.title || '').trim();
        if (body.episodeIndex !== undefined) update.$set.episodeIndex = Number(body.episodeIndex) || 0;
        if (body.prevSlug !== undefined) update.$set.prevSlug = (body.prevSlug || '').trim() || undefined;
        if (body.nextSlug !== undefined) update.$set.nextSlug = (body.nextSlug || '').trim() || undefined;

        if (Array.isArray(body.servers)) {
            update.$set.servers = body.servers
                .map((s, i) => ({ name: s.name || `Server ${i + 1}`, url: s.url || '' }))
                .filter(s => s.url);
        }

        if (Array.isArray(body.downloads)) {
            update.$set.downloads = body.downloads
                .filter(d => d.quality && Array.isArray(d.links) && d.links.length)
                .map(d => ({
                    quality: (d.quality || '').trim(),
                    size: (d.size || '').trim(),
                    links: d.links
                        .filter(l => l.name && l.url)
                        .map(l => ({ name: l.name.trim(), url: l.url.trim() })),
                }));
        }

        // Handle episodeSlug rename
        const newEpisodeSlug = body.episodeSlug ? slugify(body.episodeSlug) : episodeSlug;
        if (newEpisodeSlug && newEpisodeSlug !== episodeSlug) {
            const conflict = await Episode.findOne({ animeSlug, episodeSlug: newEpisodeSlug });
            if (conflict) {
                return NextResponse.json({ success: false, message: 'New episodeSlug already exists' }, { status: 409 });
            }
            update.$set.episodeSlug = newEpisodeSlug;
        }

        const updated = await Episode.findOneAndUpdate(
            { animeSlug, episodeSlug },
            update,
            { new: true }
        );

        // Sync title/airDate back to Anime.episodes array entry
        if (body.title !== undefined || body.airDate !== undefined) {
            await Anime.updateOne(
                { slug: animeSlug, 'episodes.slug': episodeSlug },
                {
                    $set: {
                        ...(body.title !== undefined && { 'episodes.$.title': (body.title || '').trim() }),
                        ...(body.airDate !== undefined && { 'episodes.$.airDate': (body.airDate || '').trim() }),
                        lastUpdated: new Date(),
                    }
                }
            );
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (err) {
        console.error('Admin Update Episode Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// DELETE /api/admin/episodes/[animeSlug]/[episodeSlug]
export async function DELETE(request, { params }) {
    const auth = ensureAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        await connectDB();

        const { animeSlug, episodeSlug } = params;

        const deleted = await Episode.findOneAndDelete({ animeSlug, episodeSlug });
        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Episode not found' }, { status: 404 });
        }

        // Remove from Anime.episodes array too
        await Anime.updateOne(
            { slug: animeSlug },
            {
                $pull: { episodes: { slug: episodeSlug } },
                $set: { lastUpdated: new Date() },
            }
        );

        return NextResponse.json({ success: true, message: 'Episode deleted' });
    } catch (err) {
        console.error('Admin Delete Episode Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
