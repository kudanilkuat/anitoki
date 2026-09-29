import mongoose from 'mongoose';

const episodeSchema = new mongoose.Schema({
    animeSlug: { type: String, required: true },
    episodeSlug: { type: String, required: true },
    title: String,
    episodeIndex: Number,
    servers: [
        {
            name: { type: String, default: 'Server 1' },
            url: { type: String, default: '' },
            type: { type: String, default: 'iframe' }, // 'mp4' | 'hls' | 'iframe'
        }
    ],
    downloads: [
        {
            quality: String,   // e.g. "360p", "480p", "720p"
            size: String,      // e.g. "86.5 MB"
            links: [
                {
                    name: String, // e.g. "Kraken", "Mega"
                    url: String,
                }
            ],
        }
    ],
    prevSlug: String,
    nextSlug: String,
    createdAt: { type: Date, default: Date.now },
});

episodeSchema.index({ animeSlug: 1, episodeSlug: 1 }, { unique: true });
episodeSchema.index({ animeSlug: 1, episodeIndex: 1 });
episodeSchema.index({ animeSlug: 1, episodeIndex: -1 });

const Episode = mongoose.models.Episode || mongoose.model('Episode', episodeSchema);

export default Episode;
