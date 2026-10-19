import mongoose from 'mongoose';

const animeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    nativeTitle: String, // Judul Jepang
    slug: { type: String, unique: true },
    coverImage: String,
    bannerImage: String, // Banner / Backdrop dari AniList
    type: { type: String, default: 'Anime' }, // Hentai / OVA / Movie / Series / TV
    rating: { type: Number, default: 0 }, // Skor (1-10)
    views: { type: Number, default: 0 },
    status: String, // Completed / Ongoing
    airDate: String, // Tayang
    producer: String,
    studio: String,
    duration: String,
    totalEpisode: Number,
    synopsis: String,
    synopsisEn: String,
    article: String,
    genres: [String],
    episodes: [{
        title: String, // Episode 1
        slug: String,
        airDate: String,
        sourceUrl: String,
    }],
    sourceUrl: { type: String, unique: true, sparse: true },
    lastUpdated: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now, index: true },
    anilistId: { type: Number, index: true },
    malId: Number,
    season: String,
    seasonYear: Number,
    englishTitle: String,
    romajiTitle: String,
    color: String,
});

const Anime = mongoose.models.Anime || mongoose.model('Anime', animeSchema);

export default Anime;
