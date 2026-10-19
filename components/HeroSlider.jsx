'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HeroSlider({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  // We need to show prev, current, next.
  const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
  const nextIndex = (currentIndex + 1) % items.length;

  return (
    <div className="relative w-full overflow-hidden flex items-center justify-center gap-4 h-[250px] md:h-[400px]">

      {/* Prev Image */}
      <div
        className="hidden md:block w-1/5 h-full relative cursor-pointer group transition-opacity"
        onClick={handlePrev}
      >
        <img
          src={items[prevIndex]?.bannerImage || items[prevIndex]?.coverImage || items[prevIndex]?.thumb}
          alt={items[prevIndex]?.title}
          className="w-full h-full object-cover rounded-xl brightness-50 group-hover:brightness-75 transition-all"
        />
        {/* Panah Kiri */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white"><polyline points="15 18 9 12 15 6" /></svg>
          </div>
        </div>
      </div>

      {/* Center Image */}
      <div className="w-full md:w-3/5 h-full relative rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.6)] border border-border-subtle/40">
        <Link href={`/anime/${items[currentIndex]?.slug}`} className="block w-full h-full relative group">
          <img
            src={items[currentIndex]?.bannerImage || items[currentIndex]?.coverImage || items[currentIndex]?.thumb}
            alt={items[currentIndex]?.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none"></div>

          {/* Info overlay on Banner */}
          <div className="absolute bottom-6 left-4 right-4 md:bottom-8 md:left-6 md:right-6 z-10 text-left pointer-events-none">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {items[currentIndex]?.type && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary-container text-on-primary border border-primary-container/40">
                  {items[currentIndex].type}
                </span>
              )}
              {items[currentIndex]?.status && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-surface-bright/70 text-on-surface-variant border border-border-subtle/50">
                  {items[currentIndex].status}
                </span>
              )}
              {items[currentIndex]?.rating > 0 && (
                <span className="text-[11px] font-black text-amber-300 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-amber-400/30">
                  ★ {Number(items[currentIndex].rating).toFixed(1)}
                </span>
              )}
            </div>
            <h2 className="text-base md:text-2xl font-black text-white line-clamp-1 group-hover:text-primary-stitch transition-colors drop-shadow-md">
              {items[currentIndex]?.title}
            </h2>
          </div>
        </Link>

        {/* Pagination Dots */}
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all pointer-events-auto ${idx === currentIndex ? 'w-6 bg-primary-stitch' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </div>

      {/* Next Image */}
      <div
        className="hidden md:block w-1/5 h-full relative cursor-pointer group transition-opacity"
        onClick={handleNext}
      >
        <img
          src={items[nextIndex]?.bannerImage || items[nextIndex]?.coverImage || items[nextIndex]?.thumb}
          alt={items[nextIndex]?.title}
          className="w-full h-full object-cover rounded-xl brightness-50 group-hover:brightness-75 transition-all"
        />
        {/* Panah Kanan */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </div>
      </div>

    </div>
  );
}
