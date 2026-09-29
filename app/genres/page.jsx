import { getGenres } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

export const revalidate = 600;

export const metadata = {
  title: 'Daftar Kategori',
  description: `Jelajahi anime berdasarkan genre, tema, dan grafis. Temukan ratusan kategori menarik di ${process.env.NEXT_PUBLIC_SITE_NAME}.`,
};

function CategoryCard({ item, icon, colorClass, linkPrefix }) {
  return (
    <Link
      href={`/anime?${linkPrefix}=${encodeURIComponent(item.name)}`}
      className="group relative flex items-center gap-3 p-4 rounded-2xl bg-surface-elevated border border-border-subtle/30 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 hover:border-border-subtle"
    >
      {/* Glow Hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-r ${colorClass}`} />

      {/* Icon Wrapper */}
      <div className={`w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0 group-hover:bg-opacity-80 transition-colors`}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`font-bold text-on-surface capitalize text-sm truncate transition-colors`}>
          {item.name}
        </p>
        <p className="text-on-surface-variant text-[11px] mt-0.5 font-semibold">{item.count} judul</p>
      </div>

      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-on-surface-variant group-hover:text-on-surface ml-auto flex-shrink-0 transition-colors">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

export default async function GenresPage() {
  const res = await getGenres();
  const genres = res?.data?.genres || [];
  const themes = res?.data?.themes || [];
  const demographics = res?.data?.demographics || [];

  const isEmpty = genres.length === 0 && themes.length === 0 && demographics.length === 0;

  const renderSection = (title, data, icon, colorClass, linkPrefix) => {
    if (!data || data.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-lg md:text-xl text-on-surface tracking-widest">{title}</h2>
          <div className="flex-1 h-px bg-border-subtle/40"></div>
          <span className="text-on-surface-variant text-xs font-bold px-2 py-1 bg-surface-container rounded-full border border-border-subtle/40">{data.length} Kategori</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {data.map((item) => (
            <CategoryCard
              key={item.name}
              item={item}
              icon={icon}
              colorClass={colorClass}
              linkPrefix={linkPrefix}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-deep">
      <Navbar />

      <main className="pt-24 pb-safe max-w-6xl mx-auto px-4 md:px-6">

        {/* Header Hero */}
        <div className="py-4 md:py-6 mb-6 relative rounded-2xl overflow-hidden border border-border-subtle/30 bg-surface-elevated shadow-2xl shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container/10 via-purple-900/10 to-transparent pointer-events-none" />
          <div className="relative z-10 px-4 md:px-8 max-w-3xl">
            <h1 className="font-display text-lg md:text-xl text-on-surface tracking-widest leading-tight uppercase">
              EKSPLORASI <span className="text-primary-stitch">KATEGORI</span>
            </h1>
            <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">
              Jelajahi ribuan anime impianmu berdasarkan genre aksi, tema isekai yang seru, hingga gaya grafis yang sesuai seleramu.
            </p>
          </div>
        </div>

        <AdBanner slot="BROWSE_BANNER" className="mb-10" />

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
            <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center shadow-2xl shadow-black/50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-on-surface-variant">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <p className="font-display text-2xl text-on-surface-variant tracking-widest">BELUM ADA KATEGORI</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {renderSection(
              "GENRE UTAMA",
              genres,
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-primary-stitch"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
              "from-primary-container to-primary-stitch",
              "genre"
            )}

            {renderSection(
              "TEMA (THEMES)",
              themes,
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-purple-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
              "from-purple-500 to-indigo-600",
              "tema"
            )}

            {renderSection(
              "GRAFIS (DEMOGRAPHICS)",
              demographics,
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-400"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
              "from-orange-400 to-amber-600",
              "grafis"
            )}
          </div>
        )}

        <div className="h-10" />
      </main>
    </div>
  );
}
