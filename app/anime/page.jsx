import { getAnimeList, getGenres } from '@/lib/api';
import Navbar from '@/components/Navbar';
import AnimeBrowseClient from '@/components/AnimeBrowseClient';
import AdBanner from '@/components/AdBanner';
import { Suspense } from 'react';

export const revalidate = 120;

export async function generateMetadata({ searchParams }) {
    const q = searchParams?.q;
    const type = searchParams?.type;
    const genre = searchParams?.genre;
    const status = searchParams?.status;
    const order = searchParams?.order;

    let title = 'Daftar Anime';
    if (q) title = `Cari: ${q}`;
    else if (genre) title = `Genre: ${genre}`;
    else if (type) title = `${type} Terbaru`;
    else if (status === 'Ongoing' || status === 'ongoing') title = 'Anime Ongoing';
    else if (status === 'Completed' || status === 'completed') title = 'Anime Completed';
    else if (order === 'popular') title = 'Anime Terpopuler';
    else if (order === 'oldest') title = 'Anime Terlama';
    else if (order === 'az') title = 'Anime A-Z';
    else if (order === 'za') title = 'Anime Z-A';

    return {
        title,
        description: `${title} — Temukan ribuan judul anime di ${process.env.NEXT_PUBLIC_SITE_NAME || 'Animeku'}.`,
        ...(q && {
            robots: { index: false, follow: true },
        }),
    };
}

export default async function BrowsePage({ searchParams }) {
    const page = Number(searchParams?.page) || 1;

    const filters = {
        q: searchParams?.q || '',
        genre: searchParams?.genre || '',
        type: searchParams?.type || '',
        status: searchParams?.status || '',
        order: searchParams?.order || 'latest',
    };

    const [animeRes, categoryRes] = await Promise.all([
        getAnimeList({ ...filters, page, limit: 24 }),
        getGenres(),
    ]);

    const animes = animeRes?.data || [];
    const pagination = animeRes?.pagination || {};

    const categories = categoryRes?.data || { genres: [] };
    const genres = Array.isArray(categories) ? categories : (categories.genres || []);

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-gray-200">
            <Navbar />

            <main className="pt-24 pb-safe max-w-[1280px] mx-auto px-4 md:px-6 pb-20">
                <AdBanner slot="BROWSE_BANNER" className="mb-6" />

                <Suspense fallback={null}>
                    <AnimeBrowseClient
                        initialAnimes={animes}
                        initialPagination={pagination}
                        initialFilters={filters}
                        genres={genres}
                    />
                </Suspense>
            </main>
        </div>
    );
}
