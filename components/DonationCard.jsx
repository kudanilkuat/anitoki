'use client';

import { useState } from 'react';

const SAWERIA_DONATE_URL = 'https://saweria.co/anitokiid';
const SAWERIA_LEADERBOARD_URL = '/api/saweria/leaderboard?streamKey=e366f437b572c237440efc22891d312f';

export default function DonationCard() {
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const refreshLeaderboard = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* ── CARD 1: DUKUNG & DONASI ────────────────────────────── */}
      <div className="bg-surface-elevated border border-border-subtle/30 rounded-2xl p-5 shadow-lg shadow-black/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0 shadow-inner">
              <span className="text-xl">☕</span>
            </div>
            <div>
              <h2 className="font-display text-base text-on-surface tracking-wider">DUKUNG & DONASI</h2>
              <p className="text-on-surface-variant text-xs">Bantu server tetap aktif & anime selalu update.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Saweria Official
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-on-surface-variant text-xs leading-relaxed">
            Semua tayangan anime di Anitoki dapat dinikmati secara gratis. Dukungan kalian melalui Saweria sangat membantu pembiayaan server, CDN, dan kelangsungan website ini.
          </p>

          {/* Tombol Utama Donasi via Saweria */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-on-surface text-sm font-bold flex items-center justify-center sm:justify-start gap-1.5">
                  <span>Saweria Anitoki</span>
                  <span className="text-yellow-400 font-normal text-xs">(@anitokiid)</span>
                </p>
                <p className="text-on-surface-variant text-[11px]">
                  Mendukung QRIS, GoPay, OVO, DANA, LinkAja, & ShopeePay
                </p>
              </div>

              <a
                href={SAWERIA_DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-gray-900 font-bold text-xs shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <span>☕</span>
                Donasi Sekarang di Saweria
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Catatan Sukarela */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container border border-border-subtle/40 rounded-xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary-stitch shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-on-surface-variant text-[11px]">
              Donasi bersifat sukarela. Setelah berdonasi, namamu akan otomatis muncul di papan peringkat donatur di bawah! 💖
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
