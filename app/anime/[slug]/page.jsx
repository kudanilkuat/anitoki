import { getAnimeDetail, getAllAnimeSlugs } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import BookmarkButton from '@/components/BookmarkButton';
import AdBanner from '@/components/AdBanner';
import EpisodeList from '@/components/EpisodeList';
import ShareButton from '@/components/ShareButton';
import CommentList from '@/components/CommentList';
import AdultWarningModal from '@/components/AdultWarningModal';

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
    const bannerImage = anime.bannerImage || '';
    const shareImage = bannerImage || coverImage;
    const type = anime.type || 'Anime';

    const description = `${type} ${anime.title} sub indo. ${anime.nativeTitle ? anime.nativeTitle + '.' : ''} ${anime.synopsis ? anime.synopsis.slice(0, 120) + '...' : ''}`.replace(/\s+/g, ' ');

    const genreKeywords = Array.isArray(anime.genres) ? anime.genres.map(g => `anime ${g}`).join(',') : '';
    const keywords = [
        anime.title,
        anime.nativeTitle,
        anime.englishTitle,
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

    const isHentai = anime.genres?.some(g => (g || '').toLowerCase() === 'hentai') || anime.type?.toLowerCase() === 'hentai';

    return {
        title: `${anime.title}`,
        description,
        keywords,
        robots: isHentai
            ? { index: false, follow: true, noarchive: true, nosnippet: true }
            : { index: true, follow: true, noarchive: false },
        other: isHentai ? {
            rating: 'adult',
            'RTA-5042-1996-1400-1579-1604-10': 'adult',
        } : {},
        openGraph: {
            title: `${anime.title} - ${SITE_NAME}`,
            description,
            images: [
                bannerImage
                    ? { url: bannerImage, width: 1200, height: 450, alt: anime.title }
                    : { url: coverImage, width: 460, height: 650, alt: anime.title }
            ],
            type: 'video.tv_show',
            locale: 'id_ID',
            siteName: SITE_NAME,
            url: `${SITE_URL}/anime/${params.slug}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${anime.title} - ${SITE_NAME}`,
            description,
            images: [shareImage],
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

function cleanList(val) {
    if (!val) return '';
    return Array.from(new Set(val.split(',').map(s => s.trim()).filter(Boolean))).join(', ');
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
    const bannerImage = anime.bannerImage || '';
    const type = anime.type || '';
    const status = anime.status || '';
    const nativeTitle = anime.nativeTitle || '';
    const englishTitle = anime.englishTitle || '';
    const synopsis = anime.synopsis || '';
    const article = anime.article || '';
    const rating = anime.rating || 0;
    const genres = anime.tags || anime.genres || [];
    const airDate = anime.airDate || '';
    const producer = anime.producer || '';
    const studio = anime.studio || '';
    const duration = anime.duration || '';
    const totalEpisode = anime.totalEpisode || 0;
    const season = anime.season || '';
    const seasonYear = anime.seasonYear || '';

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

    const isAdult = genres?.some(g => (g || '').toLowerCase() === 'hentai') || type?.toLowerCase() === 'hentai';

    return (
        <div className="min-h-screen bg-surface-deep">
            {/* Adult 18+ Warning Modal */}
            <AdultWarningModal isAdult={isAdult} animeTitle={anime.title} />

            <Navbar />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <main className="pb-24">

                {/* ===== HERO BACKDROP BANNER HD ===== */}
                <div className="relative w-full overflow-hidden bg-surface-deep">
                    {/* Widescreen Banner Container */}
                    <div className={`relative w-full ${bannerImage ? 'h-[260px] sm:h-[320px] md:h-[400px] lg:h-[440px]' : 'h-[200px] sm:h-[240px] md:h-[280px]'}`}>
                        {(bannerImage || coverImage) && (
                            <Image
                                src={bannerImage || coverImage}
                                alt={anime.title}
                                fill
                                sizes="100vw"
                                priority
                                className={`w-full h-full ${bannerImage
                                        ? 'object-cover object-center brightness-95 contrast-105'
                                        : 'object-cover blur-3xl scale-125 opacity-30'
                                    }`}
                            />
                        )}

                        {/* Top Gradient for clean Navbar contrast */}
                        <div className="absolute inset-0 bg-gradient-to-b from-surface-deep/90 via-surface-deep/30 to-transparent h-32 pointer-events-none" />

                        {/* Bottom Gradient blending seamlessly into body */}
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-deep via-surface-deep/60 to-transparent pointer-events-none" />

                        {/* Side Vignette for cinematic widescreen focus */}
                        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-surface-deep/70 via-transparent to-surface-deep/70 pointer-events-none" />

                        {/* Subtle dark tint overlay */}
                        <div className="absolute inset-0 bg-black/15 pointer-events-none" />

                        {/* HD Banner Indicator Badge */}
                        {bannerImage && (
                            <div className="absolute top-20 right-4 sm:right-6 md:right-8 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-surface-deep/75 backdrop-blur-md text-primary-stitch border border-primary-stitch/30 shadow-lg tracking-wider uppercase">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                Banner HD
                            </div>
                        )}
                    </div>

                    {/* ===== HERO CONTENT OVERLAPPING BANNER ===== */}
                    <div className="relative z-10 max-w-5xl mx-auto px-4 -mt-24 sm:-mt-32 md:-mt-44 lg:-mt-52">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">

                            {/* Cover Poster with Backdrop Glow */}
                            <div className="flex-none flex justify-center md:justify-start">
                                <div className="relative group">
                                    {/* Ambient Glow behind Cover using Banner / Theme color */}
                                    <div className="absolute -inset-2 bg-gradient-to-tr from-primary-container/40 via-primary-stitch/30 to-amber-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                                    <div className="relative w-[170px] sm:w-[190px] md:w-[220px] h-[245px] sm:h-[275px] md:h-[320px] rounded-2xl overflow-hidden border-2 border-white/15 bg-surface-elevated shadow-2xl shadow-black/80 flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.02]">
                                        {coverImage ? (
                                            <Image
                                                src={coverImage}
                                                alt={anime.title}
                                                fill
                                                sizes="(max-width: 640px) 170px, (max-width: 768px) 190px, 220px"
                                                priority
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant text-xs">
                                                No Cover
                                            </div>
                                        )}

                                        {/* Bottom vignette on poster */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 min-w-0 flex flex-col pt-1 md:pt-14 text-center md:text-left">
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start items-center">
                                    {type && <TypeBadge type={type} />}
                                    {status && <StatusBadge status={status} />}
                                    {(season || seasonYear) && (
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border tracking-wider bg-surface-elevated/80 border-border-subtle/50 text-on-surface-variant backdrop-blur-sm">
                                            {[season, seasonYear].filter(Boolean).join(' ')}
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-on-surface leading-tight tracking-tight mb-2 drop-shadow-md">
                                    {anime.title}
                                </h1>

                                {/* Native Title & English Title */}
                                {(nativeTitle || englishTitle) && (
                                    <div className="text-sm md:text-base text-on-surface-variant font-medium mb-4 flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        {nativeTitle && <span className="italic">{nativeTitle}</span>}
                                        {nativeTitle && englishTitle && <span className="opacity-40">•</span>}
                                        {englishTitle && <span className="text-on-surface/85">{englishTitle}</span>}
                                    </div>
                                )}

                                {/* Stats Row */}
                                <div className="flex items-center justify-center md:justify-start gap-0 mb-5 bg-surface-elevated/90 backdrop-blur-md border border-border-subtle/50 rounded-xl w-fit mx-auto md:mx-0 shadow-lg">
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
                                    <InfoRow label="Studio" value={cleanList(studio)} />
                                    <InfoRow label="Produser" value={cleanList(producer)} />
                                    <InfoRow label="Durasi" value={duration} />
                                    <InfoRow label="Episode" value={totalEpisode > 0 ? String(totalEpisode) : (episodes.length > 0 ? String(episodes.length) : null)} />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                    {firstEpisode && (
                                        <Link
                                            href={`/episode/${anime.slug}/${firstEpisode.slug}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-elevated/90 backdrop-blur-sm border border-border-subtle/50 rounded-xl text-on-surface font-bold text-sm hover:bg-surface-variant hover:border-primary-stitch/40 transition-all shadow-sm"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                            Ep. Pertama
                                        </Link>
                                    )}
                                    {latestEpisode && (
                                        <Link
                                            href={`/episode/${anime.slug}/${latestEpisode.slug}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-container rounded-xl text-on-primary font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary-container/25"
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

                    <AdBanner slot="BEFORE_EPISODES" className="mt-6" />

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

                    {/* Recommendations (Hanya 6 Anime) */}
                    {recommendations.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-4 flex items-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary-stitch"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                Rekomendasi
                            </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {recommendations.slice(0, 6).map((rec) => (
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

                    {/* Comments Section */}
                    {/* <div className="mt-8 bg-surface-elevated/70 rounded-2xl border border-border-subtle/30 overflow-hidden p-4 md:p-6 shadow-sm">
                        <CommentList slug={anime.slug} />
                    </div> */}

                    <div className="h-6" />
                </div>
            </main>
        </div>
    );
}
