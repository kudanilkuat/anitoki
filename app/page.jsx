import { getHomeData } from '@/lib/api';
import Navbar from '@/components/Navbar';
import TrendingSlider from '@/components/TrendingSlider';
import NewestUpdatesTabs from '@/components/NewestUpdatesTabs';
import AdBanner from '@/components/AdBanner';
import HeroSlider from '@/components/HeroSlider';
import Image from 'next/image';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://komikcast.online';
const SITE_NAME_ENV = process.env.NEXT_PUBLIC_SITE_NAME || 'Komikcast';

export const metadata = {
  title: `${process.env.NEXT_PUBLIC_SITE_NAME} - Nonton Anime Subtitle Indonesia`,
  description: `Nonton anime sub indo terbaru terlengkap dengan kualitas 1080p 720p 480p 360p. Streaming anime online gratis di ${process.env.NEXT_PUBLIC_SITE_NAME || 'AnimeStream'}.`,
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function HomePage() {
  const res = await getHomeData();
  const data = res?.data || {};

  const { recents = [], trending = [], ongoing = [], completed = [] } = data;

  return (
    <div className="min-h-screen bg-surface-deep text-on-surface font-sans">
      <Navbar />
      <h1 className="sr-only">Nonton Anime Subtitle Indonesia - {process.env.NEXT_PUBLIC_SITE_NAME}</h1>

      <main className="pt-20 pb-safe max-w-[1200px] mx-auto px-4">
        <HeroSlider items={trending.slice(0, 5)} />

        {/* Top Links Bar (Social Media & Download App) */}
        <div className="flex overflow-x-auto snap-x scrollbar-hide gap-3 md:gap-4 pb-2 mb-8 mt-6">
          {/* <a href={process.env.NEXT_PUBLIC_TELEGRAM_URL || "#"} target="_blank" rel="noopener noreferrer" aria-label="Join Telegram" className="snap-start shrink-0 w-[140px] sm:w-[160px] md:flex-1 flex items-center justify-start gap-3 bg-[#111319] border border-white/5 hover:bg-[#1a1c23] px-4 md:px-5 py-3 rounded-xl text-xs md:text-sm font-bold text-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#229ED9] flex items-center justify-center text-white shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
            </div>
            Telegram
          </a>
          <a href={process.env.NEXT_PUBLIC_FACEBOOK_URL || "#"} target="_blank" rel="noopener noreferrer" aria-label="Join Facebook" className="snap-start shrink-0 w-[140px] sm:w-[160px] md:flex-1 flex items-center justify-start gap-3 bg-[#111319] border border-white/5 hover:bg-[#1a1c23] px-4 md:px-5 py-3 rounded-xl text-xs md:text-sm font-bold text-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </div>
            Facebook
          </a>
          <a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#"} target="_blank" rel="noopener noreferrer" aria-label="Follow Instagram" className="snap-start shrink-0 w-[140px] sm:w-[160px] md:flex-1 flex items-center justify-start gap-3 bg-[#111319] border border-white/5 hover:bg-[#1a1c23] px-4 md:px-5 py-3 rounded-xl text-xs md:text-sm font-bold text-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            </div>
            Instagram
          </a>
          <a href={process.env.NEXT_PUBLIC_THREADS_URL || "#"} target="_blank" rel="noopener noreferrer" aria-label="Follow Threads" className="snap-start shrink-0 w-[140px] sm:w-[160px] md:flex-1 flex items-center justify-start gap-3 bg-[#111319] border border-white/5 hover:bg-[#1a1c23] px-4 md:px-5 py-3 rounded-xl text-xs md:text-sm font-bold text-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-white shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18.5c-4.694 0-8.5-3.806-8.5-8.5S7.306 3.5 12 3.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5zm4.326-9.584a4.846 4.846 0 01-1.55 3.328 5.485 5.485 0 01-3.616 1.22c-2.865 0-4.832-1.92-4.832-4.632 0-2.716 1.967-4.632 4.832-4.632 2.831 0 4.798 1.865 4.798 4.496v.147h-7.666c.097 1.636 1.246 2.766 2.836 2.766 1.228 0 2.023-.624 2.38-1.517l1.818.824zm-2.868-2.616c-.055-1.428-1.047-2.52-2.73-2.52-1.636 0-2.673 1.085-2.766 2.52h5.496z" /></svg>
            </div>
            Threads
          </a> */}
        </div>

        <TrendingSlider trending={trending} />

        <AdBanner slot="HEADER_BANNER" className="my-4" />

        <NewestUpdatesTabs recents={recents} ongoing={ongoing} completed={completed} />

        <AdBanner slot="IN_CONTENT" className="my-6" />

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
      </main>
    </div>
  );
}
