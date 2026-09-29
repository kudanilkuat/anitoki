import mongoose from 'mongoose';

const animeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    nativeTitle: String, // Judul Jepang
    slug: { type: String, unique: true },
    coverImage: String,
    type: { type: String, default: 'Anime' }, // Hentai / OVA / Movie / Series / TV
    rating: { type: Number, default: 0 }, // Skor
    views: { type: Number, default: 0 },
    status: String, // Completed / Ongoing
    airDate: String, // Tayang
    producer: String,
    studio: String,
    duration: String,
    totalEpisode: Number,
    synopsis: String,
    article: String,
    genres: [String],
    episodes: [{
        title: String, // Episode 1
        slug: String,
        airDate: String,
    }],
    sourceUrl: { type: String, unique: true, sparse: true },
    lastUpdated: { type: Date, default: Date.now },
});

const Anime = mongoose.models.Anime || mongoose.model('Anime', animeSchema);

export default Anime;
