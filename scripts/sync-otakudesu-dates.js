#!/usr/bin/env node
/**
 * scripts/sync-otakudesu-dates.js
 * Synchronizes anime post dates (datePublished & dateModified) in Anitoki with Otakudesu.
 *
 * Extracts exact ISO 8601 timestamps from Otakudesu's Yoast SEO schema graph:
 *   - datePublished -> Anime.createdAt
 *   - dateModified  -> Anime.lastUpdated
 *
 * Usage:
 *   node scripts/sync-otakudesu-dates.js [options]
 *
 * Options:
 *   --ongoing             Sync all ongoing anime from Otakudesu
 *   --complete            Sync complete anime from url-complete.txt
 *   --all                 Sync all anime (ongoing + complete + fallback)
 *   --fallback-episodes   Update dates from existing episode airDates
 *   --slug=<slug>         Sync single anime by slug
 *   --limit=<N>           Limit number of anime to process
 *   --concurrency=<N>     Number of parallel HTTP requests (default: 4)
 *   --dry-run             Preview without modifying MongoDB
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import * as cheerio from 'cheerio';
import Anime from '../lib/models/Anime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

// CLI args
const args = process.argv.slice(2);
const flags = {
  ongoing: false,
  complete: false,
  all: false,
  fallbackEpisodes: false,
  slug: null,
  limit: 0,
  concurrency: 4,
  dryRun: false,
  delay: 300,
};

for (const arg of args) {
  if (arg === '--ongoing') flags.ongoing = true;
  else if (arg === '--complete') flags.complete = true;
  else if (arg === '--all') flags.all = true;
  else if (arg === '--fallback-episodes') flags.fallbackEpisodes = true;
  else if (arg.startsWith('--slug=')) flags.slug = arg.split('=')[1].trim();
  else if (arg.startsWith('--limit=')) flags.limit = parseInt(arg.split('=')[1], 10);
  else if (arg.startsWith('--concurrency=')) flags.concurrency = parseInt(arg.split('=')[1], 10);
  else if (arg === '--dry-run') flags.dryRun = true;
}

if (!flags.ongoing && !flags.complete && !flags.all && !flags.fallbackEpisodes && !flags.slug) {
  // Default to ongoing if nothing specified
  flags.ongoing = true;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseIndonesianDate(str) {
  if (!str) return null;
  const months = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, ags: 7, agu: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    oktober: 9, okt: 9, oct: 9,
    november: 10, nov: 10,
    desember: 11, des: 11, dec: 11
  };
  const cleaned = str.replace(/[,;]/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(' ');
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const mKey = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    const month = months[mKey];
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(Date.UTC(year, month, day, 12, 0, 0));
    }
  } else if (parts.length === 2) {
    const day = parseInt(parts[0], 10);
    const mKey = parts[1].toLowerCase();
    const month = months[mKey];
    if (!isNaN(day) && month !== undefined) {
      return new Date(Date.UTC(2026, month, day, 12, 0, 0));
    }
  }
  return null;
}

async function fetchHtml(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}

async function extractOtakuPageInfo(url) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    let datePublished = null;
    let dateModified = null;
    let title = '';

    // Title from infozingle Judul
    $('.infozingle p').each((_, el) => {
      const t = $(el).find('span').text().trim();
      if (t.startsWith('Judul:')) {
        title = t.replace('Judul:', '').trim();
      }
    });
    if (!title) {
      title = $('.jdlrx h1').clone().children('span').remove().end().text().trim();
    }

    // Yoast Schema Graph
    $('script.yoast-schema-graph, script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).text());
        const graph = json['@graph'] || (Array.isArray(json) ? json : [json]);
        for (const node of graph) {
          if (node.datePublished && !datePublished) datePublished = node.datePublished;
          if (node.dateModified && !dateModified) dateModified = node.dateModified;
        }
      } catch (_) {}
    });

    // Fallback meta tags
    if (!datePublished) datePublished = $('meta[property="article:published_time"]').attr('content') || null;
    if (!dateModified) dateModified = $('meta[property="article:modified_time"]').attr('content') || null;

    return { title, datePublished, dateModified, url };
  } catch (err) {
    return null;
  }
}

async function fetchOngoingOtakuUrls() {
  console.log('🔍 Fetching all ongoing anime URLs from Otakudesu...');
  const urls = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const pageUrl = page === 1
      ? 'https://otakudesu.blog/ongoing-anime/'
      : `https://otakudesu.blog/ongoing-anime/page/${page}/`;

    try {
      const html = await fetchHtml(pageUrl);
      const $ = cheerio.load(html);
      let count = 0;

      $('.venz ul li').each((_, el) => {
        const href = $(el).find('a').first().attr('href');
        if (href && href.includes('/anime/')) {
          urls.push(href.trim());
          count++;
        }
      });

      console.log(`   Page ${page}: found ${count} anime`);
      const nextBtn = $('.pagination .next, .pagenavx .next, a.next');
      if (nextBtn.length > 0 && nextBtn.attr('href') && count > 0) {
        page++;
        await sleep(300);
      } else {
        hasNext = false;
      }
    } catch (err) {
      console.warn(`   Page ${page} failed: ${err.message}`);
      hasNext = false;
    }
  }

  console.log(`✅ Total ongoing URLs collected: ${urls.length}\n`);
  return Array.from(new Set(urls));
}

async function runSync() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.\n');

  let urlsToProcess = [];

  if (flags.slug) {
    // Single slug
    const anime = await Anime.findOne({ slug: flags.slug }).lean();
    if (!anime) {
      console.error(`❌ Anime not found with slug: ${flags.slug}`);
      await mongoose.disconnect();
      return;
    }
    console.log(`Processing single anime: "${anime.title}" (${anime.slug})`);
    if (anime.sourceUrl && anime.sourceUrl.includes('otakudesu')) {
      urlsToProcess.push(anime.sourceUrl);
    } else if (anime.episodes?.[0]?.sourceUrl) {
      try {
        const epHtml = await fetchHtml(anime.episodes[0].sourceUrl);
        const $ = cheerio.load(epHtml);
        const mainUrl = $('a[href*="/anime/"]').first().attr('href');
        if (mainUrl) urlsToProcess.push(mainUrl);
      } catch (_) {}
    }
  } else if (flags.ongoing) {
    // Collect from Otakudesu /ongoing-anime/
    urlsToProcess = await fetchOngoingOtakuUrls();
  } else if (flags.complete) {
    // Read from url-complete.txt
    const completeFile = path.resolve(__dirname, '../url-complete.txt');
    if (fs.existsSync(completeFile)) {
      urlsToProcess = fs.readFileSync(completeFile, 'utf8')
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);
      console.log(`📋 Loaded ${urlsToProcess.length} complete URLs from url-complete.txt`);
    }
  } else if (flags.all) {
    // Ongoing + Complete
    const ongoingUrls = await fetchOngoingOtakuUrls();
    let completeUrls = [];
    const completeFile = path.resolve(__dirname, '../url-complete.txt');
    if (fs.existsSync(completeFile)) {
      completeUrls = fs.readFileSync(completeFile, 'utf8')
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);
    }
    urlsToProcess = Array.from(new Set([...ongoingUrls, ...completeUrls]));
    console.log(`📋 Total URLs for sync: ${urlsToProcess.length}`);
  }

  if (flags.limit > 0 && urlsToProcess.length > flags.limit) {
    urlsToProcess = urlsToProcess.slice(0, flags.limit);
    console.log(`⚠️ Limited to ${flags.limit} URLs`);
  }

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  console.log(`\n🚀 Starting Otakudesu Date Sync for ${urlsToProcess.length} items (concurrency: ${flags.concurrency})...\n`);

  for (let i = 0; i < urlsToProcess.length; i += flags.concurrency) {
    const chunk = urlsToProcess.slice(i, i + flags.concurrency);
    await Promise.all(
      chunk.map(async (url, idx) => {
        const itemIdx = i + idx + 1;
        try {
          const info = await extractOtakuPageInfo(url);
          if (!info || (!info.datePublished && !info.dateModified)) {
            notFoundCount++;
            return;
          }

          const slug = makeSlug(info.title);
          // Match in DB
          let anime = await Anime.findOne({
            $or: [
              { sourceUrl: url },
              { slug },
              { title: info.title },
              { title: new RegExp('^' + info.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
            ]
          });

          // Secondary fallback: Otakudesu URL segment
          if (!anime) {
            const urlSeg = url.replace(/\/$/, '').split('/').pop().replace(/-sub-indo$/, '').replace(/-sub-ind$/, '');
            anime = await Anime.findOne({ slug: urlSeg });
          }

          if (!anime) {
            notFoundCount++;
            return;
          }

          const update = {};
          if (info.datePublished) {
            update.createdAt = new Date(info.datePublished);
          }
          if (info.dateModified) {
            update.lastUpdated = new Date(info.dateModified);
          } else if (info.datePublished) {
            update.lastUpdated = new Date(info.datePublished);
          }
          update.sourceUrl = url;

          if (!flags.dryRun) {
            await Anime.updateOne({ _id: anime._id }, { $set: update });
          }

          console.log(`[${itemIdx}/${urlsToProcess.length}] ✅ "${anime.title}" (${anime.slug})`);
          console.log(`      Published: ${info.datePublished || '-'} | Modified: ${info.dateModified || '-'}`);
          updatedCount++;
        } catch (err) {
          console.error(`[${itemIdx}/${urlsToProcess.length}] ❌ Error for ${url}:`, err.message);
          errorCount++;
        }
      })
    );
    await sleep(flags.delay);
  }

  // Fallback pass: For any anime whose lastUpdated is clustered around now or has episode airDates
  if (flags.fallbackEpisodes || flags.all) {
    console.log('\n──────────────────────────────────────────────────');
    console.log('🔄 Checking remaining anime dates via episode airDate fallback...');
    const allAnimes = await Anime.find().select('title slug createdAt lastUpdated episodes').lean();
    let fallbackUpdated = 0;

    for (const a of allAnimes) {
      if (!a.episodes || a.episodes.length === 0) continue;
      const firstEp = a.episodes[0];
      const lastEp = a.episodes[a.episodes.length - 1];

      const firstDate = parseIndonesianDate(firstEp.airDate);
      const lastDate = parseIndonesianDate(lastEp.airDate);

      const update = {};
      // If lastUpdated is missing or set to today/future while episode airDate is valid
      if (lastDate && (!a.lastUpdated || Math.abs(a.lastUpdated.getTime() - lastDate.getTime()) > 86400000 * 2)) {
        update.lastUpdated = lastDate;
      }
      if (firstDate && (!a.createdAt || Math.abs(a.createdAt.getTime() - firstDate.getTime()) > 86400000 * 7)) {
        update.createdAt = firstDate;
      }

      if (Object.keys(update).length > 0) {
        if (!flags.dryRun) {
          await Anime.updateOne({ _id: a._id }, { $set: update });
        }
        fallbackUpdated++;
      }
    }
    console.log(`✅ Fallback updated: ${fallbackUpdated} anime synced via episode airDates.`);
  }

  console.log('\n=======================================');
  console.log('🎉 OTAKUDESU DATE SYNC REPORT');
  console.log(`Total URLs Processed : ${urlsToProcess.length}`);
  console.log(`Successfully Updated : ${updatedCount}`);
  console.log(`Not Matched / Skipped: ${notFoundCount}`);
  console.log(`Errors               : ${errorCount}`);
  console.log('=======================================\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

runSync().catch(err => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
