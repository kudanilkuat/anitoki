#!/usr/bin/env node
/**
 * Migration: replace desustream.me → desustream.info in Episode.servers[].url
 * Usage:
 *   node scripts/fix-desustream-domain.js          # dry run
 *   node scripts/fix-desustream-domain.js --write  # apply
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const WRITE = process.argv.includes('--write');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const col = db.collection('episodes');

    // Find docs with desustream.me in any server URL
    const docs = await col.find({ 'servers.url': /desustream\.info/ }).toArray();
    console.log(`Found ${docs.length} episode docs with desustream.info`);

    if (!WRITE) {
        console.log('Dry run — pass --write to apply');
        for (const doc of docs.slice(0, 5)) {
            console.log(' ', doc.episodeSlug, doc.servers.filter(s => s.url?.includes('desustream.me')).map(s => s.url));
        }
        await mongoose.disconnect();
        return;
    }

    let updated = 0;
    for (const doc of docs) {
        const newServers = doc.servers.map(s => ({
            ...s,
            url: s.url?.replace(/desustream\.info/g, 'desustream.net') ?? s.url,
        }));
        await col.updateOne({ _id: doc._id }, { $set: { servers: newServers } });
        updated++;
        if (updated % 50 === 0) process.stdout.write(`\r${updated}/${docs.length}`);
    }

    console.log(`\nUpdated ${updated} docs`);
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
