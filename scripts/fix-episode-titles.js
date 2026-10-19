#!/usr/bin/env node
/**
 * fix-episode-titles.js
 * Clean up cluttered episode titles (e.g. "Mangaka-san to Assistant-san to OVA 6 Subtitle Indonesia" -> "OVA 6")
 * across both Episode documents and Anime.episodes arrays.
 *
 * Usage:
 *   node scripts/fix-episode-titles.js [--dry-run]
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

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

async function main() {
    const dryRun = process.argv.includes('--dry-run');

    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not set in .env');
        process.exit(1);
    }

    console.log(`Connecting to MongoDB... ${dryRun ? '[DRY RUN MODE]' : ''}`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.\n');

    const Episode = mongoose.models.Episode || mongoose.model(
        'Episode',
        new mongoose.Schema(
            { animeSlug: String, episodeSlug: String, title: String },
            { strict: false }
        )
    );

    const Anime = mongoose.models.Anime || mongoose.model(
        'Anime',
        new mongoose.Schema(
            { title: String, slug: String, episodes: Array },
            { strict: false }
        )
    );

    // ── 1. Fix Episode collection ──
    console.log('=== Step 1: Checking Episode collection ===');
    const badEpisodes = await Episode.find({
        $or: [
            { title: /Subtitle Indonesia/i },
            { title: /Sub Indo/i },
        ],
    }).lean();

    console.log(`Found ${badEpisodes.length} Episode docs to clean.`);
    let episodeFixedCount = 0;

    for (const ep of badEpisodes) {
        const oldTitle = ep.title;
        const newTitle = cleanEpisodeTitle(oldTitle);

        if (oldTitle !== newTitle) {
            console.log(`  [Episode] ${ep.episodeSlug}: "${oldTitle}" -> "${newTitle}"`);
            if (!dryRun) {
                await Episode.updateOne(
                    { _id: ep._id },
                    { $set: { title: newTitle } }
                );
            }
            episodeFixedCount++;
        }
    }

    // ── 2. Fix Anime.episodes collection ──
    console.log('\n=== Step 2: Checking Anime collection ===');
    const badAnimes = await Anime.find({
        $or: [
            { 'episodes.title': /Subtitle Indonesia/i },
            { 'episodes.title': /Sub Indo/i },
        ],
    }).lean();

    console.log(`Found ${badAnimes.length} Anime docs with episode titles to clean.`);
    let animeFixedCount = 0;
    let animeEpisodesFixedCount = 0;

    for (const anime of badAnimes) {
        let changed = false;
        const updatedEpisodes = (anime.episodes || []).map((ep) => {
            const oldTitle = ep.title || '';
            const newTitle = cleanEpisodeTitle(oldTitle, anime.title);
            if (oldTitle !== newTitle) {
                changed = true;
                animeEpisodesFixedCount++;
                console.log(`  [Anime: ${anime.slug}] "${oldTitle}" -> "${newTitle}"`);
                return { ...ep, title: newTitle };
            }
            return ep;
        });

        if (changed) {
            if (!dryRun) {
                await Anime.updateOne(
                    { _id: anime._id },
                    { $set: { episodes: updatedEpisodes } }
                );
            }
            animeFixedCount++;
        }
    }

    console.log('\n==========================================');
    console.log(`Summary:`);
    console.log(`- Episode docs updated: ${episodeFixedCount}`);
    console.log(`- Anime docs updated: ${animeFixedCount} (${animeEpisodesFixedCount} episode items)`);
    if (dryRun) {
        console.log(`\n[DRY RUN] No changes were written to the database. Run without --dry-run to apply.`);
    } else {
        console.log(`\nSuccessfully applied changes to MongoDB!`);
    }
    console.log('==========================================');

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
