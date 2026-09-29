'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * QRModal
 * Menampilkan QR Code QRIS dan info order dalam modal overlay.
 * Digunakan di PendingOrdersBanner agar user tidak perlu redirect ke halaman premium.
 *
 * Props:
 *   order   — objek order { orderId, amount, label, days }
 *   onClose — fungsi untuk tutup modal
 */
export default function QRModal({ order, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(order.orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatRp = (amount) =>
    'Rp ' + Number(amount).toLocaleString('id-ID');

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-sm bg-bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.25s ease' }}
      >
        {/* Header */}
        <div className="bg-accent-red/10 border-b border-border px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest">QRIS</div>
            <span className="text-white font-bold text-sm">Pembayaran QRIS</span>
          </div>
          <p className="text-text-muted text-xs">Scan menggunakan GoPay · OVO · DANA · ShopeePay · m-banking</p>
        </div>

        {/* Tombol tutup */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-bg-elevated border border-border text-text-muted hover:text-white hover:border-border-hover transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="p-6 space-y-5">
          {/* Nominal */}
          <div className="bg-bg-elevated rounded-2xl p-4 text-center border border-accent-red/20">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">Nominal yang harus dibayar</p>
            <p className="text-3xl font-black text-accent-red">{formatRp(order.amount)}</p>
            <p className="text-text-muted text-xs mt-1">{order.label || 'Paket Premium'}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative bg-white rounded-2xl p-3 shadow-[0_0_30px_rgba(229,57,53,0.15)] border-2 border-accent-red/20">
              <Image
                src="/qris/qris.png"
                alt="QR Code QRIS Kiryuu"
                width={220}
                height={220}
                className="rounded-lg"
                priority
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-4 py-1 rounded-full tracking-widest uppercase shadow-md">
                SCAN &amp; PAY
              </div>
            </div>
          </div>

          <div className="h-2" />

          {/* Order ID */}
          <div className="space-y-1.5">
            <p className="text-text-muted text-[10px] uppercase tracking-widest">Kode Order</p>
            <div className="flex items-center gap-2 bg-bg-elevated rounded-xl px-3 py-2.5 border border-border">
              <span className="font-mono text-white text-xs flex-1 truncate">{order.orderId}</span>
              <button
                onClick={handleCopy}
                className="text-text-muted hover:text-white transition-colors shrink-0"
              >
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-green-400">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Langkah-langkah */}
          <div className="bg-bg-elevated rounded-xl p-3 border border-border text-[10px] text-text-secondary space-y-1.5">
            <p className="font-bold text-white text-[11px] mb-2">📋 Langkah Pembayaran:</p>
            {[
              `Scan QR di atas, bayar tepat ${formatRp(order.amount)}`,
              'Screenshot bukti pembayaran',
              'Upload bukti di bawah (atau kirim ke bot Telegram)',
              'Tunggu konfirmasi admin lalu klik "Aktifkan Premium"',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="bg-accent-red/20 text-accent-red font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0 text-[9px]">{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          {/* Tutup */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-border text-text-secondary hover:text-white hover:border-border-hover text-xs font-semibold transition-all"
          >
            Tutup
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
