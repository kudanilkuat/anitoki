import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Anime from '@/lib/models/Anime';
import { isAdminUID } from '@/lib/admin';
import { findBestAniListMatch, getAniListById, mapAniListToAnime, searchAniList } from '@/lib/anilist';

export const dynamic = 'force-dynamic';

const ADMIN_HEADER = 'x-admin-uid';
const unauthorized = NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });

function ensureAdmin(request, body) {
  const adminId = request.headers.get(ADMIN_HEADER) || body?.adminId;
  if (!isAdminUID(adminId)) {
    return { ok: false, response: unauthorized };
  }
  return { ok: true, adminId };
}

/**
 * GET: Search AniList or preview sync for an anime
 * Query params:
 *   ?q=search-query
 *   ?slug=anime-slug
 */
export async function GET(request) {
  const auth = ensureAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const slug = searchParams.get('slug');

  try {
    if (slug) {
      await connectDB();
      const anime = await Anime.findOne({ slug }).lean();
      if (!anime) {
        return NextResponse.json({ success: false, message: 'Anime not found in DB' }, { status: 404 });
      }

      const match = await findBestAniListMatch({
        title: anime.title,
        nativeTitle: anime.nativeTitle,
        slug: anime.slug,
        anilistId: anime.anilistId,
      });

      if (!match) {
        return NextResponse.json({
          success: false,
          message: 'No AniList match found',
          animeTitle: anime.title,
        });
      }

      const mapped = mapAniListToAnime(match, anime);
      return NextResponse.json({
        success: true,
        current: anime,
        anilistMatch: match,
        previewMapped: mapped,
      });
    }

    if (q) {
      const results = await searchAniList(q, 1, 8);
      return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json({ success: false, message: 'Missing "q" or "slug" query parameter' }, { status: 400 });
  } catch (err) {
    console.error('AniList Search API Error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST: Execute sync with AniList
 * Body options:
 *   1) Single sync: { slug: string, anilistId?: number, overwriteCover?: boolean, overwriteSynopsis?: boolean }
 *   2) Batch sync: { action: 'batch', filter: 'no-rating' | 'empty-genres' | 'no-banner' | 'all', limit?: number }
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const auth = ensureAdmin(request, body);
  if (!auth.ok) return auth.response;

  try {
    await connectDB();

    // ─── BATCH SYNC ───────────────────────────────────────────────────────────
    if (body.action === 'batch') {
      const filter = body.filter || 'no-rating';
      const limit = Math.min(Math.max(parseInt(body.limit || '20', 10), 1), 50);

      const query = {};
      if (filter === 'no-rating') {
        query.$or = [{ rating: 0 }, { rating: null }, { rating: { $exists: false } }];
      } else if (filter === 'empty-genres') {
        query.genres = '';
      } else if (filter === 'no-banner') {
        query.$or = [{ bannerImage: null }, { bannerImage: '' }, { bannerImage: { $exists: false } }];
      } else if (filter === 'ongoing-no-banner') {
        query.status = { $regex: 'ongoing|airing', $options: 'i' };
        query.$or = [{ bannerImage: null }, { bannerImage: '' }, { bannerImage: { $exists: false } }];
      } else if (filter === 'ongoing') {
        query.status = { $regex: 'ongoing|airing', $options: 'i' };
      }

      const animes = await Anime.find(query).limit(limit).lean();
      const results = [];

      for (const item of animes) {
        try {
          const match = await findBestAniListMatch({
            title: item.title,
            nativeTitle: item.nativeTitle,
            slug: item.slug,
            anilistId: item.anilistId,
          });

          if (match) {
            const mapped = mapAniListToAnime(match, item, {
              overwriteCover: !!body.overwriteCover,
              preserveIndonesianSynopsis: !body.overwriteSynopsis,
            });

            await Anime.updateOne({ _id: item._id }, { $set: mapped });
            results.push({
              slug: item.slug,
              title: item.title,
              success: true,
              anilistId: match.id,
              rating: mapped.rating,
              bannerAdded: !!mapped.bannerImage,
            });
          } else {
            // If empty genres filter, clean genres array even if not matched
            if (filter === 'empty-genres' && Array.isArray(item.genres) && item.genres.includes('')) {
              const cleaned = item.genres.map(g => (g || '').trim()).filter(Boolean);
              await Anime.updateOne({ _id: item._id }, { $set: { genres: cleaned } });
            }
            results.push({
              slug: item.slug,
              title: item.title,
              success: false,
              message: 'No match on AniList',
            });
          }
        } catch (e) {
          results.push({
            slug: item.slug,
            title: item.title,
            success: false,
            message: e.message,
          });
        }
      }

      return NextResponse.json({
        success: true,
        totalRequested: animes.length,
        synced: results.filter(r => r.success).length,
        results,
      });
    }

    // ─── SINGLE ANIME SYNC ────────────────────────────────────────────────────
    const { slug, anilistId, overwriteCover = false, overwriteSynopsis = false } = body;
    if (!slug) {
      return NextResponse.json({ success: false, message: 'Missing "slug" parameter' }, { status: 400 });
    }

    const currentAnime = await Anime.findOne({ slug });
    if (!currentAnime) {
      return NextResponse.json({ success: false, message: 'Anime not found' }, { status: 404 });
    }

    let match = null;
    if (anilistId) {
      match = await getAniListById(anilistId);
    } else {
      match = await findBestAniListMatch({
        title: currentAnime.title,
        nativeTitle: currentAnime.nativeTitle,
        slug: currentAnime.slug,
        anilistId: currentAnime.anilistId,
      });
    }

    if (!match) {
      return NextResponse.json({
        success: false,
        message: 'Could not find a matching anime on AniList',
      }, { status: 404 });
    }

    const updatePayload = mapAniListToAnime(match, currentAnime.toObject(), {
      overwriteCover,
      preserveIndonesianSynopsis: !overwriteSynopsis,
    });

    const updatedAnime = await Anime.findOneAndUpdate(
      { slug },
      { $set: updatePayload },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil sinkronisasi dengan AniList (${match.title?.romaji || match.title?.english})`,
      data: updatedAnime,
      anilistMatch: {
        id: match.id,
        idMal: match.idMal,
        title: match.title,
        averageScore: match.averageScore,
        format: match.format,
        status: match.status,
      },
    });
  } catch (err) {
    console.error('AniList Sync API Error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
