import 'dotenv/config';
import mongoose from 'mongoose';
import Anime from '../lib/models/Anime.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
    await mongoose.connect(MONGODB_URI);
    const total = await Anime.countDocuments();
    const noRating = await Anime.countDocuments({
        $or: [{ rating: 0 }, { rating: null }, { rating: { $exists: false } }]
    });
    const noStudio = await Anime.countDocuments({
        $or: [{ studio: '' }, { studio: null }, { studio: { $exists: false } }]
    });
    const noNative = await Anime.countDocuments({
        $or: [{ nativeTitle: '' }, { nativeTitle: null }, { nativeTitle: { $exists: false } }]
    });
    const emptyGenre = await Anime.countDocuments({
        genres: ''
    });
    const withBanner = await Anime.countDocuments({
        bannerImage: { $exists: true, $ne: null, $nin: ['', null] }
    });

    console.log('Total Anime:', total);
    console.log('With HD Banner:', withBanner);
    console.log('Without HD Banner:', total - withBanner);
    console.log('No Rating:', noRating);
    console.log('No Studio:', noStudio);
    console.log('No Native Title:', noNative);
    console.log('Has empty genre string "":', emptyGenre);

    await mongoose.disconnect();
}

check();
