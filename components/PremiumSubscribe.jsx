'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/context/AuthContext';
import { useCekStatus } from '@/hooks/useCekStatus';

const PACKAGES = [
  { id: '7days', title: 'Paket 7 Hari', rp: 'Rp 3.000', amount: 3000, days: 7, benefits: ['Akses Semua Konten', 'Tanpa Iklan'] },
  { id: '30days', title: 'Paket 30 Hari', rp: 'Rp 15.000', amount: 15000, days: 30, benefits: ['Akses Semua Konten', 'Tanpa Iklan', 'Badge Profil Khusus'] },
//  { id: '1year', title: 'Paket 1 Tahun', rp: 'Rp 50.000', amount: 50000, days: 365, benefits: ['Semua Benefit Sebelumnya', 'Background Profil Animasi'] },
  //{ id: 'lifetime', title: 'Paket Lifetime', rp: 'Rp 100.000', amount: 100000, days: 36500, benefits: ['Semua Benefit Sebelumnya', 'Permanen Seumur Hidup'] },
];



export default function PremiumSubscribe() {
  const { user } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[1]);
  const [step, setStep] = useState('select');
  const [orderId, setOrderId] = useState(null);
  const [qrImage, setQrImage] = useState(null);       // URL gambar QR dari WijayaPay
  const [qrisString, setQrisString] = useState(null); // fallback raw qr_string
  const [expiredAt, setExpiredAt] = useState(null);   // waktu expired QR
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const cekStatus = useCekStatus({
    userUid: user?.uid,
    onSuccess: () => {
      setMessage({ type: 'success', text: '✅ Pembayaran dikonfirmasi! Memuat ulang...' });
      setStep('done');
      setTimeout(() => window.location.reload(), 2000);
    },
    onNotYet: () => {
      setMessage({ type: 'info', text: 'Pembayaran belum terkonfirmasi. Tunggu beberapa menit lalu klik "Cek Status" lagi.' });
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err.message });
    },
  });

  if (!user) return null;

  const handleCreateOrder = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.uid}` },
        body: JSON.stringify({ package: selectedPkg.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal membuat order');
      setOrderId(json.data.orderId);
      setQrImage(json.data.qrImage || null);
      setQrisString(json.data.qrString || null);
      setExpiredAt(json.data.expiredAt || null);
      setStep('payment');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOrderId = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };



  return (
    <div className="bg-bg-card border border-border rounded-2xl p-5 mb-8">

      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="font-display text-xl text-white tracking-widest mb-1">
          UPGRADE <span className="text-accent-red">PREMIUM</span>
        </h2>
        <p className="text-text-muted text-xs">Akses semua fitur tanpa batas. Tanpa iklan &amp; benefit profil eksklusif.</p>
      </div>

      {/* === STEP: SELECT === */}
      {step === 'select' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${selectedPkg.id === pkg.id
                    ? 'bg-accent-red/10 border-accent-red shadow-[0_0_15px_rgba(229,57,53,0.2)]'
                    : 'bg-bg-elevated border-border hover:border-text-secondary'
                  }`}
              >
                {pkg.id === '1year' && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                    Paling Laris
                  </div>
                )}
                {pkg.id === 'lifetime' && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                    Terbaik
                  </div>
                )}
                <h3 className="text-white font-bold text-sm mb-1">{pkg.title}</h3>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-lg font-black text-white">{pkg.rp}</span>
                </div>
                <ul className="space-y-1 mb-3">
                  {pkg.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[10px] text-text-secondary">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-green-500 shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <div className={`w-full py-1.5 rounded-lg text-center text-[11px] font-bold transition-colors ${selectedPkg.id === pkg.id
                    ? 'bg-accent-red text-white'
                    : 'bg-bg-card text-text-secondary border border-border'
                  }`}>
                  {selectedPkg.id === pkg.id ? '✓ Terpilih' : 'Pilih'}
                </div>
              </div>
            ))}
          </div>

          {/* Checkout */}
          <div className="bg-bg-elevated rounded-xl p-4 text-center">
            {/* QRIS badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">QRIS</div>
              <span className="text-text-muted text-[11px]">Bayar via e-wallet / m-banking apapun</span>
            </div>
            <p className="text-text-muted text-[11px] mb-3">
              Total: <span className="text-white font-bold">{selectedPkg.rp}</span> untuk {selectedPkg.title}
            </p>
            <button
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-red text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Bayar via QRIS
                </>
              )}
            </button>
            {message && (
              <p className={`mt-3 text-[11px] ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message.text}
              </p>
            )}
          </div>
        </>
      )}

      {/* === STEP: PAYMENT (QRIS) === */}
      {step === 'payment' && orderId && (
        <div className="space-y-3">
          {/* Amount */}
          <div className="bg-bg-elevated rounded-xl p-3 text-center border border-accent-red/20">
            <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">Nominal yang harus dibayar</p>
            <p className="text-2xl font-black text-accent-red">{selectedPkg.rp}</p>
            <p className="text-text-muted text-[10px]">{selectedPkg.title}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center py-2 gap-2">
            <div className="relative bg-white rounded-2xl p-2.5 shadow-[0_0_25px_rgba(229,57,53,0.15)] border-2 border-accent-red/20">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt="QR Code QRIS"
                  width={200}
                  height={200}
                  style={{ display: 'block', borderRadius: '8px' }}
                />
              ) : qrisString ? (
                <QRCode
                  value={qrisString}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  style={{ display: 'block' }}
                />
              ) : (
                <img
                  src="/qris/qris.png"
                  alt="QR Code QRIS"
                  width={200}
                  height={200}
                  style={{ display: 'block', borderRadius: '8px' }}
                />
              )}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black px-3 py-0.5 rounded-full tracking-widest uppercase shadow">
                SCAN &amp; PAY
              </div>
            </div>
            {expiredAt && (
              <p className="text-text-muted text-[10px] mt-1">
                ⏱ Berlaku hingga:{' '}
                <span className="text-yellow-400 font-semibold">
                  {new Date(expiredAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
                </span>
              </p>
            )}
          </div>

          <div className="h-2" />

          {/* Order ID */}
          <div className="bg-bg-elevated rounded-xl p-3 border border-border">
            <p className="text-text-muted text-[10px] mb-1.5 text-center">Kode Order (simpan ini!):</p>
            <div className="flex items-center gap-2 bg-bg-primary rounded-lg px-3 py-2 border border-border">
              <span className="font-mono text-white text-xs font-bold tracking-wider flex-1 truncate">{orderId}</span>
              <button onClick={handleCopyOrderId} className="text-text-muted hover:text-white transition-colors shrink-0">
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-green-400"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-bg-elevated rounded-xl p-3 border border-border text-[10px] text-text-secondary space-y-1.5">
            <p className="font-bold text-white text-xs mb-1.5">📋 Cara Pembayaran:</p>
            {[
              `Scan QR di atas menggunakan GoPay, OVO, DANA, ShopeePay, atau m-banking manapun`,
              `Masukkan nominal ${selectedPkg.rp} — pastikan tepat`,
              `Selesaikan pembayaran di aplikasi kamu`,
              `Pembayaran otomatis terkonfirmasi dalam 1–2 menit`,
              `Klik "Cek Status" untuk memperbarui status premium kamu`,
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="bg-accent-red/20 text-accent-red font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0 text-[9px]">{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>


          {/* Buttons */}
          <button
            onClick={() => cekStatus.check(orderId)}
            disabled={cekStatus.isDisabled}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold disabled:opacity-50 transition-all hover:scale-[1.01]"
          >
            {cekStatus.loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>
                {cekStatus.buttonLabel('Cek Status Pembayaran')}
              </>
            )}
          </button>

          {message && (
            <div className={`text-center text-[11px] px-3 py-2 rounded-xl border ${message.type === 'success'
                ? 'text-green-400 bg-green-500/10 border-green-500/20'
                : message.type === 'info'
                  ? 'text-pink-300 bg-pink-500/10 border-pink-500/20'
                  : 'text-red-400 bg-red-500/10 border-red-500/20'
              }`}>
              {message.text}
            </div>
          )}

          <button
            onClick={() => { setStep('select'); setMessage(null); setOrderId(null); setQrImage(null); setQrisString(null); setExpiredAt(null); }}
            className="w-full text-center text-[11px] text-text-muted hover:text-white transition-colors py-1"
          >
            ← Ganti Paket
          </button>
        </div>
      )}

      {/* === STEP: DONE === */}
      {step === 'done' && (
        <div className="text-center py-6">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <div className="relative w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <p className="text-white font-bold text-sm mb-1">Premium Berhasil Diaktifkan! 🎉</p>
          <p className="text-text-muted text-[11px]">Halaman akan dimuat ulang...</p>
        </div>
      )}
    </div>
  );
}
