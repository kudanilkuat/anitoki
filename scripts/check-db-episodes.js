const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const Anime = mongoose.models.Anime || mongoose.model('Anime', new mongoose.Schema({
        slug: String,
        title: String,
        type: String,
        episodes: Array,
    }, { strict: false }));

    const Episode = mongoose.models.Episode || mongoose.model('Episode', new mongoose.Schema({
        animeSlug: String,
        episodeSlug: String,
        title: String,
        episodeIndex: Number,
        prevSlug: String,
        nextSlug: String,
    }, { strict: false }));

    const animes = await Anime.find({ type: { $regex: /hentai/i } }, 'slug title type episodes').lean();
    console.log(`Found ${animes.length} hentai anime in DB:`);

    for (const a of animes) {
        console.log(`\n========================================`);
        console.log(`Anime: "${a.title}" | slug: "${a.slug}" | type: "${a.type}"`);
        console.log(`Anime.episodes in Anime doc (${a.episodes?.length || 0}):`);
        (a.episodes || []).forEach((e, idx) => {
            console.log(`  [${idx}] slug: "${e.slug}" | title: "${e.title}" | airDate: "${e.airDate}"`);
        });

        const episodes = await Episode.find({ animeSlug: a.slug }).lean();
        console.log(`Episode collection docs (${episodes.length}):`);
        episodes.forEach(e => {
            console.log(`  epSlug: "${e.episodeSlug}" | idx: ${e.episodeIndex} | prev: "${e.prevSlug}" | next: "${e.nextSlug}"`);
        });
    }

    await mongoose.disconnect();
    console.log('\nDisconnected.');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
