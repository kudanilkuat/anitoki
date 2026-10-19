#!/usr/bin/env node
/**
 * scripts/sync-anilist.js
 * Synchronizes anime data in Anitoki database with AniList GraphQL API.
 *
 * Usage:
 *   node scripts/sync-anilist.js [options]
 *
 * Options:
 *   --slug=<slug>          Sync a single anime by slug
 *   --no-rating            Sync only animes where rating == 0 or missing
 *   --empty-genres         Fix anime documents with empty string in genres array
 *   --no-banner            Sync animes that do not have bannerImage yet
 *   --all                  Process all animes in the database
 *   --limit=<N>            Max number of animes to process (e.g. --limit=20)
 *   --skip=<N>             Skip the first N matching documents
 *   --dry-run              Preview changes without saving to MongoDB
 *   --force-cover          Overwrite current coverImage with AniList HD cover
 *   --force-synopsis       Overwrite synopsis with AniList English description
 *   --delay=<ms>           Delay between requests in ms (default: 800)
 *
 * Examples:
 *   node scripts/sync-anilist.js --slug=mushoku-tensei-season-3
 *   node scripts/sync-anilist.js --no-rating --limit=10
 *   node scripts/sync-anilist.js --no-rating
 *   node scripts/sync-anilist.js --all --limit=50
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Anime from '../lib/models/Anime.js';
import { findBestAniListMatch, mapAniListToAnime, sleep } from '../lib/anilist.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Parse CLI flags
const args = process.argv.slice(2);
const flags = {
  slug: null,
  noRating: false,
  emptyGenres: false,
  noBanner: false,
  ongoing: false,
  all: false,
  limit: 0,
  skip: 0,
  dryRun: false,
  forceCover: false,
  forceSynopsis: false,
  reMatch: false,
  delay: 800,
};

for (const arg of args) {
  if (arg.startsWith('--slug=')) flags.slug = arg.split('=')[1].trim();
  else if (arg === '--no-rating') flags.noRating = true;
  else if (arg === '--empty-genres') flags.emptyGenres = true;
  else if (arg === '--no-banner') flags.noBanner = true;
  else if (arg === '--ongoing') flags.ongoing = true;
  else if (arg === '--all') flags.all = true;
  else if (arg.startsWith('--limit=')) flags.limit = parseInt(arg.split('=')[1], 10);
  else if (arg.startsWith('--skip=')) flags.skip = parseInt(arg.split('=')[1], 10);
  else if (arg === '--dry-run') flags.dryRun = true;
  else if (arg === '--re-match') flags.reMatch = true;
  else if (arg === '--force-cover') flags.forceCover = true;
  else if (arg === '--force-synopsis') flags.forceSynopsis = true;
  else if (arg.startsWith('--delay=')) flags.delay = parseInt(arg.split('=')[1], 10);
}

// Default to help if no filter specified
if (!flags.slug && !flags.noRating && !flags.emptyGenres && !flags.noBanner && !flags.all && !flags.ongoing) {
  console.log(`
ℹ️  No filter specified. Please choose an option:
    --slug=<slug>     Sync single anime by slug
    --ongoing         Sync ongoing anime (defaults to those without banner)
    --no-rating       Sync anime with 0 or missing rating
    --empty-genres    Clean empty genres
    --no-banner       Sync anime without bannerImage
    --all             Sync all anime in DB
    --dry-run         Test without modifying DB
  `);
  process.exit(0);
}

async function runSync() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.\n');

  // Build Query
  const query = {};

  if (flags.slug) {
    query.slug = flags.slug;
  } else {
    if (flags.ongoing) {
      query.status = { $regex: 'ongoing|airing', $options: 'i' };
    }
    if (flags.noRating) {
      query.$or = [{ rating: 0 }, { rating: null }, { rating: { $exists: false } }];
    } else if (flags.emptyGenres) {
      query.genres = '';
    } else if (flags.noBanner || (flags.ongoing && !flags.all)) {
      query.$or = [{ bannerImage: null }, { bannerImage: '' }, { bannerImage: { $exists: false } }];
    }
  }

  let dbQuery = Anime.find(query).sort({ lastUpdated: -1 });
  if (flags.skip > 0) dbQuery = dbQuery.skip(flags.skip);
  if (flags.limit > 0) dbQuery = dbQuery.limit(flags.limit);

  const animeList = await dbQuery.lean();
  const totalFound = animeList.length;

  console.log(`📋 Found ${totalFound} anime matching filter [dryRun=${flags.dryRun}]:`);
  if (totalFound === 0) {
    console.log('Nothing to sync.');
    await mongoose.disconnect();
    return;
  }

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (let i = 0; i < animeList.length; i++) {
    const item = animeList[i];
    const prefix = `[${i + 1}/${totalFound}]`;
    console.log(`\n${prefix} Processing: "${item.title}" (slug: ${item.slug})`);

    try {
      const match = await findBestAniListMatch({
        title: item.title,
        nativeTitle: item.nativeTitle,
        slug: item.slug,
        anilistId: flags.reMatch ? null : item.anilistId,
        type: item.type,
        episodesCount: item.episodes?.length || item.totalEpisode || 0,
        totalEpisode: item.totalEpisode,
      });

      if (!match) {
        console.log(`   ⚠️ AniList match not found.`);
        notFoundCount++;
        // If empty genres fix requested, still clean empty genres even if not found on AniList
        if (flags.emptyGenres && Array.isArray(item.genres) && item.genres.includes('')) {
          const cleanedGenres = item.genres.map(g => (g || '').trim()).filter(Boolean);
          if (!flags.dryRun) {
            await Anime.updateOne({ _id: item._id }, { $set: { genres: cleanedGenres } });
            console.log(`   🧹 Cleaned empty genres in DB.`);
          }
        }
        await sleep(flags.delay);
        continue;
      }

      const mapped = mapAniListToAnime(match, item, {
        preserveIndonesianSynopsis: !flags.forceSynopsis,
        overwriteCover: flags.forceCover,
      });

      console.log(`   ✨ Matched AniList: "${match.title?.romaji || match.title?.english}" (ID: ${match.id})`);
      console.log(`      • Rating: ${item.rating || 0} -> ${mapped.rating}`);
      console.log(`      • Type/Format: ${item.type || '-'} -> ${mapped.type}`);
      console.log(`      • Studio: ${item.studio || '-'} -> ${mapped.studio || '-'}`);
      console.log(`      • Duration: ${item.duration || '-'} -> ${mapped.duration || '-'}`);
      console.log(`      • Episodes: ${item.totalEpisode || 0} -> ${mapped.totalEpisode}`);
      if (mapped.bannerImage) {
        console.log(`      • Banner: ${mapped.bannerImage.substring(0, 50)}...`);
      }
      console.log(`      • Genres (${mapped.genres.length}): ${mapped.genres.join(', ')}`);

      if (!flags.dryRun) {
        await Anime.updateOne({ _id: item._id }, { $set: mapped });
        console.log(`   💾 Saved to database successfully.`);
      } else {
        console.log(`   [DRY-RUN] No changes saved.`);
      }

      successCount++;
    } catch (err) {
      console.error(`   ❌ Error syncing anime:`, err.message);
      errorCount++;
    }

    // Rate-limit throttle
    await sleep(flags.delay);
  }

  console.log('\n=======================================');
  console.log('🎉 SYNC COMPLETE REPORT');
  console.log(`Total Processed: ${totalFound}`);
  console.log(`Successfully Synced: ${successCount}`);
  console.log(`Not Found on AniList: ${notFoundCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('=======================================\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

runSync().catch(err => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
