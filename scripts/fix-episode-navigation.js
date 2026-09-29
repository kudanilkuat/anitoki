#!/usr/bin/env node
/**
 * fix-episode-navigation.js
 * Backfill prevSlug/nextSlug for all existing Episode docs in DB.
 * Groups by animeSlug, sorts by episodeIndex then episodeSlug, then sets nav.
 *
 * Usage: node scripts/fix-episode-navigation.js [--dry-run]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const episodeDocSchema = new mongoose.Schema({
    animeSlug: String,
    episodeSlug: String,
    title: String,
    episodeIndex: Number,
    prevSlug: String,
    nextSlug: String,
    servers: mongoose.Schema.Types.Mixed,
    downloads: mongoose.Schema.Types.Mixed,
}, { strict: false });

async function main() {
    const dryRun = process.argv.includes('--dry-run');

    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not set in .env');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.\n');

    const Episode = mongoose.models.Episode || mongoose.model('Episode', episodeDocSchema);

    // Get all unique animeSlug values
    const animeSlugs = await Episode.distinct('animeSlug');
    console.log(`Found ${animeSlugs.length} anime with episode docs.\n`);

    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const animeSlug of animeSlugs) {
        // Fetch all episodes for this anime, sort numerically
        const episodes = (await Episode.find({ animeSlug })
            .select('episodeSlug episodeIndex prevSlug nextSlug')
            .lean()
        ).sort((a, b) => {
            // Primary: episodeIndex (numeric)
            const idxDiff = (a.episodeIndex ?? Infinity) - (b.episodeIndex ?? Infinity);
            if (idxDiff !== 0) return idxDiff;
            // Secondary: extract trailing number from slug, e.g. "...-episode-12-..." -> 12
            const numOf = s => { const m = s?.match(/(\d+)/g); return m ? parseInt(m[m.length - 1], 10) : 0; };
            return numOf(a.episodeSlug) - numOf(b.episodeSlug);
        });

        if (episodes.length === 0) continue;

        console.log(`[${animeSlug}] ${episodes.length} episodes`);

        for (let i = 0; i < episodes.length; i++) {
            const ep = episodes[i];
            const expectedPrev = episodes[i - 1]?.episodeSlug || null;
            const expectedNext = episodes[i + 1]?.episodeSlug || null;

            // Skip if already correct
            if (ep.prevSlug === expectedPrev && ep.nextSlug === expectedNext) {
                totalSkipped++;
                continue;
            }

            if (dryRun) {
                console.log(`  [DRY] ${ep.episodeSlug}: prev=${expectedPrev} next=${expectedNext}`);
                totalUpdated++;
                continue;
            }

            await Episode.updateOne(
                { _id: ep._id },
                { $set: { prevSlug: expectedPrev, nextSlug: expectedNext } }
            );
            console.log(`  ${ep.episodeSlug}: prev=${expectedPrev} next=${expectedNext}`);
            totalUpdated++;
        }
    }

    console.log(`\nDone. Updated: ${totalUpdated}, Already correct: ${totalSkipped}`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
