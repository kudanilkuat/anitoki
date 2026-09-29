import { getAnimeDetail, getAllAnimeSlugs } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import BookmarkButton from '@/components/BookmarkButton';
import AdBanner from '@/components/AdBanner';
import EpisodeList from '@/components/EpisodeList';
import ShareButton from '@/components/ShareButton';

export const revalidate = 300;

export async function generateStaticParams() {
    try {
        const animes = await getAllAnimeSlugs();
        return animes.map((a) => ({ slug: a.slug }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }) {
    const res = await getAnimeDetail(params.slug);
    const anime = res?.data?.info;
    if (!anime) return { title: 'Anime Tidak Ditemukan' };

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://animeku.id';
    const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'AnimeStream';
    const coverImage = anime.coverImage || '';
    const type = anime.type || 'Anime';

    const description = `${type} ${anime.title} sub indo. ${anime.nativeTitle ? anime.nativeTitle + '.' : ''} ${anime.synopsis ? anime.synopsis.slice(0, 120) + '...' : ''}`.replace(/\s+/g, ' ');

    const genreKeywords = Array.isArray(anime.genres) ? anime.genres.map(g => `anime ${g}`).join(',') : '';
    const keywords = [
        anime.title,
        anime.nativeTitle,
        `nonton ${anime.title}`,
        `nonton ${anime.title} sub indo`,
        `${anime.title} sub indo`,
        `streaming ${anime.title}`,
        `${anime.title} online`,
        `${type} ${anime.title}`,
        genreKeywords,
        `${SITE_NAME}`,
        'nonton anime sub indo',
        'streaming anime',
        'anime online gratis',
    ].filter(Boolean).join(',');

    return {
        title: `${anime.title}`,
        description,
        keywords,
        openGraph: {
            title: `${anime.title} - ${SITE_NAME}`,
            description,
            images: [{ url: coverImage, width: 460, height: 650, alt: anime.title }],
            type: 'video.tv_show',
            locale: 'id_ID',
            siteName: SITE_NAME,
            url: `${SITE_URL}/anime/${params.slug}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${anime.title} - ${SITE_NAME}`,
            description,
            images: [coverImage],
        },
        alternates: {
            canonical: `${SITE_URL}/anime/${params.slug}`,
        },
    };
}

function formatNum(n) {
    if (!n) return '0';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
}

function TypeBadge({ type }) {
    const t = (type || '').toLowerCase();
    const styles = {
        special: 'bg-status-expired/15 border-status-expired/30 text-status-expired',
        ova: 'bg-primary-stitch/15 border-primary-stitch/30 text-primary-stitch',
        movie: 'bg-status-pending/15 border-status-pending/30 text-status-pending',
        series: 'bg-primary-container/30 border-primary-container/50 text-on-primary',
        anime: 'bg-primary-container/30 border-primary-container/50 text-on-primary',
    };
    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border tracking-wider ${styles[t] || styles.anime}`}>
            {type}
        </span>
    );
}

function StatusBadge({ status }) {
    const s = (status || '').toLowerCase();
    const isOngoing = s === 'ongoing' || s === 'airing';
    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border tracking-wider flex items-center gap-1 ${isOngoing ? 'bg-status-ongoing/15 border-status-ongoing/30 text-status-ongoing' : 'bg-surface-bright/30 border-border-subtle/50 text-on-surface-variant'}`}>
            {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-status-ongoing inline-block" />}
            {isOngoing ? 'Ongoing' : status || 'Completed'}
        </span>
    );
}

function StatItem({ icon, value, label }) {
    return (
        <div className="flex flex-col items-center gap-1 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
                {icon}
                <span className="font-bold text-on-surface text-sm">{value}</span>
            </div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">{label}</span>
        </div>
    );
}

function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex gap-2 text-sm">
            <span className="text-on-surface-variant flex-shrink-0 w-24">{label}</span>
            <span className="text-on-surface/90">{value}</span>
        </div>
    );
}

export default async function AnimeDetailPage({ params }) {
    const res = await getAnimeDetail(params.slug);
    if (!res?.data?.info) notFound();

    const { info: anime, episodes = [], recommendations = [] } = res.data;

    const coverImage = anime.coverImage || '';
    const type = anime.type || '';
    const status = anime.status || '';
    const nativeTitle = anime.nativeTitle || '';
    const synopsis = anime.synopsis || '';
    const article = anime.article || '';
    const rating = anime.rating || 0;
    const genres = anime.tags || anime.genres || [];
    const airDate = anime.airDate || '';
    const producer = anime.producer || '';
    const studio = anime.studio || '';
    const duration = anime.duration || '';
    const totalEpisode = anime.totalEpisode || 0;

    const firstEpisode = episodes[episodes.length - 1];
    const latestEpisode = episodes[0];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TVSeries',
        name: anime.title,
        image: coverImage,
        genre: genres?.join(', '),
        ...(rating > 0 && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: rating,
                bestRating: 10,
                worstRating: 1,
                ratingCount: anime.ratingCount || anime.views || 1,
            },
        }),
    };

    return (
        <div className="min-h-screen bg-surface-deep">
            <Navbar />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <main className="pt-16 pb-24">

                {/* ===== HERO BACKDROP ===== */}
                <div className="relative">
                    {coverImage && (
                        <div className="absolute inset-0 z-0 overflow-hidden">
                            <Image
                                src={coverImage}
                                alt=""
                                fill
                                sizes="100vw"
                                priority
                                className="object-cover scale-110 blur-xl opacity-20"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-surface-deep/70 via-surface-deep/85 to-surface-deep" />
                        </div>
                    )}

                    <div className="relative z-10 max-w-5xl mx-auto px-4 pt-8 pb-6 md:pt-12 md:pb-10">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-10">

                            {/* Cover Image */}
                            <div className="flex-none flex justify-center md:justify-start">
                                <div className="relative w-[160px] md:w-[200px] h-[210px] md:h-[270px] rounded-2xl overflow-hidden border border-border-subtle/50 shadow-2xl shadow-black/60">
                                    {coverImage && (
                                        <Image
                                            src={coverImage}
                                            alt={anime.title}
                                            fill
                                            sizes="(max-width: 768px) 160px, 200px"
                                            priority
                                            className="object-cover"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 min-w-0 flex flex-col md:justify-center">
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                                    {type && <TypeBadge type={type} />}
                                    {status && <StatusBadge status={status} />}
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl md:text-3xl font-black text-on-surface leading-tight tracking-wide mb-2 text-center md:text-left">
                                    {anime.title}
                                </h1>

                                {/* Native Title */}
                                {nativeTitle && (
                                    <p className="text-sm md:text-base text-on-surface-variant font-medium italic mb-4 text-center md:text-left">
                                        {nativeTitle}
                                    </p>
                                )}

                                {/* Stats Row */}
                                <div className="flex items-center justify-center md:justify-start gap-0 mb-5 bg-surface-elevated border border-border-subtle/40 rounded-xl w-fit mx-auto md:mx-0">
                                    {rating > 0 && (
                                        <StatItem
                                            icon={<svg viewBox="0 0 24 24" fill="#F59E0B" className="w-4 h-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                                            value={rating.toFixed(2)}
                                            label="Skor"
                                        />
                                    )}
                                    <div className="w-px h-8 bg-border-subtle/50" />
                                    <StatItem
                                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary-stitch"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                                        value={formatNum(anime.views)}
                                        label="Views"
                                    />
                                    <div className="w-px h-8 bg-border-subtle/50" />
                                    <StatItem
                                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-status-ongoing"><polygon points="5 3 19 12 5 21 5 3" /></svg>}
                                        value={episodes.length}
                                        label="Episode"
                                    />
                                </div>

                                {/* Info Details */}
                                <div className="flex flex-col gap-2 mb-5">
                                    <InfoRow label="Tayang" value={airDate} />
                                    <InfoRow label="Studio" value={studio} />
                                    <InfoRow label="Produser" value={producer} />
                                    <InfoRow label="Durasi" value={duration} />
                                    <InfoRow label="Episode" value={totalEpisode > 0 ? String(totalEpisode) : (episodes.length > 0 ? String(episodes.length) : null)} />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                    {firstEpisode && (
                                        <Link
                                            href={`/episode/${anime.slug}/${firstEpisode.slug}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-elevated border border-border-subtle/50 rounded-xl text-on-surface font-bold text-sm hover:bg-surface-variant hover:border-primary-stitch/40 transition-all"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                            Ep. Pertama
                                        </Link>
                                    )}
                                    {latestEpisode && (
                                        <Link
                                            href={`/episode/${anime.slug}/${latestEpisode.slug}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-container rounded-xl text-on-primary font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary-container/20"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 flex-shrink-0"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
                                            Ep. Terbaru
                                        </Link>
                                    )}
                                </div>

                                {/* Bookmark & Share */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <BookmarkButton anime={anime} />
                                    </div>
                                    <ShareButton title={anime.title} slug={anime.slug} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== BODY CONTENT ===== */}
                <div className="max-w-5xl mx-auto px-4">

                    {/* Genres */}
                    {genres?.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">Genre</h2>
                            <div className="flex flex-wrap gap-2">
                                {genres.map((g) => (
                                    <Link
                                        key={`genre-${g}`}
                                        href={`/anime?genre=${encodeURIComponent(g)}`}
                                        className="text-[11px] font-semibold px-3 py-1.5 bg-surface-elevated text-on-surface-variant rounded-lg border border-border-subtle/50 hover:text-primary-stitch hover:border-primary-stitch/40 hover:bg-primary-stitch/5 transition-all"
                                    >
                                        {g}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Synopsis */}
                    {synopsis && (
                        <div className="mt-6">
                            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Sinopsis</h2>
                            <div className="bg-surface-elevated border border-border-subtle/50 rounded-xl p-4">
                                <p className="text-on-surface/80 text-sm leading-relaxed whitespace-pre-wrap">{synopsis}</p>
                            </div>
                        </div>
                    )}

                    {/* Article */}
                    {article && (
                        <div className="mt-6">
                            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Artikel</h2>
                            <div className="bg-surface-elevated border border-border-subtle/50 rounded-xl p-4 prose prose-invert prose-sm max-w-none prose-p:text-on-surface/80 prose-headings:text-on-surface">
                                <div dangerouslySetInnerHTML={{ __html: article.replace(/\n/g, '<br/>') }} />
                            </div>
                        </div>
                    )}

                    <AdBanner slot="BEFORE_CHAPTERS" className="mt-6" />

                    {/* Episode List */}
                    <div className="mt-8 flex flex-col lg:flex-row gap-8">
                        {episodes.length > 0 && (
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary-stitch"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                        Daftar Episode
                                    </h2>
                                    <span className="text-xs text-on-surface-variant bg-surface-elevated px-2.5 py-1 rounded-full border border-border-subtle/50">{episodes.length} episode</span>
                                </div>
                                <EpisodeList episodes={episodes} animeSlug={anime.slug} animeFallbackDate={anime.lastUpdated} />
                            </div>
                        )}
                    </div>

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-4 flex items-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary-stitch"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                Rekomendasi
                            </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                {recommendations.map((rec) => (
                                    <Link
                                        key={rec.slug}
                                        href={`/anime/${rec.slug}`}
                                        className="group flex flex-col gap-1.5"
                                    >
                                        <div className="relative w-full rounded-xl overflow-hidden border border-border-subtle/40 group-hover:border-primary-stitch/40 transition-colors" style={{ aspectRatio: '2/3' }}>
                                            {rec.coverImage ? (
                                                <Image
                                                    src={rec.coverImage}
                                                    alt={rec.title}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-surface-container" />
                                            )}
                                            {rec.type && (
                                                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-deep/80 text-on-surface-variant border border-border-subtle/50">{rec.type}</span>
                                            )}
                                            {rec.status && (
                                                <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary-container/90 text-on-primary">{rec.status}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-on-surface-variant font-semibold line-clamp-2 leading-snug group-hover:text-primary-stitch transition-colors">{rec.title}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="h-6" />

                    <footer className="pt-8 pb-24 md:pb-8 border-t border-border-subtle/40 mt-12 flex flex-col items-center w-full max-w-[1400px] mx-auto relative z-10">
                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4 px-4">
                            <a href="/privacy-policy" className="text-[13px] sm:text-sm font-semibold text-primary-stitch hover:text-on-surface transition-colors">
                                Privacy Policy
                            </a>
                            <a href="/terms" className="text-[13px] sm:text-sm font-semibold text-primary-stitch hover:text-on-surface transition-colors">
                                Terms of Service
                            </a>
                        </div>
                        <p className="text-center text-on-surface-variant/50 text-[11px] sm:text-xs">
                            © 2026 {process.env.NEXT_PUBLIC_SITE_NAME || 'AnimeStream'} · All rights reserved.
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
