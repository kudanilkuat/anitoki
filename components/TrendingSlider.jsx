'use client';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

export default function TrendingSlider({ trending = [] }) {
  const sliderRef = useRef(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!trending?.length) return null;

  return (
    <div className="mb-10 w-full">
      <div className="flex items-end justify-between mb-6">
        <div className="border-l-4 border-status-pending pl-3">
          <h2 className="text-2xl font-black tracking-wide text-on-surface leading-none mb-1">Now Trending</h2>
          <p className="text-sm text-on-surface-variant font-medium leading-none">Most read today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={scrollLeft} className="w-8 h-8 rounded-full bg-surface-elevated hover:bg-surface-variant border border-border-subtle/40 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-on-surface-variant"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button onClick={scrollRight} className="w-8 h-8 rounded-full bg-surface-elevated hover:bg-surface-variant border border-border-subtle/40 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-on-surface-variant"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
      <div className="relative w-full">
        <div ref={sliderRef} className="flex gap-4 overflow-x-auto pb-4 pt-2" style={{ scrollbarWidth: 'none' }}>
          {trending.slice(0, 12).map((item, index) => {
            const coverImage = item?.coverImage || '';

            return (
              <Link
                key={item._id || item.slug}
                href={`/anime/${item?.slug}`}
                className="relative flex-none w-[180px] md:w-[220px] h-[260px] md:h-[310px] rounded-xl overflow-hidden group border border-border-subtle/30 hover:border-primary-stitch/30 hover:shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all duration-300 bg-surface-deep"
              >
                {coverImage && (
                  <Image
                    src={coverImage}
                    alt={item?.title || ''}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="220px"
                    unoptimized
                    priority={index < 5}
                  />
                )}

                {/* Gradient Bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-deep via-surface-deep/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                {/* Rank Badge */}
                <div className="absolute top-0 left-0 bg-surface-elevated border border-border-subtle/30 text-on-surface text-xs font-black px-3 py-1.5 rounded-br-xl shadow-lg z-10">
                  #{index + 1}
                </div>

                {/* Logo (top right) */}
                <div className="absolute top-2 right-2 flex items-center bg-primary-container/90 text-on-primary px-1.5 py-0.5 rounded shadow-lg z-10 scale-[0.6] origin-top-right">
                  <span className="font-black italic">{process.env.NEXT_PUBLIC_SITE_BRAND || 'KO'}</span>
                  <span className="text-[10px] font-bold ml-1 uppercase">{process.env.NEXT_PUBLIC_SITE_NAME || 'KOMIKPEDIA'}</span>
                </div>

                {/* Info Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                  <h2 className="font-bold text-on-surface text-sm line-clamp-2 leading-snug mb-2 group-hover:text-primary-stitch transition-colors">
                    {item?.title}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-medium">
                    <span>{(item?.views ? (item.views / 1000).toFixed(1) + 'K' : '440.8K')} Reads</span>
                    <span className="text-on-surface-variant/40">•</span>
                    <span className="text-on-surface font-bold flex items-center gap-1">
                      <FontAwesomeIcon icon={faStar} className="text-status-pending text-[10px]" />
                      {item?.rating > 0 ? item.rating.toFixed(1) : '9'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
