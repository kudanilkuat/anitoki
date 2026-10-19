import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { findBestAniListMatch, mapAniListToAnime } from '@/lib/anilist';

function ensureAdmin(request) {
    const adminUid = request.headers.get('x-admin-uid');
    if (!adminUid) return false;
    return true; // Simplified for this example, replace with your actual auth logic
}

function cleanEpisodeTitle(rawTitle, animeTitle = '') {
    if (!rawTitle) return '';
    let text = rawTitle
        .replace(/\[\s*NEW\s+Release\s*\]/gi, '')
        .replace(/\[\s*4K\s*\]/gi, '')
        .replace(/\s*(?:Subtitle\s+Indonesia|Sub\s+Indo).*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    // 1. OVA (e.g. "Mangaka-san to Assistant-san to OVA 6" -> "OVA 6", "Episode OVA 01" -> "OVA 01", "11eyes OVA" -> "OVA")
    const ovaMatch = text.match(/(?:Episode\s+)?\b(OVA(?:\s+\d+)?(?:\s*\([^)]+\))?)\b/i);
    if (ovaMatch) return ovaMatch[1].trim();

    // 2. Standard Episode: Episode 1, Episode 12 (End), etc.
    const epMatch = text.match(/\bEpisode\s+\d+(?:\s*\([^)]+\))?/i);
    if (epMatch) return epMatch[0].trim();

    // 3. Special / SP
    const spMatch = text.match(/\b(?:Special|SP)(?:\s+\d+)?(?:\s*\([^)]+\))?/i);
    if (spMatch) return spMatch[0].trim();

    // 4. ONA
    const onaMatch = text.match(/\bONA(?:\s+\d+)?(?:\s*\([^)]+\))?/i);
    if (onaMatch) return onaMatch[0].trim();

    // 5. Movie
    const movieMatch = text.match(/\bMovie(?:\s*:\s*.+)?$/i);
    if (movieMatch) return movieMatch[0].trim();

    // If the stripped text is identical to the anime title, don't treat trailing number of anime as episode number
    if (animeTitle && text.toLowerCase() === animeTitle.toLowerCase().trim()) {
        return text;
    }

    // 6. Ending in number, e.g. "Danshi Koukousei no Nichijou 12 (End)" -> "Episode 12 (End)"
    const trailingNumMatch = text.match(/\s+(\d+(?:\s*\([^)]+\))?)$/);
    if (trailingNumMatch) {
        return 'Episode ' + trailingNumMatch[1].trim();
    }

    return text;
}

export async function POST(request) {
    if (!ensureAdmin(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { url } = await request.json();

        const isNekopoi = url && (url.includes('nekopoi.care') || url.includes('nontonanimeid'));
        const isOtakudesu = url && (url.includes('otakudesu.blog') || url.includes('otakudesu.cloud') || url.includes('otakudesu.care'));

        if (!url || (!isNekopoi && !isOtakudesu)) {
            return NextResponse.json({ success: false, message: 'Invalid URL. Supported: nekopoi.care, otakudesu.' });
        }

        const response = await fetch(url);
        if (!response.ok) {
            return NextResponse.json({ success: false, message: 'Failed to fetch URL' });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        let data = {
            title: '',
            nativeTitle: '',
            coverImage: '',
            type: 'Anime',
            status: '',
            airDate: '',
            producer: '',
            studio: '',
            duration: '',
            totalEpisode: 0,
            rating: 0,
            synopsis: '',
            genres: [],
            episodes: [],
            datePublished: null,
            dateModified: null,
            sourceUrl: url,
            // episode doc fields
            episodeTitle: '',
            servers: []
        };

        // ─── OTAKUDESU ───
        if (isOtakudesu) {
            // Extract Yoast schema dates
            $('script.yoast-schema-graph, script[type="application/ld+json"]').each((_, el) => {
                try {
                    const json = JSON.parse($(el).text());
                    const graph = json['@graph'] || (Array.isArray(json) ? json : [json]);
                    for (const node of graph) {
                        if (node.datePublished && !data.datePublished) data.datePublished = node.datePublished;
                        if (node.dateModified && !data.dateModified) data.dateModified = node.dateModified;
                    }
                } catch (_) {}
            });
            if (!data.datePublished) data.datePublished = $('meta[property="article:published_time"]').attr('content') || null;
            if (!data.dateModified) data.dateModified = $('meta[property="article:modified_time"]').attr('content') || null;

            // Title dari h1 (strip child span yg isi view count)
            const rawTitle = $('.jdlrx h1').clone().children('span').remove().end().text().trim();
            data.title = rawTitle;

            // Cover image
            const cover = $('.fotoanime img').first().attr('src');
            if (cover) data.coverImage = cover;

            // Meta dari .infozingle p span
            $('.infozingle p').each((i, el) => {
                const span = $(el).find('span');
                const text = span.text().trim();
                const colonIdx = text.indexOf(':');
                if (colonIdx === -1) return;
                const label = text.substring(0, colonIdx).trim();
                const value = text.substring(colonIdx + 1).trim();

                if (label === 'Judul') { if (value) data.title = value; }
                else if (label === 'Japanese') data.nativeTitle = value;
                else if (label === 'Skor') data.rating = parseFloat(value) || 0;
                else if (label === 'Produser') data.producer = value;
                else if (label === 'Tipe') data.type = value;
                else if (label === 'Status') data.status = value;
                else if (label === 'Total Episode') data.totalEpisode = parseInt(value) || 0;
                else if (label === 'Durasi') data.duration = value;
                else if (label === 'Tanggal Rilis') data.airDate = value;
                else if (label === 'Studio') data.studio = value;
                else if (label === 'Genre') {
                    span.find('a').each((j, a) => {
                        data.genres.push($(a).text().trim());
                    });
                }
            });

            // Synopsis
            const synParts = [];
            $('.sinopc p').each((i, el) => {
                const t = $(el).text().trim();
                if (t) synParts.push(t);
            });
            if (synParts.length) data.synopsis = synParts.join('\n\n');

            // Episodes — ambil .episodelist yang judulnya mengandung "Episode List"
            $('.episodelist').each((i, el) => {
                const monkTitle = $(el).find('.monktit').text().toLowerCase();
                if (!monkTitle.includes('episode list')) return;
                $(el).find('ul li').each((j, li) => {
                    const rawTitle = a.text().trim();
                    const epTitle = cleanEpisodeTitle(rawTitle, data.title);
                    const epUrl = a.attr('href') || '';
                    const epDate = $(li).find('.zeebr').text().trim();
                    // slug = segment terakhir URL
                    let epSlug = '';
                    if (epUrl) {
                        const parts = epUrl.replace(/\/$/, '').split('/');
                        epSlug = parts[parts.length - 1];
                    }
                    if (epTitle) {
                        data.episodes.push({ title: epTitle, slug: epSlug, airDate: epDate, sourceUrl: epUrl });
                    }
                });
            });

            // otakudesu: newest first → reverse agar ep 1 di index 0
            data.episodes.reverse();

            // Enrich with AniList GraphQL metadata
            try {
                const anilistMatch = await findBestAniListMatch({
                    title: data.title,
                    nativeTitle: data.nativeTitle,
                });
                if (anilistMatch) {
                    const enriched = mapAniListToAnime(anilistMatch, data, {
                        preserveIndonesianSynopsis: true,
                        overwriteCover: false,
                    });
                    data = { ...data, ...enriched };
                    data.anilistMatch = {
                        id: anilistMatch.id,
                        title: anilistMatch.title,
                        averageScore: anilistMatch.averageScore,
                    };
                }
            } catch (err) {
                console.warn('[Scrape] AniList enrich warning:', err.message);
            }

            return NextResponse.json({ success: true, type: 'anime', data });
        }

        // ─── NEKOPOI ───
        if (isNekopoi) {
            // EPISODE URL
            if ($('.nk-player-frame').length > 0) {
                data.episodeTitle = $('h1').first().text().trim()
                    .replace(/\[\s*NEW\s+Release\s*\]/gi, '')
                    .replace(/\[\s*4K\s*\]/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                const dateText = $('.nk-post-header-meta span').eq(1).text();
                if (dateText) {
                    data.airDate = dateText
                        .replace('Sabtu, ', '').replace('Minggu, ', '').replace('Senin, ', '')
                        .replace('Selasa, ', '').replace('Rabu, ', '').replace('Kamis, ', '')
                        .replace('Jumat, ', '').trim();
                }

                let tabNames = [];
                $('#nk-player-tabs.list a').each((i, el) => {
                    tabNames.push($(el).text().trim());
                });

                $('.nk-player-frame iframe').each((i, el) => {
                    const src = $(el).attr('src');
                    if (src) {
                        data.servers.push({
                            name: tabNames[i] || `Server ${i + 1}`,
                            url: src
                        });
                    }
                });

                return NextResponse.json({ success: true, type: 'episode', data });
            }

            // ANIME URL
            let synopsisText = '';
            $('.nk-series-synopsis p').each((i, el) => {
                const pText = $(el).text().trim();
                if (pText && !pText.toLowerCase().includes('sinopsis:')) {
                    synopsisText += pText + '\n\n';
                }
            });
            if (synopsisText) data.synopsis = synopsisText.trim();

            const ogImage = $('meta[property="og:image"]').attr('content');
            const coverStyle = $('.nk-series-poster').attr('style');
            let rawCover = '';
            if (coverStyle) {
                const match = coverStyle.match(/url\(['"']?(.*?)['"']?\)/);
                if (match && match[1]) rawCover = match[1];
            }
            if (!rawCover && ogImage) rawCover = ogImage;
            if (rawCover) {
                data.coverImage = rawCover.replace(/-\d+x\d+(\.[a-zA-Z0-9]+)$/i, '$1');
            }

            $('.nk-series-meta-list ul li').each((i, el) => {
                const text = $(el).text();
                if (text.includes('Judul Jepang')) data.nativeTitle = text.split(':')[1]?.trim();
                else if (text.includes('Jenis')) data.type = text.split(':')[1]?.trim() || 'Anime';
                else if (text.includes('Status')) data.status = text.split(':')[1]?.trim();
                else if (text.includes('Tayang')) data.airDate = text.split(':')[1]?.trim();
                else if (text.includes('Produser')) data.producer = text.split(':')[1]?.trim();
                else if (text.includes('Durasi')) data.duration = text.split(':')[1]?.trim();
                else if (text.includes('Skor')) {
                    const scoreMatch = text.match(/Skor\s*:\s*([\d.]+)/i);
                    if (scoreMatch && scoreMatch[1]) {
                        data.rating = parseFloat(scoreMatch[1]) || 0;
                    }
                } else if (text.includes('Genre')) {
                    $(el).find('a').each((j, a) => {
                        data.genres.push($(a).text().trim());
                    });
                }
            });

            data.title = $('meta[property="og:title"]').attr('content') || '';
            if (!data.title) data.title = data.nativeTitle;

            $('.nk-episode-grid ul li').each((i, el) => {
                const epTitle = $(el).find('.nk-episode-card-title').text().trim();
                const epDate = $(el).find('.nk-episode-card-date').text().trim();
                const epUrl = $(el).find('a').attr('href');

                let epName = `Episode ${i + 1}`;
                const badge = $(el).find('.nk-episode-badge').text().trim();
                if (badge) {
                    epName = badge.replace(/eps?\s*/i, 'Episode ');
                }

                if (epTitle) {
                    const cleanEpTitle = epTitle
                        .replace(/\[\s*NEW\s+Release\s*\]/gi, '')
                        .replace(/\[\s*4K\s*\]/gi, '')
                        .replace(/\s+/g, ' ')
                        .trim();

                    data.episodes.push({
                        title: epName,
                        fullTitle: cleanEpTitle,
                        airDate: epDate,
                        sourceUrl: epUrl
                    });
                }
            });

            data.episodes.reverse();
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Scrape Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
