#!/usr/bin/env node
/**
 * Decode link.desustream.com shortlinks di semua Episode docs yang sudah ada di DB.
 * Usage:
 *   node scripts/decode-download-links.js           # dry run
 *   node scripts/decode-download-links.js --write   # actually update DB
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const DRY_RUN = !process.argv.includes('--write');

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

async function main() {
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!MONGO_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

    await mongoose.connect(MONGO_URI);
    console.log(`Connected. DRY_RUN=${DRY_RUN}`);

    const db = mongoose.connection.db;
    const col = db.collection('episodes');

    // Find docs that have at least one link.desustream.com URL
    const docs = await col.find({
        'downloads.links.url': { $regex: 'link\\.desustream\\.com' }
    }).toArray();

    console.log(`Found ${docs.length} episode docs with shortlinks`);

    let totalLinks = 0;
    let resolved = 0;

    for (const doc of docs) {
        let dirty = false;
        for (const dl of doc.downloads || []) {
            for (const lnk of dl.links || []) {
                if (!lnk.url?.includes('link.desustream.com')) continue;
                totalLinks++;
                const newUrl = await resolveShortLink(lnk.url);
                if (newUrl !== lnk.url) {
                    console.log(`  [${doc.slug}] ${lnk.url}\n    → ${newUrl}`);
                    lnk.url = newUrl;
                    dirty = true;
                    resolved++;
                } else {
                    console.log(`  [${doc.slug}] UNCHANGED: ${lnk.url}`);
                }
                // brief delay to avoid hammering
                await new Promise(r => setTimeout(r, 200));
            }
        }

        if (dirty && !DRY_RUN) {
            await col.updateOne(
                { _id: doc._id },
                { $set: { downloads: doc.downloads } }
            );
        }
    }

    console.log(`\nDone. ${resolved}/${totalLinks} links resolved.`);
    if (DRY_RUN) console.log('DRY RUN — no DB changes. Re-run with --write to apply.');

    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
