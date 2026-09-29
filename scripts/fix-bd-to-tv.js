// Fix: ganti type "BD" -> "TV" di collection animes
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://Vercel-Admin-anitoki:ta89j19pugKkx9t3@anitoki.ko5tg1d.mongodb.net/anitoki';

async function main() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('anitoki');
    const col = db.collection('animes');

    // Cek dulu berapa banyak
    const count = await col.countDocuments({ type: 'BD' });
    console.log(`Ditemukan ${count} anime ber-type "BD"`);

    if (count === 0) {
        console.log('Tidak ada yang perlu diubah.');
        await client.close();
        return;
    }

    const result = await col.updateMany({ type: 'BD' }, { $set: { type: 'TV' } });
    console.log(`Updated: ${result.modifiedCount} dokumen`);

    await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
