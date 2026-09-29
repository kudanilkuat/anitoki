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
          src={items[prevIndex]?.coverImage || items[prevIndex]?.thumb}
          alt={items[prevIndex]?.title}
          className="w-full h-full object-cover rounded-xl brightness-50 group-hover:brightness-75 transition-all"
        />
        {/* Panah Kiri */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm border border-white/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white"><polyline points="15 18 9 12 15 6" /></svg>
          </div>
        </div>
      </div>

      {/* Center Image */}
      <div className="w-full md:w-3/5 h-full relative rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <Link href={`/anime/${items[currentIndex].slug}`} className="block w-full h-full relative group">
          <img
            src={items[currentIndex]?.coverImage || items[currentIndex]?.thumb}
            alt={items[currentIndex]?.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Overlay gradient at bottom for readability of pagination */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
        </Link>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all pointer-events-auto ${idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
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
          src={items[nextIndex]?.coverImage || items[nextIndex]?.thumb}
          alt={items[nextIndex]?.title}
          className="w-full h-full object-cover rounded-xl brightness-50 group-hover:brightness-75 transition-all"
        />
        {/* Panah Kanan */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm border border-white/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </div>
      </div>

    </div>
  );
}
