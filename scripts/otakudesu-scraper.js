#!/usr/bin/env node
/**
 * otakudesu-scraper.js
 * Usage:
 *   node scripts/otakudesu-scraper.js <anime-url> [--episodes] [--dry-run]
 *
 * Flags:
 *   --episodes   Also scrape each episode page for streaming iframe + download links
 *   --dry-run    Parse & print JSON only; no DB write, no R2 upload
 *
 * Env required (from .env):
 *   MONGODB_URI, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_NAME, R2_PUBLIC_URL
 */

const path = require('path');
// Polyfill global.File for Node 18 to fix cheerio/undici ReferenceError
if (typeof File === 'undefined') {
    global.File = require('buffer').File || class File { };
}
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const cheerio = require('cheerio');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const { GoogleAuth } = require('google-auth-library');

// ── Google Indexing API ───────────────────────────────────────────────────────

// const INDEXING_TOKEN_PATH = path.resolve(__dirname, '../anitoki-token.json');
const SITE_BASE = 'https://anitoki.id';

async function notifyGoogleIndex(pageUrl) {
    try {
        const auth = new GoogleAuth({
            keyFile: INDEXING_TOKEN_PATH,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken.token}`,
            },
            body: JSON.stringify({ url: pageUrl, type: 'URL_UPDATED' }),
        });
        const json = await res.json();
        if (res.ok) {
            console.log(`      Google Index notified: ${pageUrl}`);
        } else {
            console.warn(`      Google Index warn: ${json?.error?.message || res.status}`);
        }
    } catch (err) {
        console.warn(`      Google Index error: ${err.message}`);
    }
}

// ── helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AnitokiBot/1.0)' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(`  retry ${i + 1} for ${url}`);
            await sleep(1500);
        }
    }
}

// ── R2 ───────────────────────────────────────────────────────────────────────

const s3 = new AWS.S3({
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    region: 'auto',
    signatureVersion: 'v4',
});

async function uploadImageToR2(imageUrl, key) {
    const res = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AnitokiBot/1.0)' },
    });
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    await s3
        .putObject({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read',
        })
        .promise();

    return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// ── Mongoose models (inline, lightweight) ────────────────────────────────────

function loadModels() {
    // reuse compiled model if already registered
    const animeSchema = new mongoose.Schema(
        {
            title: String,
            nativeTitle: String,
            slug: { type: String, unique: true, index: true },
            coverImage: String,
            type: String,
            status: String,
            airDate: String,
            producer: String,
            studio: String,
            duration: String,
            totalEpisode: Number,
            rating: Number,
            synopsis: String,
            genres: [String],
            episodes: [
                {
                    title: String,
                    slug: String,
                    airDate: String,
                    sourceUrl: String,
                },
            ],
            views: { type: Number, default: 0 },
            lastUpdated: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
            createdAt: { type: Date, default: Date.now },
        },
        { timestamps: true }
    );

    const episodeDocSchema = new mongoose.Schema(
        {
            animeSlug: { type: String, index: true },
            episodeSlug: { type: String, unique: true },
            title: String,
            airDate: String,
            servers: [{ name: String, url: String }],
            downloads: [
                {
                    quality: String,
                    size: String,
                    links: [{ name: String, url: String }],
                },
            ],
            updatedAt: { type: Date, default: Date.now },
        },
        { timestamps: true }
    );

    const Anime =
        mongoose.models.Anime || mongoose.model('Anime', animeSchema);
    const Episode =
        mongoose.models.Episode ||
        mongoose.model('Episode', episodeDocSchema);
    return { Anime, Episode };
}

// ── slug util ─────────────────────────────────────────────────────────────────

function makeSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function urlSlug(url) {
    return url.replace(/\/$/, '').split('/').pop();
}

// ── parsers ───────────────────────────────────────────────────────────────────

function parseAnimePage(html) {
    const $ = cheerio.load(html);
    const data = {
        title: '',
        nativeTitle: '',
        coverImage: '',
        type: 'TV',
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
    };

    // title — strip child <span> (view count)
    data.title = $('.jdlrx h1')
        .clone()
        .children('span')
        .remove()
        .end()
        .text()
        .trim();

    // cover
    const cover = $('.fotoanime img').first().attr('src');
    if (cover) data.coverImage = cover;

    // meta
    $('.infozingle p').each((_, el) => {
        const text = $(el).find('span').text().trim();
        const idx = text.indexOf(':');
        if (idx === -1) return;
        const label = text.substring(0, idx).trim();
        const value = text.substring(idx + 1).trim();

        if (label === 'Judul') { if (value) data.title = value; }
        else if (label === 'Japanese') data.nativeTitle = value;
        else if (label === 'Skor') data.rating = parseFloat(value) || 0;
        else if (label === 'Produser') data.producer = value;
        else if (label === 'Studio') data.studio = value;
        else if (label === 'Tipe') data.type = value;
        else if (label === 'Status') data.status = value;
        else if (label === 'Total Episode') data.totalEpisode = parseInt(value) || 0;
        else if (label === 'Durasi') data.duration = value;
        else if (label === 'Tanggal Rilis') data.airDate = value;
        else if (label === 'Genre') {
            $(el).find('span a').each((_, a) => {
                data.genres.push($(a).text().trim());
            });
        }
    });

    // synopsis
    const synParts = [];
    $('.sinopc p').each((_, el) => {
        const t = $(el).text().trim();
        if (t) synParts.push(t);
    });
    if (synParts.length) data.synopsis = synParts.join('\n\n');

    // episodes (newest first → reverse)
    $('.episodelist').each((_, el) => {
        const monkTitle = $(el).find('.monktit').text().toLowerCase();
        if (!monkTitle.includes('episode list')) return;
        $(el).find('ul li').each((_, li) => {
            const a = $(li).find('span:first-child a');
            const rawTitle = a.text().trim();
            // Extract "Episode N" or "Episode N (End)" from full title
            const epMatch = rawTitle.match(/Episode\s+\d+(?:\s*\([^)]+\))?/i);
            const epTitle = epMatch ? epMatch[0].trim() : rawTitle;
            const epUrl = a.attr('href') || '';
            const epDate = $(li).find('.zeebr').text().trim();
            const epSlug = epUrl ? urlSlug(epUrl) : '';
            if (epTitle) {
                data.episodes.push({ title: epTitle, slug: epSlug, airDate: epDate, sourceUrl: epUrl });
            }
        });
    });
    data.episodes.reverse();

    return data;
}

// Resolve mirror streaming URLs via WP admin-ajax nonce
// Step 1: GET nonce → action "aa1208d27f29ca340c92c66d1926f13f"
// Step 2: per mirror → POST with { id, i, q, nonce, action "2a35..." } → atob(data) = iframe html
async function resolveMirrors(pageUrl, mirrors) {
    const ajaxUrl = new URL('/wp-admin/admin-ajax.php', pageUrl).href;

    // Step 1: get nonce
    let nonce;
    try {
        const res = await fetch(ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (compatible; AnitokiBot/1.0)',
                'Referer': pageUrl,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({ action: 'aa1208d27f29ca340c92c66d1926f13f' }),
        });
        const json = await res.json();
        nonce = json.data;
    } catch (err) {
        console.warn(`    nonce fetch failed: ${err.message}`);
        return [];
    }

    if (!nonce) {
        console.warn('    nonce empty');
        return [];
    }

    const resolved = [];
    for (const m of mirrors) {
        try {
            const params = JSON.parse(Buffer.from(m.dataContent, 'base64').toString('utf8'));
            const res = await fetch(ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (compatible; AnitokiBot/1.0)',
                    'Referer': pageUrl,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: new URLSearchParams({
                    ...params,
                    nonce,
                    action: '2a3505c93b0035d3f455df82bf976b84',
                }),
            });
            const json = await res.json();
            if (!json.data) continue;
            const iframeHtml = Buffer.from(json.data, 'base64').toString('utf8');
            // extract src from <iframe src="...">
            const srcMatch = iframeHtml.match(/src=["']([^"']+)["']/i);
            if (srcMatch && srcMatch[1]) {
                resolved.push({ name: m.name, quality: m.quality, url: srcMatch[1] });
            }
            await sleep(300);
        } catch (err) {
            console.warn(`    mirror resolve failed (${m.name}): ${err.message}`);
        }
    }
    return resolved;
}

async function resolveShortLink(url) {
    if (!url || !url.includes('link.desustream.com')) return url;
    try {
        const res = await fetch(url, {
            redirect: 'manual',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        const location = res.headers.get('location');
        return location || url;
    } catch {
        return url;
    }
}

async function parseEpisodePage(html, pageUrl) {
    const $ = cheerio.load(html);

    // Collect all mirror data-content attributes
    const mirrorItems = [];
    $('.mirrorstream ul').each((_, ul) => {
        const qualityText = $(ul).clone().children().remove().end().text().trim();
        // qualityText e.g. "Mirror 480p", "Mirror 720p"
        const quality = qualityText.replace(/mirror\s*/i, '').trim() || 'Unknown';
        $(ul).find('li a[data-content]').each((_, a) => {
            const name = $(a).text().trim();
            const dataContent = $(a).attr('data-content') || '';
            if (dataContent) mirrorItems.push({ name, quality, dataContent });
        });
    });

    // Resolve all mirrors via AJAX
    const servers = [];
    if (mirrorItems.length && pageUrl) {
        process.stdout.write(`(resolving ${mirrorItems.length} mirrors) `);
        const resolved = await resolveMirrors(pageUrl, mirrorItems);
        for (const r of resolved) {
            servers.push({ name: `${r.quality} - ${r.name}`, url: r.url });
        }
    }

    // Fallback: default iframe dari #pembed jika resolve gagal/kosong
    if (servers.length === 0) {
        const iframeSrc = $('#pembed .responsive-embed-stream iframe').first().attr('src');
        if (iframeSrc) servers.push({ name: 'Default', url: iframeSrc });
    }

    // Download links — resolve shortlinks (link.desustream.com → 302 → real URL)
    const rawDownloads = [];
    $('.download ul li').each((_, li) => {
        const quality = $(li).find('strong').text().trim();
        const size = $(li).find('i').text().trim();
        const links = [];
        $(li).find('a').each((_, a) => {
            const name = $(a).text().trim();
            const url = $(a).attr('href') || '';
            if (name && url) links.push({ name, url });
        });
        if (quality && links.length) {
            rawDownloads.push({ quality, size, links });
        }
    });

    // Resolve shortlinks in parallel (per quality group)
    const downloads = await Promise.all(
        rawDownloads.map(async (dl) => {
            const resolvedLinks = await Promise.all(
                dl.links.map(async (lnk) => {
                    const real = await resolveShortLink(lnk.url);
                    return { name: lnk.name, url: real };
                })
            );
            return { quality: dl.quality, size: dl.size, links: resolvedLinks };
        })
    );

    return { servers, downloads };
}

// ── main ──────────────────────────────────────────────────────────────────────

async function scrapeOne(animeUrl, { scrapeEpisodes, dryRun, Anime, Episode }) {
    console.log(`\n[1/5] Fetch anime page: ${animeUrl}`);
    const animeHtml = await fetchHtml(animeUrl);
    const animeData = parseAnimePage(animeHtml);

    const slug = makeSlug(animeData.title);
    console.log(`      title   : ${animeData.title}`);
    console.log(`      slug    : ${slug}`);
    console.log(`      episodes: ${animeData.episodes.length}`);
    console.log(`      studio  : ${animeData.studio}`);
    console.log(`      totalEp : ${animeData.totalEpisode}`);

    // ── fast skip: anime + all episodes already exist ──
    if (!dryRun && scrapeEpisodes && animeData.episodes.length > 0) {
        const existingAnime = await Anime.findOne({ slug }).lean();
        if (existingAnime) {
            const existingEpCount = await Episode.countDocuments({ animeSlug: slug });
            if (existingEpCount >= animeData.episodes.length) {
                console.log(`      SKIP — anime + ${existingEpCount} episodes already in DB`);
                return;
            }
        }
    }

    // ── upload cover to R2 ──
    let coverImageUrl = animeData.coverImage;
    if (!dryRun && animeData.coverImage) {
        console.log('\n[2/5] Upload cover to R2...');
        try {
            const ext = animeData.coverImage.split('.').pop().split('?')[0] || 'jpg';
            const r2Key = `covers/${slug}.${ext}`;
            coverImageUrl = await uploadImageToR2(animeData.coverImage, r2Key);
            console.log(`      R2 url: ${coverImageUrl}`);
        } catch (err) {
            console.warn(`      Cover upload failed: ${err.message} — keep original URL`);
        }
    } else {
        console.log('\n[2/5] Skip R2 upload (dry-run or no cover)');
    }

    // ── scrape episode pages ──
    let episodeDocs = [];
    if (scrapeEpisodes && animeData.episodes.length > 0) {
        console.log(`\n[3/5] Scrape ${animeData.episodes.length} episode pages...`);
        // pre-fetch existing episode slugs to skip already-scraped ones
        const existingSlugs = !dryRun
            ? new Set((await Episode.find({ animeSlug: slug }, 'episodeSlug').lean()).map((e) => e.episodeSlug))
            : new Set();
        for (let i = 0; i < animeData.episodes.length; i++) {
            const ep = animeData.episodes[i];
            if (!ep.sourceUrl) continue;
            if (existingSlugs.has(ep.slug)) {
                console.log(`  [${i + 1}/${animeData.episodes.length}] ${ep.title} ... SKIP (exists)`);
                continue;
            }
            process.stdout.write(`  [${i + 1}/${animeData.episodes.length}] ${ep.title} ... `);
            try {
                const html = await fetchHtml(ep.sourceUrl);
                const { servers, downloads } = await parseEpisodePage(html, ep.sourceUrl);
                episodeDocs.push({
                    animeSlug: slug,
                    episodeSlug: ep.slug,
                    title: ep.title,
                    airDate: ep.airDate,
                    episodeIndex: i,
                    servers,
                    downloads,
                    prevSlug: null,
                    nextSlug: null,
                });
                console.log(`OK (servers:${servers.length} dl:${downloads.length})`);
            } catch (err) {
                console.log(`FAIL: ${err.message}`);
            }
            // polite delay
            if (i < animeData.episodes.length - 1) await sleep(800);
        }
    } else {
        console.log('\n[3/5] Skip episode scrape (no --episodes flag)');
    }

    // ── dry run: print & return ──
    if (dryRun) {
        console.log('\n[DRY RUN] Anime data:');
        console.log(JSON.stringify({ ...animeData, coverImage: coverImageUrl, slug }, null, 2));
        if (episodeDocs.length) {
            console.log('\n[DRY RUN] Episode docs:');
            console.log(JSON.stringify(episodeDocs, null, 2));
        }
        return;
    }

    // ── upsert anime ──
    console.log('\n[4/5] Upsert anime...');
    // detect new episode: bump lastUpdated only when episode count grows (or anime baru)
    // so frontend recents (sorted by lastUpdated desc) naik saat ada episode baru,
    // tapi tak naik palsu tiap re-scrape tanpa perubahan.
    const prevAnime = await Anime.findOne({ slug }, 'episodes').lean();
    const prevEpCount = prevAnime?.episodes?.length ?? 0;
    const hasNewEpisode = animeData.episodes.length > prevEpCount;

    const animeDoc = {
        title: animeData.title,
        nativeTitle: animeData.nativeTitle,
        slug,
        coverImage: coverImageUrl,
        type: animeData.type,
        status: animeData.status,
        airDate: animeData.airDate,
        producer: animeData.producer,
        studio: animeData.studio,
        duration: animeData.duration,
        totalEpisode: animeData.totalEpisode,
        rating: animeData.rating,
        synopsis: animeData.synopsis,
        genres: animeData.genres,
        episodes: animeData.episodes.map((ep) => ({
            title: ep.title,
            slug: ep.slug,
            airDate: ep.airDate,
            sourceUrl: ep.sourceUrl,
        })),
    };
    if (hasNewEpisode) animeDoc.lastUpdated = new Date();

    await Anime.findOneAndUpdate({ slug }, { $set: animeDoc }, { upsert: true, new: true });
    console.log(`      Anime "${slug}" saved.${hasNewEpisode ? ` (+${animeData.episodes.length - prevEpCount} ep baru → naik ke recents)` : ''}`);
    if (!dryRun) await notifyGoogleIndex(`${SITE_BASE}/anime/${slug}`);

    // ── compute prev/next navigation ──
    episodeDocs.forEach((doc, i) => {
        doc.prevSlug = episodeDocs[i - 1]?.episodeSlug || null;
        doc.nextSlug = episodeDocs[i + 1]?.episodeSlug || null;
    });

    // ── upsert episode docs ──
    if (episodeDocs.length) {
        console.log(`\n[5/5] Saving ${episodeDocs.length} episode docs...`);
        for (const doc of episodeDocs) {
            await Episode.findOneAndUpdate(
                { episodeSlug: doc.episodeSlug },
                { $set: doc },
                { upsert: true }
            );
        }
        console.log('      Episode docs saved.');
    }
}

async function main() {
    const args = process.argv.slice(2);
    const scrapeEpisodes = args.includes('--episodes');
    const dryRun = args.includes('--dry-run');
    const fileArg = args.find((a) => a === '--file');
    const fileIdx = args.indexOf('--file');
    const filePath = fileArg !== undefined && args[fileIdx + 1] ? args[fileIdx + 1] : null;

    // collect URLs: from --file or inline http arg
    let urls = [];
    if (filePath) {
        const fs = require('fs');
        const path = require('path');
        const absPath = path.resolve(filePath);
        const lines = fs.readFileSync(absPath, 'utf8').split('\n');
        urls = lines.map((l) => l.trim()).filter((l) => l.startsWith('http'));
        urls.reverse(); // proses dari bawah ke atas
        console.log(`Loaded ${urls.length} URLs from ${absPath} (reversed: bottom→top)`);
    } else {
        const inlineUrl = args.find((a) => a.startsWith('http'));
        if (inlineUrl) urls = [inlineUrl];
    }

    if (urls.length === 0) {
        console.error('Usage: node scripts/otakudesu-scraper.js <url> [--episodes] [--dry-run]');
        console.error('       node scripts/otakudesu-scraper.js --file url.txt [--episodes] [--dry-run]');
        process.exit(1);
    }

    // connect DB once (skip on dry-run)
    let Anime, Episode;
    if (!dryRun) {
        console.log('\nConnecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.\n');
        ({ Anime, Episode } = loadModels());
    }

    for (let i = 0; i < urls.length; i++) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${i + 1}/${urls.length}] ${urls[i]}`);
        console.log('='.repeat(60));
        try {
            await scrapeOne(urls[i], { scrapeEpisodes, dryRun, Anime, Episode });
        } catch (err) {
            console.error(`  FAILED: ${err.message}`);
        }
        // delay between anime
        if (!dryRun && i < urls.length - 1) await sleep(2000);
    }

    if (!dryRun) {
        await mongoose.disconnect();
    }
    console.log('\nAll done.');
}

main().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
