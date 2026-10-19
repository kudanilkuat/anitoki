import ReaderClient from './ReaderClient';
import Navbar from '@/components/Navbar';
import { getAllAnimeSlugs, getAnimeDetail } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://animeku.id';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'AnimeStream';

export const revalidate = 300;

export async function generateStaticParams() {
    try {
        const animes = await getAllAnimeSlugs();
        const params = [];
        await Promise.allSettled(
            animes.map(async (anime) => {
                try {
                    const res = await getAnimeDetail(anime.slug);
                    const episodes = res?.data?.episodes || res?.data?.chapters || [];
                    for (const ep of episodes) {
                        if (ep.slug) params.push({ slug: anime.slug, episodeSlug: ep.slug });
                    }
                } catch { /* skip */ }
            })
        );
        return params;
    } catch {
        return [];
    }
}

async function getEpisodeData(slug, episodeSlug) {
    try {
        const base = process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
        const res = await fetch(`${base}/api/episode/${slug}/${episodeSlug}`, { next: { revalidate: 300 } });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json.success || !json.data) return null;
        return json.data;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug, episodeSlug } = await params;
    const data = await getEpisodeData(slug, episodeSlug);

    if (!data) {
        return {
            title: `Nonton Anime - ${SITE_NAME}`,
            description: `Nonton anime episode online gratis di ${SITE_NAME}.`,
            robots: { index: true, follow: true },
        };
    }

    const anime = data.anime || data.manga;
    const episode = data.episode || data.chapter;
    const baseTitle = `${anime.title} ${episode.title} Subtitle Indonesia`.replace(/\s+/g, ' ');
    const description = `Nonton ${anime.title} ${episode.title} sub indo di ${SITE_NAME}. Streaming anime ${anime.title} selalu diperbarui di ${SITE_NAME}. Jangan lupa lihat update anime lainnya.`.replace(/\s+/g, ' ');
    const canonicalUrl = `${SITE_URL}/episode/${slug}/${episodeSlug}`;
    const coverImage = anime.coverImage || `${SITE_URL}/og-image.png`;

    const isHentai = anime.genres?.some(g => (g || '').toLowerCase() === 'hentai') || anime.type?.toLowerCase() === 'hentai';

    return {
        title: baseTitle,
        description,
        alternates: { canonical: canonicalUrl },
        robots: isHentai
            ? { index: false, follow: true, noarchive: true, nosnippet: true }
            : { index: true, follow: true, noarchive: false },
        other: isHentai ? {
            rating: 'adult',
            'RTA-5042-1996-1400-1579-1604-10': 'adult',
        } : {},
        openGraph: {
            title: `${baseTitle} - ${SITE_NAME}`,
            description,
            url: canonicalUrl,
            siteName: SITE_NAME,
            type: 'video.episode',
            locale: 'id_ID',
            images: [{ url: coverImage, width: 460, height: 650, alt: anime.title }],
        },
        twitter: {
            card: 'summary_large_image',
            title: baseTitle,
            description,
            images: [coverImage],
        },
    };
}

export default async function EpisodePlayerPage({ params }) {
    const { slug, episodeSlug } = await params;
    const data = await getEpisodeData(slug, episodeSlug);

    const anime = data?.anime || data?.manga;
    const episode = data?.episode || data?.chapter;

    const canonicalUrl = `${SITE_URL}/episode/${slug}/${episodeSlug}`;
    const animeUrl = `${SITE_URL}/anime/${slug}`;
    const title = anime && episode
        ? `${anime.title} ${episode.title} Sub Indo`.replace(/\s+/g, ' ')
        : episodeSlug;
    const description = anime && episode
        ? `Nonton ${anime.title} ${episode.title} sub indo di ${SITE_NAME}.`.replace(/\s+/g, ' ')
        : '';
    const coverImage = anime?.coverImage || `${SITE_URL}/og-image.png`;

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: anime?.title || 'Anime', item: animeUrl },
            { '@type': 'ListItem', position: 3, name: episode?.title || episodeSlug, item: canonicalUrl },
        ],
    };

    const videoJsonLd = anime && episode ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: title,
        description,
        thumbnailUrl: coverImage,
        uploadDate: episode.createdAt || new Date().toISOString(),
        embedUrl: canonicalUrl,
        url: canonicalUrl,
        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/android-chrome-192x192.png` },
        },
        partOfSeries: { '@type': 'TVSeries', name: anime.title, url: animeUrl },
    } : null;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            {videoJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
                />
            )}

            {/* SEO hidden content for crawlers */}
            {anime && episode && (
                <div
                    aria-hidden="false"
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        overflow: 'hidden',
                        clip: 'rect(0,0,0,0)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <h1>{title}</h1>
                    <p>{description}</p>
                    <p>Judul: {anime.title}</p>
                    <p>Episode: {episode.title}</p>
                    {anime.synopsis && <p>Sinopsis: {anime.synopsis}</p>}
                    {anime.genres?.length > 0 && <p>Genre: {anime.genres.join(', ')}</p>}
                    <a href={animeUrl}>Kembali ke halaman {anime.title}</a>
                </div>
            )}

            <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 mt-14 md:mt-16 w-full max-w-[1400px] mx-auto">
                    <ReaderClient initialData={data} />
                </main>
            </div>
        </>
    );
}
