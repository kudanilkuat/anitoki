import 'dotenv/config';
import mongoose from 'mongoose';
import Anime from '../lib/models/Anime.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env'
    );
}

async function findNoRating() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB.');

        const animes = await Anime.find({
            $or: [
                { rating: 0 },
                { rating: null },
                { rating: { $exists: false } }
            ]
        }).select('title slug rating').lean();

        console.log(`Found ${animes.length} animes with no rating:`);
        for (const anime of animes) {
            console.log(`- ${anime.title} (Slug: ${anime.slug}, Rating: ${anime.rating})`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from DB.');
    }
}

findNoRating();
