#!/usr/bin/env node
/**
 * scripts/nekopoi-scraper.js
 * Scraper for Nekopoi hentai anime & episodes with AniList synchronization
 * and automatic DoodStream / Playmogo stream cloning.
 *
 * Usage:
 *   node scripts/nekopoi-scraper.js --file url.txt [--episodes]
 *   node scripts/nekopoi-scraper.js <anime-url> [episode-url]
 *
 * Examples:
 *   node scripts/nekopoi-scraper.js --file url.txt --episodes
 *   node scripts/nekopoi-scraper.js https://nekopoi.care/hentai/netorare-zuma/
 *   node scripts/nekopoi-scraper.js https://nekopoi.care/hentai/netorare-zuma/ https://nekopoi.care/netorare-zuma-episode-1-subtitle-indonesia/
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const { cloneOrRemoteStreamLink } = require('../lib/doodstream');

// Helper sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
};

// ── Indonesian Month Parser ──────────────────────────────────────────────────
function parseIndonesianDate(str) {
    if (!str) return null;
    const m = str.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (!m) {
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    }
    const day = parseInt(m[1], 10);
    const monthName = m[2].toLowerCase();
    const year = parseInt(m[3], 10);

    const months = {
        januari: 0, jan: 0,
        februari: 1, feb: 1,
        maret: 2, mar: 2,
        april: 3, apr: 3,
        mei: 4, may: 4,
        juni: 5, jun: 5,
        juli: 6, jul: 6,
        agustus: 7, agu: 7, aug: 7,
        september: 8, sep: 8,
        oktober: 9, okt: 9, oct: 9,
        november: 10, nov: 10,
        desember: 11, des: 11, dec: 11
    };

    const month = months[monthName] ?? 0;
    return new Date(Date.UTC(year, month, day));
}

// ── Fetch AniList Metadata ───────────────────────────────────────────────────
async function fetchAniListInfo(title, slug) {
    const query = `
      query ($search: String) {
        Media(search: $search, type: ANIME, isAdult: true) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          format
          status
          description(asHtml: false)
          startDate { year month day }
          episodes
          duration
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          genres
          averageScore
          studios {
            edges {
              isMain
              node {
                name
                isAnimationStudio
              }
            }
          }
        }
      }
    `;

    try {
        const cleanTitle = title
            .replace(/\[\s*NEW\s+Release\s*\]/gi, '')
            .replace(/\[\s*4K\s*\]/gi, '')
            .replace(/\[UNCENSORED\]/gi, '')
            .replace(/\s*(?:Subtitle\s+Indonesia|Sub\s+Indo).*$/i, '')
            .replace(/\s+/g, ' ')
            .trim();

        const res = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables: { search: cleanTitle || slug } }),
        });

        if (!res.ok) return null;
        const json = await res.json();
        return json?.data?.Media || null;
    } catch (err) {
        console.warn('[AniList Fetch Warning]:', err.message);
        return null;
    }
}

// ── Connect DB ────────────────────────────────────────────────────────────────
async function getModels() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set in .env');

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
    }

    const animeSchema = new mongoose.Schema({
        title: { type: String, required: true },
        nativeTitle: String,
        slug: { type: String, unique: true },
        coverImage: String,
        bannerImage: String,
        type: { type: String, default: 'Hentai' },
        rating: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        status: String,
        airDate: String,
        producer: String,
        studio: String,
        duration: String,
        totalEpisode: Number,
        synopsis: String,
        synopsisEn: String,
        genres: [String],
        episodes: [{
            title: String,
            slug: String,
            airDate: String,
            sourceUrl: String,
        }],
        sourceUrl: { type: String, unique: true, sparse: true },
        lastUpdated: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now, index: true },
        anilistId: { type: Number, index: true },
        malId: Number,
    });

    const episodeSchema = new mongoose.Schema({
        animeSlug: { type: String, required: true },
        episodeSlug: { type: String, required: true },
        title: String,
        episodeIndex: Number,
        servers: [
            {
                name: { type: String, default: 'Server 1' },
                url: { type: String, default: '' },
                type: { type: String, default: 'iframe' },
            }
        ],
        downloads: [
            {
                quality: String,
                size: String,
                links: [
                    {
                        name: String,
                        url: String,
                    }
                ],
            }
        ],
        prevSlug: String,
        nextSlug: String,
        createdAt: { type: Date, default: Date.now },
    });

    const Anime = mongoose.models.Anime || mongoose.model('Anime', animeSchema);
    const Episode = mongoose.models.Episode || mongoose.model('Episode', episodeSchema);

    return { Anime, Episode };
}

// ── R2 Cover Uploader ────────────────────────────────────────────────────────
async function downloadAndUploadCoverToR2(rawCoverUrl, slug, dryRun = false) {
    if (!rawCoverUrl) return '';
    if (dryRun) {
        console.log('  ☁ [Dry-run] Lewati upload R2');
        return rawCoverUrl;
    }
    if (!process.env.R2_BUCKET_NAME || !process.env.R2_ACCOUNT_ID) {
        console.warn('  ⚠ R2 credentials tidak ditemukan di .env, lewati upload R2');
        return rawCoverUrl;
    }

    // Usahakan download versi resolusi penuh dengan menghapus suffix dimensi (e.g. -215x300, -210x300)
    const fullResUrl = rawCoverUrl.replace(/-\d+x\d+(\.[a-zA-Z0-9]+)$/i, '$1');
    const urlsToTry = fullResUrl !== rawCoverUrl ? [fullResUrl, rawCoverUrl] : [rawCoverUrl];

    let imageRes = null;
    let chosenUrl = null;

    for (const u of urlsToTry) {
        try {
            console.log(`  🖼 Mengunduh cover: ${u}`);
            const res = await fetch(u, {
                headers: {
                    'User-Agent': HEADERS['User-Agent'],
                    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                    'Referer': 'https://nekopoi.care/',
                }
            });
            if (res.ok) {
                imageRes = res;
                chosenUrl = u;
                break;
            } else {
                console.warn(`  ⚠ HTTP ${res.status} saat mencoba mengunduh ${u}`);
            }
        } catch (err) {
            console.warn(`  ⚠ Gagal mengunduh ${u}: ${err.message}`);
        }
    }

    if (!imageRes) {
        console.warn(`  ⚠ Gagal mengunduh cover dari Nekopoi, tetap menggunakan URL asli: ${rawCoverUrl}`);
        return rawCoverUrl;
    }

    try {
        const buffer = Buffer.from(await imageRes.arrayBuffer());
        const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('gif')) ext = 'gif';
        else {
            const urlExtMatch = chosenUrl.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
            if (urlExtMatch) ext = urlExtMatch[1].toLowerCase();
        }

        const r2Key = `covers/${slug}.${ext}`;
        console.log(`  ☁ Mengunggah cover ke Cloudflare R2: ${r2Key} (${buffer.byteLength} bytes)...`);

        const s3 = new AWS.S3({
            endpoint: `https://${process.env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`,
            accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
            region: 'auto',
            signatureVersion: 'v4',
        });

        await s3.putObject({
            Bucket: process.env.R2_BUCKET_NAME.trim(),
            Key: r2Key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000',
        }).promise();

        const r2Url = `${process.env.R2_PUBLIC_URL.trim().replace(/\/$/, '')}/${r2Key}`;
        console.log(`  ✓ Cover berhasil diunggah ke R2: ${r2Url}`);
        return r2Url;
    } catch (err) {
        console.error(`  ❌ Gagal mengunggah ke R2: ${err.message}`);
        return chosenUrl || rawCoverUrl;
    }
}

// ── Scrape Nekopoi Episode ────────────────────────────────────────────────────
async function scrapeEpisode(epUrl, animeSlug) {
    console.log(`\n[Scraping Episode]: ${epUrl}`);
    const res = await fetch(epUrl, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${epUrl}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract title & episode number
    const rawHeader = $('.nk-post-header h1, h1').first().text().trim();
    const cleanTitle = rawHeader
        .replace(/\[\s*NEW\s+Release\s*\]/gi, '')
        .replace(/\[\s*4K\s*\]/gi, '')
        .replace(/\[UNCENSORED\]/gi, '')
        .replace(/\s*(?:Subtitle\s+Indonesia|Sub\s+Indo).*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    const epMatch = cleanTitle.match(/(?:episode|ep\.?)\s*(\d+)/i) || epUrl.match(/episode-(\d+)/i);
    const episodeIndex = epMatch ? parseInt(epMatch[1], 10) : 1;
    const epDisplayTitle = `Episode ${episodeIndex}`;

    // Extract slug from URL e.g. "netorare-zuma-episode-1-subtitle-indonesia" -> "netorare-zuma-episode-1"
    const parsedSlugMatch = epUrl.match(/\/([^\/]+?)(?:-subtitle-indonesia)?\/?$/i);
    const rawSlug = parsedSlugMatch ? parsedSlugMatch[1] : `episode-${episodeIndex}`;
    const episodeSlug = rawSlug.replace(/-subtitle-indonesia$/i, '').trim();

    // Extract post date
    let postDateStr = '';
    $('.nk-post-header-meta span').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('Januari') || text.includes('Februari') || text.includes('Maret') ||
            text.includes('April') || text.includes('Mei') || text.includes('Juni') ||
            text.includes('Juli') || text.includes('Agustus') || text.includes('September') ||
            text.includes('Oktober') || text.includes('November') || text.includes('Desember')) {
            postDateStr = text;
        }
    });

    const episodeCreatedAt = parseIndonesianDate(postDateStr) || new Date();
    console.log(`  ✓ Episode Index: ${episodeIndex} (${epDisplayTitle})`);
    console.log(`  ✓ Post Date: ${postDateStr || episodeCreatedAt.toISOString()}`);

    // Extract Stream: ONLY playmogo.com / doodstream
    const rawServers = [];
    $('iframe').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src') || '';
        if (src.startsWith('//')) src = 'https:' + src;
        if (src.includes('playmogo.com') || src.includes('dood')) {
            rawServers.push(src);
        }
    });

    console.log(`  ✓ Stream Servers found on Nekopoi: ${rawServers.length} link(s)`);
    console.log(`  ⚡ Cloning stream links to your DoodStream account (Folder: "Hentai Nekopoi")...`);

    const servers = [];
    for (let i = 0; i < rawServers.length; i++) {
        const rawUrl = rawServers[i];
        try {
            const titleForUpload = `${animeSlug} - ${epDisplayTitle} [Part ${i + 1}]`;
            const cloned = await cloneOrRemoteStreamLink(rawUrl, titleForUpload, 'Hentai Nekopoi');
            console.log(`     ✓ [Server ${i + 1}] Cloned to your DoodStream account!`);
            console.log(`       - Original: ${rawUrl}`);
            console.log(`       - Cloned Embed: ${cloned.embedUrl} (Method: ${cloned.method}, FileCode: ${cloned.fileCode})`);
            servers.push({
                name: `Playmogo ${servers.length + 1}`,
                url: cloned.embedUrl,
                type: 'iframe'
            });
        } catch (err) {
            console.warn(`     ⚠ [Server ${i + 1}] Clone error: ${err.message}. Using fallback original URL.`);
            servers.push({
                name: `Playmogo ${servers.length + 1}`,
                url: rawUrl,
                type: 'iframe'
            });
        }
    }

    // Extract Download Links
    const downloads = [];
    $('.nk-download-row').each((i, row) => {
        let qualityRaw = $(row).find('.nk-download-name').text().trim();
        // Clean quality tag e.g. "Netorare Zuma 1 [720p]" -> "720p"
        const qMatch = qualityRaw.match(/\[(\d+p)\]/i) || qualityRaw.match(/(\d+p)/i);
        const quality = qMatch ? qMatch[1].toLowerCase() : (qualityRaw || `Kualitas ${i + 1}`);

        const links = [];
        $(row).find('.nk-download-links a').each((j, a) => {
            const name = $(a).text().trim();
            const url = $(a).attr('href');
            if (url) links.push({ name, url });
        });

        if (links.length > 0) {
            downloads.push({
                quality,
                size: '',
                links,
            });
        }
    });

    console.log(`  ✓ Download Options: ${downloads.length} kualitas ditemukan`);
    downloads.forEach(d => console.log(`     - [${d.quality}]: ${d.links.length} mirrors`));

    return {
        animeSlug,
        episodeSlug,
        title: epDisplayTitle,
        episodeIndex,
        servers,
        downloads,
        createdAt: episodeCreatedAt,
        postDateStr: postDateStr.replace(/^[A-Za-z]+,\s*/, '').trim(),
        sourceUrl: epUrl,
    };
}

// ── Scrape Nekopoi Anime ──────────────────────────────────────────────────────
async function scrapeNekopoi(animeUrl, customEpUrl = null, dryRun = false) {
    console.log(`=======================================================`);
    console.log(`[Scraping Anime]: ${animeUrl}`);
    console.log(`=======================================================`);

    const res = await fetch(animeUrl, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${animeUrl}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract slug e.g. "https://nekopoi.care/hentai/netorare-zuma/" -> "netorare-zuma"
    const slugMatch = animeUrl.match(/\/hentai\/([^\/]+)\/?/);
    const slug = slugMatch ? slugMatch[1] : animeUrl.split('/').filter(Boolean).pop();

    // Extract Meta
    let nativeTitle = '';
    let producer = '';
    let totalEpisode = 1;
    let status = 'Completed';
    let airDate = '';
    let duration = '';
    let scoreRaw = 0;
    const genres = ['Hentai'];

    $('.nk-series-meta-list li').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('Judul Jepang:')) nativeTitle = text.replace('Judul Jepang:', '').trim();
        if (text.includes('Jenis:')) { }
        if (text.includes('Episode:')) {
            const epNum = parseInt(text.replace('Episode:', '').trim(), 10);
            if (!isNaN(epNum)) totalEpisode = epNum;
        }
        if (text.includes('Status:')) status = text.replace('Status:', '').trim();
        if (text.includes('Tayang:')) airDate = text.replace('Tayang:', '').trim();
        if (text.includes('Produser:')) producer = text.replace('Produser:', '').trim();
        if (text.includes('Durasi:')) duration = text.replace('Durasi:', '').trim();
        if (text.includes('Skor:')) {
            const sc = parseFloat(text.replace('Skor:', '').trim());
            if (!isNaN(sc)) scoreRaw = sc;
        }
        if (text.includes('Genre:')) {
            const EXPLICIT_FETISH_TAGS = new Set([
                'blowjob', 'creampie', 'oral', 'anal', 'gangbang', 'paizuri',
                'ahegao', 'cumshot', 'rape', 'forced', 'humiliation', 'masturbation',
                'futanari', 'bondage', 'bdsm', 'big oppai'
            ]);
            const gList = text
                .replace('Genre:', '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .filter(g => !EXPLICIT_FETISH_TAGS.has(g.toLowerCase()));
            genres.push(...gList);
        }
    });

    const uniqueGenres = [...new Set(genres)];

    // Synopsis
    const synopsis = $('.nk-series-detail p').first().text().trim() ||
        $('.nk-series-info p').first().text().trim();

    // Poster from background-image, og:image, or img tag
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const posterStyle = $('.nk-series-poster').attr('style') || '';
    const posterMatch = posterStyle.match(/url\(['"]?(.*?)['"]?\)/);
    const imgPoster = $('.nk-series-poster img, img.nk-series-poster').attr('src') || '';
    let rawNekopoiCover = posterMatch ? posterMatch[1] : (ogImage || imgPoster);
    let coverImage = rawNekopoiCover;

    // Title from page
    let title = slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    // Extract Episode URLs from Anime page
    const episodeUrls = [];
    if (customEpUrl) {
        episodeUrls.push(customEpUrl);
    } else {
        $('.nk-series-episodes a, .nk-latest-episode a, a').each((i, el) => {
            const href = $(el).attr('href') || '';
            if (href.includes(slug) && href.includes('episode') && !episodeUrls.includes(href)) {
                episodeUrls.push(href);
            }
        });
    }

    console.log(`✓ Anime: ${title}`);
    console.log(`✓ Slug: ${slug}`);
    console.log(`✓ Japanese Title: ${nativeTitle}`);
    console.log(`✓ Air Date: ${airDate}`);
    console.log(`✓ Episodes to scrape: ${episodeUrls.length}`);

    // ── AniList Sync ──
    console.log(`\n[AniList Sync]: Mencari metadata di AniList GraphQL...`);
    const anilistData = await fetchAniListInfo(title, slug);
    let anilistId = null;
    let malId = null;
    let bannerImage = null;
    let rating = scoreRaw || 0;
    let synopsisEn = '';
    let hasAniListCover = false;

    if (anilistData) {
        anilistId = anilistData.id;
        malId = anilistData.idMal || null;
        console.log(`  ✓ AniList Match: ${anilistData.title?.romaji || title} (ID: ${anilistId})`);
        if (anilistData.coverImage?.extraLarge || anilistData.coverImage?.large) {
            coverImage = anilistData.coverImage.extraLarge || anilistData.coverImage.large;
            hasAniListCover = true;
        }
        bannerImage = anilistData.bannerImage || null;
        if (anilistData.averageScore) rating = parseFloat((anilistData.averageScore / 10).toFixed(1));
        if (anilistData.title?.native && !nativeTitle) nativeTitle = anilistData.title.native;
        synopsisEn = (anilistData.description || '').replace(/<\/?[^>]+(>|$)/g, '').trim();
    } else {
        console.log(`  ⚠ AniList Match tidak ditemukan, menggunakan metadata Nekopoi saja.`);
    }

    // Jika cover dari AniList tidak ada, unduh dari Nekopoi dan unggah ke R2
    if (!hasAniListCover && rawNekopoiCover) {
        console.log(`\n[Cover Storage]: Cover AniList tidak ada, mengunduh cover Nekopoi & mengunggah ke R2...`);
        coverImage = await downloadAndUploadCoverToR2(rawNekopoiCover, slug, dryRun);
    }

    // ── Scrape Each Episode ──
    const scrapedEpisodes = [];
    for (const epUrl of episodeUrls) {
        const epData = await scrapeEpisode(epUrl, slug);
        scrapedEpisodes.push(epData);
        await sleep(500);
    }

    // Set episode post date sync
    const firstEp = scrapedEpisodes[0];
    const postCreatedAt = firstEp?.createdAt || new Date();

    // ── Save to MongoDB ──
    console.log(`\n[Database]: Menyimpan ke MongoDB...`);
    const { Anime, Episode } = await getModels();

    const animeDocData = {
        title: anilistData?.title?.romaji || title,
        nativeTitle: nativeTitle || anilistData?.title?.native || '',
        slug,
        coverImage,
        bannerImage,
        type: 'Hentai',
        rating,
        status: status || 'Completed',
        airDate: airDate || (firstEp?.postDateStr || ''),
        producer: producer || 'MS Pictures',
        duration: duration || '17 min',
        totalEpisode: totalEpisode || scrapedEpisodes.length || 1,
        synopsis,
        synopsisEn,
        genres: uniqueGenres,
        sourceUrl: animeUrl,
        anilistId,
        malId,
        createdAt: postCreatedAt,
        lastUpdated: postCreatedAt,
        episodes: scrapedEpisodes.map(ep => ({
            title: ep.title,
            slug: ep.episodeSlug,
            airDate: ep.postDateStr || '',
            sourceUrl: ep.sourceUrl,
        })),
    };

    const savedAnime = await Anime.findOneAndUpdate(
        { slug },
        { $set: animeDocData },
        { upsert: true, returnDocument: 'after' }
    );
    console.log(`✓ Anime saved: ${savedAnime.title} (slug: ${savedAnime.slug})`);

    // Save episodes
    for (const ep of scrapedEpisodes) {
        await Episode.findOneAndUpdate(
            { animeSlug: slug, episodeSlug: ep.episodeSlug },
            {
                $set: {
                    animeSlug: slug,
                    episodeSlug: ep.episodeSlug,
                    title: ep.title,
                    episodeIndex: ep.episodeIndex,
                    servers: ep.servers,
                    downloads: ep.downloads,
                    createdAt: ep.createdAt,
                }
            },
            { upsert: true, returnDocument: 'after' }
        );
        console.log(`✓ Episode saved: ${ep.episodeSlug} with ${ep.servers.length} Playmogo server(s) & ${ep.downloads.length} download qualities`);
    }

    console.log(`\n=======================================================`);
    console.log(`🎉 SCRAPING & SYNC BERHASIL!`);
    console.log(`Anime URL di website Anitoki:`);
    console.log(`  - Anime Detail: http://localhost:3000/anime/${slug}`);
    if (scrapedEpisodes[0]) {
        console.log(`  - Episode Player: http://localhost:3000/episode/${slug}/${scrapedEpisodes[0].episodeSlug}`);
    }
    console.log(`=======================================================`);

    return {
        slug,
        title: savedAnime.title,
        episodesCount: scrapedEpisodes.length,
    };
}

// ── Resolve Nekopoi URL (Auto-detect Series vs Episode) ────────────────────────
async function resolveNekopoiUrl(inputUrl) {
    if (inputUrl.includes('/hentai/')) {
        return { animeUrl: inputUrl, episodeUrl: null };
    }

    console.log(`  🔍 Mendeteksi URL Seri dari Episode: ${inputUrl}`);
    try {
        const res = await fetch(inputUrl, { headers: HEADERS });
        if (res.ok) {
            const html = await res.text();
            const $ = cheerio.load(html);
            let seriesUrl = null;

            $('a[href*="/hentai/"]').each((i, el) => {
                const href = $(el).attr('href');
                if (href && !href.includes('/category/') && !seriesUrl) {
                    const text = $(el).text().trim();
                    if (text.includes('Seri') || $(el).attr('rel')) {
                        seriesUrl = href;
                    }
                }
            });

            if (seriesUrl) {
                console.log(`  ✓ Seri ditemukan: ${seriesUrl}`);
                return { animeUrl: seriesUrl, episodeUrl: inputUrl };
            }
        }
    } catch (err) {
        console.warn(`  ⚠ Gagal auto-detect seri: ${err.message}`);
    }

    return { animeUrl: inputUrl, episodeUrl: inputUrl };
}

// ── CLI Main Runner ───────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const scrapeEpisodes = args.includes('--episodes');
    const dryRun = args.includes('--dry-run');

    // Parse --file <filepath>
    const fileArgIdx = args.indexOf('--file');
    let filePath = null;

    if (fileArgIdx !== -1) {
        filePath = args[fileArgIdx + 1] && !args[fileArgIdx + 1].startsWith('--')
            ? args[fileArgIdx + 1]
            : 'url.txt';
    } else {
        const txtArg = args.find((a) => a.endsWith('.txt'));
        if (txtArg) filePath = txtArg;
    }

    let urlItems = [];

    if (filePath) {
        const absPath = path.resolve(filePath);
        if (!fs.existsSync(absPath)) {
            console.error(`❌ File tidak ditemukan: ${absPath}`);
            process.exit(1);
        }
        const lines = fs.readFileSync(absPath, 'utf8').split('\n');
        const rawUrls = lines.map((l) => l.trim()).filter((l) => l.startsWith('http'));
        rawUrls.reverse(); // Urutkan bottom -> top seperti otakudesu
        console.log(`\n📂 Dimuat ${rawUrls.length} URL dari ${absPath} (diurutkan bottom → top)`);
        for (const u of rawUrls) {
            urlItems.push({ rawUrl: u });
        }
    } else {
        const httpArgs = args.filter((a) => a.startsWith('http'));
        if (httpArgs.length >= 2) {
            urlItems.push({ animeUrl: httpArgs[0], episodeUrl: httpArgs[1] });
        } else if (httpArgs.length === 1) {
            urlItems.push({ rawUrl: httpArgs[0] });
        }
    }

    if (urlItems.length === 0) {
        console.log(`
Penggunaan Nekopoi Scraper:
  node scripts/nekopoi-scraper.js --file <file.txt> [--episodes]
  node scripts/nekopoi-scraper.js <url-anime-nekopoi> [url-episode-nekopoi]

Contoh:
  node scripts/nekopoi-scraper.js --file url.txt --episodes
  node scripts/nekopoi-scraper.js https://nekopoi.care/hentai/netorare-zuma/
  node scripts/nekopoi-scraper.js https://nekopoi.care/hentai/netorare-zuma/ https://nekopoi.care/netorare-zuma-episode-1-subtitle-indonesia/
        `);
        process.exit(1);
    }

    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    await getModels();
    console.log('Connected to MongoDB.\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < urlItems.length; i++) {
        const item = urlItems[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${i + 1}/${urlItems.length}] Memproses: ${item.animeUrl || item.rawUrl}`);
        console.log('='.repeat(60));

        try {
            let animeUrl = item.animeUrl;
            let episodeUrl = item.episodeUrl || null;

            if (!animeUrl && item.rawUrl) {
                const resolved = await resolveNekopoiUrl(item.rawUrl);
                animeUrl = resolved.animeUrl;
                episodeUrl = resolved.episodeUrl;
            }

            const result = await scrapeNekopoi(animeUrl, episodeUrl, dryRun);
            console.log(`\n🎉 [${i + 1}/${urlItems.length}] Sukses: ${result.title} (${result.episodesCount} episode tersimpan)`);
            successCount++;
        } catch (err) {
            console.error(`\n❌ [${i + 1}/${urlItems.length}] GAGAL:`, err.message);
            failCount++;
        }

        if (i < urlItems.length - 1) {
            console.log('\nMenunggu 2 detik sebelum URL berikutnya...');
            await sleep(2000);
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`RINGKASAN SCRAPING:`);
    console.log(`  - Total URL Diproses : ${urlItems.length}`);
    console.log(`  - Berhasil           : ${successCount}`);
    console.log(`  - Gagal              : ${failCount}`);
    console.log('='.repeat(60));

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(failCount > 0 && successCount === 0 ? 1 : 0);
}

main().catch((err) => {
    console.error('Fatal Scraper Error:', err);
    process.exit(1);
});
